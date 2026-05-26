'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent, getContentString, getContentNumber } from '@/lib/useSectionContent';

// ─── Types ───
interface ForecastDay {
  day: string;
  date: string;
  isoDate?: string;
  weatherCode: number;
  condition: string;
  high: number;
  low: number;
  rainProbability: number;
  humidity: number;
  wind: number;
}

interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weatherCode: number;
  condition: string;
  rain_probability: number;
  uv_index: number;
  location: string;
}

// ─── WMO Code → condition text ───
function getCondition(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Dense Drizzle', 61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
    80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm',
  };
  return map[code] || 'Unknown';
}

function isRainy(code: number): boolean {
  return [51,53,55,61,63,65,80,81,82,95,96,99].includes(code);
}

function isCloudy(code: number): boolean {
  return [2,3,45,48].includes(code);
}

function isClear(code: number): boolean {
  return [0,1].includes(code);
}

// ─── Custom SVG Weather Icons ───
function WeatherIcon({ code, size = 40, className = '' }: { code: number; size?: number; className?: string }) {
  const id = `wi-${Math.random().toString(36).slice(2,8)}`;

  if (isClear(code)) return <SunIcon id={id} size={size} className={className} />;
  if (code === 2) return <PartlyCloudyIcon id={id} size={size} className={className} />;
  if (code === 3) return <CloudIcon id={id} size={size} className={className} />;
  if ([45, 48].includes(code)) return <FogIcon id={id} size={size} className={className} />;
  if ([51, 53, 55].includes(code)) return <DrizzleIcon id={id} size={size} className={className} />;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return <RainIcon id={id} size={size} className={className} />;
  if ([71, 73, 75].includes(code)) return <SnowIcon id={id} size={size} className={className} />;
  if ([95, 96, 99].includes(code)) return <ThunderIcon id={id} size={size} className={className} />;
  return <PartlyCloudyIcon id={id} size={size} className={className} />;
}

function SunIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <defs>
        <radialGradient id={`sun-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FFC300" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="14" fill={`url(#sun-${id})`} />
      {[0,45,90,135,180,225,270,315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 32 + Math.cos(rad) * 18;
        const y1 = 32 + Math.sin(rad) * 18;
        const x2 = 32 + Math.cos(rad) * 24;
        const y2 = 32 + Math.sin(rad) * 24;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFC300" strokeWidth="2.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function CloudShape({ x, y, scale = 1, color = '#8A8780' }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M8 22c-4.4 0-8-3.1-8-7s3.6-7 8-7c.4-3.5 3.8-6.5 8-6.5 3.9 0 7.2 2.5 8 5.8.4-.1.7-.1 1-.1 4.4 0 8 3.1 8 7s-3.6 7-8 7H8z" fill={color} />
    </g>
  );
}

function PartlyCloudyIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <defs>
        <radialGradient id={`pc-sun-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FFC300" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="22" r="10" fill={`url(#pc-sun-${id})`} />
      {[0,60,120,180,240,300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 13;
        const y1 = 22 + Math.sin(rad) * 13;
        const x2 = 24 + Math.cos(rad) * 17;
        const y2 = 22 + Math.sin(rad) * 17;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />;
      })}
      <CloudShape x={16} y={26} scale={1.1} color="#A0A0A0" />
    </svg>
  );
}

function CloudIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={8} y={18} scale={1.3} color="#8A8780" />
    </svg>
  );
}

function FogIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={12} y={14} scale={1} color="#8A8780" />
      {[24, 32, 40].map((y, i) => (
        <line key={i} x1="10" y1={y} x2="54" y2={y} stroke="#8A8780" strokeWidth="2" strokeLinecap="round" opacity={0.6 - i * 0.15} />
      ))}
    </svg>
  );
}

function DrizzleIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={10} y={12} scale={1.2} color="#7A8A9A" />
      {[22, 34, 46].map((x, i) => (
        <motion.line key={i} x1={x} y1={38} x2={x - 4} y2={48} stroke="#5B9BD5" strokeWidth="1.5" strokeLinecap="round"
          animate={{ opacity: [0.3, 1, 0.3], y1: [38, 40, 38], y2: [48, 50, 48] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </svg>
  );
}

function RainIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={8} y={8} scale={1.3} color="#6A7A8A" />
      {[18, 30, 42].map((x, i) => (
        <motion.line key={i} x1={x} y1={36} x2={x - 6} y2={50} stroke="#4A8BD5" strokeWidth="2.5" strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4], y1: [36, 38, 36], y2: [50, 52, 50] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
    </svg>
  );
}

function SnowIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={8} y={8} scale={1.3} color="#8A8A9A" />
      {[20, 34, 46].map((x, i) => (
        <motion.circle key={i} cx={x} cy={42 + i * 4} r="2" fill="#C0D8F0"
          animate={{ opacity: [0.3, 1, 0.3], cy: [42 + i * 4, 44 + i * 4, 42 + i * 4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </svg>
  );
}

function ThunderIcon({ id, size, className }: { id: string; size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <CloudShape x={8} y={6} scale={1.3} color="#5A6A7A" />
      <motion.polygon
        points="30,34 24,46 30,46 26,58 38,42 32,42 36,34"
        fill="#FFC300"
        animate={{ opacity: [1, 0.3, 1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.1, 0.2, 0.5, 1] }}
      />
      {[18, 42].map((x, i) => (
        <motion.line key={i} x1={x} y1={38} x2={x - 4} y2={50} stroke="#4A8BD5" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </svg>
  );
}

// ─── Offline state ───
const offlineWeather: CurrentWeather = {
  temp: 0, feels_like: 0, humidity: 0, wind_speed: 0,
  weatherCode: 3, condition: 'Offline', rain_probability: 0, uv_index: 0, location: 'Matale',
};

// ─── Venue defaults ───
const defaultAdvisoryContent = {
  heading: 'Match Day Advisory',
  match_date: '2026-05-15',
  match_time_label: '09:00 SST',
};

const defaultVenueContent = {
  heading: 'Venue Conditions',
  venue: "St.Thomas' College Grounds, Matale",
  pitch_type: 'Slow, Spin-Friendly',
  average_first_innings: 265,
  dew_factor: 'High (Evening matches)',
  floodlights: 'Yes',
  capacity: '35,000',
};

// ─── Animations ───
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } } };

// ─── API Cache ───
let cached: { current: CurrentWeather; forecast: ForecastDay[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min cache (aligned with server CDN cache)

// Default match date for advisory if admin has not set one yet.
const DEFAULT_MATCH_DATE = '2026-05-15';

// ─── Advisory helper ───
function getAdvisoryLevel(rain: number, wind: number, temp: number): { level: 'green' | 'yellow' | 'red'; title: string; text: string } {
  if (rain > 60) return {
    level: 'red',
    title: 'Rain Expected — Play Interruptions Likely',
    text: `${rain}% rain probability forecasted. DLS method may apply. Covers will be on standby. Expect possible delays and reduced overs. Teams should prepare for a stop-start scenario.`,
  };
  if (rain > 30 || wind > 30) return {
    level: 'yellow',
    title: 'Moderate Risk — Some Disruption Possible',
    text: `${rain}% rain chance with winds at ${wind} km/h. Brief interruptions possible but a full match is expected. Spinners may get assistance from damp conditions. Batting first after winning the toss could be advantageous.`,
  };
  return {
    level: 'green',
    title: 'Favorable Conditions — Full Match Expected',
    text: `Only ${rain}% rain chance with ${temp}°C temperature. Excellent cricket weather at Matale. Pace bowlers will get carry, batsmen can play their shots. A full day's play is anticipated without weather interruptions.`,
  };
}

// ─── MAIN COMPONENT ───
export default function WeatherTab() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Initialize from cache if available (avoids setState-in-effect for cached data)
  const [current, setCurrent] = useState<CurrentWeather | null>(
    (cached && Date.now() - cached.timestamp < CACHE_TTL) ? cached.current : null
  );
  const [forecast, setForecast] = useState<ForecastDay[]>(
    (cached && Date.now() - cached.timestamp < CACHE_TTL) ? cached.forecast : []
  );
  const [isLive, setIsLive] = useState<boolean | null>(
    (cached && Date.now() - cached.timestamp < CACHE_TTL) ? true : null
  );
  const hasFetched = useRef(false);


  // ─── Fetch weather data (only if no cached data was available) ───
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // If we already initialized from fresh cache, skip the fetch
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return;

    const URL = '/api/weather';

    fetch(URL)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const c = data.current;
        const parsed: CurrentWeather = {
          temp: Math.round(c?.temperature_2m ?? 0),
          feels_like: Math.round(c?.apparent_temperature ?? 0),
          humidity: Math.round(c?.relative_humidity_2m ?? 0),
          wind_speed: Math.round(c?.wind_speed_10m ?? 0),
          weatherCode: c?.weather_code ?? 3,
          condition: getCondition(c?.weather_code ?? 3),
          rain_probability: Math.round(c?.precipitation_probability ?? 0),
          uv_index: Math.round((c?.uv_index ?? 0) * 10) / 10,
          location: 'Matale',
        };

        const d = data.daily;
        const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const pf: ForecastDay[] = [];
        if (d?.time) {
          for (let i = 0; i < d.time.length; i++) {
            const dt = new Date(d.time[i] + 'T00:00:00');
            pf.push({
              day: names[dt.getDay()],
              date: `${dt.toLocaleString('en-US',{month:'short'})} ${dt.getDate()}`,
              isoDate: d.time[i],
              weatherCode: d.weather_code?.[i] ?? 2,
              condition: getCondition(d.weather_code?.[i] ?? 2),
              high: Math.round(d.temperature_2m_max?.[i] ?? 0),
              low: Math.round(d.temperature_2m_min?.[i] ?? 0),
              rainProbability: Math.round(d.precipitation_probability_max?.[i] ?? 0),
              humidity: Math.round(d.relative_humidity_2m_max?.[i] ?? 0),
              wind: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
            });
          }
        }

        cached = { current: parsed, forecast: pf, timestamp: Date.now() };
        setCurrent(parsed);
        setForecast(pf);
        setIsLive(true);
      })
      .catch(() => {
        setCurrent(offlineWeather);
        setForecast([]);
        setIsLive(false);
      });
  }, []);

  const isOffline = isLive === false;
  const w = current || offlineWeather;

  // ─── Match Day Advisory (admin editable) ───
  const advisoryContent = useSectionContent('weather-advisory', { ...defaultAdvisoryContent });
  const advisoryHeading = getContentString(advisoryContent, 'heading', defaultAdvisoryContent.heading);
  const matchDate = getContentString(advisoryContent, 'match_date', DEFAULT_MATCH_DATE).split('T')[0];
  const matchTimeLabel = getContentString(advisoryContent, 'match_time_label', defaultAdvisoryContent.match_time_label);

  // Find match day in forecast (admin-selected date). Open-Meteo supports up to 16 days;
  // if admin selects outside that range, use the closest available day so the report still renders.
  const exactMatchDayData = forecast.find(f => f.isoDate === matchDate) || null;
  const selectedMatchTime = new Date(`${matchDate}T00:00:00`).getTime();
  const closestMatchDayData = forecast.length > 0
    ? forecast.reduce((best, day) => {
        const bestDiff = Math.abs(new Date(`${best.isoDate}T00:00:00`).getTime() - selectedMatchTime);
        const dayDiff = Math.abs(new Date(`${day.isoDate}T00:00:00`).getTime() - selectedMatchTime);
        return dayDiff < bestDiff ? day : best;
      }, forecast[0])
    : null;
  const matchDayData = exactMatchDayData || closestMatchDayData;
  const advisory = matchDayData ? getAdvisoryLevel(matchDayData.rainProbability, matchDayData.wind, matchDayData.high) : null;
  const advisoryUsesClosestDate = !!matchDayData && !exactMatchDayData;

  // ─── Venue (admin editable) ───
  const vc = useSectionContent('weather-venue', { ...defaultVenueContent });
  const venue = getContentString(vc, 'venue', defaultVenueContent.venue);
  const pitchType = getContentString(vc, 'pitch_type', defaultVenueContent.pitch_type);
  const avg1st = getContentNumber(vc, 'average_first_innings', defaultVenueContent.average_first_innings);
  const dewFactor = getContentString(vc, 'dew_factor', defaultVenueContent.dew_factor);
  const floodlights = getContentString(vc, 'floodlights', defaultVenueContent.floodlights);
  const capacity = getContentString(vc, 'capacity', defaultVenueContent.capacity);

  const hasRainWarning = w.rain_probability > 50 || forecast.some(d => d.rainProbability > 50);

  const advisoryColors = {
    green: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    yellow: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
    red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', bar: 'bg-red-500' },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ═══════════════════════════════════════════
          🏏 MATCH DAY ADVISORY — Premium Report
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="weather-advisory" pageId="about" type="weather" title={advisoryHeading}
        content={{ heading: advisoryHeading, match_date: matchDate, match_time_label: matchTimeLabel }}>
      <motion.div variants={item} className="relative overflow-hidden border border-gold/20">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-gold/5 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '-30%', right: '-10%' }}
          />
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-[#E63946]/5 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '-25%', left: '-5%' }}
          />
        </div>

        <div className="relative bg-[#08080c]/95">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-gold/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-gold/30 bg-gold/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" fill="currentColor" fillOpacity="0.15" />
                  <path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gold uppercase tracking-[2px]">{advisoryHeading}</h2>
                <p className="text-[9px] text-text-muted uppercase tracking-[1.5px] mt-0.5">
                  111th Battle of the Golds · {matchDate} · {matchTimeLabel}
                </p>
                {advisoryUsesClosestDate && matchDayData?.isoDate && (
                  <p className="text-[8px] text-amber-400/60 uppercase tracking-[1px] mt-0.5">
                    Using closest available forecast: {matchDayData.isoDate}
                  </p>
                )}
              </div>
            </div>
            <AnimatePresence mode="wait">
              {isLive === null ? (
                <motion.span key="ld" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-lux-surface border border-lux-border text-[8px] uppercase tracking-[2px] text-text-muted">
                  <div className="w-2 h-2 border border-text-muted border-t-transparent rounded-full animate-spin" />Loading
                </motion.span>
              ) : isLive ? (
                <motion.span key="lv" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-[8px] uppercase tracking-[2px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                </motion.span>
              ) : (
                <motion.span key="of" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-[8px] uppercase tracking-[2px] text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Offline
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Advisory body */}
          <div className="px-5 sm:px-6 py-5">
            {matchDayData && !isOffline ? (
              <div className="space-y-5">
                {/* Main row */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <motion.div className="text-center sm:text-left" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <WeatherIcon code={matchDayData.weatherCode} size={72} />
                    <div className="mt-2">
                      <p className="text-3xl sm:text-4xl font-bold text-text-primary">
                        {matchDayData.high}°<span className="text-base text-text-muted">/{matchDayData.low}°</span>
                      </p>
                      <p className="text-xs text-text-secondary uppercase tracking-[2px] mt-1">{matchDayData.condition}</p>
                    </div>
                  </motion.div>

                  {/* Metrics grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3 w-full sm:w-auto">
                    {[
                      { label: 'Rain Chance', value: `${matchDayData.rainProbability}%`, bar: matchDayData.rainProbability, accent: matchDayData.rainProbability > 50 },
                      { label: 'Humidity', value: `${matchDayData.humidity}%`, bar: matchDayData.humidity, accent: false },
                      { label: 'Wind Speed', value: `${matchDayData.wind} km/h`, bar: Math.min(matchDayData.wind * 2, 100), accent: matchDayData.wind > 30 },
                      { label: 'Peak Temp', value: `${matchDayData.high}°C`, bar: (matchDayData.high / 45) * 100, accent: matchDayData.high > 35 },
                    ].map((m, i) => (
                      <motion.div key={m.label} className="bg-lux-surface/80 border border-gold/10 p-3.5"
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                        <p className={`text-lg font-bold ${m.accent ? 'text-red-400' : 'text-text-primary'}`}>{m.value}</p>
                        <p className="text-[8px] uppercase tracking-[2px] text-text-muted mt-0.5">{m.label}</p>
                        <div className="mt-2 h-[2px] bg-lux-elevated overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${m.bar}%` }}
                            transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                            className={`h-full ${m.accent ? 'bg-red-500' : 'bg-gold'}`} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Advisory banner */}
                {advisory && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className={`p-4 border ${advisoryColors[advisory.level].bg} ${advisoryColors[advisory.level].border}`}>
                    <div className="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${advisoryColors[advisory.level].text}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                        {advisory.level === 'green' ? (
                          <><path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></>
                        ) : advisory.level === 'yellow' ? (
                          <><path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" /><path d="M12 9v4M12 17h.01" strokeLinecap="round" /></>
                        ) : (
                          <><path d="M12 2L4 7v6c0 5.25 3.4 10.15 8 11.2C16.6 23.15 20 18.25 20 13V7l-8-5z" /><path d="M12 9v4M12 17h.01" strokeLinecap="round" /></>
                        )}
                      </svg>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[1px] ${advisoryColors[advisory.level].text}`}>{advisory.title}</p>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{advisory.text}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <WeatherIcon code={3} size={56} className="mx-auto opacity-30" />
                <p className="text-text-muted text-xs mt-3 uppercase tracking-[1px]">
                  {isOffline ? 'Weather data unavailable — check back later' : 'Match day forecast available closer to the match date'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-2.5 bg-lux-surface/30 border-t border-gold/10 flex items-center justify-between">
            <span className="text-[8px] text-text-muted uppercase tracking-[1.5px]">Source: Open-Meteo</span>
            <span className="text-[8px] text-text-muted uppercase tracking-[1.5px]">Refresh: 10 min</span>
          </div>
        </div>
      </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          🌤️ CURRENT CONDITIONS
          ═══════════════════════════════════════════ */}
      <motion.div variants={item} className="lux-card-gold">
        <h2 className="card-title">
          <span className="icon">
            <WeatherIcon code={w.weatherCode} size={18} />
          </span>
          Current Conditions — {w.location}
          {isLive === null ? (
            <span className="ml-2 w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin inline-block" />
          ) : isLive ? (
            <span className="ml-2 inline-flex items-center gap-1 text-[8px] text-emerald-400 uppercase tracking-[1px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 text-[8px] text-red-400 uppercase tracking-[1px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Offline
            </span>
          )}
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="text-center sm:text-left flex items-center gap-4">
            <WeatherIcon code={w.weatherCode} size={56} />
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-text-primary">{w.temp}°C</p>
              <p className="text-xs text-text-secondary uppercase tracking-[2px]">{w.condition}</p>
              <p className="text-[10px] text-text-muted mt-1">Feels like {w.feels_like}°C</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 w-full sm:w-auto">
            {[
              { label: 'Humidity', val: `${w.humidity}%`, accent: false },
              { label: 'Wind', val: `${w.wind_speed} km/h`, accent: false },
              { label: 'Rain', val: `${w.rain_probability}%`, accent: w.rain_probability > 50 },
              { label: 'UV Index', val: `${w.uv_index}`, accent: w.uv_index > 8 },
            ].map(m => (
              <div key={m.label} className="bg-lux-surface p-3 text-center">
                <p className={`text-lg font-bold ${m.accent ? 'text-red-400' : m.label === 'Humidity' ? 'text-gold' : 'text-text-primary'}`}>{m.val}</p>
                <p className="text-[8px] uppercase tracking-[2px] text-text-muted">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {hasRainWarning && !isOffline && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="bg-status-negative/10 border border-status-negative/30 p-3 flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-status-negative flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4M12 17h.01M4.93 4.93l14.14 14.14" strokeLinecap="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-status-negative uppercase tracking-[1px]">Weather may affect play</p>
              <p className="text-[10px] text-text-muted mt-0.5">Rain probability exceeds 50%. Covers may be needed.</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════
          📅 5-DAY FORECAST
          ═══════════════════════════════════════════ */}
      {!isOffline && forecast.length > 0 && (
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </span>
            5-Day Forecast
          </h2>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {forecast.map((day, i) => (
              <motion.button key={day.day + day.date} whileHover={{ y: -2 }}
                onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                className={`py-3 sm:py-4 flex flex-col items-center gap-1.5 transition-all border ${
                  selectedDay === i ? 'border-gold bg-gold/5' : 'border-lux-border bg-lux-surface hover:border-lux-border-hover'
                }`}>
                <span className="text-[9px] uppercase tracking-[2px] text-text-muted">{day.day}</span>
                <WeatherIcon code={day.weatherCode} size={28} />
                <span className="text-xs font-bold text-text-primary">{day.high}°</span>
                <span className="text-[10px] text-text-muted">{day.low}°</span>
                <div className="w-full px-2 mt-1">
                  <div className="h-1 bg-lux-elevated overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${day.rainProbability}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full ${day.rainProbability > 50 ? 'bg-status-negative' : 'bg-status-neutral'}`} />
                  </div>
                  <span className={`text-[7px] ${day.rainProbability > 50 ? 'text-status-negative' : 'text-text-muted'}`}>{day.rainProbability}%</span>
                </div>
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {selectedDay !== null && forecast[selectedDay] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-lux-surface p-4">
                <div className="flex items-center gap-3 mb-3">
                  <WeatherIcon code={forecast[selectedDay].weatherCode} size={32} />
                  <h3 className="text-sm font-semibold text-text-primary">
                    {forecast[selectedDay].date} — {forecast[selectedDay].condition}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><p className="text-[9px] uppercase tracking-[2px] text-text-muted">High / Low</p><p className="text-sm font-bold text-text-primary">{forecast[selectedDay].high}° / {forecast[selectedDay].low}°</p></div>
                  <div><p className="text-[9px] uppercase tracking-[2px] text-text-muted">Rain</p><p className={`text-sm font-bold ${forecast[selectedDay].rainProbability > 50 ? 'text-status-negative' : 'text-text-primary'}`}>{forecast[selectedDay].rainProbability}%</p></div>
                  <div><p className="text-[9px] uppercase tracking-[2px] text-text-muted">Humidity</p><p className="text-sm font-bold text-text-primary">{forecast[selectedDay].humidity}%</p></div>
                  <div><p className="text-[9px] uppercase tracking-[2px] text-text-muted">Wind</p><p className="text-sm font-bold text-text-primary">{forecast[selectedDay].wind} km/h</p></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          🏟️ VENUE — Admin Editable
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="weather-venue" pageId="about" type="weather" title="Venue Conditions"
        content={{ heading: 'Venue Conditions', venue, pitch_type: pitchType, average_first_innings: avg1st, dew_factor: dewFactor, floodlights, capacity }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            Venue Conditions
          </h2>
          <div className="space-y-0">
            {[['Venue', venue], ['Pitch Type', pitchType], ['Average 1st Innings', avg1st, true], ['Dew Factor', dewFactor], ['Floodlights', floodlights], ['Capacity', capacity]].map(([label, val, isGold]) => (
              <div key={label as string} className="stat-row">
                <span className="text-text-secondary text-xs">{label as string}</span>
                <span className={`text-xs font-medium ${isGold ? 'text-gold' : 'text-text-primary'}`}>{val}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          LEGEND
          ═══════════════════════════════════════════ */}
      <motion.div variants={item} className="lux-card">
        <h2 className="card-title">
          <span className="icon">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 13h4" strokeLinecap="round" />
            </svg>
          </span>
          Weather Legend
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: 0, label: 'Clear' },
            { code: 2, label: 'Partly Cloudy' },
            { code: 3, label: 'Overcast' },
            { code: 61, label: 'Rain' },
            { code: 95, label: 'Thunderstorm' },
            { code: 45, label: 'Fog' },
            { code: 51, label: 'Drizzle' },
            { code: 71, label: 'Snow' },
          ].map(w => (
            <div key={w.label} className="flex items-center gap-2.5 py-1">
              <WeatherIcon code={w.code} size={22} />
              <span className="text-xs text-text-secondary">{w.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
