import { GlobalEvent, EVENT_COLORS, EVENT_LABELS } from '@/types/events';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';

interface Props {
  events: GlobalEvent[];
  onEventClick: (event: GlobalEvent) => void;
}

const severityLabel: Record<GlobalEvent['severity'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const EventFeed = ({ events, onEventClick }: Props) => {
  const sorted = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute bottom-20 right-4 z-[1000] w-72 max-h-80 bg-card/90 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Clock size={12} className="text-primary" />
        <span className="text-xs font-display font-semibold tracking-wider uppercase text-foreground/80">
          Live Feed
        </span>
      </div>
      <div className="overflow-y-auto flex-1">
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No events in this timeframe</div>
        ) : (
          sorted.map((event, i) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-accent/50 transition-colors text-left border-b border-border/50 last:border-0"
            >
              <span
                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: EVENT_COLORS[event.category] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">{event.source}</span>
                </div>

              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {EVENT_LABELS[event.category]}
                </span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] font-display font-semibold text-foreground/80">
                  {severityLabel[event.severity]}
                </span>
              </div>
              </div>
              <ChevronRight size={12} className="text-muted-foreground mt-1 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default EventFeed;
