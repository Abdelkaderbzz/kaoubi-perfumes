'use client'

import Image from 'next/image'
import { useState } from 'react'

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center border border-border bg-secondary">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border">
          <path d="M12 2C8 2 5 5.5 5 9c0 5 7 13 7 13s7-8 7-13c0-3.5-3-7-7-7z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden border border-border bg-secondary">
        <Image
          src={activeImage}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden border transition-colors ${
                index === activeIndex ? 'border-primary' : 'border-border hover:border-primary/40'
              }`}
            >
              <Image
                src={url}
                alt={`${alt} ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
