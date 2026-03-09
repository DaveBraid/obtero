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
      root.createEl('p', { text: '尚未设置工作文件夹' });
      root
        .createEl('button', { text: '立即设置', cls: 'mod-cta pm-btn-full' })
        .addEventListener('click', () => {
          new SetupModal(this.app, this.plugin, () => this.render()).open();
        });
      return;
    }

    // ── 顶部操作栏 ──
    const toolbar = root.createDiv({ cls: 'pm-toolbar' });
    toolbar
      .createEl('button', { text: '➕ 添加论文', cls: 'mod-cta pm-btn-add' })
      .addEventListener('click', () =>
        new AddPaperModal(this.app, this.plugin, () => this.render()).open()
      );
    toolbar
      .createEl('button', { text: '刷新', cls: 'pm-btn-refresh' })
      .addEventListener('click', () => this.render());

    // ── 各类别论文列表 ──
    const byCategory = getPapersByCategory(this.app, this.plugin.settings);

    for (const [label, files] of Object.entries(byCategory)) {
      const section = root.createDiv({ cls: 'pm-section' });

      // 区块标题：类别名 + 数量
      const header = section.createDiv({ cls: 'pm-section-header' });
      header.createSpan({ cls: 'pm-section-title', text: label });
      header.createSpan({ cls: 'pm-section-count', text: String(files.length) });

      if (files.length === 0) {
        section.createDiv({ cls: 'pm-empty', text: '暂无论文' });
        continue;
      }

      const list = section.createDiv({ cls: 'pm-paper-list' });
      for (const file of files) {
        const item = list.createDiv({ cls: 'pm-paper-item' });
        // 显示标题：去掉「粗读」-、「精读」-等前缀
        const displayName = file.basename.replace(/^【.+?】-/, '');
        item.createSpan({ cls: 'pm-paper-title', text: displayName });
        item.addEventListener('click', async (e) => {
          // If the click was on the menu button, don't open file
          if ((e.target as HTMLElement).closest('.pm-item-menu-btn')) return;
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(file as TFile);
        });

        // "..." context menu button — shown on ALL paper items
        const menuBtn = item.createEl('button', {
          cls: 'pm-item-menu-btn',
          text: '…',
          attr: { title: '更多操作' },
        });
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const menu = new Menu();

          // Move-to options (skip the current category)
          const allCategories = ['待阅读', ...this.plugin.settings.labels];
          for (const targetLabel of allCategories) {
            if (targetLabel === label) continue;
            menu.addItem(mi =>
              mi.setTitle(`移至「${targetLabel}」`).onClick(async () => {
                try {
                  await movePaper(
                    this.app,
                    this.plugin.settings,
                    file as TFile,
                    targetLabel
                  );
                  new Notice(`已将「${displayName}」移至「${targetLabel}」`);
                  await this.render();
                } catch (err) {
                  new Notice('移动失败：' + (err as Error).message);
                }
              })
            );
          }

          menu.addSeparator();

          // Add card to Excalidraw
          menu.addItem(mi =>
            mi.setTitle('添加卡片到 Excalidraw').onClick(async () => {
              const fm = this.app.metadataCache.getFileCache(file as TFile)?.frontmatter;
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
                  file as TFile
                );
                new Notice(`已将「${displayName}」添加到 Excalidraw`);
                // Open the excalidraw file so the user sees the new card
                const excalidrawPath = resolveExcalidrawPath(this.plugin.settings);
                const excalidrawFile = this.app.vault.getAbstractFileByPath(excalidrawPath);
                if (excalidrawFile instanceof TFile) {
                  const leaf = this.app.workspace.getLeaf(false);
                  await leaf.openFile(excalidrawFile);
                }
              } catch (err) {
                new Notice('添加失败：' + (err as Error).message);
              }
            })
          );

          menu.addSeparator();

          // Delete paper
          menu.addItem(mi =>
            mi.setTitle('🗑️ 删除论文').onClick(() => {
              new DeleteConfirmModal(this.app, displayName, async () => {
                try {
                  await this.app.vault.delete(file as TFile);
                  new Notice(`已删除「${displayName}」`);
                  await this.render();
                } catch (err) {
                  new Notice('删除失败：' + (err as Error).message);
                }
              }).open();
            })
          );

          menu.showAtMouseEvent(e);
        });
      }
    }
  }
}
