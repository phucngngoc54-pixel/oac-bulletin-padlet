import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  borderRadius = '0.375rem'
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      }}
    />
  );
};

export default Skeleton;

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
    <Skeleton height="150px" borderRadius="0.75rem" />
    <Skeleton width="60%" height="1.25rem" />
    <div className="flex gap-2">
      <Skeleton width="24px" height="24px" borderRadius="12px" />
      <Skeleton width="40%" height="0.75rem" />
    </div>
  </div>
);

export const NoteSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton width="40%" height="1.5rem" />
      <Skeleton width="24px" height="24px" borderRadius="4px" />
    </div>
    <Skeleton height="4rem" />
    <div className="flex justify-between items-center pt-2">
      <div className="flex gap-2">
        <Skeleton width="32px" height="32px" borderRadius="16px" />
        <Skeleton width="80px" height="0.75rem" />
      </div>
      <Skeleton width="60px" height="1.5rem" borderRadius="1rem" />
    </div>
  </div>
);
