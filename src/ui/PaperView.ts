import { ItemView, Menu, Modal, Notice, TFile, WorkspaceLeaf } from 'obsidian';
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
    await this.render();
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

    // 左侧区域（原有功能）
    const leftContainer = mainContainer.createDiv({ cls: 'pm-left-container' });
    this.renderToolbar(leftContainer);
    this.renderPaperList(leftContainer);

    // 右侧看板（简化版）
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

  private renderToolbar(root: HTMLElement): void {
    const toolbar = root.createDiv({ cls: 'pm-toolbar' });
    toolbar
      .createEl('button', {
        text: '➕ 添加论文',
        cls: 'mod-cta pm-btn-add'
      })
      .addEventListener('click', () =>
        new AddPaperModal(this.app, this.plugin, () => this.render()).open()
      );
    toolbar
      .createEl('button', {
        text: '刷新',
        cls: 'pm-btn-refresh'
      })
      .addEventListener('click', () => this.render());
  }

  private renderPaperList(root: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

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
        this.renderPaperItem(list, file as TFile, label);
      }
    }
  }

  private renderPaperItem(list: HTMLElement, file: TFile, category: string): void {
    const item = list.createDiv({ cls: 'pm-paper-item' });

    // Display title (remove prefix like "【粗读】-")
    const displayName = file.basename.replace(/^【.+?】-/, '');
    item.createSpan({ cls: 'pm-paper-title', text: displayName });

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
    // 统计
    this.renderFieldStats(container);

    // 快速操作
    this.renderQuickActions(container);

    // 最近论文
    this.renderRecentPapers(container);

    // 阅读进度
    this.renderReadingProgress(container);
  }

  private renderFieldStats(container: HTMLElement): void {
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    const section = container.createDiv({ cls: 'pm-dashboard-section' });
    section.createEl('h4', { text: '统计' });

    const statsList = section.createDiv({ cls: 'pm-stats-list' });

    // 统计各领域论文数量
    const fieldStats: Record<string, number> = {};
    for (const field of this.plugin.settings.fields) {
      fieldStats[field.name] = 0;
    }

    let totalPapers = 0;
    for (const [category, files] of Object.entries(byCategory)) {
      for (const file of files) {
        const fm = this.app.metadataCache.getFileCache(file as TFile)?.frontmatter;
        const field = fm?.field || this.plugin.settings.defaultField;
        if (fieldStats[field] !== undefined) {
          fieldStats[field]++;
        }
        totalPapers++;
      }
    }

    // 总数
    const totalRow = statsList.createDiv({ cls: 'pm-stat-row' });
    totalRow.createSpan({ cls: 'pm-stat-label', text: '总计' });
    totalRow.createSpan({ cls: 'pm-stat-value', text: String(totalPapers) });

    // 创建简化的统计行
    for (const field of this.plugin.settings.fields) {
      const count = fieldStats[field.name] || 0;
      if (count > 0) {
        const row = statsList.createDiv({ cls: 'pm-stat-row' });
        row.createSpan({ cls: 'pm-stat-label', text: field.name });
        row.createSpan({ cls: 'pm-stat-value', text: String(count) });
      }
    }
  }

  private renderQuickActions(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const addBtn = section.createEl('button', {
      cls: 'mod-cta',
      text: '添加论文'
    });
    addBtn.addEventListener('click', () =>
      new AddPaperModal(this.app, this.plugin, () => this.render()).open()
    );
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

    const progressText = section.createDiv({ cls: 'pm-progress-text' });
    progressText.textContent = `${readCount} / ${total} 篇已读`;

    const progressBar = section.createDiv({ cls: 'pm-progress-bar' });
    const progressFill = progressBar.createDiv({ cls: 'pm-progress-fill' });
    progressFill.style.width = `${readPercent}%`;
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
}
