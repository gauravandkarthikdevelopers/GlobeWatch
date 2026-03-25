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
    const res = await fetch(
      `/usgs/fdsnws/event/1/query?format=geojson&starttime=${start}&minmagnitude=${minMag}&orderby=time&limit=80`
    );
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

function hashToUnit(input: string): number {
  // Simple deterministic hash -> [0,1)
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
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
      const res = await fetch(
        `/gdelt/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&maxrecords=10&timespan=${timespan}min&format=json&sort=DateDesc`
      );
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
              // Deterministic offset to avoid stacking while keeping markers stable.
              const u1 = hashToUnit(`${category}-${art.url || ''}-${art.title || ''}`);
              const u2 = hashToUnit(`${art.url || ''}-${art.seendate || ''}`);
              lat = coords[0] + (u1 - 0.5) * 3;
              lng = coords[1] + (u2 - 0.5) * 3;
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
    const res = await fetch(
      `/reliefweb/v1/disasters?appname=globewatch&filter[field]=date.created&filter[value][from]=${since}&limit=50&fields[include][]=name&fields[include][]=description&fields[include][]=country.name&fields[include][]=country.iso3&fields[include][]=country.location&fields[include][]=type.name&fields[include][]=date.created&fields[include][]=url`
    );
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

function parseGeoRssPoint(pointText: string): { lat: number; lng: number } | null {
  const parts = pointText.trim().split(/\s+/).map(p => parseFloat(p));
  if (parts.length < 2) return null;
  const a = parts[0];
  const b = parts[1];

  // GeoRSS simple is typically "lat lon", but some producers may swap.
  const isLatA = Math.abs(a) <= 90;
  const isLatB = Math.abs(b) <= 90;

  if (isLatA && !isLatB) return { lat: a, lng: b };
  if (!isLatA && isLatB) return { lat: b, lng: a };
  // If both look like lat, prefer "lat lon".
  if (isLatA && isLatB) return { lat: a, lng: b };
  return null;
}

async function fetchGDACSFeed(range: TimeRange): Promise<GlobalEvent[]> {
  // GDACS feeds are updated frequently (every ~6 minutes).
  // They use GeoRSS (georss:point) so we can plot without any keys.
  const feedFile = range === '1h' || range === '24h' ? 'rss_24h.xml' : 'rss_7d.xml';
  const url = `/gdacs/xml/${feedFile}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim()) return [];

    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const items = Array.from(doc.getElementsByTagName('item'));
    if (!items.length) return [];

    const events: GlobalEvent[] = [];
    const maxFromFeed = 60;

    for (let i = 0; i < items.length; i++) {
      if (events.length >= maxFromFeed) break;
      const item = items[i];
      const title = item.getElementsByTagName('title')?.[0]?.textContent?.trim() || 'Unknown Disaster';
      const description = item.getElementsByTagName('description')?.[0]?.textContent?.trim() || title;

      const pubDate = item.getElementsByTagName('pubDate')?.[0]?.textContent?.trim();
      const timestamp = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();

      // Try GeoRSS point (namespace-agnostic by searching any tag with localName "point").
      const pointEls = item.getElementsByTagNameNS('*', 'point');
      const pointText = pointEls?.[0]?.textContent || '';
      const coords = parseGeoRssPoint(pointText);
      if (!coords) continue;

      // Heuristics for category mapping from the feed title.
      const t = title.toLowerCase();
      let category: EventCategory = 'climate';
      if (t.includes('earthquake')) category = 'earthquake';
      else if (t.includes('flood') || t.includes('tsunami')) category = 'flood';
      else if (t.includes('cyclone') || t.includes('tropical cyclone') || t.includes('hurricane')) category = 'flood';
      else if (t.includes('wildfire') || t.includes('heatwave') || t.includes('drought') || t.includes('storm')) category = 'climate';

      // Severity from magnitude if present in the title.
      const magMatch = title.match(/Magnitude\s*=?\s*(\d+(\.\d+)?)/i);
      let severity: GlobalEvent['severity'] = 'low';
      const mag = magMatch ? parseFloat(magMatch[1]) : undefined;
      if (typeof mag === 'number') {
        if (mag >= 7) severity = 'critical';
        else if (mag >= 6) severity = 'high';
        else if (mag >= 5) severity = 'medium';
      } else {
        severity = 'medium';
      }

      const id = `gdacs-${feedFile}-${i}-${Math.round(coords.lat * 10)}-${Math.round(coords.lng * 10)}`;

      events.push({
        id,
        title: title.slice(0, 120),
        description: description.slice(0, 400),
        category,
        lat: coords.lat,
        lng: coords.lng,
        timestamp,
        severity,
        source: 'GDACS',
        sourceUrl: item.getElementsByTagName('link')?.[0]?.textContent?.trim() || 'https://gdacs.org/',
        country: undefined,
      });
    }

    return events;
  } catch {
    return [];
  }
}

export function useGlobalEvents(range: TimeRange, activeCategories: EventCategory[]) {
  const stableActiveCategoriesKey = [...activeCategories].sort().join(',');
  return useQuery({
    queryKey: ['global-events', range, stableActiveCategoriesKey],
    queryFn: async () => {
      const [earthquakes, gdelt, reliefweb, gdacs] = await Promise.all([
        fetchEarthquakes(range),
        fetchGDELTEvents(range),
        fetchReliefWebEvents(range),
        fetchGDACSFeed(range),
      ]);

      const all = [...earthquakes, ...gdelt, ...reliefweb, ...gdacs];
      // Keep the UI responsive: cap total marker count.
      const maxEvents = 180;
      // Deduplicate by proximity + category
      const seen = new Set<string>();
      const deduped = all.filter(e => {
        const key = `${e.category}-${Math.round(e.lat * 2)}-${Math.round(e.lng * 2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return deduped.slice(0, maxEvents);
    },
    // More live updates for shorter ranges.
    refetchInterval: range === '1h' ? 20000 : range === '24h' ? 60000 : range === '7d' ? 120000 : range === '10d' ? 180000 : 240000,
    staleTime: 30000,
    select: (data) => data.filter(e => activeCategories.includes(e.category)),
    refetchOnWindowFocus: false,
  });
}
