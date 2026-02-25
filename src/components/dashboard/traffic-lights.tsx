export function TrafficLights({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-black/20">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      {title && (
        <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          {title}
        </span>
      )}
    </div>
  );
}