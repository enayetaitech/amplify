
import { Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink, } from "components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import getPages from "utils/getPages";

export default function CustomPagination({
  totalPages,
  currentPage,
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
 
    const pages = getPages(totalPages, currentPage);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;
  return (
    <Pagination className="flex mt-6 list-none p-">
      {/* ← Previous */}
       <PaginationItem>
        <PaginationLink
          href="#"
          // semantic disabled
          aria-disabled={isFirst}
          // visually disable & block clicks
          className={`p-2 rounded ${
            isFirst
              ? "pointer-events-none opacity-50"
              : "hover:bg-gray-100"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!isFirst) onPageChange(currentPage - 1);
          }}
        >
          {/* replace text with the Lucide icon */}
          <ChevronLeft className="w-4 h-4" />
        </PaginationLink>
      </PaginationItem>

      <PaginationContent>
        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
                className={`
                  w-9 h-9 flex items-center justify-center
                  rounded-md text-sm font-medium
                  ${currentPage === p
                    ? "bg-custom-dark-blue-1 text-white"
                    : "text-gray-600 hover:bg-gray-100"}
                `}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`dot-${idx}`} className="pointer-events-none">
              <span className="w-9 h-9 flex items-center justify-center text-gray-400">
                {p}
              </span>
            </PaginationItem>
          )
        )}
      </PaginationContent>

      {/* Next → */}
              <PaginationItem>
        <PaginationLink
          href="#"
          aria-disabled={isLast}
          className={`p-2 rounded ${
            isLast
              ? "pointer-events-none opacity-50"
              : "hover:bg-gray-100"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!isLast) onPageChange(currentPage + 1);
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </PaginationLink>
      </PaginationItem>
    </Pagination>
  );
}
