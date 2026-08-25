export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  text: string;
  textMuted: string;
  textFaint: string;

  primary: string;
  primaryOn: string;
  primarySoft: string;
  primaryDeep: string;

  warning: string;
  warningSoft: string;

  blocked: string;
  blockedSoft: string;
  blockedDeep: string;

  danger: string;
  dangerSoft: string;

  disabled: string;
}

export const lightPalette: Palette = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEEE9',
  border: '#EFEEE9',

  text: '#2C2C2A',
  textMuted: '#6B6B66',
  textFaint: '#9C9A92',

  primary: '#1D9E75',
  primaryOn: '#FFFFFF',
  primarySoft: '#E1F5EE',
  primaryDeep: '#0F6E56',

  warning: '#BA7517',
  warningSoft: '#FDF3E3',

  blocked: '#D85A30',
  blockedSoft: '#FAECE7',
  blockedDeep: '#993C1D',

  danger: '#A32D2D',
  dangerSoft: '#FCEBEB',

  disabled: '#C9C7BF',
};

export const darkPalette: Palette = {
  bg: '#1A1A18',
  surface: '#252523',
  surfaceAlt: '#302F2C',
  border: '#33322E',

  text: '#E5E5E0',
  textMuted: '#A3A199',
  textFaint: '#7A786F',

  primary: '#2FBF90',
  primaryOn: '#0A0A09',
  primarySoft: '#14332B',
  primaryDeep: '#7FDCBD',

  warning: '#D99A3E',
  warningSoft: '#332A18',

  blocked: '#E87A55',
  blockedSoft: '#3A2219',
  blockedDeep: '#F0A98D',

  danger: '#E06666',
  dangerSoft: '#3A1E1E',

  disabled: '#4A4844',
};