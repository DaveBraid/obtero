import { App, ItemView, Menu, Modal, Notice, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import MyPlugin from '../main';
import { getPapersByCategory, movePaper, resolveExcalidrawPath } from '../utils/fileUtils';
import { insertPaperToExcalidraw } from '../utils/excalidrawUtils';
import { PaperInfo } from '../types';
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
    const fieldStyle = this.plugin.settings.fields.find(f => f.name === fieldName);
    const defaultField = this.plugin.settings.fields.find(f => f.name === this.plugin.settings.defaultField);
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
      await insertPaperToExcalidraw(
        this.app,
        this.plugin.settings,
        paperInfo,
        file
      );
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

    // 最近论文
    this.renderRecentPapers(container);
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

    // 统计各领域论文数量
    const fieldStats: Array<{ name: string; count: number; color: string }> = [];
    let totalPapers = 0;

    for (const field of this.plugin.settings.fields) {
      let count = 0;
      for (const [category, files] of Object.entries(byCategory)) {
        for (const file of files) {
          const fm = this.app.metadataCache.getFileCache(file as TFile)?.frontmatter;
          const paperField = fm?.field || this.plugin.settings.defaultField;
          if (paperField === field.name) {
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

    const fieldOptions = this.plugin.settings.fields.map(f => f.name);

    new Setting(modal.contentEl)
      .setName('研究领域')
      .setDesc('选择该论文所属领域')
      .addDropdown(drop => {
        fieldOptions.forEach(f => drop.addOption(f, f));
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
}
