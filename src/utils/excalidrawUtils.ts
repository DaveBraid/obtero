import { App, TFile } from 'obsidian';
import * as LZString from 'lz-string';
import { MyPluginSettings } from '../settings';
import { PaperInfo, FieldStyle } from '../types';
import { ensureExcalidrawFile } from './fileUtils';

// 根据领域名称（含关联领域）查找样式
export function getFieldStyle(settings: MyPluginSettings, fieldName: string | undefined): FieldStyle | undefined {
  // 如果没有指定领域名称，返回 undefined
  if (!fieldName) return undefined;
  
  // 首先尝试精确匹配主领域名称
  let style = settings.fields.find(f => f.name === fieldName);
  if (style) return style;
  
  // 然后尝试匹配关联领域
  for (const field of settings.fields) {
    if (field.aliases && field.aliases.includes(fieldName)) {
      return field;
    }
  }
  
  return undefined;
}

// 获取有效的领域名称（用于回退逻辑）
export function getEffectiveFieldName(settings: MyPluginSettings, paperField?: string): string {
  // 优先使用 paper.field
  if (paperField && getFieldStyle(settings, paperField)) {
    return paperField;
  }
  
  // 其次尝试 defaultField
  if (settings.defaultField && getFieldStyle(settings, settings.defaultField)) {
    return settings.defaultField;
  }
  
  // 最后回退到第一个字段
  return settings.fields[0]?.name || '';
}

// Excalidraw Automate API 类型定义
interface ExcalidrawAutomateAPI {
  // 元素创建
  addRect: (topX: number, topY: number, width: number, height: number, id?: string) => string;
  addText: (topX: number, topY: number, text: string, id?: string) => string;
  
  // 元素获取
  getElement: (id: string) => MutableExcalidrawElement;
  getElements: () => MutableExcalidrawElement[];
  getViewElements: () => { id: string; type: string; groupIds: string[]; link?: string; isDeleted?: boolean }[];
  
  // 分组
  addToGroup: (objectIds: string[]) => string;
  
  // 样式设置方法
  setFillStyle: (val: number) => 'hachure' | 'cross-hatch' | 'solid';
  setStrokeStyle: (val: number) => 'solid' | 'dashed' | 'dotted';
  setStrokeSharpness: (val: number) => 'round' | 'sharp';
  setFontFamily: (val: number) => string;
  
  // style对象
  style: {
    strokeColor: string;
    backgroundColor: string;
    angle: number;
    fillStyle: 'hachure' | 'cross-hatch' | 'solid';
    strokeWidth: number;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    roughness: number;
    opacity: number;
    strokeSharpness?: 'round' | 'sharp';
    roundness: null | { type: number; value?: number };
    fontFamily: number;
    fontSize: number;
    textAlign: 'left' | 'right' | 'center';
    verticalAlign: 'top' | 'bottom' | 'middle';
  };
  
  // 其他
  clear: () => void;
  addElementsToView: (repositionToCursor?: boolean, save?: boolean, newElementsOnTop?: boolean) => Promise<boolean>;
}

// 可变的元素类型
interface MutableExcalidrawElement {
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

declare global {
  interface Window {
    ExcalidrawAutomate?: {
      plugin: unknown;
      getAPI: (view?: unknown) => ExcalidrawAutomateAPI;
    };
  }
}

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
  console.log(`[MyPaper] insertPaperToExcalidraw called, paper.field="${paper.field}"`);
  const excalidrawFile = await ensureExcalidrawFile(app, settings);
  
  // 尝试使用 Excalidraw Automate API（如果 Excalidraw 插件可用且视图已打开）
  const ea = getExcalidrawAutomateAPI(app, excalidrawFile);
  if (ea) {
    await insertPaperViaEA(ea, settings, paper, file);
    return;
  }
  
  // 如果 Excalidraw Automate 不可用，使用文件直接修改方式
  await insertPaperViaFile(app, settings, paper, file, excalidrawFile);
}

/**
 * 获取 Excalidraw Automate API
 */
