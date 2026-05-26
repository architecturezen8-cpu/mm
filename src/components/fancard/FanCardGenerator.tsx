'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import {
  FanCardData,
  School,
  BgColor,
  CardOrientation,
  SCHOOL_INFO,
  BG_PATHS,
  DEFAULT_FAN_CARD,
  DEFAULT_FAN_CARD_TEXT,
  PHOTO_FILTER_PRESETS,
  PhotoFilterPreset,
  getPhotoFilter,
} from './types';
import FanCardPortrait from './FanCardPortrait';
import FanCardLandscape from './FanCardLandscape';
import Card from '@/components/ui/lux-card';
import PremiumIcon from '@/components/PremiumIcon';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent } from '@/lib/useSectionContent';
import {
  Upload,
  Download,
  RotateCcw,
  User,
  ImageIcon,
  Sparkles,
  Loader2,
  Check,
  ZoomIn,
  ZoomOut,
  Move,
  Share2,
  Copy,
  Palette,
} from 'lucide-react';

/* ── Helper: fetch image and convert to data URL (for html2canvas) ── */
async function toDataUrl(src: string): Promise<string> {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (img) => {
      try {
        if ('decode' in img) {
          await img.decode();
          return;
        }
      } catch {
        // Fall back to load/error listeners below.
      }

      if (img.complete) return;

      await new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

function getFanShareUrl(data: FanCardData): string {
  if (typeof window === 'undefined') return '';

  const url = new URL('/', window.location.origin);
  url.searchParams.set('fan', data.name.trim() || 'YOURNAME');
  url.searchParams.set('school', data.school);
  url.searchParams.set('bg', data.bgColor);
  if (data.batch.trim()) url.searchParams.set('batch', data.batch.trim());
  return url.toString();
}

/* ── Preview scale hook ── */
function usePreviewScale(orientation: CardOrientation) {
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const updateScale = () => {
      const padding = window.innerWidth < 640 ? 52 : 80;
      const maxW = window.innerWidth < 640 ? window.innerWidth - padding : 460;
      const maxH = window.innerWidth < 640 ? window.innerHeight * 0.55 : window.innerHeight * 0.65;
      const cardW = orientation === 'portrait' ? 440 : 720;
      const cardH = orientation === 'portrait' ? 690 : 440;
      const scaleW = maxW / cardW;
      const scaleH = maxH / cardH;
      setScale(Math.min(1, scaleW, scaleH));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [orientation]);

  return scale;
}

/* ── Fade-up animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── Main Generator Component ── */
export default function FanCardGenerator() {
  const [cardData, setCardData] = useState<FanCardData>(DEFAULT_FAN_CARD);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showPhotoControls, setShowPhotoControls] = useState(false);
  const rawFanCardText = useSectionContent('legacy-fan-card', DEFAULT_FAN_CARD_TEXT);
  const fanCardText = {
    event_overline: rawFanCardText.event_overline || DEFAULT_FAN_CARD_TEXT.event_overline,
    title_line1: rawFanCardText.title_line1 || DEFAULT_FAN_CARD_TEXT.title_line1,
    title_line2: rawFanCardText.title_line2 || DEFAULT_FAN_CARD_TEXT.title_line2,
    stc_cheers: rawFanCardText.stc_cheers || DEFAULT_FAN_CARD_TEXT.stc_cheers,
    gsc_cheers: rawFanCardText.gsc_cheers || DEFAULT_FAN_CARD_TEXT.gsc_cheers,
    website: rawFanCardText.website || DEFAULT_FAN_CARD_TEXT.website,
    branding_image: rawFanCardText.branding_image || DEFAULT_FAN_CARD_TEXT.branding_image,
  };

  // Refs for HIDDEN off-screen render cards (for pixel-perfect download)
  const renderPortraitRef = useRef<HTMLDivElement>(null);
  const renderLandscapeRef = useRef<HTMLDivElement>(null);

  const previewScale = usePreviewScale(cardData.orientation);

  const updateCard = useCallback((updates: Partial<FanCardData>) => {
    setCardData((prev) => ({ ...prev, ...updates }));
  }, []);

  /* ── QR Code generation ── */
  useEffect(() => {
    const qrValue = getFanShareUrl(cardData);
    if (!qrValue) return;

    QRCode.toDataURL(qrValue, {
      width: 900,
      margin: 6,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [cardData.name, cardData.school, cardData.bgColor, cardData.batch]);

  /* ── Photo upload handler ── */
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file?.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateCard({
          photoUrl: reader.result as string,
          photoZoom: 1,
          photoOffsetX: 0,
          photoOffsetY: 0,
          photoFilterPreset: 'original',
          photoBrightness: 100,
          photoContrast: 100,
          photoSaturation: 100,
          photoHue: 0,
          photoSepia: 0,
        });
        setShowPhotoControls(true);
      };
      reader.readAsDataURL(file);
    },
    [updateCard]
  );

  /* ── Reset handler ── */
  const handleReset = useCallback(() => {
    setCardData(DEFAULT_FAN_CARD);
    setDownloadSuccess(false);
    setShareSuccess(false);
    setShowPhotoControls(false);
  }, []);

  /* ── Download handler — capture the HIDDEN off-screen card with html-to-image ── */
  const handleDownload = useCallback(async () => {
    const renderRef = cardData.orientation === 'portrait' ? renderPortraitRef : renderLandscapeRef;
    const el = renderRef.current;
    if (!el) return;

    let imgs: HTMLImageElement[] = [];
    let origSrcs: string[] = [];

    setIsDownloading(true);
    try {
      // Pre-fetch background and logo as data URLs
      const [bgDataUrl, logoDataUrl] = await Promise.all([
        toDataUrl(BG_PATHS[cardData.bgColor]),
        toDataUrl(SCHOOL_INFO[cardData.school].logo),
      ]);

      // Swap images to data URLs for html2canvas compatibility
      imgs = Array.from(el.querySelectorAll('img'));
      origSrcs = [];
      imgs.forEach((img, i) => {
        origSrcs[i] = img.src;
        if (img.dataset.fancardBg === 'true') img.src = bgDataUrl;
        if (img.dataset.fancardLogo === 'true') img.src = logoDataUrl;
        // QR + Photo already data URLs. Branding is same-origin static PNG.
      });

      // Wait until all swapped/data images and web fonts are fully ready.
      await waitForImages(el);
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const width = cardData.orientation === 'portrait' ? 440 : 720;
      const height = cardData.orientation === 'portrait' ? 690 : 440;

      // Capture the hidden off-screen card with html-to-image.
      // This preserves CSS layout more accurately than html2canvas for graphics-heavy cards.
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        width,
        height,
        backgroundColor: undefined,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: 'none',
        },
      });

      const link = document.createElement('a');
      const safeName = (cardData.name || 'fan').replace(/\s+/g, '-').toLowerCase();
      link.download = `fancard-${safeName}-${cardData.orientation}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      // Always restore preview/render DOM after the html-to-image capture attempt.
      imgs.forEach((img, i) => {
        if (origSrcs[i]) img.src = origSrcs[i];
      });
      setIsDownloading(false);
    }
  }, [cardData.orientation, cardData.name, cardData.bgColor, cardData.school]);

  const handleShare = useCallback(async () => {
    if (!cardData.name.trim()) return;

    const shareUrl = getFanShareUrl(cardData);
    const shareText = `Check out my Battle of the Golds fan card ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Battle of the Golds Fan Card',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2500);
        } catch {
          console.error('Share failed:', err);
        }
      }
    }
  }, [cardData]);

  const school = SCHOOL_INFO[cardData.school];

  return (
    <EditableSection sectionId="legacy-fan-card" pageId="community" type="stats" title="Fan Card Generator" content={{ heading: 'Fan Card Generator', ...fanCardText }}>
      <div className="space-y-4 sm:space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          HIDDEN OFF-SCREEN RENDER CARDS — for pixel-perfect download.
          These are at full size, NO CSS transform parent.
          html2canvas captures from here, not the scaled preview.
          ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <FanCardPortrait ref={renderPortraitRef} data={cardData} qrDataUrl={qrDataUrl} textContent={fanCardText} />
        <FanCardLandscape ref={renderLandscapeRef} data={cardData} qrDataUrl={qrDataUrl} textContent={fanCardText} />
      </div>

      {/* Header */}
      <ScrollReveal animation="fade-up">
        <div className="lux-card text-center py-6 sm:py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-gold">
              <PremiumIcon name="star" className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[2px] sm:tracking-[3px] text-text-muted">
              Official Fan Card Generator
            </span>
          </div>
          <h2
            className="text-lg sm:text-2xl font-bold text-text-primary uppercase tracking-wider mb-1"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
          >
            Create Your Fan Card
          </h2>
          <p className="text-[10px] sm:text-xs text-text-muted max-w-md mx-auto px-4">
            Upload your photo, choose your school colors, and download your unique Battle of the Golds fan card with a personal QR code.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Form Controls */}
        <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
          {/* Name Input */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><User className="w-3 h-3" /></span>
                Your Name (Hashtag)
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-bold text-base sm:text-lg">#</span>
                <input
                  value={cardData.name}
                  onChange={(e) => updateCard({ name: e.target.value })}
                  placeholder="SASIKA"
                  className="w-full pl-8 pr-3 py-2.5 sm:py-3 bg-lux-elevated border border-lux-border text-text-primary placeholder:text-text-muted/30 uppercase tracking-wider text-base sm:text-lg font-semibold focus:border-gold/50 focus:outline-none transition-colors"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                />
              </div>
            </Card>
          </motion.div>

          {/* Batch Input */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><Sparkles className="w-3 h-3" /></span>
                Batch / Year
              </div>
              <input
                value={cardData.batch}
                onChange={(e) => updateCard({ batch: e.target.value })}
                placeholder="2K26 A/L"
                className="w-full px-3 py-2 sm:py-2.5 bg-lux-elevated border border-lux-border text-text-primary placeholder:text-text-muted/30 uppercase tracking-wider focus:border-gold/50 focus:outline-none transition-colors text-sm"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              />
            </Card>
          </motion.div>

          {/* School Selection */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><ImageIcon className="w-3 h-3" /></span>
                School
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(['stc', 'gsc'] as School[]).map((s) => {
                  const info = SCHOOL_INFO[s];
                  const isSelected = cardData.school === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updateCard({ school: s })}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all duration-300 ${
                        isSelected
                          ? 'border-gold/50 bg-gold-ghost/30'
                          : 'border-lux-border bg-lux-elevated hover:border-lux-border/80'
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white p-0.5 sm:p-1 ${isSelected ? 'ring-1 ring-gold/30' : ''}`}>
                        <Image src={info.logo} alt={info.shortName} width={32} height={32} style={{ objectFit: 'contain' }} unoptimized />
                      </div>
                      <div className="text-left">
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-text-secondary'}`}>
                          {info.shortName}
                        </p>
                        <p className="text-[7px] sm:text-[8px] text-text-muted hidden sm:block">{info.cheers}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Background Theme */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><Sparkles className="w-3 h-3" /></span>
                Background Theme
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(['golden', 'blue', 'red'] as BgColor[]).map((bg) => {
                  const isSelected = cardData.bgColor === bg;
                  const labels: Record<BgColor, string> = { golden: 'Golden', blue: 'Blue', red: 'Red' };
                  const colors: Record<BgColor, string> = { golden: '#f7b717', blue: '#4a7ebb', red: '#E63946' };
                  return (
                    <button
                      key={bg}
                      onClick={() => updateCard({ bgColor: bg })}
                      className={`relative flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? 'border-white/30 shadow-lg'
                          : 'border-lux-border bg-lux-elevated hover:border-lux-border/80'
                      }`}
                    >
                      <div
                        className="w-full h-8 sm:h-10 rounded"
                        style={{
                          backgroundImage: `url(${BG_PATHS[bg]})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <span className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                        {labels[bg]}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors[bg] }}>
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Card Orientation */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><Sparkles className="w-3 h-3" /></span>
                Card Orientation
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(['portrait', 'landscape'] as CardOrientation[]).map((orient) => {
                  const isSelected = cardData.orientation === orient;
                  return (
                    <button
                      key={orient}
                      onClick={() => updateCard({ orientation: orient })}
                      className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-lg border transition-all duration-300 ${
                        isSelected
                          ? 'border-gold/50 bg-gold-ghost/30'
                          : 'border-lux-border bg-lux-elevated hover:border-lux-border/80'
                      }`}
                    >
                      <div className={`border-2 ${isSelected ? 'border-gold' : 'border-text-muted/30'} rounded-sm ${orient === 'portrait' ? 'w-4 h-6 sm:w-5 sm:h-7' : 'w-6 h-3.5 sm:w-7 sm:h-4'}`} />
                      <span className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-text-muted'}`}>
                        {orient}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Photo Upload + Zoom/Pan Controls */}
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-3 sm:p-4">
              <div className="card-title text-[10px] sm:text-xs">
                <span className="icon"><ImageIcon className="w-3 h-3" /></span>
                Your Photo
              </div>
              {cardData.photoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-lux-border">
                      <img
                        src={cardData.photoUrl}
                        alt="Preview"
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover', width: '100%', height: '100%', filter: getPhotoFilter(cardData) }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs text-text-secondary">Photo uploaded</p>
                      <button
                        onClick={() => { updateCard({
                          photoUrl: null,
                          photoZoom: 1,
                          photoOffsetX: 0,
                          photoOffsetY: 0,
                          photoFilterPreset: 'original',
                          photoBrightness: 100,
                          photoContrast: 100,
                          photoSaturation: 100,
                          photoHue: 0,
                          photoSepia: 0,
                        }); setShowPhotoControls(false); }}
                        className="text-[9px] sm:text-[10px] text-red-400 hover:text-red-300 mt-0.5 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPhotoControls(!showPhotoControls)}
                      className="p-2 rounded-lg border border-lux-border hover:border-gold/30 transition-colors"
                      title="Adjust photo"
                    >
                      <Move className="w-3.5 h-3.5 text-text-muted" />
                    </button>
                  </div>

                  {showPhotoControls && (
                    <div className="p-3 rounded-lg bg-lux-elevated/50 border border-lux-border/50 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-text-muted uppercase tracking-wider">Zoom</span>
                          <span className="text-[9px] text-text-muted">{Math.round(cardData.photoZoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCard({ photoZoom: Math.max(1, cardData.photoZoom - 0.1) })}
                            className="w-7 h-7 flex items-center justify-center rounded border border-lux-border hover:border-gold/30 transition-colors"
                          >
                            <ZoomOut className="w-3 h-3 text-text-muted" />
                          </button>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.05"
                            value={cardData.photoZoom}
                            onChange={(e) => updateCard({ photoZoom: parseFloat(e.target.value) })}
                            className="flex-1 h-1 accent-gold"
                          />
                          <button
                            onClick={() => updateCard({ photoZoom: Math.min(3, cardData.photoZoom + 0.1) })}
                            className="w-7 h-7 flex items-center justify-center rounded border border-lux-border hover:border-gold/30 transition-colors"
                          >
                            <ZoomIn className="w-3 h-3 text-text-muted" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-text-muted uppercase tracking-wider">Position X</span>
                          <span className="text-[9px] text-text-muted">{cardData.photoOffsetX > 0 ? '→' : cardData.photoOffsetX < 0 ? '←' : '•'}</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={cardData.photoOffsetX}
                          onChange={(e) => updateCard({ photoOffsetX: parseFloat(e.target.value) })}
                          className="w-full h-1 accent-gold"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-text-muted uppercase tracking-wider">Position Y</span>
                          <span className="text-[9px] text-text-muted">{cardData.photoOffsetY > 0 ? '↓' : cardData.photoOffsetY < 0 ? '↑' : '•'}</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={cardData.photoOffsetY}
                          onChange={(e) => updateCard({ photoOffsetY: parseFloat(e.target.value) })}
                          className="w-full h-1 accent-gold"
                        />
                      </div>

                      <button
                        onClick={() => updateCard({ photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
                        className="text-[9px] text-gold/60 hover:text-gold transition-colors uppercase tracking-wider"
                      >
                        Reset Position
                      </button>

                      <div className="pt-3 border-t border-lux-border/50 space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette className="w-3 h-3 text-gold/70" />
                          <span className="text-[9px] text-text-muted uppercase tracking-wider">Photo Color Filter</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['original', 'golden', 'cinematic', 'cool', 'mono', 'custom'] as PhotoFilterPreset[]).map((preset) => {
                            const selected = cardData.photoFilterPreset === preset;
                            return (
                              <button
                                key={preset}
                                onClick={() => updateCard({ photoFilterPreset: preset })}
                                className={`px-2 py-1.5 border text-[8px] uppercase tracking-[1px] transition-colors ${
                                  selected
                                    ? 'border-gold/60 bg-gold/10 text-gold'
                                    : 'border-lux-border text-text-muted hover:border-gold/30 hover:text-text-secondary'
                                }`}
                              >
                                {PHOTO_FILTER_PRESETS[preset].label}
                              </button>
                            );
                          })}
                        </div>

                        {cardData.photoFilterPreset === 'custom' && (
                          <div className="space-y-2 rounded-lg bg-lux-card/40 border border-lux-border/40 p-3">
                            {[
                              ['photoBrightness', 'Brightness', 50, 150, '%'],
                              ['photoContrast', 'Contrast', 50, 150, '%'],
                              ['photoSaturation', 'Saturation', 0, 200, '%'],
                              ['photoHue', 'Hue', -180, 180, '°'],
                              ['photoSepia', 'Sepia', 0, 100, '%'],
                            ].map(([key, label, min, max, suffix]) => (
                              <div key={key as string}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[8px] text-text-muted uppercase tracking-wider">{label}</span>
                                  <span className="text-[8px] text-text-muted">{cardData[key as keyof typeof cardData] as number}{suffix}</span>
                                </div>
                                <input
                                  type="range"
                                  min={min as number}
                                  max={max as number}
                                  step="1"
                                  value={cardData[key as keyof typeof cardData] as number}
                                  onChange={(e) => updateCard({ [key as string]: parseFloat(e.target.value) })}
                                  className="w-full h-1 accent-gold"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => updateCard({ photoBrightness: 100, photoContrast: 100, photoSaturation: 100, photoHue: 0, photoSepia: 0 })}
                              className="text-[8px] text-gold/60 hover:text-gold transition-colors uppercase tracking-wider"
                            >
                              Reset Custom Filter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 sm:p-5 rounded-lg border border-dashed border-lux-border hover:border-gold/30 bg-lux-elevated cursor-pointer transition-all group">
                  <Upload className="w-4 h-4 text-text-muted/40 group-hover:text-gold transition-colors" />
                  <span className="text-[10px] sm:text-xs text-text-muted/40 group-hover:text-text-muted/60 transition-colors">
                    Click to upload your photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="space-y-2">
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading || !cardData.name.trim()}
                className="flex-1 h-10 sm:h-11 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  background: isDownloading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f7b717, #FFC300, #FFD54F)',
                  color: isDownloading ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
                  boxShadow: isDownloading ? 'none' : '0 4px 20px rgba(247, 183, 23, 0.2)',
                }}
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin inline mr-1" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                ) : (
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                )}
                {downloadSuccess ? 'Downloaded!' : isDownloading ? 'Generating...' : 'Download Card'}
              </button>
              <button
                onClick={handleReset}
                className="h-10 sm:h-11 px-3 border border-lux-border text-text-muted hover:text-text-secondary hover:border-lux-border/80 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <button
              onClick={handleShare}
              disabled={!cardData.name.trim()}
              className="w-full h-10 sm:h-11 border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 disabled:opacity-40 disabled:hover:bg-gold/5 transition-all duration-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
            >
              {shareSuccess ? (
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              ) : (
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              )}
              {shareSuccess ? 'Link Copied / Shared' : 'Share Card'}
            </button>
          </motion.div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-lux-elevated/50 border border-lux-border/50">
            <p className="text-[8px] sm:text-[9px] text-text-muted/40 uppercase tracking-wider leading-relaxed">
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 inline mr-1 text-gold/50" />
              Your photo stays in your browser — we never upload it. The QR code links to your unique fan page.
            </p>
          </div>
        </div>

        {/* Right: Live Preview (preview-only, NOT used for capture) */}
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <div className="text-text-muted/30 text-[8px] sm:text-[9px] uppercase tracking-[2px] mb-2 sm:mb-3 text-center">Live Preview</div>
            <div className="flex items-start justify-center overflow-hidden rounded-xl bg-white/[0.02] border border-lux-border/30 p-2 sm:p-4">
              <div
                className="relative transition-all duration-500"
                style={{
                  height: (cardData.orientation === 'portrait' ? 690 : 440) * previewScale,
                  width: (cardData.orientation === 'portrait' ? 440 : 720) * previewScale,
                  maxWidth: '100%',
                }}
              >
                <div
                  className="origin-top-left"
                  style={{
                    width: cardData.orientation === 'portrait' ? 440 : 720,
                    height: cardData.orientation === 'portrait' ? 690 : 440,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {cardData.orientation === 'portrait' ? (
                    <FanCardPortrait data={cardData} qrDataUrl={qrDataUrl} textContent={fanCardText} />
                  ) : (
                    <FanCardLandscape data={cardData} qrDataUrl={qrDataUrl} textContent={fanCardText} />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[7px] sm:text-[8px] text-text-muted/20 uppercase tracking-widest px-1">
              <span>{cardData.orientation === 'portrait' ? '440 × 690' : '720 × 440'} px</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500/50 animate-pulse" />
                Live
              </span>
            </div>
            <button
              onClick={handleShare}
              disabled={!cardData.name.trim()}
              className="mt-3 w-full h-10 border border-gold/25 bg-gold/5 text-gold hover:bg-gold/10 disabled:opacity-40 disabled:hover:bg-gold/5 transition-all duration-300 text-[9px] font-bold uppercase tracking-wider lg:hidden"
            >
              <Share2 className="w-3.5 h-3.5 inline mr-1" />
              {shareSuccess ? 'Link Copied / Shared' : 'Share Card'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </EditableSection>
  );
}
