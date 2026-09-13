export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-28 animate-pulse rounded-2xl bg-muted/60" />
      <div className="mb-6 h-11 w-full animate-pulse rounded-xl bg-muted/50" />
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-9 w-20 animate-pulse rounded-full bg-muted/50" />
        ))}
      </div>
      <div className="flex gap-8">
        <div className="hidden h-96 w-60 shrink-0 animate-pulse border border-border/50 bg-muted/30 lg:block" />
        <div className="min-w-0 flex-1 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted/50" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
