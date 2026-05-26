'use client';

import { forwardRef } from 'react';
import { FanCardData, SCHOOL_INFO, BG_PATHS } from './types';

interface FanCardLandscapeProps {
  data: FanCardData;
  qrDataUrl: string;
  bgDataUrl?: string;
  logoDataUrl?: string;
}

const FanCardLandscape = forwardRef<HTMLDivElement, FanCardLandscapeProps>(
  function FanCardLandscape({ data, qrDataUrl, bgDataUrl, logoDataUrl }, ref) {
    const school = SCHOOL_INFO[data.school];
    const bgPath = BG_PATHS[data.bgColor];
    const displayName = data.name.trim() || 'YOUR NAME';
    const hashtag = `#${displayName.toUpperCase().replace(/\s+/g, '')}`;

    // Use data URL for background if available (for html2canvas download)
    const bgSrc = bgDataUrl || bgPath;
    const logoSrc = logoDataUrl || school.logo;

    return (
      <div
        ref={ref}
        className="fan-card-render"
        style={{
          width: 720,
          height: 440,
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
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

        {/* Dark Vignette Overlay — left-to-right */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.95) 100%)',
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
            padding: 30,
            display: 'flex',
            gap: 30,
            alignItems: 'center',
          }}
        >
          {/* Left Column - Profile Image */}
          <div>
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.7)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                position: 'relative',
              }}
            >
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt="Fan Portrait"
                  style={{
                    position: 'absolute',
                    left: 140 + data.photoOffsetX,
                    top: 140 + data.photoOffsetY,
                    width: 280,
                    height: 280,
                    objectFit: 'cover',
                    transform: `translate(-50%, -50%) scale(${data.photoZoom})`,
                    transformOrigin: 'center center',
                    maxWidth: 'none',
                    maxHeight: 'none',
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
          </div>

          {/* Right Column */}
          <div
            style={{
              flex: 1,
              height: 280,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Bar: Logo + Official Fan Card */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: 5,
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 42,
                  height: 42,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <img
                  data-fancard-logo="true"
                  src={logoSrc}
                  alt={school.shortName}
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase' as const,
                  opacity: 0.9,
                  paddingBottom: 3,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                  marginRight: 'auto',
                  marginLeft: 20,
                }}
              >
                Official Fan Card
              </div>
            </div>

            {/* Main Title */}
            <div
              style={{
                textAlign: 'left',
                textTransform: 'uppercase' as const,
                marginTop: 10,
                marginBottom: 6,
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              }}
            >
              <div
                style={{
                  color: '#ffffff',
                  fontSize: 22,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: 1.2,
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.65)',
                }}
              >
                Battle Of The
              </div>
              <div
                style={{
                  color: '#FFC300',
                  fontSize: 35,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: 3,
                  textShadow: '0 4px 14px rgba(0, 0, 0, 0.75), 0 0 18px rgba(255, 195, 0, 0.2)',
                }}
              >
                Golds
              </div>
              <div
                style={{
                  width: 118,
                  height: 2,
                  marginTop: 8,
                  background: 'linear-gradient(90deg, rgba(255,195,0,0.95), rgba(255,195,0,0.08), transparent)',
                }}
              />
            </div>

            {/* Details: Hashtag, Cheers, School Info */}
            <div style={{ textAlign: 'left', marginTop: 4 }}>
              <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 650, marginBottom: 6, letterSpacing: 0.5 }}>
                {hashtag}
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: 15.5,
                  fontWeight: 750,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  lineHeight: 1.35,
                  marginBottom: 9,
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {school.cheers}
              </div>
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.9,
                  lineHeight: 1.6,
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
            </div>

            {/* Footer: Branding + QR */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }}>
                {/* Thomians' Media Branding */}
                <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none', marginTop: 20 }}>
                  <img
                    src="/fancard/thomians-media-wordmark.png"
                    alt="Thomians' Media"
                    width={132}
                    height={11}
                    style={{ display: 'block', width: 132, height: 'auto', objectFit: 'contain' }}
                  />
                </div>

                {/* QR Code */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 4,
                    borderRadius: 6,
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
                      width={48}
                      height={48}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, backgroundColor: '#eee' }} />
                  )}
                </div>
              </div>

              {/* Web Link */}
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: 8,
                }}
              >
                <span
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: 10.5,
                    fontWeight: 400,
                    letterSpacing: 1,
                  }}
                >
                  www.thomiansmedia.us
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default FanCardLandscape;
