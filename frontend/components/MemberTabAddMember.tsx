import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useGlobalContext } from "context/GlobalContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Checkbox } from "components/ui/checkbox";
import { Copy, Mail } from "lucide-react";

// TypeScript interfaces
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface Person {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isUser: boolean;
}

interface Member {
  userId: {
    _id: string;
  };
}

interface Project {
  _id: string;
  members: Member[];
}

interface SelectedRoles {
  [key: string]: string[];
}

interface MemberTabAddMemberProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  userId: string;
  setLocalProjectState: (project: Project) => void;
}

const MemberTabAddMember: React.FC<MemberTabAddMemberProps> = ({
  open,
  onClose,
  project,
  userId,
  setLocalProjectState,
}) => {
  const [peoples, setPeoples] = useState<Person[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<SelectedRoles>({});
  const { user } = useGlobalContext() as { user: User };
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // const fetchContacts = async () => {
  //   try {
  //     const apiEndpoint =
  //       user?.role === "SuperAdmin" || user?.role === "AmplifyAdmin"
  //         ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/users/getAllAmplifyAdminsByAdminId`
  //         : `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/create/contact-from-member-tab/${userId}/${project?._id}`;

  //     const response = await axios.get(apiEndpoint, { withCredentials: true });
  //     setPeoples(response.data);
  //   } catch (error) {
  //     console.error("Error fetching contacts:", error);
  //     toast.error("Failed to fetch contacts");
  //   }
  // };

  // useEffect(() => {
  //   if (open) {
  //     fetchContacts();
  //   }
  // }, [open, userId, project?._id, ]);

  useEffect(() => {
    if (!open) return;

    // define it here so it's not recreated every render
    const fetchContacts = async () => {
      try {
        const apiEndpoint =
          user?.role === "SuperAdmin" || user?.role === "AmplifyAdmin"
            ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/users/getAllAmplifyAdminsByAdminId`
            : `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/create/contact-from-member-tab/${userId}/${project?._id}`;

        const response = await axios.get(apiEndpoint, { withCredentials: true });
        setPeoples(response.data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to fetch contacts");
      }
    };

    fetchContacts();
  }, [open, user?.role, userId, project?._id]);

  // Filter out existing members
  const existingMemberIds = new Set(
    project?.members?.map((member) => member?.userId?._id)
  );

  const newPeoples = peoples.filter(
    (person) => !existingMemberIds.has(person._id)
  );

  // Handle checkbox toggle for role selection
  const handleRoleChange = (personId: string, role: string) => {
    setSelectedRoles((prevRoles) => {
      const rolesForPerson = prevRoles[personId] || [];
      if (rolesForPerson.includes(role)) {
        // Remove role if it is already selected
        return {
          ...prevRoles,
          [personId]: rolesForPerson.filter((r) => r !== role),
        };
      } else {
        // Add the role to the person's roles
        return {
          ...prevRoles,
          [personId]: [...rolesForPerson, role],
        };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const selectedPeople = newPeoples
        .filter(
          (person) =>
            selectedRoles[person._id] && selectedRoles[person._id].length > 0
        )
        .map((person) => ({
          personId: person._id,
          roles: selectedRoles[person._id],
        }));

      if (selectedPeople.length === 0) {
        toast.warning("Please select at least one person with a role");
        setIsLoading(false);
        return;
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/app-people-to-project`,
        {
          projectId: project._id,
          people: selectedPeople,
        }
      );

      if (response.status === 200) {
        setLocalProjectState(response.data.updatedProject);
        toast.success("Members added successfully");
        onClose();
      }
    } catch (error) {
      console.error("Error adding people:", error);
      toast.error("Failed to add members");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to copy the registration link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/register`
    );
    toast.success("Link copied to clipboard!");
  };

  const handleSendEmail = async (person: Person) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/send-email-to-new-contact`,
        person,
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const roleTypes = ["Admin", "Moderator", "Observer"];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add New Contact
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Name</TableHead>
                {roleTypes.map((role) => (
                  <TableHead key={role} className="text-center">
                    {role}
                  </TableHead>
                ))}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newPeoples.length > 0 ? (
                newPeoples.map((person) => (
                  <TableRow key={person._id}>
                    <TableCell className="font-medium">
                      <div>
                        {person.firstName} {person.lastName}
                      </div>
                      {!person.isUser && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {person.email}
                        </div>
                      )}
                    </TableCell>

                    {roleTypes.map((role) => (
                      <TableCell key={role} className="text-center">
                        <Checkbox
                          id={`${person._id}-${role}`}
                          checked={
                            selectedRoles[person._id]?.includes(role) || false
                          }
                          onCheckedChange={() =>
                            handleRoleChange(person._id, role)
                          }
                          disabled={!person.isUser}
                          className="mx-auto"
                        />
                      </TableCell>
                    ))}

                    <TableCell className="text-center">
                      {!person.isUser && (
                        <div className="flex flex-col gap-2 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="w-full"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(person)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No new contacts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add People"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberTabAddMember;
