"use client";

import { FolderSearch } from "lucide-react";
import { cn } from "lib/utils";

interface NoSearchResultProps {
  className?: string;
}

const NoSearchResult = ({ className }: NoSearchResultProps) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="flex flex-col justify-center items-center gap-5 pt-32">
        <FolderSearch className="h-48 w-48 text-gray-200" />
        <h1 className="text-blue-900 text-4xl font-bold text-center">
          NO RESULTS FOUND
        </h1>
        <p className="text-center text-2xl text-blue-950">
          Ooops… We can&apos;t find any projects matching your search. <br />{" "}
          Try searching again.
        </p>
      </div>
    </div>
  );
};

export default NoSearchResult;
