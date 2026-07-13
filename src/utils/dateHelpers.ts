// Pure helper functions to handle study calendar dates 2026-07-13 to 2026-08-29
export const START_DATE = "2026-07-13";
export const END_DATE = "2026-08-29";

// Generate all dates in the range
export function generateDateList(): string[] {
  const list: string[] = [];
  const start = new Date(2026, 6, 13); // July 13, 2026
  const end = new Date(2026, 7, 29);   // August 29, 2026
  
  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    list.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return list;
}

export const ALL_DATES = generateDateList();

export interface WeekDetail {
  weekNum: number; // 1 to 7
  startDate: string;
  endDate: string;
  dates: string[]; // 7 dates (Mon to Sun), last week has 6 dates (Mon to Sat)
}

// Group dates into 7 weeks
export function getWeeks(): WeekDetail[] {
  const weeks: WeekDetail[] = [];
  let currentWeekDates: string[] = [];
  let weekNum = 1;
  
  for (const d of ALL_DATES) {
    currentWeekDates.push(d);
    
    // Check if it is Sunday or the last day of the range
    const dateObj = parseLocalDate(d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday
    
    if (dayOfWeek === 0 || d === END_DATE) {
      weeks.push({
        weekNum,
        startDate: currentWeekDates[0],
        endDate: currentWeekDates[currentWeekDates.length - 1],
        dates: [...currentWeekDates]
      });
      currentWeekDates = [];
      weekNum++;
    }
  }
  
  return weeks;
}

// Map a date to its week number (1-7)
export function getWeekNumForDate(dateStr: string): number {
  const weeks = getWeeks();
  const week = weeks.find(w => w.dates.includes(dateStr));
  return week ? week.weekNum : 1;
}

// Parse "YYYY-MM-DD" local time safely
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Get day type
export function getDayType(dateStr: string): 'weekday' | 'saturday' | 'sunday' {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0=Sunday, 6=Saturday, 1-5=Mon-Fri
  if (day === 6) return 'saturday';
  if (day === 0) return 'sunday';
  return 'weekday';
}

// Format Chinese date display
export function formatChineseDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const m = d.getMonth() + 1;
  const dateVal = d.getDate();
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dayName = dayNames[d.getDay()];
  
  // Format year code: e.g., 260713
  const yrShort = String(d.getFullYear()).slice(-2);
  const mStr = String(m).padStart(2, '0');
  const dStr = String(dateVal).padStart(2, '0');
  const dateCode = `${yrShort}${mStr}${dStr}`;
  
  return `${m}月${dateVal}日 (${dayName}) / ${dateCode}`;
}

// Format weekday index (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0)
export function getDayOfWeekIndex(dateStr: string): number {
  const d = parseLocalDate(dateStr);
  return d.getDay();
}
