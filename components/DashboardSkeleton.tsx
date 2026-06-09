import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="dash-layout animate-pulse">
      {/* Skeleton Header */}
      <header className="dash-header flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64"></div>
        </div>
        <div className="dash-header__balance hidden sm:flex">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
        </div>
      </header>

      <div className="dash-grid">
        {/* Skeleton Left Panel */}
        <div className="dash-panel border border-gray-200 dark:border-gray-800 p-0 rounded-xl overflow-hidden">
          <div className="dash-panel__header border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-40"></div>
          </div>
          <div className="dash-panel__content p-4 space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-full"></div>
            </div>
            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mt-6"></div>
          </div>
        </div>

        {/* Skeleton Right Panel */}
        <div className="dash-panel border border-gray-200 dark:border-gray-800 p-0 rounded-xl overflow-hidden">
          <div className="dash-panel__header border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-40"></div>
          </div>
          <div className="dash-panel__content flex flex-col items-center justify-center min-h-[300px] p-4">
             <div className="h-16 w-16 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
             <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2"></div>
             <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
