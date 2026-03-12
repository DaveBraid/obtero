import { App, Modal, Notice } from 'obsidian';
import type { TFile } from 'obsidian';
import { addPaperCardToFile } from './excalidraw';
import { searchPapers } from './paperSearch';
import {
	CATEGORY_BG_COLORS,
	CATEGORY_LABELS,
	CATEGORY_STROKE_COLORS,
	PaperCategory,
	PaperInfo,
} from './types';

export class PaperSearchModal extends Modal {
	private targetFile: TFile;
	private selectedPaper: PaperInfo | null = null;
	private selectedCategory: PaperCategory = 'to-read';
	private onPaperAdded?: () => void;

	constructor(app: App, targetFile: TFile, onPaperAdded?: () => void) {
		super(app);
		this.targetFile = targetFile;
		this.onPaperAdded = onPaperAdded;
	}

	onOpen(): void {
		this.modalEl.addClass('paper-search-modal');
		this.renderSearchPhase();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	// ── 第一阶段：搜索 ─────────────────────────────────────
	private renderSearchPhase(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: '🔍 搜索并添加论文' });

		// 搜索输入行
		const searchRow = contentEl.createDiv({ cls: 'paper-search-row' });
		const inputEl = searchRow.createEl('input', {
			type: 'text',
			placeholder: '输入论文标题或关键词（支持中英文）',
			cls: 'paper-search-input',
		});
		const searchBtn = searchRow.createEl('button', {
			text: '搜索',
			cls: 'mod-cta paper-search-btn',
		});

		// 提示文字
		const hintEl = contentEl.createEl('p', {
			text: '将同时搜索 arXiv 和 Semantic Scholar 数据库。',
			cls: 'paper-search-hint',
		});

		// 结果容器
		const resultsEl = contentEl.createDiv({ cls: 'paper-results-container' });

		const doSearch = async () => {
			const query = inputEl.value.trim();
			if (!query) {
				new Notice('请输入搜索关键词！');
				return;
			}

			searchBtn.textContent = '搜索中…';
			(searchBtn as HTMLButtonElement).disabled = true;
			resultsEl.empty();
			hintEl.textContent = '⏳ 正在搜索，请稍候…';

			try {
				const papers = await searchPapers(query);
				resultsEl.empty();

				if (papers.length === 0) {
					hintEl.textContent = '未找到相关论文，请尝试其他关键词。';
				} else {
					hintEl.textContent = `找到 ${papers.length} 篇相关论文，点击选择：`;
					papers.forEach((paper, idx) =>
						this.renderResultItem(resultsEl, paper, idx),
					);
				}
			} catch (err) {
				resultsEl.empty();
				hintEl.textContent = `搜索失败：${String(err)}`;
				hintEl.addClass('paper-error');
			} finally {
				searchBtn.textContent = '搜索';
				(searchBtn as HTMLButtonElement).disabled = false;
			}
		};

