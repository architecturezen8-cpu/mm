'use client';

import { forwardRef } from 'react';
import { FanCardData, SCHOOL_INFO, BG_PATHS, DEFAULT_FAN_CARD_TEXT, FanCardTextContent, getPhotoFilter, CARD_TEMPLATES, STICKER_BADGES } from './types';

interface FanCardPortraitProps {
  data: FanCardData;
  qrDataUrl: string;
  bgDataUrl?: string;
  logoDataUrl?: string;
  textContent?: Partial<FanCardTextContent>;
}

const FanCardPortrait = forwardRef<HTMLDivElement, FanCardPortraitProps>(
  function FanCardPortrait({ data, qrDataUrl, bgDataUrl, logoDataUrl, textContent }, ref) {
    const school = SCHOOL_INFO[data.school];
    const bgPath = BG_PATHS[data.bgColor];
    const displayName = data.name.trim() || 'YOUR NAME';
    const hashtag = `#${displayName.toUpperCase().replace(/\s+/g, '')}`;
    const text = { ...DEFAULT_FAN_CARD_TEXT, ...textContent };
    const cheersText = data.school === 'gsc' ? text.gsc_cheers : text.stc_cheers;
    const template = CARD_TEMPLATES[data.template] || CARD_TEMPLATES['gold-classic'];
    const stickerText = STICKER_BADGES[data.sticker]?.text || '';
    const titleTweaks = {
      classic: { line1: 1, line2: 1, spacing: 1 },
      luxury: { line1: 0.95, line2: 1.08, spacing: 1.12 },
      sport: { line1: 1.05, line2: 1.08, spacing: 0.82 },
      minimal: { line1: 0.9, line2: 0.92, spacing: 1.25 },
    }[data.textStyle] || { line1: 1, line2: 1, spacing: 1 };

    // Use data URL for background if available (for html2canvas download)
    const bgSrc = bgDataUrl || bgPath;
    const logoSrc = logoDataUrl || school.logo;

    return (
      <div
        ref={ref}
        className="fan-card-render"
        style={{
          width: 440,
          height: 690,
          position: 'relative',
          border: template.border,
          borderRadius: 24,
          boxShadow: template.shadow,
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Background Image — using <img> for html2canvas compatibility */}
        <img
          data-fancard-bg="true"
          src={bgSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
          }}
        />

        {stickerText && (
          <div
            style={{
              position: 'absolute',
              right: 24,
              top: 26,
              zIndex: 3,
              padding: '5px 9px',
              border: '1px solid rgba(255,195,0,0.42)',
              background: 'rgba(0,0,0,0.28)',
              color: '#FFC300',
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: 'uppercase' as const,
            }}
          >
            {stickerText}
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0.95) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: '30px 25px 20px 25px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {/* School Logo */}
            <div
              style={{
                position: 'absolute',
                left: 25,
                top: 25,
                backgroundColor: '#ffffff',
                padding: 6,
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 46,
                height: 46,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <img
                data-fancard-logo="true"
                src={logoSrc}
                alt={school.shortName}
                width={34}
                height={34}
                style={{ objectFit: 'contain' }}
              />
            </div>
            {/* Official Fan Card text */}
            <div
              style={{
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase' as const,
                opacity: 0.9,
                paddingTop: 8,
                paddingBottom: 4,
                borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'inline-block',
              }}
            >
              Official Fan Card
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              textAlign: 'center',
              textTransform: 'uppercase' as const,
              marginBottom: 14,
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
          >
            <div
              style={{
                color: '#f7b717',
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: 3.6 * titleTweaks.spacing,
                marginBottom: 6,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.55)',
              }}
            >
              {text.event_overline}
            </div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 27 * titleTweaks.line1,
                fontWeight: 900,
                lineHeight: 0.96,
                letterSpacing: 1.5 * titleTweaks.spacing,
                textShadow: '0 5px 14px rgba(0, 0, 0, 0.7)',
              }}
            >
              {text.title_line1}
            </div>
            <div
              style={{
                color: '#FFC300',
                fontSize: 36 * titleTweaks.line2,
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: 3.6,
                paddingBottom: 4,
                textShadow: '0 5px 16px rgba(0, 0, 0, 0.75), 0 0 20px rgba(255, 195, 0, 0.22)',
              }}
            >
              {text.title_line2}
            </div>
            <div
              style={{
                width: 118,
                height: 2,
                margin: '12px auto 0',
                background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.95), transparent)',
              }}
            />
          </div>

          {/* Profile Image Container */}
          <div
            style={{
              width: 275,
              height: 275,
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.7)',
              marginBottom: 18,
              position: 'relative',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Fan Portrait"
                style={{
                  position: 'absolute',
                  left: 137.5 + data.photoOffsetX,
                  top: 137.5 + data.photoOffsetY,
                  width: 275,
                  height: 275,
                  objectFit: 'cover',
                  transform: `translate(-50%, -50%) scale(${data.photoZoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  filter: getPhotoFilter(data),
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 14,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 2,
                }}
              >
                Your Photo
              </div>
            )}
          </div>

          {/* Details Section */}
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              marginBottom: 16,
            }}
          >
            {/* Hashtag */}
            <div
              style={{
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              {hashtag}
            </div>
            {/* Cheers Text — normal-flow line/text/line avoids download renderer alignment drift */}
            <div
              style={{
                width: 340,
                margin: '0 auto 12px',
                boxSizing: 'border-box',
                textAlign: 'center',
                whiteSpace: 'nowrap' as const,
                background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.12), transparent)',
              }}
            >
              <div style={{ height: 1, background: 'rgba(255,195,0,0.45)' }} />
              <div
                style={{
                  height: 36,
                  lineHeight: '36px',
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 800,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.8,
                  textShadow: '0 2px 8px rgba(0,0,0,0.55), 0 0 12px rgba(255,195,0,0.22)',
                }}
              >
                {cheersText}
              </div>
              <div style={{ height: 1, background: 'rgba(255,195,0,0.45)' }} />
            </div>
            {/* School Info + Batch */}
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase' as const,
                letterSpacing: 1,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ fontWeight: 700, color: '#ffffff' }}>{school.name}</strong>
              {data.batch && (
                <>
                  <br />
                  {data.batch}
                </>
              )}
            </div>
            {data.fanMessage && (
              <div
                style={{
                  marginTop: 6,
                  color: 'rgba(255,195,0,0.78)',
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase' as const,
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {data.fanMessage.slice(0, 34)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              width: '100%',
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 15,
              }}
            >
              {/* Thomians' Media Branding */}
              <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none', marginTop: 20 }}>
                <img
                  src={text.branding_image}
                  alt="Thomians' Media"
                  width={135}
                  height={11}
                  style={{ display: 'block', width: 135, height: 'auto', objectFit: 'contain' }}
                />
              </div>

              {/* QR Code */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: 5,
                  borderRadius: 8,
                  width: 56,
                  height: 56,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    width={46}
                    height={46}
                    style={{ display: 'block' }}
                  />
                ) : (
                  <div style={{ width: 46, height: 46, backgroundColor: '#eee' }} />
                )}
              </div>
            </div>

            {/* Web Link */}
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: 10,
              }}
            >
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: 1,
                }}
              >
                {text.website}{data.cardId ? ` · ${data.cardId}` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default FanCardPortrait;
