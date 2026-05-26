'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumIcon from '@/components/PremiumIcon';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent, getContentString, getContentArray } from '@/lib/useSectionContent';
import DynamicSections from '@/components/admin/DynamicSections';

interface VideoItem {
  id: number;
  title: string;
  duration: string;
  date: string;
  category: 'live' | 'highlights' | 'analysis' | 'interview';
  thumbnail?: string;
  video_url?: string;
}

interface VideoContentItem {
  title: string;
  thumbnail: string;
  video_url: string;
  duration: string;
  category: string;
}

const defaultVideoItems: VideoContentItem[] = [
  { title: 'Match Highlights Day 1', thumbnail: '', video_url: '', duration: '12:34', category: 'highlights' },
  { title: 'Pre-Match Analysis', thumbnail: '', video_url: '', duration: '8:45', category: 'analysis' },
  { title: "Captain's Interview", thumbnail: '', video_url: '', duration: '6:12', category: 'interview' },
  { title: 'Best Catches', thumbnail: '', video_url: '', duration: '4:56', category: 'highlights' },
  { title: 'Bowling Masterclass', thumbnail: '', video_url: '', duration: '10:23', category: 'analysis' },
  { title: 'Match Highlights Day 2', thumbnail: '', video_url: '', duration: '14:08', category: 'highlights' },
  { title: 'Post-Match Press Conference', thumbnail: '', video_url: '', duration: '7:30', category: 'interview' },
  { title: 'Batting Technique Breakdown', thumbnail: '', video_url: '', duration: '9:15', category: 'analysis' },
];

const DEFAULT_VIDEOS_LIVESTREAM_CONTENT = {
  heading: 'Live Stream',
  video_url: '',
  coming_soon_text: 'Live Stream Coming Soon',
};

const DEFAULT_VIDEOS_GRID_CONTENT = {
  heading: 'Video Highlights',
  video_items: defaultVideoItems,
};

const DEFAULT_SOCIAL_LINKS_CONTENT = {
  heading: 'Follow Us',
  youtube_url: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_label: 'YouTube',
  facebook_label: 'Facebook',
  instagram_label: 'Instagram',
  tiktok_label: 'TikTok',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function mapContentToVideoItems(contentItems: VideoContentItem[]): VideoItem[] {
  return contentItems.map((vi, index) => ({
    id: index + 1,
    title: vi.title || `Video ${index + 1}`,
    duration: vi.duration || '',
    date: '',
    category: (vi.category || 'highlights') as VideoItem['category'],
    thumbnail: vi.thumbnail || undefined,
    video_url: (vi.video_url || (vi as Record<string, unknown>).url as string || '') || undefined,
  }));
}

function getEmbedUrlNoAutoplay(url: string): string | null {
  if (!url) return null;
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
  return null;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1&rel=0`;
  if (url.includes('youtube.com/embed/')) return url.includes('?') ? url : url + '?autoplay=1&rel=0';
  if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`;
  return url;
}

function getVideoThumbnail(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShortsMatch) return `https://img.youtube.com/vi/${ytShortsMatch[1]}/hqdefault.jpg`;
  const ytEmbedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytEmbedMatch) return `https://img.youtube.com/vi/${ytEmbedMatch[1]}/hqdefault.jpg`;
  return null;
}

