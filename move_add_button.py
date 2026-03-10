#!/usr/bin/env python3
# 读取文件
with open('src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 移除底部的"添加新领域"设置
old_add_button = '''    // 添加新领域按钮
    new Setting(containerEl)
      .setName('添加新领域')
      .setDesc('创建一个新的领域样式')
      .addButton(button => {
        button
          .setButtonText('添加')
          .setCta()
          .onClick(() => {
            const newField: FieldStyle = {
              name: '新领域',
              backgroundColor: '#ffffff',
              backgroundPattern: 'solid',
              patternColor: '#cccccc',
              textColor: '#000000',
              borderColor: '#000000',
              roughness: 0,
              opacity: 100,
              roundness: 2,
  titleFontSize: 14,
  titleFontFamily: 1,
  metaFontSize: 11,
  metaFontFamily: 1,
  cardWidth: 280,
  cardHeight: 180,
    titleTextColor: undefined,
    metaTextColor: undefined,
            };
            this.plugin.settings.fields.push(newField);
            this.plugin.saveSettings();
            this.display(); // 刷新设置页面
          });
      });
  }'''

content = content.replace(old_add_button, '  }')

# 2. 在标签导航栏中添加 "+" 按钮
insert_marker = '    // 为每个领域创建内容\n    this.plugin.settings.fields.forEach((field, index) => {'

add_button_code = '''    // 添加新领域按钮
    const addBtn = tabsNav.createEl('button', {
      text: '+ 添加',
      cls: 'pm-add-field-btn',
    });
    addBtn.style.padding = '8px 16px';
    addBtn.style.border = '1px dashed var(--interactive-accent)';
    addBtn.style.borderRadius = '6px';
    addBtn.style.background = 'transparent';
    addBtn.style.cursor = 'pointer';
    addBtn.style.fontSize = '14px';
    addBtn.style.fontWeight = '500';
    addBtn.style.color = 'var(--interactive-accent)';
    addBtn.style.transition = 'all 0.2s ease';
    addBtn.style.marginLeft = 'auto'; // 推到右边

    addBtn.addEventListener('click', () => {
      const newField: FieldStyle = {
        name: '新领域',
        backgroundColor: '#ffffff',
        backgroundPattern: 'solid',
        patternColor: '#cccccc',
        textColor: '#000000',
        borderColor: '#000000',
        roughness: 0,
        opacity: 100,
        roundness: 2,
        titleFontSize: 14,
        titleFontFamily: 1,
        metaFontSize: 11,
        metaFontFamily: 1,
        cardWidth: 280,
        cardHeight: 180,
        titleTextColor: undefined,
        metaTextColor: undefined,
      };
      this.plugin.settings.fields.push(newField);
      this.plugin.saveSettings();
      // 切换到新添加的领域
      this.activeFieldIndex = this.plugin.settings.fields.length - 1;
      this.display(); // 刷新设置页面
    });

'''

content = content.replace(insert_marker, add_button_code + insert_marker)

# 写回文件
with open('src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ 添加按钮已移到标签栏右侧")
