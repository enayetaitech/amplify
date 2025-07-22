function getPages(totalPages: number, currentPage: number): (number | "…")[] {
  const pages: (number | "…")[] = [];

  // always show page 1
  pages.push(1);

  // if there's a gap between 1 and currentPage-1, show "…"
  if (currentPage - 2 > 1) {
    pages.push("…");
  }

  // show the page before current, current, and after current
  for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
    pages.push(p);
  }

  // if there's a gap between currentPage+1 and last page
  if (currentPage + 2 < totalPages) {
    pages.push("…");
  }

  // always show the last page (if it's not page 1)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default getPages;