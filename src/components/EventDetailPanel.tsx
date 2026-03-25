import { GlobalEvent, EVENT_COLORS, EVENT_LABELS } from '@/types/events';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Clock, MapPin, AlertTriangle } from 'lucide-react';

interface Props {
  event: GlobalEvent | null;
  onClose: () => void;
}

const severityLabel: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const EventDetailPanel = ({ event, onClose }: Props) => {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-14 right-4 z-[1000] w-80 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto"
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: `2px solid ${EVENT_COLORS[event.category]}` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[event.category] }}
              />
              <span className="text-xs font-display font-semibold tracking-wider uppercase text-foreground/80">
                {EVENT_LABELS[event.category]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{event.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={12} className="text-primary" />
                <span>{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              {event.country && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin size={12} className="text-primary" />
                  <span>{event.country}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle size={12} style={{ color: EVENT_COLORS[event.category] }} />
                <span
                  className="font-display font-semibold uppercase tracking-wider"
                  style={{ color: EVENT_COLORS[event.category] }}
                >
                  {severityLabel[event.severity]} Severity
                </span>
              </div>
            </div>

            {/* Source */}
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-md bg-accent/50 hover:bg-accent text-xs text-foreground/80 hover:text-foreground transition-colors"
            >
              <ExternalLink size={12} className="text-primary" />
              <span>Source: <strong>{event.source}</strong></span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventDetailPanel;
