"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAdminUserSchema } from "@/schemas/admin";
import { z } from "zod";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCountryList } from "@/hooks/useCountryList";
import CountrySelector from "@/components/createAccount/countrySelector";

const allRoles = [
  "AmplifyAdmin",
  "AmplifyModerator",
  "AmplifyObserver",
  "AmplifyParticipant",
  "AmplifyTechHost",
  "Moderator",
  "Observer",
  "Participant",
  "Admin",
] as const;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
};

export function CreateUserDialog({ open, onOpenChange, onCreated }: Props) {
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data?.data as { user?: { role?: string } };
    },
  });
  const actorRole = (meData?.user?.role || "").toString();
  const roles =
    actorRole === "AmplifyAdmin"
      ? allRoles.filter((r) => r !== "AmplifyAdmin")
      : allRoles;
  const form = useForm<z.infer<typeof CreateAdminUserSchema>>({
    resolver: zodResolver(CreateAdminUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      role: "AmplifyModerator",
    },
  });

  const {
    countries,
    isLoading: countriesLoading,
    selectedCountry,
    setSelectedCountry,
  } = useCountryList();

  const createMut = useMutation({
    mutationFn: async (values: z.infer<typeof CreateAdminUserSchema>) => {
      const digitsOnly = (values.phoneNumber || "").replace(/[^0-9]/g, "");
      const fullPhoneNumber = selectedCountry
        ? `+${selectedCountry.code}${digitsOnly}`
        : digitsOnly;
      await api.post("/api/v1/admin/users", {
        ...values,
        phoneNumber: fullPhoneNumber,
      });
    },
    onSuccess: () => {
      form.reset();
      setSelectedCountry(null);
      onOpenChange(false);
      onCreated();
      toast.success("User created and invite sent");
    },
    onError: (e: unknown) => {
      toast.error(
        (e as { message?: string })?.message || "Failed to create user"
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First name</Label>
              <Input {...form.register("firstName")} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input {...form.register("lastName")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex gap-0.5">
                <CountrySelector
                  countries={countries}
                  isLoading={countriesLoading}
                  selectedCountry={selectedCountry}
                  onSelect={setSelectedCountry}
                />
                <Input
                  placeholder="Enter your phone number"
                  {...form.register("phoneNumber")}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    form.setValue("phoneNumber", value);
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Input {...form.register("companyName")} />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="border rounded-md h-9 px-2 w-full"
                {...form.register("role")}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              Create & Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
