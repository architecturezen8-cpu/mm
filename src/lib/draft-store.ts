// Draft Store — in-memory draft tracking
// Tracks all pending draft changes with timestamps so the admin
// can see what's changed before publishing.
// Data only persists in memory during the session (cleared on page refresh).

export interface DraftChange {
  type: 'settings' | 'preloader' | 'section' | 'page' | 'github_config' | 'toggle' | 'poll_config';
  id: string; // section id, page id, etc
  label: string; // human-readable description
  timestamp: string;
}

// In-memory storage — persists only during the browser session
let draftChanges: DraftChange[] = [];

/** Get all pending draft changes */
export function getDraftChanges(): DraftChange[] {
  return draftChanges;
}

/** Track a new draft change */
export function addDraftChange(
  type: DraftChange['type'],
  id: string,
  label: string,
): void {
  // De-duplicate: if the same type+id already exists, update it instead of adding a duplicate
  const existingIdx = draftChanges.findIndex((c) => c.type === type && c.id === id);
  const newChange: DraftChange = {
    type,
    id,
    label,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    draftChanges[existingIdx] = newChange;
  } else {
    draftChanges.push(newChange);
  }
}

/** Clear all drafts (called after publish) */
export function clearDraftChanges(): void {
  draftChanges = [];
}

/** Check if there are pending drafts */
export function hasDrafts(): boolean {
  return draftChanges.length > 0;
}

/** Get the number of pending drafts */
export function getDraftCount(): number {
  return draftChanges.length;
}

/** Format a timestamp to a relative "time ago" string */
export function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
