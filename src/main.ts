import { Notice, Plugin, TFile, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, PaperSettingTab } from './settings';
import { PAPER_VIEW_TYPE, PaperView } from './ui/PaperView';
import { SetupModal } from './ui/SetupModal';
import { PaperInfo } from './types';
import {
  applyClaudianEnrichmentToPaper,
  buildClaudianMetadataPrompt,
  DEFAULT_CLAUDIAN_PROMPT,
  DEFAULT_CLAUDIAN_PROMPT_RELATIVE_PATH,
  formatRatingStars,
  getPaperFields,
  normalizeClaudianMetadataMode,
  normalizeRating,
  parseClaudianEnrichmentResponse,
  shouldAutoEnrichWithClaudian,
  shouldIncludeClaudianMetadata,
  updatePaperBodyMetadata,
  upsertBibtexCallout,
  upsertRatingPlaceholder,
} from './paperMetadata';
import { sendPromptToClaudian } from './claudianAdapter';
import { createPaperFile } from './utils/fileUtils';
import { insertPaperToExcalidraw } from './utils/excalidrawUtils';

export default class PaperPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(PAPER_VIEW_TYPE, leaf => new PaperView(leaf, this));

    this.addRibbonIcon('book-open', '论文管理', () => {
      void this.openPaperView();
    });

    this.addCommand({
      id: 'open-paper-manager',
      name: '打开论文管理界面',
      callback: () => {
        void this.openPaperView();
      },
    });

    this.addCommand({
      id: 'enrich-active-paper-metadata',
      name: '使用 Claudian 补全当前论文元数据',
      checkCallback: checking => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') {
          return false;
        }
        if (!checking) {
          void this.enrichExistingPaperInBackground(file);
        }
        return true;
      },
    });

    this.registerBibtexCopyPostProcessor();
    this.registerRatingPostProcessor();
    this.addSettingTab(new PaperSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.workspaceFolder) {
        new SetupModal(this.app, this, () => {
          void this.openPaperView();
        }).open();
      }
    });
  }

  onunload(): void {}

  async openPaperView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(PAPER_VIEW_TYPE);
    if (existing.length > 0 && existing[0]) {
      await workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeaf(false);
    await leaf.setViewState({ type: PAPER_VIEW_TYPE, active: true });
    await workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<MyPluginSettings>
    );
    this.settings.claudianMetadataMode = normalizeClaudianMetadataMode(this.settings.claudianMetadataMode);
    this.settings.claudianModel = this.settings.claudianModel || DEFAULT_SETTINGS.claudianModel;
    this.settings.claudianPromptPath = this.resolveClaudianPromptPath(this.settings.claudianPromptPath);

    // 确保所有领域都有字体属性（数据迁移）
    this.settings.fields = this.settings.fields.map(field => ({
      ...field,
      titleFontSize: field.titleFontSize ?? 14,
      titleFontFamily: field.titleFontFamily ?? 1,
      metaFontSize: field.metaFontSize ?? 11,
      metaFontFamily: field.metaFontFamily ?? 1,
    }));
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async ensureClaudianPromptFile(): Promise<void> {
    const promptPath = this.getClaudianPromptPath();
    await this.ensureVaultDirectory(promptPath.split('/').slice(0, -1).join('/'));
    if (!(await this.app.vault.adapter.exists(promptPath))) {
      await this.app.vault.adapter.write(promptPath, DEFAULT_CLAUDIAN_PROMPT);
      new Notice('已创建 Obtero 默认 Claudian 提示词');
    }
  }

  async loadClaudianPrompt(): Promise<string> {
    const promptPath = this.getClaudianPromptPath();
    await this.ensureClaudianPromptFile();
    return this.app.vault.adapter.read(promptPath);
  }

  async saveClaudianPrompt(content: string): Promise<void> {
    const promptPath = this.getClaudianPromptPath();
    await this.ensureVaultDirectory(promptPath.split('/').slice(0, -1).join('/'));
    await this.app.vault.adapter.write(promptPath, content);
  }

  async addPaperInBackground(
    paper: PaperInfo,
    category: string,
    onComplete?: (file?: TFile) => void | Promise<void>
  ): Promise<void> {
    new Notice(`开始添加「${paper.title}」`);
    let file: TFile | null = null;
    let paperForCard = paper;

    try {
      file = await createPaperFile(this.app, this.settings, paper, category);
      if (!file) {
        new Notice('创建论文文件失败');
        return;
      }
      new Notice(`已创建论文笔记：${file.basename}`);

      const mode = normalizeClaudianMetadataMode(this.settings.claudianMetadataMode);
      if (shouldAutoEnrichWithClaudian(mode)) {
        try {
          new Notice('正在调用 Claudian 补全论文元数据...');
          paperForCard = await this.enrichPaperFileWithClaudian(file, paper);
          new Notice('Claudian 元数据补全完成');
        } catch (error) {
          console.error('[Obtero] Claudian metadata enrichment failed:', error);
          new Notice(`Claudian 元数据补全失败：${(error as Error).message}`);
        }
      } else if (mode === 'manual') {
        new Notice('已保留元数据字段，可稍后手动补全');
      }

      if (this.settings.addCardToExcalidraw) {
        new Notice('正在更新 Excalidraw 论文卡片...');
        await insertPaperToExcalidraw(this.app, this.settings, paperForCard, file);
        new Notice('已更新 Excalidraw 论文卡片');
      }

      await onComplete?.(file);
      new Notice(`已完成添加「${paper.title}」`);
    } catch (error) {
      console.error('[Obtero] Add paper failed:', error);
      new Notice(`添加论文失败：${(error as Error).message}`);
      if (file) {
        await onComplete?.(file);
      }
    }
  }

  async enrichExistingPaperInBackground(file: TFile): Promise<void> {
    const mode = normalizeClaudianMetadataMode(this.settings.claudianMetadataMode);
    if (!shouldIncludeClaudianMetadata(mode)) {
      new Notice('Claudian 元数据补全已完全关闭');
      return;
    }

    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const paper = this.paperFromFrontmatter(file, fm);
    try {
      new Notice(`正在补全「${paper.title}」的论文元数据...`);
      await this.enrichPaperFileWithClaudian(file, paper);
      new Notice('论文元数据补全完成');
    } catch (error) {
      console.error('[Obtero] Manual metadata enrichment failed:', error);
      new Notice(`论文元数据补全失败：${(error as Error).message}`);
    }
  }

  private async enrichPaperFileWithClaudian(file: TFile, paper: PaperInfo): Promise<PaperInfo> {
    const promptTemplate = await this.loadClaudianPrompt();
    const prompt = buildClaudianMetadataPrompt(promptTemplate, paper);
    const response = await sendPromptToClaudian(
      this.app,
      prompt,
      this.settings.claudianModel,
    );
    const enrichment = parseClaudianEnrichmentResponse(response);
    const enrichedPaper = applyClaudianEnrichmentToPaper(paper, enrichment);
    await this.writeClaudianEnrichment(file, enrichedPaper);
    return enrichedPaper;
  }

  private async writeClaudianEnrichment(file: TFile, paper: PaperInfo): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, frontmatter => {
      const metadata = frontmatter as Record<string, unknown>;
      metadata.institutions = paper.institutions || [];
      metadata.published = paper.published || 'unknown';
      metadata.publicationVenue = paper.publicationVenue || '';
      metadata.openSourceStatus = paper.openSourceStatus || 'unknown';
      metadata.openSourceUrl = paper.openSourceUrl || '';
      metadata.fields = getPaperFields(paper);
      delete metadata.field;
      delete metadata.openSourcePlan;
      delete metadata.openSourceLevel;
      delete metadata.metadataEnrichedAt;
    });

    const content = await this.app.vault.read(file);
    const nextContent = upsertBibtexCallout(
      upsertRatingPlaceholder(updatePaperBodyMetadata(content, paper)),
      paper.bibtex || ''
    );
    if (nextContent !== content) {
      await this.app.vault.modify(file, nextContent);
    }
  }

  private paperFromFrontmatter(file: TFile, frontmatter: Record<string, unknown> | undefined): PaperInfo {
    const authors = frontmatter?.authors;
    const institutions = frontmatter?.institutions;
    const fields = frontmatter?.fields;
    const legacyField = this.getFrontmatterString(frontmatter, 'field');
    const normalizedFields = Array.isArray(fields)
      ? fields.filter((field): field is string => typeof field === 'string')
      : [];
    return {
      title: this.getFrontmatterString(frontmatter, 'title') || file.basename.replace(/^【.+?】-/, ''),
      journal: this.getFrontmatterString(frontmatter, 'journal'),
      date: this.getFrontmatterString(frontmatter, 'date'),
      authors: Array.isArray(authors)
        ? authors.filter((author): author is string => typeof author === 'string')
        : this.getFrontmatterString(frontmatter, 'authors').split(/[;；,]/).map(author => author.trim()).filter(Boolean),
      institutions: Array.isArray(institutions)
        ? institutions.filter((institution): institution is string => typeof institution === 'string')
        : [],
      rating: this.getFrontmatterNumber(frontmatter, 'rating'),
      pdfUrl: this.getFrontmatterString(frontmatter, 'pdfUrl'),
      fields: Array.from(new Set([...normalizedFields, legacyField].filter(Boolean))),
      field: legacyField,
      arxivId: this.getFrontmatterString(frontmatter, 'arxivId'),
      doi: this.getFrontmatterString(frontmatter, 'doi'),
      abstract: '',
      source: undefined,
    };
  }

  private getFrontmatterString(frontmatter: Record<string, unknown> | undefined, key: string): string {
    const value = frontmatter?.[key];
    return typeof value === 'string' ? value : '';
  }

  private getFrontmatterNumber(frontmatter: Record<string, unknown> | undefined, key: string): number {
    const value = frontmatter?.[key];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    return 0;
  }

  private registerRatingPostProcessor(): void {
    this.registerMarkdownPostProcessor((el, ctx) => {
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return;
      }

      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (!frontmatter || !Object.prototype.hasOwnProperty.call(frontmatter, 'rating')) {
        return;
      }

      if (el.querySelector('.obtero-rendered-rating')) {
        return;
      }

      const rating = normalizeRating(frontmatter.rating);
      const placeholder = el.querySelector<HTMLElement>('.obtero-rating-placeholder');
      if (placeholder) {
        this.renderRatingElement(placeholder, rating);
        return;
      }

      const ratingEl = document.createElement('div');
      this.renderRatingElement(ratingEl, rating);

      const bibtexCallout = this.findRenderedBibtexCallout(el);
      if (bibtexCallout?.parentElement) {
        bibtexCallout.insertAdjacentElement('beforebegin', ratingEl);
        return;
      }

      const summaryHeading = this.findRenderedHeading(el, '摘要') || this.findRenderedHeading(el, '笔记');
      if (summaryHeading?.parentElement) {
        summaryHeading.insertAdjacentElement('beforebegin', ratingEl);
        return;
      }

      const title = el.querySelector('h1');
      if (title?.parentElement) {
        title.insertAdjacentElement('afterend', ratingEl);
        return;
      }
      el.prepend(ratingEl);
    });
  }

  private renderRatingElement(element: HTMLElement, rating: number): void {
    element.addClass('obtero-rendered-rating');
    element.setAttribute('aria-label', `评分 ${rating} / 5`);
    element.textContent = formatRatingStars(rating);
  }

  private findRenderedHeading(root: HTMLElement, text: string): HTMLElement | null {
    const headings = root.querySelectorAll<HTMLElement>('h2');
    return Array.from(headings).find(heading => heading.textContent?.trim() === text) || null;
  }

  private findRenderedBibtexCallout(root: HTMLElement): HTMLElement | null {
    const nativeCallout = root.querySelector<HTMLElement>('.callout[data-callout="bibtex"]');
    if (nativeCallout) {
      return nativeCallout;
    }

    const blockquotes = root.querySelectorAll<HTMLElement>('blockquote');
    return Array.from(blockquotes).find(blockquote => blockquote.textContent?.includes('BibTeX')) || null;
  }

  private registerBibtexCopyPostProcessor(): void {
    this.registerMarkdownPostProcessor(el => {
      const codeBlocks = el.querySelectorAll<HTMLElement>(
        '.callout[data-callout="bibtex"] pre code, blockquote pre code.language-bibtex'
      );
      codeBlocks.forEach(codeBlock => {
        const parent = codeBlock.closest('pre')?.parentElement;
        if (!parent || parent.querySelector('.obtero-copy-bibtex')) {
          return;
        }
        const button = parent.createEl('button', {
          text: '复制 BibTeX',
          cls: 'obtero-copy-bibtex',
        });
        button.addEventListener('click', async event => {
          event.preventDefault();
          event.stopPropagation();
          await navigator.clipboard.writeText(codeBlock.textContent || '');
          new Notice('已复制 BibTeX');
        });
      });
    });
  }

  getClaudianPromptPath(): string {
    return this.resolveClaudianPromptPath(this.settings.claudianPromptPath);
  }

  getDefaultClaudianPromptPath(): string {
    return normalizePath(`${this.app.vault.configDir}/${DEFAULT_CLAUDIAN_PROMPT_RELATIVE_PATH}`);
  }

  private resolveClaudianPromptPath(value: string | undefined): string {
    const trimmed = (value || '').trim();
    if (!trimmed || trimmed === DEFAULT_CLAUDIAN_PROMPT_RELATIVE_PATH) {
      return this.getDefaultClaudianPromptPath();
    }
    if (trimmed.startsWith(`${this.app.vault.configDir}/`)) {
      return normalizePath(trimmed);
    }
    if (trimmed.startsWith('plugins/')) {
      return normalizePath(`${this.app.vault.configDir}/${trimmed}`);
    }
    return normalizePath(trimmed);
  }

  private async ensureVaultDirectory(dirPath: string): Promise<void> {
    const normalized = normalizePath(dirPath);
    if (!normalized) {
      return;
    }
    const parts = normalized.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.adapter.mkdir(current);
      }
    }
  }

  private createIdeaId(): string {
    return `idea-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  async addIdea(title: string, content: string, options?: { field?: string; color?: string; isCustomTag?: boolean }): Promise<void> {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    if (!normalizedTitle || !normalizedContent) return;

    this.settings.ideas = this.settings.ideas || [];
    this.settings.ideas.unshift({
      id: this.createIdeaId(),
      title: normalizedTitle,
      content: normalizedContent,
      createdAt: new Date().toISOString(),
      field: options?.field,
      color: options?.color,
      isCustomTag: options?.isCustomTag,
    });
    await this.saveSettings();
  }

  async removeIdea(ideaId: string): Promise<void> {
    this.settings.ideas = (this.settings.ideas || []).filter(idea => idea.id !== ideaId);
    await this.saveSettings();
  }

  async moveIdeaToValhalla(ideaId: string): Promise<void> {
    const idea = (this.settings.ideas || []).find(i => i.id === ideaId);
    if (idea) {
      idea.inValhalla = true;
      await this.saveSettings();
    }
  }

  async removeIdeaFromValhalla(ideaId: string): Promise<void> {
    const idea = (this.settings.ideas || []).find(i => i.id === ideaId);
    if (idea) {
      idea.inValhalla = false;
      await this.saveSettings();
    }
  }
}
