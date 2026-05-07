const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
    ))}
  </div>
)

export default SkeletonLoader
