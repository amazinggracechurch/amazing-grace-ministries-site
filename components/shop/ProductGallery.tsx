'use client'
import Image from 'next/image'
import { useState } from 'react'

export type ProductGalleryProps = {
  images: string[]
  title: string
}

/** Main image + thumbnail strip for the PDP. */
export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]!

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden border border-border-subtle bg-surface-sunken">
        <Image
          src={current}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`View image ${index + 1} of ${title}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className={`relative size-16 overflow-hidden border transition-colors duration-200 ${
                index === active ? 'border-accent' : 'border-border-subtle hover:border-accent'
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
