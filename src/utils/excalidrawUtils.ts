import { App, TFile } from 'obsidian';
import * as LZString from 'lz-string';
import { MyPluginSettings } from '../settings';
import { PaperInfo } from '../types';
import { ensureExcalidrawFile } from './fileUtils';

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: string[];
  roundness: { type: number } | null;
  isDeleted: boolean;
  boundElements: { id: string; type: string }[] | null;
  link: string | null;
  locked: boolean;
  containerId?: string | null;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  verticalAlign?: string;
  baseline?: number;
  seed?: number;
}

export async function insertPaperToExcalidraw(
  app: App,
  settings: MyPluginSettings,
  paper: PaperInfo,
  file: TFile
): Promise<void> {
  const excalidrawFile = await ensureExcalidrawFile(app, settings);
  const raw = await app.vault.read(excalidrawFile);

  let data: { elements: ExcalidrawElement[]; [key: string]: unknown };
  type LZMethod = 'base64' | 'encodedURI' | 'none';
  let lzMethod: LZMethod = 'none';

  const plainJsonMatch = raw.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  const compressedMatch = raw.match(/```compressed-json\r?\n([\s\S]*?)\r?\n```/);

  if (plainJsonMatch && plainJsonMatch[1]) {
    data = JSON.parse(plainJsonMatch[1]) as typeof data;
  } else if (compressedMatch && compressedMatch[1]) {
    const payload = compressedMatch[1].replace(/\s/g, '');
    let decompressed = LZString.decompressFromBase64(payload);
    if (decompressed) {
      lzMethod = 'base64';
    } else {
      decompressed = LZString.decompressFromEncodedURIComponent(payload);
      if (decompressed) lzMethod = 'encodedURI';
    }
    if (!decompressed) {
      throw new Error('Excalidraw 压缩数据解压失败，文件可能已损坏。');
    }
    data = JSON.parse(decompressed) as typeof data;
  } else {
    throw new Error(
      '无法在 Excalidraw 文件中找到 JSON 数据块，文件格式可能已损坏。\n' +
      '请在插件设置中重新指定 Excalidraw 文件路径。'
    );
  }

  if (!Array.isArray(data.elements)) data.elements = [];

  // Count existing cards
  const existingGroups = new Set(
    data.elements
      .filter(e => !e.isDeleted && e.groupIds.length > 0)
      .flatMap(e => e.groupIds)
  );
  const cardCount = existingGroups.size;

  // 获取领域样式
  const fieldName = paper.field || settings.defaultField;
  const fieldStyle = settings.fields.find(f => f.name === fieldName) || settings.fields[0];

  if (!fieldStyle) {
    throw new Error('未找到领域样式配置');
  }

  // Card dimensions
  const cardW = 280;
  const cardH = 180;
  const padding = 12;

  const cols = 3;
  const col = cardCount % cols;
  const row = Math.floor(cardCount / cols);

  const cardSpacingX = cardW + 30;
  const cardSpacingY = cardH + 30;
  const x = col * cardSpacingX + 20;
  const y = row * cardSpacingY + 20;

  const groupId = genId();
  const cardId = genId();
  const titleTextId = genId();
  const metaTextId = genId();

  // 构建元文本
  const metaLines: string[] = [];
  const journalDate = [paper.journal, paper.date].filter(Boolean).join(' · ');
  if (journalDate) metaLines.push(truncate(journalDate, 50));
  if (paper.institutions.length > 0) {
    metaLines.push(truncate(paper.institutions.slice(0, 2).join('; '), 60));
  } else if (paper.authors.length > 0) {
    metaLines.push(truncate(paper.authors.slice(0, 3).join(', '), 60));
  }
  const metaText = metaLines.join('\n');

  // 映射纹理类型到 Excalidraw 的 fillStyle
  // Excalidraw 支持的 fillStyle: solid, hachure, cross-hatch
  const patternMap: Record<string, string> = {
    'solid': 'solid',
    'dots': 'hachure',      // 点阵映射为 hachure
    'grid': 'hachure',      // 网格映射为 hachure
    'lines': 'cross-hatch', // 线条映射为 cross-hatch
    'cross-hatch': 'cross-hatch',
  };
  const fillStyle = patternMap[fieldStyle.backgroundPattern || 'solid'] || 'solid';

  // 单个卡片矩形
  data.elements.push({
    id: cardId,
    type: 'rectangle',
    x,
    y,
    width: cardW,
    height: cardH,
    angle: 0,
    strokeColor: fieldStyle.borderColor,
    backgroundColor: fieldStyle.backgroundColor,
    fillStyle: fillStyle,
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: fieldStyle.roughness,
    opacity: fieldStyle.opacity,
    groupIds: [groupId],
    roundness: fieldStyle.roundness > 0 ? { type: fieldStyle.roundness } : null,
    isDeleted: false,
    boundElements: [
      { id: titleTextId, type: 'text' },
      { id: metaTextId, type: 'text' }
    ],
    link: `[[${file.basename}]]`,
    locked: false,
    seed: Math.floor(Math.random() * 10000),
  });

  // 标题文本（上方）- 使用字段设置的字体
  data.elements.push({
    id: titleTextId,
    type: 'text',
    x: x + padding,
    y: y + padding,
    width: cardW - padding * 2,
    height: cardH / 2 - padding,
    angle: 0,
    strokeColor: fieldStyle.textColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [groupId],
    roundness: null,
    isDeleted: false,
    boundElements: null,
    containerId: cardId,
    text: truncate(paper.title, 80),
    fontSize: fieldStyle.titleFontSize || 14,
    fontFamily: fieldStyle.titleFontFamily || 1,
    textAlign: 'center',
    verticalAlign: 'top',
    baseline: 14,
    link: null,
    locked: false,
  });

  // 元信息文本（下方）- 使用字段设置的字体
  data.elements.push({
    id: metaTextId,
    type: 'text',
    x: x + padding,
    y: y + cardH / 2 + padding / 2,
    width: cardW - padding * 2,
    height: cardH / 2 - padding * 2,
    angle: 0,
    strokeColor: fieldStyle.textColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [groupId],
    roundness: null,
    isDeleted: false,
    boundElements: null,
    containerId: cardId,
    text: metaText,
    fontSize: fieldStyle.metaFontSize || 11,
    fontFamily: fieldStyle.metaFontFamily || 1,
    textAlign: 'left',
    verticalAlign: 'top',
    baseline: 13,
    link: null,
    locked: false,
  });

  // 写回文件
  const newJson = JSON.stringify(data);
  let newContent: string;
  if (lzMethod !== 'none') {
    const newCompressed = lzMethod === 'encodedURI'
      ? LZString.compressToEncodedURIComponent(newJson)
      : LZString.compressToBase64(newJson);
    newContent = raw.replace(
      /```compressed-json\r?\n[\s\S]*?\r?\n```/,
      '```compressed-json\n' + newCompressed + '\n```'
    );
  } else {
    newContent = raw.replace(
      /```json\r?\n([\s\S]*?)\r?\n```/,
      '```json\n' + newJson + '\n```'
    );
  }
  await app.vault.modify(excalidrawFile, newContent);
}

function genId(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: 20 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
