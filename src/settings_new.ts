import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';
import { FieldStyle } from './types';

export interface MyPluginSettings {
  workspaceFolder: string;
  unreadFolderName: string;
  readFolderName: string;
  labels: string[];
  ieeeApiKey: string;
  excalidrawFilePath: string;
  fields: FieldStyle[]; // 领域样式列表
  defaultField: string; // 默认领域
}

export const DEFAULT_FIELDS: FieldStyle[] = [
  {
    name: '计算机科学',
    backgroundColor: '#e3f2fd',
    backgroundPattern: 'dots',
    patternColor: '#90caf9',
    textColor: '#1565c0',
    borderColor: '#64b5f6',
    roughness: 0,
    opacity: 100,
    roundness: 2,
  titleFontSize: 14,
  titleFontFamily: 1,
  metaFontSize: 11,
  metaFontFamily: 1,
  cardWidth: 280,
  cardHeight: 180,
    titleTextColor: undefined,
    metaTextColor: undefined,
  },
  {
    name: '机器学习',
    backgroundColor: '#f3e5f5',
    backgroundPattern: 'grid',
    patternColor: '#ce93d8',
    textColor: '#6a1b9a',
    borderColor: '#ba68c8',
    roughness: 0,
    opacity: 100,
    roundness: 2,
  titleFontSize: 14,
  titleFontFamily: 1,
  metaFontSize: 11,
  metaFontFamily: 1,
  cardWidth: 280,
  cardHeight: 180,
    titleTextColor: undefined,
    metaTextColor: undefined,
  },
  {
    name: '自然语言处理',
    backgroundColor: '#e8f5e9',
    backgroundPattern: 'lines',
    patternColor: '#a5d6a7',
    textColor: '#2e7d32',
    borderColor: '#81c784',
    roughness: 0,
    opacity: 100,
    roundness: 2,
  titleFontSize: 14,
  titleFontFamily: 1,
  metaFontSize: 11,
  metaFontFamily: 1,
  cardWidth: 280,
  cardHeight: 180,
    titleTextColor: undefined,
    metaTextColor: undefined,
  },
  {
    name: '其他',
    backgroundColor: '#fff3e0',
    backgroundPattern: 'solid',
    patternColor: '#ffcc80',
    textColor: '#ef6c00',
    borderColor: '#ffb74d',
    roughness: 0,
    opacity: 100,
    roundness: 2,
  titleFontSize: 14,
  titleFontFamily: 1,
  metaFontSize: 11,
  metaFontFamily: 1,
  cardWidth: 280,
  cardHeight: 180,
    titleTextColor: undefined,
    metaTextColor: undefined,
  },
];

