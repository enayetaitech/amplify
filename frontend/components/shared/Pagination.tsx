
import { Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink, } from "components/ui/pagination";

export default function CustomPagination({
  totalPages,
  currentPage,
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  // only show “1”, “2”, “…”, last
  const pages: (number | "…")[] =
    totalPages <= 4
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [1, 2, "…", totalPages];

  return (
    <Pagination className="flex justify-center mt-6">
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
    </Pagination>
  );
}
