import { App, Modal, Notice, Setting } from 'obsidian';
import MyPlugin from '../main';
import { PaperInfo } from '../types';
import { searchArxiv } from '../api/arxivSearch';
import { searchIEEE } from '../api/ieeeSearch';
import { createPaperFile } from '../utils/fileUtils';
import { insertPaperToExcalidraw } from '../utils/excalidrawUtils';

export class AddPaperModal extends Modal {
  private plugin: MyPlugin;
  private results: PaperInfo[] = [];
  private selected: PaperInfo | null = null;
  private category: string;
  private onComplete?: () => void;

  constructor(app: App, plugin: MyPlugin, onComplete?: () => void) {
    super(app);
    this.plugin = plugin;
    this.category = '待阅读';
    this.onComplete = onComplete;
  }

  onOpen(): void {
    this.showSearchPage();
  }

  // ── Search page ───────────────────────────────────────────────────────────

  private showSearchPage(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '添加论文' });

    let query = '';
    const resultsEl = contentEl.createDiv({ cls: 'pm-search-results' });

    new Setting(contentEl)
      .setName('搜索论文')
      .setDesc('输入论文标题或关键词，支持 arXiv 和 IEEE 数据库')
      .addText(text => {
        text.setPlaceholder('论文标题或关键词').onChange(v => {
          query = v;
        });
        text.inputEl.addEventListener('keydown', async e => {
          if (e.key === 'Enter') await this.doSearch(query, resultsEl);
        });
      })
      .addButton(btn =>
        btn
          .setButtonText('搜索')
          .setCta()
          .onClick(async () => await this.doSearch(query, resultsEl))
      );

    // Move resultsEl below the setting
    contentEl.appendChild(resultsEl);
  }

  private async doSearch(query: string, container: HTMLElement): Promise<void> {
    if (!query.trim()) {
      new Notice('请输入搜索关键词');
      return;
    }
    container.empty();
    container.createEl('p', { text: '搜索中…', cls: 'pm-search-loading' });

    try {
      const [arxiv, ieee] = await Promise.all([
        searchArxiv(query),
        this.plugin.settings.ieeeApiKey
          ? searchIEEE(query, this.plugin.settings.ieeeApiKey)
          : Promise.resolve([]),
      ]);
      this.results = [...arxiv, ...ieee];
      this.renderResults(container);
    } catch (e) {
      container.empty();
      container.createEl('p', {
        text: `搜索失败：${(e as Error).message}`,
      });
    }
  }

  private renderResults(container: HTMLElement): void {
    container.empty();
    if (this.results.length === 0) {
      container.createEl('p', { text: '未找到相关论文' });
      return;
    }
    container.createEl('h3', { text: `搜索结果（${this.results.length} 条）` });

    for (const paper of this.results) {
      const item = container.createDiv({ cls: 'pm-result-item' });
      item.createDiv({ cls: 'pm-result-title', text: paper.title });
      item.createDiv({
        cls: 'pm-result-meta',
        text: `${paper.source?.toUpperCase() ?? ''} · ${paper.journal} · ${paper.date}`,
      });
      item.createDiv({
        cls: 'pm-result-authors',
        text:
          paper.authors.slice(0, 3).join(', ') +
          (paper.authors.length > 3 ? ' 等' : ''),
      });
      item.addEventListener('click', () => {
        this.selected = paper;
        this.showDetailPage();
      });
    }
  }

  // ── Detail page ───────────────────────────────────────────────────────────

  private showDetailPage(): void {
    if (!this.selected) return;
    const p = this.selected;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '论文详情' });

    const detail = contentEl.createDiv({ cls: 'pm-detail' });
    const row = (label: string, value: string) => {
      if (!value) return;
      const r = detail.createDiv({ cls: 'pm-detail-row' });
      r.createSpan({ cls: 'pm-detail-label', text: label });
      r.createSpan({ cls: 'pm-detail-value', text: value });
    };

    row('标 题', p.title);
    row('期刊/会议', p.journal);
    row('发表时间', p.date);
    row('作 者', p.authors.join('; '));
    if (p.institutions.length > 0) row('作者单位', p.institutions.join('; '));
    if (p.arxivId) row('arXiv ID', p.arxivId);
    if (p.doi) row('DOI', p.doi);

    const categories = ['待阅读', ...this.plugin.settings.labels];
    new Setting(contentEl)
      .setName('论文类别')
      .setDesc('选择该论文的阅读状态')
      .addDropdown(drop => {
        categories.forEach(c => drop.addOption(c, c));
        drop.setValue(this.category).onChange(v => {
          this.category = v;
        });
      });

    const btnRow = contentEl.createDiv({ cls: 'pm-btn-row' });
    btnRow
      .createEl('button', { text: '← 返回' })
      .addEventListener('click', () => this.showSearchPage());

    btnRow
      .createEl('button', { text: '确定添加', cls: 'mod-cta' })
      .addEventListener('click', () => this.doAdd());
  }

  private async doAdd(): Promise<void> {
    if (!this.selected) return;
    try {
      const file = await createPaperFile(
        this.app,
        this.plugin.settings,
        this.selected,
        this.category
      );
      if (!file) {
        new Notice('创建论文文件失败');
        return;
      }
      await insertPaperToExcalidraw(
        this.app,
        this.plugin.settings,
        this.selected,
        file
      );
      new Notice(`已将「${this.selected.title}」添加到「${this.category}」`);
      this.close();
      this.onComplete?.();
    } catch (e) {
      new Notice('添加论文失败：' + (e as Error).message);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
