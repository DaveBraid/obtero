import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, PaperSettingTab } from './settings';
import { PAPER_VIEW_TYPE, PaperView } from './ui/PaperView';
import { SetupModal } from './ui/SetupModal';

export default class PaperPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(PAPER_VIEW_TYPE, leaf => new PaperView(leaf, this));

    this.addRibbonIcon('book-open', '论文管理', () => this.openPaperView());

    this.addCommand({
      id: 'open-paper-manager',
      name: '打开论文管理界面',
      callback: () => this.openPaperView(),
    });

    this.addSettingTab(new PaperSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.workspaceFolder) {
        new SetupModal(this.app, this, () => this.openPaperView()).open();
      }
    });
  }

  onunload(): void {}

  async openPaperView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(PAPER_VIEW_TYPE);
    if (existing.length > 0 && existing[0]) {
      workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeaf(false);
    await leaf.setViewState({ type: PAPER_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<MyPluginSettings>
    );

    // 确保所有领域都有字体属性（数据迁移）
    this.settings.fields = this.settings.fields.map(field => ({
      ...field,
      titleFontSize: field.titleFontSize ?? 14,
      titleFontFamily: field.titleFontFamily ?? 1,
      metaFontSize: field.metaFontSize ?? 11,
      metaFontFamily: field.metaFontFamily ?? 1,
    }));
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
