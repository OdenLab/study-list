import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  HelpCircle, 
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { DayData, LikedQuote, WheelState, WheelPrize, WheelLog } from './types';
import { ALL_DATES, START_DATE, END_DATE, parseLocalDate, getDayType, getWeekNumForDate, getDayOfWeekIndex, getWeeks, formatChineseDate } from './utils/dateHelpers';
import { createInitialDayData } from './utils/templateHelpers';

import Sidebar from './components/Sidebar';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import TotalStatsView from './components/TotalStatsView';
import QuotesCollection from './components/QuotesCollection';
import LuckyWheel from './components/LuckyWheel';

export default function App() {
  const [currentDateStr, setCurrentDateStr] = useState<string>(START_DATE);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'stats' | 'quotes' | 'wheel'>('day');
  const [daysData, setDaysData] = useState<Record<string, DayData>>(() => {
    const initialDb: Record<string, DayData> = {};
    ALL_DATES.forEach(dateStr => {
      initialDb[dateStr] = createInitialDayData(dateStr);
    });
    return initialDb;
  });
  const [likedQuotes, setLikedQuotes] = useState<LikedQuote[]>([]);
  const [wheelState, setWheelState] = useState<WheelState>({
    lastSpunDate: null,
    extraSpinsSpent: 0,
    extraSpinsTotal: 0,
    logs: []
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastVisitedDay, setLastVisitedDay] = useState<string>(START_DATE);
  
  // Slide direction for day page flipping (-1 = left, 1 = right)
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Custom modal for handling empty slot 6 waivers
  const [showEmptySlotModal, setShowEmptySlotModal] = useState(false);
  const [pendingWaiverData, setPendingWaiverData] = useState<{
    targetDateStr: string;
    prize: WheelPrize;
  } | null>(null);

  // 1. Initial Loading & Local Storage Syncing
  useEffect(() => {
    const createCompleteDaysDb = (cached?: Record<string, DayData>): Record<string, DayData> => {
      const completeDb: Record<string, DayData> = {};
      ALL_DATES.forEach(dateStr => {
        completeDb[dateStr] = cached?.[dateStr] ?? createInitialDayData(dateStr);
      });
      return completeDb;
    };

    // A. Load days data. Always normalize cache so stale/corrupt localStorage cannot blank the app.
    try {
      const cachedDays = localStorage.getItem('daysData_v1');
      const parsedDays = cachedDays ? JSON.parse(cachedDays) as Record<string, DayData> : undefined;
      const completeDb = createCompleteDaysDb(parsedDays);
      localStorage.setItem('daysData_v1', JSON.stringify(completeDb));
      setDaysData(completeDb);
    } catch (error) {
      console.warn('Failed to load daysData_v1; resetting local study data.', error);
      const fallbackDb = createCompleteDaysDb();
      localStorage.setItem('daysData_v1', JSON.stringify(fallbackDb));
      setDaysData(fallbackDb);
    }

    // B. Load liked quotes
    try {
      const cachedQuotes = localStorage.getItem('likedQuotes_v1');
      if (cachedQuotes) {
        const parsedQuotes = JSON.parse(cachedQuotes);
        setLikedQuotes(Array.isArray(parsedQuotes) ? parsedQuotes : []);
      }
    } catch (error) {
      console.warn('Failed to load likedQuotes_v1; resetting quote likes.', error);
      localStorage.removeItem('likedQuotes_v1');
      setLikedQuotes([]);
    }

    // C. Load wheel stats
    try {
      const cachedWheel = localStorage.getItem('wheelState_v1');
      if (cachedWheel) {
        setWheelState({ ...wheelState, ...JSON.parse(cachedWheel) });
      }
    } catch (error) {
      console.warn('Failed to load wheelState_v1; resetting wheel state.', error);
      localStorage.removeItem('wheelState_v1');
    }
  }, []);

  // Save changes instantly to LocalStorage
  const saveDaysData = (updated: Record<string, DayData>) => {
    setDaysData(updated);
    localStorage.setItem('daysData_v1', JSON.stringify(updated));
  };

  const saveLikedQuotes = (updated: LikedQuote[]) => {
    setLikedQuotes(updated);
    localStorage.setItem('likedQuotes_v1', JSON.stringify(updated));
  };

  const saveWheelState = (updated: WheelState) => {
    setWheelState(updated);
    localStorage.setItem('wheelState_v1', JSON.stringify(updated));
  };

  // 2. Day flipping mechanics with sliding transitions
  const handleNextDay = () => {
    const idx = ALL_DATES.indexOf(currentDateStr);
    if (idx !== -1 && idx < ALL_DATES.length - 1) {
      setSlideDirection(1);
      const nextDate = ALL_DATES[idx + 1];
      setCurrentDateStr(nextDate);
      if (getDayType(nextDate) !== 'sunday') {
        setLastVisitedDay(nextDate);
      }
    }
  };

  const handlePrevDay = () => {
    const idx = ALL_DATES.indexOf(currentDateStr);
    if (idx !== -1 && idx > 0) {
      setSlideDirection(-1);
      const prevDate = ALL_DATES[idx - 1];
      setCurrentDateStr(prevDate);
      if (getDayType(prevDate) !== 'sunday') {
        setLastVisitedDay(prevDate);
      }
    }
  };

  // 3. Poetic Quotes Liked Actions
  const handleToggleLikeQuote = (dateStr: string, quoteText: string) => {
    const isAlreadyLiked = likedQuotes.some(q => q.dateStr === dateStr);
    let updated: LikedQuote[];

    if (isAlreadyLiked) {
      updated = likedQuotes.filter(q => q.dateStr !== dateStr);
    } else {
      updated = [
        ...likedQuotes,
        {
          dateStr,
          quote: quoteText,
          likedAt: Date.now()
        }
      ];
    }
    saveLikedQuotes(updated);
  };

  const handleUnlikeFromCollection = (dateStr: string) => {
    const updated = likedQuotes.filter(q => q.dateStr !== dateStr);
    saveLikedQuotes(updated);
  };

  // 4. Update daily state
  const handleUpdateDayData = (dateStr: string, dataPatch: Partial<DayData>) => {
    const db = { ...daysData };
    if (db[dateStr]) {
      db[dateStr] = { ...db[dateStr], ...dataPatch };
      saveDaysData(db);
    }
  };

  // 5. LUCKY SPIN ENGINE (Handling all the crazy waivers!)
  const handleSpinResult = (prize: WheelPrize, isExtra: boolean) => {
    // Increment spend counters
    const newWheelState = { ...wheelState };
    if (isExtra) {
      newWheelState.extraSpinsSpent = Math.min(newWheelState.extraSpinsTotal, newWheelState.extraSpinsSpent + 1);
    } else {
      newWheelState.lastSpunDate = currentDateStr;
    }

    // Append log
    const log: WheelLog = {
      timestamp: Date.now(),
      dateStr: currentDateStr,
      prizeId: prize.id,
      prizeName: prize.name,
      isExtraSpin: isExtra
    };
    newWheelState.logs = [log, ...newWheelState.logs];
    saveWheelState(newWheelState);

    if (prize.type === 'none') {
      return; // Better luck next time
    }

    // Apply waiver logic
    const db = { ...daysData };

    // Find next weekday Mon-Fri
    const findNextWeekdayFrom = (startFromStr: string): string | null => {
      const idx = ALL_DATES.indexOf(startFromStr);
      if (idx === -1) return null;
      for (let i = idx + 1; i < ALL_DATES.length; i++) {
        const dStr = ALL_DATES[i];
        if (getDayType(dStr) === 'weekday') return dStr;
      }
      return null;
    };

    // Find next Saturday
    const findNextSaturdayFrom = (startFromStr: string): string | null => {
      const idx = ALL_DATES.indexOf(startFromStr);
      if (idx === -1) return null;
      for (let i = idx + 1; i < ALL_DATES.length; i++) {
        const dStr = ALL_DATES[i];
        if (getDayType(dStr) === 'saturday') return dStr;
      }
      return null;
    };

    if (prize.type === 'waive_task') {
      const targetTaskIndex = prize.targetTaskIndex ?? 0;
      const targetDateStr = findNextWeekdayFrom(currentDateStr);
      
      if (targetDateStr && db[targetDateStr]) {
        // If target task is index 5 (item 6) and it is currently empty, we trigger the confirmation sequence!
        if (targetTaskIndex === 5 && !db[targetDateStr].item6Text) {
          setPendingWaiverData({ targetDateStr, prize });
          setShowEmptySlotModal(true);
        } else {
          // Standard apply waiver to task
          db[targetDateStr].items[targetTaskIndex].isWaived = true;
          db[targetDateStr].items[targetTaskIndex].status = 'completed';
          saveDaysData(db);
        }
      }
    } else if (prize.type === 'waive_saturday') {
      const targetDateStr = findNextSaturdayFrom(currentDateStr);
      if (targetDateStr && db[targetDateStr]) {
        db[targetDateStr].items = db[targetDateStr].items.map(item => ({
          ...item,
          isWaived: true,
          status: 'completed'
        }));
        saveDaysData(db);
      }
    } else if (prize.type === 'waive_weekday') {
      const targetDayOfWeek = prize.targetDayOfWeek ?? 1;
      // Find next weekday matching that day of week index (Mon-Fri)
      let targetDateStr: string | null = null;
      const idx = ALL_DATES.indexOf(currentDateStr);
      if (idx !== -1) {
        for (let i = idx + 1; i < ALL_DATES.length; i++) {
          const dStr = ALL_DATES[i];
          if (getDayType(dStr) === 'weekday' && getDayOfWeekIndex(dStr) === targetDayOfWeek) {
            targetDateStr = dStr;
            break;
          }
        }
      }

      if (targetDateStr && db[targetDateStr]) {
        db[targetDateStr].items = db[targetDateStr].items.map(item => ({
          ...item,
          isWaived: true,
          status: 'completed'
        }));
        saveDaysData(db);
      }
    } else if (prize.type === 'waive_week') {
      // Find the next Mon-Fri full week (starts on Monday)
      let targetMondayStr: string | null = null;
      const idx = ALL_DATES.indexOf(currentDateStr);
      if (idx !== -1) {
        for (let i = idx + 1; i < ALL_DATES.length; i++) {
          const dStr = ALL_DATES[i];
          if (getDayType(dStr) === 'weekday' && getDayOfWeekIndex(dStr) === 1) { // Monday
            targetMondayStr = dStr;
            break;
          }
        }
      }

      if (targetMondayStr) {
        const mondayIdx = ALL_DATES.indexOf(targetMondayStr);
        // Waive Mon, Tue, Wed, Thu, Fri (5 consecutive dates in ALL_DATES list)
        for (let offset = 0; offset < 5; offset++) {
          const dayStr = ALL_DATES[mondayIdx + offset];
          if (dayStr && db[dayStr] && getDayType(dayStr) === 'weekday') {
            db[dayStr].items = db[dayStr].items.map(item => ({
              ...item,
              isWaived: true,
              status: 'completed'
            }));
          }
        }
        saveDaysData(db);
      }
    }
  };

  // Special Prompt Option A: Waive Item 6 as blank anyway
  const handleConfirmEmptySlotWaiver = () => {
    if (!pendingWaiverData) return;
    const { targetDateStr, prize } = pendingWaiverData;
    const db = { ...daysData };

    if (db[targetDateStr]) {
      db[targetDateStr].items[5].isWaived = true;
      db[targetDateStr].items[5].status = 'completed';
      db[targetDateStr].item6Text = "🏆 抽中免除 (留空项目)";
      saveDaysData(db);
    }

    setPendingWaiverData(null);
    setShowEmptySlotModal(false);
  };

  // Special Prompt Option B: Redistribute probability equally among other 7 items
  const handleRedistributeWaiver = () => {
    if (!pendingWaiverData) return;
    const { targetDateStr } = pendingWaiverData;
    const db = { ...daysData };

    if (db[targetDateStr]) {
      // Pick a random index from other 7 items (excluding index 5)
      const validIndices = [0, 1, 2, 3, 4, 6, 7];
      const randIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
      
      db[targetDateStr].items[randIdx].isWaived = true;
      db[targetDateStr].items[randIdx].status = 'completed';
      saveDaysData(db);
    }

    setPendingWaiverData(null);
    setShowEmptySlotModal(false);
  };

  // 6. Register finished mock exams (max 3)
  const handleRegisterExam = () => {
    if (wheelState.extraSpinsTotal >= 3) return;
    const updated = {
      ...wheelState,
      extraSpinsTotal: Math.min(3, wheelState.extraSpinsTotal + 1)
    };
    saveWheelState(updated);
  };

  // 7. Navigation shortcuts
  const handleJumpToSunday = () => {
    const weekNum = getWeekNumForDate(currentDateStr);
    const weeksList = getWeeks();
    const targetWeek = weeksList.find(w => w.weekNum === weekNum);
    
    if (targetWeek) {
      // Sunday is the last item of that week (index 6, or last element)
      const targetSunday = targetWeek.dates[targetWeek.dates.length - 1];
      if (getDayType(targetSunday) === 'sunday') {
        setLastVisitedDay(currentDateStr);
        setCurrentDateStr(targetSunday);
        setCurrentView('day');
      }
    }
  };

  const handleReturnFromSunday = () => {
    if (lastVisitedDay) {
      setCurrentDateStr(lastVisitedDay);
      setCurrentView('day');
    }
  };

  // 8. DOUBLE PINCH TO ZOOM - GESTURE HANDLER
  // Since browser iframes don't receive multitouch pitch events smoothly, we also support:
  // Double Clicking on the content area zooms out from Day -> Week -> Month,
  // making it extremely responsive, plus obvious visual buttons in the control bar!
  const handleContentDoubleClick = () => {
    if (currentView === 'day') {
      setCurrentView('week');
    } else if (currentView === 'week') {
      setCurrentView('month');
    }
  };

  // Slide Animation configurations
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 150 : -150,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 }
      }
    })
  };

  const activeDayData = daysData[currentDateStr];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-850 font-sans selection:bg-neutral-800 selection:text-white pb-12">
      {/* Top Header Rail */}
      <header className="sticky top-0 bg-neutral-50/90 backdrop-blur-md z-30 border-b border-neutral-200/50 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-neutral-200/50 rounded-xl transition-colors duration-200"
            id="open-sidebar-btn"
          >
            <Menu className="w-5 h-5 text-neutral-700 stroke-[1.8]" />
          </button>
          
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-sans font-semibold text-neutral-800">暑期自主学习清单</span>
            <span className="text-[9px] font-mono text-neutral-400 tracking-wider">EST. 2026</span>
          </div>
        </div>

        {/* Zoom & Navigation indicator buttons */}
        <div className="flex items-center bg-white border border-neutral-200 p-0.5 rounded-xl shadow-2xs gap-0.5">
          <button
            onClick={() => setCurrentView('day')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all font-sans flex items-center gap-1 ${
              currentView === 'day' 
                ? 'bg-neutral-800 text-white font-medium shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            id="view-tab-day"
          >
            日清单
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all font-sans flex items-center gap-1 ${
              currentView === 'week' 
                ? 'bg-neutral-800 text-white font-medium shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            id="view-tab-week"
          >
            周视图
          </button>
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all font-sans flex items-center gap-1 ${
              currentView === 'month' 
                ? 'bg-neutral-800 text-white font-medium shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            id="view-tab-month"
          >
            月视图
          </button>
        </div>
      </header>

      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        onJumpToWeeklyStats={handleJumpToSunday}
      />

      {/* Main content wrapper */}
      <main 
        className="max-w-5xl mx-auto mt-6" 
        onDoubleClick={handleContentDoubleClick}
        title="提示: 双击空白处可进入上一级视图 (日 -> 周 -> 月)"
        id="main-app-content"
      >
        <AnimatePresence mode="wait">
          {currentView === 'day' && activeDayData && (
            <motion.div
              key={currentDateStr}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <DayView
                dayData={activeDayData}
                likedQuotes={likedQuotes}
                onToggleLikeQuote={handleToggleLikeQuote}
                onUpdateDayData={handleUpdateDayData}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
                onJumpToSunday={handleJumpToSunday}
                onReturnFromSunday={handleReturnFromSunday}
                lastVisitedDay={lastVisitedDay}
              />
            </motion.div>
          )}

          {currentView === 'week' && (
            <motion.div
              key="week-view-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <WeekView
                daysData={daysData}
                currentDateStr={currentDateStr}
                onSelectDate={setCurrentDateStr}
                onViewChange={setCurrentView}
              />
            </motion.div>
          )}

          {currentView === 'month' && (
            <motion.div
              key="month-view-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <MonthView
                daysData={daysData}
                currentDateStr={currentDateStr}
                onSelectDate={setCurrentDateStr}
                onViewChange={setCurrentView}
              />
            </motion.div>
          )}

          {currentView === 'stats' && (
            <motion.div
              key="stats-view-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <TotalStatsView
                daysData={daysData}
                wheelState={wheelState}
              />
            </motion.div>
          )}

          {currentView === 'quotes' && (
            <motion.div
              key="quotes-view-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <QuotesCollection
                likedQuotes={likedQuotes}
                onUnlike={handleUnlikeFromCollection}
              />
            </motion.div>
          )}

          {currentView === 'wheel' && (
            <motion.div
              key="wheel-view-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <LuckyWheel
                wheelState={wheelState}
                currentDateStr={currentDateStr}
                onSpin={handleSpinResult}
                onRegisterExam={handleRegisterExam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Double confirmation modal for empty Item 6 slots won on the wheel */}
      <AnimatePresence>
        {showEmptySlotModal && pendingWaiverData && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xl max-w-md w-full"
              id="empty-slot-modal"
            >
              <h4 className="font-sans font-bold text-base text-neutral-800 flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                第6项空白任务免除确认
              </h4>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed mb-4">
                下一个工作日（{formatChineseDate(pendingWaiverData.targetDateStr).split(' ')[0]}）的【第6项：留空目标】当前未填写具体内容。
                您是希望直接将空项目免除，还是希望将该免除特权【平分概率】随机分配给该天其他 7 项任务之一？
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleConfirmEmptySlotWaiver}
                  className="w-full py-2.5 bg-neutral-800 text-white rounded-lg text-xs font-sans font-medium hover:bg-neutral-900 transition-colors shadow-2xs"
                  id="confirm-empty-btn"
                >
                  🎯 确认留空免除（计为第6项完成）
                </button>
                <button
                  onClick={handleRedistributeWaiver}
                  className="w-full py-2.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-xs font-sans font-medium hover:bg-neutral-50 transition-colors"
                  id="redistribute-btn"
                >
                  🎲 概率平分（随机免除其他7项之一）
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
