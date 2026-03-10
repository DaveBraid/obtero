#!/usr/bin/env python3
import os

os.chdir('.obsidian/plugins/obsidian-mypaper-plugin')

# 读取原文件
with open('src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 新的renderFieldsList方法
new_method = '''  renderFieldsList(containerEl: HTMLElement): void {
    const fieldsContainer = containerEl.createDiv({ cls: 'pm-fields-list' });
    fieldsContainer.style.marginTop = '16px';

    // 创建标签导航栏
    const tabsNav = fieldsContainer.createDiv({ cls: 'pm-tabs-nav' });
    tabsNav.style.display = 'flex';
    tabsNav.style.flexWrap = 'wrap';
    tabsNav.style.gap = '8px';
    tabsNav.style.marginBottom = '16px';
    tabsNav.style.borderBottom = '1px solid var(--background-modifier-border)';
    tabsNav.style.paddingBottom = '8px';

    // 为每个领域创建标签按钮和对应的内容区域
    const fieldItems: HTMLElement[] = [];

    this.plugin.settings.fields.forEach((field, index) => {
      // 创建标签按钮
      const tabBtn = tabsNav.createEl('button', {
        text: field.name,
        cls: 'pm-tab-btn',
      });
      tabBtn.style.padding = '8px 16px';
      tabBtn.style.border = '1px solid var(--background-modifier-border)';
      tabBtn.style.borderRadius = '6px';
      tabBtn.style.background = 'var(--background-secondary)';
      tabBtn.style.cursor = 'pointer';
      tabBtn.style.fontSize = '14px';
      tabBtn.style.fontWeight = '500';
      tabBtn.style.transition = 'all 0.2s ease';

      // 创建领域设置区域
      const fieldItem = fieldsContainer.createDiv({ cls: 'pm-field-item' });
      fieldItem.style.border = '1px solid var(--background-modifier-border)';
      fieldItem.style.borderRadius = '8px';
      fieldItem.style.padding = '12px';
      fieldItem.style.marginBottom = '12px';
      fieldItem.style.background = 'var(--background-secondary)';

      // 默认隐藏所有领域设置
      fieldItem.style.display = index === this.activeFieldIndex ? 'block' : 'none';

      fieldItems.push(fieldItem);

      // 标签按钮点击事件
      tabBtn.addEventListener('click', () => {
        // 更新 activeFieldIndex
        this.activeFieldIndex = index;

        // 隐藏所有领域设置
        fieldItems.forEach((item, i) => {
          item.style.display = i === index ? 'block' : 'none';
        });

        // 更新所有标签按钮的样式
        const allTabs = tabsNav.querySelectorAll('.pm-tab-btn');
        allTabs.forEach((tab, i) => {
          if (i === index) {
            (tab as HTMLElement).style.background = 'var(--interactive-accent)';
            (tab as HTMLElement).style.color = 'var(--text-on-accent)';
            (tab as HTMLElement).style.borderColor = 'var(--interactive-accent)';
          } else {
            (tab as HTMLElement).style.background = 'var(--background-secondary)';
            (tab as HTMLElement).style.color = 'var(--text-normal)';
            (tab as HTMLElement).style.borderColor = 'var(--background-modifier-border)';
          }
        });
      });

      // 初始化标签按钮样式
      if (index === this.activeFieldIndex) {
        tabBtn.style.background = 'var(--interactive-accent)';
        tabBtn.style.color = 'var(--text-on-accent)';
        tabBtn.style.borderColor = 'var(--interactive-accent)';
      }
    });

    // 为每个领域创建内容
    this.plugin.settings.fields.forEach((field, index) => {
      const fieldItem = fieldItems[index];

      // 领域名称和删除按钮
      const header = fieldItem.createDiv({ cls: 'pm-field-header' });
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '12px';

      const nameInput = header.createEl('input', {
        type: 'text',
        value: field.name,
      });
      nameInput.style.fontSize = '1.1em';
      nameInput.style.fontWeight = '600';
      nameInput.style.border = 'none';
      nameInput.style.background = 'transparent';
      nameInput.style.color = 'var(--text-normal)';
      nameInput.style.width = '300px';
      nameInput.addEventListener('change', async () => {
// @ts-ignore
// @ts-ignore
        if (this.plugin.settings.fields[index]!) this.plugin.settings.fields[index].name = nameInput.value;
        await this.plugin.saveSettings();
        // 刷新标签按钮文字
        const tabsNav = fieldsContainer.querySelector('.pm-tabs-nav');
        if (tabsNav) {
          const tabBtn = tabsNav.querySelectorAll('.pm-tab-btn')[index] as HTMLElement;
          if (tabBtn) tabBtn.textContent = nameInput.value;
        }
      });

      const deleteBtn = header.createEl('button', {
        text: '删除',
        cls: 'mod-warning',
      });
      deleteBtn.style.padding = '4px 12px';
      deleteBtn.addEventListener('click', async () => {
        if (this.plugin.settings.fields.length <= 1) {
          new Notice('至少保留一个领域样式');
          return;
        }
        this.plugin.settings.fields.splice(index, 1);
        // 调整 activeFieldIndex
        if (this.activeFieldIndex >= this.plugin.settings.fields.length) {
          this.activeFieldIndex = this.plugin.settings.fields.length - 1;
        }
        await this.plugin.saveSettings();
        this.display();
      });

      // 样式设置
      this.addFieldStyleSetting(fieldItem, field, index);
    });
  }'''

# 找到并替换renderFieldsList方法
# 找到方法开始
start_marker = '  renderFieldsList(containerEl: HTMLElement): void {'
end_marker = '  addFieldStyleSetting(containerEl: HTMLElement, field: FieldStyle, index: number): void {'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx > 0 and end_idx > start_idx:
    # 找到前一个方法的结束
    pre_end = content.rfind('\n  }\n', 0, start_idx) + 5
    content_new = content[:pre_end] + '\n' + new_method + '\n\n\n  ' + content[end_idx:]
    print(f"替换方法：从位置{pre_end}到{end_idx}")
else:
    print(f"错误：无法定位方法 start={start_idx}, end={end_idx}")
    exit(1)

# 写回文件
with open('src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("文件修改完成")
