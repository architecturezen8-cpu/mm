'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Card from '@/components/ui/lux-card';

/* ─── Types ─── */
interface CountryFeature {
  n: string;
  d: string;
  c: [number, number];
}

/* ─── ISO2 → [latitude, longitude] mapping ─── */
const COUNTRY_CENTERS: Record<string, [number, number]> = {
  LK: [7.8731, 80.7718], IN: [20.5937, 78.9629], US: [37.0902, -95.7129],
  GB: [55.3781, -3.4360], AU: [-25.2744, 133.7751], CA: [56.1304, -106.3468],
  DE: [51.1657, 10.4515], FR: [46.2276, 2.2137], JP: [36.2048, 138.2529],
  CN: [35.8617, 104.1954], BR: [-14.2350, -51.9253], RU: [61.5240, 105.3188],
  ZA: [-30.5595, 22.9375], MX: [23.6345, -102.5528], KR: [35.9078, 127.7669],
  IT: [41.8719, 12.5674], ES: [40.4637, -3.7492], NL: [52.1326, 5.2913],
  SE: [60.1282, 18.6435], NO: [60.4720, 8.4689], NZ: [-40.9006, 174.8860],
  SG: [1.3521, 103.8198], MY: [4.2105, 101.9758], TH: [15.8700, 100.9925],
  ID: [-0.7893, 113.9213], AE: [23.4241, 53.8478], SA: [23.8859, 45.0792],
  PK: [30.3753, 69.3451], BD: [23.6850, 90.3563], NG: [9.0820, 8.6753],
  KE: [-0.0236, 37.9062], EG: [26.8206, 30.8025], TR: [38.9637, 35.2433],
  IL: [31.0461, 34.8516], AR: [-38.4161, -63.6167], CL: [-35.6751, -71.5430],
  CO: [4.5709, -74.2973], PE: [-9.1900, -75.0152], VE: [6.4238, -66.5897],
  PH: [12.8797, 121.7740], VN: [14.0583, 108.2772], IE: [53.1424, -7.6921],
  CH: [46.8182, 8.2275], AT: [47.5162, 14.5501], BE: [50.5039, 4.4699],
  PT: [39.3999, -8.2245], PL: [51.9194, 19.1451], CZ: [49.8175, 15.4730],
  GR: [39.0742, 21.8243], DK: [56.2639, 9.5018], FI: [61.9241, 25.7482],
  UA: [48.3794, 31.1656], RO: [45.9432, 24.9668], HU: [47.1625, 19.5033],
  TW: [23.6978, 120.9605], HK: [22.3964, 114.1095], KW: [29.3759, 47.9774],
  QA: [25.3548, 51.1839], BH: [26.0667, 50.5577], OM: [21.4735, 55.9754],
  JO: [30.5852, 36.2384], LB: [33.8547, 35.8623], IQ: [33.2232, 43.6793],
  IR: [32.4279, 53.6880], AF: [33.9391, 67.7100], NP: [28.3949, 84.1240],
  MM: [21.9139, 95.9560], KH: [12.5657, 104.9910], TZ: [-6.3690, 34.8888],
  GH: [7.9465, -1.0232], ET: [9.1450, 40.4897], DZ: [28.0339, 1.6596],
  MA: [31.7917, -7.0926], TN: [33.8869, 9.5375], LY: [26.3351, 17.2283],
  SD: [12.8628, 30.2176], UG: [1.3733, 32.2903], MW: [-13.2543, 34.3015],
  ZM: [-13.1339, 27.8493], ZW: [-19.0154, 29.1549], MZ: [-18.6657, 35.5296],
  AO: [-11.2027, 17.8739], CM: [7.3697, 12.3547], SN: [14.4974, -14.4524],
  CI: [7.5400, -5.5471], NE: [17.6078, 8.0817], ML: [17.5707, -4.0147],
  BF: [12.2383, -1.5616], BJ: [9.3077, 2.3158], TG: [8.6195, 0.8248],
  GN: [9.9456, -9.6966], LR: [6.4281, -9.4295], SL: [8.4606, -11.7799],
  MR: [21.0079, -10.9408], GQ: [1.6508, 10.2679], GA: [-0.8037, 11.601],
  CG: [-0.2280, 15.8277], CD: [-4.0383, 21.7587], SO: [5.1521, 46.1996],
  ER: [15.1794, 39.7823], DJ: [11.8251, 42.5901], RW: [-1.9403, 29.8739],
  BI: [-3.3731, 29.9189], LS: [-29.6099, 28.2338], SZ: [-26.5225, 31.4659],
  BW: [-22.3285, 24.6849], NA: [-22.9576, 18.4904], MG: [-18.7669, 46.8691],
  MU: [-20.3484, 57.5522], FJ: [-17.7134, 178.0650], PG: [-6.3149, 143.9556],
  SB: [-9.6457, 160.1562], IS: [64.9631, -19.0208], CU: [21.5218, -77.7812],
  JM: [18.1096, -77.2975], HT: [18.9712, -72.2852], DO: [18.7357, -70.1627],
  TT: [10.6918, -61.2225], PA: [8.5380, -80.7822], CR: [9.7489, -83.7534],
  HN: [15.2000, -86.2419], SV: [13.7942, -88.8965], GT: [15.7835, -90.2308],
  BZ: [17.1899, -88.4976], NI: [12.8654, -85.2072], EC: [-1.8312, -78.1834],
  BO: [-16.2902, -63.5887], PY: [-23.4425, -58.4438], UY: [-32.5228, -55.7658],
  GE: [42.3154, 43.3569], AM: [40.0691, 45.0382], AZ: [40.1431, 47.5769],
  KZ: [48.0196, 66.9237], UZ: [41.3775, 64.5853], TM: [38.9697, 59.5563],
  KG: [41.2044, 74.7661], TJ: [38.8610, 71.2761], MN: [46.8625, 103.8467],
  KP: [40.3399, 127.5101], LA: [19.8563, 102.4955], BN: [4.5353, 114.7277],
  TL: [-8.8742, 125.7275], MV: [3.2028, 73.2207], BT: [27.5142, 90.4336],
  CF: [6.6111, 20.9394], TD: [15.4542, 18.7322], GM: [13.4432, -15.3101],
  GW: [11.8037, -15.1804], CV: [16.0021, -24.0132], ST: [0.1864, 6.6131],
  KM: [-11.8750, 43.8722], SC: [-4.6796, 55.4920], GL: [71.7069, -42.6043],
  BS: [25.0343, -77.3963], BB: [13.1939, -59.5432], AG: [17.0608, -61.7964],
  DM: [15.4150, -61.3710], GD: [12.2628, -61.6042], KN: [17.3578, -62.7830],
  LC: [13.9094, -60.9789], VC: [12.9843, -61.2872], SR: [3.9193, -56.0278],
  GY: [4.8604, -58.9332], PS: [31.9522, 35.2332], CY: [35.1264, 33.4299],
  MT: [35.9375, 14.3754], LU: [49.8153, 6.1296], LI: [47.1660, 9.5554],
  MC: [43.7503, 7.4128], SM: [43.9424, 12.4578], VA: [41.9029, 12.4534],
  AD: [42.5462, 1.6016], MD: [47.4116, 28.3699], BY: [53.7098, 27.9534],
  LT: [55.1694, 23.8813], LV: [56.8796, 24.6032], EE: [58.5953, 25.0136],
  SK: [48.6690, 19.6990], SI: [46.1512, 14.9955], HR: [45.1000, 15.2000],
  RS: [44.0165, 21.0059], ME: [42.7087, 19.3744], BA: [43.9159, 17.6791],
  MK: [41.6086, 21.7453], AL: [41.1533, 20.1683], BG: [42.7339, 25.4858],
  XK: [42.6026, 20.9030], EH: [23.4162, -12.8858], PR: [18.2208, -66.5901],
  KY: [19.3133, -81.2546], BM: [32.3214, -64.7574], VI: [18.3358, -64.8963],
  GP: [16.9970, -62.0676], MQ: [14.6415, -61.0242], RE: [-21.1151, 55.5364],
  YT: [-12.8275, 45.1662], WF: [-13.7688, -177.1565], PF: [-17.6797, -149.4068],
  NC: [-22.2674, 166.4580],
};

