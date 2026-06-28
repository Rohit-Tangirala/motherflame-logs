import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col animate-pulse" id="skeleton-card">
      <div className="w-full aspect-ratio-[16/10] bg-neutral-200 rounded-lg h-48 md:h-52" />
      <div className="py-4 px-1 flex flex-col gap-3">
        <div className="h-3 bg-neutral-200 rounded w-1/4" />
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-full" />
        <div className="h-4 bg-neutral-200 rounded w-5/6" />
        <div className="flex items-center gap-3 mt-4">
          <div className="w-6 h-6 rounded-full bg-neutral-200" />
          <div className="h-3 bg-neutral-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonHero: React.FC = () => {
  return (
    <div className="w-full bg-neutral-200 h-96 md:h-[500px] rounded-xl animate-pulse flex flex-col justify-end p-8 gap-4 mb-8" id="skeleton-hero">
      <div className="h-4 bg-neutral-300 rounded w-16" />
      <div className="h-10 bg-neutral-300 rounded w-2/3" />
      <div className="h-4 bg-neutral-300 rounded w-1/2" />
    </div>
  );
};
