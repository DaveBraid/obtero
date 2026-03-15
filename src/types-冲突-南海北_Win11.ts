export interface PaperInfo {
	title: string;
	authors: string[];
	affiliations: string[];
	venue: string; // 期刊或会议名称
	year: string;
	publishDate: string;
	abstract: string;
	doi?: string;
	arxivId?: string;
	url: string;
	source: 'arxiv' | 'semantic_scholar';
}

export type PaperCategory = 'to-read' | 'roughly-read' | 'carefully-read';

export const CATEGORY_LABELS: Record<PaperCategory, string> = {
	'to-read': '待阅读',
	'roughly-read': '已粗阅读',
	'carefully-read': '已精读',
};

export const CATEGORY_BG_COLORS: Record<PaperCategory, string> = {
	'to-read': '#fff9db',
	'roughly-read': '#d3f9d8',
	'carefully-read': '#d0ebff',
};

export const CATEGORY_STROKE_COLORS: Record<PaperCategory, string> = {
	'to-read': '#e67700',
	'roughly-read': '#2f9e44',
	'carefully-read': '#1971c2',
};

export const CATEGORY_ICONS: Record<PaperCategory, string> = {
	'to-read': '📌',
	'roughly-read': '📖',
	'carefully-read': '✅',
};
