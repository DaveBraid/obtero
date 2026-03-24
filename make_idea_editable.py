#!/usr/bin/env python3
import os

script_dir = "/home/andew/Nutstore Files/我的坚果云/Obsidian/.obsidian/plugins/obsidian-mypaper-plugin"
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")

# 读取文件
with open(source_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到 showIdeaActionModal 方法的开始和结束
start_line = None
end_line = None
brace_count = 0
found_method = False

for i, line in enumerate(lines):
    if 'private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {' in line:
        start_line = i
        found_method = True
        brace_count = 1
        continue

    if found_method:
        brace_count += line.count('{')
        brace_count -= line.count('}')

        if brace_count == 0:
            end_line = i + 1
            break

if start_line and end_line:
    print(f'找到灵感详情方法：第 {start_line + 1} 到 {end_line} 行')

    # 新的方法代码（标题和正文可编辑）
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

    // 可编辑的标题
    const titleInput = titleRow.createEl('input', { type: 'text' });
    titleInput.value = idea.title;
    titleInput.style.cssText = 'flex: 1; margin: 0; font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3; padding: 4px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent;';
    titleInput.addEventListener('focus', () => {
      titleInput.style.cssText = titleInput.style.cssText + ' border-color: var(--interactive-accent); background: var(--background-primary);';
    });
    titleInput.addEventListener('blur', () => {
      titleInput.style.cssText = titleInput.style.cssText.replace(' border-color: var(--interactive-accent); background: var(--background-primary);', ' border-color: transparent; background: transparent;');
    });

    // 领域标签
    if (idea.field) {
      const fieldStyle = this.plugin.settings.fields.find(f =>
        f.name === idea.field || (f.aliases && f.aliases.includes(idea.field!))
      );
      if (fieldStyle) {
        const tag = titleRow.createSpan({ text: idea.field });
        tag.style.cssText = 'display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; background-color: ' + fieldStyle.backgroundColor + '; color: ' + this.getContrastColor(fieldStyle.backgroundColor) + '; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);';
      }
    } else if (idea.isCustomTag && idea.color) {
      const tag = titleRow.createSpan({ text: '自定义' });
      tag.style.cssText = 'display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; background-color: ' + idea.color + '; color: ' + this.getContrastColor(idea.color) + '; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);';
    }

    // 时间
    const date = new Date(idea.createdAt);
    const timeEl = header.createDiv({ text: this.formatIdeaTime(date) });
    timeEl.style.cssText = 'font-size: 13px; color: var(--text-faint); font-weight: 500; padding-left: 4px;';

    // 内容区域
    const body = container.createDiv();
    body.style.cssText = 'padding: 20px 24px; background: var(--background-primary);';

    // 可编辑的正文
    const contentTextarea = body.createEl('textarea');
    contentTextarea.value = idea.content;
    contentTextarea.rows = 6;
    contentTextarea.style.cssText = 'width: 100%; margin: 0; font-size: 15px; line-height: 1.6; color: var(--text-normal); font-weight: 400; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary); resize: vertical; font-family: inherit;';
    contentTextarea.addEventListener('focus', () => {
      contentTextarea.style.cssText = contentTextarea.style.cssText + ' border-color: var(--interactive-accent); outline: none;';
    });
    contentTextarea.addEventListener('blur', () => {
      contentTextarea.style.cssText = contentTextarea.style.cssText.replace(' border-color: var(--interactive-accent);', ' border-color: var(--background-modifier-border);');
    });

    // 按钮区域（右对齐）
    const actions = container.createDiv();
    actions.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px 24px; background: var(--background-secondary); border-top: 1px solid var(--background-modifier-border);';

    // 保存修改按钮（新增）
    const saveBtn = actions.createEl('button', { text: '💾 保存修改' });
    saveBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';
    saveBtn.addEventListener('click', async () => {
      const newTitle = titleInput.value.trim();
      const newContent = contentTextarea.value.trim();

      if (!newTitle || !newContent) {
        new Notice('标题和内容不能为空');
        return;
      }

      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        this.plugin.settings.ideas[ideaIndex]!.title = newTitle;
        this.plugin.settings.ideas[ideaIndex]!.content = newContent;
        await this.plugin.saveSettings();
        new Notice('✓ 灵感已更新');
        modal.close();
        parentModal.close();
        this.showIdeasLibraryModal();
        this.render();
      }
    });

    // 取消按钮
    const cancelBtn = actions.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal);';
    cancelBtn.addEventListener('click', () => modal.close());

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
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--text-error);';
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    titleInput.focus();
  }
'''

    # 替换
    new_lines = lines[:start_line] + [new_method + '\n'] + lines[end_line:]

    # 备份
    with open(os.path.join(script_dir, 'src/ui/PaperView.ts.backup_editable'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

    # 保存
    with open(source_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print('✅ 步骤 2/2：已使灵感详情窗口可编辑')
    print('   - 标题改为可编辑的 input')
    print('   - 正文改为可编辑的 textarea')
    print('   - 新增"保存修改"按钮')
    print('   - 聚焦时显示边框')
else:
    print('❌ 未找到方法')
