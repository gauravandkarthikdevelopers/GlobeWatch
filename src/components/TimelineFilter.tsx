import { TimeRange } from '@/types/events';
import { motion } from 'framer-motion';

interface Props {
  range: TimeRange;
  onChange: (range: TimeRange) => void;
}

const options: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '10d', label: '10 Days' },
  { value: '30d', label: '30 Days' },
];

const TimelineFilter = ({ range, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-xl border border-border rounded-full px-2 py-1.5 shadow-2xl flex items-center gap-1"
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-display font-medium transition-all ${
            range === opt.value
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </motion.div>
  );
};

export default TimelineFilter;
