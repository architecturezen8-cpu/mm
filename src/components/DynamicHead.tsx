'use client';

import { useEffect } from 'react';

interface SiteSettings {
  siteName?: string;
  siteDescription?: string;
  siteFavicon?: string;
  siteLogo?: string;
  primaryColor?: string;
  accentColor?: string;
  stThomasEmblem?: string;
  royalEmblem?: string;
  maintenanceMode?: boolean;
}

const EVENT_NAME = 'site-settings-updated';

const DEFAULTS: Required<SiteSettings> = {
  siteName: "BATTLE OF THE GOLDS — Thomians' Media",
  siteDescription:
    'Official coverage of Battle of the Golds — The Golden Rivalry. Live scores, analytics, community and more.',
  siteFavicon: '/logos/thomians-media-round-logo.jpg',
  siteLogo: '/logos/thomians-media-round-logo.jpg',
  primaryColor: '#FFC300',
  accentColor: '#E63946',
  stThomasEmblem: '',
  royalEmblem: '',
  maintenanceMode: false,
};

function mergeWithDefaults(parsed: SiteSettings): Required<SiteSettings> {
  return {
    siteName: parsed.siteName || DEFAULTS.siteName,
    siteDescription: parsed.siteDescription || DEFAULTS.siteDescription,
    siteFavicon: parsed.siteFavicon || DEFAULTS.siteFavicon,
    siteLogo: parsed.siteLogo || DEFAULTS.siteLogo,
    primaryColor: parsed.primaryColor || DEFAULTS.primaryColor,
    accentColor: parsed.accentColor || DEFAULTS.accentColor,
    stThomasEmblem: parsed.stThomasEmblem || DEFAULTS.stThomasEmblem,
    royalEmblem: parsed.royalEmblem || DEFAULTS.royalEmblem,
    maintenanceMode: parsed.maintenanceMode ?? DEFAULTS.maintenanceMode,
  };
}

async function fetchSettingsFromAPI(): Promise<Required<SiteSettings> | null> {
  try {
    const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        return mergeWithDefaults(data);
      }
    }
  } catch {
    // API unavailable — fall through
  }
  return null;
}

function applySettings(settings: Required<SiteSettings>) {
  // Update document title
  document.title = settings.siteName;

  // Update or create favicon <link rel="icon">
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = settings.siteFavicon;

  // Also update apple-touch-icon if present
  const appleIcon = document.querySelector<HTMLLinkElement>(
    'link[rel="apple-touch-icon"]'
  );
  if (appleIcon) {
    appleIcon.href = settings.siteFavicon;
  }

  // Update or create meta description
  let metaDesc = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = settings.siteDescription;

  // Apply theme colors as CSS custom properties on the document root
  document.documentElement.style.setProperty(
    '--color-primary',
    settings.primaryColor
  );
  document.documentElement.style.setProperty(
    '--color-accent',
    settings.accentColor
  );

  // Apply site logo as a CSS variable for components to reference
  document.documentElement.style.setProperty(
    '--site-logo',
    `url(${settings.siteLogo})`
  );

  // Bug 8 fix: Apply team emblems as CSS custom properties
  if (settings.stThomasEmblem) {
    document.documentElement.style.setProperty(
      '--stc-emblem',
      settings.stThomasEmblem
    );
  }
  if (settings.royalEmblem) {
    document.documentElement.style.setProperty(
      '--royal-emblem',
      settings.royalEmblem
    );
  }

  // Dispatch maintenance mode event for ClientLayout to pick up
  window.dispatchEvent(
    new CustomEvent('site-maintenance-mode', {
      detail: { maintenanceMode: settings.maintenanceMode },
    })
  );
}

export default function DynamicHead() {
  useEffect(() => {
    // Fetch settings from API
    fetchSettingsFromAPI().then((apiSettings) => {
      if (apiSettings) {
        applySettings(apiSettings);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, { detail: apiSettings })
        );
      } else {
        // API had no data — use defaults
        applySettings(DEFAULTS);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, { detail: DEFAULTS })
        );
      }
    });

    // Listen for future updates (e.g. admin saves settings)
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        const updated = mergeWithDefaults(customEvent.detail);
        applySettings(updated);
      } else {
        // If no detail, apply defaults
        applySettings(DEFAULTS);
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
    };
  }, []);

  // This component renders nothing to the DOM
  return null;
}
