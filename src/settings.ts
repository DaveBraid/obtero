import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface CardStyleConfig {
  // 标题区域
  headerBackgroundColor: string;
  headerTextColor: string;
  headerBorderColor: string;
  headerRoughness: number;
  headerOpacity: number;
  headerRoundness: number; // 0-3: 0=无, 1=小, 2=中, 3=大

  // 正文区域
  bodyBackgroundColor: string;
  bodyTextColor: string;
  bodyBorderColor: string;
  bodyRoughness: number;
  bodyOpacity: number;
  bodyRoundness: number;

  // 文本设置
  titleFontSize: number;
  titleFontFamily: number;
  metaFontSize: number;
  metaFontFamily: number;

  // 卡片尺寸
  cardWidth: number;      // 卡片宽度
  headerHeight: number;   // 标题区域高度
  bodyHeight: number;     // 正文区域高度
}

export const DEFAULT_CARD_STYLE: CardStyleConfig = {
  headerBackgroundColor: '#1971c2',
  headerTextColor: '#ffffff',
  headerBorderColor: '#1864ab',
  headerRoughness: 0,
  headerOpacity: 100,
  headerRoundness: 3,

  bodyBackgroundColor: '#e7f5ff',
  bodyTextColor: '#1c3b5a',
  bodyBorderColor: '#1864ab',
  bodyRoughness: 0,
  bodyOpacity: 100,
  bodyRoundness: 0,

  titleFontSize: 12,
  titleFontFamily: 4, // Comic Sans MS
  metaFontSize: 11,
  metaFontFamily: 4, // Comic Sans MS

  cardWidth: 280,
  headerHeight: 44,
  bodyHeight: 116,
};

export interface MyPluginSettings {
  workspaceFolder: string;
  unreadFolderName: string;
  readFolderName: string;
  labels: string[];
  ieeeApiKey: string;
  excalidrawFilePath: string;
  cardStyle: CardStyleConfig;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
  workspaceFolder: '',
  unreadFolderName: '未阅读论文列表',
  readFolderName: '已阅读论文列表',
  labels: ['粗读', '精读'],
  ieeeApiKey: '',
  excalidrawFilePath: '',
  cardStyle: DEFAULT_CARD_STYLE,
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

    // 工作文件夹
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

    // 未读论文文件夹
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

    // 已读论文文件夹
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

    // 阅读标签
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

    // IEEE API Key
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

    // Excalidraw 文件路径
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

    // ========== 卡片样式配置区域 ==========
    containerEl.createEl('h3', { text: '卡片样式设置' });
    containerEl.createEl('p', {
      text: '自定义论文卡片的颜色、形状等样式。设置更改后仅影响新添加的卡片。',
      cls: 'setting-item-description'
    });

    // 实时预览区域
    const previewContainer = containerEl.createDiv({ cls: 'pm-card-style-preview' });
    this.createCardPreview(previewContainer);

    // 标题区域设置
    containerEl.createEl('h4', { text: '标题区域' });

    this.addColorSetting(containerEl, '标题背景色', 'headerBackgroundColor', previewContainer);
    this.addColorSetting(containerEl, '标题文字色', 'headerTextColor', previewContainer);
    this.addColorSetting(containerEl, '标题边框色', 'headerBorderColor', previewContainer);

