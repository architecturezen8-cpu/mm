export type School = 'stc' | 'gsc';
export type BgColor = 'golden' | 'blue' | 'red';
export type CardOrientation = 'portrait' | 'landscape';
export type PhotoFilterPreset = 'original' | 'golden' | 'cinematic' | 'cool' | 'mono' | 'custom';

export interface FanCardData {
  name: string;
  school: School;
  bgColor: BgColor;
  batch: string;
  orientation: CardOrientation;
  photoUrl: string | null;
  photoZoom: number;    // 1 = fit, 2 = 2x zoom
  photoOffsetX: number; // -50 to 50 (percentage shift)
  photoOffsetY: number; // -50 to 50 (percentage shift)
  photoFilterPreset: PhotoFilterPreset;
  photoBrightness: number; // 50 to 150
  photoContrast: number;   // 50 to 150
  photoSaturation: number; // 0 to 200
  photoHue: number;        // -180 to 180
  photoSepia: number;      // 0 to 100
}

export const SCHOOL_INFO: Record<School, { name: string; shortName: string; logo: string; cheers: string }> = {
  stc: {
    name: "St. Thomas' College Matale",
    shortName: 'STC',
    logo: '/fancard/logos/stc.png',
    cheers: 'Cheers To Thomians !',
  },
  gsc: {
    name: 'Govt. Science College Matale',
    shortName: 'GSC',
    logo: '/fancard/logos/gsc.png',
    cheers: 'Cheers To Sciencians !',
  },
};

export const BG_PATHS: Record<BgColor, string> = {
  golden: '/fancard/bg/golden.jpg',
  blue: '/fancard/bg/blue.jpg',
  red: '/fancard/bg/red.jpg',
};

export const DEFAULT_FAN_CARD: FanCardData = {
  name: '',
  school: 'stc',
  bgColor: 'golden',
  batch: '',
  orientation: 'portrait',
  photoUrl: null,
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoFilterPreset: 'original',
  photoBrightness: 100,
  photoContrast: 100,
  photoSaturation: 100,
  photoHue: 0,
  photoSepia: 0,
};


export interface FanCardTextContent {
  event_overline: string;
  title_line1: string;
  title_line2: string;
  stc_cheers: string;
  gsc_cheers: string;
  website: string;
  branding_image: string;
}

export const DEFAULT_FAN_CARD_TEXT: FanCardTextContent = {
  event_overline: 'THE LEGENDARY',
  title_line1: 'Battle Of The',
  title_line2: 'Golds',
  stc_cheers: 'Cheers To Thomians !',
  gsc_cheers: 'Cheers To Sciencians !',
  website: 'www.thomiansmedia.us',
  branding_image: '/fancard/thomians-media-wordmark.png',
};


export const PHOTO_FILTER_PRESETS: Record<PhotoFilterPreset, { label: string; filter: string }> = {
  original: { label: 'Original', filter: 'none' },
  golden: { label: 'Golden', filter: 'brightness(1.05) contrast(1.08) saturate(1.22) sepia(0.22) hue-rotate(-8deg)' },
  cinematic: { label: 'Cinematic', filter: 'brightness(0.96) contrast(1.18) saturate(0.9) sepia(0.08)' },
  cool: { label: 'Cool Blue', filter: 'brightness(1.02) contrast(1.06) saturate(1.12) hue-rotate(12deg)' },
  mono: { label: 'Mono Lux', filter: 'grayscale(1) contrast(1.12) brightness(1.03)' },
  custom: { label: 'Custom', filter: '' },
};

export function getPhotoFilter(data: Pick<FanCardData, 'photoFilterPreset' | 'photoBrightness' | 'photoContrast' | 'photoSaturation' | 'photoHue' | 'photoSepia'>): string {
  if (data.photoFilterPreset !== 'custom') {
    return PHOTO_FILTER_PRESETS[data.photoFilterPreset]?.filter || 'none';
  }

  return [
    `brightness(${data.photoBrightness}%)`,
    `contrast(${data.photoContrast}%)`,
    `saturate(${data.photoSaturation}%)`,
    `hue-rotate(${data.photoHue}deg)`,
    `sepia(${data.photoSepia}%)`,
  ].join(' ');
}
