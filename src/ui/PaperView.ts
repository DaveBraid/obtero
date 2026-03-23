import { App, ItemView, Menu, Modal, Notice, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import MyPlugin from '../main';
import { getPapersByCategory, movePaper, resolveExcalidrawPath } from '../utils/fileUtils';
import { insertPaperToExcalidraw } from '../utils/excalidrawUtils';
import { getFieldStyle } from '../utils/excalidrawUtils';
import { PaperInfo, IdeaItem } from '../types';
import { AddPaperModal } from './AddPaperModal';
import { SetupModal } from './SetupModal';

export const PAPER_VIEW_TYPE = 'paper-plugin-view';

// 删除确认对话框
class DeleteConfirmModal extends Modal {
  onConfirm: () => void;

  constructor(app: any, paperTitle: string, onConfirm: () => void) {
    super(app);
    this.onConfirm = onConfirm;

    this.contentEl.createEl('h2', { text: '确认删除' });
    this.contentEl.createEl('p', {
      text: `确定要删除论文笔记「${paperTitle}」吗？此操作不可撤销。`
    });

    const buttonContainer = this.contentEl.createDiv({
      cls: 'modal-button-container',
    });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => this.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '确认删除',
      cls: 'mod-warning',
    });
    confirmBtn.addEventListener('click', () => {
      this.onConfirm();
      this.close();
    });
  }
}