export const DEFAULT_SETTINGS: MyPluginSettings = {
  workspaceFolder: '',
  unreadFolderName: '未阅读论文列表',
  readFolderName: '已阅读论文列表',
  labels: ['粗读', '精读'],
  ieeeApiKey: '',
  excalidrawFilePath: '',
  fields: DEFAULT_FIELDS,
  defaultField: '其他',
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

    // ── 领域管理 ─────────────────────────────────────────────────────────
    this.addSectionHeader(containerEl, '领域样式');
    containerEl.createEl('p', {
      text: '管理不同研究领域的卡片样式。添加论文时会选择领域，卡片会应用对应的样式。',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('默认领域')
      .addDropdown(dropdown => {
        this.plugin.settings.fields.forEach(field => {
          dropdown.addOption(field.name, field.name);
        });
        dropdown
          .setValue(this.plugin.settings.defaultField)
          .onChange(async value => {
            this.plugin.settings.defaultField = value;
            await this.plugin.saveSettings();
          });
      });

    // 渲染领域列表
    this.renderFieldsList(containerEl);

    // 添加新领域按钮
    new Setting(containerEl)
      .setName('添加新领域')
      .setDesc('创建一个新的领域样式')
      .addButton(button => {
        button
          .setButtonText('添加')
          .setCta()
          .onClick(() => {
            const newField: FieldStyle = {
              name: '新领域',
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
    titleTextColor: undefined,
    metaTextColor: undefined,
            };
            this.plugin.settings.fields.push(newField);
            this.plugin.saveSettings();
            this.display(); // 刷新设置页面
          });
      });
  }

  renderFieldsList(containerEl: HTMLElement): void {
    const fieldsContainer = containerEl.createDiv({ cls: 'pm-fields-list' });
    fieldsContainer.style.marginTop = '16px';

    this.plugin.settings.fields.forEach((field, index) => {
      const fieldItem = fieldsContainer.createDiv({ cls: 'pm-field-item' });
      fieldItem.style.border = '1px solid var(--background-modifier-border)';
      fieldItem.style.borderRadius = '8px';
      fieldItem.style.padding = '12px';
      fieldItem.style.marginBottom = '12px';
      fieldItem.style.background = 'var(--background-secondary)';

      // 领域名称和删除按钮
      const header = fieldItem.createDiv({ cls: 'pm-field-header' });
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '12px';

      const nameInput = header.createEl('input', {
        type: 'text',
        value: field.name,
      });
      nameInput.style.fontSize = '1.1em';
      nameInput.style.fontWeight = '600';
      nameInput.style.border = 'none';
      nameInput.style.background = 'transparent';
      nameInput.style.color = 'var(--text-normal)';
      nameInput.style.width = '300px';
      nameInput.addEventListener('change', async () => {
// @ts-ignore
// @ts-ignore
        if (this.plugin.settings.fields[index]!) this.plugin.settings.fields[index].name = nameInput.value;
        await this.plugin.saveSettings();
      });

      const deleteBtn = header.createEl('button', {
        text: '删除',
        cls: 'mod-warning',
      });
      deleteBtn.style.padding = '4px 12px';
      deleteBtn.addEventListener('click', async () => {
        if (this.plugin.settings.fields.length <= 1) {
          new Notice('至少保留一个领域样式');
          return;
        }
        this.plugin.settings.fields.splice(index, 1);
        await this.plugin.saveSettings();
        this.display();
      });

      // 样式设置
      this.addFieldStyleSetting(fieldItem, field, index);
    });
  }

  addFieldStyleSetting(containerEl: HTMLElement, field: FieldStyle, index: number): void {
    // 预览容器（包含卡片预览和字体预览）
    const previewContainer = containerEl.createDiv({ cls: 'pm-preview-container' });
    previewContainer.style.marginTop = '12px';
    previewContainer.style.display = 'flex';
    previewContainer.style.gap = '20px';
    previewContainer.style.alignItems = 'flex-start';

    // 卡片预览区域
    const cardPreview = previewContainer.createDiv({ cls: 'pm-field-preview' });
    cardPreview.style.padding = '16px';
    cardPreview.style.borderRadius = '6px';
    cardPreview.style.border = `2px solid ${field.borderColor}`;
    cardPreview.style.background = field.backgroundColor;
    cardPreview.style.flexShrink = '0';
    this.updateFieldPreview(cardPreview, field);

    // 字体预览区域
    const fontPreview = previewContainer.createDiv({ cls: 'pm-font-preview' });
    fontPreview.style.flex = '1';
    fontPreview.style.padding = '20px';
    fontPreview.style.borderRadius = '6px';
    fontPreview.style.border = '2px solid var(--background-modifier-border)';
    fontPreview.style.background = field.backgroundColor;
    this.updateFontPreview(fontPreview, field);

    // 样式控制
    const controls = containerEl.createDiv({ cls: 'pm-field-controls' });
    controls.style.display = 'grid';
    controls.style.gridTemplateColumns = 'repeat(2, 1fr)';
    controls.style.gap = '12px';
    controls.style.marginTop = '12px';

    // 背景色
    new Setting(controls)
      .setName('背景色')
      .addColorPicker(colorPicker => {
        colorPicker
          .setValue(field.backgroundColor)
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
// @ts-ignore
            this.plugin.settings.fields[index].backgroundColor = value;
// @ts-ignore
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
            fontPreview.style.background = value;
          });
      });


    // 边框色
    new Setting(controls)
// @ts-ignore
      .setName('边框色')
// @ts-ignore
      .addColorPicker(colorPicker => {
// @ts-ignore
// @ts-ignore
// @ts-ignore
        colorPicker
// @ts-ignore
          .setValue(field.borderColor)
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].borderColor = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

// @ts-ignore
    // 纹理色
// @ts-ignore
    new Setting(controls)
// @ts-ignore
// @ts-ignore
// @ts-ignore
      .setName('纹理色')
// @ts-ignore
      .addColorPicker(colorPicker => {
// @ts-ignore
        colorPicker
// @ts-ignore
          .setValue(field.patternColor || '#cccccc')
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].patternColor = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    // 纹理类型
    new Setting(controls)
// @ts-ignore
      .setName('纹理类型')
// @ts-ignore
      .addDropdown(dropdown => {
// @ts-ignore
// @ts-ignore
// @ts-ignore
        dropdown.addOption('solid', '纯色');
// @ts-ignore
        dropdown.addOption('dots', '点阵');
// @ts-ignore
        dropdown.addOption('grid', '网格');
// @ts-ignore
        dropdown.addOption('lines', '线条');
        dropdown
          .setValue(field.backgroundPattern || 'solid')
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].backgroundPattern = value as any;
// @ts-ignore
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
// @ts-ignore
      });
// @ts-ignore
// @ts-ignore

// @ts-ignore
// @ts-ignore
    // 圆角
    new Setting(controls)
// @ts-ignore
      .setName('圆角')
      .addSlider(slider => {
        slider
          .setLimits(0, 3, 1)
          .setValue(field.roundness)
          .setDynamicTooltip()
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].roundness = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
// @ts-ignore
          });
// @ts-ignore
      });

