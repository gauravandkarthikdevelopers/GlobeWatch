import { useState } from 'react';
import { INDUSTRY_PROFILES, IndustryProfile } from '@/data/industryProfiles';
import { EventCategory, EVENT_COLORS, EVENT_LABELS, GlobalEvent } from '@/types/events';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, ChevronRight, AlertTriangle, MapPin, X, ChevronLeft } from 'lucide-react';

interface Props {
  events: GlobalEvent[];
  onSelectProfile: (profile: IndustryProfile | null) => void;
  activeProfile: IndustryProfile | null;
  isOpen: boolean;
  onToggle: () => void;
}

const IndustryRiskProfiler = ({ events, onSelectProfile, activeProfile, isOpen, onToggle }: Props) => {
  const getRiskScore = (profile: IndustryProfile): number => {
    return events.filter(e => profile.riskCategories.includes(e.category)).length;
  };

  const getRiskLevel = (score: number): { label: string; className: string } => {
    if (score >= 20) return { label: 'CRITICAL', className: 'text-destructive' };
    if (score >= 10) return { label: 'HIGH', className: 'text-event-disease' };
    if (score >= 5) return { label: 'MODERATE', className: 'text-event-political' };
    return { label: 'LOW', className: 'text-primary' };
  };

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-20 left-4 z-[1001] bg-card/90 backdrop-blur-xl border border-border rounded-lg p-2.5 shadow-xl hover:bg-accent transition-colors"
          title="Industry Risk Profiler"
        >
          <Factory size={16} className="text-primary" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute top-0 left-0 z-[1002] h-full w-80 bg-card/95 backdrop-blur-xl border-r border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-primary" />
                <h2 className="font-display text-xs font-bold tracking-wider uppercase text-foreground">
                  Industry Risk
                </h2>
              </div>
              <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Profiles list */}
            <div className="flex-1 overflow-y-auto">
              {activeProfile ? (
                <div className="animate-fade-in">
                  {/* Back button */}
                  <button
                    onClick={() => onSelectProfile(null)}
                    className="flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full border-b border-border"
                  >
                    <ChevronLeft size={12} />
                    <span>All Industries</span>
                  </button>

                  {/* Profile detail */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activeProfile.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{activeProfile.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{activeProfile.description}</p>
                      </div>
                    </div>

                    {/* Risk score */}
                    <div className="bg-accent/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Risk Level</span>
                        <span className={`text-xs font-display font-bold ${getRiskLevel(getRiskScore(activeProfile)).className}`}>
                          {getRiskLevel(getRiskScore(activeProfile)).label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} style={{ color: activeProfile.color }} />
                        <span className="text-lg font-display font-bold text-foreground">
                          {getRiskScore(activeProfile)}
                        </span>
                        <span className="text-xs text-muted-foreground">active threats</span>
                      </div>
                    </div>

                    {/* Relevant categories */}
                    <div>
                      <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground block mb-2">
                        Monitored Threats
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProfile.riskCategories.map(cat => {
                          const count = events.filter(e => e.category === cat).length;
                          return (
                            <div
                              key={cat}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/50 border border-border"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS[cat] }} />
                              <span className="text-[10px] text-foreground/80">{EVENT_LABELS[cat]}</span>
                              <span className="text-[10px] font-display font-bold text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key regions */}
                    <div>
                      <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground block mb-2">
                        Key Supply Chain Regions
                      </span>
                      <div className="space-y-1">
                        {activeProfile.keyRegions.map(region => {
                          const regionEvents = events.filter(e =>
                            e.country?.toLowerCase().includes(region.toLowerCase())
                          ).length;
                          return (
                            <div
                              key={region}
                              className="flex items-center justify-between px-2 py-1.5 rounded bg-background/30"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin size={10} className="text-muted-foreground" />
                                <span className="text-xs text-foreground/80">{region}</span>
                              </div>
                              {regionEvents > 0 && (
                                <span className="text-[10px] font-display font-bold text-event-disease">
                                  {regionEvents} alert{regionEvents > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {INDUSTRY_PROFILES.map(profile => {
                    const score = getRiskScore(profile);
                    const risk = getRiskLevel(score);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => onSelectProfile(profile)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        <span className="text-lg">{profile.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{profile.name}</span>
                            <span className={`text-[10px] font-display font-bold ${risk.className}`}>
                              {risk.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{score} threats</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <div className="flex gap-0.5">
                              {profile.riskCategories.slice(0, 3).map(cat => (
                                <span
                                  key={cat}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: EVENT_COLORS[cat] }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default IndustryRiskProfiler;
