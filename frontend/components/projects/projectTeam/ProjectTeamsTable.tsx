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
import {  Pencil } from "lucide-react";
import React, { useState } from "react";
import EditModeratorModal from "./EditModeratorModal";

export interface ProjectTeamsTableProps {
  moderators: IModerator[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;
}

const ProjectTeamsTable: React.FC<ProjectTeamsTableProps> = ({
  moderators,
  meta,
  onPageChange,
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

  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="">
              {["Member Name", "Role", "Activity Log", "Actions"].map((col) => (
                <TableHead
                  key={col}
                  className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider"
                >
                  <div className="inline-flex items-center space-x-1">
                    <span>{col}</span>
                    {/* <ChevronsUpDown className="h-4 w-4 text-gray-400" /> */}
                  </div>
                </TableHead>
              ))}
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-gray-100 text-left">
            {moderators.map((m) => (
              <TableRow key={m._id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {m.firstName} {m.lastName}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                  {m.roles?.length ? (
                    m.roles.join(", ")
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
            ))}
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
