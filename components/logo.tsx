import Image from 'next/image'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
}

const sizes = {
  sm: { className: 'h-9 w-9', px: 72, src: '/logo-mark.webp' },
  md: { className: 'h-16 w-16', px: 128, src: '/logo-mark.webp' },
  lg: { className: 'h-28 w-28', px: 224, src: '/logo.webp' },
  xl: { className: 'h-36 w-36', px: 288, src: '/logo.webp' },
}

export function Logo({ size = 'md', className = '', priority = false }: LogoProps) {
  const config = sizes[size]

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-md bg-black ${config.className} ${className}`}>
      <Image
        src={config.src}
        alt="KAOUBI PERFUMES"
        width={config.px}
        height={config.px}
        sizes={`${config.px}px`}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        unoptimized
        className="h-full w-full object-contain"
      />
    </div>
  )
}
