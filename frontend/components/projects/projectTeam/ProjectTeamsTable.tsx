import { IModerator } from "@shared/interface/ModeratorInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import CustomButton from "components/shared/CustomButton";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "components/ui/table";
import { Pencil, ChevronsUpDown } from "lucide-react";
import React, { useState } from "react";
import EditModeratorModal from "./EditModeratorModal";

export interface ProjectTeamsTableProps {
  moderators: IModerator[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
  sortBy: "lastName";
  sortOrder: "asc" | "desc";
  onSortChange: (field: "lastName", order: "asc" | "desc") => void;
}

const ProjectTeamsTable: React.FC<ProjectTeamsTableProps> = ({
  moderators,
  meta,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModerator, setActiveModerator] = useState<IModerator | null>(
    null
  );

  const openModal = (mod: IModerator) => {
    setActiveModerator(mod);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveModerator(null);
  };

  const handleHeaderClick = (field: "lastName"): void => {
    const nextOrder: "asc" | "desc" =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, nextOrder);
  };

  // Helper to sort roles in consistent order: Admin, Moderator, Observer
  const formatRoles = (roles: string[] | undefined): string => {
    if (!roles || roles.length === 0) return "";

    const roleOrder = ["Admin", "Moderator", "Observer"];
    const sorted = [...roles].sort((a, b) => {
      const indexA = roleOrder.indexOf(a);
      const indexB = roleOrder.indexOf(b);
      return indexA - indexB;
    });

    return sorted.join(", ");
  };

  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="">
              <TableHead className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider">
                <button
                  type="button"
                  className="inline-flex items-center space-x-1 cursor-pointer"
                  onClick={() => handleHeaderClick("lastName")}
                >
                  <span>Member Name</span>
                  <ChevronsUpDown
                    className={
                      "h-4 w-4 " +
                      (sortBy === "lastName"
                        ? "text-custom-dark-blue-1"
                        : "text-gray-400")
                    }
                  />
                </button>
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider">
                <div className="inline-flex items-center space-x-1">
                  <span>Role</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider">
                <div className="inline-flex items-center space-x-1">
                  <span>Activity Log</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider">
                <div className="inline-flex items-center space-x-1">
                  <span>Actions</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100 text-left">
            {moderators.map((m) => {
              const rowClass = m.isActive
                ? "cursor-pointer hover:bg-gray-50"
                : "bg-gray-100 text-gray-400";
              return (
                <TableRow key={m._id} className={`${rowClass}`}>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {m.lastName}, {m.firstName}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 ">
                    {m.roles?.length ? (
                      formatRoles(m.roles)
                    ) : (
                      <span className="text-gray-400">No role assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {/*activity log*/}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    <CustomButton
                      icon={<Pencil />}
                      onClick={() => openModal(m)}
                      className=" bg-custom-orange-1 text-white hover:bg-custom-orange-2 font-semibold px-2"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="px-6 bg-white">
                <div className="flex justify-center">
                  <CustomPagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <EditModeratorModal
        open={isModalOpen}
        moderator={activeModerator}
        onClose={closeModal}
      />
    </div>
  );
};

export default ProjectTeamsTable;
