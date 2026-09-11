export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-52 animate-pulse bg-muted/60 sm:h-64" />
      <div className="mb-8 flex justify-center gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="size-14 animate-pulse rounded-full bg-muted/50" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-4/5 animate-pulse rounded-xl bg-muted/50" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
