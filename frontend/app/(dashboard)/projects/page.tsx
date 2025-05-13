"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { IProject } from "@shared/interface/ProjectInterface";
import axios from "axios";
import NoSearchResult from "components/NoSearchResult";
import ProjectTable from "components/ProjectTable";

const Projects: React.FC = () => {
  const { user } = useGlobalContext();

  const userId = user?._id;

  const {
    data: projects,
    error,
    isLoading,
  } = useQuery<IProject[]>({
    queryKey: ["projects", userId],
    queryFn: async () => {
      // Adjust the endpoint as necessary.
      const response = await api.get(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/get-project-by-userId/${userId}`
      );

      return response.data.data;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  useEffect(() => {
    console.log("Fetched projects:", projects);
  }, [projects]);

  // If no user exists, you might choose to render a message or redirect
  if (!userId) {
    return <p>User not found or not authenticated.</p>;
  }

  // if (isLoading) {
  //   return <p>Loading projects...</p>;
  // }

  if (error) {
    let message: string;
    if (axios.isAxiosError(error)) {
      // server error shape: { success: false, message: string }
      message = error.response?.data?.message ?? error.message;
    } else {
      // fallback for non-Axios errors
      message = (error as Error).message || "Unknown error";
    }
    return (
      <p className="p-6 text-red-600">Error loading projects: {message}</p>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Projects Dashboard</h1>

        <div className="mt-6">
          <Link href="/create-project" passHref>
            <Button>Create New Project</Button>
          </Link>
        </div>
      </div>

      <div className="flex-grow mx-auto w-full">
        {projects && projects.length > 0 ? (
          <ProjectTable projects={projects} user={user} />
        ) : (
          <NoSearchResult />
        )}
      </div>
      {/* {projects && projects.length > 0 ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project._id} className="border-b pb-2">
              <Link
                href={`/projects/${project._id}`}
                className="text-blue-600 hover:underline"
              >
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects found.</p>
      )} */}
    </div>
  );
};

export default Projects;
