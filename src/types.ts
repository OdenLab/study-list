export type TaskStatus = 'pending' | 'completed' | 'uncompleted';

export interface TaskItem {
  id: string;
  text: string;
  status: TaskStatus;
  isWaived?: boolean; // True if rewarded/waived by the Lucky Wheel
  subject?: string;   // Subject category for stats (e.g. 语文, 数学, 英语, 物理, 化学, 生物)
}

export interface DayData {
  dateStr: string; // YYYY-MM-DD
  isWeekend: boolean;
  dayOfWeek: number; // 1-5 (Mon-Fri), 6 (Sat), 0 (Sun)
  items: TaskItem[];
  diary?: string; // Word counts of diary are calculated here
  // Custom input states for editable fields on weekdays
  item4Text?: string; // Custom biology detail
  item6Text?: string; // Editable empty slot
  blankText7?: string; // Blank area in "生物课本___阅读研习"
}

export interface LikedQuote {
  dateStr: string;
  quote: string;
  likedAt: number; // Timestamp of liking (used for sorting oldest to newest)
}

export interface WheelPrize {
  id: string;
  name: string;
  probability: number;
  type: 'waive_task' | 'waive_saturday' | 'waive_weekday' | 'waive_week' | 'none';
  targetTaskIndex?: number; // 0-7 (for waive_task)
  targetDayOfWeek?: number; // 1-5 (for waive_weekday)
}

export interface WheelLog {
  timestamp: number;
  dateStr: string; // Spin date
  prizeId: string;
  prizeName: string;
  isExtraSpin: boolean; // True if earned from completing an exam
}

export interface WheelState {
  lastSpunDate: string | null; // YYYY-MM-DD
  extraSpinsSpent: number; // Max 3 over the holiday
  extraSpinsTotal: number; // Max 3
  logs: WheelLog[];
}
