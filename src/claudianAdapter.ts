import type { App } from 'obsidian';
import { normalizeClaudianModel } from './paperMetadata';

interface PluginRegistry {
  plugins?: Record<string, unknown>;
}

interface AppWithPlugins extends App {
  plugins?: PluginRegistry;
}

interface ClaudianPluginInternal {
  deleteConversation?: (conversationId: string) => Promise<void> | void;
  ensureViewOpen?: () => Promise<ClaudianViewInternal | null>;
  getView?: () => ClaudianViewInternal | null;
  queryAuxiliary?: ClaudianHeadlessMethod;
  runAuxiliaryPrompt?: ClaudianHeadlessMethod;
  runHeadlessPrompt?: ClaudianHeadlessMethod;
  sendAuxiliaryPrompt?: ClaudianHeadlessMethod;
  sendHeadlessPrompt?: ClaudianHeadlessMethod;
}

interface ClaudianViewInternal {
  leaf?: {
    detach?: () => void;
  };
  getTabManager?: () => ClaudianTabManagerInternal | null;
}

interface ClaudianTabManagerInternal {
  createTab?: (
    conversationId?: string,
    tabId?: string,
    options?: { activate?: boolean; draftModel?: string }
  ) => Promise<ClaudianTabInternal | null>;
  closeTab?: (tabId: string, force?: boolean) => Promise<boolean> | boolean;
  getActiveTab?: () => ClaudianTabInternal | null;
}

interface ClaudianTabInternal {
  id?: string;
  conversationId?: string | null;
  state?: {
    currentConversationId?: string | null;
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

type ClaudianHeadlessMethod = (promptOrOptions: unknown, options?: unknown) => Promise<unknown>;

interface ClaudianSession {
  tab: ClaudianTabInternal;
  created: boolean;
}

interface ClaudianViewSession {
  view: ClaudianViewInternal;
  openedByAdapter: boolean;
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

  const headlessResponse = await trySendPromptToClaudianHeadless(
    claudian,
    prompt,
    normalizeClaudianModel(model)
  );
  if (headlessResponse) {
    return headlessResponse;
  }

  const viewSession = await ensureClaudianView(claudian);
  const { view } = viewSession;
  const tabManager = view.getTabManager?.();
  if (!tabManager) {
    throw new Error('无法访问 Claudian 会话管理器');
  }

  const session = await createClaudianSession(tabManager, normalizeClaudianModel(model));
  const { tab } = session;
  const inputController = tab.controllers?.inputController;
  if (!inputController?.sendMessage) {
    throw new Error('无法访问 Claudian 输入控制器');
  }

  try {
    const initialMessageCount = tab.state?.messages?.length || 0;
    await inputController.sendMessage({ content: prompt });
    await waitForClaudianTurn(tab, initialMessageCount, timeoutMs);

    const assistantText = getLatestAssistantMessageText(tab, initialMessageCount);
    if (!assistantText) {
      throw new Error('Claudian 没有返回可解析内容');
    }
    return assistantText;
  } finally {
    await cleanupTemporaryClaudianSession(claudian, viewSession, tabManager, session);
  }
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
  return (
    typeof value.ensureViewOpen === 'function' ||
    typeof value.getView === 'function' ||
    getHeadlessMethod(value) !== null
  );
}

async function trySendPromptToClaudianHeadless(
  claudian: ClaudianPluginInternal,
  prompt: string,
  model: string
): Promise<string | null> {
  const method = getHeadlessMethod(claudian);
  if (!method) {
    return null;
  }

  const result = await method.call(claudian, prompt, {
    model,
    persistHistory: false,
    persistExtendedHistory: false,
    visible: false,
  });
  const text = extractHeadlessResultText(result);
  if (!text) {
    throw new Error('Claudian 后台调用没有返回可解析内容');
  }
  return text;
}

function getHeadlessMethod(value: unknown): ClaudianHeadlessMethod | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidates = [
    value.runHeadlessPrompt,
    value.sendHeadlessPrompt,
    value.runAuxiliaryPrompt,
    value.sendAuxiliaryPrompt,
    value.queryAuxiliary,
  ];
  const method = candidates.find(candidate => typeof candidate === 'function');
  return typeof method === 'function' ? method as ClaudianHeadlessMethod : null;
}

function extractHeadlessResultText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (!isRecord(value)) {
    return '';
  }

  return (
    normalizeString(value.text) ||
    normalizeString(value.response) ||
    normalizeString(value.message) ||
    extractMessageText(value.content)
  );
}

async function ensureClaudianView(claudian: ClaudianPluginInternal): Promise<ClaudianViewSession> {
  const existingView = claudian.getView?.();
  if (existingView?.getTabManager) {
    return { view: existingView, openedByAdapter: false };
  }
  const openedView = await claudian.ensureViewOpen?.();
  const view = openedView || claudian.getView?.();
  if (!view?.getTabManager) {
    throw new Error('无法打开 Claudian 视图');
  }
  return { view, openedByAdapter: true };
}

async function createClaudianSession(
  tabManager: ClaudianTabManagerInternal,
  model: string
): Promise<ClaudianSession> {
  if (tabManager.createTab) {
    const tab = await tabManager.createTab(undefined, undefined, { activate: false, draftModel: model });
    if (tab) {
      return { tab, created: true };
    }
  }

  const activeTab = tabManager.getActiveTab?.();
  if (activeTab?.state?.isStreaming) {
    throw new Error('Claudian 当前会话正在运行，无法复用');
  }
  if (activeTab) {
    return { tab: activeTab, created: false };
  }
  throw new Error('无法创建 Claudian 会话');
}

async function cleanupTemporaryClaudianSession(
  claudian: ClaudianPluginInternal,
  viewSession: ClaudianViewSession,
  tabManager: ClaudianTabManagerInternal,
  session: ClaudianSession
): Promise<void> {
  if (session.created) {
    const conversationId = getTabConversationId(session.tab);
    if (session.tab.id && tabManager.closeTab) {
      await Promise.resolve(tabManager.closeTab(session.tab.id, true)).catch(error => {
        console.warn('[Obtero] Failed to close temporary Claudian tab:', error);
      });
    }
    if (conversationId && claudian.deleteConversation) {
      await Promise.resolve(claudian.deleteConversation(conversationId)).catch(error => {
        console.warn('[Obtero] Failed to delete temporary Claudian conversation:', error);
      });
    }
  }

  if (viewSession.openedByAdapter) {
    viewSession.view.leaf?.detach?.();
  }
}

function getTabConversationId(tab: ClaudianTabInternal): string {
  return normalizeString(tab.conversationId) || normalizeString(tab.state?.currentConversationId);
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
