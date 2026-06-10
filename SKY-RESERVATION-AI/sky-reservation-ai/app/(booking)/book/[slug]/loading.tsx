export default function BookingLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.06] rounded-xl" />
      <div className="h-4 w-64 bg-white/[0.04] rounded-lg" />
      <div className="h-px bg-white/[0.06] my-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />
      ))}
    </div>
  );
}
