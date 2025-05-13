import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Define TypeScript interfaces
interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Role {
  role: string[];
}

interface Member {
  _id: string;
  userId: User;
  roles: Role;
}

interface Project {
  _id: string;
  members: Member[];
  // Add other project properties as needed
}

interface MemberBulkUpdateProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  setLocalProjectState: (project: Project) => void;
}

const MemberBulkUpdate: React.FC<MemberBulkUpdateProps> = ({
  open,
  onClose,
  project,
  setLocalProjectState,
}) => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (project && project.members) {
      setMembers(project.members);
    }
  }, [project]);

  // Handle role toggle
  const handleRoleChange = (personId: string, role: string) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) => {
        if (member?.userId._id === personId) {
          const currentRoles = member.roles?.role || [];
          const hasRole = currentRoles.includes(role);

          return {
            ...member,
            roles: {
              ...member.roles,
              role: hasRole
                ? currentRoles.filter((r) => r !== role)
                : [...currentRoles, role],
            },
          };
        }
        return member;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/project/updateBulkMembers`,
        {
          projectId: project._id,
          members: members,
        }
      );

      if (response.status === 200) {
        toast.success(response.data.message);
        setLocalProjectState(response.data.updatedProject);
        onClose();
      }
    } catch (error) {
      console.error("Error updating members:", error);
      toast.error("Failed to update members");
    }
  };

  const roleTypes = ["Admin", "Moderator", "Observer"];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Bulk Update Members
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {roleTypes.map((role) => (
                  <TableHead key={role} className="text-center">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member?._id}>
                  <TableCell>
                    {member?.userId?.firstName} {member?.userId?.lastName}
                  </TableCell>
                  {roleTypes.map((role) => (
                    <TableCell key={role} className="text-center">
                      <Checkbox
                        id={`${member._id}-${role}`}
                        checked={member?.roles?.role?.includes(role) || false}
                        onCheckedChange={() =>
                          handleRoleChange(member.userId._id, role)
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberBulkUpdate;
