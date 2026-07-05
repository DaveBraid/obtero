import type { FieldStyle } from './types';

export interface FieldColorPreset {
  id: string;
  name: string;
  sourcePalette: string;
  sourceUrl: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  patternColor: string;
  swatches: string[];
}

const HAPPY_HUES_URL = 'https://www.happyhues.co/';

export const HAPPY_HUES_FIELD_PRESETS: FieldColorPreset[] = [
  {
    id: 'happy-hues-17',
    name: '暖杏晨光',
    sourcePalette: 'Happy Hues 17',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fef6e4',
    textColor: '#001858',
    borderColor: '#f582ae',
    patternColor: '#8bd3dd',
    swatches: ['#fef6e4', '#8bd3dd', '#f582ae', '#f3d2c1'],
  },
  {
    id: 'happy-hues-16',
    name: '可可玫瑰',
    sourcePalette: 'Happy Hues 16',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fff3ec',
    textColor: '#271c19',
    borderColor: '#9656a1',
    patternColor: '#e78fb3',
    swatches: ['#55423d', '#e78fb3', '#ffc0ad', '#9656a1', '#fff3ec', '#271c19'],
  },
  {
    id: 'happy-hues-15',
    name: '奶油花园',
    sourcePalette: 'Happy Hues 15',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#faeee7',
    textColor: '#33272a',
    borderColor: '#ff8ba7',
    patternColor: '#c3f0ca',
    swatches: ['#faeee7', '#ff8ba7', '#ffc6c7', '#c3f0ca', '#fffffe'],
  },
  {
    id: 'happy-hues-14',
    name: '海盐柠檬',
    sourcePalette: 'Happy Hues 14',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#e3f6f5',
    textColor: '#272343',
    borderColor: '#ffd803',
    patternColor: '#bae8e8',
    swatches: ['#fffffe', '#ffd803', '#e3f6f5', '#bae8e8'],
  },
  {
    id: 'happy-hues-13',
    name: '夜幕信笺',
    sourcePalette: 'Happy Hues 13',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fffffe',
    textColor: '#0f0e17',
    borderColor: '#e53170',
    patternColor: '#ff8906',
    swatches: ['#0f0e17', '#ff8906', '#f25f4c', '#e53170', '#fffffe'],
  },
  {
    id: 'happy-hues-12',
    name: '星河淡紫',
    sourcePalette: 'Happy Hues 12',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#d4d8f0',
    textColor: '#121629',
    borderColor: '#eebbc3',
    patternColor: '#b8c1ec',
    swatches: ['#232946', '#eebbc3', '#fffffe', '#b8c1ec', '#d4d8f0'],
  },
  {
    id: 'happy-hues-11',
    name: '羊皮红印',
    sourcePalette: 'Happy Hues 11',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#f9f4ef',
    textColor: '#020826',
    borderColor: '#f25042',
    patternColor: '#eaddcf',
    swatches: ['#f9f4ef', '#8c7851', '#eaddcf', '#f25042', '#fffffe'],
  },
  {
    id: 'happy-hues-10',
    name: '松石档案',
    sourcePalette: 'Happy Hues 10',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#e8e4e6',
    textColor: '#001e1d',
    borderColor: '#e16162',
    patternColor: '#abd1c6',
    swatches: ['#004643', '#f9bc60', '#abd1c6', '#e16162', '#e8e4e6'],
  },
  {
    id: 'happy-hues-9',
    name: '雾灰珊瑚',
    sourcePalette: 'Happy Hues 9',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#eff0f3',
    textColor: '#0d0d0d',
    borderColor: '#d9376e',
    patternColor: '#ff8e3c',
    swatches: ['#eff0f3', '#ff8e3c', '#fffffe', '#d9376e'],
  },
  {
    id: 'happy-hues-8',
    name: '亚麻海松',
    sourcePalette: 'Happy Hues 8',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#f8f5f2',
    textColor: '#232323',
    borderColor: '#078080',
    patternColor: '#f45d48',
    swatches: ['#f8f5f2', '#078080', '#f45d48', '#fffffe'],
  },
  {
    id: 'happy-hues-7',
    name: '粉雾索引',
    sourcePalette: 'Happy Hues 7',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fec7d7',
    textColor: '#0e172c',
    borderColor: '#a786df',
    patternColor: '#d9d4e7',
    swatches: ['#fec7d7', '#d9d4e7', '#a786df', '#f9f8fc', '#fffffe'],
  },
  {
    id: 'happy-hues-6',
    name: '白瓷电光',
    sourcePalette: 'Happy Hues 6',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fffffe',
    textColor: '#2b2c34',
    borderColor: '#6246ea',
    patternColor: '#d1d1e9',
    swatches: ['#fffffe', '#6246ea', '#d1d1e9', '#e45858'],
  },
  {
    id: 'happy-hues-5',
    name: '薄荷琥珀',
    sourcePalette: 'Happy Hues 5',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#f2f7f5',
    textColor: '#00332c',
    borderColor: '#faae2b',
    patternColor: '#ffa8ba',
    swatches: ['#f2f7f5', '#faae2b', '#ffa8ba', '#fa5246', '#00473e'],
  },
  {
    id: 'happy-hues-4',
    name: '黑曜荧紫',
    sourcePalette: 'Happy Hues 4',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#fffffe',
    textColor: '#16161a',
    borderColor: '#7f5af0',
    patternColor: '#2cb67d',
    swatches: ['#16161a', '#7f5af0', '#72757e', '#2cb67d', '#fffffe'],
  },
  {
    id: 'happy-hues-3',
    name: '蓝印雪笺',
    sourcePalette: 'Happy Hues 3',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#d8eefe',
    textColor: '#094067',
    borderColor: '#3da9fc',
    patternColor: '#90b4ce',
    swatches: ['#fffffe', '#3da9fc', '#90b4ce', '#ef4565', '#d8eefe'],
  },
  {
    id: 'happy-hues-2',
    name: '极光便签',
    sourcePalette: 'Happy Hues 2',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#f2f4f6',
    textColor: '#00214d',
    borderColor: '#ff5470',
    patternColor: '#00ebc7',
    swatches: ['#fffffe', '#00ebc7', '#ff5470', '#fde24f', '#f2f4f6'],
  },
  {
    id: 'happy-hues-1',
    name: '白页霓虹',
    sourcePalette: 'Happy Hues 1',
    sourceUrl: HAPPY_HUES_URL,
    backgroundColor: '#f2eef5',
    textColor: '#181818',
    borderColor: '#994ff3',
    patternColor: '#4fc4cf',
    swatches: ['#fffffe', '#4fc4cf', '#994ff3', '#fbdd74', '#f2eef5', '#f6efef'],
  },
];

