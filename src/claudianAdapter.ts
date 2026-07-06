import type { App } from 'obsidian';
import { normalizeClaudianModel } from './paperMetadata';

interface PluginRegistry {
  plugins?: Record<string, unknown>;
}

interface AppWithPlugins extends App {
  plugins?: PluginRegistry;
}

interface ClaudianPluginInternal {
  ensureViewOpen?: () => Promise<ClaudianViewInternal | null>;
  getView?: () => ClaudianViewInternal | null;
}

interface ClaudianViewInternal {
  getTabManager?: () => ClaudianTabManagerInternal | null;
}

interface ClaudianTabManagerInternal {
  createTab?: (
    conversationId?: string,
    tabId?: string,
    options?: { draftModel?: string }
  ) => Promise<ClaudianTabInternal | null>;
  getActiveTab?: () => ClaudianTabInternal | null;
}

interface ClaudianTabInternal {
  state?: {
    isStreaming?: boolean;
    messages?: ClaudianMessageInternal[];
  };
  controllers?: {
    inputController?: {
      sendMessage?: (options?: { content?: string }) => Promise<void> | void;
    };
  };
}

interface ClaudianMessageInternal {
  role?: string;
  content?: unknown;
  displayContent?: unknown;
  text?: unknown;
}

export async function sendPromptToClaudian(
  app: App,
  prompt: string,
  model: string,
  timeoutMs = 120000
): Promise<string> {
  const claudian = getClaudianPlugin(app);
  if (!claudian) {
    throw new Error('未检测到 Claudian 插件 realclaudian');
  }

  const view = await ensureClaudianView(claudian);
  const tabManager = view.getTabManager?.();
  if (!tabManager) {
    throw new Error('无法访问 Claudian 会话管理器');
  }

  const tab = await createClaudianTab(tabManager, normalizeClaudianModel(model));
  const inputController = tab.controllers?.inputController;
  if (!inputController?.sendMessage) {
    throw new Error('无法访问 Claudian 输入控制器');
  }

  const initialMessageCount = tab.state?.messages?.length || 0;
  await inputController.sendMessage({ content: prompt });
  await waitForClaudianTurn(tab, initialMessageCount, timeoutMs);

  const assistantText = getLatestAssistantMessageText(tab, initialMessageCount);
  if (!assistantText) {
    throw new Error('Claudian 没有返回可解析内容');
  }
  return assistantText;
}

function getClaudianPlugin(app: App): ClaudianPluginInternal | null {
  const plugins = (app as AppWithPlugins).plugins?.plugins;
  const candidate = plugins?.realclaudian;
  return isClaudianPlugin(candidate) ? candidate : null;
}

function isClaudianPlugin(value: unknown): value is ClaudianPluginInternal {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.ensureViewOpen === 'function' || typeof value.getView === 'function';
}

async function ensureClaudianView(claudian: ClaudianPluginInternal): Promise<ClaudianViewInternal> {
  const existingView = claudian.getView?.();
  if (existingView?.getTabManager) {
    return existingView;
  }
  const openedView = await claudian.ensureViewOpen?.();
  const view = openedView || claudian.getView?.();
  if (!view?.getTabManager) {
    throw new Error('无法打开 Claudian 视图');
  }
  return view;
}

async function createClaudianTab(
  tabManager: ClaudianTabManagerInternal,
  model: string
): Promise<ClaudianTabInternal> {
  if (tabManager.createTab) {
    const tab = await tabManager.createTab(undefined, undefined, { draftModel: model });
    if (tab) {
      return tab;
    }
  }

  const activeTab = tabManager.getActiveTab?.();
  if (activeTab?.state?.isStreaming) {
    throw new Error('Claudian 当前会话正在运行，无法复用');
  }
  if (activeTab) {
    return activeTab;
  }
  throw new Error('无法创建 Claudian 会话');
}

async function waitForClaudianTurn(
  tab: ClaudianTabInternal,
  initialMessageCount: number,
  timeoutMs: number
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const messages = tab.state?.messages || [];
    const hasNewAssistantMessage = messages
      .slice(initialMessageCount)
      .some(message => message.role === 'assistant' && extractMessageText(message).length > 0);
    if (!tab.state?.isStreaming && hasNewAssistantMessage) {
      return;
    }
    await sleep(500);
  }
  throw new Error('Claudian 元数据补全超时');
}

function getLatestAssistantMessageText(tab: ClaudianTabInternal, initialMessageCount: number): string {
  const messages = tab.state?.messages || [];
  const assistant = messages
    .slice(initialMessageCount)
    .reverse()
    .find(message => message.role === 'assistant');
  return assistant ? extractMessageText(assistant) : '';
}

function extractMessageText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(extractMessageText).filter(Boolean).join('\n');
  }
  if (!isRecord(value)) {
    return '';
  }

  const directText = normalizeString(value.text) || normalizeString(value.displayContent);
  if (directText) {
    return directText;
  }
  return extractMessageText(value.content);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}
