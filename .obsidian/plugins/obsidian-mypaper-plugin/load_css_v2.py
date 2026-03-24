#!/usr/bin/env python3

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在onload方法开头添加CSS加载
old_onload = '''  async onload(): Promise<void> {
    await this.loadSettings();'''

new_onload = '''  async onload(): Promise<void> {
    // 加载插件样式
    this.loadStyles();

    await this.loadSettings();'''

if old_onload in content:
    content = content.replace(old_onload, new_onload)
    print("✓ 已在onload中添加loadStyles()调用")
else:
    print("! 未找到目标onload代码")

# 在createIdeaId方法前添加loadStyles方法
loadStyles_method = '''  loadStyles(): void {
    // 加载插件样式表
    const styleEl = document.createElement('style');
    styleEl.id = 'mypaper-plugin-styles';

    // 读取styles.css内容并注入
    const cssContent = `
/* 动态日历热力图样式 */
.pm-calendar-header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.pm-calendar-legend-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.pm-legend-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-normal);
  white-space: nowrap;
  min-width: 24px;
  text-align: center;
}

.pm-calendar-legend-gradient {
  display: flex;
  height: 12px;
  flex: 1;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  min-width: 200px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pm-calendar-legend-segment {
  flex: 1;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pm-calendar-legend-segment:hover {
  transform: scaleY(1.2);
  z-index: 1;
}

.pm-legend-current-position {
  position: relative;
}

.pm-legend-indicator {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: 0;
  right: 0;
  border: 2px solid var(--text-normal);
  border-radius: 4px;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.pm-calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: var(--background-secondary);
}

.pm-calendar-day:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.pm-calendar-day-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-normal);
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.pm-calendar-day-has-ideas .pm-calendar-day-number {
  color: var(--text-normal);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3);
}
`;

    styleEl.textContent = cssContent;
    document.head.appendChild(styleEl);
  }

'''

# 在createIdeaId方法前插入
old_method = '  private createIdeaId(): string {\n    return `idea-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;\n  }'

new_method = loadStyles_method + '  private createIdeaId(): string {\n    return `idea-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;\n  }'

if old_method in content:
    content = content.replace(old_method, new_method)
    print("✓ 已添加loadStyles()方法")
else:
    print("! 未找到createIdeaId方法")

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ CSS加载功能已添加")
