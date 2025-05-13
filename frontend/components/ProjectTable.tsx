"use client";

import React, { useState, useEffect, useRef } from "react";
import { BsFillEnvelopeAtFill, BsThreeDotsVertical } from "react-icons/bs";
import { FaShareAlt, FaTrash, FaUser } from "react-icons/fa";
import axios from "axios";
import { useDashboard } from "context/DashboardContext";
import { Card, CardContent } from "components/ui/card";
// Shadcn imports
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";

// import ViewProject from "./ViewProject";

import AssignTagModal from "./AssignTagModal";
import ShareProjectModal from "./ShareProjectModal";

// Define TypeScript interfaces
interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface Person {
  userId: string;
  role: string;
}

interface Project {
  _id: string;
  name: string;
  status: "Draft" | "Closed" | "Active" | "Complete" | "Inactive" | "Paused";
  tags: Tag[];
  createdBy: string;
  people?: Person[];
  startDate: string;
  startTime: string;
  cumulativeMinutes: number;
}

interface User {
  _id: string;
  role?: string;
}

interface ProjectTableProps {
  projects: Project[];
  fetchProjects: () => void;
  user: User;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  fetchProjects,
  user,
  page,
  totalPages,
  onPageChange,
}) => {
  const { viewProject, setViewProject } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isShareProjectModalOpen, setIsShareProjectModalOpen] =
    useState<boolean>(false);
  const [isAssignTagModalOpen, setIsAssignTagModalOpen] =
    useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const getRole = (project: Project): string => {
    if (project.createdBy === user?._id) {
      return "Admin";
    } else {
      const person = project?.people?.find((p) => p.userId === user?._id);
      return person ? person.role : "No Role";
    }
  };

  const renderStatus = (status: Project["status"]) => {
    const statusStyles = {
      Draft: "bg-teal-500 text-white",
      Closed: "bg-gray-400 text-white",
      Active: "bg-blue-500 text-white",
      Complete: "bg-red-500 text-white",
      Inactive: "bg-gray-800 text-white",
      Paused: "bg-yellow-500 text-white",
    };

    return (
      <div className="flex justify-center">
        <span
          className={`w-16 text-[12px] text-center py-1 rounded-full ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>
    );
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/delete/project/${project._id}`
      );
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setShowDeleteConfirmation(false);
      setProjectToDelete(null);
    }
  };

  const initiateDelete = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirmation(true);
    closeModal();
  };

  const getButtonVariant = (status: Project["status"]) => {
    const actionVariants: Record<
      Project["status"],
      { label: string; variant: string }
    > = {
      Draft: { label: "Edit", variant: "outline" },
      Active: { label: "Continue", variant: "default" },
      Complete: { label: "Close", variant: "secondary" },
      Inactive: { label: "Reactivate", variant: "secondary" },
      Closed: { label: "Archive", variant: "destructive" },
      Paused: { label: "Resume", variant: "secondary" },
    };

    return actionVariants[status] || { label: "Action", variant: "secondary" };
  };

  const handleAction = (status: Project["status"], project: Project) => {
    switch (status) {
      case "Draft":
        break;
      case "Active":
        break;
      case "Complete":
        break;
      case "Inactive":
        break;
      case "Closed":
        break;
      case "Paused":
        break;
      default:
    }
  };

  const handleShareProject = (project: Project) => {
    setSelectedProject(project);
    setIsShareProjectModalOpen(true);
    closeModal();
  };

  const handleAssignTag = (project: Project) => {
    setSelectedProject(project);
    setIsAssignTagModalOpen(true);
    closeModal();
  };

  const handleView = (project: Project) => {
    setSelectedProject(project);
    setViewProject(true);
    closeModal();
  };

  const closeViewProject = () => {
    setViewProject(false);
    setSelectedProject(null);
  };

  const toggleModal = (
    event: React.MouseEvent<SVGElement>,
    project: Project
  ) => {
    const { top, left } = event.currentTarget.getBoundingClientRect();
    setModalPosition({ top, left });
    setSelectedProject(project);
    setIsModalOpen(!isModalOpen);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      closeModal();
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const getContrastColor = (bgColor: string): string => {
    // Remove the "#" if it exists
    const color = bgColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds and black for light backgrounds
    return luminance < 0.5 ? "#FFFFFF" : "#000000";
  };

  // Custom Pagination component using shadcn's Pagination
  const CustomPagination = () => {
    const getPageNumbers = () => {
      let pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        // Show all pages if there are less than or equal to maxVisiblePages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page, last page, current page, and pages around current
        if (page <= 3) {
          // Near the start
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push(-1); // Ellipsis
          pages.push(totalPages);
        } else if (page >= totalPages - 2) {
          // Near the end
          pages.push(1);
          pages.push(-1); // Ellipsis
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          // Middle
          pages.push(1);
          pages.push(-1); // Ellipsis
          pages.push(page - 1);
          pages.push(page);
          pages.push(page + 1);
          pages.push(-1); // Ellipsis
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className={
                page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum, index) =>
            pageNum === -1 ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className={
                page === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="overflow-hidden">
      {!viewProject ? (
        <div className="min-w-full overflow-x-auto p-3 md:p-8 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead>Project Name</TableHead>
                <TableHead>Tags</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Role</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Cumulative Minutes Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell className="font-medium">{project.name}</TableCell>

                  {/* Display Tags */}
                  <TableCell>
                    {project.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <span
                            key={tag._id}
                            style={{
                              backgroundColor: tag.color,
                              color: getContrastColor(tag.color),
                            }}
                            className="text-[10px] px-2 py-1 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No Tags</span>
                    )}
                  </TableCell>

                  {/* Display Status */}
                  {/* <TableCell>{renderStatus(project.status)}</TableCell> */}

                  {/* Display Roles */}
                  <TableCell>{getRole(project)}</TableCell>

                  {/* Display Start Date and Time */}
                  <TableCell>
                    {new Date(project.startDate).toLocaleDateString()}{" "}
                    {project.startTime}
                  </TableCell>

                  <TableCell>{project.cumulativeMinutes}</TableCell>

                  <TableCell className="flex justify-between items-center gap-2 relative">
                    <Button
                      variant={
                        getButtonVariant(project.status).variant as
                          | "outline"
                          | "default"
                          | "secondary"
                          | "destructive"
                      }
                      className="w-20 text-center text-[12px] rounded-xl py-1"
                      onClick={() => handleAction(project.status, project)}
                    >
                      {getButtonVariant(project.status).label}
                    </Button>
                    <BsThreeDotsVertical
                      onClick={(e) => toggleModal(e, project)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {projects.length !== 0 && (
            <div className="flex justify-end py-3">
              <CustomPagination />
            </div>
          )}
        </div>
      ) : (
        // Comment out ViewProject component - replaced with placeholder
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Project Details: {selectedProject?.name}
            </h2>
            <Button variant="outline" onClick={closeViewProject}>
              Back to Projects
            </Button>
          </div>

          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Project Name:</span>{" "}
              {selectedProject?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Description:</span>{" "}
              {selectedProject?.description || "N/A"}
            </div>
            <div>
              <span className="font-medium">Fieldwork Start Date:</span>{" "}
              {selectedProject?.startDate
                ? new Date(selectedProject.startDate).toLocaleDateString()
                : "N/A"}
            </div>
            <div>
              <span className="font-medium">Passcode:</span>{" "}
              {selectedProject?.projectPasscode || "N/A"}
            </div>
            <div>
              <span className="font-medium">Project Status:</span>{" "}
              {selectedProject?.status || "N/A"}
            </div>
            <div>
              <span className="font-medium">Cumulative Minutes:</span>{" "}
              {selectedProject?.cumulativeMinutes || 0}
            </div>
            <div>
              <span className="font-medium">Meeting Link:</span>{" "}
              {selectedProject?.meetings?.[0]?.link || "No meetings available"}
            </div>
          </CardContent>
        </Card>

        /* 
        <ViewProject
          project={selectedProject}
          onClose={closeViewProject}
          user={user}
          fetchProjects={fetchProjects}
        />
        */
      )}

      {/* Action Menu Modal */}
      {isModalOpen && (
        <div
          ref={modalRef}
          className="absolute bg-white shadow-md rounded-lg z-50"
          style={{
            top: modalPosition.top + 20,
            left: modalPosition.left - 100,
          }}
        >
          <ul className="text-[12px]">
            <li
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer text-gray-700 flex justify-start items-center gap-2"
              onClick={() => handleView(selectedProject!)}
            >
              <FaUser />
              <span>View</span>
            </li>

            <li
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer text-gray-700 flex justify-start items-center gap-2"
              onClick={() => handleShareProject(selectedProject!)}
            >
              <FaShareAlt />
              <span>Share</span>
            </li>
            <li
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer text-gray-700 flex justify-start items-center gap-2"
              onClick={() => handleAssignTag(selectedProject!)}
            >
              <BsFillEnvelopeAtFill />
              <span>Assign Tag</span>
            </li>
            {(user?.role === "SuperAdmin" || user?.role === "AmplifyAdmin") && (
              <li
                className="py-2 px-4 hover:bg-gray-100 cursor-pointer text-gray-700 flex justify-start items-center gap-2"
                onClick={() => initiateDelete(selectedProject!)}
              >
                <FaTrash />
                <span>Delete</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* AssignTag Modal */}
      {isAssignTagModalOpen && selectedProject && (
        <AssignTagModal
          userId={user._id}
          project={selectedProject}
          onClose={() => setIsAssignTagModalOpen(false)}
          fetchProjects={fetchProjects}
          page={page}
        />
      )}

      {/* ShareProject Modal */}
      {isShareProjectModalOpen && selectedProject && (
        <ShareProjectModal
          project={selectedProject}
          onClose={() => setIsShareProjectModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                projectToDelete && handleDeleteProject(projectToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectTable;
