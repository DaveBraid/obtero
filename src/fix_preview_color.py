with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 updateFontPreview 中的标题颜色 (第768行)
old_title_color = "font-size: ' + (field.titleFontSize || 14) + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; color: ' + field.textColor + '; margin-bottom: 8px; font-weight: 600;"
new_title_color = "font-size: ' + (field.titleFontSize || 14) + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; color: ' + (field.titleTextColor || field.textColor) + '; margin-bottom: 8px; font-weight: 600;"
content = content.replace(old_title_color, new_title_color)

# 修复 updateFontPreview 中的正文字体颜色 (第771行)
old_meta_color = "font-size: ' + (field.metaFontSize || 11) + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + field.textColor + '; opacity: 0.85;"
new_meta_color = "font-size: ' + (field.metaFontSize || 11) + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + (field.metaTextColor || field.textColor) + '; opacity: 0.85;"
content = content.replace(old_meta_color, new_meta_color)

# 修复 updateFieldPreview 中的整体文字颜色 (第832行)
old_field_color = "'<div style=\"color: ' + field.textColor + '; padding: ' + scaledPadding + 'px; text-align: center; width: 100%;\">'"
new_field_color = "'<div style=\"color: ' + (field.titleTextColor || field.textColor) + '; padding: ' + scaledPadding + 'px; text-align: center; width: 100%;\">'"
content = content.replace(old_field_color, new_field_color)

# 修复 updateFieldPreview 中的meta文本颜色 (第834行)
old_field_meta_color = "'<div style=\"font-size: ' + scaledMetaFontSize + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">'"
new_field_meta_color = "'<div style=\"font-size: ' + scaledMetaFontSize + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; color: ' + (field.metaTextColor || field.textColor) + '; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">'"
content = content.replace(old_field_meta_color, new_field_meta_color)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成！预览现在会使用新的颜色字段。")
