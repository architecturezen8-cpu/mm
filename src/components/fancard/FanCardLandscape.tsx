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
                    inset: 0,
                    width: `${data.photoZoom * 100}%`,
                    height: `${data.photoZoom * 100}%`,
                    objectFit: 'cover',
                    left: `${50 - data.photoZoom * 50 + data.photoOffsetX * (data.photoZoom - 1)}%`,
                    top: `${50 - data.photoZoom * 50 + data.photoOffsetY * (data.photoZoom - 1)}%`,
                    transform: 'translate(-50%, -50%)',
                    transformOrigin: 'center center',
                    maxWidth: 'none',
                    minWidth: '100%',
                    minHeight: '100%',
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
                color: '#ffffff',
                fontSize: 26,
                fontWeight: 800,
                textAlign: 'left',
                textTransform: 'uppercase' as const,
                lineHeight: 1.2,
                letterSpacing: 1,
                marginTop: 10,
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
              }}
            >
              Battle Of The Golds
            </div>

            {/* Details: Hashtag, Cheers, School Info */}
            <div style={{ textAlign: 'left', marginTop: 5 }}>
              <div style={{ color: '#ffffff', fontSize: 19, fontWeight: 600, marginBottom: 2, letterSpacing: 0.5 }}>
                {hashtag}
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: 17,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  marginBottom: 6,
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {school.cheers}
              </div>
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 1,
                  lineHeight: 1.4,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', marginTop: 20 }}>
                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: 11,
                      letterSpacing: 0.2,
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>THOMIANS&apos;</span>
                    <em style={{ fontStyle: 'normal', fontWeight: 300, marginLeft: 4, opacity: 0.9 }}>MEDIA</em>
                  </div>
                  {/* 3 Slanting Stripes */}
                  <div style={{ display: 'flex', width: 17, height: 10, transform: 'skewX(25deg)', overflow: 'hidden' }}>
                    <div style={{ width: '33.33%', backgroundColor: '#1a3668' }} />
                    <div style={{ width: '33.33%', backgroundColor: '#4a7ebb' }} />
                    <div style={{ width: '33.33%', backgroundColor: '#f7b717' }} />
                  </div>
                </div>

                {/* QR Code */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 4,
                    borderRadius: 6,
                    width: 46,
                    height: 46,
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
                      width={38}
                      height={38}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 38, height: 38, backgroundColor: '#eee' }} />
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
