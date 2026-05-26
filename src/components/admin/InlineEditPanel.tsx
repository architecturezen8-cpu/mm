'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminEdit, EditableSectionData } from '@/lib/AdminEditContext';
import { addDraftChange } from '@/lib/draft-store';

/* ─── Emblem Options ─── */
const EMBLEMS = [
  { id: 'st-thomas', label: "St.Thomas' College", url: '/logos/st-thomas-college-matale.jpg' },
  { id: 'govt-science', label: 'Govt.Science College', url: '/logos/govt-science-college-matale.jpg' },
  { id: 'thomians-media', label: "Thomians' Media", url: '/logos/thomians-media-round-logo.jpg' },
];

/* ─── Field Types ─── */
type FieldType = 'text' | 'textarea' | 'image' | 'video' | 'number' | 'toggle' | 'array' | 'datetime' | 'select';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
}

/** Helper to detect if a URL is a video embed (YouTube/Facebook/Vimeo) */
function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

/* ─── MediaPicker Component ─── */
function MediaPicker({
  value,
  onChange,
  label,
  accept = 'image/*',
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}) {
  const [tab, setTab] = useState<'url' | 'upload' | 'emblem'>('url');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Try GitHub CDN upload first
      const res = await fetch('/api/admin/github-upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        onChange(data.cdnUrl || data.url);
      } else {
        // Fallback to local media upload
        const fallbackRes = await fetch('/api/admin/media', { method: 'POST', body: formData });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          onChange(data.url);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted">{label}</label>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['url', 'upload', 'emblem'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2 py-1 text-[8px] uppercase tracking-[1.5px] font-bold transition-all ${
              tab === t ? 'bg-gold text-lux-bg' : 'border border-lux-border text-text-muted hover:border-gold/30'
            }`}
            style={{ borderRadius: 0 }}
          >
            {t === 'url' ? 'Link' : t === 'upload' ? 'Upload' : 'Emblem'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'url' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
          style={{ borderRadius: 0 }}
        />
      )}

      {tab === 'upload' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full px-3 py-2 border border-lux-border text-text-muted hover:border-gold/30 hover:text-gold text-xs uppercase tracking-[1px] font-semibold transition-all disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </button>
        </div>
      )}

      {tab === 'emblem' && (
        <div className="grid grid-cols-3 gap-2">
          {EMBLEMS.map((emblem) => (
            <button
              key={emblem.id}
              onClick={() => onChange(emblem.url)}
              className={`flex flex-col items-center gap-1 p-2 border transition-all ${
                value === emblem.url ? 'border-gold bg-gold/5' : 'border-lux-border hover:border-gold/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              { }
              <img src={emblem.url} alt={emblem.label} className="w-10 h-10 object-contain" />
              <span className="text-[7px] text-text-muted uppercase tracking-[1px] text-center leading-tight">
                {emblem.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="border border-lux-border p-2 bg-lux-surface" style={{ borderRadius: 0 }}>
          {accept.includes('video') && getVideoEmbedUrl(value) ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={getVideoEmbedUrl(value)!}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                title="Video preview"
              />
            </div>
          ) : accept.includes('video') && (value.endsWith('.mp4') || value.endsWith('.webm') || value.endsWith('.ogg')) ? (
            <video src={value} className="w-full max-h-32 object-contain" controls muted />
          ) : (
             
            <img src={value} alt="Preview" className="w-full max-h-32 object-contain" />
          )}
        </div>
      )}
      {/* Video URL type hint */}
      {accept.includes('video') && value && !getVideoEmbedUrl(value) && !value.endsWith('.mp4') && !value.endsWith('.webm') && !value.endsWith('.ogg') && (
        <p className="text-[8px] text-yellow-400/70 mt-1 uppercase tracking-[1px]">
          Direct video file URL detected. For YouTube/Facebook/Vimeo, paste the video page URL.
        </p>
      )}
    </div>
  );
}

