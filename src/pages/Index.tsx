import { useState, useCallback, useRef } from 'react';
import GlobeMap, { GlobeMapHandle } from '@/components/GlobeMap';
import MapLegend from '@/components/MapLegend';
import TimelineFilter from '@/components/TimelineFilter';
import EventDetailPanel from '@/components/EventDetailPanel';
import StatsBar from '@/components/StatsBar';
import EventFeed from '@/components/EventFeed';
import IndustryRiskProfiler from '@/components/IndustryRiskProfiler';
import CountrySearch from '@/components/CountrySearch';
import { useGlobalEvents } from '@/hooks/useGlobalEvents';
import { GlobalEvent, EventCategory, TimeRange } from '@/types/events';
import { IndustryProfile } from '@/data/industryProfiles';
import { Shield, Radio } from 'lucide-react';

const ALL_CATEGORIES: EventCategory[] = [
  'war', 'disease', 'earthquake', 'flood', 'political', 'economic', 'climate', 'terrorism',
];

const Index = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [activeCategories, setActiveCategories] = useState<EventCategory[]>([...ALL_CATEGORIES]);
  const [selectedEvent, setSelectedEvent] = useState<GlobalEvent | null>(null);
  const [activeProfile, setActiveProfile] = useState<IndustryProfile | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const mapRef = useRef<GlobeMapHandle>(null);

  const { data: events = [], isLoading } = useGlobalEvents(timeRange, activeCategories);

  const toggleCategory = useCallback((cat: EventCategory) => {
    setActiveCategories(prev =>
      prev.includes(cat)
        ? prev.length === 1
          ? prev
          : prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  }, []);

  const selectAllCategories = useCallback(() => {
    setActiveCategories([...ALL_CATEGORIES]);
  }, []);

  const handleEventClick = useCallback((event: GlobalEvent) => {
    setSelectedEvent(event);
    mapRef.current?.flyTo(event.lat, event.lng, 6);
  }, []);

  const handleProfileSelect = useCallback((profile: IndustryProfile | null) => {
    setActiveProfile(profile);
    if (profile) {
      setActiveCategories(profile.riskCategories);
    } else {
      setActiveCategories([...ALL_CATEGORIES]);
    }
  }, []);

  const handleCountrySelect = useCallback((_country: string, lat: number, lng: number) => {
    mapRef.current?.flyTo(lat, lng, 5);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background">
      {/* Header brand */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 pointer-events-none select-none">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border rounded-full px-4 py-2 shadow-xl">
          <Shield size={16} className="text-primary" />
          <span className="font-display text-sm font-bold tracking-wider text-foreground">
            GLOBEWATCH
          </span>
          <span className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1">
            <Radio size={10} className="text-primary animate-pulse" />
            <span className="text-[10px] font-display text-primary font-semibold tracking-widest uppercase">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar events={events} isLoading={isLoading} />

      {/* Map */}
      <GlobeMap ref={mapRef} events={events} onEventClick={handleEventClick} />

      {/* Industry Risk Profiler */}
      <IndustryRiskProfiler
        events={events}
        onSelectProfile={handleProfileSelect}
        activeProfile={activeProfile}
        isOpen={industryOpen}
        onToggle={() => setIndustryOpen(prev => !prev)}
      />

      {/* Country Search */}
      <CountrySearch events={events} onCountrySelect={handleCountrySelect} />

      {/* Legend - shift down when industry panel not open */}
      {!industryOpen && (
        <MapLegend
          activeCategories={activeCategories}
          onToggle={toggleCategory}
          onSelectAll={selectAllCategories}
        />
      )}

      {/* Timeline */}
      <TimelineFilter range={timeRange} onChange={setTimeRange} />

      {/* Event detail */}
      <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Live feed */}
      <EventFeed events={events} onEventClick={handleEventClick} />
    </div>
  );
};

export default Index;
