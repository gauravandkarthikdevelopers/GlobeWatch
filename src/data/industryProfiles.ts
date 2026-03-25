import { EventCategory } from '@/types/events';

export interface IndustryProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  riskCategories: EventCategory[];
  keyRegions: string[];
  color: string;
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'oil-gas',
    name: 'Oil & Gas',
    icon: '⛽',
    description: 'Upstream, midstream & downstream petroleum operations',
    riskCategories: ['war', 'political', 'economic', 'terrorism', 'climate'],
    keyRegions: ['Middle East', 'Russia', 'Venezuela', 'Nigeria', 'Norway'],
    color: '#e8922e',
  },
  {
    id: 'aviation',
    name: 'Aviation & Aerospace',
    icon: '✈️',
    description: 'Aircraft manufacturing, airlines & defense',
    riskCategories: ['war', 'terrorism', 'political', 'climate', 'economic'],
    keyRegions: ['United States', 'Europe', 'China', 'Middle East', 'Japan'],
    color: '#3b9ddb',
  },
  {
    id: 'shipping',
    name: 'Shipping & Maritime',
    icon: '🚢',
    description: 'Global freight, ports & maritime logistics',
    riskCategories: ['war', 'flood', 'political', 'terrorism', 'climate'],
    keyRegions: ['Suez Canal', 'South China Sea', 'Strait of Hormuz', 'Panama', 'Singapore'],
    color: '#4ead8a',
  },
  {
    id: 'semiconductor',
    name: 'Semiconductors',
    icon: '🔬',
    description: 'Chip manufacturing & electronic components',
    riskCategories: ['earthquake', 'political', 'economic', 'flood', 'war'],
    keyRegions: ['Taiwan', 'South Korea', 'Japan', 'United States', 'China'],
    color: '#a855f7',
  },
  {
    id: 'pharma',
    name: 'Pharmaceuticals',
    icon: '💊',
    description: 'Drug manufacturing, biotech & medical supplies',
    riskCategories: ['disease', 'political', 'economic', 'earthquake', 'flood'],
    keyRegions: ['India', 'China', 'Switzerland', 'Germany', 'United States'],
    color: '#00e68a',
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Food',
    icon: '🌾',
    description: 'Farming, food processing & supply chains',
    riskCategories: ['climate', 'flood', 'war', 'disease', 'political'],
    keyRegions: ['Ukraine', 'Brazil', 'United States', 'India', 'Australia'],
    color: '#eab308',
  },
  {
    id: 'mining',
    name: 'Mining & Minerals',
    icon: '⛏️',
    description: 'Metal ores, rare earths & mineral extraction',
    riskCategories: ['political', 'earthquake', 'climate', 'war', 'economic'],
    keyRegions: ['Congo', 'Australia', 'Chile', 'South Africa', 'China'],
    color: '#e84057',
  },
  {
    id: 'finance',
    name: 'Finance & Banking',
    icon: '🏦',
    description: 'Global banking, insurance & fintech',
    riskCategories: ['economic', 'political', 'terrorism', 'war', 'climate'],
    keyRegions: ['United States', 'United Kingdom', 'China', 'Switzerland', 'Singapore'],
    color: '#e03e3e',
  },
];
