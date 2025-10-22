"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: string;
  status: "Active" | "Inactive";
};

export default function ExternalAdminsTable() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["external-admins", q, companyName],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/external-admins", {
        params: { q, companyName },
      });
      return res.data?.data as { items: User[] };
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (u: User) => {
      await api.patch(`/api/v1/admin/users/${u._id}/status`, {
        status: u.status === "Active" ? "Inactive" : "Active",
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["external-admins"] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { message?: string })?.message || "Failed to update status"
      ),
  });

  const transferMut = useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/admin/external-admins/transfer-projects", {
        fromAdminId: fromId,
        toAdminId: toId,
      });
    },
    onSuccess: () => {
      toast.success("Projects transferred");
      setTransferOpen(false);
      setFromId("");
      setToId("");
      qc.invalidateQueries({ queryKey: ["external-admins"] });
    },
    onError: (e: unknown) =>
      toast.error((e as { message?: string })?.message || "Transfer failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/external-admins/${id}`);
    },
    onSuccess: () => {
      toast.success("External admin deleted");
      qc.invalidateQueries({ queryKey: ["external-admins"] });
    },
    onError: (e: unknown) =>
      toast.error((e as { message?: string })?.message || "Delete failed"),
  });

  // Fetch current user to gate SuperAdmin-only actions
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data?.data as { user?: { role?: string } };
    },
  });
  const isSuper = (meData?.user?.role || "") === "SuperAdmin";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : (data?.items || []).length === 0 ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  No external admins found
                </td>
              </tr>
            ) : (
              data!.items.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.companyName}</td>
                  <td className="p-2">
                    <Badge variant="secondary">{u.status}</Badge>
                  </td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus.mutate(u)}
                    >
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                    {isSuper && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setFromId(u._id);
                            setTransferOpen(true);
                          }}
                        >
                          Transfer Projects
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete External Admin?
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <p className="text-sm text-muted-foreground">
                              You can only delete after transferring all
                              projects.
                            </p>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMut.mutate(u._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Projects</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>From Admin ID</Label>
              <Input
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              />
            </div>
            <div>
              <Label>To External Admin</Label>
              <select
                className="border rounded-md h-9 px-2 w-full"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">Select external admin…</option>
                {(data?.items || [])
                  .filter((u) => u._id !== fromId)
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName} — {u.email}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => transferMut.mutate()}
                disabled={!fromId || !toId || transferMut.isPending}
              >
                Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
