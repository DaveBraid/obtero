#!/usr/bin/env python3

with open('src/main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在onload方法开头添加CSS加载
old_onload = '''  async onload(): Promise<void> {
    await this.loadSettings();'''

new_onload = '''  async onload(): Promise<void> {
    // 加载样式表
    this.loadStyles();

    await this.loadSettings();'''

content = content.replace(old_onload, new_onload)

# 添加loadStyles方法
old_class_end = '''  private createIdeaId(): string {
    return `idea-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }'''

new_class_end = '''  private createIdeaId(): string {
    return `idea-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  private loadStyles(): void {
    // 加载插件样式
    const styleEl = document.createElement('style');
    styleEl.id = 'mypaper-plugin-styles';

    // 读取styles.css内容
    const cssContent = require('fs').readFileSync(
      require('path').join(__dirname, '../styles.css'),
      'utf-8'
    );

    styleEl.textContent = cssContent;
    document.head.appendChild(styleEl);
  }'''

content = content.replace(old_class_end, new_class_end)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已添加CSS加载代码到main.ts")
print("  • 在onload方法中调用loadStyles()")
print("  • 自动加载styles.css文件")
