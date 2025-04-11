"use client"
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from 'components/ui/button';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from 'context/GlobalContext';



const Projects: React.FC = () => {
 const { user } = useGlobalContext()

 const userId = user?._id;

  // If no user exists, you might choose to render a message or redirect
  if (!userId) {
    return <p>User not found or not authenticated.</p>;
  }

  const { data, error, isLoading } = useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      // Adjust the endpoint as necessary.
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/get-project-by-userId/${userId}`);
      console.log(response.data)
      return response.data;
    },
  });

  useEffect(() => {
    console.log('Fetched projects:', data);
  }, [data]);

  if (isLoading) {
    return <p>Loading projects...</p>;
  }

  if (error) {
    console.error('Error fetching projects:', error);
    return <p>Error loading projects.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
  
      
      {/* Using Next.js Link with shadcn UI's Button to redirect to the create-project page */}
      <Link href="/create-project" passHref>
        <Button className="mt-6">
          Create New Project
        </Button>
      </Link>
    </div>
  );
};

export default Projects;
