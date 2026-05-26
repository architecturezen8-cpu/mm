export type School = 'stc' | 'gsc';
export type BgColor = 'golden' | 'blue' | 'red';
export type CardOrientation = 'portrait' | 'landscape';

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