function getExcalidrawAutomateAPI(
  app: App,
  excalidrawFile: TFile
): ExcalidrawAutomateAPI | null {
  if (!window.ExcalidrawAutomate?.getAPI) {
    return null;
  }
  
  // 检查 Excalidraw 视图是否已打开
  const leaves = app.workspace.getLeavesOfType('excalidraw');
  for (const leaf of leaves) {
    const view = leaf.view;
    if (view && (view as { file?: TFile }).file?.path === excalidrawFile.path) {
      const ea = window.ExcalidrawAutomate.getAPI(view);
      ea.clear();
      return ea;
    }
  }
  
  return null;
}

/**
 * 通过 Excalidraw Automate API 添加元素
 */
async function insertPaperViaEA(
  ea: ExcalidrawAutomateAPI,
  settings: MyPluginSettings,
  paper: PaperInfo,
  file: TFile
): Promise<void> {
  // Count existing cards - 使用 getViewElements 获取视图中的现有元素
  const viewElements = ea.getViewElements();
  const cardCount = viewElements.filter(
    e => !e.isDeleted && e.type === 'rectangle' && e.link && e.link.startsWith('[[')
  ).length;

  // 获取领域样式 - 使用辅助函数（支持关联领域）
  const fieldName = getEffectiveFieldName(settings, paper.field);
  const fieldStyle = getFieldStyle(settings, fieldName);

  if (!fieldStyle) {
    throw new Error('未找到领域样式配置');
  }
  console.log(`[MyPaper] 创建卡片使用领域: ${fieldName}, 背景色: ${fieldStyle.backgroundColor}`);

  // Card dimensions
  const cardW = fieldStyle.cardWidth || 280;
  const cardH = fieldStyle.cardHeight || 180;
  const padding = 12;

  const cols = 3;
  const col = cardCount % cols;
  const row = Math.floor(cardCount / cols);

  const cardSpacingX = cardW + 30;
  const cardSpacingY = cardH + 30;
  const x = col * cardSpacingX + 20;
  const y = row * cardSpacingY + 20;

  // 构建元文本
  const metaLines: string[] = [];
  const journalDate = [paper.journal, paper.date].filter(Boolean).join(' · ');
  if (journalDate) metaLines.push(truncate(journalDate, 50));
  if (paper.institutions && paper.institutions.length > 0) {
    metaLines.push(truncate(paper.institutions.slice(0, 2).join('; '), 60));
  } else if (paper.authors.length > 0) {
    metaLines.push(truncate(paper.authors.slice(0, 3).join(', '), 60));
  }
  const metaText = metaLines.join('\n');

  // 映射纹理类型
  const patternMap: Record<string, 'hachure' | 'cross-hatch' | 'solid'> = {
    'solid': 'solid',
    'dots': 'hachure',
    'grid': 'hachure',
    'lines': 'cross-hatch',
    'cross-hatch': 'cross-hatch',
  };
  const fillStyle = patternMap[fieldStyle.backgroundPattern || 'solid'] || 'solid';

  // 设置矩形样式
  ea.style.strokeColor = fieldStyle.borderColor;
  ea.style.backgroundColor = fieldStyle.backgroundColor;
  ea.style.fillStyle = fillStyle;
  ea.style.strokeWidth = 2;
  ea.style.strokeStyle = 'solid';
  ea.style.roughness = fieldStyle.roughness;
  ea.style.opacity = fieldStyle.opacity;
  if (fieldStyle.roundness > 0) {
    ea.style.roundness = { type: fieldStyle.roundness };
  } else {
    ea.style.roundness = null;
  }

  // 创建矩形
  const rectId = ea.addRect(x, y, cardW, cardH);
  
  // 修改矩形的link属性
  const rect = ea.getElement(rectId);
  rect.link = `[[${file.basename}]]`;
  rect.boundElements = [];

  // 设置文本样式
  ea.style.strokeColor = fieldStyle.textColor;
  ea.style.backgroundColor = 'transparent';
  ea.style.fillStyle = 'solid';
  ea.style.strokeWidth = 1;
  ea.style.strokeStyle = 'solid';
  ea.style.roughness = 0;
  ea.style.opacity = 100;
  ea.style.fontSize = fieldStyle.titleFontSize || 14;
  ea.style.fontFamily = fieldStyle.titleFontFamily || 1;
  ea.style.textAlign = 'center';
  ea.style.verticalAlign = 'top';

  // 创建标题文本
  const titleId = ea.addText(x + padding, y + padding, truncate(paper.title, 80));
  const titleEl = ea.getElement(titleId);
  titleEl.width = cardW - padding * 2;
  titleEl.height = cardH / 2 - padding;
  titleEl.containerId = rectId;
  rect.boundElements.push({ id: titleId, type: 'text' });

  // 设置元信息文本样式
  ea.style.fontSize = fieldStyle.metaFontSize || 11;
  ea.style.fontFamily = fieldStyle.metaFontFamily || 1;
  ea.style.textAlign = 'left';

  // 创建元信息文本
  const metaId = ea.addText(x + padding, y + cardH / 2 + padding / 2, metaText);
  const metaEl = ea.getElement(metaId);
  metaEl.width = cardW - padding * 2;
  metaEl.height = cardH / 2 - padding * 2;
  metaEl.containerId = rectId;
  rect.boundElements.push({ id: metaId, type: 'text' });

  // 添加到组（每个卡片单独一组）
  ea.addToGroup([rectId, titleId, metaId]);

  // 提交到视图
  await ea.addElementsToView(false, true, false);
}

