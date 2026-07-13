import { TaskItem, DayData } from '../types';
import { getDayOfWeekIndex, getDayType } from './dateHelpers';

export function generateDefaultTasksForDate(dateStr: string): TaskItem[] {
  const dayType = getDayType(dateStr);
  const dayOfWeek = getDayOfWeekIndex(dateStr); // 1-5 = Mon-Fri, 6=Sat, 0=Sun

  if (dayType === 'weekday') {
    const isMonWedFri = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    
    if (isMonWedFri) {
      return [
        { id: `${dateStr}-1`, text: "语文点线面", status: 'pending', subject: "语文" },
        { id: `${dateStr}-2`, text: "化学错题/知识点收集整理", status: 'pending', subject: "化学" },
        { id: `${dateStr}-3`, text: "化学错题深研", status: 'pending', subject: "化学" },
        { id: `${dateStr}-4`, text: "生物", status: 'pending', subject: "生物" },
        { id: `${dateStr}-5`, text: "物理错题/知识点收集整理", status: 'pending', subject: "物理" },
        { id: `${dateStr}-6`, text: "", status: 'pending' }, // Empty slot
        { id: `${dateStr}-7`, text: "生物课本___阅读研习", status: 'pending', subject: "生物" },
        { id: `${dateStr}-8`, text: "物理错题深研", status: 'pending', subject: "物理" }
      ];
    } else {
      // Tue/Thu (英语, 数学场)
      return [
        { id: `${dateStr}-1`, text: "英语教材深研", status: 'pending', subject: "英语" },
        { id: `${dateStr}-2`, text: "数学错题/知识点收集整理", status: 'pending', subject: "数学" },
        { id: `${dateStr}-3`, text: "数学错题深研", status: 'pending', subject: "数学" },
        { id: `${dateStr}-4`, text: "生物", status: 'pending', subject: "生物" },
        { id: `${dateStr}-5`, text: "物理错题/知识点收集整理", status: 'pending', subject: "物理" },
        { id: `${dateStr}-6`, text: "", status: 'pending' }, // Empty slot
        { id: `${dateStr}-7`, text: "生物课本___阅读研习", status: 'pending', subject: "生物" },
        { id: `${dateStr}-8`, text: "物理错题深研", status: 'pending', subject: "物理" }
      ];
    }
  } else if (dayType === 'saturday') {
    return [
      { id: `${dateStr}-sat-1`, text: "", status: 'pending' }
    ];
  } else {
    // Sunday has no tasks (it's a stats day)
    return [];
  }
}

export function createInitialDayData(dateStr: string): DayData {
  const dayType = getDayType(dateStr);
  const dayOfWeek = getDayOfWeekIndex(dateStr);
  
  return {
    dateStr,
    isWeekend: dayType !== 'weekday',
    dayOfWeek,
    items: generateDefaultTasksForDate(dateStr),
    diary: dayType === 'weekday' ? "" : undefined,
    item4Text: dayType === 'weekday' ? "" : undefined,
    item6Text: dayType === 'weekday' ? "" : undefined,
    blankText7: dayType === 'weekday' ? "" : undefined
  };
}
