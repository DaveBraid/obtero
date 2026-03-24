#!/usr/bin/env python3
"""
重新设计灵感详情 Modal - 更优雅的布局
"""

import re
import shutil
import os

# 文件路径
script_dir = os.path.dirname(os.path.abspath(__file__))
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")
backup_file = os.path.join(script_dir, "src/ui/PaperView.ts.backup2")

# 备份原文件
shutil.copy(source_file, backup_file)
print(f"✓ 已备份原文件到 {backup_file}")

# 读取原文件
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 新的 showIdeaActionModal - 更优雅的设计
new_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-idea-detail-modal');
    modal.modalEl.addClass('pm-modal-wide'); // 更宽的 Modal

    // ── 头部卡片 ────────────────────────────────────────────────────────
    const header = modal.contentEl.createDiv({ cls: 'pm-idea-detail-header' });

    // 顶部：标题行（包含标签）
    const titleSection = header.createDiv({ cls: 'pm-idea-detail-title-section' });

    // 标题
    const titleEl = titleSection.createEl('h2', {
      text: idea.title,
      cls: 'pm-idea-detail-title'
    });

    // 领域标签（如果有）
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = titleSection.createSpan({ cls: 'pm-idea-detail-tag' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = titleSection.createSpan({ cls: 'pm-idea-detail-tag' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 时间信息 - 单独一行，灰色小字
    const date = new Date(idea.createdAt);
    const timeEl = header.createEl('div', {
      text: this.formatIdeaTime(date),
      cls: 'pm-idea-detail-time'
    });

    // ── 内容卡片 ────────────────────────────────────────────────────────
    const bodyCard = modal.contentEl.createDiv({ cls: 'pm-idea-detail-body-card' });
    const content = bodyCard.createDiv({ cls: 'pm-idea-detail-content' });
    content.createEl('p', {
      text: idea.content,
      cls: 'pm-idea-detail-text'
    });

    // ── 操作按钮区域 ────────────────────────────────────────────────────
    const actions = modal.contentEl.createDiv({ cls: 'pm-modal-actions' });

    // 左侧：取消按钮
    const cancelBtn = actions.createEl('button', {
      text: '取消',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    cancelBtn.addEventListener('click', () => modal.close());

    // 中间：主操作 - 归入英灵殿
    const valhallaBtn = actions.createEl('button', {
      text: '✨ 归入英灵殿',
      cls: 'pm-modal-btn pm-modal-btn-primary'
    });
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    // 右侧：危险操作 - 删除
    const deleteBtn = actions.createEl('button', {
      text: '删除',
      cls: 'pm-modal-btn pm-modal-btn-text pm-modal-btn-destructive-text'
    });
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    valhallaBtn.focus(); // 聚焦主操作按钮
  }'''

# 替换 showIdeaActionModal
pattern = r'  private showIdeaActionModal\(idea: IdeaItem, parentModal: Modal\): void \{[\s\S]*?cancelBtn\.focus\(\);\s*\}'
content = re.sub(pattern, new_modal, content, count=1)

# 保存
with open(source_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 灵感详情 Modal 已重新设计！")
print("🎨 新布局特点：")
print("  • 更宽的 Modal（600px）")
print("  • 卡片式头部（标题 + 标签 + 时间）")
print("  • 独立的内容卡片（阴影 + 圆角）")
print("  • Apple HIG 按钮布局（取消 | 归入英灵殿 | 删除）")
print("  • 聚焦主操作按钮")
