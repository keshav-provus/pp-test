import { LucideIcon } from "lucide-react";
import { GlassPanel } from "./glass-panel";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClassName: string;
  onClick: () => void;
}

export function ActionCard({ title, description, icon: Icon, colorClassName, onClick }: ActionCardProps) {
  return (
    <GlassPanel 
      onClick={onClick}
      className="group cursor-pointer hover:bg-white/[0.04] transition-all duration-500"
    >
      <div className="p-8 flex flex-col items-center text-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", 
          colorClassName
        )}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
          <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}