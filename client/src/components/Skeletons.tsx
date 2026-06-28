import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-xl overflow-hidden p-3 border border-borderCard flex flex-col gap-3">
      {/* Image skeleton */}
      <div className="w-full aspect-[4/3] rounded-lg shimmer" />
      
      {/* Brand & Badge */}
      <div className="flex justify-between items-center">
        <div className="h-4 w-16 rounded shimmer" />
        <div className="h-5 w-20 rounded-full shimmer" />
      </div>

      {/* Name */}
      <div className="h-6 w-3/4 rounded shimmer" />

      {/* Rating & Swatches */}
      <div className="flex justify-between items-center mt-1">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full shimmer" />
          ))}
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full shimmer" />
          ))}
        </div>
      </div>

      {/* Price & Add to Cart button */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-borderCard/30">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-24 rounded shimmer" />
          <div className="h-3.5 w-16 rounded shimmer" />
        </div>
        <div className="h-8 w-8 rounded-full shimmer" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-4 flex gap-4 border border-borderCard items-center">
      <div className="w-20 h-20 rounded-lg shimmer flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-5 w-1/3 rounded shimmer" />
        <div className="h-4 w-1/4 rounded shimmer" />
        <div className="h-4 w-20 rounded shimmer" />
      </div>
      <div className="h-8 w-24 rounded shimmer" />
      <div className="h-6 w-16 rounded shimmer" />
      <div className="w-8 h-8 rounded-full shimmer" />
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Image Gallery Column */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="w-full aspect-[4/3] rounded-xl shimmer" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg shimmer" />
          ))}
        </div>
      </div>

      {/* Specs Column */}
      <div className="lg:col-span-6 flex flex-col gap-5">
        <div className="h-4 w-20 rounded shimmer" />
        <div className="h-10 w-2/3 rounded shimmer" />
        <div className="h-4 w-1/3 rounded shimmer" />
        
        <div className="flex gap-2 my-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-16 rounded-full shimmer" />
          ))}
        </div>

        <div className="h-24 w-full rounded shimmer" />

        <div className="h-12 w-1/2 rounded mt-4 shimmer" />
        <div className="h-10 w-full rounded-full mt-2 shimmer" />
      </div>
    </div>
  );
};
