'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent, getContentString, getContentArray } from '@/lib/useSectionContent';
import DynamicSections from '@/components/admin/DynamicSections';

type GalleryCategory = 'all' | 'action' | 'celebrations' | 'crowd' | 'training' | 'events';

interface GalleryItem {
  id: number;
  category: GalleryCategory;
  label: string;
  gradient: string;
  image?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  span?: string;
  isPortrait?: boolean;
}

interface GalleryContentItem {
  image: string;
  label: string;
  category: string;
}

const defaultGalleryItems: GalleryContentItem[] = [
  { image: '', label: 'Cover Drive', category: 'action' },
  { image: '', label: 'Century Celebration', category: 'celebrations' },
  { image: '', label: 'Full House', category: 'crowd' },
  { image: '', label: 'Bouncer Delivery', category: 'action' },
  { image: '', label: 'Net Session', category: 'training' },
  { image: '', label: 'Opening Ceremony', category: 'events' },
  { image: '', label: 'Stumping', category: 'action' },
  { image: '', label: 'Winning Moment', category: 'celebrations' },
  { image: '', label: 'Wave', category: 'crowd' },
  { image: '', label: 'Warm Up', category: 'training' },
  { image: '', label: 'Trophy Unveil', category: 'events' },
  { image: '', label: 'Diving Catch', category: 'action' },
];

const DEFAULT_GALLERY_CONTENT = {
  heading: 'Photo Gallery',
  gallery_items: defaultGalleryItems,
};

const categoryLabels: Record<GalleryCategory, string> = {
  all: 'All',
  action: 'Match Action',
  celebrations: 'Celebrations',
  crowd: 'Crowd',
  training: 'Training',
  events: 'Events',
};

