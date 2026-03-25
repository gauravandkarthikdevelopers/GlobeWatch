import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GlobalEvent, EVENT_COLORS, SEVERITY_SIZES } from '@/types/events';

export interface GlobeMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface Props {
  events: GlobalEvent[];
  onEventClick: (event: GlobalEvent) => void;
}

const GlobeMap = forwardRef<GlobeMapHandle, Props>(({ events, onEventClick }, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest callback + event objects without re-creating marker click handlers.
  const onEventClickRef = useRef(onEventClick);
  const eventByIdRef = useRef(new Map<string, GlobalEvent>());
  const markersByIdRef = useRef(
    new Map<string, { marker: L.Marker; iconKey: string }>()
  );

  useEffect(() => {
    onEventClickRef.current = onEventClick;
  }, [onEventClick]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom = 5) => {
      mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.5 });
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersRef.current) return;

    const layerGroup = markersRef.current;

    // Replace latest event lookup map (used by click handlers).
    eventByIdRef.current = new Map(events.map(e => [e.id, e]));

    // Update existing markers + add missing ones.
    const nextIds = new Set(events.map(e => e.id));
    const markersById = markersByIdRef.current;

    const createIcon = (event: GlobalEvent) => {
      const color = EVENT_COLORS[event.category];
      const size = SEVERITY_SIZES[event.severity];
      const iconKey = `${event.category}-${event.severity}-${size}-${color}`;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="position:relative;width:${size * 2}px;height:${size * 2}px;">
            <div style="
              position:absolute;
              width:${size * 2}px;
              height:${size * 2}px;
              border-radius:50%;
              background:${color};
              opacity:0.25;
              animation: pulse-dot 2s ease-in-out infinite;
            "></div>
            <div style="
              position:absolute;
              top:${size / 2}px;
              left:${size / 2}px;
              width:${size}px;
              height:${size}px;
              border-radius:50%;
              background:${color};
              border:2px solid rgba(255,255,255,0.3);
              box-shadow:0 0 10px ${color}80;
              cursor:pointer;
            "></div>
          </div>
        `,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      });

      return { icon, iconKey };
    };

    // Add/update markers (no full clear -> smoother refresh).
    for (const event of events) {
      const existing = markersById.get(event.id);

      if (existing) {
        existing.marker.setLatLng([event.lat, event.lng]);

        const { icon, iconKey } = createIcon(event);
        if (existing.iconKey !== iconKey) {
          existing.marker.setIcon(icon);
          existing.iconKey = iconKey;
        }
        continue;
      }

      const { icon, iconKey } = createIcon(event);
      const marker = L.marker([event.lat, event.lng], { icon });
      marker.on('click', () => {
        const e = eventByIdRef.current.get(event.id);
        if (e) onEventClickRef.current(e);
      });
      layerGroup.addLayer(marker);
      markersById.set(event.id, { marker, iconKey });
    }

    // Remove markers not present anymore.
    for (const [id, stored] of markersById.entries()) {
      if (!nextIds.has(id)) {
        layerGroup.removeLayer(stored.marker);
        markersById.delete(id);
      }
    }
  }, [events]);

  return <div ref={containerRef} className="w-full h-full" />;
});

GlobeMap.displayName = 'GlobeMap';

export default GlobeMap;
