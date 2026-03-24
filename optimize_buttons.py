#!/usr/bin/env python3
with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到showIdeaActionModal方法并重写
new_method = '''  private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);

    // 设置 Modal 容器
    modal.modalEl.style.cssText = 'max-width: 500px; width: 90vw;';

    // 主容器
    const container = modal.contentEl.createDiv();
    container.style.cssText = 'display: flex; flex-direction: column; gap: 0; background: var(--background-primary); border-radius: 12px; overflow: hidden; box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);';

    // 头部
    const header = container.createDiv();
    header.style.cssText = 'padding: 24px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border);';

    // 标题行
    const titleRow = header.createDiv();
    titleRow.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;';

    // 标题容器（用于切换显示模式）
    const titleContainer = titleRow.createDiv();
    titleContainer.style.cssText = 'flex: 1; display: flex; align-items: center;';

    // 只读标题
    const titleRead = titleContainer.createDiv();
    titleRead.style.cssText = 'font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3; flex: 1;';
    titleRead.textContent = idea.title;

    // 领域标签（查看模式显示）
    let tagElement: HTMLElement | null = null;
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        tagElement = titleRow.createSpan({ text: idea.field });
        tagElement.style.cssText = 'display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; background-color: ' + fieldStyle.backgroundColor + '; color: ' + this.getContrastColor(fieldStyle.backgroundColor) + '; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);';
      }
    } else if (idea.isCustomTag && idea.color) {
      tagElement = titleRow.createSpan({ text: '自定义' });
      tagElement.style.cssText = 'display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; background-color: ' + idea.color + '; color: ' + this.getContrastColor(idea.color) + '; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);';
    }

    // 可编辑标题（初始隐藏）
    const titleEdit = titleContainer.createEl('input', { type: 'text' });
    titleEdit.value = idea.title;
    titleEdit.style.cssText = 'flex: 1; margin: 0; font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3; padding: 4px 8px; border: 1px solid var(--interactive-accent); border-radius: 4px; background: var(--background-primary); display: none;';

    // 时间
    const date = new Date(idea.createdAt);
    const timeEl = header.createDiv({ text: this.formatIdeaTime(date) });
    timeEl.style.cssText = 'font-size: 13px; color: var(--text-faint); font-weight: 500; padding-left: 4px;';

    // 内容区域
    const body = container.createDiv();
    body.style.cssText = 'padding: 20px 24px; background: var(--background-primary);';

    // 只读内容（初始显示）
    const contentRead = body.createDiv();
    contentRead.style.cssText = 'font-size: 15px; line-height: 1.6; color: var(--text-normal); font-weight: 400; white-space: pre-wrap; word-wrap: break-word;';
    contentRead.textContent = idea.content;

    // 可编辑内容（初始隐藏）
    const contentEdit = body.createEl('textarea');
    contentEdit.value = idea.content;
    contentEdit.style.cssText = 'width: 100%; margin: 0; font-size: 15px; line-height: 1.6; color: var(--text-normal); font-weight: 400; padding: 12px; border: 1px solid var(--interactive-accent); border-radius: 8px; background: var(--background-primary); resize: vertical; font-family: inherit; display: none;';

    // 按钮区域（右对齐）
    const actions = container.createDiv();
    actions.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px 24px; background: var(--background-secondary); border-top: 1px solid var(--background-modifier-border);';

    // 编辑按钮（查看模式显示）
    const editBtn = actions.createEl('button', { text: '✏️ 编辑' });
    editBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';

    // 保存按钮（编辑模式显示，初始隐藏）
    const saveBtn = actions.createEl('button', { text: '💾 保存' });
    saveBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); display: none;';

    // 取消按钮（编辑模式显示，初始隐藏）
    const cancelEditBtn = actions.createEl('button', { text: '取消' });
    cancelEditBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); display: none;';

    // 归入英灵殿（查看模式显示）
    const valhallaBtn = actions.createEl('button', { text: '✨ 归入英灵殿' });
    valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #9773f7; background: #9773f7; color: white; box-shadow: 0 2px 8px rgba(151, 115, 247, 0.3);';

    // 删除（查看模式显示）
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);';

    // 切换到编辑模式
    const enterEditMode = () => {
      titleRead.style.display = 'none';
      titleEdit.style.display = 'block';
      contentRead.style.display = 'none';
      contentEdit.style.display = 'block';

      // 隐藏领域标签
      if (tagElement) {
        tagElement.style.display = 'none';
      }

      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-flex';
      cancelEditBtn.style.display = 'inline-flex';
      valhallaBtn.style.display = 'none';
      deleteBtn.style.display = 'none';

      titleEdit.focus();
    };

    // 切换到查看模式
    const exitEditMode = () => {
      titleRead.style.display = 'block';
      titleEdit.style.display = 'none';
      titleRead.textContent = titleEdit.value;

      contentRead.style.display = 'block';
      contentEdit.style.display = 'none';
      contentRead.textContent = contentEdit.value;

      // 显示领域标签
      if (tagElement) {
        tagElement.style.display = 'inline-flex';
      }

      editBtn.style.display = 'inline-flex';
      saveBtn.style.display = 'none';
      cancelEditBtn.style.display = 'none';
      valhallaBtn.style.display = 'inline-flex';
      deleteBtn.style.display = 'inline-flex';
    };

    // 点击编辑按钮
    editBtn.addEventListener('click', () => {
      enterEditMode();
    });

    // 点击保存按钮
    saveBtn.addEventListener('click', async () => {
      const newTitle = titleEdit.value.trim();
      const newContent = contentEdit.value.trim();

      if (!newTitle || !newContent) {
        new Notice('标题和内容不能为空');
        return;
      }

      // @ts-ignore
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        // @ts-ignore
        const targetIdea = this.plugin.settings.ideas[ideaIndex];
        if (targetIdea) {
          targetIdea.title = newTitle;
          targetIdea.content = newContent;
          await this.plugin.saveSettings();
          new Notice('✓ 灵感已更新');
          exitEditMode();
          parentModal.close();
          this.showIdeasLibraryModal();
          this.render();
        }
      }
    });

    // 点击取消按钮
    cancelEditBtn.addEventListener('click', () => {
      // 恢复原始值
      titleEdit.value = idea.title;
      contentEdit.value = idea.content;
      exitEditMode();
    });

    // 归入英灵殿
    valhallaBtn.addEventListener('click', async () => {
      await this.plugin.moveIdeaToValhalla(idea.id);
      new Notice('✓ 已归入英灵殿');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    // 删除
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
  }
'''

# 找到并替换方法
start_idx = None
end_idx = None
brace_count = 0
found = False

for i, line in enumerate(lines):
    if 'private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {' in line:
        start_idx = i
        found = True
        brace_count = 1
        continue

    if found:
        brace_count += line.count('{')
        brace_count -= line.count('}')

        if brace_count == 0:
            end_idx = i + 1
            break

if start_idx and end_idx:
    print(f"找到方法：第 {start_idx + 1} 到 {end_idx} 行")
    lines[start_idx:end_idx] = [new_method + '\n']

    with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("✅ 已优化按钮颜色")
    print("  • 编辑模式隐藏领域标签")
    print("  • 编辑按钮：蓝色")
    print("  • 保存按钮：蓝色")
    print("  • 归入英灵殿：紫色")
    print("  • 删除按钮：红色")
    print("  • 取消按钮：灰色")
else:
    print("❌ 未找到方法")
