/**
 * Database initialization utility
 *
 * On Cloudflare Workers (Edge runtime), this is a no-op since Prisma/libsql
 * require filesystem access which is not available on edge.
 *
 * For local development, it seeds the SQLite database with default data.
 */

let initialized = false;

export async function ensureDatabaseReady() {
  if (initialized) return;

  // Skip on Edge runtime — Prisma/libsql cannot work on Cloudflare Workers
  // (no filesystem, no native Node.js modules)
  if (process.env.NEXT_RUNTIME === 'edge' || process.env.EDGE_RUNTIME === '1') {
    console.log('[db-init] Edge runtime detected, skipping database initialization');
    initialized = true;
    return;
  }

  try {
    // Dynamic imports for Node.js-only modules
    // Using separate dynamic import to allow tree-shaking on edge builds
    const { existsSync, mkdirSync } = await import('fs');
    const { join, dirname } = await import('path');

    // 1. Ensure the database directory exists
    const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';
    const pathMatch = dbUrl.match(/^file:(.+)$/);
    if (pathMatch) {
      let dbPath = pathMatch[1];
      if (dbPath.startsWith('./')) {
        dbPath = join(process.cwd(), 'prisma', dbPath);
      }
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log('[db-init] Created database directory:', dir);
      }
    }

    // 2. Ensure the data directory exists (for file-based fallback)
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log('[db-init] Created data directory:', dataDir);
    }

    // 3. Try to connect to the database and seed if empty
    try {
      const { db } = await import('@/lib/db');

      const DEFAULT_PAGES = [
        { id: 'home', title: 'Home', slug: '/', status: 'published' },
        { id: 'live', title: 'Live Score', slug: '/live', status: 'published' },
        { id: 'playing-xi', title: 'Playing XI', slug: '/playing-xi', status: 'published' },
        { id: 'videos', title: 'Videos', slug: '/videos', status: 'published' },
        { id: 'gallery', title: 'Gallery', slug: '/gallery', status: 'published' },
        { id: 'about', title: 'History & About', slug: '/about', status: 'published' },
        { id: 'community', title: 'Community', slug: '/community', status: 'published' },
      ];

      const DEFAULT_NAV = [
        { id: 'nav-home', label: 'Home', href: '/', position: 0, isVisible: true, isExternal: false },
        { id: 'nav-live', label: 'Live', href: '/live', position: 1, isVisible: true, isExternal: false },
        { id: 'nav-playing-xi', label: 'Playing XI', href: '/playing-xi', position: 2, isVisible: true, isExternal: false },
        { id: 'nav-videos', label: 'Videos', href: '/videos', position: 3, isVisible: true, isExternal: false },
        { id: 'nav-gallery', label: 'Gallery', href: '/gallery', position: 4, isVisible: true, isExternal: false },
        { id: 'nav-history', label: 'History', href: '/about', position: 5, isVisible: true, isExternal: false },
        { id: 'nav-community', label: 'Community', href: '/community', position: 6, isVisible: true, isExternal: false },
      ];

      // Check if pages exist
      const pageCount = await db.page.count();
      if (pageCount === 0) {
        console.log('[db-init] No pages found, seeding defaults...');
        for (const page of DEFAULT_PAGES) {
          try {
            await db.page.create({
              data: {
                id: page.id,
                title: page.title,
                slug: page.slug,
                status: page.status,
                content: JSON.stringify({ meta_title: `${page.title} — Battle of the Golds`, meta_description: '' }),
                tabs: JSON.stringify([]),
              },
            });
          } catch (err) {
            console.error(`[db-init] Failed to create page ${page.id}:`, err);
          }
        }
      }

      // Check if nav items exist
      const navCount = await db.navItem.count();
      if (navCount === 0) {
        console.log('[db-init] No nav items found, seeding defaults...');
        for (const item of DEFAULT_NAV) {
          try {
            await db.navItem.create({
              data: {
                id: item.id,
                label: item.label,
                href: item.href,
                position: item.position,
                isVisible: item.isVisible,
                isExternal: item.isExternal,
              },
            });
          } catch (err) {
            console.error(`[db-init] Failed to create nav item ${item.id}:`, err);
          }
        }
      }

      console.log('[db-init] Database is ready ✓');
    } catch (dbErr) {
      console.error('[db-init] Database unavailable, will use file fallback:', dbErr);
    }

    initialized = true;
  } catch (err) {
    console.error('[db-init] Initialization error:', err);
    // Don't throw — the app should still work with file fallbacks
    initialized = true;
  }
}
