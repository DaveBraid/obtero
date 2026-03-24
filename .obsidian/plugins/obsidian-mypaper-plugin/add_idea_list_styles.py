#!/usr/bin/env python3
"""
添加灵感列表项的CSS样式，确保标签在最右边
"""

import re

def main():
    css_file = 'styles.css'

    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 检查是否已有样式
    if '.pm-idea-item' in content:
        print("✓ 灵感列表样式已存在")
        return

    # 添加灵感列表样式
    new_styles = '''
/* ==================== 灵感列表样式 ==================== */
.pm-ideas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.pm-idea-item {
  display: flex;
  padding: 12px 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid transparent;
}

.pm-idea-item:hover {
  background: var(--background-modifier-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: var(--background-modifier-border);
}

.pm-idea-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.pm-idea-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-idea-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-normal);
  line-height: 1.4;
}

.pm-idea-body {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pm-idea-time {
  font-size: 12px;
  color: var(--text-faint);
  font-weight: 500;
}

.pm-idea-tag-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.pm-idea-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 空状态 */
.pm-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.pm-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.pm-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.pm-empty-hint {
  font-size: 13px;
  color: var(--text-faint);
}
'''

    # 在文件末尾添加
    content += '\n' + new_styles

    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ 已添加灵感列表样式")
    print("✓ 标签已设置为显示在最右边")

if __name__ == '__main__':
    main()
