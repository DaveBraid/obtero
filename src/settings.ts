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
    containerEl.createEl('h2', { text: '论文管理' });

    // ── 基本设置 ────────────────────────────────────────────────────────
    this.addSectionHeader(containerEl, '基本设置');

    // 工作文件夹
    new Setting(containerEl)
      .setName('工作文件夹')
      .setDesc('用于存储和管理论文的文件夹')
      .addText(text =>
        text
          .setPlaceholder('例如：论文管理')
          .setValue(this.plugin.settings.workspaceFolder)
          .onChange(async value => {
            this.plugin.settings.workspaceFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    // 文件夹设置组
    this.addSubHeader(containerEl, '文件夹命名');

    new Setting(containerEl)
      .setName('未读论文')
      .addText(text =>
        text
          .setValue(this.plugin.settings.unreadFolderName)
          .setPlaceholder('未阅读论文列表')
          .onChange(async value => {
            this.plugin.settings.unreadFolderName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('已读论文')
      .addText(text =>
        text
          .setValue(this.plugin.settings.readFolderName)
          .setPlaceholder('已阅读论文列表')
          .onChange(async value => {
            this.plugin.settings.readFolderName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    // 阅读标签
    this.addSubHeader(containerEl, '阅读分类');

    new Setting(containerEl)
      .setName('分类标签')
      .setDesc('用逗号分隔，例如：粗读,精读')
      .addText(text =>
        text
          .setValue(this.plugin.settings.labels.join(','))
          .setPlaceholder('粗读,精读')
          .onChange(async value => {
            this.plugin.settings.labels = value
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // ── Excalidraw 集成 ──────────────────────────────────────────────────
    this.addSectionHeader(containerEl, 'Excalidraw 集成');
    containerEl.createEl('p', {
      text: '论文卡片将自动添加到指定的 Excalidraw 文件中',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Excalidraw 文件')
      .setDesc('留空则使用默认位置')
      .addText(text =>
        text
          .setPlaceholder('Papers/论文关系图.md')
          .setValue(this.plugin.settings.excalidrawFilePath)
          .onChange(async value => {
            this.plugin.settings.excalidrawFilePath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    // ── 数据源 ────────────────────────────────────────────────────────────
    this.addSectionHeader(containerEl, '数据源');

    new Setting(containerEl)
      .setName('IEEE Xplore API Key')
      .setDesc('用于搜索 IEEE 数据库（可选）')
      .addText(text =>
        text
          .setPlaceholder('输入 API Key')
          .setValue(this.plugin.settings.ieeeApiKey)
          .onChange(async value => {
            this.plugin.settings.ieeeApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    // ── 卡片样式 ──────────────────────────────────────────────────────────
    this.addSectionHeader(containerEl, '卡片样式');
    containerEl.createEl('p', {
      text: '自定义论文卡片的外观。更改仅影响新添加的卡片。',
      cls: 'setting-item-description'
    });

    // 实时预览
    const previewContainer = containerEl.createDiv({ cls: 'pm-card-style-preview' });
    this.createCardPreview(previewContainer);

    // 颜色设置
    this.addSubHeader(containerEl, '颜色');

    this.addColorSetting(containerEl, '标题背景', 'headerBackgroundColor', previewContainer);
    this.addColorSetting(containerEl, '标题文字', 'headerTextColor', previewContainer);
    this.addColorSetting(containerEl, '正文背景', 'bodyBackgroundColor', previewContainer);
    this.addColorSetting(containerEl, '正文字字', 'bodyTextColor', previewContainer);

    // 字体设置
    this.addSubHeader(containerEl, '字体');

    this.addFontSetting(containerEl, '标题字体', 'titleFontFamily', previewContainer);
    new Setting(containerEl)
      .setName('标题大小')
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

    this.addFontSetting(containerEl, '正文字体', 'metaFontFamily', previewContainer);
    new Setting(containerEl)
      .setName('正文大小')
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

    // 尺寸设置
    this.addSubHeader(containerEl, '尺寸');

    new Setting(containerEl)
      .setName('卡片宽度')
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
      .setName('标题高度')
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
      .setName('正文高度')
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

  // ── 辅助方法 ──────────────────────────────────────────────────────────

  addSectionHeader(containerEl: HTMLElement, text: string): void {
    const header = containerEl.createEl('h3', { text });
    header.style.marginTop = '24px';
    header.style.marginBottom = '12px';
    header.style.fontSize = '1.1em';
    header.style.fontWeight = '600';
    header.style.color = 'var(--text-normal)';
    header.style.letterSpacing = '-0.02em';
  }

  addSubHeader(containerEl: HTMLElement, text: string): void {
    const header = containerEl.createEl('h4', { text });
    header.style.marginTop = '16px';
    header.style.marginBottom = '8px';
    header.style.fontSize = '0.9em';
    header.style.fontWeight = '600';
    header.style.color = 'var(--text-muted)';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '0.05em';
  }

  addColorSetting(
    containerEl: HTMLElement,
    name: string,
    configKey: keyof CardStyleConfig,
    previewContainer: HTMLElement
  ): void {
    const style = this.plugin.settings.cardStyle;
    const currentValue = style[configKey];

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

    if (typeof currentValue !== 'number') return;

    const fontOptions = [
      { value: 1, label: 'Virgil (手写)' },
      { value: 2, label: 'Helvetica (无衬线)' },
      { value: 3, label: 'Cascadia (等宽)' },
      { value: 4, label: 'Comic Sans' },
    ];

    new Setting(containerEl)
      .setName(name)
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
    containerEl.createEl('p', { text: '预览', cls: 'setting-item-description' });

    const card = containerEl.createDiv({ cls: 'pm-preview-card' });
    card.style.border = '1px solid #ccc';
    card.style.borderRadius = '8px';
    card.style.padding = '0';
    card.style.maxWidth = '300px';
    card.style.margin = '12px 0';
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
