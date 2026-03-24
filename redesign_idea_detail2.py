#!/usr/bin/env python3
"""
重新设计灵感详情 Modal - 优化按钮布局
"""

import re
import shutil
import os

# 文件路径
script_dir = os.path.dirname(os.path.abspath(__file__))
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")
backup_file = os.path.join(script_dir, "src/ui/PaperView.ts.backup3")

# 备份原文件
shutil.copy(source_file, backup_file)
print(f"✓ 已备份原文件到 {backup_file}")

# 读取原文件
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 新的 showIdeaActionModal - 优化按钮布局
new_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-idea-detail-modal');

    // ── 头部区域 ────────────────────────────────────────────────────────
    const header = modal.contentEl.createDiv({ cls: 'pm-idea-detail-header' });

    // 标题和标签在同一行
    const titleRow = header.createDiv({ cls: 'pm-idea-detail-title-row' });

    // 标题
    titleRow.createEl('h2', {
      text: idea.title,
      cls: 'pm-idea-detail-title'
    });

    // 领域标签（如果有）
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = titleRow.createSpan({ cls: 'pm-idea-detail-tag' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = titleRow.createSpan({ cls: 'pm-idea-detail-tag' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 时间信息
    const date = new Date(idea.createdAt);
    header.createEl('div', {
      text: this.formatIdeaTime(date),
      cls: 'pm-idea-detail-time'
    });

    // ── 内容区域 ────────────────────────────────────────────────────────
    const body = modal.contentEl.createDiv({ cls: 'pm-idea-detail-body' });
    body.createEl('p', {
      text: idea.content,
      cls: 'pm-idea-detail-text'
    });

    // ── 操作按钮区域（右对齐，分散布局）────────────────────────────────
    const actions = modal.contentEl.createDiv({ cls: 'pm-idea-detail-actions' });

    // 主操作：归入英灵殿（左侧，最突出）
    const valhallaBtn = actions.createEl('button', {
      text: '✨ 归入英灵殿',
      cls: 'pm-idea-action-btn pm-idea-action-primary'
    });
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    // 次要操作：取消（中间）
    const cancelBtn = actions.createEl('button', {
      text: '取消',
      cls: 'pm-idea-action-btn pm-idea-action-secondary'
    });
    cancelBtn.addEventListener('click', () => modal.close());

    // 危险操作：删除（右侧）
    const deleteBtn = actions.createEl('button', {
      text: '删除',
      cls: 'pm-idea-action-btn pm-idea-action-destructive'
    });
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    valhallaBtn.focus(); // 聚焦主操作按钮
  }'''

# 替换 showIdeaActionModal
pattern = r'  private showIdeaActionModal\(idea: IdeaItem, parentModal: Modal\): void \{[\s\S]*?valhallaBtn\.focus\(\); // 聚焦主操作按钮\s*\}'
content = re.sub(pattern, new_modal, content, count=1)

# 保存
with open(source_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 灵感详情 Modal 已重新设计！")
print("🎨 新布局特点：")
print("  • 标题和标签在同一行")
print("  • 按钮右对齐，分散布局")
print("  • 主操作（归入英灵殿）最突出")
print("  • 更清晰的视觉层级")
