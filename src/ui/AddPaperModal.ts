import { App, Modal, Notice, Setting } from 'obsidian';
import MyPlugin from '../main';
import { PaperInfo, FieldStyle } from '../types';
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
    // 添加键盘快捷键支持
    this.scope.register([], 'Escape', () => {
      this.close();
    });
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
      .setName('arXiv ID')
      .setDesc('可选，如：2403.12345')
      .addText(text => {
        text.setPlaceholder('输入 arXiv ID...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.arxivId = (e.target as HTMLInputElement).value.trim();
        });
      });

    // ── 更多信息（折叠）────────────────────────────────────────────
    const moreInfo = manualContainer.createEl('details');
    const moreSummary = moreInfo.createEl('summary', { text: '更多信息（可选）' });
    moreSummary.style.cursor = 'pointer';
    moreSummary.style.fontSize = '13px';
    moreSummary.style.color = 'var(--text-muted)';
    moreSummary.style.padding = '8px 0';
    moreSummary.style.marginTop = '8px';

    const moreContent = moreInfo.createDiv();
    moreContent.style.marginTop = '8px';

    new Setting(moreContent)
      .setName('作者单位')
      .setDesc('多个单位用分号分隔')
      .addText(text => {
        text.setPlaceholder('单位1; 单位2');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.institutions = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(moreContent)
      .setName('DOI')
      .setDesc('如：10.1234/example.12345')
      .addText(text => {
        text.setPlaceholder('输入 DOI...');
        text.inputEl.addEventListener('change', (e) => {
          this.manualInput.doi = (e.target as HTMLInputElement).value.trim();
        });
      });

    new Setting(moreContent)
      .setName('摘要')
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

  private isSearching = false;

  private async doSearch(query: string, container: HTMLElement): Promise<void> {
    if (this.isSearching) return;
    if (!query.trim()) {
      new Notice('请输入搜索关键词');
      return;
    }

    this.isSearching = true;
    container.empty();

    // 显示 loading 状态
    const loadingEl = container.createDiv({ cls: 'pm-search-loading' });
    loadingEl.style.textAlign = 'center';
    loadingEl.style.padding = '24px';
    loadingEl.style.color = 'var(--text-muted)';

    const spinner = loadingEl.createSpan({ cls: 'pm-spinner' });
    spinner.innerHTML = '🔍';
    spinner.style.fontSize = '24px';
    spinner.style.animation = 'pulse 1s infinite';
    loadingEl.createSpan({ text: ' 搜索中...' });

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
      const errorEl = container.createDiv();
      errorEl.style.color = 'var(--text-error)';
      errorEl.style.textAlign = 'center';
      errorEl.style.padding = '16px';
      errorEl.textContent = `搜索失败：${(e as Error).message}`;
    } finally {
      this.isSearching = false;
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
    addField('期刊/会议', p.journal || '');
    addField('发表时间', p.date || '');
    addField('作者', p.authors.join('; '));
    if (p.institutions && p.institutions.length > 0) {
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

    // 研究领域（可选，包含主领域和关联领域）
    const fieldOptions: { value: string; label: string }[] = [
      { value: '', label: '未选择（可选）' }
    ];
    this.plugin.settings.fields.forEach(f => {
      // 添加主领域
      fieldOptions.push({ value: f.name, label: f.name });
      // 添加关联领域（显示为 "别名 (主领域)"）
      if (f.aliases) {
        f.aliases.forEach(alias => {
          fieldOptions.push({ value: alias, label: `${alias} (${f.name})` });
        });
      }
    });
    new Setting(contentEl)
      .setName('研究领域')
      .setDesc('选择该论文所属领域（可选，决定 Excalidraw 卡片样式）')
      .addDropdown(drop => {
        fieldOptions.forEach(opt => drop.addOption(opt.value, opt.label));
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
    modal.contentEl.createEl('h2', { text: '添加新领域' });

    let newFieldName = '';
    let copyFromIndex = -1; // -1 表示使用默认样式

    new Setting(modal.contentEl)
      .setName('名称')
      .setDesc('输入新领域的名称')
      .addText(text => {
        text.setPlaceholder('例如：深度学习');
        text.inputEl.style.width = '200px';
        text.onChange(v => {
          newFieldName = v.trim();
        });
        setTimeout(() => text.inputEl.focus(), 100);
      });

    new Setting(modal.contentEl)
      .setName('样式来源')
      .setDesc('选择默认样式或复制已有领域')
      .addDropdown(dropdown => {
        dropdown.addOption('-1', '默认样式');
        this.plugin.settings.fields.forEach((field, index) => {
          dropdown.addOption(index.toString(), `复制: ${field.name}`);
        });
        dropdown.onChange(v => {
          copyFromIndex = parseInt(v);
        });
      });

    new Setting(modal.contentEl)
      .addButton(btn => {
        btn.setButtonText('取消');
        btn.onClick(() => modal.close());
      })
      .addButton(btn => {
        btn.setButtonText('创建');
        btn.setCta();
        btn.onClick(() => {
          const fieldName = newFieldName || '新领域';

          // 检查名称是否已存在（包括别名）
          const allNames: string[] = [];
          this.plugin.settings.fields.forEach(f => {
            allNames.push(f.name);
            if (f.aliases) allNames.push(...f.aliases);
          });

          if (allNames.includes(fieldName)) {
            new Notice('领域名称已存在，请使用其他名称');
            return;
          }

          let newField: FieldStyle;

          if (copyFromIndex >= 0 && this.plugin.settings.fields[copyFromIndex]) {
            // 复制已有领域样式
            const sourceField = this.plugin.settings.fields[copyFromIndex]!;
            newField = {
              name: fieldName,
              aliases: [],
              backgroundColor: sourceField.backgroundColor,
              backgroundPattern: sourceField.backgroundPattern,
              patternColor: sourceField.patternColor,
              textColor: sourceField.textColor,
              titleTextColor: sourceField.titleTextColor,
              metaTextColor: sourceField.metaTextColor,
              borderColor: sourceField.borderColor,
              roughness: sourceField.roughness,
              opacity: sourceField.opacity,
              roundness: sourceField.roundness,
              titleFontSize: sourceField.titleFontSize,
              titleFontFamily: sourceField.titleFontFamily,
              metaFontSize: sourceField.metaFontSize,
              metaFontFamily: sourceField.metaFontFamily,
              cardWidth: sourceField.cardWidth,
              cardHeight: sourceField.cardHeight,
              titleAlignment: sourceField.titleAlignment,
            };
            new Notice(`已复制「${sourceField.name}」的样式创建新领域`);
          } else {
            // 使用默认样式
            newField = {
              name: fieldName,
              aliases: [],
              backgroundColor: '#ffffff',
              backgroundPattern: 'solid',
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
              titleAlignment: 'left',
              titleTextColor: undefined,
              metaTextColor: undefined,
            };
          }

          this.plugin.settings.fields.push(newField);
          this.plugin.saveSettings();
          this.field = fieldName;
          this.showDetailPage();
          modal.close();
        });
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
      // 只有设置启用时才添加卡片
      if (this.plugin.settings.addCardToExcalidraw) {
        await insertPaperToExcalidraw(
          this.app,
          this.plugin.settings,
          this.selected,
          file
        );
      }
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
