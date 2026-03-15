import { App, Notice, TFile } from 'obsidian';
import {
	CATEGORY_BG_COLORS,
	CATEGORY_ICONS,
	CATEGORY_LABELS,
	CATEGORY_STROKE_COLORS,
	PaperCategory,
	PaperInfo,
} from './types';

// ── 布局常量 ────────────────────────────────────────────────
const CARD_WIDTH = 420;
const CARD_HEIGHT = 250;
const CARD_PADDING = 16;
const CARD_COLS = 3;
const CARD_GAP = 30;
const CARD_START_X = 50;
const CARD_START_Y = 50;
const FONT_SIZE = 13;

// ── 空白 Excalidraw 文件模板 ───────────────────────────────
export const EMPTY_EXCALIDRAW = JSON.stringify(
	{
		type: 'excalidraw',
		version: 2,
		source: 'obsidian-mypaper-plugin',
		elements: [],
		appState: {
			gridSize: null,
			viewBackgroundColor: '#ffffff',
		},
		files: {},
	},
	null,
	2,
);

// ── 工具函数 ───────────────────────────────────────────────
function rnd(): number {
	return Math.floor(Math.random() * 999999) + 1;
}

function newId(): string {
	return `pp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── 生成论文卡片的 Excalidraw 元素 ─────────────────────────
type ExcalidrawElement = { type: string; [key: string]: unknown };

export function createPaperCardElements(
	paper: PaperInfo,
	category: PaperCategory,
	cardIndex: number,
): ExcalidrawElement[] {
	const col = cardIndex % CARD_COLS;
	const row = Math.floor(cardIndex / CARD_COLS);
	const x = CARD_START_X + col * (CARD_WIDTH + CARD_GAP);
	const y = CARD_START_Y + row * (CARD_HEIGHT + CARD_GAP);

	// 构建卡片文本内容
	const authorsText =
		paper.authors.length > 0
			? paper.authors.slice(0, 5).join(', ') +
				(paper.authors.length > 5 ? ' et al.' : '')
			: '未知作者';

	const affiliationLine =
		paper.affiliations && paper.affiliations.length > 0
			? `🏛 ${paper.affiliations.slice(0, 2).join('; ')}${paper.affiliations.length > 2 ? ' …' : ''}`
			: null;

	const lines: string[] = [
		`${CATEGORY_ICONS[category]} [${CATEGORY_LABELS[category]}]`,
		`📄 ${paper.title}`,
		``,
		`👤 ${authorsText}`,
		...(affiliationLine ? [affiliationLine] : []),
		`📅 ${paper.publishDate || paper.year || ''}`,
		`📰 ${paper.venue || 'arXiv Preprint'}`,
		...(paper.arxivId ? [`🔗 arXiv:${paper.arxivId}`] : []),
		...(paper.doi ? [`🔗 DOI:${paper.doi}`] : []),
	];

	const textContent = lines.join('\n');
	const groupId = newId();
	const rectId = newId();
	const textId = newId();
	const now = Date.now();

	const rect = {
		type: 'rectangle',
		version: 1,
		versionNonce: rnd(),
		isDeleted: false,
		id: rectId,
		fillStyle: 'solid',
		strokeWidth: 2,
		strokeStyle: 'solid',
		roughness: 0,
		opacity: 100,
		angle: 0,
		x,
		y,
		strokeColor: CATEGORY_STROKE_COLORS[category],
		backgroundColor: CATEGORY_BG_COLORS[category],
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		seed: rnd(),
		groupIds: [groupId],
		frameId: null,
		roundness: { type: 3, value: 10 },
		boundElements: [],
		updated: now,
		link: paper.url || null,
		locked: false,
	};

	const text = {
		type: 'text',
		version: 1,
		versionNonce: rnd(),
		isDeleted: false,
		id: textId,
		fillStyle: 'solid',
		strokeWidth: 1,
		strokeStyle: 'solid',
		roughness: 1,
		opacity: 100,
		angle: 0,
		x: x + CARD_PADDING,
		y: y + CARD_PADDING,
		strokeColor: '#1e1e1e',
		backgroundColor: 'transparent',
		width: CARD_WIDTH - CARD_PADDING * 2,
		height: CARD_HEIGHT - CARD_PADDING * 2,
		seed: rnd(),
		groupIds: [groupId],
		frameId: null,
		roundness: null,
		boundElements: [],
		updated: now,
		link: null,
		locked: false,
		text: textContent,
		fontSize: FONT_SIZE,
		fontFamily: 2, // Helvetica
		textAlign: 'left',
		verticalAlign: 'top',
		containerId: null,
		originalText: textContent,
		lineHeight: 1.4,
		autoResize: true,
	};

	return [rect, text] as ExcalidrawElement[];
}

// ── 确保 Excalidraw 文件存在，不存在则创建 ─────────────────
export async function ensureExcalidrawFile(
	app: App,
	folderPath: string,
	fileName: string,
): Promise<TFile> {
	const filePath = `${folderPath}/${fileName}.excalidraw`;

	// 确保文件夹存在
	if (!app.vault.getAbstractFileByPath(folderPath)) {
		await app.vault.createFolder(folderPath);
	}

	// 若文件已存在直接返回
	const existing = app.vault.getAbstractFileByPath(filePath);
	if (existing instanceof TFile) {
		return existing;
	}

	// 创建空白 Excalidraw 文件
	return await app.vault.create(filePath, EMPTY_EXCALIDRAW);
}

// ── ExcalidrawData 类型 ────────────────────────────────────
interface ExcalidrawData {
	type: string;
	version: number;
	elements: Array<{ type: string; [key: string]: unknown }>;
	appState?: unknown;
	files?: unknown;
	[key: string]: unknown;
}

// ── 向 Excalidraw 文件追加论文卡片 ────────────────────────
export async function addPaperCardToFile(
	app: App,
	file: TFile,
	paper: PaperInfo,
	category: PaperCategory,
): Promise<void> {
	const content = await app.vault.read(file);

	let data: ExcalidrawData;
	try {
		data = JSON.parse(content) as ExcalidrawData;
	} catch {
		new Notice('❌ 无法解析 Excalidraw 文件，请确保文件格式正确。');
		return;
	}

	if (!Array.isArray(data.elements)) {
		data.elements = [];
	}

	// 以矩形元素数量作为卡片索引，决定放置位置
	const cardCount = data.elements.filter((el) => el.type === 'rectangle').length;
	const newElements = createPaperCardElements(paper, category, cardCount);
	data.elements.push(...newElements);

	await app.vault.modify(file, JSON.stringify(data, null, 2));
	new Notice('✅ 论文卡片已添加到地图！');
}
