#!/usr/bin/env python3
"""
优化灵感管理 UI - 自动替换脚本
将 PaperView.ts 中的灵感相关 Modal 替换为 Apple HIG 风格的优化版本
"""

import re
import shutil
import os

# 文件路径（相对于脚本所在目录）
script_dir = os.path.dirname(os.path.abspath(__file__))
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")
backup_file = os.path.join(script_dir, "src/ui/PaperView.ts.backup")

# 备份原文件
shutil.copy(source_file, backup_file)
print(f"✓ 已备份原文件到 {backup_file}")

# 读取原文件
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# ─────────────────────────────────────────────────────────────
# 新的优化代码
# ─────────────────────────────────────────────────────────────

new_ideas_library_modal = '''  private showIdeasLibraryModal(): void {
    const modal = new Modal(this.app);
    const { contentEl } = modal;

    // 标题栏 - 清晰简洁
    const header = contentEl.createDiv({ cls: 'pm-modal-header' });
    header.createEl('h2', {
      text: '灵感库',
      cls: 'pm-modal-title'
    });

    const ideas = (this.plugin.settings.ideas || []).filter(idea => !idea.inValhalla);

    // 空状态 - 友好引导
    if (ideas.length === 0) {
      const empty = contentEl.createDiv({ cls: 'pm-empty' });
      empty.createDiv({
        text: '📝',
        cls: 'pm-empty-icon'
      });
      empty.createDiv({
        cls: 'pm-empty-text',
        text: '暂无灵感'
      });
      empty.createDiv({
        cls: 'pm-empty-hint',
        text: '点击下方"记录灵感"开始收集吧'
      });
    } else {
      const list = contentEl.createDiv({ cls: 'pm-ideas-list' });
      for (const idea of ideas) {
        this.renderIdeaListItem(list, idea, modal);
      }
    }

    modal.open();
  }'''

new_show_idea_delete_confirm_modal = '''  private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-idea-delete-modal');

    // 标题
    const header = modal.contentEl.createDiv({ cls: 'pm-modal-header' });
    header.createEl('h2', {
      text: '删除灵感',
      cls: 'pm-modal-title'
    });

    // 内容区域
    const content = modal.contentEl.createDiv({ cls: 'pm-modal-content' });
    content.createEl('p', {
      text: `确定要删除«${idea.title}»吗？此操作不可撤销。`,
      cls: 'pm-modal-warning-text'
    });

    // 按钮区域 - Apple HIG: 左侧取消，右侧危险操作
    const buttonContainer = modal.contentEl.createDiv({ cls: 'pm-modal-actions' });

    // 取消按钮 - 左侧
    const cancelBtn = buttonContainer.createEl('button', {
      text: '取消',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    cancelBtn.addEventListener('click', () => modal.close());

    // 确认删除按钮 - 右侧，危险样式
    const confirmBtn = buttonContainer.createEl('button', {
      text: '删除',
      cls: 'pm-modal-btn pm-modal-btn-destructive'
    });
    confirmBtn.addEventListener('click', () => {
      this.plugin.deleteIdea(idea.id);
      new Notice('✓ 灵感已删除');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    modal.open();
    cancelBtn.focus();
  }'''

new_show_idea_action_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-idea-detail-modal');

    // 头部区域：标题行（标题 + 标签）
    const header = modal.contentEl.createDiv({ cls: 'pm-modal-header' });

    const titleRow = header.createDiv({ cls: 'pm-modal-title-row' });

    // 标题
    titleRow.createEl('h2', {
      text: idea.title,
      cls: 'pm-modal-title'
    });

    // 领域标签
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = titleRow.createSpan({ cls: 'pm-modal-tag' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = titleRow.createSpan({ cls: 'pm-modal-tag' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 时间信息
    const date = new Date(idea.createdAt);
    header.createEl('p', {
      text: this.formatIdeaTime(date),
      cls: 'pm-modal-time'
    });

    // 内容区域
    const content = modal.contentEl.createDiv({ cls: 'pm-modal-body' });
    content.createEl('p', {
      text: idea.content,
      cls: 'pm-modal-text'
    });

    // 操作按钮区域 - Apple HIG: Cancel -> Primary -> Destructive
    const actions = modal.contentEl.createDiv({ cls: 'pm-modal-actions' });

    // 取消按钮 - 左侧
    const cancelBtn = actions.createEl('button', {
      text: '取消',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    cancelBtn.addEventListener('click', () => modal.close());

    // 主操作：归入英灵殿 - 中间（最突出）
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

    // 危险操作：删除 - 右侧（文本按钮）
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

# ─────────────────────────────────────────────────────────────
# 执行替换
# ─────────────────────────────────────────────────────────────

# 替换 showIdeasLibraryModal
pattern1 = r'  private showIdeasLibraryModal\(\): void \{[\s\S]*?modal\.open\(\);\s*\}'
content = re.sub(pattern1, new_ideas_library_modal, content, count=1)
print("✓ 已替换 showIdeasLibraryModal")

# 替换 showIdeaDeleteConfirmModal
pattern3 = r'  private showIdeaDeleteConfirmModal\(idea: IdeaItem, parentModal: Modal\): void \{[\s\S]*?cancelBtn\.focus\(\);\s*\}'
content = re.sub(pattern3, new_show_idea_delete_confirm_modal, content, count=1)
print("✓ 已替换 showIdeaDeleteConfirmModal")

# 替换 showIdeaActionModal
pattern4 = r'  private showIdeaActionModal\(idea: IdeaItem, parentModal: Modal\): void \{[\s\S]*?valhallaBtn\.focus\(\);\s*\}'
content = re.sub(pattern4, new_show_idea_action_modal, content, count=1)
print("✓ 已替换 showIdeaActionModal")

# 保存修改后的文件
with open(source_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 所有灵感管理 UI 已优化完成！")
print(f"📝 原文件已备份到: {backup_file}")
print("\n🎨 优化内容：")
print("  • 改进了视觉层级和间距")
print("  • 优化了按钮布局（Apple HIG 风格）")
print("  • 增强了空状态提示")
print("  • 统一了 Modal 样式")
