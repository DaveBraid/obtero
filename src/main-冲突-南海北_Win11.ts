import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { ensureExcalidrawFile } from './excalidraw';
import { PaperSearchModal } from './PaperSearchModal';
import { DEFAULT_SETTINGS, MyPluginSettings, PaperPluginSettingTab } from './settings';

/** 用于类型安全地访问 Excalidraw 视图的最小接口 */
interface ExcalidrawViewLike {
	getViewType: () => string;
	file?: TFile;
	containerEl: HTMLElement;
}

export default class MyPaperPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// 侧边栏图标
		this.addRibbonIcon('book-open', '打开论文地图', async () => {
			await this.openOrCreatePaperMap();
		});

		// 命令：打开论文地图
		this.addCommand({
			id: 'open-paper-map',
			name: '打开论文地图',
			callback: async () => {
				await this.openOrCreatePaperMap();
			},
		});

		// 命令：添加论文
		this.addCommand({
			id: 'add-paper-to-map',
			name: '添加论文到地图',
			callback: async () => {
				const file = this.getPaperMapFile();
				if (!file) {
					new Notice('论文地图文件不存在，请先打开论文地图！');
					return;
				}
				new PaperSearchModal(this.app, file, () => this.refreshExcalidrawView()).open();
			},
		});

		// 设置页
		this.addSettingTab(new PaperPluginSettingTab(this.app, this));

		// 监听视图变化，尝试注入工具栏按钮
		this.registerEvent(
			this.app.workspace.on('layout-change', () => this.tryInjectButtons()),
		);
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => this.tryInjectButtons()),
		);

		// 布局就绪后再尝试一次（插件加载时视图可能已存在）
		this.app.workspace.onLayoutReady(() => {
			window.setTimeout(() => this.tryInjectButtons(), 500);
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** 论文地图文件的预期路径 */
	getTargetFilePath(): string {
		return `${this.settings.paperFolder}/${this.settings.excalidrawFileName}.excalidraw`;
	}

	/** 获取论文地图 TFile（不存在返回 null） */
	private getPaperMapFile(): TFile | null {
		const f = this.app.vault.getAbstractFileByPath(this.getTargetFilePath());
		return f instanceof TFile ? f : null;
	}

	/** 创建并打开论文地图 */
	async openOrCreatePaperMap(): Promise<void> {
		if (!this.settings.paperFolder) {
			new Notice('请先在插件设置中指定论文文件夹！');
			return;
		}
		try {
			const file = await ensureExcalidrawFile(
				this.app,
				this.settings.paperFolder,
				this.settings.excalidrawFileName,
			);
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);

			// 等待视图加载后注入按钮
			window.setTimeout(() => this.tryInjectButtons(), 700);
		} catch (err) {
			new Notice(`创建论文地图失败：${String(err)}`);
		}
	}

	/** 遍历所有 Leaf，对论文地图视图注入工具栏 */
	private tryInjectButtons(): void {
		const targetPath = this.getTargetFilePath();
		this.app.workspace.iterateAllLeaves((leaf) => {
			this.injectButtonsIntoLeaf(leaf, targetPath);
		});
	}

	/** 向指定 Leaf 注入工具栏按钮（已存在则跳过） */
	private injectButtonsIntoLeaf(leaf: WorkspaceLeaf, targetPath: string): void {
		const view = leaf.view as unknown as ExcalidrawViewLike;
		if (view.getViewType?.() !== 'excalidraw') return;
		if (view.file?.path !== targetPath) return;

		const container = view.containerEl;
		if (!container) return;

		// 已注入则跳过
		if (container.querySelector('.paper-plugin-toolbar')) return;

		// 等待 .view-content 就绪
		const viewContent = container.querySelector('.view-content') as HTMLElement | null;
		if (!viewContent) {
			window.setTimeout(() => this.injectButtonsIntoLeaf(leaf, targetPath), 350);
			return;
		}

		// 构建浮动工具栏
		const toolbar = createEl('div', { cls: 'paper-plugin-toolbar' });

		const addBtn = createEl('button', { cls: 'paper-plugin-action-btn mod-cta' });
		addBtn.innerHTML = '📝&nbsp;添加论文';
		addBtn.addEventListener('click', () => {
			const file = this.getPaperMapFile();
			if (!file) {
				new Notice('论文地图文件未找到，请先创建！');
				return;
			}
			new PaperSearchModal(this.app, file, () => this.refreshExcalidrawView()).open();
		});

		const refreshBtn = createEl('button', { cls: 'paper-plugin-action-btn' });
		refreshBtn.innerHTML = '🔄&nbsp;刷新绘图';
		refreshBtn.addEventListener('click', async () => {
			await this.refreshExcalidrawView();
		});

		toolbar.appendChild(addBtn);
		toolbar.appendChild(refreshBtn);

		viewContent.style.position = 'relative';
		viewContent.prepend(toolbar);
	}

	/** 关闭并重新打开 Excalidraw 视图以刷新内容 */
	async refreshExcalidrawView(): Promise<void> {
		const targetPath = this.getTargetFilePath();
		const file = this.getPaperMapFile();
		if (!file) return;

		let targetLeaf: WorkspaceLeaf | null = null;
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view as unknown as ExcalidrawViewLike;
			if (view.getViewType?.() === 'excalidraw' && view.file?.path === targetPath) {
				targetLeaf = leaf;
			}
		});

		if (targetLeaf) {
			// 移除旧工具栏，重新加载文件后再注入
			(targetLeaf as WorkspaceLeaf).view.containerEl
				.querySelector('.paper-plugin-toolbar')
				?.remove();
			await (targetLeaf as WorkspaceLeaf).openFile(file);
			window.setTimeout(() => this.tryInjectButtons(), 700);
		}
	}
}
