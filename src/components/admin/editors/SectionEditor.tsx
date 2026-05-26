'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import ImageField from './ImageField';
import VideoField from './VideoField';

interface SectionEditorProps {
  section: {
    id: string;
    type: string;
    title?: string;
    content: Record<string, unknown>;
    position: number;
    is_visible: boolean;
  };
  onClose: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

const sectionTypes = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'news', label: 'News & Updates' },
  { value: 'gallery', label: 'Photo Gallery' },
  { value: 'video', label: 'Video Section' },
  { value: 'text', label: 'Text Content' },
  { value: 'players', label: 'Players Section' },
  { value: 'stats', label: 'Statistics' },
];

// Simple text/number/toggle input
function FieldInput({ label, value, onChange, type = 'text', placeholder }: {
  label: string;
  value: string | number | boolean;
  onChange: (val: string | number | boolean) => void;
  type?: 'text' | 'number' | 'url' | 'textarea' | 'toggle';
  placeholder?: string;
}) {
  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-[#8A8780] text-sm">{label}</label>
        <button
          onClick={() => onChange(!value)}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors ${
            value ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {value ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-[#8A8780] text-sm mb-1.5">{label}</label>
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] resize-y"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-[#8A8780] text-sm mb-1.5">{label}</label>
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={String(value || '')}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
      />
    </div>
  );
}

// Gallery item editor — single image in gallery
function GalleryItem({ item, onUpdate, onRemove }: {
  item: { url: string; alt?: string; caption?: string };
  onUpdate: (data: { url: string; alt?: string; caption?: string }) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 p-2 bg-[#0e0e14] border border-[#1a1a22] rounded-sm group">
      {/* Thumbnail preview */}
      <div className="w-20 h-20 flex-shrink-0 bg-[#08080c] border border-[#1a1a22] rounded-sm overflow-hidden">
        {item.url ? (
          <img src={item.url} alt={item.alt || ''} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4A4945]">
            <Plus className="w-5 h-5" />
          </div>
        )}
      </div>
      {/* Fields */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <ImageField
          label="Image URL"
          value={item.url}
          onChange={(url) => onUpdate({ ...item, url })}
          placeholder="Upload or paste URL"
        />
        <input
          value={item.alt || ''}
          onChange={(e) => onUpdate({ ...item, alt: e.target.value })}
          placeholder="Alt text (for accessibility)"
          className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm px-2 py-1 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
        />
        <input
          value={item.caption || ''}
          onChange={(e) => onUpdate({ ...item, caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm px-2 py-1 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
        />
      </div>
      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 text-[#4A4945] hover:text-red-400 transition-colors self-start"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Player item editor
function PlayerItem({ player, onUpdate, onRemove }: {
  player: { name: string; role: string; image: string; emblem?: string };
  onUpdate: (data: { name: string; role: string; image: string; emblem?: string }) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 p-3 bg-[#0e0e14] border border-[#1a1a22] rounded-sm">
      {/* Player image + emblem */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-[#08080c] border border-[#1a1a22] overflow-hidden">
          {player.image ? (
            <img src={player.image} alt={player.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#4A4945] text-[10px]">Photo</div>
          )}
        </div>
        {/* Emblem badge */}
        {player.emblem && (
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#0e0e14] border border-[#1a1a22] overflow-hidden">
            <img src={player.emblem} alt="Emblem" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </div>
      {/* Player info */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <input
          value={player.name}
          onChange={(e) => onUpdate({ ...player, name: e.target.value })}
          placeholder="Player name"
          className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm px-2.5 py-1.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
        />
        <input
          value={player.role}
          onChange={(e) => onUpdate({ ...player, role: e.target.value })}
          placeholder="Role (e.g. Batsman, Bowler, All-rounder)"
          className="w-full bg-[#08080c] border border-[#1a1a22] rounded-sm px-2.5 py-1.5 text-[#F0EDE6] text-xs placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <ImageField label="Photo" value={player.image} onChange={(url) => onUpdate({ ...player, image: url })} placeholder="Player photo" />
          </div>
          <div className="flex-1">
            <ImageField label="Emblem" value={player.emblem || ''} onChange={(url) => onUpdate({ ...player, emblem: url })} placeholder="Team emblem" isEmblem />
          </div>
        </div>
      </div>
      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 text-[#4A4945] hover:text-red-400 transition-colors self-start"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Video item for multi-video sections (using video_url field to match VideosTab)
function VideoGridItem({ video, onUpdate, onRemove }: {
  video: { title: string; thumbnail: string; video_url: string; duration: string; category: string };
  onUpdate: (data: { title: string; thumbnail: string; video_url: string; duration: string; category: string }) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 bg-[#0e0e14] border border-[#1a1a22] rounded-sm space-y-2">
      <div className="flex items-center justify-between">
        <input
          value={video.title}
          onChange={(e) => onUpdate({ ...video, title: e.target.value })}
          placeholder="Video title"
          className="flex-1 bg-[#08080c] border border-[#1a1a22] rounded-sm px-2.5 py-1.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
        />
        <button onClick={onRemove} className="p-1 ml-2 text-[#4A4945] hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <VideoField
        label="Video URL"
        value={video.video_url}
        onChange={(url) => onUpdate({ ...video, video_url: url })}
        placeholder="YouTube or video URL"
        showUpload={false}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <ImageField
            label="Thumbnail"
            value={video.thumbnail}
            onChange={(url) => onUpdate({ ...video, thumbnail: url })}
            placeholder="Thumbnail image"
            aspectHint="16:9"
          />
        </div>
        <div className="w-24">
          <FieldInput label="Duration" value={video.duration} onChange={(v) => onUpdate({ ...video, duration: String(v) })} placeholder="12:34" />
        </div>
      </div>
      <FieldInput label="Category" value={video.category} onChange={(v) => onUpdate({ ...video, category: String(v) })} placeholder="highlights / analysis / interview" />
    </div>
  );
}

export default function SectionEditor({ section, onClose, onUpdate, onDelete }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title || '');
  const [type, setType] = useState(section.type);
  const [isVisible, setIsVisible] = useState(section.is_visible);
  const [content, setContent] = useState<Record<string, unknown>>({ ...section.content } || {});

  const updateContent = (key: string, value: string | number | boolean | unknown[]) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdate(section.id, { title, type, is_visible: isVisible, content });
    onClose();
  };

  // Render type-specific form fields
  const renderTypeFields = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="space-y-3">
            <FieldInput label="Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Main heading text" />
            <FieldInput label="Subheading" value={content.subheading as string || ''} onChange={(v) => updateContent('subheading', v)} placeholder="Subheading text" />
            <ImageField
              label="Background Image"
              value={content.background_image as string || ''}
              onChange={(url) => updateContent('background_image', url)}
              placeholder="Upload or paste hero background image URL"
              aspectHint="16:9 recommended"
            />
            <ImageField
              label="Overlay Logo"
              value={content.overlay_logo as string || ''}
              onChange={(url) => updateContent('overlay_logo', url)}
              placeholder="Logo to display over hero"
            />
            <FieldInput label="CTA Button Text" value={content.cta_text as string || ''} onChange={(v) => updateContent('cta_text', v)} placeholder="Watch Live" />
            <FieldInput label="CTA Button Link" value={content.cta_link as string || ''} onChange={(v) => updateContent('cta_link', v)} type="url" placeholder="/live" />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <FieldInput label="Text Content" value={content.text as string || ''} onChange={(v) => updateContent('text', v)} type="textarea" placeholder="Enter your text content here..." />
          </div>
        );

      case 'news':
        return (
          <div className="space-y-3">
            <FieldInput label="Section Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Latest News & Updates" />
            <ImageField
              label="Featured Image"
              value={content.featured_image as string || ''}
              onChange={(url) => updateContent('featured_image', url)}
              placeholder="Upload or paste featured image"
            />
            <FieldInput label="Number of Items" value={content.show_count as number || 6} onChange={(v) => updateContent('show_count', v)} type="number" />
          </div>
        );

      case 'gallery': {
        const images = (content.images as Array<{ url: string; alt?: string; caption?: string }>) || [];
        return (
          <div className="space-y-3">
            <FieldInput label="Section Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Photo Gallery" />
            <FieldInput label="Columns" value={content.columns as number || 3} onChange={(v) => updateContent('columns', v)} type="number" />
            <FieldInput label="Lightbox" value={content.show_lightbox as boolean || false} onChange={(v) => updateContent('show_lightbox', v)} type="toggle" />
            <ImageField
              label="Cover Image"
              value={content.cover_image as string || ''}
              onChange={(url) => updateContent('cover_image', url)}
              placeholder="Gallery cover/thumbnail"
            />
            {/* Gallery images */}
            <div className="border-t border-[#1a1a22] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#8A8780] text-sm font-medium">Gallery Images ({images.length})</p>
                <button
                  onClick={() => updateContent('images', [...images, { url: '', alt: '', caption: '' }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#FFC300]/10 text-[#FFC300] border border-[#FFC300]/20 rounded-sm text-xs hover:bg-[#FFC300]/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Image
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {images.map((img, i) => (
                  <GalleryItem
                    key={i}
                    item={img}
                    onUpdate={(data) => {
                      const updated = [...images];
                      updated[i] = data;
                      updateContent('images', updated);
                    }}
                    onRemove={() => {
                      const updated = images.filter((_, idx) => idx !== i);
                      updateContent('images', updated);
                    }}
                  />
                ))}
                {images.length === 0 && (
                  <p className="text-[#4A4945] text-xs text-center py-4">No images yet — click "Add Image" to start</p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'video': {
        // Use 'video_items' key (matches VideosTab) with video_url field name
        const videoItems = (content.video_items as Array<{ title: string; thumbnail: string; video_url: string; duration: string; category: string }>) || [];
        return (
          <div className="space-y-3">
            <FieldInput label="Section Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Video Highlights" />
            {/* Main/featured video */}
            <VideoField
              label="Featured Video"
              value={content.video_url as string || ''}
              onChange={(url) => updateContent('video_url', url)}
              placeholder="YouTube or video URL"
            />
            <ImageField
              label="Custom Thumbnail"
              value={content.thumbnail as string || ''}
              onChange={(url) => updateContent('thumbnail', url)}
              placeholder="Custom video thumbnail"
              aspectHint="16:9"
            />
            {/* Additional videos - using video_items key to match VideosTab */}
            <div className="border-t border-[#1a1a22] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#8A8780] text-sm font-medium">All Videos ({videoItems.length})</p>
                <button
                  onClick={() => updateContent('video_items', [...videoItems, { title: '', thumbnail: '', video_url: '', duration: '', category: 'highlights' }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#FFC300]/10 text-[#FFC300] border border-[#FFC300]/20 rounded-sm text-xs hover:bg-[#FFC300]/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Video
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {videoItems.map((vid, i) => (
                  <VideoGridItem
                    key={i}
                    video={vid}
                    onUpdate={(data) => {
                      const updated = [...videoItems];
                      updated[i] = data;
                      updateContent('video_items', updated);
                    }}
                    onRemove={() => {
                      const updated = videoItems.filter((_, idx) => idx !== i);
                      updateContent('video_items', updated);
                    }}
                  />
                ))}
                {videoItems.length === 0 && (
                  <p className="text-[#4A4945] text-xs text-center py-4">No additional videos — click "Add Video" to add</p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'players': {
        const players = (content.players as Array<{ name: string; role: string; image: string; emblem?: string }>) || [];
        const teamEmblem = content.team_emblem as string || '';
        return (
          <div className="space-y-3">
            <FieldInput label="Section Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Players" />
            <FieldInput label="Team" value={content.team as string || ''} onChange={(v) => updateContent('team', v)} placeholder="st_thomas or royal" />
            <ImageField
              label="Team Emblem / Logo"
              value={teamEmblem}
              onChange={(url) => updateContent('team_emblem', url)}
              placeholder="Upload team emblem or logo"
              isEmblem
              showEmblemBadge
              aspectHint="Square (1:1)"
            />
            <ImageField
              label="Team Banner Image"
              value={content.team_banner as string || ''}
              onChange={(url) => updateContent('team_banner', url)}
              placeholder="Team group photo or banner"
            />
            {/* Players list */}
            <div className="border-t border-[#1a1a22] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#8A8780] text-sm font-medium">Players ({players.length})</p>
                <button
                  onClick={() => updateContent('players', [...players, { name: '', role: '', image: '', emblem: teamEmblem }])}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#FFC300]/10 text-[#FFC300] border border-[#FFC300]/20 rounded-sm text-xs hover:bg-[#FFC300]/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Player
                </button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {players.map((player, i) => (
                  <PlayerItem
                    key={i}
                    player={player}
                    onUpdate={(data) => {
                      const updated = [...players];
                      updated[i] = data;
                      updateContent('players', updated);
                    }}
                    onRemove={() => {
                      const updated = players.filter((_, idx) => idx !== i);
                      updateContent('players', updated);
                    }}
                  />
                ))}
                {players.length === 0 && (
                  <p className="text-[#4A4945] text-xs text-center py-4">No players yet — click "Add Player" to start</p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'stats':
        return (
          <div className="space-y-3">
            <FieldInput label="Section Heading" value={content.heading as string || ''} onChange={(v) => updateContent('heading', v)} placeholder="Match Statistics" />
            <ImageField
              label="Background Image"
              value={content.background_image as string || ''}
              onChange={(url) => updateContent('background_image', url)}
              placeholder="Stats section background"
            />
            <FieldInput label="Show Batting" value={content.show_batting as boolean || false} onChange={(v) => updateContent('show_batting', v)} type="toggle" />
            <FieldInput label="Show Bowling" value={content.show_bowling as boolean || false} onChange={(v) => updateContent('show_bowling', v)} type="toggle" />
            <FieldInput label="Show Fielding" value={content.show_fielding as boolean || false} onChange={(v) => updateContent('show_fielding', v)} type="toggle" />
            <FieldInput label="Auto Refresh" value={content.auto_refresh as boolean || false} onChange={(v) => updateContent('auto_refresh', v)} type="toggle" />
            {content.auto_refresh && (
              <FieldInput label="Refresh Interval (seconds)" value={content.refresh_interval as number || 30} onChange={(v) => updateContent('refresh_interval', v)} type="number" />
            )}
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-[#8A8780] text-sm mb-1.5">Content (JSON)</label>
            <textarea
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => { try { setContent(JSON.parse(e.target.value)); } catch {} }}
              className="w-full h-48 bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-xs font-mono placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300] resize-y"
              placeholder="{}"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#08080c] border border-[#1a1a22] rounded-sm w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a22] sticky top-0 bg-[#08080c] z-10">
          <h3 className="text-[#F0EDE6] font-semibold">Edit Section</h3>
          <button onClick={onClose} className="text-[#8A8780] hover:text-[#F0EDE6]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#8A8780] text-sm mb-1.5">Section Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm focus:outline-none focus:border-[#FFC300]"
              >
                {sectionTypes.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#8A8780] text-sm mb-1.5">Visibility</label>
              <button
                onClick={() => setIsVisible(!isVisible)}
                className={`w-full px-3 py-2.5 rounded-sm text-sm font-medium border transition-colors ${
                  isVisible ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                {isVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[#8A8780] text-sm mb-1.5">Section Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section title..."
              className="w-full bg-[#0e0e14] border border-[#1a1a22] rounded-sm px-3 py-2.5 text-[#F0EDE6] text-sm placeholder-[#4A4945] focus:outline-none focus:border-[#FFC300]"
            />
          </div>

          <div className="border-t border-[#1a1a22] pt-4">
            <p className="text-[#4A4945] text-[9px] uppercase tracking-[3px] mb-3">Section Content</p>
            {renderTypeFields()}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-[#1a1a22] sticky bottom-0 bg-[#08080c]">
          <button
            onClick={() => { onDelete(section.id); onClose(); }}
            className="px-4 py-2 rounded-sm bg-red-500/10 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-6 py-2 rounded-sm bg-[#0e0e14] text-[#F0EDE6] text-sm hover:bg-[#141418] border border-[#1a1a22] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-6 py-2 rounded-sm bg-[#FFC300] text-[#020204] text-sm font-semibold hover:bg-[#FFD54F] transition-colors">
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
