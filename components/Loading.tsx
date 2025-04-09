'use client';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">Loading....</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading....</p>
      </div>
    </div>
  );
} 