export default function VideosTab() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);

  // Reset rotation/fullscreen when video changes
  useEffect(() => {
    setIsRotated(false);
    setIsFullscreen(false);
  }, [selectedVideo]);

  // Livestream state
  const [livestreamFullscreen, setLivestreamFullscreen] = useState(false);
  const livestreamRef = useRef<HTMLDivElement>(null);

  const livestreamContent = useSectionContent('videos-livestream', DEFAULT_VIDEOS_LIVESTREAM_CONTENT);
  const livestreamHeading = getContentString(livestreamContent, 'heading', 'Live Stream');
  const livestreamVideoUrl = getContentString(livestreamContent, 'video_url', '');
  const comingSoonText = getContentString(livestreamContent, 'coming_soon_text', 'Live Stream Coming Soon');

  const gridContent = useSectionContent('videos-grid', DEFAULT_VIDEOS_GRID_CONTENT);
  const gridHeading = getContentString(gridContent, 'heading', 'Video Highlights');
  const videoContentItems = getContentArray<VideoContentItem>(gridContent, 'video_items', defaultVideoItems);
  const videos = mapContentToVideoItems(videoContentItems);

  const socialContent = useSectionContent('videos-social', DEFAULT_SOCIAL_LINKS_CONTENT);
  const socialHeading = getContentString(socialContent, 'heading', 'Follow Us');
  const youtubeUrl = getContentString(socialContent, 'youtube_url', '');
  const facebookUrl = getContentString(socialContent, 'facebook_url', '');
  const instagramUrl = getContentString(socialContent, 'instagram_url', '');
  const tiktokUrl = getContentString(socialContent, 'tiktok_url', '');
  const youtubeLabel = getContentString(socialContent, 'youtube_label', 'YouTube');
  const facebookLabel = getContentString(socialContent, 'facebook_label', 'Facebook');
  const instagramLabel = getContentString(socialContent, 'instagram_label', 'Instagram');
  const tiktokLabel = getContentString(socialContent, 'tiktok_label', 'TikTok');

  const livestreamEmbedUrl = getEmbedUrl(livestreamVideoUrl);

  const socialLinks = [
    { url: youtubeUrl, label: youtubeLabel, icon: 'youtube', color: '#FF0000', hoverColor: '#FF3333' },
    { url: facebookUrl, label: facebookLabel, icon: 'facebook', color: '#1877F2', hoverColor: '#4293FF' },
    { url: instagramUrl, label: instagramLabel, icon: 'instagram', color: '#E4405F', hoverColor: '#FF6B81' },
    { url: tiktokUrl, label: tiktokLabel, icon: 'tiktok', color: '#000000', hoverColor: '#333333' },
  ].filter(s => s.url);

  // CSS-based fullscreen toggle for video modal
  const toggleVideoFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleRotate = useCallback(() => setIsRotated(prev => !prev), []);

  // Open video directly in fullscreen mode
  const openVideoFullscreen = useCallback((video: VideoItem) => {
    setSelectedVideo(video);
    setIsFullscreen(true);
    setIsRotated(false);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedVideo(null);
    setIsFullscreen(false);
    setIsRotated(false);
  }, []);

  // Fullscreen toggle for livestream (uses Fullscreen API directly)
  const toggleLivestreamFullscreen = useCallback(async () => {
    if (!livestreamRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setLivestreamFullscreen(false);
      } else {
        await livestreamRef.current.requestFullscreen();
        setLivestreamFullscreen(true);
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch { /* not supported */ }
        }
      }
    } catch { /* fullscreen not supported */ }
  }, []);

  // Listen for fullscreen changes (for livestream)
  useEffect(() => {
    const handler = () => setLivestreamFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Live Stream Section */}
      <EditableSection sectionId="videos-livestream" pageId="videos" type="video" title={livestreamHeading} content={{ heading: livestreamHeading, video_url: livestreamVideoUrl, coming_soon_text: comingSoonText }}>
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="broadcast" className="w-3.5 h-3.5 text-gold" /></span> {livestreamHeading}
          </h2>
          <div ref={livestreamRef} className="aspect-video bg-lux-surface border border-gold/20 flex flex-col items-center justify-center gap-4 relative overflow-hidden rounded-sm">
            {/* Animated border glow */}
            <div className="absolute inset-0 border-2 border-gold/10 animate-pulse-gold pointer-events-none" />

            {livestreamEmbedUrl ? (
              <iframe
                src={livestreamEmbedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                title={livestreamHeading}
              />
            ) : (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold/40 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gold ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-text-primary text-sm sm:text-base font-semibold">{comingSoonText}</p>
                  <p className="text-text-muted text-[10px] sm:text-xs mt-1 uppercase tracking-[2px]">
                    Stay tuned for live coverage
                  </p>
                </div>
              </>
            )}

            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-status-negative/20 border border-status-negative/30">
              <span className="w-2 h-2 rounded-full bg-status-negative animate-pulse" />
              <span className="text-[9px] font-bold tracking-[2px] uppercase text-status-negative">Live</span>
            </div>

            {/* Fullscreen button for livestream */}
            {livestreamEmbedUrl && (
              <button
                onClick={toggleLivestreamFullscreen}
                className="absolute bottom-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title="Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      </EditableSection>

      {/* Video Grid */}
      <EditableSection sectionId="videos-grid" pageId="videos" type="video" title={gridHeading} content={{ heading: gridHeading, video_items: videoContentItems }}>
        <motion.div variants={item}>
          <h2 className="card-title mb-4">
            <span className="icon"><PremiumIcon name="film" className="w-3.5 h-3.5 text-gold" /></span> {gridHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => {
              const embedUrl = video.video_url ? getEmbedUrlNoAutoplay(video.video_url) : null;
              const isDirectVideo = video.video_url && !embedUrl && (video.video_url.endsWith('.mp4') || video.video_url.endsWith('.webm') || video.video_url.endsWith('.ogg'));
              const hasVideo = !!(embedUrl || isDirectVideo);
              const autoThumb = video.video_url ? getVideoThumbnail(video.video_url) : null;
              return (
                <motion.div
                  key={video.id}
                  variants={item}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="lux-card group cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  {/* Video Embed or Thumbnail */}
                  <div className="aspect-video bg-lux-surface mb-3 flex items-center justify-center relative overflow-hidden">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title={video.title}
                      />
                    ) : isDirectVideo ? (
                      <video
                        src={video.video_url}
                        className="absolute inset-0 w-full h-full"
                        controls
                        muted
                        preload="metadata"
                      />
                    ) : video.thumbnail || autoThumb ? (
                      <img
                        src={video.thumbnail || autoThumb || ''}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-lux-elevated to-lux-surface" />
                    )}

                    {/* Play button overlay */}
                    {!hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-12 h-12 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/30 flex items-center justify-center group-hover:bg-gold/30 group-hover:scale-110 transition-all duration-300">
                          <svg className="w-5 h-5 text-gold ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Duration badge */}
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 text-[10px] text-text-primary font-mono z-10">
                      {video.duration}
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[8px] font-bold tracking-[1px] uppercase px-1.5 py-0.5 ${
                        video.category === 'highlights' ? 'bg-gold/10 text-gold' :
                        video.category === 'analysis' ? 'bg-status-neutral/10 text-status-neutral' :
                        'bg-status-positive/10 text-status-positive'
                      }`}>
                        {video.category}
                      </span>
                    </div>

                    {/* Shimmer animation on hover */}
                    <div className="absolute inset-0 z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-shimmer" />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-gold transition-colors line-clamp-1">
                        {video.title}
                      </h3>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-[1px]">{video.date}</p>
                    </div>
                    {/* Fullscreen icon below the card */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openVideoFullscreen(video); }}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-lux-border hover:border-gold/30 hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-300"
                      title="Fullscreen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </EditableSection>

      {/* Social Media Links Section */}
      <EditableSection sectionId="videos-social" pageId="videos" type="links" title={socialHeading} content={socialContent}>
        <motion.div variants={item}>
          <div className="lux-card">
            <h2 className="card-title mb-4">
              <span className="icon"><PremiumIcon name="star" className="w-3.5 h-3.5 text-gold" /></span> {socialHeading}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.icon}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 p-4 border border-lux-border hover:border-gold/30 transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${social.color}15` }}
                  >
                    {social.icon === 'youtube' && (
                      <svg className="w-6 h-6" style={{ color: social.color }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )}
                    {social.icon === 'facebook' && (
                      <svg className="w-6 h-6" style={{ color: social.color }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    {social.icon === 'instagram' && (
                      <svg className="w-6 h-6" style={{ color: social.color }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                    )}
                    {social.icon === 'tiktok' && (
                      <svg className="w-6 h-6" style={{ color: social.color }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[2px] text-text-secondary group-hover:text-gold transition-colors">
                    {social.label}
                  </span>
                </a>
              ))}
            </div>
            {socialLinks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-text-muted text-xs uppercase tracking-[2px]">Social media links coming soon</p>
                <p className="text-text-muted text-[10px] mt-1">Edit this section to add your social media URLs</p>
              </div>
            )}
          </div>
        </motion.div>
      </EditableSection>

      {/* Premium Video Modal — SIBLING structure for reliable click handling */}
      <AnimatePresence>
        {selectedVideo && (
          /* Wrapper: fixed overlay container, NO onClick here */
          <div className="fixed inset-0 z-50">
            {/* Backdrop: SIBLING of controls & content. Click here to close */}
            <motion.div
              key="video-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 ${isFullscreen ? 'bg-black' : 'bg-black/90'}`}
              onClick={!isFullscreen ? closeModal : undefined}
            />

            {/* Control buttons: SIBLING of backdrop. Clicks DON'T bubble to backdrop */}
            <div className={`absolute z-[60] flex items-center gap-2 ${isFullscreen ? 'top-4 right-4' : 'top-4 right-4'}`}>
              {/* Rotate button */}
              <button
                onClick={handleRotate}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title="Rotate video"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </button>
              {/* Fullscreen toggle button */}
              <button
                onClick={toggleVideoFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
              {/* Close button */}
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all duration-300"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content: SIBLING of backdrop. Clicks DON'T bubble to backdrop */}
            <div className={`absolute inset-0 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-3 sm:p-6'} pointer-events-none`}>
              <motion.div
                key="video-content"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`pointer-events-auto ${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl'}`}
                style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', transform: isRotated ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                <div className={`overflow-hidden ${isFullscreen ? 'h-full bg-black border border-white/5' : 'lux-card-gold'}`}>
                  {/* Video player — fills entire screen in fullscreen */}
                  <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'bg-lux-surface aspect-video'}`}>
                    {selectedVideo.video_url ? (
                      <iframe
                        src={getEmbedUrl(selectedVideo.video_url) || selectedVideo.video_url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        title={selectedVideo.title}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-12 h-12 text-gold mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <p className="text-text-secondary text-sm">{selectedVideo.title}</p>
                      </div>
                    )}
                  </div>
                  {/* Video info — hidden in fullscreen mode (only border visible) */}
                  {!isFullscreen && (
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-bold text-text-primary">{selectedVideo.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-text-muted">{selectedVideo.duration}</span>
                      <span className="text-xs text-text-muted">{selectedVideo.date}</span>
                    </div>
                  </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <DynamicSections pageId="videos" />

      {/* Shimmer animation CSS */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
      `}</style>
    </motion.div>
  );
}
