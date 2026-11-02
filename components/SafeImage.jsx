'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
}) {
  const [imgSrc, setImgSrc] = useState(src || '/uploads/placeholder-shop.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 ${
        isLoading ? 'animate-pulse' : ''
      } ${className}`}
    >
      <Image
        src={hasError ? '/uploads/placeholder-shop.jpg' : imgSrc}
        alt={alt || 'Shop Image'}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes || '(max-width: 768px) 100vw, 33vw'}
        quality={65} // Compress image for low-bandwidth 2G/3G connections
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setImgSrc('/uploads/placeholder-shop.jpg');
          setIsLoading(false);
        }}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${fill ? 'object-cover' : ''}`}
      />
    </div>
  );
}