const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-14 rounded-xl animate-pulse"
        style={{
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.5s infinite',
          opacity: 1 - i * 0.15,
        }}
      />
    ))}
    <style>{`
      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
)

export default SkeletonLoader
