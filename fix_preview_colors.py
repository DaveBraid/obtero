#!/usr/bin/env python3
# -*- coding: utf-8 -*-

settings_path = '.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts'

with open(settings_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 问题1：正文字体的选项还是旧的，需要更新
old_meta_font_options = '''    new Setting(controls)
      .setName('正文字体')
      .addDropdown(dropdown => {
        const fontOptions = [
          { value: 1, label: 'Virgil (手写)' },
          { value: 2, label: 'Helvetica (无衬线)' },
          { value: 3, label: 'Cascadia (等宽)' },
          { value: 4, label: 'Comic Sans' },
        ];'''

new_meta_font_options = '''    new Setting(controls)
      .setName('正文字体')
      .addDropdown(dropdown => {
        const fontOptions = [
          { value: 1, label: '手写风格' },
          { value: 2, label: '无衬线' },
          { value: 3, label: '等宽字体' },
          { value: 4, label: 'Comic Sans' },
        ];'''

content = content.replace(old_meta_font_options, new_meta_font_options)

# 问题2：字体预览中的颜色使用了 var(--text-muted)，需要改为使用 field.textColor
# 修复字体预览中的标题颜色
old_title_color = '''          '<div style="font-size: ' + (field.titleFontSize || 14) + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; color: ' + field.textColor + '; margin-bottom: 8px; font-weight: 600;">''

new_title_color = '''          '<div style="font-size: ' + (field.titleFontSize || 14) + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; color: ' + (field.textColor || '#000000') + '; margin-bottom: 8px; font-weight: 600;">''

content = content.replace(old_title_color, new_title_color)

# 修复字体预览中的正文颜色
old_meta_color = '''          '<div style="font-size: ' + (field.metaFontSize || 11) + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + field.textColor + '; opacity: 0.85;">''

new_meta_color = '''          '<div style="font-size: ' + (field.metaFontSize || 11) + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + (field.textColor || '#000000') + '; opacity: 0.85;">''

content = content.replace(old_meta_color, new_meta_color)

with open(settings_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed font preview issues!")
print("1. Updated meta font dropdown options")
print("2. Fixed font preview text colors to match card text color")