/* ─── Array Item Editor ─── */
function ArrayItemEditor({
  items,
  onChange,
  itemLabel,
  fields,
}: {
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  itemLabel: string;
  fields: { key: string; label: string; type: 'text' | 'image' | 'video' | 'select'; options?: { value: string; label: string }[] }[];
}) {
  const addItem = () => {
    const newItem: Record<string, unknown> = {};
    fields.forEach((f) => {
      newItem[f.key] = '';
    });
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[9px] uppercase tracking-[2px] font-semibold text-text-muted">{itemLabel}</label>
        <button
          onClick={addItem}
          className="px-2 py-1 text-[8px] uppercase tracking-[1.5px] font-bold bg-gold text-lux-bg hover:bg-gold-bright transition-colors"
          style={{ borderRadius: 0 }}
        >
          + Add
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="border border-lux-border p-3 space-y-2 bg-lux-surface/50" style={{ borderRadius: 0 }}>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[1.5px] font-bold text-gold">
              {itemLabel} #{index + 1}
            </span>
            <button
              onClick={() => removeItem(index)}
              className="text-text-muted hover:text-red-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {fields.map((field) => (
            <div key={field.key}>
              {field.type === 'select' ? (
                <div>
                  <label className="block text-[8px] uppercase tracking-[1.5px] text-text-muted mb-1">{field.label}</label>
                  <select
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                    className="w-full bg-lux-card border border-lux-border px-2.5 py-1.5 text-xs text-text-primary focus:border-gold/50 focus:outline-none appearance-none cursor-pointer"
                    style={{ borderRadius: 0 }}
                  >
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ) : field.type === 'text' ? (
                <div>
                  <label className="block text-[8px] uppercase tracking-[1.5px] text-text-muted mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                    className="w-full bg-lux-card border border-lux-border px-2.5 py-1.5 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              ) : field.type === 'video' ? (
                <MediaPicker
                  value={(item[field.key] as string) || ''}
                  onChange={(url) => updateItem(index, field.key, url)}
                  label={field.label}
                  accept="video/*"
                />
              ) : (
                <MediaPicker
                  value={(item[field.key] as string) || ''}
                  onChange={(url) => updateItem(index, field.key, url)}
                  label={field.label}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
    SECTION-SPECIFIC FIELD DEFINITIONS
    Each section gets EXACTLY the fields it displays on the page.
    Uses sectionId (primary) + type (fallback) for matching.
   ═══════════════════════════════════════════════════════════════ */

// Text input
function tf(key: string, label: string): FieldDef { return { key, label, type: 'text' }; }
function taf(key: string, label: string): FieldDef { return { key, label, type: 'textarea' }; }
function imf(key: string, label: string): FieldDef { return { key, label, type: 'image' }; }
function vf(key: string, label: string): FieldDef { return { key, label, type: 'video' }; }
function nf(key: string, label: string): FieldDef { return { key, label, type: 'number' }; }
function tof(key: string, label: string): FieldDef { return { key, label, type: 'toggle' }; }
function af(key: string, label: string): FieldDef { return { key, label, type: 'array' }; }
function dtf(key: string, label: string): FieldDef { return { key, label, type: 'datetime' }; }
function sf(key: string, label: string, options: { value: string; label: string }[]): FieldDef { return { key, label, type: 'select', options }; }

// Section-ID → fields mapping (EXACT match to what the page renders)
const SECTION_FIELDS: Record<string, FieldDef[]> = {
  // ─── HOME PAGE ───
  'home-hero': [
    tf('heading', 'Heading'),
    tf('subheading', 'Subheading'),
    tf('tagline', 'Tagline'),
    imf('logo_image', 'Logo Image'),
    imf('stc_logo', "STC Logo"),
    imf('gsc_logo', 'GSC Logo'),
    tf('stc_name', 'STC Team Name'),
    tf('gsc_name', 'GSC Team Name'),
    tf('cta_text', 'CTA Button Text'),
    tf('cta_link', 'CTA Button Link'),
  ],
  'home-news': [
    tf('heading', 'Section Heading'),
    af('news_items', 'News Items'),
  ],
  'home-battle': [
    tf('heading', 'Heading'),
    tf('subheading', 'Subheading'),
    tf('event_label', 'Event Label'),
    tf('rivalry_label', 'Rivalry Label'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
    tf('stc_name', 'STC Team Name'),
    tf('gsc_name', 'GSC Team Name'),
    tf('cta_text', 'CTA Button Text'),
    tf('cta_link', 'CTA Button Link'),
    tf('second_cta_text', 'Second CTA Text'),
    tf('second_cta_link', 'Second CTA Link'),
  ],
  'home-countdown': [
    tf('heading', 'Section Heading'),
    dtf('match_date', 'Countdown Target Date & Time'),
    tf('match_date_text', 'Match Date Display Text'),
  ],
  'home-whoweare': [
    tf('heading', 'Section Heading'),
    taf('text', 'Description Text'),
    nf('stat1_value', 'Stat 1 Value'),
    tf('stat1_label', 'Stat 1 Label'),
    nf('stat2_value', 'Stat 2 Value'),
    tf('stat2_label', 'Stat 2 Label'),
    nf('stat3_value', 'Stat 3 Value'),
    tf('stat3_label', 'Stat 3 Label'),
  ],
  'home-portfolio': [
    tf('heading', 'Section Heading'),
    af('portfolio_items', 'Portfolio Items'),
  ],
  'home-series': [
    tf('heading', 'Section Heading'),
  ],
  'home-result': [
    tf('heading', 'Section Heading'),
  ],

  // ─── MATCH HISTORY PAGE ───
  'history-hero': [
    tf('heading', 'Heading'),
    tf('subtitle', 'Subtitle'),
    nf('total_encounters', 'Total Encounters'),
    tf('year_start', 'Year Start'),
    tf('year_end', 'Year End'),
    nf('stc_wins', 'STC Wins'),
    nf('gsc_wins', 'GSC Wins'),
    nf('draws', 'Draws'),
  ],
  'history-origin': [
    taf('text', 'Origin Story Text'),
    tf('venue', 'Venue'),
    tf('venue_detail', 'Venue Detail'),
  ],
  'history-format': [
    af('timeline_items', 'Format Timeline'),
  ],
  'history-records': [
    nf('total_encounters', 'Total Encounters'),
    tf('encounter_range', 'Encounter Range'),
    nf('stc_two_day_wins', 'STC Two-Day Wins'),
    tf('stc_two_day_notes', 'STC Two-Day Notes'),
    nf('stc_50_over_wins', 'STC 50-Over Wins'),
    tf('stc_50_over_notes', 'STC 50-Over Notes'),
    nf('gsc_wins', 'GSC Wins'),
    tf('gsc_wins_notes', 'GSC Wins Notes'),
    nf('draws', 'Draws'),
    tf('best_bowling', 'Best Bowling'),
    tf('highest_score', 'Highest Score'),
    nf('two_day_matches', 'Two-Day Matches'),
    nf('fifty_over_matches', '50-Over Matches'),
  ],
  'history-highlights': [
    af('items', 'Key Highlights'),
  ],
  'history-media': [
    af('photos', 'Memory Lane Photos'),
  ],

  // ─── ABOUT PAGE ───
  'about-history': [
    tf('heading', 'Section Heading'),
    taf('text', 'History Text'),
  ],
  'about-stc': [
    tf('heading', 'College Name'),
    imf('stc_logo', 'College Logo'),
    tf('location', 'Location'),
    tf('home_ground', 'Home Ground'),
    tf('team_name', 'Team Name'),
    tf('team_color', 'Team Color'),
  ],
  'about-gsc': [
    tf('heading', 'College Name'),
    imf('gsc_logo', 'College Logo'),
    tf('location', 'Location'),
    tf('home_ground', 'Home Ground'),
    tf('team_name', 'Team Name'),
    tf('team_color', 'Team Color'),
  ],
  'about-records': [
    tf('heading', 'Section Heading'),
    af('records_items', 'Records'),
  ],
  'about-media': [
    tf('heading', 'Section Heading'),
    taf('text', 'Description Text'),
    tf('stat1_value', 'Stat 1 Value'),
    tf('stat1_label', 'Stat 1 Label'),
    tf('stat2_value', 'Stat 2 Value'),
    tf('stat2_label', 'Stat 2 Label'),
    tf('stat3_value', 'Stat 3 Value'),
    tf('stat3_label', 'Stat 3 Label'),
  ],
  'about-contact': [
    tf('heading', 'Section Heading'),
    tf('email', 'Email'),
    tf('social', 'Social Handle'),
    tf('website', 'Website'),
    tf('press_email', 'Press Email'),
  ],

  // ─── ABOUT US SUB-TAB ───
  'about-hero': [
    tf('heading', 'Heading'),
    tf('tagline', 'Tagline'),
    imf('logo_image', 'Logo Image'),
  ],
  'about-whoweare': [
    tf('heading', 'Section Heading'),
    taf('description', 'Description'),
    tf('established', 'Established Text'),
  ],
  'about-whatwedo': [
    tf('heading', 'Section Heading'),
    af('services', 'Services'),
  ],
  'about-team': [
    tf('heading', 'Section Heading'),
    af('members', 'Team Members'),
  ],
  'about-stats': [
    nf('stat1_value', 'Stat 1 Value'),
    tf('stat1_label', 'Stat 1 Label'),
    nf('stat2_value', 'Stat 2 Value'),
    tf('stat2_label', 'Stat 2 Label'),
  ],
  'about-social': [
    tf('heading', 'Section Heading'),
    tf('instagram', 'Instagram URL'),
    tf('facebook', 'Facebook URL'),
    tf('youtube', 'YouTube URL'),
  ],
  'about-credits': [
    tf('credit_text', 'Credit Title'),
    tf('credit_name', 'Credit Name'),
  ],
  'about-location': [
    tf('heading', 'Section Heading'),
    tf('address', 'Address'),
    tf('coordinates', 'Coordinates'),
    imf('map_image', 'Map Image'),
    tf('map_link', 'Map Link (Google Maps URL)'),
  ],

  // ─── H2H SUB-TAB ───
  'h2h-record': [
    nf('stc_wins', 'STC Wins'),
    nf('gsc_wins', 'GSC Wins'),
    nf('draws', 'Draws'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
  ],
  'h2h-comparison': [
    tf('heading', 'Section Heading'),
    af('comparison_items', 'Comparison Data'),
  ],
  'h2h-results': [
    tf('heading', 'Section Heading'),
    af('results_items', 'Recent Results'),
  ],

  // ─── WEATHER SUB-TAB ───
  'weather-advisory': [
    tf('heading', 'Section Heading'),
    dtf('match_date', 'Advisory Match Date'),
    tf('match_time_label', 'Match Time Label'),
  ],
  'weather-current': [
    tf('location', 'Location'),
    nf('temp', 'Temperature (°C)'),
    nf('feels_like', 'Feels Like (°C)'),
    tf('condition', 'Condition'),
    nf('humidity', 'Humidity (%)'),
    nf('wind_speed', 'Wind Speed (km/h)'),
    nf('rain_probability', 'Rain Probability (%)'),
    nf('uv_index', 'UV Index'),
  ],
  'weather-forecast': [
    tf('heading', 'Section Heading'),
    af('forecast_items', 'Forecast Days'),
  ],
  'weather-venue': [
    tf('heading', 'Section Heading'),
    tf('venue', 'Venue'),
    tf('pitch_type', 'Pitch Type'),
    nf('average_first_innings', 'Avg 1st Innings Score'),
    tf('dew_factor', 'Dew Factor'),
    tf('floodlights', 'Floodlights'),
    tf('capacity', 'Capacity'),
  ],
  'weather-legend': [
    tf('heading', 'Section Heading'),
    taf('text', 'Text Content'),
  ],

  // ─── GALLERY PAGE ───
  'gallery-main': [
    tf('heading', 'Section Heading'),
    af('gallery_items', 'Gallery Items'),
  ],

  // ─── VIDEOS PAGE ───
  'videos-livestream': [
    tf('heading', 'Section Heading'),
    vf('video_url', 'Live Stream Video URL'),
    tf('coming_soon_text', 'Coming Soon Text'),
  ],
  'videos-grid': [
    tf('heading', 'Section Heading'),
    af('video_items', 'Video Items'),
  ],
  'videos-social': [
    tf('heading', 'Section Heading'),
    tf('youtube_url', 'YouTube Channel URL'),
    tf('facebook_url', 'Facebook Page URL'),
    tf('instagram_url', 'Instagram Profile URL'),
    tf('tiktok_url', 'TikTok Profile URL'),
    tf('youtube_label', 'YouTube Label'),
    tf('facebook_label', 'Facebook Label'),
    tf('instagram_label', 'Instagram Label'),
    tf('tiktok_label', 'TikTok Label'),
  ],

  // ─── PLAYING XI PAGE ───
  'xi-sthomas': [
    tf('heading', 'Team Name'),
    imf('team_logo', 'Team Logo'),
    tf('team_subtitle', 'Team Subtitle'),
    tf('team', 'Team Identifier'),
    af('player_items', 'Players'),
  ],
  'xi-science': [
    tf('heading', 'Team Name'),
    imf('team_logo', 'Team Logo'),
    tf('team_subtitle', 'Team Subtitle'),
    tf('team', 'Team Identifier'),
    af('player_items', 'Players'),
  ],

  // ─── FOOTER ───
  'footer-content': [
    tf('copyright', 'Copyright Text'),
    tf('facebook_url', 'Facebook URL'),
    tf('instagram_url', 'Instagram URL'),
    tf('youtube_url', 'YouTube URL'),
    imf('logo_image', 'Footer Logo'),
  ],

  // ─── COMMUNITY PAGE ───
  'community-voting': [
    tf('heading', 'Section Title'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
    tf('stc_name', 'STC Team Name'),
    tf('stc_short_name', 'STC Short Name'),
    tf('gsc_name', 'GSC Team Name'),
    tf('gsc_short_name', 'GSC Short Name'),
  ],
  'community-share': [
    tf('heading', 'Section Title'),
    tf('share_title', 'Share Card Title'),
    tf('share_subtitle', 'Share Card Subtitle'),
    tf('facebook_url', 'Facebook Share URL'),
    tf('twitter_url', 'Twitter/X Share URL'),
    tf('whatsapp_url', 'WhatsApp Share URL'),
    tf('telegram_url', 'Telegram Share URL'),
    tof('show_facebook', 'Show Facebook Button'),
    tof('show_twitter', 'Show Twitter/X Button'),
    tof('show_whatsapp', 'Show WhatsApp Button'),
    tof('show_telegram', 'Show Telegram Button'),
  ],
  'community-ball': [
    tf('heading', 'Section Title'),
    tf('ball_description', 'Ball Description Text'),
  ],
  'legacy-fan-card': [
    tf('heading', 'Section Title'),
    tf('event_overline', 'Card Title Overline'),
    tf('title_line1', 'Card Title Line 1'),
    tf('title_line2', 'Card Title Line 2'),
    tf('stc_cheers', 'STC Cheers Text'),
    tf('gsc_cheers', 'Science Cheers Text'),
    tf('website', 'Footer Website'),
    imf('branding_image', 'Thomians Media Wordmark'),
  ],
  'legacy-watch-party': [
    tf('heading', 'Section Title'),
  ],
  'cheer-meter': [
    tf('heading', 'Section Title'),
    tf('team1_name', 'Team 1 Name'),
    tf('team2_name', 'Team 2 Name'),
    tf('team1_emoji', 'Team 1 Emoji'),
    tf('team2_emoji', 'Team 2 Emoji'),
  ],

  // ─── PREDICTIONS (Community Sub-Tab) ───
  'predictions-form': [
    tf('heading', 'Section Title'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
    tf('stc_name', 'STC Team Name'),
    tf('gsc_name', 'GSC Team Name'),
  ],
  'predictions-results': [
    tf('heading', 'Section Title'),
    nf('stc_percent', 'STC Win %'),
    nf('gsc_percent', 'GSC Win %'),
    nf('total_predictions', 'Total Predictions'),
  ],
  'predictions-topScorer': [
    tf('heading', 'Section Title'),
    af('leaderboard_items', 'Top Scorer Leaderboard'),
  ],
  'predictions-topWicketTaker': [
    tf('heading', 'Section Title'),
    af('leaderboard_items', 'Top Wicket Taker Leaderboard'),
  ],
  'predictions-playerOfMatch': [
    tf('heading', 'Section Title'),
    af('leaderboard_items', 'Player of the Match Leaderboard'),
  ],

  // ─── LIVE PAGE ───
  'live-header': [
    tf('heading', 'Section Heading'),
    tf('batting_team', 'Batting Team Name'),
    tf('score', 'Score'),
    tf('overs', 'Overs'),
    tf('crr', 'Current Run Rate'),
    tf('rrr', 'Required Run Rate'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
    tf('stc_name', 'STC Team Name'),
    tf('gsc_name', 'GSC Team Name'),
  ],
  'live-currentover': [
    tf('heading', 'Section Heading'),
    tf('over_number', 'Over Number'),
    tf('runs_this_over', 'Runs This Over'),
    tf('balls', 'Ball-by-Ball (space separated)'),
  ],
  'live-batsmen': [
    tf('heading', 'Section Heading'),
    af('batsmen', 'Batsmen'),
  ],
  'live-info': [
    tf('heading', 'Section Heading'),
    tf('venue', 'Venue'),
    tf('series', 'Series'),
    tf('toss', 'Toss Info'),
    tf('result', 'Result'),
    tf('player_of_match', 'Player of the Match'),
  ],
};

// Fallback: type-based fields for sections not in SECTION_FIELDS
const TYPE_FIELDS: Record<string, FieldDef[]> = {
  hero: [
    tf('heading', 'Heading'),
    tf('subheading', 'Subheading'),
    imf('background_image', 'Background Image'),
    imf('overlay_logo', 'Logo/Emblem'),
    tf('cta_text', 'CTA Button Text'),
    tf('cta_link', 'CTA Button Link'),
  ],
  text: [
    tf('heading', 'Section Heading'),
    taf('text', 'Text Content'),
  ],
  news: [
    tf('heading', 'Section Heading'),
    nf('show_count', 'Show Count'),
    af('news_items', 'News Items'),
  ],
  gallery: [
    tf('heading', 'Section Heading'),
    nf('columns', 'Columns'),
    tof('show_lightbox', 'Show Lightbox'),
    af('gallery_items', 'Gallery Items'),
  ],
  video: [
    tf('heading', 'Section Heading'),
    vf('video_url', 'Featured Video URL'),
    tf('coming_soon_text', 'Coming Soon Text'),
    af('video_items', 'Video Items'),
  ],
  players: [
    tf('heading', 'Team Name'),
    tf('team', 'Team'),
    imf('team_logo', 'Team Logo'),
    tf('team_subtitle', 'Team Subtitle'),
    af('player_items', 'Players'),
  ],
  stats: [
    tf('heading', 'Section Heading'),
  ],
  h2h: [
    nf('stc_wins', 'STC Wins'),
    nf('gsc_wins', 'GSC Wins'),
    nf('draws', 'Draws'),
    imf('stc_logo', 'STC Logo'),
    imf('gsc_logo', 'GSC Logo'),
  ],
  weather: [
    tf('location', 'Location'),
    nf('temp', 'Temperature (°C)'),
    nf('feels_like', 'Feels Like (°C)'),
    tf('condition', 'Condition'),
    nf('humidity', 'Humidity (%)'),
    nf('wind_speed', 'Wind Speed (km/h)'),
    nf('rain_probability', 'Rain Probability (%)'),
    nf('uv_index', 'UV Index'),
    tf('venue', 'Venue'),
    tf('pitch_type', 'Pitch Type'),
    nf('average_first_innings', 'Avg 1st Innings Score'),
    tf('dew_factor', 'Dew Factor'),
    tf('floodlights', 'Floodlights'),
    tf('capacity', 'Capacity'),
  ],
  footer: [
    tf('copyright', 'Copyright Text'),
    tf('facebook_url', 'Facebook URL'),
    tf('instagram_url', 'Instagram URL'),
    tf('youtube_url', 'YouTube URL'),
    imf('logo_image', 'Footer Logo'),
  ],
  preloader: [
    af('sentences', 'Sentences'),
    tf('primary_color', 'Primary Color'),
    tf('secondary_color', 'Secondary Color'),
    tf('background_color', 'Background Color'),
  ],
  navigation: [
    imf('logo_image', 'Logo Image'),
    af('links', 'Navigation Links'),
  ],
  scorecard: [
    tf('heading', 'Section Heading'),
    tf('team', 'Team Name'),
    nf('total_runs', 'Total Runs'),
    nf('total_wkts', 'Total Wickets'),
    tf('total_overs', 'Total Overs'),
  ],
};

function getSectionFields(sectionId: string, type: string): FieldDef[] {
  // 1. Exact section ID match (highest priority)
  if (SECTION_FIELDS[sectionId]) {
    return SECTION_FIELDS[sectionId];
  }
  // 2. Type-based fallback
  if (TYPE_FIELDS[type]) {
    return TYPE_FIELDS[type];
  }
  // 3. Minimal default
  return [tf('heading', 'Heading')];
}

/* ─── Array Field Sub-Fields ─── */
function getArrayItemFields(type: string, arrayKey: string, sectionId?: string): { key: string; label: string; type: 'text' | 'image' | 'video' }[] {
  if (arrayKey === 'news_items') {
    return [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'date', label: 'Date', type: 'text' },
    ];
  }
  if (arrayKey === 'player_items') {
    return [
      { key: 'name', label: 'Player Name', type: 'text' as const },
      { key: 'role', label: 'Role', type: 'select' as const, options: [
        { value: 'batsman', label: 'Batsman' },
        { value: 'bowler', label: 'Bowler' },
        { value: 'wicketkeeper', label: 'Wicket Keeper' },
        { value: 'all-rounder', label: 'All Rounder' },
      ]},
      { key: 'photo', label: 'Photo', type: 'image' as const },
      { key: 'school', label: 'School', type: 'text' as const },
      { key: 'jerseyNumber', label: 'Jersey #', type: 'text' as const },
      { key: 'designation', label: 'Designation', type: 'select' as const, options: [
        { value: '', label: 'None' },
        { value: 'captain', label: 'Captain' },
        { value: 'vice-captain', label: 'Vice Captain' },
        { value: 'coach', label: 'Coach' },
        { value: 'master-in-charge', label: 'Master-in-Charge' },
      ]},
    ];
  }
  if (arrayKey === 'video_items') {
    return [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'thumbnail', label: 'Thumbnail', type: 'image' },
      { key: 'video_url', label: 'Video URL', type: 'video' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
    ];
  }
  if (arrayKey === 'gallery_items') {
    return [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'label', label: 'Caption', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
    ];
  }
  if (arrayKey === 'results_items') {
    return [
      { key: 'match', label: 'Match', type: 'text' },
      { key: 'result', label: 'Result', type: 'text' },
      { key: 'winner', label: 'Winner', type: 'text' },
    ];
  }
  if (arrayKey === 'links') {
    return [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'href', label: 'URL', type: 'text' },
    ];
  }
  if (arrayKey === 'sentences') {
    return [
      { key: 'text', label: 'Sentence', type: 'text' },
    ];
  }
  if (arrayKey === 'records_items') {
    return [
      { key: 'label', label: 'Record Name', type: 'text' },
      { key: 'team1', label: 'STC Value', type: 'text' },
      { key: 'team2', label: 'GSC Value', type: 'text' },
      { key: 'detail', label: 'Detail', type: 'text' },
    ];
  }
  if (arrayKey === 'comparison_items') {
    return [
      { key: 'label', label: 'Stat Label', type: 'text' },
      { key: 'team1Value', label: 'STC Value (Number)', type: 'text' },
      { key: 'team2Value', label: 'GSC Value (Number)', type: 'text' },
      { key: 'team1Display', label: 'STC Display', type: 'text' },
      { key: 'team2Display', label: 'GSC Display', type: 'text' },
    ];
  }
  if (arrayKey === 'leaderboard_items') {
    return [
      { key: 'name', label: 'Player Name', type: 'text' },
      { key: 'team', label: 'Team (STC/GSC)', type: 'text' },
      { key: 'votes', label: 'Votes', type: 'text' },
      { key: 'percent', label: 'Percent', type: 'text' },
    ];
  }
  if (arrayKey === 'forecast_items') {
    return [
      { key: 'day', label: 'Day', type: 'text' },
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'icon', label: 'Icon (Emoji)', type: 'text' },
      { key: 'condition', label: 'Condition', type: 'text' },
      { key: 'high', label: 'High Temp', type: 'text' },
      { key: 'low', label: 'Low Temp', type: 'text' },
      { key: 'rainProbability', label: 'Rain Prob %', type: 'text' },
      { key: 'humidity', label: 'Humidity %', type: 'text' },
      { key: 'wind', label: 'Wind km/h', type: 'text' },
    ];
  }
  if (arrayKey === 'batsmen') {
    return [
      { key: 'name', label: 'Batsman Name', type: 'text' },
      { key: 'runs', label: 'Runs', type: 'text' },
      { key: 'balls', label: 'Balls', type: 'text' },
      { key: 'fours', label: '4s', type: 'text' },
      { key: 'sixes', label: '6s', type: 'text' },
      { key: 'sr', label: 'Strike Rate', type: 'text' },
      { key: 'on_strike', label: 'On Strike (true/false)', type: 'text' },
    ];
  }
  if (arrayKey === 'portfolio_items') {
    return [
      { key: 'label', label: 'Item Label', type: 'text' },
      { key: 'icon', label: 'Icon Name', type: 'text' },
    ];
  }
  if (arrayKey === 'timeline_items') {
    return [
      { key: 'year', label: 'Year / Period', type: 'text' },
      { key: 'format', label: 'Format', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'dot_color', label: 'Dot Color (gold/red/gray)', type: 'text' },
    ];
  }
  if (arrayKey === 'items' && sectionId?.startsWith('history-highlights')) {
    return [
      { key: 'label', label: 'Highlight Label', type: 'text' },
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'team', label: 'Team (STC/GSC)', type: 'text' },
    ];
  }
  if (arrayKey === 'voting_options') {
    return [
      { key: 'name', label: 'Player Name', type: 'text' },
      { key: 'team', label: 'Team (STC/GSC)', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image' },
    ];
  }
  if (arrayKey === 'photos') {
    return [
      { key: 'src', label: 'Photo URL', type: 'image' },
      { key: 'caption', label: 'Caption', type: 'text' },
    ];
  }
  if (arrayKey === 'services') {
    return [
      { key: 'title', label: 'Service Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'icon', label: 'Icon (radio/camera/video/volume/megaphone/share)', type: 'text' },
    ];
  }
  if (arrayKey === 'members') {
    return [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image' },
    ];
  }
  return [
    { key: 'value', label: 'Value', type: 'text' },
  ];
}

/* ─── Main InlineEditPanel ─── */
export default function InlineEditPanel() {
  const { editingSection, setEditingSection, triggerRefresh, focusedField, setFocusedField } = useAdminEdit();
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isInAdminDashboard, setIsInAdminDashboard] = useState(false);

  // Track whether the user is viewing the site through the admin dashboard
  useEffect(() => {
    const checkPath = () => {
      setIsInAdminDashboard(window.location.pathname.includes('/admin/dashboard'));
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    // Observe DOM changes to catch Next.js SPA navigation
    const observer = new MutationObserver(checkPath);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('popstate', checkPath);
      observer.disconnect();
    };
  }, []);

  // When section changes, update local state
  useEffect(() => {
    if (editingSection) {
      const safeContent = (editingSection.content && typeof editingSection.content === 'object' && !Array.isArray(editingSection.content))
        ? { ...editingSection.content }
        : {};
      setContent(safeContent);
      setTitle(editingSection.title || '');
      setIsPublished(editingSection.is_published !== false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setFocusedField(null);
    }
  }, [editingSection, setFocusedField]);

  // Scroll to focused field when it changes
  useEffect(() => {
    if (focusedField && isOpen && panelRef.current) {
      const fieldEl = panelRef.current.querySelector(`[data-field-key="${focusedField}"]`);
      if (fieldEl) {
        fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldEl.classList.add('ring-2', 'ring-gold');
        setTimeout(() => {
          fieldEl.classList.remove('ring-2', 'ring-gold');
        }, 2000);
      }
    }
  }, [focusedField, isOpen]);

  if (!editingSection || !isInAdminDashboard) return null;

  const fields = getSectionFields(editingSection.id, editingSection.type);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to API
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSection.id,
          title,
          content,
          is_published: isPublished,
          // Bug 7 fix: include is_visible so it doesn't revert on re-edit
          is_visible: editingSection.is_visible !== false,
        }),
      });

      // Track as draft change — use 'page' type for new sections, 'section' for edits
      const isNewSection = editingSection.id.startsWith('dyn-');
      if (isNewSection) {
        addDraftChange('page', editingSection.page_id || editingSection.id, `New section: ${title || editingSection.title || editingSection.id}`);
      } else {
        addDraftChange('section', editingSection.id, `Edited: ${title || editingSection.title || editingSection.id}`);
      }

      if (res.ok) {
        triggerRefresh();
        setEditingSection(null);
      } else {
        // API save failed (section might not exist in API) — try creating it
        const createRes = await fetch('/api/admin/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSection.id,
            pageId: editingSection.page_id,
            type: editingSection.type,
            title,
            content,
            is_published: isPublished,
          }),
        });
        if (createRes.ok) {
          triggerRefresh();
          setEditingSection(null);
        } else {
          triggerRefresh();
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      // Track as draft change
      const isNewSection = editingSection.id.startsWith('dyn-');
      if (isNewSection) {
        addDraftChange('page', editingSection.page_id || editingSection.id, `New section: ${title || editingSection.title || editingSection.id}`);
      } else {
        addDraftChange('section', editingSection.id, `Edited: ${title || editingSection.title || editingSection.id}`);
      }
      triggerRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // For dynamically-added sections (ID starts with 'dyn-'), offer permanent delete
    const isDynamic = editingSection.id.startsWith('dyn-');
    const msg = isDynamic
      ? 'Permanently delete this section? This cannot be undone.'
      : 'Hide this section? It can be restored later from edit mode.';
    if (!confirm(msg)) return;
    try {
      if (isDynamic) {
        // Permanently delete dynamic sections
        await fetch(`/api/admin/sections?id=${editingSection.id}`, { method: 'DELETE' });
      } else {
        // Instead of deleting hardcoded sections, set is_visible: false
        await fetch('/api/admin/sections', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSection.id,
            is_visible: false,
            is_published: false,
          }),
        });
      }

      triggerRefresh();
      setEditingSection(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRestore = async () => {
    try {
      await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSection.id,
          is_visible: true,
          is_published: true,
        }),
      });

      triggerRefresh();
      setEditingSection(null);
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const updateContent = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/50"
          onClick={() => setEditingSection(null)}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 bottom-0 z-[9991] w-full sm:w-[420px] bg-lux-bg border-l border-lux-border overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-lux-bg border-b border-lux-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gold" style={{ borderRadius: 0 }} />
            <h2 className="text-[10px] uppercase tracking-[3px] font-bold text-text-primary">
              Edit Section
            </h2>
          </div>
          <button
            onClick={() => setEditingSection(null)}
            className="text-text-muted hover:text-gold transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 space-y-4">
          {/* Section Type Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gold/10 text-gold text-[8px] uppercase tracking-[1.5px] font-bold border border-gold/20" style={{ borderRadius: 0 }}>
              {editingSection.type}
            </span>
            <span className="text-[9px] text-text-muted">ID: {editingSection.id}</span>
          </div>

          {/* Title field */}
          <div>
            <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[9px] uppercase tracking-[2px] font-semibold text-text-muted">
                Published
              </label>
              {!isPublished && (
                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[7px] uppercase tracking-[1px] font-bold border border-yellow-500/20" style={{ borderRadius: 0 }}>
                  Draft
                </span>
              )}
            </div>
            <button
              onClick={() => setIsPublished(!isPublished)}
              className={`relative w-10 h-5 transition-colors ${
                isPublished ? 'bg-gold' : 'bg-lux-border'
              }`}
              style={{ borderRadius: 0 }}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${
                  isPublished ? 'left-5' : 'left-0.5'
                }`}
                style={{ borderRadius: 0 }}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-lux-border" />

          {/* Dynamic fields based on section type */}
          {fields.map((field) => (
            <div key={field.key} data-field-key={field.key} className="transition-all duration-300">
              {field.type === 'select' && (
                <div key={field.key}>
                  <label className="block text-[8px] uppercase tracking-[1.5px] text-text-muted mb-1 mt-3">{field.label}</label>
                  <select
                    value={(content[field.key] as string) || ''}
                    onChange={(e) => {
                      updateContent(field.key, e.target.value);
                    }}
                    className="w-full bg-lux-card border border-lux-border px-2.5 py-1.5 text-xs text-text-primary focus:border-gold/50 focus:outline-none appearance-none cursor-pointer"
                    style={{ borderRadius: 0 }}
                  >
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {field.type === 'text' && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(content[field.key] as string) || ''}
                    onChange={(e) => updateContent(field.key, e.target.value)}
                    className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              )}

              {field.type === 'textarea' && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted mb-1">
                    {field.label}
                  </label>
                  <textarea
                    value={(content[field.key] as string) || ''}
                    onChange={(e) => updateContent(field.key, e.target.value)}
                    rows={5}
                    className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none resize-y"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              )}

              {field.type === 'number' && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted mb-1">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={(content[field.key] as number) || 0}
                    onChange={(e) => updateContent(field.key, parseInt(e.target.value) || 0)}
                    className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              )}

              {field.type === 'toggle' && (
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase tracking-[2px] font-semibold text-text-muted">
                    {field.label}
                  </label>
                  <button
                    onClick={() => updateContent(field.key, !content[field.key])}
                    className={`relative w-10 h-5 transition-colors ${
                      content[field.key] ? 'bg-gold' : 'bg-lux-border'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${
                        content[field.key] ? 'left-5' : 'left-0.5'
                      }`}
                      style={{ borderRadius: 0 }}
                    />
                  </button>
                </div>
              )}

              {field.type === 'image' && (
                <MediaPicker
                  value={(content[field.key] as string) || ''}
                  onChange={(url) => updateContent(field.key, url)}
                  label={field.label}
                />
              )}

              {field.type === 'video' && (
                <MediaPicker
                  value={(content[field.key] as string) || ''}
                  onChange={(url) => updateContent(field.key, url)}
                  label={field.label}
                  accept="video/*"
                />
              )}

              {field.type === 'datetime' && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[2px] font-semibold text-text-muted mb-1">
                    {field.label}
                  </label>
                  <input
                    type="datetime-local"
                    value={(content[field.key] as string) || ''}
                    onChange={(e) => updateContent(field.key, e.target.value)}
                    className="w-full bg-lux-surface border border-lux-border px-3 py-2 text-xs text-text-primary focus:border-gold/50 focus:outline-none"
                    style={{ borderRadius: 0, colorScheme: 'dark' }}
                  />
                  {(content[field.key] as string) && (
                    <p className="text-[8px] text-text-muted mt-1 uppercase tracking-[1px]">
                      Currently set to: {new Date((content[field.key] as string)).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {field.type === 'array' && (
                <ArrayItemEditor
                  items={((content[field.key] as Record<string, unknown>[]) || [])}
                  onChange={(items) => updateContent(field.key, items)}
                  itemLabel={field.label}
                  fields={getArrayItemFields(editingSection.type, field.key, editingSection.id)}
                />
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="h-px bg-lux-border" />

          {/* Visibility info */}
          {editingSection.is_visible === false && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] uppercase tracking-[1.5px] font-bold text-center">
              This section is currently HIDDEN
            </div>
          )}

          {/* Save / Delete / Restore Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gold text-lux-bg text-[10px] uppercase tracking-[2px] font-bold hover:bg-gold-bright transition-colors disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {editingSection.is_visible !== false ? (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-[2px] font-bold hover:bg-red-500/10 transition-colors"
                style={{ borderRadius: 0 }}
              >
                {editingSection.id.startsWith('dyn-') ? 'Delete' : 'Hide'}
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="px-4 py-2.5 border border-green-500/30 text-green-400 text-[10px] uppercase tracking-[2px] font-bold hover:bg-green-500/10 transition-colors"
                style={{ borderRadius: 0 }}
              >
                Restore
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
