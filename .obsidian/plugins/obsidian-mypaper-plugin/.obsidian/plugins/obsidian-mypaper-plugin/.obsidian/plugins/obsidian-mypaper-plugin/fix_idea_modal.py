#!/usr/bin/env python3
import os

script_dir = "/home/andew/Nutstore Files/我的坚果云/Obsidian/.obsidian/plugins/obsidian-mypaper-plugin"
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")

# 读取文件
with open(source_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到方法的开始和结束
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
    print(f'找到方法：第 {start_line + 1} 到 {end_line} 行')

    # 新的方法代码（使用内联样式）
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

    // 标题
    const title = titleRow.createEl('h2', { text: idea.title });
    title.style.cssText = 'margin: 0; font-size: 22px; font-weight: 700; color: var(--text-normal); line-height: 1.3; flex: 1;';

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

    // 内容
    const body = container.createDiv();
    body.style.cssText = 'padding: 20px 24px; background: var(--background-primary);';
    const content = body.createEl('p', { text: idea.content });
    content.style.cssText = 'margin: 0; font-size: 15px; line-height: 1.6; color: var(--text-normal); font-weight: 400; white-space: pre-wrap; word-wrap: break-word;';

    // 按钮区域（右对齐）
    const actions = container.createDiv();
    actions.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px 24px; background: var(--background-secondary); border-top: 1px solid var(--background-modifier-border);';

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

    // 取消
    const cancelBtn = actions.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal);';
    cancelBtn.addEventListener('click', () => modal.close());

    // 删除
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--text-error);';
    deleteBtn.addEventListener('click', () => {
      modal.close();
      this.showIdeaDeleteConfirmModal(idea, parentModal);
    });

    modal.open();
    valhallaBtn.focus();
  }
'''

    # 替换
    new_lines = lines[:start_line] + [new_method + '\n'] + lines[end_line:]

    # 备份
    with open(os.path.join(script_dir, 'src/ui/PaperView.ts.backup_inline'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

    # 保存
    with open(source_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print('✅ 文件已更新！')
    print('✅ 使用内联样式，确保立即生效')
    print('✅ 按钮右对齐，标题和标签在同一行')
else:
    print('❌ 未找到方法')
