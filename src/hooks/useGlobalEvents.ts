import { useQuery } from '@tanstack/react-query';
import { GlobalEvent, TimeRange, EventCategory } from '@/types/events';
import { getCountryCoords } from '@/data/countryCoords';

const getTimeMs = (range: TimeRange): number => {
  const map: Record<TimeRange, number> = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
    '10d': 864000000,
    '30d': 2592000000,
  };
  return map[range];
};

async function fetchEarthquakes(range: TimeRange): Promise<GlobalEvent[]> {
  const now = Date.now();
  const start = new Date(now - getTimeMs(range)).toISOString();
  const minMag = range === '1h' ? 2 : range === '24h' ? 3 : 4;
  
  try {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&minmagnitude=${minMag}&orderby=time&limit=80`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.features || []).map((f: any) => {
      const mag = f.properties.mag || 0;
      let severity: GlobalEvent['severity'] = 'low';
      if (mag >= 7) severity = 'critical';
      else if (mag >= 6) severity = 'high';
      else if (mag >= 5) severity = 'medium';

      return {
        id: `eq-${f.id}`,
        title: `M${mag.toFixed(1)} Earthquake`,
        description: f.properties.place || 'Unknown location',
        category: 'earthquake' as EventCategory,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        timestamp: new Date(f.properties.time).toISOString(),
        severity,
        source: 'USGS',
        sourceUrl: f.properties.url || 'https://earthquake.usgs.gov',
        country: f.properties.place?.split(', ').pop(),
      };
    });
  } catch {
    return [];
  }
}

function parseGDELTDate(d: string): string {
  try {
    return new Date(d.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function fetchGDELTEvents(range: TimeRange): Promise<GlobalEvent[]> {
  const timespan = range === '1h' ? '60' : range === '24h' ? '1440' : range === '7d' ? '10080' : range === '10d' ? '14400' : '43200';
  
  const queries = [
    { q: 'war conflict military attack bombing', category: 'war' as EventCategory },
    { q: 'disease outbreak epidemic pandemic virus', category: 'disease' as EventCategory },
    { q: 'flood tsunami hurricane cyclone typhoon', category: 'flood' as EventCategory },
    { q: 'protest revolution coup political crisis', category: 'political' as EventCategory },
    { q: 'economic crisis inflation recession sanctions trade', category: 'economic' as EventCategory },
    { q: 'climate wildfire drought heatwave disaster', category: 'climate' as EventCategory },
    { q: 'terrorism extremist bombing insurgent', category: 'terrorism' as EventCategory },
  ];

  const results: GlobalEvent[] = [];

  // Fetch all in parallel
  const fetches = queries.map(async ({ q, category }) => {
    try {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&maxrecords=12&timespan=${timespan}min&format=json&sort=DateDesc`;
      const res = await fetch(url);
      if (!res.ok) return [];
      
      const text = await res.text();
      if (!text.trim()) return [];
      
      let data: any;
      try { data = JSON.parse(text); } catch { return []; }
      
      const articles = data.articles || [];
      const events: GlobalEvent[] = [];
      
      for (const art of articles) {
        if (!art.seendate) continue;
        
        const tone = Math.abs(art.tone || 0);
        let severity: GlobalEvent['severity'] = 'low';
        if (tone > 15) severity = 'critical';
        else if (tone > 10) severity = 'high';
        else if (tone > 5) severity = 'medium';

        // Try GDELT coords first, then fallback to country geocoding
        let lat = art.sourcelat ? parseFloat(art.sourcelat) : NaN;
        let lng = art.sourcelon ? parseFloat(art.sourcelon) : NaN;
        let country = art.sourcecountry || undefined;

        if (isNaN(lat) || isNaN(lng)) {
          if (country) {
            const coords = getCountryCoords(country);
            if (coords) {
              // Add small random offset to avoid stacking
              lat = coords[0] + (Math.random() - 0.5) * 3;
              lng = coords[1] + (Math.random() - 0.5) * 3;
            }
          }
        }

        if (isNaN(lat) || isNaN(lng)) continue;

        events.push({
          id: `gdelt-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: (art.title || 'Untitled').slice(0, 120),
          description: `Source: ${art.domain || 'Unknown'} | ${art.language || ''}`,
          category,
          lat,
          lng,
          timestamp: parseGDELTDate(art.seendate),
          severity,
          source: art.domain || 'GDELT',
          sourceUrl: art.url || 'https://www.gdeltproject.org',
          country,
        });
      }
      
      return events;
    } catch {
      return [];
    }
  });

  const allResults = await Promise.allSettled(fetches);
  for (const result of allResults) {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    }
  }

  return results;
}

async function fetchReliefWebEvents(range: TimeRange): Promise<GlobalEvent[]> {
  const days = range === '1h' ? 1 : range === '24h' ? 1 : range === '7d' ? 7 : range === '10d' ? 10 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  
  try {
    const url = `https://api.reliefweb.int/v1/disasters?appname=globewatch&filter[field]=date.created&filter[value][from]=${since}&limit=50&fields[include][]=name&fields[include][]=description&fields[include][]=country.name&fields[include][]=country.iso3&fields[include][]=country.location&fields[include][]=type.name&fields[include][]=date.created&fields[include][]=url`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.data || []).map((item: any) => {
      const fields = item.fields;
      const typeName = (fields.type?.[0]?.name || '').toLowerCase();
      
      let category: EventCategory = 'climate';
      if (typeName.includes('earthquake')) category = 'earthquake';
      else if (typeName.includes('flood') || typeName.includes('tsunami') || typeName.includes('cyclone')) category = 'flood';
      else if (typeName.includes('epidemic') || typeName.includes('disease')) category = 'disease';
      else if (typeName.includes('conflict') || typeName.includes('war')) category = 'war';

      const loc = fields.country?.[0]?.location;
      let lat = loc?.lat || 0;
      let lng = loc?.lon || 0;
      const countryName = fields.country?.[0]?.name;

      if (!lat && !lng && countryName) {
        const coords = getCountryCoords(countryName);
        if (coords) { lat = coords[0]; lng = coords[1]; }
      }
      if (!lat && !lng) return null;

      return {
        id: `rw-${item.id}`,
        title: fields.name || 'Unknown Disaster',
        description: fields.description || typeName,
        category,
        lat,
        lng,
        timestamp: fields.date?.created || new Date().toISOString(),
        severity: 'high' as const,
        source: 'ReliefWeb',
        sourceUrl: fields.url || `https://reliefweb.int/disaster/${item.id}`,
        country: countryName,
      };
    }).filter(Boolean) as GlobalEvent[];
  } catch {
    return [];
  }
}

export function useGlobalEvents(range: TimeRange, activeCategories: EventCategory[]) {
  return useQuery({
    queryKey: ['global-events', range],
    queryFn: async () => {
      const [earthquakes, gdelt, reliefweb] = await Promise.all([
        fetchEarthquakes(range),
        fetchGDELTEvents(range),
        fetchReliefWebEvents(range),
      ]);

      const all = [...earthquakes, ...gdelt, ...reliefweb];
      // Deduplicate by proximity + category
      const seen = new Set<string>();
      return all.filter(e => {
        const key = `${e.category}-${Math.round(e.lat * 2)}-${Math.round(e.lng * 2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    refetchInterval: range === '1h' ? 60000 : 300000,
    staleTime: 30000,
    select: (data) => data.filter(e => activeCategories.includes(e.category)),
  });
}
