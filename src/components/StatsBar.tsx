import { GlobalEvent, EVENT_COLORS, EVENT_LABELS } from '@/types/events';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle } from 'lucide-react';

interface Props {
  events: GlobalEvent[];
  isLoading: boolean;
}

const StatsBar = ({ events, isLoading }: Props) => {
  const categoryCounts = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceCounts = events.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-xl border border-border rounded-lg px-4 py-2 shadow-2xl flex items-center gap-5"
    >
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-primary" />
        <span className="text-xs font-display font-semibold text-foreground">
          {isLoading ? '...' : events.length} Events
        </span>
      </div>
      
      {criticalCount > 0 && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-destructive" />
          <span className="text-xs font-display font-semibold text-destructive">
            {criticalCount} High/Critical
          </span>
        </div>
      )}

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-3">
        {Object.entries(categoryCounts).slice(0, 5).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: EVENT_COLORS[cat as keyof typeof EVENT_COLORS] }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">{count}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-4 w-px bg-border" />
        {Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([src, count]) => (
            <span key={src} className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
              {src}: {count}
            </span>
          ))}
      </div>
    </motion.div>
  );
};

export default StatsBar;
