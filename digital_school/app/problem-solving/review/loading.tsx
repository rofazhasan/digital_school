export default function Loading() {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading Review Session...</p>
        </div>
    );
}
