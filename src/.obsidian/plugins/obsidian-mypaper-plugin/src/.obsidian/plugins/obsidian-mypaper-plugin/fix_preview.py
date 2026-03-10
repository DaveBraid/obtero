#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

# 切换到脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

with open('src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到函数的开始和结束
start_marker = '  updateFieldPreview(preview: HTMLElement, field: FieldStyle): void {'
start_idx = content.find(start_marker)

if start_idx == -1:
    print("Could not find function start")
    exit(1)

# 从开始位置找到函数的结束（寻找对应的闭合大括号）
idx = start_idx + len(start_marker)
brace_count = 1
end_idx = idx

while end_idx < len(content) and brace_count > 0:
    if content[end_idx] == '{':
        brace_count += 1
    elif content[end_idx] == '}':
        brace_count -= 1
    end_idx += 1

print(f"Found function from position {start_idx} to {end_idx}")

new_function = '''  updateFieldPreview(preview: HTMLElement, field: FieldStyle): void {
    const roundnessMap: Record<number, string> = {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '16px',
    };

    const fontFamilyMap: Record<number, string> = {
      1: 'Virgil, "Comic Sans MS", cursive, sans-serif',
      2: 'Helvetica, Arial, sans-serif',
      3: 'Cascadia, "Courier New", monospace',
      4: 'Comic Sans MS, cursive, sans-serif',
    };

    const scaleFactor = 0.4;
    const previewWidth = (field.cardWidth || 280) * scaleFactor;
    const previewHeight = (field.cardHeight || 180) * scaleFactor;

    preview.style.width = previewWidth + 'px';
    preview.style.height = previewHeight + 'px';
    preview.style.minWidth = previewWidth + 'px';
    preview.style.maxWidth = previewWidth + 'px';
    preview.style.minHeight = previewHeight + 'px';
    preview.style.maxHeight = previewHeight + 'px';
    preview.style.background = field.backgroundColor;
    preview.style.border = '2px solid ' + field.borderColor;
    preview.style.borderRadius = roundnessMap[field.roundness] || '8px';
    preview.style.opacity = (field.opacity / 100).toString();
    preview.style.transition = 'all 0.2s ease';
    preview.style.overflow = 'hidden';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';

    if (field.roughness > 0) {
      preview.style.boxShadow = field.roughness + 'px ' + field.roughness + 'px 0 rgba(0,0,0,0.1)';
    } else {
      preview.style.boxShadow = 'none';
    }

    const scaledTitleFontSize = (field.titleFontSize || 14) * scaleFactor;
    const scaledMetaFontSize = (field.metaFontSize || 11) * scaleFactor;
    const scaledPadding = 16 * scaleFactor;
    const sizeText = (field.cardWidth || 280) + ' x ' + (field.cardHeight || 180) + 'px';

    preview.innerHTML =
      '<div style="color: ' + field.textColor + '; padding: ' + scaledPadding + 'px; text-align: center; width: 100%;">' +
        '<strong style="font-size: ' + scaledTitleFontSize + 'px; font-family: ' + fontFamilyMap[field.titleFontFamily] + '; display: block; margin-bottom: ' + (8 * scaleFactor) + 'px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + field.name + '</strong>' +
        '<div style="font-size: ' + scaledMetaFontSize + 'px; font-family: ' + fontFamilyMap[field.metaFontFamily] + '; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">TITLE EXAMPLE</div>' +
        '<div style="margin-top: ' + (8 * scaleFactor) + 'px; font-size: ' + (10 * scaleFactor) + 'px; opacity: 0.6;">' + sizeText + '</div>' +
      '</div>';
  }'''

new_content = content[:start_idx] + new_function + content[end_idx:]

with open('src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Function replaced successfully")
