"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, RefreshCw, Pencil, KeyRound } from "lucide-react";
import { CreateUserDialog } from "./dialogs/CreateUserDialog";
import { toast } from "sonner";
import { EditUserDialog } from "./dialogs/EditUserDialog";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: string;
  status: "Active" | "Inactive";
};

export default function UsersTable() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q, companyName],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/users", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const resendInvite = useMutation({
    mutationFn: async (u: User) => {
      await api.post(`/api/v1/admin/users/${u._id}/resend-invite`, {
        userId: u._id,
      });
    },
    onSuccess: () => toast.success("Invite resent"),
    onError: (e: unknown) =>
      toast.error((e as { message?: string })?.message || "Failed to resend"),
  });

  const resetPassword = useMutation({
    mutationFn: async (u: User) => {
      await api.post(`/api/v1/users/forgot-password`, { email: u.email });
    },
    onSuccess: () => toast.success("Reset email sent"),
    onError: (e: unknown) =>
      toast.error(
        (e as { message?: string })?.message || "Failed to send reset"
      ),
  });

  // Fetch current user to gate Create button for SuperAdmin/AmplifyAdmin only
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data?.data as { user?: { role?: string } };
    },
  });
  const canCreate = ["SuperAdmin", "AmplifyAdmin"].includes(
    (meData?.user?.role || "").toString()
  );

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
        {canCreate && (
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create user
          </Button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : (data?.items || []).length === 0 ? (
              <tr>
                <td className="p-4" colSpan={6}>
                  No users found
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
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="p-2">
                    <Switch
                      checked={u.status === "Active"}
                      onCheckedChange={() => toggleStatus.mutate(u)}
                    />
                  </td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditUser(u)}
                      title="Edit profile"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => resendInvite.mutate(u)}
                      title="Resend invite"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => resetPassword.mutate(u)}
                      title="Send reset password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateUserDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
      />
      {editUser && (
        <EditUserDialog
          user={editUser}
          onOpenChange={(o) => !o && setEditUser(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
        />
      )}
    </div>
  );
}