    new Setting(containerEl)
      .setName('标题圆角')
      .setDesc('0=无圆角, 3=大圆角')
      .addSlider(slider =>
        slider
          .setLimits(0, 3, 1)
          .setValue(this.plugin.settings.cardStyle.headerRoundness)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.headerRoundness = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    new Setting(containerEl)
      .setName('标题透明度')
      .addSlider(slider =>
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.cardStyle.headerOpacity)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.headerOpacity = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    // 正文区域设置
    containerEl.createEl('h4', { text: '正文区域' });

    this.addColorSetting(containerEl, '正文背景色', 'bodyBackgroundColor', previewContainer);
    this.addColorSetting(containerEl, '正文字色', 'bodyTextColor', previewContainer);
    this.addColorSetting(containerEl, '正文边框色', 'bodyBorderColor', previewContainer);

    new Setting(containerEl)
      .setName('正文圆角')
      .setDesc('0=无圆角, 3=大圆角')
      .addSlider(slider =>
        slider
          .setLimits(0, 3, 1)
          .setValue(this.plugin.settings.cardStyle.bodyRoundness)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.bodyRoundness = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    new Setting(containerEl)
      .setName('正文透明度')
      .addSlider(slider =>
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.cardStyle.bodyOpacity)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.bodyOpacity = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    // 文本设置
    containerEl.createEl('h4', { text: '文本设置' });

    // 标题字体
    this.addFontSetting(containerEl, '标题字体', 'titleFontFamily', previewContainer);

    new Setting(containerEl)
      .setName('标题字体大小')
      .addSlider(slider =>
        slider
          .setLimits(8, 24, 1)
          .setValue(this.plugin.settings.cardStyle.titleFontSize)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.titleFontSize = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    // 正文字体
    this.addFontSetting(containerEl, '正文字体', 'metaFontFamily', previewContainer);

    new Setting(containerEl)
      .setName('正文字体大小')
      .addSlider(slider =>
        slider
          .setLimits(8, 20, 1)
          .setValue(this.plugin.settings.cardStyle.metaFontSize)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.metaFontSize = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    // 卡片尺寸设置
    containerEl.createEl('h4', { text: '卡片尺寸' });

    new Setting(containerEl)
      .setName('卡片宽度')
      .setDesc('卡片的总宽度（像素）')
      .addSlider(slider =>
        slider
          .setLimits(200, 500, 10)
          .setValue(this.plugin.settings.cardStyle.cardWidth)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.cardWidth = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    new Setting(containerEl)
      .setName('标题区域高度')
      .setDesc('标题背景的高度（像素）')
      .addSlider(slider =>
        slider
          .setLimits(30, 80, 2)
          .setValue(this.plugin.settings.cardStyle.headerHeight)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.headerHeight = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );

    new Setting(containerEl)
      .setName('正文区域高度')
      .setDesc('正文背景的高度（像素）')
      .addSlider(slider =>
        slider
          .setLimits(80, 200, 5)
          .setValue(this.plugin.settings.cardStyle.bodyHeight)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.cardStyle.bodyHeight = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );
  }

  addColorSetting(
    containerEl: HTMLElement,
    name: string,
    configKey: keyof CardStyleConfig,
    previewContainer: HTMLElement
  ): void {
    const style = this.plugin.settings.cardStyle;
    const currentValue = style[configKey];

    // 只处理字符串类型的配置项（颜色）
    if (typeof currentValue !== 'string') return;

    new Setting(containerEl)
      .setName(name)
      .addColorPicker(colorPicker => {
        colorPicker
          .setValue(currentValue as string)
          .onChange(async value => {
            (this.plugin.settings.cardStyle[configKey] as string) = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          });
      })
      .addText(text =>
        text
          .setValue(currentValue as string)
          .onChange(async value => {
            (this.plugin.settings.cardStyle[configKey] as string) = value;
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          })
      );
  }

  addFontSetting(
    containerEl: HTMLElement,
    name: string,
    configKey: keyof CardStyleConfig,
    previewContainer: HTMLElement
  ): void {
    const style = this.plugin.settings.cardStyle;
    const currentValue = style[configKey];

    // 只处理数字类型的配置项（字体）
    if (typeof currentValue !== 'number') return;

    const fontOptions = [
      { value: 1, label: 'Virgil (手写风格)' },
      { value: 2, label: 'Helvetica (无衬线)' },
      { value: 3, label: 'Cascadia (等宽代码)' },
      { value: 4, label: 'Comic Sans MS (本地字体)' },
    ];

    new Setting(containerEl)
      .setName(name)
      .setDesc('选择卡片文本的字体样式')
      .addDropdown(dropdown => {
        fontOptions.forEach(option => {
          dropdown.addOption(option.value.toString(), option.label);
        });

        dropdown
          .setValue(currentValue.toString())
          .onChange(async value => {
            (this.plugin.settings.cardStyle[configKey] as number) = parseInt(value);
            await this.plugin.saveSettings();
            this.updateCardPreview(previewContainer);
          });
      });
  }

  createCardPreview(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('p', { text: '实时预览：', cls: 'setting-item-description' });

    const card = containerEl.createDiv({ cls: 'pm-preview-card' });
    card.style.border = '1px solid #ccc';
    card.style.borderRadius = '8px';
    card.style.padding = '0';
    card.style.maxWidth = '300px';
    card.style.margin = '10px 0';
    card.style.overflow = 'hidden';

    const header = card.createDiv({ cls: 'pm-preview-header' });
    header.style.padding = '10px';
    header.style.textAlign = 'center';
    header.innerHTML = '<strong>论文标题示例</strong>';

    const body = card.createDiv({ cls: 'pm-preview-body' });
    body.style.padding = '10px';
    body.innerHTML = 'arXiv · 2024<br>作者单位示例';

    this.updateCardPreview(containerEl);
  }

  updateCardPreview(containerEl: HTMLElement): void {
    const style = this.plugin.settings.cardStyle;

    const header = containerEl.querySelector('.pm-preview-header') as HTMLElement;
    const body = containerEl.querySelector('.pm-preview-body') as HTMLElement;

    if (header) {
      header.style.backgroundColor = style.headerBackgroundColor;
      header.style.color = style.headerTextColor;
      header.style.border = `1px solid ${style.headerBorderColor}`;
      header.style.borderRadius = style.headerRoundness > 0 ? `${style.headerRoundness * 4}px` : '0';
      header.style.opacity = (style.headerOpacity / 100).toString();
      header.style.fontSize = `${style.titleFontSize}px`;
      header.style.fontFamily = this.getFontFamilyName(style.titleFontFamily);
      header.style.height = `${style.headerHeight}px`;
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'center';
    }

    if (body) {
      body.style.backgroundColor = style.bodyBackgroundColor;
      body.style.color = style.bodyTextColor;
      body.style.border = `1px solid ${style.bodyBorderColor}`;
      body.style.borderRadius = style.bodyRoundness > 0 ? `${style.bodyRoundness * 4}px` : '0';
      body.style.opacity = (style.bodyOpacity / 100).toString();
      body.style.fontSize = `${style.metaFontSize}px`;
      body.style.fontFamily = this.getFontFamilyName(style.metaFontFamily);
      body.style.height = `${style.bodyHeight}px`;
      body.style.display = 'flex';
      body.style.alignItems = 'center';
      body.style.justifyContent = 'center';
    }
  }

  getFontFamilyName(fontFamily: number): string {
    const fontMap: Record<number, string> = {
      1: 'Virgil, sans-serif',
      2: 'Helvetica, Arial, sans-serif',
      3: 'Cascadia, monospace',
      4: 'Comic Sans MS, Chalkboard SE, sans-serif',
    };
    return fontMap[fontFamily] || 'sans-serif';
  }
}
