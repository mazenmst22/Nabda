"use client";

import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
  formatPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: string) => string;
  formatPage: (page: number) => string;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav className="ui-pagination" aria-label={pageLabel(formatPage(currentPage))}>
      <button
        type="button"
        aria-label={previousLabel}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <Icon name="chevron" size={18} />
      </button>
      {pages.map((page) => (
        <button
          type="button"
          key={page}
          aria-label={pageLabel(formatPage(page))}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
        >
          <Ltr>{formatPage(page)}</Ltr>
        </button>
      ))}
      <button
        type="button"
        aria-label={nextLabel}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <Icon name="chevron" size={18} />
      </button>
    </nav>
  );
}
