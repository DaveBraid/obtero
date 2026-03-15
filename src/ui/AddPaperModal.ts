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
  // 手动输入表单数据
  private manualInput: {
    title: string;
    authors: string;
    journal: string;
    date: string;
    institutions: string;
    arxivId: string;
    doi: string;
    abstract: string;
  } = {
    title: '',
    authors: '',
    journal: '',
    date: '',
    institutions: '',
    arxivId: '',
    doi: '',
    abstract: '',
  };

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

    // 添加搜索/手动输入切换按钮
    const modeContainer = contentEl.createDiv({ cls: 'pm-mode-switcher' });
    modeContainer.style.display = 'flex';
    modeContainer.style.justifyContent = 'center';
    modeContainer.style.gap = '8px';
    modeContainer.style.marginBottom = '16px';

    const searchBtn = modeContainer.createEl('button', {
      text: '🔍 搜索',
      cls: 'pm-mode-btn pm-mode-btn-active'
    });
    const manualBtn = modeContainer.createEl('button', {
      text: '✏️ 手动输入',
      cls: 'pm-mode-btn'
    });

    // 设置样式
    const style = document.createElement('style');
    style.textContent = `
      .pm-mode-switcher {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .pm-mode-btn {
        padding: 8px 16px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-secondary);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      .pm-mode-btn:hover {
        background: var(--background-modifier-hover);
      }
      .pm-mode-btn-active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-color: var(--interactive-accent);
      }
    `;
    contentEl.appendChild(style);

    // 搜索模式内容容器
    const searchContainer = contentEl.createDiv({ cls: 'pm-search-mode' });

    let query = '';
    const resultsContainer = searchContainer.createDiv();

    new Setting(searchContainer)
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

    searchContainer.appendChild(resultsContainer);

    // 手动输入模式内容容器（初始隐藏）
    const manualContainer = contentEl.createDiv({ cls: 'pm-manual-mode' });
    manualContainer.style.display = 'none';

    new Setting(manualContainer)
      .setName('论文标题')
      .setDesc('必填')
      .addText(text => {
        text.setPlaceholder('输入论文标题...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.title = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('作者')
      .setDesc('多个作者用分号分隔，如：张三; 李四; 王五')
      .addText(text => {
        text.setPlaceholder('作者1; 作者2; 作者3');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.authors = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('期刊/会议')
      .setDesc('如：Nature, CVPR 2024')
      .addText(text => {
        text.setPlaceholder('输入期刊或会议名称...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.journal = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('发表时间')
      .setDesc('如：2024-03-15 或 March 2024')
      .addText(text => {
        text.setPlaceholder('输入发表时间...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.date = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('作者单位')
      .setDesc('多个单位用分号分隔（可选）')
      .addText(text => {
        text.setPlaceholder('单位1; 单位2');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.institutions = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('arXiv ID')
      .setDesc('可选，如：2403.12345')
      .addText(text => {
        text.setPlaceholder('输入 arXiv ID...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.arxivId = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('DOI')
      .setDesc('可选，如：10.1234/example.12345')
      .addText(text => {
        text.setPlaceholder('输入 DOI...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.doi = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(manualContainer)
      .setName('摘要')
      .setDesc('可选')
      .addTextArea(text => {
        text.setPlaceholder('输入论文摘要...');
        text.inputEl.rows = 4;
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.abstract = (e.target as HTMLInputElement).value.trim();
        });
      });

    // 确认按钮容器
    const manualButtonContainer = manualContainer.createDiv({ cls: 'modal-button-container' });
    manualButtonContainer.style.display = 'flex';
    manualButtonContainer.style.justifyContent = 'flex-end';
    manualButtonContainer.style.gap = '10px';
    manualButtonContainer.style.marginTop = '20px';

    const confirmBtn = manualButtonContainer.createEl('button', {
      text: '下一步：选择类别',
      cls: 'mod-cta'
    });
    confirmBtn.addEventListener('click', () => this.showManualInputDetailPage());

    // 切换按钮事件
    searchBtn.addEventListener('click', () => {
      searchBtn.classList.add('pm-mode-btn-active');
      manualBtn.classList.remove('pm-mode-btn-active');
      searchContainer.style.display = 'block';
      manualContainer.style.display = 'none';
    });

    manualBtn.addEventListener('click', () => {
      manualBtn.classList.add('pm-mode-btn-active');
      searchBtn.classList.remove('pm-mode-btn-active');
      manualContainer.style.display = 'block';
      searchContainer.style.display = 'none';
    });
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

  // ── 手动输入详情页面 ───────────────────────────────────────────────────────

  private showManualInputDetailPage(): void {
    // 验证必填字段
    if (!this.manualInput.title) {
      new Notice('请输入论文标题');
      return;
    }

    // 从手动输入创建 PaperInfo
    this.selected = {
      title: this.manualInput.title,
      authors: this.manualInput.authors ? this.manualInput.authors.split(/[;；]/).map(a => a.trim()).filter(a => a) : [],
      journal: this.manualInput.journal,
      date: this.manualInput.date,
      institutions: this.manualInput.institutions ? this.manualInput.institutions.split(/[;；]/).map(i => i.trim()).filter(i => i) : [],
      arxivId: this.manualInput.arxivId || undefined,
      doi: this.manualInput.doi || undefined,
      abstract: this.manualInput.abstract || undefined,
      source: undefined, // 手动添加没有特定来源
    };

    // 显示详情页面
    this.showDetailPage();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
