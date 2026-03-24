#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

# 文件路径
file_path = "/home/andew/Nutstore Files/我的坚果云/Obsidian/.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts"

# 读取文件
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复 showIdeaActionModal 函数 - 添加完整的查看/编辑模式
old_action_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);

    // 设置 Modal 容器
    modal.modalEl.style.cssText = 'max-width: 500px; width: 90vw;';

    // 主容器
    const container = modal.contentEl.createDiv();
    container.style.cssText = 'display: flex; flex-direction: column; gap: 0; background: var(--background-primary); border-radius: 12px; overflow: hidden; box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);';

    // 编辑模式状态
    let isEditMode = false;

    // 头部
    const header = container.createDiv();
    header.style.cssText = 'padding: 24px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border);';

    // 标题行
    const titleRow = header.createDiv();
    titleRow.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;';

    // 标题容器（用于切换显示模式）
    const titleContainer = titleRow.createDiv();
    titleContainer.style.cssText = 'flex: 1;';

    // 查看模式的标题
    const titleDisplay = titleContainer.createEl('div', { text: idea.title });
    titleDisplay.style.cssText = 'font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3;';

    // 编辑模式的标题输入框（初始隐藏）
    const titleInput = titleContainer.createEl('input', { type: 'text' });
    titleInput.value = idea.title;
    titleInput.style.cssText = 'display: none; width: 100%; margin: 0; font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3; padding: 4px 8px; border: 1px solid var(--interactive-accent); border-radius: 4px; background: var(--background-primary);';

    // 归入英灵殿
    const valhallaBtn = actions.createEl('button', { text: '✨ 归入英灵殿' });
    valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    // 删除
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);';
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    titleInput.focus();
  }'''

new_action_modal = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-idea-detail-modal');

    // 编辑模式状态
    let isEditMode = false;

    // ── 头部区域 ────────────────────────────────────────────────────────
    const header = modal.contentEl.createDiv({ cls: 'pm-idea-detail-header' });

    // 标题和标签在同一行
    const titleRow = header.createDiv({ cls: 'pm-idea-detail-title-row' });

    // 标题容器（支持查看/编辑切换）
    const titleContainer = titleRow.createDiv({ cls: 'pm-idea-detail-title-container' });

    // 查看模式：标题显示
    const titleDisplay = titleContainer.createEl('h2', {
      text: idea.title,
      cls: 'pm-idea-detail-title'
    });

    // 编辑模式：标题输入框（初始隐藏）
    const titleInput = titleContainer.createEl('input', {
      type: 'text',
      value: idea.title,
      cls: 'pm-idea-detail-title-input'
    });
    titleInput.style.display = 'none';

    // 领域标签（只在查看模式显示）
    const tagContainer = titleRow.createDiv({ cls: 'pm-idea-detail-tag-container' });
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = tagContainer.createSpan({ cls: 'pm-idea-detail-tag' });
        tag.textContent = idea.field;
        tag.style.backgroundColor = fieldStyle.backgroundColor;
        tag.style.color = this.getContrastColor(fieldStyle.backgroundColor);
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = tagContainer.createSpan({ cls: 'pm-idea-detail-tag' });
      tag.textContent = '自定义';
      tag.style.backgroundColor = idea.color;
      tag.style.color = this.getContrastColor(idea.color);
    }

    // 时间信息
    const date = new Date(idea.createdAt);
    const timeEl = header.createEl('div', {
      text: this.formatIdeaTime(date),
      cls: 'pm-idea-detail-time'
    });

    // ── 内容区域 ────────────────────────────────────────────────────────
    const body = modal.contentEl.createDiv({ cls: 'pm-idea-detail-body' });

    // 查看模式：内容显示
    const contentDisplay = body.createEl('p', {
      text: idea.content,
      cls: 'pm-idea-detail-text'
    });

    // 编辑模式：内容输入框（初始隐藏）
    const contentInput = body.createEl('textarea', {
      value: idea.content,
      cls: 'pm-idea-detail-textarea'
    });
    contentInput.rows = 6;
    contentInput.style.display = 'none';

    // ── 操作按钮区域 ───────────────────────────────────────────────────
    const actions = modal.contentEl.createDiv({ cls: 'pm-modal-actions' });

    // 查看模式按钮组
    const viewModeButtons = actions.createDiv({ cls: 'pm-button-group' });

    const editBtn = viewModeButtons.createEl('button', {
      text: '编辑',
      cls: 'pm-modal-btn pm-modal-btn-primary'
    });
    editBtn.addEventListener('click', () => {
      isEditMode = true;
      // 切换到编辑模式
      titleDisplay.style.display = 'none';
      titleInput.style.display = 'block';
      titleInput.focus();
      tagContainer.style.display = 'none';
      contentDisplay.style.display = 'none';
      contentInput.style.display = 'block';
      // 切换按钮
      viewModeButtons.style.display = 'none';
      editModeButtons.style.display = 'flex';
    });

    const valhallaBtn = viewModeButtons.createEl('button', {
      text: '✨ 归入英灵殿',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    const cancelViewBtn = viewModeButtons.createEl('button', {
      text: '取消',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    cancelViewBtn.addEventListener('click', () => modal.close());

    const deleteViewBtn = viewModeButtons.createEl('button', {
      text: '删除',
      cls: 'pm-modal-btn pm-modal-btn-destructive'
    });
    deleteViewBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    // 编辑模式按钮组（初始隐藏）
    const editModeButtons = actions.createDiv({ cls: 'pm-button-group' });
    editModeButtons.style.display = 'none';

    const saveBtn = editModeButtons.createEl('button', {
      text: '保存',
      cls: 'pm-modal-btn pm-modal-btn-primary'
    });
    saveBtn.addEventListener('click', async () => {
      const newTitle = titleInput.value.trim();
      const newContent = contentInput.value.trim();

      if (!newTitle || !newContent) {
        new Notice('标题和内容不能为空');
        return;
      }

      // 更新灵感
      const ideas = this.plugin.settings.ideas || [];
      const ideaIndex = ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1 && ideas[ideaIndex]) {
        ideas[ideaIndex]!.title = newTitle;
        ideas[ideaIndex]!.content = newContent;
        await this.plugin.saveSettings();
        new Notice('✓ 灵感已更新');
        modal.close();
        parentModal.close();
        this.showIdeasLibraryModal();
        this.render();
      }
    });

    const cancelEditBtn = editModeButtons.createEl('button', {
      text: '取消',
      cls: 'pm-modal-btn pm-modal-btn-secondary'
    });
    cancelEditBtn.addEventListener('click', () => {
      // 重置输入值
      titleInput.value = idea.title;
      contentInput.value = idea.content;
      // 切换回查看模式
      isEditMode = false;
      titleDisplay.style.display = 'block';
      titleInput.style.display = 'none';
      tagContainer.style.display = 'flex';
      contentDisplay.style.display = 'block';
      contentInput.style.display = 'none';
      // 切换按钮
      viewModeButtons.style.display = 'flex';
      editModeButtons.style.display = 'none';
    });

    modal.open();
  }'''

