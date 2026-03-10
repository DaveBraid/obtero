import { App, TFile, normalizePath } from 'obsidian';
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
}

export async function insertPaperToExcalidraw(
  app: App,
  settings: MyPluginSettings,
  paper: PaperInfo,
  file: TFile
): Promise<void> {
  // Auto-create the excalidraw file if it doesn't exist yet
  const excalidrawFile = await ensureExcalidrawFile(app, settings);

  const raw = await app.vault.read(excalidrawFile);

  // Determine format: plain json or lz-compressed-json
  let data: { elements: ExcalidrawElement[]; [key: string]: unknown };
  // Track which LZ method was used so we can write back in the same format
  type LZMethod = 'base64' | 'encodedURI' | 'none';
  let lzMethod: LZMethod = 'none';

  const plainJsonMatch = raw.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  const compressedMatch = raw.match(/```compressed-json\r?\n([\s\S]*?)\r?\n```/);

  if (plainJsonMatch && plainJsonMatch[1]) {
    data = JSON.parse(plainJsonMatch[1]) as typeof data;
  } else if (compressedMatch && compressedMatch[1]) {
    // Strip ALL whitespace (the plugin may wrap long base64 lines)
    const payload = compressedMatch[1].replace(/\s/g, '');

    // Try compressToBase64 first, then compressToEncodedURIComponent
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

    // Count existing cards by unique non-empty groupIds
    const existingGroups = new Set(
      data.elements
        .filter(e => !e.isDeleted && e.groupIds.length > 0)
        .flatMap(e => e.groupIds)
    );
    const cardCount = existingGroups.size;

    // Get card style from settings
    const style = settings.cardStyle;

    // Card dimensions from settings
    const cardW = style.cardWidth;
    const headerH = style.headerHeight;
    const bodyH = style.bodyHeight;
    const totalCardH = headerH + bodyH;

    const cols = 3;
    const col = cardCount % cols;
    const row = Math.floor(cardCount / cols);

    // Calculate position with dynamic spacing based on card size
    const cardSpacingX = cardW + 30; // 卡片宽度 + 间距
    const cardSpacingY = totalCardH + 30; // 卡片总高度 + 间距
    const x = col * cardSpacingX + 20;
    const y = row * cardSpacingY + 20;

    const groupId = genId();
    const headerId = genId();
    const bodyId = genId();
    const titleTextId = genId();
    const metaTextId = genId();

    // Build meta text: journal · date, then institutions (or authors)
    const metaLines: string[] = [];
    const journalDate = [paper.journal, paper.date].filter(Boolean).join(' · ');
    if (journalDate) metaLines.push(truncate(journalDate, 45));
    if (paper.institutions.length > 0) {
      metaLines.push(truncate(paper.institutions.slice(0, 2).join('; '), 50));
    } else if (paper.authors.length > 0) {
      metaLines.push(truncate(paper.authors.slice(0, 3).join(', '), 50));
    }
    const metaText = metaLines.join('\n');

    // Header rectangle (使用用户自定义样式)
    data.elements.push({
      id: headerId,
      type: 'rectangle',
      x,
      y,
      width: cardW,
      height: headerH,
      angle: 0,
      strokeColor: style.headerBorderColor,
      backgroundColor: style.headerBackgroundColor,
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: style.headerRoughness,
      opacity: style.headerOpacity,
      groupIds: [groupId],
      roundness: style.headerRoundness > 0 ? { type: style.headerRoundness } : null,
      isDeleted: false,
      boundElements: [{ id: titleTextId, type: 'text' }],
      link: `[[${file.basename}]]`,
      locked: false,
    });

    // Title text (white, bound to header)
    data.elements.push({
      id: titleTextId,
      type: 'text',
      x: x + 8,
      y: y + 4,
      width: cardW - 16,
      height: headerH - 8,
      angle: 0,
      strokeColor: style.headerTextColor,
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [groupId],
      roundness: null,
      isDeleted: false,
      boundElements: null,
      containerId: headerId,
      text: truncate(paper.title, 80),
      fontSize: style.titleFontSize,
      fontFamily: style.titleFontFamily,
      textAlign: 'center',
      verticalAlign: 'middle',
      baseline: 14,
      link: null,
      locked: false,
    });

    // Body rectangle (使用用户自定义样式)
    data.elements.push({
      id: bodyId,
      type: 'rectangle',
      x,
      y: y + headerH,
      width: cardW,
      height: bodyH,
      angle: 0,
      strokeColor: style.bodyBorderColor,
      backgroundColor: style.bodyBackgroundColor,
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: style.bodyRoughness,
      opacity: style.bodyOpacity,
      groupIds: [groupId],
      roundness: style.bodyRoundness > 0 ? { type: style.bodyRoundness } : null,
      isDeleted: false,
      boundElements: [{ id: metaTextId, type: 'text' }],
      link: null,
      locked: false,
    });

    // Meta text (使用用户自定义样式)
    data.elements.push({
      id: metaTextId,
      type: 'text',
      x: x + 8,
      y: y + headerH + 8,
      width: cardW - 16,
      height: bodyH - 16,
      angle: 0,
      strokeColor: style.bodyTextColor,
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [groupId],
      roundness: null,
      isDeleted: false,
      boundElements: null,
      containerId: bodyId,
      text: metaText,
      fontSize: style.metaFontSize,
      fontFamily: style.metaFontFamily,
      textAlign: 'left',
      verticalAlign: 'top',
      baseline: 13,
      link: null,
      locked: false,
    });

  // Write back in the same format (compressed or plain)
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