export function relativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const rgb = [0, 2, 4].map(offset => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

export function getRandomHappyHuesPreset(random = Math.random): FieldColorPreset {
  const index = Math.min(
    HAPPY_HUES_FIELD_PRESETS.length - 1,
    Math.floor(random() * HAPPY_HUES_FIELD_PRESETS.length)
  );

  return HAPPY_HUES_FIELD_PRESETS[index]!;
}

export function applyColorPresetToField(field: FieldStyle, preset: FieldColorPreset): FieldStyle {
  return {
    ...field,
    backgroundColor: preset.backgroundColor,
    backgroundPattern: field.backgroundPattern || 'solid',
    patternColor: preset.patternColor,
    textColor: preset.textColor,
    titleTextColor: preset.textColor,
    metaTextColor: preset.textColor,
    borderColor: preset.borderColor,
  };
}

export function findMatchingHappyHuesPreset(field: FieldStyle): FieldColorPreset | undefined {
  return HAPPY_HUES_FIELD_PRESETS.find(preset =>
    field.backgroundColor === preset.backgroundColor &&
    field.textColor === preset.textColor &&
    field.borderColor === preset.borderColor &&
    field.patternColor === preset.patternColor
  );
}

export function createRandomHappyHuesFieldStyle(
  name: string,
  random = Math.random
): FieldStyle {
  const preset = getRandomHappyHuesPreset(random);

  return applyColorPresetToField({
    name,
    aliases: [],
    backgroundColor: preset.backgroundColor,
    backgroundPattern: 'solid',
    patternColor: preset.patternColor,
    textColor: preset.textColor,
    borderColor: preset.borderColor,
    roughness: 0,
    opacity: 100,
    roundness: 2,
    titleFontSize: 14,
    titleFontFamily: 4,
    metaFontSize: 11,
    metaFontFamily: 4,
    cardWidth: 280,
    cardHeight: 180,
    titleAlignment: 'left',
    titleTextColor: preset.textColor,
    metaTextColor: preset.textColor,
  }, preset);
}
