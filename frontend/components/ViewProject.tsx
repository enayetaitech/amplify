"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "./ui/button";
import Search from "./Search";
import ProjectFilter from "./ProjectFilter";
import NoSearchResult from "./NoSearchResult";
import ProjectTable from "./ProjectTable";

interface Project {
  _id: string;
  // Add other project properties as needed
}

interface FilterValues {
  startDate: string;
  endDate: string;
  status: string;
  role: string;
  tag: string;
  [key: string]: string;
}

interface User {
  _id: string;
  role: string;
  // Add other user properties as needed
}

interface GlobalContextType {
  user: User | null;
}

const ViewProject = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useGlobalContext() as GlobalContextType;

  const fetchProjects = async (
    userId?: string,
    page = 1,
    searchQuery = "",
    filters: FilterValues = {}
  ) => {
    if (!userId) return;

    setLoading(true);
    try {
      const endpoint =
        user?.role === "SuperAdmin" ||
        user?.role === "AmplifyAdmin" ||
        user?.role === "AmplifyTechHost"
          ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/project/getAllProjectsForAmplify`
          : `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/get-all/project/${userId}`;

      const response = await axios.get(endpoint, {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          ...filters,
        },
      });

      setProjects(response.data.projects);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchProjects(user._id, page, searchTerm);
    }
  }, [user, page]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    fetchProjects(user?._id, 1, term);
  };

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
  };

  const handleRefresh = () => {
    fetchProjects(user?._id, page);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProjects(user?._id, newPage);
  };

  const handleFilter = (filters: FilterValues) => {
    setPage(1);
    fetchProjects(user?._id, 1, searchTerm, filters);
  };

  const handleCreateProject = () => {
    if (user?.role === "SuperAdmin" || user?.role === "AmplifyAdmin") {
      router.push("/dashboard/create-project-amplify-admin");
    } else {
      router.push("/dashboard/create-project");
    }
  };

  return (
    <div className="bg-gray-50 bg-opacity-90 h-full min-h-screen flex flex-col justify-center items-center">
      <div className="bg-white h-20 w-full border-b shadow-sm">
        <div className="bg-white py-5 border-b border-solid border-gray-200 w-full">
          <div className="md:px-10 flex justify-between items-center">
            {/* left div */}
            <div className="flex-grow text-center">
              <p className="text-2xl font-bold text-teal-600">
                Project Dashboard
              </p>
            </div>
            {/* right div */}
            <div className="flex justify-end items-center gap-2">
              {user?.role !== "AmplifyTechHost" &&
                user?.role !== "AmplifyModerator" && (
                  <>
                    <Button
                      variant="default"
                      onClick={handleCreateProject}
                      className="rounded-xl shadow-md hidden md:flex"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new Project
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleCreateProject}
                      className="rounded-xl p-2 shadow-md md:hidden block"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full bg-white">
        <div className="p-5 flex justify-start items-center">
          <Search onSearch={handleSearch} placeholder="Search project name" />
        </div>
        <ProjectFilter onFilter={handleFilter} />
      </div>

      <div className="flex-grow mx-auto w-full">
        {loading ? (
          <div className="text-center pt-20 font-bold text-5xl text-orange-500">
            Loading...
          </div>
        ) : projects && projects.length > 0 ? (
          <ProjectTable
            projects={projects}
            fetchProjects={fetchProjects}
            user={user}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <NoSearchResult />
        )}
      </div>
    </div>
  );
};

export default ViewProject;
