'use client';

import { motion } from 'framer-motion';
import EditableSection from '@/components/admin/EditableSection';
import { useSectionContent, getContentString } from '@/lib/useSectionContent';
import PushNotificationManager from '@/components/PushNotificationManager';

/* ── Full Colored Thomians' Media SVG Logo — LEFT strip, white text ── */
function ThomiansMediaLogoColored({ width = 160 }: { width?: number }) {
  return (
    <svg
      width={width}
      viewBox="0 0 1200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: 'auto' }}
    >
      {/* Text: Thomians' Media — white */}
      <text x="20" y="130" fill="#FFFFFF" stroke="none" fontFamily="inherit" fontSize="100" letterSpacing="1">
        <tspan style={{ fontWeight: 900 }}>THOMIANS&apos;</tspan>
        <tspan style={{ fontWeight: 300 }}> MEDIA</tspan>
      </text>

      {/* Color strip on RIGHT — Gold, Blue, Navy — 30 degree "\" angle from bottom-left */}
      <g transform="translate(980, 55)">
        <path className="logo-bar-animate logo-bar-gold" d="M0 0 H36.7 L80 75 H43.3 Z" />
        <path className="logo-bar-animate logo-bar-blue" d="M50 0 H86.7 L130 75 H93.3 Z" />
        <path className="logo-bar-animate logo-bar-navy" d="M100 0 H136.7 L180 75 H143.3 Z" />
      </g>
    </svg>
  );
}

const DEFAULT_FOOTER_CONTENT = {
  copyright: `© ${new Date().getFullYear()} Thomians' Media. All Rights Reserved.`,
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  youtube_url: 'https://youtube.com',
};

export default function Footer() {
  const footerContent = useSectionContent('footer-content', DEFAULT_FOOTER_CONTENT);

  const copyright = getContentString(footerContent, 'copyright', DEFAULT_FOOTER_CONTENT.copyright);
  const facebookUrl = getContentString(footerContent, 'facebook_url', DEFAULT_FOOTER_CONTENT.facebook_url);
  const instagramUrl = getContentString(footerContent, 'instagram_url', DEFAULT_FOOTER_CONTENT.instagram_url);
  const youtubeUrl = getContentString(footerContent, 'youtube_url', DEFAULT_FOOTER_CONTENT.youtube_url);

  return (
    <EditableSection
      sectionId="footer-content"
      pageId="layout"
      type="footer"
      title="Footer Content"
      content={{
        copyright,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
      }}
    >
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="footer-container"
      >
        {/* ── Top — Full colored logo ── */}
        <div className="flex flex-col items-center mb-6">
          <div className="footer-logo-bordered">
            <ThomiansMediaLogoColored width={140} />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-full max-w-xs mx-auto h-px bg-gradient-to-r from-transparent via-lux-border to-transparent mb-6" />

        {/* ── Copyright ── */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <p className="footer-copyright">
            {copyright}
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="w-full max-w-xs mx-auto h-px bg-gradient-to-r from-transparent via-lux-border to-transparent mb-6" />

        {/* ── Push Notifications ── */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <PushNotificationManager />
        </div>

        {/* ── Social media ── */}
        <div className="flex flex-col items-center gap-3">
          <p className="footer-section-title">Follow Us</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Facebook */}
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span>Facebook</span>
            </a>

            {/* Instagram */}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                <rect x="2" y="2" width="20" height="20" />
                <circle cx="12" cy="12" r="5" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>

            {/* YouTube */}
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </motion.footer>
    </EditableSection>
  );
}
