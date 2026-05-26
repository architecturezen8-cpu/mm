'use client';

import { useAdminEdit, EditableSectionData } from '@/lib/AdminEditContext';
import EditableSection from '@/components/admin/EditableSection';
import ScrollReveal from '@/components/ScrollReveal';
import PremiumIcon from '@/components/PremiumIcon';

// Hardcoded section IDs per page - these are rendered by the page's own components
const HARDCODED_SECTIONS: Record<string, string[]> = {
  home: ['home-hero', 'home-news', 'home-battle', 'home-countdown', 'home-whoweare', 'home-portfolio', 'home-series', 'home-result'],
  live: ['live-header', 'live-currentover', 'live-batsmen', 'live-info'],
  'match-history': ['history-hero', 'history-origin', 'history-format', 'history-records', 'history-highlights', 'history-media'],
  about: ['about-hero', 'about-whoweare', 'about-whatwedo', 'about-team', 'about-stats', 'about-social', 'about-credits', 'about-location', 'about-history', 'about-stc', 'about-gsc', 'about-records', 'about-media', 'about-contact', 'h2h-record', 'h2h-comparison', 'h2h-results', 'weather-current', 'weather-forecast', 'weather-advisory', 'weather-venue', 'weather-legend'],
  gallery: ['gallery-main'],
  videos: ['videos-livestream', 'videos-grid', 'videos-social'],
  'playing-xi': ['xi-sthomas', 'xi-science'],
  community: ['community-voting', 'community-share', 'community-ball', 'legacy-fan-card', 'legacy-watch-party'],
};

// Helper to detect video URLs and get embed URL (consistent with VideosTab)
function getEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}?rel=0`;
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
  // For direct video file URLs (.mp4, .webm), return as-is
  if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) return url;
  return null;
}

function getVideoThumbnail(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShortsMatch) return `https://img.youtube.com/vi/${ytShortsMatch[1]}/hqdefault.jpg`;
  const ytEmbedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytEmbedMatch) return `https://img.youtube.com/vi/${ytEmbedMatch[1]}/hqdefault.jpg`;
  return null;
}

function isVideoUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('facebook.com') || url.includes('vimeo.com') || url.endsWith('.mp4') || url.endsWith('.webm');
}

// Safe string check helper
function isStr(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}

// Safe startsWith - only calls startsWith if val is a non-empty string
function startsWith(val: unknown, prefix: string): boolean {
  return typeof val === 'string' && val.length > 0 && val.startsWith(prefix);
}

