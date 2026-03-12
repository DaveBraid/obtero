import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPaperPlugin from './main';

export interface MyPluginSettings {
	paperFolder: string;
	excalidrawFileName: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	paperFolder: 'Papers',
	excalidrawFileName: 'Paper Map',
};

export class PaperPluginSettingTab extends PluginSettingTab {
	plugin: MyPaperPlugin;

	constructor(app: App, plugin: MyPaperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '📚 论文管理插件设置' });

		new Setting(containerEl)
			.setName('论文文件夹')
			.setDesc('用于存放论文地图（Excalidraw 文件）的文件夹路径。')
			.addText((text) =>
				text
					.setPlaceholder('Papers')
					.setValue(this.plugin.settings.paperFolder)
					.onChange(async (value) => {
						this.plugin.settings.paperFolder = value.trim() || 'Papers';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Excalidraw 文件名')
			.setDesc('论文地图的文件名（不含扩展名）。')
			.addText((text) =>
				text
					.setPlaceholder('Paper Map')
					.setValue(this.plugin.settings.excalidrawFileName)
					.onChange(async (value) => {
						this.plugin.settings.excalidrawFileName = value.trim() || 'Paper Map';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('打开论文地图')
			.setDesc('在指定文件夹中创建（如不存在）并打开论文地图。')
			.addButton((btn) =>
				btn
					.setButtonText('打开论文地图')
					.setCta()
					.onClick(async () => {
						await this.plugin.openOrCreatePaperMap();
					}),
			);
	}
}
