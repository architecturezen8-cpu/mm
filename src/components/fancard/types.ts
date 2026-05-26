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
    cheers: 'Cheers To Science !',
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
