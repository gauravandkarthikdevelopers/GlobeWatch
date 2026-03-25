import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { GlobalEvent } from '@/types/events';
import { COUNTRY_COORDS } from '@/data/countryCoords';

interface Props {
  events: GlobalEvent[];
  onCountrySelect: (country: string, lat: number, lng: number) => void;
}

const CountrySearch = ({ events, onCountrySelect }: Props) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique countries from events + all known countries
  const allCountries = Object.keys(COUNTRY_COORDS).sort();
  
  const filtered = query.trim()
    ? allCountries.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const getEventCount = (country: string) => {
    return events.filter(e => 
      e.country?.toLowerCase().includes(country.toLowerCase())
    ).length;
  };

  const handleSelect = (country: string) => {
    const coords = COUNTRY_COORDS[country];
    if (coords) {
      onCountrySelect(country, coords[0], coords[1]);
      setQuery(country);
      setIsOpen(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1001]">
      <div className="relative">
        <div className="flex items-center bg-card/90 backdrop-blur-xl border border-border rounded-lg shadow-xl overflow-hidden">
          <Search size={14} className="ml-3 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search country..."
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground px-2 py-2.5 w-44 outline-none font-body"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="mr-2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {isOpen && filtered.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl overflow-hidden">
            {filtered.map(country => {
              const count = getEventCount(country);
              return (
                <button
                  key={country}
                  onClick={() => handleSelect(country)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-foreground">{country}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-display font-bold text-event-disease">
                      {count} event{count > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountrySearch;