		searchBtn.addEventListener('click', doSearch);
		inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') doSearch();
		});

		// 自动聚焦输入框
		window.setTimeout(() => inputEl.focus(), 60);
	}

	// ── 渲染单条搜索结果 ────────────────────────────────────
	private renderResultItem(container: HTMLElement, paper: PaperInfo, index: number): void {
		const item = container.createDiv({ cls: 'paper-result-item' });

		item.createDiv({
			cls: 'paper-result-title',
			text: `${index + 1}. ${paper.title}`,
		});

		const parts: string[] = [];
		if (paper.venue) parts.push(paper.venue);
		if (paper.year) parts.push(paper.year);
		parts.push(paper.source === 'arxiv' ? 'arXiv' : 'Semantic Scholar');

		item.createDiv({
			cls: 'paper-result-meta',
			text: parts.join(' · '),
		});

		item.addEventListener('click', () => {
			this.selectedPaper = paper;
			this.renderDetailPhase(paper);
		});
	}

	// ── 第二阶段：论文详情 + 类别选择 ──────────────────────
	private renderDetailPhase(paper: PaperInfo): void {
		const { contentEl } = this;
		contentEl.empty();

		// 顶部标题行（含返回按钮）
		const headerRow = contentEl.createDiv({ cls: 'paper-detail-header' });
		const backBtn = headerRow.createEl('button', {
			text: '← 返回',
			cls: 'paper-back-btn',
		});
		backBtn.addEventListener('click', () => this.renderSearchPhase());
		headerRow.createEl('h2', { text: '📄 论文详情' });

		// 论文信息展示
		const infoEl = contentEl.createDiv({ cls: 'paper-detail-info' });

		const addRow = (label: string, value: string | undefined) => {
			if (!value) return;
			const row = infoEl.createDiv({ cls: 'paper-detail-row' });
			row.createSpan({ text: label, cls: 'paper-detail-label' });
			row.createSpan({ text: value, cls: 'paper-detail-value' });
		};

		addRow('标题：', paper.title);
		addRow('期刊 / 会议：', paper.venue);
		addRow('发表时间：', paper.publishDate || paper.year);

		if (paper.authors.length > 0) {
			addRow('作者：', paper.authors.join(', '));
		}
		if (paper.affiliations.length > 0) {
			addRow('作者单位：', paper.affiliations.join('; '));
		}
		if (paper.arxivId) addRow('arXiv ID：', paper.arxivId);
		if (paper.doi) addRow('DOI：', paper.doi);

		// 摘要（截断显示）
		if (paper.abstract) {
			const row = infoEl.createDiv({ cls: 'paper-detail-row' });
			row.createSpan({ text: '摘要：', cls: 'paper-detail-label' });
			const MAX = 220;
			const text =
				paper.abstract.length > MAX
					? paper.abstract.slice(0, MAX) + '…'
					: paper.abstract;
			row.createSpan({ text, cls: 'paper-detail-value paper-abstract' });
		}

		// 类别选择
		const catSection = contentEl.createDiv({ cls: 'paper-category-section' });
		catSection.createDiv({
			text: '选择论文类别：',
			cls: 'paper-category-title',
		});

		const catRow = catSection.createDiv({ cls: 'paper-category-row' });
		const categories: PaperCategory[] = ['to-read', 'roughly-read', 'carefully-read'];

		categories.forEach((cat) => {
			const btn = catRow.createEl('button', {
				text: CATEGORY_LABELS[cat],
				cls: `paper-category-btn${this.selectedCategory === cat ? ' is-active' : ''}`,
			});
			btn.style.setProperty('--cat-bg', CATEGORY_BG_COLORS[cat]);
			btn.style.setProperty('--cat-border', CATEGORY_STROKE_COLORS[cat]);
			btn.addEventListener('click', () => {
				this.selectedCategory = cat;
				catRow.querySelectorAll('.paper-category-btn').forEach((b) => {
					b.classList.toggle('is-active', b === btn);
				});
			});
		});

		// 操作按钮行
		const actionRow = contentEl.createDiv({ cls: 'paper-action-row' });

		actionRow.createEl('button', { text: '取消', cls: 'paper-cancel-btn' })
			.addEventListener('click', () => this.close());

		const addBtn = actionRow.createEl('button', {
			text: '✅ 添加到地图',
			cls: 'mod-cta paper-add-btn',
		});

		addBtn.addEventListener('click', async () => {
			if (!this.selectedPaper) return;
			addBtn.textContent = '添加中…';
			(addBtn as HTMLButtonElement).disabled = true;
			try {
				await addPaperCardToFile(
					this.app,
					this.targetFile,
					this.selectedPaper,
					this.selectedCategory,
				);
				this.onPaperAdded?.();
				this.close();
			} catch (err) {
				new Notice(`添加失败：${String(err)}`);
				addBtn.textContent = '✅ 添加到地图';
				(addBtn as HTMLButtonElement).disabled = false;
			}
		});
	}
}