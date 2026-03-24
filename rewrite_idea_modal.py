#!/usr/bin/env python3
"""
完全重写灵感详情 Modal - 确保改变生效
"""

import re
import shutil
import os

# 文件路径
script_dir = os.path.dirname(os.path.abspath(__file__))
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")
backup_file = os.path.join(script_dir, "src/ui/PaperView.ts.backup_final")

# 备份原文件
shutil.copy(source_file, backup_file)
print(f"✓ 已备份原文件到 {backup_file}")

# 读取原文件
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 完全重写 showIdeaActionModal - 全新的实现
new_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);

    // 设置 Modal 容器样式
    modal.modalEl.style.cssText = `
      max-width: 500px;
      width: 90vw;
    `;

    // 主容器
    const container = modal.contentEl.createDiv();
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--background-primary);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    `;

    // ── 头部区域 ────────────────────────────────────────
    const header = container.createDiv();
    header.style.cssText = `
      padding: 24px;
      background: var(--background-secondary);
      border-bottom: 1px solid var(--background-modifier-border);
    `;

    // 标题和标签在同一行
    const titleRow = header.createDiv();
    titleRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    `;

    // 标题
    const title = titleRow.createEl('h2', { text: idea.title });
    title.style.cssText = `
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--text-normal);
      line-height: 1.3;
      flex: 1;
    `;

    // 领域标签
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = titleRow.createSpan({ text: idea.field });
        tag.style.cssText = `
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          background-color: ${fieldStyle.backgroundColor};
          color: ${this.getContrastColor(fieldStyle.backgroundColor)};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        `;
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = titleRow.createSpan({ text: '自定义' });
      tag.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        background-color: ${idea.color};
        color: ${this.getContrastColor(idea.color)};
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      `;
      tag.textContent = '自定义';
    }

    // 时间信息
    const date = new Date(idea.createdAt);
    const timeEl = header.createDiv({ text: this.formatIdeaTime(date) });
    timeEl.style.cssText = `
      font-size: 13px;
      color: var(--text-faint);
      font-weight: 500;
      padding-left: 4px;
    `;

    // ── 内容区域 ────────────────────────────────────────
    const body = container.createDiv();
    body.style.cssText = `
      padding: 20px 24px;
      background: var(--background-primary);
    `;

    const content = body.createEl('p', { text: idea.content });
    content.style.cssText = `
      margin: 0;
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-normal);
      font-weight: 400;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    // ── 按钮区域（右对齐）───────────────────────────────
    const actions = container.createDiv();
    actions.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px 24px;
      background: var(--background-secondary);
      border-top: 1px solid var(--background-modifier-border);
    `;

    // 主操作：归入英灵殿
    const valhallaBtn = actions.createEl('button', { text: '✨ 归入英灵殿' });
    valhallaBtn.style.cssText = `
      min-height: 38px;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--interactive-accent);
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    `;
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    // 次要操作：取消
    const cancelBtn = actions.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = `
      min-height: 38px;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--background-modifier-border);
      background: var(--background-primary);
      color: var(--text-normal);
      transition: all 0.2s ease;
    `;
    cancelBtn.addEventListener('click', () => modal.close());

    // 危险操作：删除
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = `
      min-height: 38px;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-error);
      transition: all 0.2s ease;
    `;
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    valhallaBtn.focus();
  }'''

# 替换 showIdeaActionModal 方法
pattern = r'  private showIdeaActionModal\(idea: IdeaItem, parentModal: Modal\): void \{[\s\S]*?valhallaBtn\.focus\(\);\s*\}'
content = re.sub(pattern, new_modal, content, count=1)

# 保存
with open(source_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 灵感详情 Modal 已完全重写！")
print("")
print("🎨 新设计特点：")
print("  ✓ 使用内联样式，确保立即生效")
print("  ✓ 标题和标签在同一行")
print("  ✓ 按钮右对齐（justify-content: flex-end）")
print("  ✓ 按钮间距统一（gap: 12px）")
print("  ✓ 三层卡片布局（头部、内容、按钮）")
print("  ✓ 主操作按钮最突出（蓝色实心）")
print("")
print("📝 下一步：")
print("  1. 运行 npm run build 编译插件")
print("  2. 在 Obsidian 中重新加载（Ctrl+R / Cmd+R）")
print("  3. 打开灵感库并点击任意灵感查看效果")
