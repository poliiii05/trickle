export interface Palette {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textFaint: string;

  primary: string;
  primaryOn: string;
  primarySoft: string;
  primaryDeep: string;
  primaryBorder: string;

  accent: string;
  accentOn: string;
  accentSoft: string;
  accentDeep: string;
  accentBorder: string;

  warning: string;
  warningSoft: string;

  blocked: string;
  blockedOn: string;
  blockedSoft: string;
  blockedDeep: string;
  blockedBorder: string;

  danger: string;
  dangerSoft: string;

  disabled: string;
}

export const lightPalette: Palette = {
  bg: '#F7F7F4',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDECE6',
  border: '#E4E2DA',
  borderStrong: '#D2CFC4',

  text: '#22221F',
  textMuted: '#63625B',
  textFaint: '#96948A',

  primary: '#0E9E72',
  primaryOn: '#FFFFFF',
  primarySoft: '#DFF3EB',
  primaryDeep: '#0A6E50',
  primaryBorder: '#7FD3B8',

  accent: '#C97A16',
  accentOn: '#FFFFFF',
  accentSoft: '#FBEFDC',
  accentDeep: '#8A5209',
  accentBorder: '#E8B871',

  warning: '#B8760F',
  warningSoft: '#FBEFDC',

  blocked: '#D2532A',
  blockedOn: '#FFFFFF',
  blockedSoft: '#FAE8E1',
  blockedDeep: '#8F3417',
  blockedBorder: '#EDA184',

  danger: '#A32D2D',
  dangerSoft: '#FBEAEA',

  disabled: '#C7C4B9',
};

export const darkPalette: Palette = {
  bg: '#161614',
  bgElevated: '#1E1E1B',
  surface: '#232320',
  surfaceAlt: '#2E2E2A',
  border: '#33322D',
  borderStrong: '#464540',

  text: '#EAE9E3',
  textMuted: '#A5A39A',
  textFaint: '#7C7A71',

  primary: '#2FC594',
  primaryOn: '#08130F',
  primarySoft: '#12332A',
  primaryDeep: '#8AE3C4',
  primaryBorder: '#1F6E56',

  accent: '#E8A33F',
  accentOn: '#1A1104',
  accentSoft: '#33260F',
  accentDeep: '#F5CB8B',
  accentBorder: '#7A5A22',

  warning: '#DFA24A',
  warningSoft: '#33260F',

  blocked: '#EC7B52',
  blockedOn: '#1A0C06',
  blockedSoft: '#382016',
  blockedDeep: '#F7B398',
  blockedBorder: '#7D4229',

  danger: '#E36B6B',
  dangerSoft: '#3A1E1E',

  disabled: '#4B4945',
};