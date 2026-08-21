export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cream" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>
  );
}
