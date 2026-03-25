import { EventCategory, EVENT_COLORS, EVENT_LABELS } from '@/types/events';
import { motion } from 'framer-motion';

interface Props {
  activeCategories: EventCategory[];
  onToggle: (category: EventCategory) => void;
}

const ALL_CATEGORIES: EventCategory[] = [
  'war', 'disease', 'earthquake', 'flood', 'political', 'economic', 'climate', 'terrorism',
];

const MapLegend = ({ activeCategories, onToggle }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-32 left-4 z-[1000] bg-card/90 backdrop-blur-xl border border-border rounded-lg p-3 shadow-2xl w-64 max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-y-auto"
    >
      <h3 className="font-display text-xs font-semibold text-primary tracking-wider uppercase mb-3">
        Event Categories
      </h3>
      <div className="space-y-1.5">
        {ALL_CATEGORIES.map(cat => {
          const active = activeCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-xs transition-all ${
                active ? 'opacity-100' : 'opacity-35'
              } hover:bg-accent/50`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border border-foreground/10"
                style={{
                  backgroundColor: EVENT_COLORS[cat],
                  boxShadow: active ? `0 0 8px ${EVENT_COLORS[cat]}60` : 'none',
                }}
              />
              <span className="text-foreground/90 font-medium">{EVENT_LABELS[cat]}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MapLegend;
