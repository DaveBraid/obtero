import { App, Modal, Notice, Setting, normalizePath } from 'obsidian';
import MyPlugin from '../main';
import { ensureWorkspaceFolders } from '../utils/fileUtils';

export class SetupModal extends Modal {
  private plugin: MyPlugin;
  private onComplete: () => void;
  private folderName: string;
  private excalidrawPath: string;

  constructor(app: App, plugin: MyPlugin, onComplete: () => void) {
    super(app);
    this.plugin = plugin;
    this.onComplete = onComplete;
    this.folderName = plugin.settings.workspaceFolder;
    this.excalidrawPath = plugin.settings.excalidrawFilePath;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '初始设置' });

    new Setting(contentEl)
      .setName('工作文件夹名称')
      .setDesc('论文 MD 文件将存放在该文件夹下')
      .addText(text =>
        text
          .setPlaceholder('例如：论文管理')
          .setValue(this.folderName)
          .onChange(v => {
            this.folderName = v.trim();
          })
      );

    new Setting(contentEl)
      .setName('Excalidraw 文件路径')
      .setDesc('论文卡片将插入到该文件。相对于 vault 根目录，留空则在工作文件夹下自动创建「论文关系图.md」')
      .addText(text =>
        text
          .setPlaceholder('例：论文管理/论文关系图.md')
          .setValue(this.excalidrawPath)
          .onChange(v => {
            this.excalidrawPath = v.trim();
          })
      );

    new Setting(contentEl).addButton(btn =>
      btn
        .setButtonText('确定')
        .setCta()
        .onClick(async () => {
          if (!this.folderName) {
            new Notice('请输入工作文件夹名称');
            return;
          }
          this.plugin.settings.workspaceFolder = this.folderName;
          // If user left excalidraw path blank, use the default inside the workspace folder
          this.plugin.settings.excalidrawFilePath =
            this.excalidrawPath ||
            normalizePath(`${this.folderName}/论文关系图.md`);
          await this.plugin.saveSettings();
          try {
            await ensureWorkspaceFolders(this.app, this.plugin.settings);
            new Notice(`工作文件夹「${this.folderName}」已创建`);
            this.close();
            this.onComplete();
          } catch (e) {
            new Notice('创建文件夹失败: ' + (e as Error).message);
          }
        })
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
