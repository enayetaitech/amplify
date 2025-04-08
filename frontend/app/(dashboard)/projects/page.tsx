import React from 'react';
import Link from 'next/link';
import { Button } from 'components/ui/button';



const Projects: React.FC = () => {
 

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
