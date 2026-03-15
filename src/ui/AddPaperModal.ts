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
  private field: string;
  private onComplete?: () => void;

  constructor(app: App, plugin: MyPlugin, onComplete?: () => void) {
    super(app);
    this.plugin = plugin;
    this.category = '待阅读';
    // 验证 defaultField 是否在 fields 列表中存在，不存在则使用第一个字段
    const validFields = plugin.settings.fields.map(f => f.name);
    if (validFields.includes(plugin.settings.defaultField)) {
      this.field = plugin.settings.defaultField;
    } else {
      this.field = validFields[0] || '';
    }
    this.onComplete = onComplete;
  }

  onOpen(): void {
    this.showSearchPage();
  }

  // ── 搜索页面 ───────────────────────────────────────────────────────────

  private showSearchPage(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '添加论文' });

    let query = '';
    const resultsContainer = contentEl.createDiv();

    new Setting(contentEl)
      .setName('搜索关键词')
      .setDesc('输入论文标题或关键词，支持 arXiv 和 IEEE')
      .addText(text => {
        text.setPlaceholder('输入搜索关键词...').onChange(v => {
          query = v;
        });
        text.inputEl.addEventListener('keydown', async e => {
          if (e.key === 'Enter') await this.doSearch(query, resultsContainer);
        });
      })
      .addButton(btn =>
        btn
          .setButtonText('搜索')
          .setCta()
          .onClick(async () => await this.doSearch(query, resultsContainer))
      );

    contentEl.appendChild(resultsContainer);
  }

  private async doSearch(query: string, container: HTMLElement): Promise<void> {
    if (!query.trim()) {
      new Notice('请输入搜索关键词');
      return;
    }
    container.empty();
    container.createEl('p', { text: '搜索中...' });

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

  // ── 详情页面 ───────────────────────────────────────────────────────────

  private showDetailPage(): void {
    if (!this.selected) return;
    const p = this.selected;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '论文详情' });

    // 论文信息
    const info = contentEl.createDiv({ cls: 'pm-detail' });

    const addField = (label: string, value: string) => {
      if (!value) return;
      const row = info.createDiv({ cls: 'pm-detail-row' });
      row.createSpan({ cls: 'pm-detail-label', text: label });
      row.createSpan({ cls: 'pm-detail-value', text: value });
    };

    addField('标题', p.title);
    addField('期刊/会议', p.journal);
    addField('发表时间', p.date);
    addField('作者', p.authors.join('; '));
    if (p.institutions.length > 0) {
      addField('作者单位', p.institutions.join('; '));
    }
    if (p.arxivId) addField('arXiv ID', p.arxivId);
    if (p.doi) addField('DOI', p.doi);

    // 论文类别
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

    // 研究领域
    const fieldOptions = this.plugin.settings.fields.map(f => f.name);
    new Setting(contentEl)
      .setName('研究领域')
      .setDesc('选择该论文所属领域（决定 Excalidraw 卡片样式）')
      .addDropdown(drop => {
        fieldOptions.forEach(f => drop.addOption(f, f));
        drop.setValue(this.field).onChange(v => {
          this.field = v;
        });
      })
      .addButton(btn => {
        btn
          .setButtonText('+ 新建')
          .setTooltip('创建新的研究领域')
          .onClick(() => {
            this.showNewFieldModal();
          });
      });

    // 按钮
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const backBtn = buttonContainer.createEl('button', { text: '← 返回' });
    backBtn.addEventListener('click', () => this.showSearchPage());

    const addBtn = buttonContainer.createEl('button', {
      text: '确定添加',
      cls: 'mod-cta'
    });
    addBtn.addEventListener('click', () => this.doAdd());
  }

  // ── 新建领域模态框 ─────────────────────────────────────────────────────

  private showNewFieldModal(): void {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: '创建新领域' });

    new Setting(modal.contentEl)
      .setName('领域名称')
      .setDesc('输入新研究领域的名称')
      .addText(text => {
        text.setPlaceholder('例如：深度学习');
        text.inputEl.focus();
      });

    const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '创建',
      cls: 'mod-cta'
    });

    confirmBtn.addEventListener('click', () => {
      const input = modal.contentEl.querySelector('input') as HTMLInputElement;
      const newFieldName = input.value.trim() || '新领域';

      if (this.plugin.settings.fields.some(f => f.name === newFieldName)) {
        new Notice('领域名称已存在，请使用其他名称');
        return;
      }

      const newField = {
        name: newFieldName,
        backgroundColor: '#ffffff',
        backgroundPattern: 'solid' as const,
        patternColor: '#cccccc',
        textColor: '#000000',
        borderColor: '#000000',
        roughness: 0,
        opacity: 100,
        roundness: 2,
        titleFontSize: 14,
        titleFontFamily: 1,
        metaFontSize: 11,
        metaFontFamily: 1,
        cardWidth: 280,
        cardHeight: 180,
        titleAlignment: 'left' as 'left' | 'center',
      };

      this.plugin.settings.fields.push(newField);
      this.plugin.saveSettings();
      this.field = newFieldName;
      this.showDetailPage();
      new Notice(`已创建新领域「${newFieldName}」`);
      modal.close();
    });

    // 回车键支持
    const input = modal.contentEl.querySelector('input') as HTMLInputElement;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      }
    });

    modal.open();
  }

  // ── 添加论文 ─────────────────────────────────────────────────────────────

  private async doAdd(): Promise<void> {
    if (!this.selected) return;

    this.selected.field = this.field;
    console.log(`[MyPaper] doAdd: 设置 paper.field="${this.field}"`);

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