/**
 * 通过直接修改文件添加元素（当 Excalidraw 视图未打开时使用）
 */
async function insertPaperViaFile(
  app: App,
  settings: MyPluginSettings,
  paper: PaperInfo,
  file: TFile,
  excalidrawFile: TFile
): Promise<void> {
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

  // 插件创建的卡片组ID前缀
  const CARD_GROUP_PREFIX = 'pm_card_';

  // Count existing cards - 通过带link的rectangle来计数
  const paperRectangles = data.elements.filter(
    e => !e.isDeleted && 
         e.type === 'rectangle' && 
         e.link && 
         e.link.startsWith('[[')
  );
  const cardCount = paperRectangles.length;

  // 获取领域样式 - 使用辅助函数（支持关联领域）
  const fieldName = getEffectiveFieldName(settings, paper.field);
  const fieldStyle = getFieldStyle(settings, fieldName);

  if (!fieldStyle) {
    throw new Error('未找到领域样式配置');
  }

  // Card dimensions
  const cardW = fieldStyle.cardWidth || 280;
  const cardH = fieldStyle.cardHeight || 180;
  const padding = 12;

  const cols = 3;
  const col = cardCount % cols;
  const row = Math.floor(cardCount / cols);

  const cardSpacingX = cardW + 30;
  const cardSpacingY = cardH + 30;
  const x = col * cardSpacingX + 20;
  const y = row * cardSpacingY + 20;

  const groupId = CARD_GROUP_PREFIX + genId();
  const cardId = genId();
  const titleTextId = genId();
  const metaTextId = genId();

  // 构建元文本
  const metaLines: string[] = [];
  const journalDate = [paper.journal, paper.date].filter(Boolean).join(' · ');
  if (journalDate) metaLines.push(truncate(journalDate, 50));
  if (paper.institutions && paper.institutions.length > 0) {
    metaLines.push(truncate(paper.institutions.slice(0, 2).join('; '), 60));
  } else if (paper.authors.length > 0) {
    metaLines.push(truncate(paper.authors.slice(0, 3).join(', '), 60));
  }
  const metaText = metaLines.join('\n');

  // 映射纹理类型
  const patternMap: Record<string, string> = {
    'solid': 'solid',
    'dots': 'hachure',
    'grid': 'hachure',
    'lines': 'cross-hatch',
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

  // 标题文本
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

  // 元信息文本
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
