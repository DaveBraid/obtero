import re

# 读取 fileUtils.ts
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 添加翻译工具的导入
old_import = "import { App, TFile, TFolder, normalizePath } from 'obsidian';\nimport { MyPluginSettings } from '../settings';\nimport { PaperInfo } from '../types';"

new_import = "import { App, TFile, TFolder, normalizePath } from 'obsidian';\nimport { MyPluginSettings } from '../settings';\nimport { PaperInfo } from '../types';\nimport { translateText } from './translationUtils';"

content = content.replace(old_import, new_import)

# 修改 createPaperFile 函数签名和实现
old_create = '''export async function createPaperFile(
  app: App,
  settings: MyPluginSettings,
  paper: PaperInfo,
  category: string
): Promise<TFile | null> {'''

new_create = '''export async function createPaperFile(
  app: App,
  settings: MyPluginSettings,
  paper: PaperInfo,
  category: string
): Promise<TFile | null> {'''

content = content.replace(old_create, new_create)

# 在 createPaperFile 中添加翻译逻辑
# 找到 buildPaperContent 调用，并添加翻译参数
old_build_call = "    return await app.vault.create(filePath, buildPaperContent(paper));"

new_build_call = """    // 翻译摘要（如果启用）
    let translatedAbstract = '';
    if (settings.translateAbstract && settings.siliconflowApiKey && paper.abstract) {
      try {
        translatedAbstract = await translateText(paper.abstract, settings.siliconflowApiKey);
      } catch (error) {
        console.error('[PaperPlugin] 翻译失败:', error);
        // 翻译失败不影响创建文件，只是不添加翻译
      }
    }

    return await app.vault.create(filePath, buildPaperContent(paper, translatedAbstract));"""

content = content.replace(old_build_call, new_build_call)

# 修改 buildPaperContent 函数签名
old_build_sig = "function buildPaperContent(paper: PaperInfo): string {"

new_build_sig = "function buildPaperContent(paper: PaperInfo, translatedAbstract: string = ''): string {"

content = content.replace(old_build_sig, new_build_sig)

# 在摘要部分添加翻译内容
old_abstract = '''  if (paper.abstract) {
    lines.push('', '## 摘要', '', paper.abstract);
  }
  lines.push('', '## 笔记', '', '');'''

new_abstract = '''  if (paper.abstract) {
    lines.push('', '## 摘要', '', paper.abstract);
  }
  if (translatedAbstract) {
    lines.push('', '## 摘要翻译', '', translatedAbstract);
  }
  lines.push('', '## 笔记', '', '');'''

content = content.replace(old_abstract, new_abstract)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ fileUtils.ts: 已添加翻译功能支持")