// Generic section renderer for dynamically added sections — premium styling
function GenericSectionCard({ section }: { section: EditableSectionData }) {
  const content = (section.content && typeof section.content === 'object' && !Array.isArray(section.content)) ? section.content : {};
  const heading = (isStr(content.heading) ? content.heading : '') || section.title;
  const text = isStr(content.text) ? content.text : undefined;

  // Check for video_url field (featured video)
  const videoUrl = isStr(content.video_url) ? content.video_url : '';
  const videoEmbedUrl = getEmbedUrl(videoUrl);

  // Check for image fields (exclude video_url) - defensive: only process string values
  const imageFields = Object.entries(content).filter(
    ([key, val]) => isStr(val) && (startsWith(val, '/logos/') || startsWith(val, '/news/') || startsWith(val, '/players/') || startsWith(val, '/uploads/') || startsWith(val, 'http')) && key !== 'video_url' && !isVideoUrl(val)
  );

  // Check for array fields
  const arrayFields = Object.entries(content).filter(
    ([key, val]) => Array.isArray(val) && val.length > 0
  );

  return (
    <ScrollReveal animation="fade-up">
      <div className="lux-card">
        {/* Section heading */}
        <h2 className="card-title">
          <span className="icon"><PremiumIcon name="clipboard" className="w-3.5 h-3.5 text-gold" /></span> {heading}
        </h2>

        {/* Text content — properly aligned */}
        {text && (
          <p className="text-text-secondary text-sm leading-relaxed mb-5">{text}</p>
        )}

        {/* Featured video */}
        {videoEmbedUrl && (
          <div className="relative aspect-video bg-lux-surface mb-5 overflow-hidden border border-lux-border">
            <iframe
              src={videoEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={heading}
            />
          </div>
        )}

        {/* Image fields — premium framed cards, capped height */}
        {imageFields.length > 0 && (
          <div className={`grid gap-4 mb-5 ${imageFields.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {imageFields.map(([key, val]) => (
              <div key={key} className="relative bg-lux-surface overflow-hidden border border-lux-border group">
                { }
                <img
                  src={val as string}
                  alt={key}
                  className="w-full max-h-[300px] object-cover"
                  loading="lazy"
                />
                {/* Image label */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[9px] uppercase tracking-[2px] text-white/50 font-medium">{key.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Array fields — premium item cards */}
        {arrayFields.map(([key, val]) => {
          const items = val as Record<string, unknown>[];
          const isVideoArray = key === 'video_items' || items.some(item => item.video_url);
          return (
            <div key={key} className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-[1px] bg-gold/40" />
                <p className="text-[9px] uppercase tracking-[3px] font-semibold text-text-muted">{key.replace(/_/g, ' ')}</p>
              </div>
              <div className={`grid gap-3 ${items.length > 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {items.map((item, idx) => {
                  const itemVideoUrl = (item.video_url as string) || '';
                  const itemEmbedUrl = getEmbedUrl(itemVideoUrl);
                  const itemThumbnail = (item.thumbnail as string) || getVideoThumbnail(itemVideoUrl);
                  const itemTitle = isStr(item.title) ? item.title : isStr(item.name) ? item.name : '';
                  return (
                    <div key={idx} className="bg-[#08080c] border border-lux-border overflow-hidden group/item hover:border-lux-border-hover transition-colors duration-300">
                      {/* Video embed or thumbnail */}
                      {isVideoArray && itemVideoUrl ? (
                        <div className="relative aspect-video bg-lux-surface overflow-hidden">
                          {itemEmbedUrl ? (
                            itemEmbedUrl.endsWith('.mp4') || itemEmbedUrl.endsWith('.webm') || itemEmbedUrl.endsWith('.ogg') ? (
                              <video
                                src={itemEmbedUrl}
                                className="absolute inset-0 w-full h-full"
                                controls
                                muted
                              />
                            ) : (
                              <iframe
                                src={itemEmbedUrl}
                                className="absolute inset-0 w-full h-full"
                                allowFullScreen
                                allow="autoplay; encrypted-media; picture-in-picture"
                                title={itemTitle || `Video ${idx + 1}`}
                              />
                            )
                          ) : itemThumbnail ? (
                             
                            <img src={itemThumbnail} alt={itemTitle} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                      ) : null}

                      {/* Item content — premium text layout */}
                      <div className="p-3 space-y-2">
                        {/* Item title if present */}
                        {itemTitle && (
                          <p className="text-xs font-semibold text-text-primary tracking-wide">{itemTitle}</p>
                        )}

                        {/* Item image fields — capped size */}
                        {Object.entries(item).filter(([, v]) => v !== null && v !== undefined).map(([fieldKey, fieldVal]) => {
                          if (fieldKey === 'video_url' || fieldKey === 'thumbnail' || fieldKey === 'title' || fieldKey === 'name') return null;
                          // Image field
                          if (startsWith(fieldVal, 'http') && !isVideoUrl(fieldVal)) {
                            return (
                              <div key={fieldKey} className="relative bg-lux-surface overflow-hidden border border-lux-border">
                                { }
                                <img src={fieldVal} alt={fieldKey} className="w-full max-h-[200px] object-cover" loading="lazy" />
                              </div>
                            );
                          }
                          // String field
                          if (isStr(fieldVal) && fieldVal) {
                            return (
                              <div key={fieldKey} className="flex items-baseline justify-between gap-2 py-1 border-b border-[#12121a] last:border-b-0">
                                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-medium shrink-0">{fieldKey.replace(/_/g, ' ')}</span>
                                <span className="text-xs text-text-secondary text-right">{fieldVal}</span>
                              </div>
                            );
                          }
                          // Non-string values
                          if (fieldVal !== null && fieldVal !== undefined && !isStr(fieldVal)) {
                            return (
                              <div key={fieldKey} className="flex items-baseline justify-between gap-2 py-1 border-b border-[#12121a] last:border-b-0">
                                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-medium shrink-0">{fieldKey.replace(/_/g, ' ')}</span>
                                <span className="text-xs text-text-primary font-medium text-right">{String(fieldVal)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Remaining simple string fields — stat rows */}
        {(() => {
          const simpleFields = Object.entries(content)
            .filter(([key]) => key !== 'heading' && key !== 'text' && key !== 'video_url' && !imageFields.some(([ik]) => ik === key) && !arrayFields.some(([ak]) => ak === key))
            .filter(([, val]) => isStr(val) && !startsWith(val, 'http') && !startsWith(val, '/'))
            .slice(0, 8);
          if (simpleFields.length === 0) return null;
          return (
            <div className="border-t border-[#12121a] pt-4 mt-2">
              {simpleFields.map(([key, val]) => (
                <div key={key} className="stat-row">
                  <span className="text-text-secondary text-xs">{key.replace(/_/g, ' ')}</span>
                  <span className="text-text-primary text-xs font-medium">{val}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </ScrollReveal>
  );
}

interface DynamicSectionsProps {
  pageId: string;
  /** Optional: only show dynamic sections whose IDs start with this prefix */
  sectionPrefix?: string;
  /** Optional: exclude dynamic sections whose IDs start with this prefix */
  excludePrefix?: string;
}

export default function DynamicSections({ pageId, sectionPrefix, excludePrefix }: DynamicSectionsProps) {
  const { sectionData, isAdmin, editMode } = useAdminEdit();

  // Get hardcoded section IDs for this page
  const hardcodedIds = HARDCODED_SECTIONS[pageId] || [];

  // Find dynamic sections (not in hardcoded list) for this page
  let dynamicSections = Object.values(sectionData)
    .filter((s) => s.page_id === pageId && !hardcodedIds.includes(s.id))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // If a sectionPrefix is provided, only show sections whose IDs start with it
  if (sectionPrefix) {
    dynamicSections = dynamicSections.filter((s) => s.id.startsWith(sectionPrefix));
  }

  // If an excludePrefix is provided, exclude sections whose IDs start with it
  if (excludePrefix) {
    dynamicSections = dynamicSections.filter((s) => !s.id.startsWith(excludePrefix));
  }

  if (dynamicSections.length === 0) return null;

  return (
    <div className="space-y-6 mt-6">
      {isAdmin && editMode && (
        <div className="text-center">
          <span className="text-[8px] uppercase tracking-[2px] text-text-muted border border-lux-border px-3 py-1">
            Dynamic Sections
          </span>
        </div>
      )}
      {dynamicSections.map((section) => (
        <EditableSection
          key={section.id}
          sectionId={section.id}
          pageId={section.page_id}
          type={section.type}
          title={section.title}
          content={section.content}
        >
          <GenericSectionCard section={section} />
        </EditableSection>
      ))}
    </div>
  );
}
