import { cn } from "@/lib/utils";
import { TrafficLights } from "./traffic-lights";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export function GlassPanel({ children, className, title, onClick }: GlassPanelProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-300",
        className
      )}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {title && <TrafficLights title={title} />}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}