# 替换
if old_action_modal in content:
    content = content.replace(old_action_modal, new_action_modal)
    print("✓ showIdeaActionModal 函数已更新")
else:
    print("✗ 未找到 showIdeaActionModal 函数")

# 2. 优化 showIdeaDeleteConfirmModal - 改进布局
old_delete_modal = '''  private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {
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
      this.plugin.removeIdea(idea.id);
      new Notice('✓ 灵感已删除');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    modal.open();
    cancelBtn.focus();
  }'''

new_delete_modal = '''  private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);
    modal.contentEl.addClass('pm-delete-confirm-modal');

    // 标题
    const header = modal.contentEl.createDiv({ cls: 'pm-modal-header' });
    header.createEl('h2', {
      text: '删除灵感',
      cls: 'pm-modal-title'
    });

    // 内容区域
    const content = modal.contentEl.createDiv({ cls: 'pm-modal-content' });

    // 警告图标 + 文字
    const warningRow = content.createDiv({ cls: 'pm-warning-row' });

    const icon = warningRow.createSpan({ cls: 'pm-warning-icon', text: '⚠️' });

    const text = warningRow.createDiv({ cls: 'pm-warning-text' });

    text.createEl('p', {
      text: `确定要删除「${idea.title}」吗？`,
      cls: 'pm-warning-title'
    });

    text.createEl('p', {
      text: '此操作不可撤销。',
      cls: 'pm-warning-desc'
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
      this.plugin.removeIdea(idea.id);
      new Notice('✓ 灵感已删除');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    modal.open();
    cancelBtn.focus();
  }'''

# 替换
if old_delete_modal in content:
    content = content.replace(old_delete_modal, new_delete_modal)
    print("✓ showIdeaDeleteConfirmModal 函数已更新")
else:
    print("✗ 未找到 showIdeaDeleteConfirmModal 函数")

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 所有修改完成！")
