export type EventCategory = 
  | 'war' 
  | 'disease' 
  | 'earthquake' 
  | 'flood' 
  | 'political' 
  | 'economic' 
  | 'climate' 
  | 'terrorism';

export interface GlobalEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  lat: number;
  lng: number;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  sourceUrl: string;
  country?: string;
}

export type TimeRange = '1h' | '24h' | '7d' | '10d' | '30d';

export const EVENT_COLORS: Record<EventCategory, string> = {
  war: '#e03e3e',
  disease: '#e8922e',
  earthquake: '#a855f7',
  flood: '#3b9ddb',
  political: '#eab308',
  economic: '#00e68a',
  climate: '#4ead8a',
  terrorism: '#e84057',
};

export const EVENT_LABELS: Record<EventCategory, string> = {
  war: 'Armed Conflict',
  disease: 'Disease Outbreak',
  earthquake: 'Earthquake',
  flood: 'Flood / Tsunami',
  political: 'Political Unrest',
  economic: 'Economic Crisis',
  climate: 'Climate Event',
  terrorism: 'Terrorism',
};

export const SEVERITY_SIZES: Record<string, number> = {
  low: 6,
  medium: 9,
  high: 12,
  critical: 16,
};
