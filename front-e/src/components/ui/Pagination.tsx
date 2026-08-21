interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="px-4 py-2 bg-cream text-black border border-brand rounded-lg hover:bg-brand hover:text-cream transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cream disabled:hover:text-black"
      >
        Previous
      </button>

      <span className="px-4 py-2 text-sm text-black">
        Page {currentPage + 1} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="px-4 py-2 bg-cream text-black border border-brand rounded-lg hover:bg-brand hover:text-cream transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cream disabled:hover:text-black"
      >
        Next
      </button>
    </div>
  );
}
