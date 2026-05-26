'use client';

import ClientLayout from '@/components/ClientLayout';
import { AnimatePresence, motion } from 'framer-motion';
import DynamicSections from '@/components/admin/DynamicSections';
import { useAdminEdit } from '@/lib/AdminEditContext';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  status: string;
}

function CustomPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { sectionData } = useAdminEdit();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to find this page in the database
    async function fetchPage() {
      try {
        const res = await fetch(`/api/page?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setPageInfo(data);
          }
        }
      } catch {
        // Page not found in database
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [slug]);

  // Get sections for this page
  const pageSections = Object.values(sectionData)
    .filter((s) => s.page_id === slug)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!pageInfo && pageSections.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-light text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-muted text-sm">This page does not exist yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      key={slug}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {pageInfo && (
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-light text-text-primary tracking-wide">
            {pageInfo.title}
          </h1>
        </div>
      )}
      <DynamicSections pageId={slug} />
    </motion.div>
  );
}

export default function CustomPage() {
  return (
    <ClientLayout>
      <AnimatePresence mode="wait">
        <CustomPageContent />
      </AnimatePresence>
    </ClientLayout>
  );
}
