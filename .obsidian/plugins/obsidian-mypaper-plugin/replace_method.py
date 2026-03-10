#!/usr/bin/env python3
import sys

# 读取原文件
with open('src/settings.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到 renderFieldsList 方法的开始和结束
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if 'renderFieldsList(containerEl: HTMLElement): void' in line:
        start_idx = i
    if start_idx is not None and line.strip().startswith('addSubHeader(containerEl:'):
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"无法找到方法位置: start={start_idx}, end={end_idx}")
    sys.exit(1)

print(f"找到方法: 行 {start_idx+1} 到 {end_idx}")

# 读取新方法
with open('temp_method.txt', 'r', encoding='utf-8') as f:
    new_method = f.read()

# 构建新文件
new_lines = lines[:start_idx] + [new_method + '\n\n'] + lines[end_idx:]

# 写回文件
with open('src/settings.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"方法已替换: 新文件共 {len(new_lines)} 行")