const placeholderGradients = [
  'from-amber-900/40 to-lux-surface',
  'from-yellow-800/30 to-lux-surface',
  'from-slate-700/30 to-lux-surface',
  'from-red-900/30 to-lux-surface',
  'from-emerald-900/30 to-lux-surface',
  'from-purple-900/30 to-lux-surface',
  'from-orange-900/30 to-lux-surface',
  'from-gold/20 to-lux-surface',
  'from-teal-900/30 to-lux-surface',
  'from-cyan-900/30 to-lux-surface',
  'from-rose-900/30 to-lux-surface',
  'from-indigo-900/30 to-lux-surface',
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

function mapContentToGalleryItems(contentItems: GalleryContentItem[]): GalleryItem[] {
  return contentItems.map((ci, index) => ({
    id: index + 1,
    category: ci.category as GalleryCategory,
    label: ci.label,
    gradient: placeholderGradients[index % placeholderGradients.length],
    image: ci.image || undefined,
    span: 'span-2',
    isPortrait: false,
  }));
}

function getRowSpan(naturalWidth: number, naturalHeight: number): string {
  const ratio = naturalHeight / naturalWidth;
  if (ratio > 1.4) return 'span-4';
  if (ratio > 1.1) return 'span-3';
  if (ratio > 0.8) return 'span-2';
  return 'span-2';
}

function isPortraitImage(naturalWidth: number, naturalHeight: number): boolean {
  return naturalHeight > naturalWidth;
}

export default function GalleryTab() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Record<number, { w: number; h: number }>>({});
  const [isRotated, setIsRotated] = useState(false);

  // Reset rotation when lightbox item changes
  useEffect(() => {
    setIsRotated(false);
  }, [lightboxItem]);

  const content = useSectionContent('gallery-main', DEFAULT_GALLERY_CONTENT);
  const heading = getContentString(content, 'heading', 'Photo Gallery');
  const contentItems = getContentArray<GalleryContentItem>(content, 'gallery_items', defaultGalleryItems);
  const galleryItems = mapContentToGalleryItems(contentItems);

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((g) => g.category === activeCategory);

  const handleImageLoad = useCallback((id: number, img: HTMLImageElement) => {
    setImageDimensions(prev => {
      if (prev[id] && prev[id].w === img.naturalWidth && prev[id].h === img.naturalHeight) return prev;
      return { ...prev, [id]: { w: img.naturalWidth, h: img.naturalHeight } };
    });
  }, []);

  const itemsWithSpan = filtered.map(gi => {
    const dims = imageDimensions[gi.id];
    if (dims) {
      return { ...gi, span: getRowSpan(dims.w, dims.h), isPortrait: isPortraitImage(dims.w, dims.h) };
    }
    return gi;
  });

  const handleRotate = useCallback(() => {
    setIsRotated(prev => !prev);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxItem(null);
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Filter Buttons & Masonry Grid */}
      <EditableSection sectionId="gallery-main" pageId="gallery" type="gallery" title={heading} content={{ heading, gallery_items: contentItems }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon">
              <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </span> {heading}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryLabels) as GalleryCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[2px] font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-gold text-lux-bg'
                    : 'border border-lux-border text-text-muted hover:text-gold hover:border-gold/30'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Premium Masonry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[120px] sm:auto-rows-[140px] gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {itemsWithSpan.map((galleryItem) => {
              const rowSpan = galleryItem.span === 'span-4' ? 4 : galleryItem.span === 'span-3' ? 3 : 2;
              return (
                <motion.div
                  key={galleryItem.id}
                  variants={item}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -3, transition: { duration: 0.25 } }}
                  className="cursor-pointer group"
                  style={{ gridRow: `span ${rowSpan}` }}
                  onClick={() => setLightboxItem(galleryItem)}
                >
                  <div className="w-full h-full overflow-hidden relative bg-[#08080c] border border-[#1a1a22] group-hover:border-gold/30 transition-all duration-500 group-hover:shadow-[0_8px_40px_-12px_rgba(255,195,0,0.15)]">
                    {/* Top gold accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] z-20 bg-gradient-to-r from-transparent via-gold/0 to-transparent group-hover:via-gold/50 transition-all duration-500" />

                    {galleryItem.image ? (
                      <>
                        {/* Blurred thumbnail - creates depth effect */}
                        <img
                          src={galleryItem.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-40"
                          aria-hidden="true"
                          loading="lazy"
                        />
                        {/* Actual image - preserves aspect ratio */}
                        <img
                          src={galleryItem.image}
                          alt={galleryItem.label}
                          className={`absolute inset-0 w-full h-full ${galleryItem.isPortrait ? 'object-contain' : 'object-cover'} transition-transform duration-700 group-hover:scale-105 z-[1]`}
                          loading="lazy"
                          onLoad={(e) => handleImageLoad(galleryItem.id, e.currentTarget)}
                          referrerPolicy="no-referrer"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-end p-4" style={{ background: 'linear-gradient(135deg, #0a0808 0%, #0d0d08 50%, #0a0a0f 100%)' }}>
                        <div className="relative z-10">
                          <p className="text-xs font-semibold text-text-primary">{galleryItem.label}</p>
                          <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">
                            {categoryLabels[galleryItem.category]}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Subtle overlay */}
                    {galleryItem.image && (
                      <div className="absolute inset-0 z-[2]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 z-[3]" />

                    {/* Label overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-[4] translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="w-6 h-[1.5px] bg-gold/60 mb-2 group-hover:w-10 group-hover:bg-gold/80 transition-all duration-500" />
                      <p className="text-[11px] font-semibold text-white/90 drop-shadow-lg tracking-wide">{galleryItem.label}</p>
                      <p className="text-[8px] uppercase tracking-[3px] text-white/40 mt-1 drop-shadow font-medium">
                        {categoryLabels[galleryItem.category]}
                      </p>
                    </div>

                    {/* Hover action icon - zoom only (no fullscreen for gallery) */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 z-[5]">
                      <div className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center bg-black/30 backdrop-blur-sm shadow-[0_0_20px_rgba(255,195,0,0.1)] group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4 text-gold/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </EditableSection>

      {/* Premium Lightbox with rotate only (NO fullscreen for gallery) */}
      <AnimatePresence>
        {lightboxItem && (
          /* Wrapper: fixed overlay container, NO onClick here */
          <div className="fixed inset-0 z-50">
            {/* Backdrop: SIBLING of controls & content. Click here to close */}
            <motion.div
              key="gallery-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#020204]/95 backdrop-blur-sm"
              onClick={closeLightbox}
            />

            {/* Control buttons: SIBLING of backdrop. Clicks DON'T bubble to backdrop */}
            <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
              {/* Rotate button */}
              <button
                onClick={handleRotate}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title="Rotate image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </button>
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content: SIBLING of backdrop. Clicks DON'T bubble to backdrop */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
              <motion.div
                key="gallery-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col items-center max-w-[95vw] max-h-[90vh]"
              >
                {lightboxItem.image ? (
                  <div className="relative flex items-center justify-center w-full h-full" style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', transform: isRotated ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    {/* Gold border glow */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-gold/20 via-transparent to-gold/10 rounded-sm pointer-events-none" />
                    <img
                      src={lightboxItem.image}
                      alt={lightboxItem.label}
                      className="max-w-full max-h-[82vh] object-contain block relative z-10 pointer-events-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-lg h-96 sm:h-[500px] flex items-end p-6 pointer-events-auto" style={{ background: 'linear-gradient(135deg, #0a0808 0%, #0d0d08 50%, #0a0a0f 100%)' }}>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">{lightboxItem.label}</h3>
                      <p className="text-xs text-text-muted uppercase tracking-[2px] mt-1">
                        {categoryLabels[lightboxItem.category]}
                      </p>
                    </div>
                  </div>
                )}
                {/* Label below image */}
                <div className="mt-5 text-center pointer-events-auto" style={{ transition: 'transform 0.4s', transform: isRotated ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  <div className="w-8 h-[1.5px] bg-gold/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/90 tracking-wide">{lightboxItem.label}</p>
                  <p className="text-[9px] uppercase tracking-[3px] text-white/30 mt-1.5 font-medium">
                    {categoryLabels[lightboxItem.category]}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <DynamicSections pageId="gallery" />
    </motion.div>
  );
}
