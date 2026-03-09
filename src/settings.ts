import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
  workspaceFolder: string;
  unreadFolderName: string;
  readFolderName: string;
  labels: string[];
  ieeeApiKey: string;
  excalidrawFilePath: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
  workspaceFolder: '',
  unreadFolderName: '未阅读论文列表',
  readFolderName: '已阅读论文列表',
  labels: ['粗读', '精读'],
  ieeeApiKey: '',
  excalidrawFilePath: '',
};

export class PaperSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '论文管理插件设置' });

    new Setting(containerEl)
      .setName('工作文件夹')
      .setDesc('插件用于存储论文的文件夹名称（设置后需重新初始化）')
      .addText(text =>
        text
          .setPlaceholder('例如：论文管理')
          .setValue(this.plugin.settings.workspaceFolder)
          .onChange(async value => {
            this.plugin.settings.workspaceFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('未读论文文件夹名称')
      .addText(text =>
        text
          .setValue(this.plugin.settings.unreadFolderName)
          .onChange(async value => {
            this.plugin.settings.unreadFolderName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('已读论文文件夹名称')
      .addText(text =>
        text
          .setValue(this.plugin.settings.readFolderName)
          .onChange(async value => {
            this.plugin.settings.readFolderName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('阅读标签')
      .setDesc('逗号分隔，例如：粗读,精读')
      .addText(text =>
        text
          .setValue(this.plugin.settings.labels.join(','))
          .onChange(async value => {
            this.plugin.settings.labels = value
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('IEEE Xplore API Key')
      .setDesc('用于搜索 IEEE 数据库（可选）。申请地址：developer.ieee.org')
      .addText(text =>
        text
          .setPlaceholder('输入 IEEE API Key')
          .setValue(this.plugin.settings.ieeeApiKey)
          .onChange(async value => {
            this.plugin.settings.ieeeApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Excalidraw 文件路径')
      .setDesc('论文卡片将插入到该 Excalidraw 文件中（相对于 vault 根目录，留空则使用工作文件夹下默认文件）')
      .addText(text =>
        text
          .setPlaceholder('例如：Papers/论文关系图.md')
          .setValue(this.plugin.settings.excalidrawFilePath)
          .onChange(async value => {
            this.plugin.settings.excalidrawFilePath = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
