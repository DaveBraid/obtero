#!/usr/bin/env python3

with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 新的renderCalendar方法（带动态热力图）
new_method = '''  private renderCalendar(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const header = section.createDiv({ cls: 'pm-calendar-header' });

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    // 年月显示 + 动态热力图指示条
    const headerMain = header.createDiv({ cls: 'pm-calendar-header-main' });

    const yearMonthDisplay = headerMain.createDiv({ cls: 'pm-calendar-yearmonth-clickable' });
    yearMonthDisplay.createSpan({
      cls: 'pm-calendar-current',
      text: `${currentYear}年${currentMonth}月`
    });
    yearMonthDisplay.addEventListener('click', () => this.showMonthPickerModal());

    // 动态热力图指示条
    const monthIdeas = (this.plugin.settings.ideas || []).filter(idea => {
      const ideaDate = new Date(idea.createdAt);
      return ideaDate.getFullYear() === currentYear && ideaDate.getMonth() + 1 === currentMonth;
    });

    const currentTotal = monthIdeas.length;
    const maxCount = Math.max(5, currentTotal);

    const legend = headerMain.createDiv({ cls: 'pm-calendar-legend-inline' });
    legend.createSpan({ cls: 'pm-legend-label', text: `${currentTotal}` });

    const legendBar = legend.createDiv({ cls: 'pm-calendar-legend-gradient' });

    // 创建渐变段
    const segmentCount = 20;
    for (let i = 0; i < segmentCount; i++) {
      const segment = legendBar.createDiv({ cls: 'pm-calendar-legend-segment' });

      // 计算该段在整体中的位置（0到maxCount之间）
      const position = (i / (segmentCount - 1)) * maxCount;
      const ratio = position / maxCount;

      // 颜色渐变：浅蓝 → 浅红
      const lightBlue = { r: 135, g: 206, b: 250 };
      const lightRed = { r: 255, g: 182, b: 193 };

      const r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * ratio);
      const g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * ratio);
      const b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * ratio);

      segment.style.cssText = `background: rgb(${r}, ${g}, ${b});`;

      // 标记当前总数的位置
      if (currentTotal > 0 && Math.abs(i / (segmentCount - 1) - (currentTotal / maxCount)) < 0.03) {
        segment.classList.add('pm-legend-current-position');
        const indicator = segment.createDiv({ cls: 'pm-legend-indicator' });
      }
    }

    legend.createSpan({ cls: 'pm-calendar-legend-label', text: `${maxCount}+` });

    const calendarGrid = section.createDiv({ cls: 'pm-calendar-grid' });

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (const day of weekdays) {
      const dayHeader = calendarGrid.createDiv({ cls: 'pm-calendar-day-header' });
      dayHeader.textContent = day;
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarGrid.createDiv({ cls: 'pm-calendar-day-empty' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = calendarGrid.createDiv({ cls: 'pm-calendar-day' });

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIdeas = (this.plugin.settings.ideas || []).filter(idea => {
        const ideaDate = new Date(idea.createdAt);
        const ideaDateStr = `${ideaDate.getFullYear()}-${String(ideaDate.getMonth() + 1).padStart(2, '0')}-${String(ideaDate.getDate()).padStart(2, '0')}`;
        return ideaDateStr === dateStr;
      });

      const dayNumber = dayCell.createDiv({ cls: 'pm-calendar-day-number' });
      dayNumber.textContent = String(day);

      // 根据灵感数量计算颜色（动态渐变）
      const ideaCount = dayIdeas.length;
      if (ideaCount > 0) {
        dayCell.classList.add('pm-calendar-day-has-ideas');

        // 计算该天数在渐变区间的位置
        const ratio = Math.min(ideaCount / maxCount, 1);

        // 颜色渐变：浅蓝 → 浅红
        const lightBlue = { r: 135, g: 206, b: 250 };
        const lightRed = { r: 255, g: 182, b: 193 };

        const r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * ratio);
        const g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * ratio);
        const b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * ratio);

        dayCell.style.cssText = `background: rgb(${r}, ${g}, ${b});`;

        dayCell.addEventListener('click', () => {
          this.showDayIdeasModal(dateStr, dayIdeas);
        });
      } else {
        // 无灵感的天数显示浅灰色背景
        dayCell.style.cssText = 'background: var(--background-secondary);';
      }
    }
  }
'''

# 找到并替换方法
start_idx = None
end_idx = None
brace_count = 0
found = False

for i, line in enumerate(lines):
    if 'private renderCalendar(container: HTMLElement): void {' in line:
        start_idx = i
        found = True
        brace_count = 1
        continue

    if found:
        brace_count += line.count('{')
        brace_count -= line.count('}')

        if brace_count == 0:
            end_idx = i + 1
            break

if start_idx and end_idx:
    print(f"找到renderCalendar方法：第 {start_idx + 1} 到 {end_idx} 行")
    lines[start_idx:end_idx] = [new_method + '\n']

    with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("✅ 已添加动态热力图指示条")
    print("  • 左边：当前灵感总数（动态）")
    print("  • 中间：渐变条（浅蓝 → 浅红）")
    print("  • 右边：最大值（5+或动态）")
    print("  • 每天颜色：根据数量在渐变区间计算")
else:
    print("❌ 未找到renderCalendar方法")
