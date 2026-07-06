import type { FieldStyle } from './types';

export interface FieldColorPreset {
  id: string;
  name: string;
  sourcePalette: string;
  sourceUrl: string;
  code: string;
  likes: number;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  patternColor: string;
  swatches: string[];
}

export const COLOR_HUNT_SOURCE_URL = 'https://colorhunt.co/';
export const COLOR_HUNT_SOURCE_AVERAGE_LIKES = 15212.722916666668;

export const COLOR_HUNT_FIELD_PRESETS: FieldColorPreset[] = [
  {
    id: 'color-hunt-222831393e4600adb5eeeeee',
    name: '极简青灰',
    sourcePalette: 'Color Hunt #222831393e4600adb5eeeeee',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/222831393e4600adb5eeeeee`,
    code: '222831393e4600adb5eeeeee',
    likes: 73071,
    backgroundColor: '#eeeeee',
    textColor: '#222831',
    borderColor: '#00adb5',
    patternColor: '#393e46',
    swatches: ['#222831', '#393e46', '#00adb5', '#eeeeee'],
  },
  {
    id: 'color-hunt-08d9d6252a34ff2e63eaeaea',
    name: '霓虹青粉',
    sourcePalette: 'Color Hunt #08d9d6252a34ff2e63eaeaea',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/08d9d6252a34ff2e63eaeaea`,
    code: '08d9d6252a34ff2e63eaeaea',
    likes: 35057,
    backgroundColor: '#08d9d6',
    textColor: '#252a34',
    borderColor: '#ff2e63',
    patternColor: '#eaeaea',
    swatches: ['#08d9d6', '#252a34', '#ff2e63', '#eaeaea'],
  },
  {
    id: 'color-hunt-f5f7f8f4ce14495e5745474b',
    name: '柠檬苔藓',
    sourcePalette: 'Color Hunt #f5f7f8f4ce14495e5745474b',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/f5f7f8f4ce14495e5745474b`,
    code: 'f5f7f8f4ce14495e5745474b',
    likes: 23583,
    backgroundColor: '#f4ce14',
    textColor: '#45474b',
    borderColor: '#495e57',
    patternColor: '#f5f7f8',
    swatches: ['#f5f7f8', '#f4ce14', '#495e57', '#45474b'],
  },
  {
    id: 'color-hunt-b1b2ffaac4ffd2daffeef1ff',
    name: '薄蓝索引',
    sourcePalette: 'Color Hunt #b1b2ffaac4ffd2daffeef1ff',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/b1b2ffaac4ffd2daffeef1ff`,
    code: 'b1b2ffaac4ffd2daffeef1ff',
    likes: 32697,
    backgroundColor: '#aac4ff',
    textColor: '#111111',
    borderColor: '#b1b2ff',
    patternColor: '#eef1ff',
    swatches: ['#b1b2ff', '#aac4ff', '#d2daff', '#eef1ff'],
  },
  {
    id: 'color-hunt-ffb6b9fae3d9bbded661c0bf',
    name: '粉桃海松',
    sourcePalette: 'Color Hunt #ffb6b9fae3d9bbded661c0bf',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/ffb6b9fae3d9bbded661c0bf`,
    code: 'ffb6b9fae3d9bbded661c0bf',
    likes: 30197,
    backgroundColor: '#ffb6b9',
    textColor: '#111111',
    borderColor: '#61c0bf',
    patternColor: '#bbded6',
    swatches: ['#ffb6b9', '#fae3d9', '#bbded6', '#61c0bf'],
  },
  {
    id: 'color-hunt-2121213232320d737714ffec',
    name: '电光湖蓝',
    sourcePalette: 'Color Hunt #2121213232320d737714ffec',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/2121213232320d737714ffec`,
    code: '2121213232320d737714ffec',
    likes: 24432,
    backgroundColor: '#14ffec',
    textColor: '#212121',
    borderColor: '#0d7377',
    patternColor: '#323232',
    swatches: ['#212121', '#323232', '#0d7377', '#14ffec'],
  },
  {
    id: 'color-hunt-e3fdfdcbf1f5a6e3e971c9ce',
    name: '冰湖青',
    sourcePalette: 'Color Hunt #e3fdfdcbf1f5a6e3e971c9ce',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/e3fdfdcbf1f5a6e3e971c9ce`,
    code: 'e3fdfdcbf1f5a6e3e971c9ce',
    likes: 46486,
    backgroundColor: '#a6e3e9',
    textColor: '#111111',
    borderColor: '#71c9ce',
    patternColor: '#e3fdfd',
    swatches: ['#e3fdfd', '#cbf1f5', '#a6e3e9', '#71c9ce'],
  },
  {
    id: 'color-hunt-f38181fce38aeaffd095e1d3',
    name: '夏日珊瑚',
    sourcePalette: 'Color Hunt #f38181fce38aeaffd095e1d3',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/f38181fce38aeaffd095e1d3`,
    code: 'f38181fce38aeaffd095e1d3',
    likes: 33202,
    backgroundColor: '#fce38a',
    textColor: '#111111',
    borderColor: '#f38181',
    patternColor: '#95e1d3',
    swatches: ['#f38181', '#fce38a', '#eaffd0', '#95e1d3'],
  },
  {
    id: 'color-hunt-faf8f1faeab1e5ba73c58940',
    name: '焦糖纸页',
    sourcePalette: 'Color Hunt #faf8f1faeab1e5ba73c58940',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/faf8f1faeab1e5ba73c58940`,
    code: 'faf8f1faeab1e5ba73c58940',
    likes: 17491,
    backgroundColor: '#e5ba73',
    textColor: '#111111',
    borderColor: '#c58940',
    patternColor: '#faf8f1',
    swatches: ['#faf8f1', '#faeab1', '#e5ba73', '#c58940'],
  },
  {
    id: 'color-hunt-f4eeffdcd6f7a6b1e1424874',
    name: '淡紫学院',
    sourcePalette: 'Color Hunt #f4eeffdcd6f7a6b1e1424874',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/f4eeffdcd6f7a6b1e1424874`,
    code: 'f4eeffdcd6f7a6b1e1424874',
    likes: 37580,
    backgroundColor: '#dcd6f7',
    textColor: '#424874',
    borderColor: '#a6b1e1',
    patternColor: '#f4eeff',
    swatches: ['#f4eeff', '#dcd6f7', '#a6b1e1', '#424874'],
  },
  {
    id: 'color-hunt-fff5e4ffe3e1ffd1d1ff9494',
    name: '樱粉便签',
    sourcePalette: 'Color Hunt #fff5e4ffe3e1ffd1d1ff9494',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/fff5e4ffe3e1ffd1d1ff9494`,
    code: 'fff5e4ffe3e1ffd1d1ff9494',
    likes: 41574,
    backgroundColor: '#ffd1d1',
    textColor: '#111111',
    borderColor: '#ff9494',
    patternColor: '#fff5e4',
    swatches: ['#fff5e4', '#ffe3e1', '#ffd1d1', '#ff9494'],
  },
  {
    id: 'color-hunt-feffdeddffbc91c78852734d',
    name: '青柠书签',
    sourcePalette: 'Color Hunt #feffdeddffbc91c78852734d',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/feffdeddffbc91c78852734d`,
    code: 'feffdeddffbc91c78852734d',
    likes: 19199,
    backgroundColor: '#ddffbc',
    textColor: '#52734d',
    borderColor: '#91c788',
    patternColor: '#feffde',
    swatches: ['#feffde', '#ddffbc', '#91c788', '#52734d'],
  },
  {
    id: 'color-hunt-ad8b73ceab93e3caa5fffbe9',
    name: '陶土羊皮',
    sourcePalette: 'Color Hunt #ad8b73ceab93e3caa5fffbe9',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/ad8b73ceab93e3caa5fffbe9`,
    code: 'ad8b73ceab93e3caa5fffbe9',
    likes: 38309,
    backgroundColor: '#e3caa5',
    textColor: '#111111',
    borderColor: '#ad8b73',
    patternColor: '#fffbe9',
    swatches: ['#ad8b73', '#ceab93', '#e3caa5', '#fffbe9'],
  },
  {
    id: 'color-hunt-1fab8962d2a29df3c4d7fbe8',
    name: '薄荷森林',
    sourcePalette: 'Color Hunt #1fab8962d2a29df3c4d7fbe8',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/1fab8962d2a29df3c4d7fbe8`,
    code: '1fab8962d2a29df3c4d7fbe8',
    likes: 15810,
    backgroundColor: '#9df3c4',
    textColor: '#111111',
    borderColor: '#1fab89',
    patternColor: '#62d2a2',
    swatches: ['#1fab89', '#62d2a2', '#9df3c4', '#d7fbe8'],
  },
  {
    id: 'color-hunt-f9ed69f08a5db83b5e6a2c70',
    name: '日光莓紫',
    sourcePalette: 'Color Hunt #f9ed69f08a5db83b5e6a2c70',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/f9ed69f08a5db83b5e6a2c70`,
    code: 'f9ed69f08a5db83b5e6a2c70',
    likes: 33300,
    backgroundColor: '#f9ed69',
    textColor: '#6a2c70',
    borderColor: '#b83b5e',
    patternColor: '#f08a5d',
    swatches: ['#f9ed69', '#f08a5d', '#b83b5e', '#6a2c70'],
  },
  {
    id: 'color-hunt-ffd4d4ffffe8cde990aacb73',
    name: '青柠粉笺',
    sourcePalette: 'Color Hunt #ffd4d4ffffe8cde990aacb73',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/ffd4d4ffffe8cde990aacb73`,
    code: 'ffd4d4ffffe8cde990aacb73',
    likes: 20260,
    backgroundColor: '#cde990',
    textColor: '#111111',
    borderColor: '#aacb73',
    patternColor: '#ffd4d4',
    swatches: ['#ffd4d4', '#ffffe8', '#cde990', '#aacb73'],
  },
  {
    id: 'color-hunt-6096b493bfcfbdcdd6eee9da',
    name: '雾蓝档案',
    sourcePalette: 'Color Hunt #6096b493bfcfbdcdd6eee9da',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/6096b493bfcfbdcdd6eee9da`,
    code: '6096b493bfcfbdcdd6eee9da',
    likes: 31552,
    backgroundColor: '#bdcdd6',
    textColor: '#111111',
    borderColor: '#6096b4',
    patternColor: '#eee9da',
    swatches: ['#6096b4', '#93bfcf', '#bdcdd6', '#eee9da'],
  },
  {
    id: 'color-hunt-61826479ac78b0d9b1d0e7d2',
    name: '苔绿札记',
    sourcePalette: 'Color Hunt #61826479ac78b0d9b1d0e7d2',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/61826479ac78b0d9b1d0e7d2`,
    code: '61826479ac78b0d9b1d0e7d2',
    likes: 16678,
    backgroundColor: '#b0d9b1',
    textColor: '#111111',
    borderColor: '#618264',
    patternColor: '#79ac78',
    swatches: ['#618264', '#79ac78', '#b0d9b1', '#d0e7d2'],
  },
  {
    id: 'color-hunt-e4f9f530e3ca11999e40514e',
    name: '高亮绿松',
    sourcePalette: 'Color Hunt #e4f9f530e3ca11999e40514e',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/e4f9f530e3ca11999e40514e`,
    code: 'e4f9f530e3ca11999e40514e',
    likes: 22597,
    backgroundColor: '#30e3ca',
    textColor: '#40514e',
    borderColor: '#11999e',
    patternColor: '#e4f9f5',
    swatches: ['#e4f9f5', '#30e3ca', '#11999e', '#40514e'],
  },
  {
    id: 'color-hunt-2d4059ea5455f07b3fffd460',
    name: '芒果海军',
    sourcePalette: 'Color Hunt #2d4059ea5455f07b3fffd460',
    sourceUrl: `${COLOR_HUNT_SOURCE_URL}palette/2d4059ea5455f07b3fffd460`,
    code: '2d4059ea5455f07b3fffd460',
    likes: 18967,
    backgroundColor: '#ffd460',
    textColor: '#2d4059',
    borderColor: '#f07b3f',
    patternColor: '#ea5455',
    swatches: ['#2d4059', '#ea5455', '#f07b3f', '#ffd460'],
  },
];

function hexToRgb(hexColor: string): [number, number, number] {
  const hex = hexColor.replace('#', '');

  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

export function relativeLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

function linearSrgbToOklab([red, green, blue]: [number, number, number]): [number, number, number] {
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ];
}

export function oklabDistance(a: string, b: string): number {
  const toLinear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const labA = linearSrgbToOklab(hexToRgb(a).map(toLinear) as [number, number, number]);
  const labB = linearSrgbToOklab(hexToRgb(b).map(toLinear) as [number, number, number]);

  return Math.hypot(labA[0] - labB[0], labA[1] - labB[1], labA[2] - labB[2]);
}

export function getRandomColorHuntPreset(random = Math.random): FieldColorPreset {
  const index = Math.min(
    COLOR_HUNT_FIELD_PRESETS.length - 1,
    Math.floor(random() * COLOR_HUNT_FIELD_PRESETS.length)
  );

  return COLOR_HUNT_FIELD_PRESETS[index]!;
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

export function findMatchingColorHuntPreset(field: FieldStyle): FieldColorPreset | undefined {
  return COLOR_HUNT_FIELD_PRESETS.find(preset =>
    field.backgroundColor === preset.backgroundColor &&
    field.textColor === preset.textColor &&
    field.borderColor === preset.borderColor &&
    field.patternColor === preset.patternColor
  );
}

export function createRandomColorHuntFieldStyle(
  name: string,
  random = Math.random
): FieldStyle {
  const preset = getRandomColorHuntPreset(random);

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