// 领域论文列表 Modal
class FieldPapersModal extends Modal {
  private fieldName: string;
  private papers: TFile[];
  private plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin, fieldName: string, papers: TFile[]) {
    super(app);
    this.plugin = plugin;
    this.fieldName = fieldName;
    this.papers = papers;
  }

  onOpen() {
    const { contentEl } = this;
    const fieldStyle = this.plugin.settings.fields.find(f => f.name === this.fieldName);
    
    // 主容器
    const container = contentEl.createDiv({ cls: 'pm-field-papers-container' });
    
    // 简洁标题
    const header = container.createDiv({ cls: 'pm-field-papers-header-simple' });
    header.createEl('h2', { text: this.fieldName });
    header.createSpan({ cls: 'pm-field-papers-count', text: `${this.papers.length} 篇` });
    
    // 显示关联子标签
    if (fieldStyle?.aliases && fieldStyle.aliases.length > 0) {
      const aliasesRow = container.createDiv({ cls: 'pm-field-papers-aliases' });
      aliasesRow.createSpan({ text: '子领域：', cls: 'pm-aliases-label' });
      for (const alias of fieldStyle.aliases) {
        const aliasTag = aliasesRow.createSpan({ cls: 'pm-alias-tag' });
        aliasTag.textContent = alias;
        const aliasCount = this.papers.filter(f => {
          const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
          return (fm?.field || this.plugin.settings.defaultField) === alias;
        }).length;
        if (aliasCount > 0) {
          aliasTag.createSpan({ cls: 'pm-alias-count', text: ` ${aliasCount}` });
        }
      }
    }
    
    // 论文列表
    const list = container.createDiv({ cls: 'pm-field-papers-list' });
    
    for (const file of this.papers) {
      this.renderPaperItem(list, file);
    }
  }
  
  private renderPaperItem(list: HTMLElement, file: TFile): void {
    const item = list.createDiv({ cls: 'pm-field-paper-item' });
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    
    // 获取该论文的领域
    const paperField = fm?.field || this.plugin.settings.defaultField;
    const fieldStyle = getFieldStyle(this.plugin.settings, paperField);
    
    // 左边框颜色
    if (fieldStyle) {
      item.style.borderLeft = `3px solid ${fieldStyle.backgroundColor}`;
    }
    
    // 内容容器
    const content = item.createDiv({ cls: 'pm-field-paper-content' });
    
    // 标题行
    const titleRow = content.createDiv({ cls: 'pm-field-paper-title-row' });
    const displayName = file.basename.replace(/^【.+?】-/, '');
    titleRow.createSpan({ cls: 'pm-field-paper-title', text: displayName });
    
    // 子领域标签（如果与主领域不同，显示具体子领域）
    const isAlias = fieldStyle?.name === this.fieldName && paperField !== this.fieldName;
    if (isAlias || paperField !== this.fieldName) {
      const subFieldTag = titleRow.createSpan({ cls: 'pm-subfield-tag' });
      subFieldTag.textContent = paperField;
      if (fieldStyle) {
        subFieldTag.style.backgroundColor = fieldStyle.backgroundColor;
        subFieldTag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    }
    
    // 元信息行
    const metaRow = content.createDiv({ cls: 'pm-field-paper-meta' });
    const metaParts: string[] = [];
    if (fm?.date) metaParts.push(fm.date);
    if (fm?.journal) metaParts.push(fm.journal);
    if (fm?.authors) {
      const authors = Array.isArray(fm.authors) ? fm.authors[0] : fm.authors.split(',')[0];
      metaParts.push(authors);
    }
    metaRow.textContent = metaParts.join(' · ');
    
    // 点击打开
    item.addEventListener('click', async () => {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
      this.close();
    });
  }
  
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class PaperView extends ItemView {
  plugin: MyPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return PAPER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '论文管理';
  }

  getIcon(): string {
    return 'book-open';
  }

  async onOpen(): Promise<void> {
    // 添加苹果风格进度条动画样式
    this.addProgressStyles();
    await this.render();
  }

  private addProgressStyles(): void {
    if (document.getElementById('pm-progress-styles')) return;

    const style = document.createElement('style');
    style.id = 'pm-progress-styles';
    style.textContent = `
      @keyframes pm-shimmer {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(50%); }
      }
    `;
    document.head.appendChild(style);
  }

  async render(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass('pm-view');

    if (!this.plugin.settings.workspaceFolder) {
      this.renderSetupPrompt(root);
      return;
    }

    // 创建主容器
    const mainContainer = root.createDiv({ cls: 'pm-main-container' });

    // 左侧区域（论文列表）
    const leftContainer = mainContainer.createDiv({ cls: 'pm-left-container' });
    this.renderPaperList(leftContainer);

    // 右侧看板
    const rightContainer = mainContainer.createDiv({ cls: 'pm-right-container' });
    this.renderDashboard(rightContainer);
  }

  private renderSetupPrompt(root: HTMLElement): void {
    root.createEl('div', {
      text: '尚未设置工作文件夹',
      cls: 'pm-empty'
    });
    root
      .createEl('button', {
        text: '立即设置',
        cls: 'mod-cta pm-btn-full'
      })
      .addEventListener('click', () => {
        new SetupModal(this.app, this.plugin, () => this.render()).open();
      });
  }

  private renderPaperList(root: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    // 计算最长领域名称的实际像素宽度，用于统一标签宽度
    let maxFieldWidth = 0;
    const measureSpan = document.createElement('span');
    measureSpan.style.fontSize = '11px';
    measureSpan.style.fontWeight = '600';
    measureSpan.style.letterSpacing = '0.05em';
    measureSpan.style.textTransform = 'uppercase';
    measureSpan.style.visibility = 'hidden';
    measureSpan.style.position = 'absolute';
    measureSpan.style.whiteSpace = 'nowrap';
    document.body.appendChild(measureSpan);
    
    for (const field of this.plugin.settings.fields) {
      measureSpan.textContent = field.name.toUpperCase();
      const width = measureSpan.offsetWidth;
      if (width > maxFieldWidth) {
        maxFieldWidth = width;
      }
    }
    document.body.removeChild(measureSpan);
    
    // 加上 padding (左右各 8px)
    maxFieldWidth += 16;
    // 最小宽度 60px
    maxFieldWidth = Math.max(maxFieldWidth, 60);

    for (const [label, files] of Object.entries(byCategory)) {
      const section = root.createDiv({ cls: 'pm-section' });

      // Section header
      const header = section.createDiv({ cls: 'pm-section-header' });
      header.createSpan({ cls: 'pm-section-title', text: label });
      header.createSpan({ cls: 'pm-section-count', text: String(files.length) });

      if (files.length === 0) {
        section.createDiv({ cls: 'pm-empty', text: '暂无论文' });
        continue;
      }

      // Paper list
      const list = section.createDiv({ cls: 'pm-paper-list' });
      for (const file of files) {
        this.renderPaperItem(list, file as TFile, label, maxFieldWidth);
      }
    }
  }

  private renderPaperItem(list: HTMLElement, file: TFile, category: string, maxFieldWidth: number): void {
    const item = list.createDiv({ cls: 'pm-paper-item' });

    // 获取论文的领域信息
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const fieldName = fm?.field || this.plugin.settings.defaultField;
    // 使用辅助函数查找领域样式（支持关联领域）
    const fieldStyle = getFieldStyle(this.plugin.settings, fieldName);
    const defaultField = getFieldStyle(this.plugin.settings, this.plugin.settings.defaultField);
    const activeField = fieldStyle || defaultField;

    // 设置边框色（使用卡片的背景色）
    if (activeField) {
      item.style.borderLeft = `3px solid ${activeField.backgroundColor}`;
    }

    // Display title (remove prefix like "【粗读】-")
    const displayName = file.basename.replace(/^【.+?】-/, '');

    // 创建标题和标签的容器
    const contentContainer = item.createDiv({ cls: 'pm-paper-content' });
    contentContainer.style.display = 'flex';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.justifyContent = 'space-between';
    contentContainer.style.gap = '8px';
    contentContainer.style.flex = '1';
    contentContainer.style.minWidth = '0';

    const titleContainer = contentContainer.createDiv({ cls: 'pm-paper-title-container' });
    titleContainer.style.flex = '1';
    titleContainer.style.minWidth = '0';
    titleContainer.createSpan({ cls: 'pm-paper-title', text: displayName });

    // 领域标签 - 背景色使用卡片背景色，宽度统一
    const fieldTag = contentContainer.createSpan({ cls: 'pm-field-tag' });
    fieldTag.textContent = fieldName;
    fieldTag.style.flexShrink = '0';
    fieldTag.style.minWidth = `${maxFieldWidth}px`;
    fieldTag.style.textAlign = 'center';
    if (activeField) {
      fieldTag.style.backgroundColor = activeField.backgroundColor;
      fieldTag.style.color = this.getContrastColor(activeField.backgroundColor);
    }

    // Click to open
    item.addEventListener('click', async (e) => {
      if ((e.target as HTMLElement).closest('.pm-item-menu-btn')) return;
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    });

    // Menu button
    const menuBtn = item.createEl('button', {
      cls: 'pm-item-menu-btn',
      text: '…',
      attr: { title: '更多操作' },
    });
    menuBtn.addEventListener('click', (e) => {
      this.showContextMenu(e, file, displayName, category);
    });
  }

  // 根据背景色获取对比色（黑色或白色）
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  private showContextMenu(e: MouseEvent, file: TFile, displayName: string, currentCategory: string): void {
    e.stopPropagation();
    const menu = new Menu();

    // Move options
    const allCategories = ['待阅读', ...this.plugin.settings.labels];
    for (const targetLabel of allCategories) {
      if (targetLabel === currentCategory) continue;

      menu.addItem(mi =>
        mi.setTitle(`移至「${targetLabel}」`).onClick(async () => {
          try {
            await movePaper(
              this.app,
              this.plugin.settings,
              file,
              targetLabel
            );
            new Notice(`已移至「${targetLabel}」`);
            await this.render();
          } catch (err) {
            new Notice('移动失败：' + (err as Error).message);
          }
        })
      );
    }

    menu.addSeparator();

    // 修改领域
    menu.addItem(mi =>
      mi.setTitle('🏷️ 修改领域').onClick(() => {
        this.showFieldChangeModal(file, displayName);
      })
    );

    menu.addSeparator();

    // Add to Excalidraw
    menu.addItem(mi =>
      mi.setTitle('添加到 Excalidraw').onClick(async () => {
        await this.addToExcalidraw(file, displayName);
      })
    );

    menu.addSeparator();

    // Delete
    menu.addItem(mi =>
      mi.setTitle('🗑️ 删除').onClick(() => {
        new DeleteConfirmModal(this.app, displayName, async () => {
          try {
            await this.app.vault.delete(file);
            new Notice(`已删除「${displayName}」`);
            await this.render();
          } catch (err) {
            new Notice('删除失败：' + (err as Error).message);
          }
        }).open();
      })
    );

    menu.showAtMouseEvent(e);
  }

  private async addToExcalidraw(file: TFile, displayName: string): Promise<void> {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const paperInfo: PaperInfo = {
      title: fm?.title ?? displayName,
      journal: fm?.journal ?? '',
      date: fm?.date ?? '',
      authors: Array.isArray(fm?.authors) ? fm.authors : [],
      institutions: Array.isArray(fm?.institutions) ? fm.institutions : [],
      arxivId: fm?.arxivId,
      doi: fm?.doi,
      field: fm?.field,  // 从 frontmatter 读取领域
    };

    try {
      // 只有设置启用时才添加卡片
      if (this.plugin.settings.addCardToExcalidraw) {
        await insertPaperToExcalidraw(
          this.app,
          this.plugin.settings,
          paperInfo,
          file
        );
      }
      new Notice(`已添加到 Excalidraw`);

      // Open Excalidraw file (reuse existing tab if possible)
      const excalidrawPath = resolveExcalidrawPath(this.plugin.settings);
      const excalidrawFile = this.app.vault.getAbstractFileByPath(excalidrawPath);

      if (excalidrawFile instanceof TFile) {
        let existingLeaf = null;
        this.app.workspace.iterateAllLeaves((leaf: any) => {
          const view = leaf.view as any;
          if (view.file?.path === excalidrawFile.path) {
            existingLeaf = leaf;
            return true;
          }
          return false;
        });

        if (existingLeaf) {
          this.app.workspace.revealLeaf(existingLeaf);
        } else {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(excalidrawFile);
        }
      }
    } catch (err) {
      new Notice('添加失败：' + (err as Error).message);
    }
  }

  // ==================== 右侧看板（Apple 风格简化版）====================

  private renderDashboard(container: HTMLElement): void {
    // 快速操作按钮（添加论文 + 刷新）
    this.renderQuickActions(container);

    // 统计
    this.renderFieldStats(container);

    // 阅读进度
    this.renderReadingProgress(container);

    // 灵感管理
    this.renderIdeaActions(container);

    // 英灵殿
    this.renderValhalla(container);

    // 日历
    this.renderCalendar(container);
  }

  private renderQuickActions(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const buttonRow = section.createDiv({ cls: 'pm-action-buttons-row' });

    // 添加论文按钮
    const addBtn = buttonRow.createEl('button', {
      cls: 'mod-cta pm-action-button-primary',
      text: '➕ 添加论文'
    });
    addBtn.addEventListener('click', () =>
      new AddPaperModal(this.app, this.plugin, () => this.render()).open()
    );

    // 刷新按钮
    const refreshBtn = buttonRow.createEl('button', {
      cls: 'pm-action-button-secondary',
      text: '刷新'
    });
    refreshBtn.addEventListener('click', () => this.render());
  }

  private renderFieldStats(container: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    // 统计各领域论文数量（支持别名匹配）
    const fieldStats: Array<{ name: string; count: number; color: string }> = [];
    let totalPapers = 0;

    for (const field of this.plugin.settings.fields) {
      let count = 0;
      for (const [category, files] of Object.entries(byCategory)) {
        for (const file of files) {
          const fm = this.app.metadataCache.getFileCache(file as TFile)?.frontmatter;
          const paperField = fm?.field || this.plugin.settings.defaultField;
          // 检查是否匹配主领域名称或别名
          if (paperField === field.name || (field.aliases && field.aliases.includes(paperField))) {
            count++;
          }
        }
      }
      if (count > 0) {
        fieldStats.push({
          name: field.name,
          count: count,
          color: field.backgroundColor
        });
        totalPapers += count;
      }
    }

    if (totalPapers === 0) {
      section.createEl('h4', { text: '统计' });
      section.createDiv({ cls: 'pm-empty', text: '暂无论文' });
      return;
    }

    // 创建环形图 - 使用原生 DOM API
    const chartSize = 160;
    const strokeWidth = 20;
    const radius = (chartSize - strokeWidth) / 2;
    const center = chartSize / 2;
    const circumference = 2 * Math.PI * radius;

    const chartContainer = section.createDiv({ cls: 'pm-chart-container' });

    // 创建 SVG 元素
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', String(chartSize));
    svg.setAttribute('height', String(chartSize));
    svg.classList.add('pm-donut-chart');
    chartContainer.appendChild(svg);

    let currentOffset = 0;

    // 绘制环形图片段
    for (const field of fieldStats) {
      const percentage = field.count / totalPapers;
      const dashArray = percentage * circumference;
      const dashOffset = -currentOffset;

      const circle = document.createElementNS(svgNs, 'circle');
      circle.setAttribute('cx', String(center));
      circle.setAttribute('cy', String(center));
      circle.setAttribute('r', String(radius));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', field.color);
      circle.setAttribute('stroke-width', String(strokeWidth));
      circle.setAttribute('stroke-dasharray', `${dashArray} ${circumference}`);
      circle.setAttribute('stroke-dashoffset', String(dashOffset));
      circle.classList.add('pm-donut-segment');

      // 添加 tooltip
      const title = document.createElementNS(svgNs, 'title');
      title.textContent = `${field.name}: ${field.count}篇 (${Math.round(percentage * 100)}%)`;
      circle.appendChild(title);

      svg.appendChild(circle);
      currentOffset += dashArray;
    }

    // 中心总数文字
    const textGroup = document.createElementNS(svgNs, 'g');
    textGroup.classList.add('pm-donut-center');
    svg.appendChild(textGroup);

    const totalCount = document.createElementNS(svgNs, 'text');
    totalCount.setAttribute('x', String(center));
    totalCount.setAttribute('y', String(center + 8));
    totalCount.setAttribute('text-anchor', 'middle');
    totalCount.classList.add('pm-donut-total');
    totalCount.textContent = String(totalPapers);
    textGroup.appendChild(totalCount);

    const totalLabel = document.createElementNS(svgNs, 'text');
    totalLabel.setAttribute('x', String(center));
    totalLabel.setAttribute('y', String(center + 28));
    totalLabel.setAttribute('text-anchor', 'middle');
    totalLabel.classList.add('pm-donut-label');
    totalLabel.textContent = '总计';
    textGroup.appendChild(totalLabel);

    // 图例
    const legend = section.createDiv({ cls: 'pm-chart-legend' });
    for (const field of fieldStats) {
      const percentage = Math.round((field.count / totalPapers) * 100);
      const item = legend.createDiv({ cls: 'pm-legend-item' });
      item.style.cursor = 'pointer';

      // 颜色圆点
      const dotSvg = document.createElementNS(svgNs, 'svg');
      dotSvg.setAttribute('width', '12');
      dotSvg.setAttribute('height', '12');
      dotSvg.classList.add('pm-legend-dot');

      const dot = document.createElementNS(svgNs, 'circle');
      dot.setAttribute('cx', '6');
      dot.setAttribute('cy', '6');
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', field.color);
      dotSvg.appendChild(dot);

      item.appendChild(dotSvg);
      item.createSpan({ cls: 'pm-legend-name', text: field.name });
      item.createSpan({ cls: 'pm-legend-value', text: `${field.count} (${percentage}%)` });
      
      // 点击显示该领域论文列表
      item.addEventListener('click', () => {
        this.showFieldPapers(field.name);
      });
    }
  }

  private renderRecentPapers(container: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    // 收集所有论文并按时间排序
    const allPapers: Array<{ file: TFile; mtime: number }> = [];
    for (const [category, files] of Object.entries(byCategory)) {
      for (const file of files) {
        allPapers.push({
          file: file as TFile,
          mtime: (file as TFile).stat.mtime
        });
      }
    }

    // 按修改时间降序排序，取前5篇
    allPapers.sort((a, b) => b.mtime - a.mtime);
    const recentPapers = allPapers.slice(0, 5);

    if (recentPapers.length === 0) {
      return;
    }

    const section = container.createDiv({ cls: 'pm-dashboard-section' });
    section.createEl('h4', { text: '最近添加' });

    const list = section.createDiv({ cls: 'pm-recent-list' });
    for (const { file, mtime } of recentPapers) {
      const displayName = file.basename.replace(/^【.+?】-/, '');

      const item = list.createDiv({ cls: 'pm-recent-item' });
      item.createSpan({ cls: 'pm-recent-title', text: displayName });

      const timeText = this.formatTimeAgo(mtime);
      item.createSpan({ cls: 'pm-recent-time', text: timeText });

      // 点击打开
      item.addEventListener('click', async () => {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
      });
    }
  }

  private renderReadingProgress(container: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    const unreadCount = (byCategory['待阅读'] || []).length;
    const readCategories = this.plugin.settings.labels;
    const readCount = readCategories.reduce((sum, label) => sum + (byCategory[label]?.length || 0), 0);
    const total = unreadCount + readCount;

    if (total === 0) {
      return;
    }

    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const readPercent = Math.round((readCount / total) * 100);

    // 标题和百分比（苹果风格）
    const header = section.createDiv({ cls: 'pm-progress-header' });
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';

    const titleText = header.createDiv({ cls: 'pm-progress-title' });
    titleText.textContent = '阅读进度';
    titleText.style.fontSize = '14px';
    titleText.style.fontWeight = '600';
    titleText.style.color = 'var(--text-normal)';

    const percentText = header.createDiv({ cls: 'pm-progress-percent' });
    percentText.textContent = `${readPercent}%`;
    percentText.style.fontSize = '20px';
    percentText.style.fontWeight = '700';
    percentText.style.color = 'var(--interactive-accent)';

    // 数量说明
    const detailText = section.createDiv({ cls: 'pm-progress-detail' });
    detailText.textContent = `已读 ${readCount} 篇，共 ${total} 篇`;
    detailText.style.fontSize = '13px';
    detailText.style.color = 'var(--text-muted)';
    detailText.style.marginBottom = '10px';

    // 苹果风格进度条
    const progressBar = section.createDiv({ cls: 'pm-progress-bar' });
    progressBar.style.width = '100%';
    progressBar.style.height = '8px';
    progressBar.style.backgroundColor = 'var(--background-modifier-border)';
    progressBar.style.borderRadius = '4px';
    progressBar.style.overflow = 'hidden';
    progressBar.style.position = 'relative';

    const progressFill = progressBar.createDiv({ cls: 'pm-progress-fill' });
    progressFill.style.width = `${readPercent}%`;
    progressFill.style.height = '100%';
    progressFill.style.background = 'var(--interactive-accent)';
    progressFill.style.borderRadius = '4px';
    progressFill.style.transition = 'width 0.3s ease';
    progressFill.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    progressFill.style.position = 'relative';

    // 添加光泽效果（苹果风格）- shimmer 覆盖整个进度条
    const shimmer = progressBar.createDiv();
    shimmer.style.position = 'absolute';
    shimmer.style.top = '0';
    shimmer.style.left = '0';
    shimmer.style.width = '100%';
    shimmer.style.height = '100%';
    shimmer.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)';
    shimmer.style.animation = 'pm-shimmer 8s infinite';
    shimmer.style.pointerEvents = 'none';
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}月前`;
    return `${Math.floor(days / 365)}年前`;
  }

  // 修改领域模态框
  private showFieldChangeModal(file: TFile, displayName: string): void {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const currentField = fm?.field || this.plugin.settings.defaultField;

    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: '修改论文领域' });

    const desc = modal.contentEl.createDiv();
    desc.textContent = `正在修改论文「${displayName}」的领域`;
    desc.style.marginBottom = '16px';
    desc.style.color = 'var(--text-muted)';

    // 构建领域选项：主领域 + 别名
    const fieldOptions: { value: string; label: string; isAlias: boolean }[] = [];
    for (const field of this.plugin.settings.fields) {
      // 添加主领域
      fieldOptions.push({ value: field.name, label: field.name, isAlias: false });
      // 添加别名
      if (field.aliases) {
        for (const alias of field.aliases) {
          fieldOptions.push({ value: alias, label: `${alias} (${field.name})`, isAlias: true });
        }
      }
    }

    new Setting(modal.contentEl)
      .setName('研究领域')
      .setDesc('选择该论文所属领域')
      .addDropdown(drop => {
        fieldOptions.forEach(opt => drop.addOption(opt.value, opt.label));
        drop.setValue(currentField).onChange(v => {
          // 临时存储选择的领域
        });
      });

    const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '确认修改',
      cls: 'mod-cta'
    });

    confirmBtn.addEventListener('click', async () => {
      const dropdown = modal.contentEl.querySelector('select') as HTMLSelectElement;
      const newField = dropdown.value;

      if (newField === currentField) {
        modal.close();
        return;
      }

      // 先关闭模态框
      modal.close();

      try {
        // 更新文件的 frontmatter
        await this.app.fileManager.processFrontMatter(file, fm => {
          fm.field = newField;
        });

        // 等待一小段时间确保 frontmatter 更新完成
        await new Promise(resolve => setTimeout(resolve, 100));

        // 刷新界面
        await this.render();

        new Notice(`已将「${displayName}」移至领域「${newField}」`);
      } catch (err) {
        new Notice('修改失败：' + (err as Error).message);
      }
    });

    modal.open();
  }

  // 显示领域论文列表
  private showFieldPapers(fieldName: string): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);
    const fieldStyle = this.plugin.settings.fields.find(f => f.name === fieldName);
    
    // 收集该领域的所有论文（包括别名匹配）
    const papers: TFile[] = [];
    for (const [category, files] of Object.entries(byCategory)) {
      for (const file of files) {
        const fm = this.app.metadataCache.getFileCache(file as TFile)?.frontmatter;
        const paperField = fm?.field || this.plugin.settings.defaultField;
        // 匹配主领域名称或别名
        if (paperField === fieldName || (fieldStyle?.aliases && fieldStyle.aliases.includes(paperField))) {
          papers.push(file as TFile);
        }
      }
    }
    
    // 按修改时间排序
    papers.sort((a, b) => b.stat.mtime - a.stat.mtime);
    
    new FieldPapersModal(this.app, this.plugin, fieldName, papers).open();
  }
  private renderValhalla(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });
    const valhallaCount = (this.plugin.settings.ideas || []).filter(idea => idea.inValhalla).length;
    const card = section.createDiv({ cls: 'valhalla-card' });
    card.addEventListener('click', () => this.showValhallaModal());
    const icon = card.createSpan({ cls: 'valhalla-icon', text: '⚔️' });
    const header = card.createDiv({ cls: 'valhalla-header' });
    header.createEl('h3', { cls: 'valhalla-title', text: '英灵殿' });
    header.createSpan({ cls: 'valhalla-count', text: `${valhallaCount} 位英灵` });
  }

  private showValhallaModal(): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;
    contentEl.createEl('h2', { text: '英灵殿' });
    const valhallaIdeas = (this.plugin.settings.ideas || []).filter(idea => idea.inValhalla);
    if (valhallaIdeas.length === 0) {
      contentEl.createDiv({ cls: 'pm-empty', text: '英灵殿空空如也' });
    } else {
      const list = contentEl.createDiv({ cls: 'pm-valhalla-list' });
      for (const idea of valhallaIdeas) {
        const item = list.createDiv({ cls: 'pm-valhalla-item' });
        const content = item.createDiv({ cls: 'pm-valhalla-content' });
        const textContent = content.createDiv({ cls: 'pm-idea-text' });
        textContent.createEl('div', { cls: 'pm-idea-title', text: idea.title });
        textContent.createEl('div', { cls: 'pm-idea-body', text: idea.content });
        const removeBtn = item.createEl('button', { cls: 'pm-valhalla-remove-btn', text: '↩' });
        removeBtn.addEventListener('click', async () => {
          await this.plugin.removeIdeaFromValhalla(idea.id);
          new Notice('已从英灵殿移除');
          modal.close();
          this.showValhallaModal();
          this.render();
        });
      }
    }
    modal.open();
  }

  private renderIdeaActions(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });
    const buttonRow = section.createDiv({ cls: 'pm-action-buttons-row' });

    const addIdeaBtn = buttonRow.createEl('button', {
      cls: 'mod-cta pm-action-button-idea',
      text: '💡 记录灵感'
    });
    addIdeaBtn.addEventListener('click', () => this.showAddIdeaModal());

    const ideasLibraryBtn = buttonRow.createEl('button', {
      cls: 'pm-action-button-ideas',
      text: '📚 灵感库'
    });
    ideasLibraryBtn.addEventListener('click', () => this.showIdeasLibraryModal());
  }

  private showAddIdeaModal(): void {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: '记录灵感' });

    let title = '';
    let content = '';
    let tagType: 'field' | 'custom' | '' = '';
    let selectedField = '';
    let customColor = '#e03131';

    new Setting(modal.contentEl)
      .setName('标题')
      .setDesc('简短描述你的灵感')
      .addText(text => {
        text.setPlaceholder('输入灵感标题...');
        text.inputEl.addEventListener('change', (e) => {
          title = (e.target as HTMLInputElement).value.trim();
        });
        setTimeout(() => text.inputEl.focus(), 100);
      });

    new Setting(modal.contentEl)
      .setName('内容')
      .setDesc('详细记录你的想法')
      .addTextArea(text => {
        text.setPlaceholder('输入灵感内容...');
        text.inputEl.rows = 4;
        text.inputEl.addEventListener('change', (e) => {
          content = (e.target as HTMLInputElement).value.trim();
        });
      });

    const tagTypeSetting = new Setting(modal.contentEl)
      .setName('标签类型')
      .setDesc('选择标签类型或无标签')
      .addDropdown(drop => {
        drop.addOption('', '无标签');
        drop.addOption('field', '关联论文领域');
        drop.addOption('custom', '自定义标签');
        drop.onChange(v => {
          tagType = v as 'field' | 'custom' | '';
          selectedField = '';
          this.updateIdeaTagVisibility(modal.contentEl, tagType);
        });
      });

    const fieldSetting = new Setting(modal.contentEl);
    fieldSetting.settingEl.classList.add('pm-idea-field-setting');
    fieldSetting.settingEl.style.display = 'none';
    fieldSetting.setName('研究领域').setDesc('选择关联的论文领域');
    fieldSetting.addDropdown(drop => {
      drop.addOption('', '请选择领域');
      this.plugin.settings.fields.forEach(f => {
        drop.addOption(f.name, f.name);
        if (f.aliases) {
          f.aliases.forEach(alias => {
            drop.addOption(alias, `${alias} (${f.name})`);
          });
        }
      });
      drop.onChange(v => {
        selectedField = v;
      });
    });

    const colorSetting = new Setting(modal.contentEl);
    colorSetting.settingEl.classList.add('pm-idea-color-setting');
    colorSetting.settingEl.style.display = 'none';
    colorSetting.setName('标签颜色').setDesc('选择自定义标签的颜色');
    colorSetting.addColorPicker(col => {
      col.onChange(v => {
        customColor = v;
      });
    });

    const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '保存',
      cls: 'mod-cta'
    });
    confirmBtn.addEventListener('click', async () => {
      if (!title || !content) {
        new Notice('请填写标题和内容');
        return;
      }

      await this.plugin.addIdea(title, content, {
        field: tagType === 'field' ? selectedField : undefined,
        color: tagType === 'custom' ? customColor : undefined,
        isCustomTag: tagType === 'custom'
      });

      new Notice('灵感已保存');
      modal.close();
      await this.render();
    });

    modal.open();
  }

  private updateIdeaTagVisibility(contentEl: HTMLElement, tagType: string): void {
    const settings = contentEl.querySelectorAll('.setting-item');
    settings.forEach((setting) => {
      const htmlSetting = setting as HTMLElement;
      if (htmlSetting.classList.contains('pm-idea-field-setting')) {
        htmlSetting.style.display = tagType === 'field' ? 'flex' : 'none';
      } else if (htmlSetting.classList.contains('pm-idea-color-setting')) {
        htmlSetting.style.display = tagType === 'custom' ? 'flex' : 'none';
      }
    });
  }

  private showIdeasLibraryModal(): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;

    contentEl.createEl('h2', { text: '灵感库' });

    const ideas = (this.plugin.settings.ideas || []).filter(idea => !idea.inValhalla);

    if (ideas.length === 0) {
      contentEl.createDiv({
        cls: 'pm-empty',
        text: '暂无灵感，点击"记录灵感"开始收集吧！'
      });
    } else {
      const list = contentEl.createDiv({ cls: 'pm-ideas-list' });
      for (const idea of ideas) {
        this.renderIdeaListItem(list, idea, modal);
      }
    }

    modal.open();
  }

  private renderIdeaListItem(list: HTMLElement, idea: IdeaItem, parentModal: Modal): void {
    const item = list.createDiv({ cls: 'pm-idea-item' });

    const content = item.createDiv({ cls: 'pm-idea-content' });

    // 标签行（可以换行）
    const tagRow = content.createDiv({ cls: 'pm-idea-tag-row' });

    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = tagRow.createSpan({ cls: 'pm-idea-tag' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = tagRow.createSpan({ cls: 'pm-idea-tag' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 标题
    const titleSpan = content.createSpan({ cls: 'pm-idea-title', text: idea.title });

    // 内容和时间
    const bodyText = content.createDiv({ cls: 'pm-idea-body', text: idea.content });
    const date = new Date(idea.createdAt);
    content.createSpan({ cls: 'pm-idea-time', text: this.formatIdeaTime(date) });

    // Click to show action modal
    item.addEventListener('click', () => {
      this.showIdeaActionModal(idea, parentModal);
    });
  }

  private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: '确认删除' });
    modal.contentEl.createEl('p', {
      text: `确定要删除灵感「${idea.title}」吗？此操作不可撤销。`
    });

    const buttonContainer = modal.contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '确认删除',
      cls: 'mod-warning'
    });
    confirmBtn.addEventListener('click', async () => {
      await this.plugin.removeIdea(idea.id);
      new Notice('已删除灵感');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      await this.render();
    });

    modal.open();
  }
  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;

    const container = contentEl.createDiv({ cls: 'pm-idea-modal-container' });

    // 标签
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = container.createSpan({ cls: 'pm-idea-tag-large' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = container.createSpan({ cls: 'pm-idea-tag-large' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 标题
    container.createEl('h2', { cls: 'pm-idea-modal-title', text: idea.title });

    // 内容
    container.createEl('p', { cls: 'pm-idea-modal-content', text: idea.content });

    // 时间
    const date = new Date(idea.createdAt);
    container.createEl('p', { cls: 'pm-idea-modal-time', text: this.formatIdeaTime(date) });

    // 按钮容器
    const buttonContainer = contentEl.createDiv({ cls: 'pm-modal-actions' });

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const completeBtn = buttonContainer.createEl('button', {
      text: '✨ 完成并归入英灵殿',
      cls: 'mod-cta'
    });
    completeBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('已添加到英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    const deleteBtn = buttonContainer.createEl('button', {
      text: '删除',
      cls: 'pm-mod-destructive'
    });
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
  }


  private formatIdeaTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? '刚刚' : `${diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    }
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  }

  private renderCalendar(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const header = section.createDiv({ cls: 'pm-calendar-header' });

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    // 年月显示 - 可点击
    const yearMonthDisplay = header.createDiv({ cls: 'pm-calendar-yearmonth-clickable' });
    yearMonthDisplay.createSpan({
      cls: 'pm-calendar-current',
      text: `${currentYear}年${currentMonth}月`
    });
    yearMonthDisplay.addEventListener('click', () => this.showMonthPickerModal());

    const calendarGrid = section.createDiv({ cls: 'pm-calendar-grid' });

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (const day of weekdays) {
      const dayHeader = calendarGrid.createDiv({ cls: 'pm-calendar-day-header' });
      dayHeader.textContent = day;
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarGrid.createDiv({ cls: 'pm-calendar-day-empty' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = calendarGrid.createDiv({ cls: 'pm-calendar-day' });

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIdeas = (this.plugin.settings.ideas || []).filter(idea => {
        const ideaDate = new Date(idea.createdAt);
        const ideaDateStr = `${ideaDate.getFullYear()}-${String(ideaDate.getMonth() + 1).padStart(2, '0')}-${String(ideaDate.getDate()).padStart(2, '0')}`;
        return ideaDateStr === dateStr;
      });

      const dayNumber = dayCell.createDiv({ cls: 'pm-calendar-day-number' });
      dayNumber.textContent = String(day);

      if (dayIdeas.length > 0) {
        dayCell.classList.add('pm-calendar-day-has-ideas');
        const dot = dayCell.createDiv({ cls: 'pm-calendar-day-dot' });

        dayCell.addEventListener('click', () => {
          this.showDayIdeasModal(dateStr, dayIdeas);
        });
      }
    }
  }

  private showMonthPickerModal(): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;

    const container = contentEl.createDiv({ cls: 'pm-month-picker-container' });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let selectedYear = currentYear;
    let selectedMonth = currentMonth;

    // 年份选择器（左右箭头）
    const yearSection = container.createDiv({ cls: 'pm-year-selector' });

    const leftBtn = yearSection.createEl('button', {
      cls: 'pm-year-nav-btn',
      text: '‹'
    });
    leftBtn.addEventListener('click', () => {
      selectedYear--;
      yearDisplay.textContent = `${selectedYear}年`;
    });

    const yearDisplay = yearSection.createSpan({
      cls: 'pm-year-display',
      text: `${selectedYear}年`
    });

    const rightBtn = yearSection.createEl('button', {
      cls: 'pm-year-nav-btn',
      text: '›'
    });
    rightBtn.addEventListener('click', () => {
      selectedYear++;
      yearDisplay.textContent = `${selectedYear}年`;
    });

    // 月份选择器（1-12月网格）
    const monthSection = container.createDiv({ cls: 'pm-month-picker-section' });
    const monthGrid = monthSection.createDiv({ cls: 'pm-month-grid' });

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    months.forEach((m, idx) => {
      const monthBtn = monthGrid.createDiv({
        cls: 'pm-month-cell',
        text: m
      });
      if (idx + 1 === selectedMonth && selectedYear === currentYear) {
        monthBtn.classList.add('pm-month-cell-selected');
      }
      monthBtn.addEventListener('click', () => {
        monthGrid.querySelectorAll('.pm-month-cell').forEach(b => b.classList.remove('pm-month-cell-selected'));
        monthBtn.classList.add('pm-month-cell-selected');
        selectedMonth = idx + 1;
      });
    });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());

    const confirmBtn = buttonContainer.createEl('button', {
      text: '查看',
      cls: 'mod-cta'
    });
    confirmBtn.addEventListener('click', () => {
      modal.close();
      this.render();
    });

    modal.open();
  }

  private showDayIdeasModal(dateStr: string, ideas: IdeaItem[]): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;

    contentEl.createEl('h2', { text: `${dateStr} 的灵感` });

    if (ideas.length === 0) {
      contentEl.createDiv({ cls: 'pm-empty', text: '暂无灵感' });
    } else {
      const list = contentEl.createDiv({ cls: 'pm-ideas-list' });
      for (const idea of ideas) {
        this.renderIdeaListItem(list, idea, modal);
      }
    }

    modal.open();
  }
}