// @ts-ignore
    // 粗糙度
    new Setting(controls)
      .setName('粗糙度')
// @ts-ignore
      .addSlider(slider => {
        slider
          .setLimits(0, 2, 1)
          .setValue(field.roughness)
          .setDynamicTooltip()
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].roughness = value;
// @ts-ignore
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
// @ts-ignore
          });
// @ts-ignore
      });
// @ts-ignore

    // 透明度
// @ts-ignore
    new Setting(controls)
// @ts-ignore
      .setName('透明度')
      .addSlider(slider => {
        slider
          .setLimits(0, 100, 5)
          .setValue(field.opacity)
          .setDynamicTooltip()
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
// @ts-ignore
            this.plugin.settings.fields[index].opacity = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
          
      });
          // 字体设置
    this.addSubHeader(controls, '字体');

    new Setting(controls)
      .setName('标题字体')
      .addDropdown(dropdown => {
        const fontOptions = [
          { value: 1, label: '手写风格' },
          { value: 2, label: '无衬线' },
          { value: 3, label: '等宽字体' },
          { value: 4, label: 'Comic Sans' },
        ];
        fontOptions.forEach(opt => dropdown.addOption(opt.value.toString(), opt.label));
        dropdown.setValue(field.titleFontFamily.toString())
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].titleFontFamily = parseInt(value);
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    new Setting(controls)
      .setName('标题大小')
      .addSlider(slider => {
        slider.setLimits(8, 24, 1).setValue(field.titleFontSize).setDynamicTooltip()
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].titleFontSize = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    new Setting(controls)
      .setName('正文字体')
      .addDropdown(dropdown => {
        const fontOptions = [
          { value: 1, label: '手写风格' },
          { value: 2, label: '无衬线' },
          { value: 3, label: '等宽字体' },
          { value: 4, label: 'Comic Sans' },
        ];
        fontOptions.forEach(opt => dropdown.addOption(opt.value.toString(), opt.label));
        dropdown.setValue(field.metaFontFamily.toString())
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].metaFontFamily = parseInt(value);
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    new Setting(controls)
      .setName('正文大小')
      .addSlider(slider => {
        slider.setLimits(8, 20, 1).setValue(field.metaFontSize).setDynamicTooltip()
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].metaFontSize = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    // 卡片尺寸设置
    this.addSubHeader(controls, '卡片尺寸');

    new Setting(controls)
      .setName('卡片宽度')
      .addSlider(slider => {
        slider.setLimits(150, 800, 10).setValue(field.cardWidth || 280).setDynamicTooltip()
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].cardWidth = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    new Setting(controls)
      .setName('卡片高度')
      .addSlider(slider => {
        slider.setLimits(100, 600, 10).setValue(field.cardHeight || 180).setDynamicTooltip()
// @ts-ignore
          .onChange(async value => {
// @ts-ignore
            this.plugin.settings.fields[index].cardHeight = value;
            await this.plugin.saveSettings();
// @ts-ignore
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

  }

  updateFontPreview(preview: HTMLElement, field: FieldStyle): void {
    const fontFamilyMap: Record<number, string> = {
      1: 'Excalifont', // 手写风格
      2: 'Helvetica', // 无衬线
      3: 'Cascadia', // 等宽字体
      4: 'Comic', // Comic Sans
    };

    preview.innerHTML =
      '<div style="height: 100%;">' +
        '<div style="margin-bottom: 16px; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">字体预览</div>' +
        '<div style="margin-bottom: 24px;">' +
          '<div style="font-size: ' + (field.titleFontSize || 14) + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; color: ' + field.textColor + '; margin-bottom: 8px; font-weight: 600;">' +
            '论文标题字体效果 Title Font Preview' +
          '</div>' +
          '<div style="font-size: ' + (field.metaFontSize || 11) + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + field.textColor + '; opacity: 0.85;">' +
            '这是正文字体效果示例 · Meta Font Example · 作者名 · arXiv · 2024' +
          '</div>' +
        '</div>' +
        '<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--background-modifier-border);">' +
          '<div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">字体设置信息</div>' +
          '<div style="font-size: 11px; color: var(--text-muted);">' +
            '标题: ' + (field.titleFontSize || 14) + 'px · ' +
            '正文: ' + (field.metaFontSize || 11) + 'px' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  updateFieldPreview(preview: HTMLElement, field: FieldStyle): void {
    const roundnessMap: Record<number, string> = {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '16px',
    };

    const fontFamilyMap: Record<number, string> = {
      1: 'Excalifont',
      2: 'Helvetica',
      3: 'Cascadia',
      4: 'Comic',
    };

    const scaleFactor = 0.4;
    const previewWidth = (field.cardWidth || 280) * scaleFactor;
    const previewHeight = (field.cardHeight || 180) * scaleFactor;

    preview.style.width = previewWidth + 'px';
    preview.style.height = previewHeight + 'px';
    preview.style.minWidth = previewWidth + 'px';
    preview.style.maxWidth = previewWidth + 'px';
    preview.style.minHeight = previewHeight + 'px';
    preview.style.maxHeight = previewHeight + 'px';
    preview.style.background = field.backgroundColor;
    preview.style.border = '2px solid ' + field.borderColor;
    preview.style.borderRadius = roundnessMap[field.roundness] || '8px';
    preview.style.opacity = (field.opacity / 100).toString();
    preview.style.transition = 'all 0.2s ease';
    preview.style.overflow = 'hidden';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';

    if (field.roughness > 0) {
      preview.style.boxShadow = field.roughness + 'px ' + field.roughness + 'px 0 rgba(0,0,0,0.1)';
    } else {
      preview.style.boxShadow = 'none';
    }

    const scaledTitleFontSize = (field.titleFontSize || 14) * scaleFactor;
    const scaledMetaFontSize = (field.metaFontSize || 11) * scaleFactor;
    const scaledPadding = 16 * scaleFactor;
    const sizeText = (field.cardWidth || 280) + ' x ' + (field.cardHeight || 180) + 'px';

    preview.innerHTML =
      '<div style="color: ' + field.textColor + '; padding: ' + scaledPadding + 'px; text-align: center; width: 100%;">' +
        '<strong style="font-size: ' + scaledTitleFontSize + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; display: block; margin-bottom: ' + (8 * scaleFactor) + 'px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + field.name + '</strong>' +
        '<div style="font-size: ' + scaledMetaFontSize + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">TITLE EXAMPLE</div>' +
        '<div style="margin-top: ' + (8 * scaleFactor) + 'px; font-size: ' + (10 * scaleFactor) + 'px; opacity: 0.6;">' + sizeText + '</div>' +
      '</div>';
  }

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
}