interface ViewerMapAPIResponse {
  countries: Record<string, number>;
  total: number;
  yourCountry: string;
}

/* ─── ISO2 → flag emoji ─── */
function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🌐';
  const base = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  return (
    String.fromCodePoint(base + iso2.toUpperCase().charCodeAt(0) - A) +
    String.fromCodePoint(base + iso2.toUpperCase().charCodeAt(1) - A)
  );
}

/* ─── Smooth count-up hook ─── */
function useAnimatedCount(target: number, durationMs = 1200) {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    let rafId = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const v = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setValue(v);
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return value;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/* ─── Dot radius (sqrt scaling = area-proportional) ─── */
function getDotRadius(viewers: number, isUser: boolean, maxViewers: number): number {
  const min = 4;
  const max = isUser ? 14 : 11;
  if (maxViewers <= 0) return min;
  const t = Math.sqrt(viewers / maxViewers);
  return Math.max(min, min + t * (max - min));
}

/* ─── Module-level world map cache ─── */
let worldMapPromise: Promise<Record<string, CountryFeature>> | null = null;
function loadWorldMap(): Promise<Record<string, CountryFeature>> {
  if (!worldMapPromise) {
    worldMapPromise = fetch('/data/world-map.json', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({} as Record<string, CountryFeature>));
  }
  return worldMapPromise;
}

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ═══════════════════════════════════════════
   LEAFLET MAP (dynamically imported — no SSR)
   ═══════════════════════════════════════════ */

interface ViewerDot {
  iso: string;
  viewers: number;
  feature: CountryFeature;
  latlng: [number, number];
  isUser: boolean;
  radius: number;
}

interface LeafletMapProps {
  viewerDots: ViewerDot[];
  hoveredISO: string | null;
  setHoveredISO: (iso: string | null) => void;
}

/* ─── Map dots with hover & pulse animation ─── */
function MapDots({
  viewerDots,
  hoveredISO,
  setHoveredISO,
}: {
  viewerDots: ViewerDot[];
  hoveredISO: string | null;
  setHoveredISO: (iso: string | null) => void;
}) {
  const { CircleMarker, Tooltip } = require('react-leaflet'); // eslint-disable-line @typescript-eslint/no-require-imports

  return (
    <>
      {viewerDots.map(({ iso, feature, isUser, viewers, radius, latlng }: ViewerDot) => {
        const isHovered = hoveredISO === iso;

        return (
          <CircleMarker
            key={iso}
            center={latlng}
            radius={radius}
            pathOptions={{
              fillColor: isUser ? '#F87171' : isHovered ? '#FFD700' : '#FFC300',
              fillOpacity: isHovered ? 1 : 0.85,
              color: isUser ? '#EF4444' : isHovered ? '#FFD700' : '#FFC300',
              weight: isUser ? 2.5 : isHovered ? 2 : 1,
              opacity: isUser ? 0.9 : isHovered ? 0.9 : 0.5,
            }}
            eventHandlers={{
              mouseover: () => setHoveredISO(iso),
              mouseout: () => setHoveredISO(null),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              className="map-tooltip"
              permanent={false}
            >
              <div style={{ fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{flagEmoji(iso)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#E8E6E3', letterSpacing: '0.5px' }}>{feature.n}</span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isUser ? '#EF4444' : '#FFC300',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: isUser ? '#F87171' : '#FFC300', fontVariantNumeric: 'tabular-nums' }}>
                    {formatNumber(viewers)}
                    <span style={{ color: '#8A8780', fontWeight: 400, marginLeft: 4 }}>{viewers === 1 ? 'viewer' : 'viewers'}</span>
                  </span>
                </div>
                {isUser && (
                  <div style={{ marginTop: 4, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5, color: '#EF4444', fontWeight: 600 }}>
                    ★ You are here
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Pulsing ring only for the USER's dot — lightweight on mobile */}
      {viewerDots.filter(d => d.isUser).map(({ iso, radius, latlng }: ViewerDot) => (
        <CircleMarker
          key={`${iso}-pulse`}
          center={latlng}
          radius={radius + 4}
          pathOptions={{
            fillColor: 'transparent',
            fillOpacity: 0,
            color: '#EF4444',
            weight: 1.5,
            opacity: 0.6,
            className: 'user-dot-pulse',
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

function LeafletMapInner({ viewerDots, hoveredISO, setHoveredISO }: LeafletMapProps) {
  const { MapContainer, TileLayer } = require('react-leaflet'); // eslint-disable-line @typescript-eslint/no-require-imports

  return (
    <>
      {/* Minimal CSS — only user pulse ring for mobile performance */}
      <style>{`
        @keyframes mapPulseRing {
          0% { stroke-opacity: 0.7; stroke-width: 2; }
          100% { stroke-opacity: 0; stroke-width: 6; }
        }
        .user-dot-pulse {
          animation: mapPulseRing 1.5s ease-out infinite;
        }
        /* GPU-accelerated map container */
        .watch-party-map .leaflet-tile-pane {
          will-change: transform;
        }
        .watch-party-map .leaflet-overlay-pane svg {
          will-change: transform;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#0a0a12' }}
        className="watch-party-map"
      >
        {/* Dark base layer with country outlines visible */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          opacity={0.85}
        />
        <MapDots
          viewerDots={viewerDots}
          hoveredISO={hoveredISO}
          setHoveredISO={setHoveredISO}
        />
      </MapContainer>
    </>
  );
}

/* ─── Dynamic wrapper to avoid SSR ─── */
const LeafletMap = dynamic(() => Promise.resolve(LeafletMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[2/1] bg-lux-surface rounded-sm animate-pulse" />
  ),
});

/* ═══════════════════════════════════════════
   LIGHTWEIGHT PREVIEW (shown before map loads)
   ═══════════════════════════════════════════ */
function MapPreviewCard({
  totalViewers,
  topCountries,
  userCountry,
  viewerDots,
  isLoading,
  onLoadMap,
}: {
  totalViewers: number;
  topCountries: ViewerDot[];
  userCountry: string;
  viewerDots: ViewerDot[];
  isLoading: boolean;
  onLoadMap: () => void;
}) {
  const animatedTotal = useAnimatedCount(totalViewers);

  return (
    <Card delay={0.15}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        {/* HEADER */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
          <div className="card-title mb-0">
            <span className="icon">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </span>
            Watch Party
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FB06A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8FB06A]" />
            </span>
            <span className="text-[11px] sm:text-[12px] font-semibold tracking-wide text-text-primary tabular-nums">
              {isLoading ? (
                <span className="inline-block w-16 h-3 bg-lux-surface rounded animate-pulse" />
              ) : (
                <>
                  {formatNumber(animatedTotal)}
                  <span className="text-text-secondary font-normal ml-1">watching</span>
                </>
              )}
            </span>
          </div>
        </motion.div>

        {/* MAP PREVIEW PLACEHOLDER — lightweight, no tiles loaded */}
        <motion.div variants={itemVariants} className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/5" style={{ height: 0, paddingBottom: '50%' }}>
            {/* Dark background with minimal dots only */}
            <div className="absolute inset-0 bg-[#0a0a12]">
              {/* Simple SVG dots — no tile loading, no Leaflet */}
              <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Subtle grid lines for visual texture */}
                <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="400" y1="0" x2="400" y2="400" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                {/* Country dots — lightweight SVG circles */}
                {viewerDots.map(({ iso, viewers, isUser, latlng }) => {
                  // Simple Mercator projection for preview
                  const x = ((latlng[1] + 180) / 360) * 800;
                  const latRad = (latlng[0] * Math.PI) / 180;
                  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
                  const y = 200 - (mercN / Math.PI) * 200;
                  const r = isUser ? 6 : Math.max(3, Math.sqrt(viewers / Math.max(1, viewerDots[0]?.viewers || 1)) * 8);

                  return (
                    <g key={iso}>
                      {/* Glow effect for dots */}
                      <circle cx={x} cy={y} r={r + 3} fill={isUser ? 'rgba(248,113,113,0.15)' : 'rgba(255,195,0,0.08)'} />
                      {/* Main dot */}
                      <circle cx={x} cy={y} r={r} fill={isUser ? '#F87171' : '#FFC300'} opacity={isUser ? 1 : 0.7} />
                      {/* User pulse indicator */}
                      {isUser && (
                        <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.5">
                          <animate attributeName="r" from={r + 2} to={r + 10} dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* "View Interactive Map" overlay button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <button
                  onClick={onLoadMap}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/50 transition-all duration-300"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-[2px] font-bold text-gold">
                    View Interactive Map
                  </span>
                </button>
              </div>
            </div>

            {/* Legend overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-3 px-2.5 py-1.5 rounded-sm bg-black/40 backdrop-blur-sm border border-white/5 z-[1000]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FFC300] shadow-[0_0_4px_rgba(255,195,0,0.8)]" />
                <span className="text-[8px] uppercase tracking-[1.5px] text-text-muted">Viewers</span>
              </div>
              {userCountry && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#F87171] shadow-[0_0_4px_rgba(248,113,113,0.8)]" />
                  <span className="text-[8px] uppercase tracking-[1.5px] text-text-muted">You</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* TOP COUNTRIES */}
        {!isLoading && topCountries.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="text-[9px] uppercase tracking-[2px] text-text-muted/60 mb-2 font-semibold">Top Countries</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {topCountries.map(({ iso, viewers, feature, isUser }, i) => (
                <motion.div
                  key={iso}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: isUser ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-sm leading-none">{flagEmoji(iso)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-text-primary truncate tracking-wide">{feature.n}</div>
                    <div className="text-[9px] tabular-nums" style={{ color: isUser ? '#F87171' : '#FFC300' }}>
                      {formatNumber(viewers)}
                      {isUser && <span className="ml-1 text-[#F87171]">· you</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT — Lazy map with preview
   ═══════════════════════════════════════════ */
export default function WatchPartyMapCard() {
  const [data, setData] = useState<{
    countries: Record<string, number>;
    totalViewers: number;
    userCountry: string;
  } | null>(null);
  const [worldMap, setWorldMap] = useState<Record<string, CountryFeature> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredISO, setHoveredISO] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  useEffect(() => {
    loadWorldMap().then(setWorldMap);
  }, []);

  // Delay map mount slightly for smooth animation
  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const fetchViewerMap = useCallback(async () => {
    try {
      const res = await fetch('/api/viewer-map', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const json: ViewerMapAPIResponse = await res.json();

      // Fallback demo data when KV is not available (sandbox/dev)
      if (!json.countries || Object.keys(json.countries).length === 0) {
        json.countries = {
          LK: 3420, IN: 8500, US: 4200, GB: 2100, AU: 1800,
          CA: 1500, DE: 980, JP: 720, SG: 560, MY: 480,
          AE: 390, SA: 320, PK: 280, BD: 240, NZ: 190,
        };
        json.total = Object.values(json.countries).reduce((a, b) => a + b, 0);
      }

      setData({
        countries: json.countries || {},
        totalViewers: json.total || 0,
        userCountry: json.yourCountry || '',
      });
      setError(null);
    } catch {
      setError('Could not load viewer map');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViewerMap();
    const id = setInterval(fetchViewerMap, 30_000);
    return () => clearInterval(id);
  }, [fetchViewerMap]);

  const viewerDots = useMemo(() => {
    if (!data) return [];
    const max = Math.max(1, ...Object.values(data.countries));
    return Object.entries(data.countries)
      .map(([iso, viewers]) => {
        const feature = worldMap?.[iso];
        const latlng = COUNTRY_CENTERS[iso];
        if (!latlng) return null;
        return {
          iso,
          viewers,
          feature: feature || { n: iso, d: '', c: [0, 0] },
          latlng,
          isUser: iso === data.userCountry,
          radius: getDotRadius(viewers, iso === data.userCountry, max),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.viewers - a.viewers) as ViewerDot[];
  }, [data, worldMap]);

  const targetTotal = data?.totalViewers ?? 0;
  const topCountries = useMemo(() => viewerDots.slice(0, 6), [viewerDots]);
  const animatedTotal = useAnimatedCount(targetTotal);

  // If user hasn't clicked "View Interactive Map", show the lightweight preview
  if (!showInteractiveMap) {
    return (
      <MapPreviewCard
        totalViewers={targetTotal}
        topCountries={topCountries}
        userCountry={data?.userCountry || ''}
        viewerDots={viewerDots}
        isLoading={isLoading}
        onLoadMap={() => setShowInteractiveMap(true)}
      />
    );
  }

  return (
    <Card delay={0.15}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        {/* HEADER */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
          <div className="card-title mb-0">
            <span className="icon">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </span>
            Watch Party
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FB06A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8FB06A]" />
            </span>
            <span className="text-[11px] sm:text-[12px] font-semibold tracking-wide text-text-primary tabular-nums">
              {formatNumber(animatedTotal)}
              <span className="text-text-secondary font-normal ml-1">watching</span>
            </span>
          </div>
        </motion.div>

        {/* INTERACTIVE MAP */}
        <motion.div variants={itemVariants} className="relative">
          {isLoading || !worldMap ? (
            <div className="w-full aspect-[2/1] bg-lux-surface rounded-sm animate-pulse" />
          ) : error ? (
            <div className="w-full aspect-[2/1] bg-lux-surface rounded-sm flex items-center justify-center">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/60">Map unavailable</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-sm border border-white/5" style={{ height: 0, paddingBottom: '50%' }}>
              {mapReady && data && (
                <LeafletMap
                  viewerDots={viewerDots}
                  hoveredISO={hoveredISO}
                  setHoveredISO={setHoveredISO}
                />
              )}

              {/* Legend overlay */}
              <div className="absolute bottom-2 right-2 flex items-center gap-3 px-2.5 py-1.5 rounded-sm bg-black/40 backdrop-blur-sm border border-white/5 z-[1000]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFC300] shadow-[0_0_4px_rgba(255,195,0,0.8)]" />
                  <span className="text-[8px] uppercase tracking-[1.5px] text-text-muted">Viewers</span>
                </div>
                {data?.userCountry && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#F87171] shadow-[0_0_4px_rgba(248,113,113,0.8)]" />
                    <span className="text-[8px] uppercase tracking-[1.5px] text-text-muted">You</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* TOP COUNTRIES */}
        {!isLoading && !error && topCountries.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="text-[9px] uppercase tracking-[2px] text-text-muted/60 mb-2 font-semibold">Top Countries</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {topCountries.map(({ iso, viewers, feature, isUser }, i) => (
                <motion.button
                  key={iso}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                  onPointerEnter={() => setHoveredISO(iso)}
                  onPointerLeave={() => setHoveredISO(null)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border transition-colors text-left"
                  style={{
                    background: hoveredISO === iso ? 'rgba(255,195,0,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: isUser ? 'rgba(239,68,68,0.3)' : hoveredISO === iso ? 'rgba(255,195,0,0.3)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-sm leading-none">{flagEmoji(iso)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-text-primary truncate tracking-wide">{feature.n}</div>
                    <div className="text-[9px] tabular-nums" style={{ color: isUser ? '#F87171' : '#FFC300' }}>
                      {formatNumber(viewers)}
                      {isUser && <span className="ml-1 text-[#F87171]">· you</span>}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </Card>
  );
}
