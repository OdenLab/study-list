import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, HelpCircle, Award } from 'lucide-react';
import { WheelState, WheelPrize } from '../types';
import { ALL_DATES, parseLocalDate, getDayType } from '../utils/dateHelpers';

interface LuckyWheelProps {
  wheelState: WheelState;
  currentDateStr: string;
  onSpin: (prize: WheelPrize, isExtraSpin: boolean) => void;
  onRegisterExam: () => void;
}

export default function LuckyWheel({
  wheelState,
  currentDateStr,
  onSpin,
  onRegisterExam
}: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastWonPrize, setLastWonPrize] = useState<string | null>(null);
  const [isRollingExtra, setIsRollingExtra] = useState(false);
  
  // Define standard wheel prizes
  const PRIZES: WheelPrize[] = [
    { id: 'none', name: '未中奖 (再接再厉)', probability: 90.999, type: 'none' },
    { id: 'waive_task_1', name: '免下一个工作日第1项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 0 },
    { id: 'waive_task_2', name: '免下一个工作日第2项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 1 },
    { id: 'waive_task_3', name: '免下一个工作日第3项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 2 },
    { id: 'waive_task_4', name: '免下一个工作日第4项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 3 },
    { id: 'waive_task_5', name: '免下一个工作日第5项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 4 },
    { id: 'waive_task_6', name: '免下一个工作日第6项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 5 }, // Slot 6 (empty)
    { id: 'waive_task_7', name: '免下一个工作日第7项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 6 },
    { id: 'waive_task_8', name: '免下一个工作日第8项任务', probability: 1.0, type: 'waive_task', targetTaskIndex: 7 },
    { id: 'waive_saturday', name: '免周六努力 (周六全空!)', probability: 0.5, type: 'waive_saturday' },
    { id: 'waive_mon', name: '免周一工作日全天', probability: 0.1, type: 'waive_weekday', targetDayOfWeek: 1 },
    { id: 'waive_tue', name: '免周二工作日全天', probability: 0.1, type: 'waive_weekday', targetDayOfWeek: 2 },
    { id: 'waive_wed', name: '免周三工作日全天', probability: 0.1, type: 'waive_weekday', targetDayOfWeek: 3 },
    { id: 'waive_thu', name: '免周四工作日全天', probability: 0.1, type: 'waive_weekday', targetDayOfWeek: 4 },
    { id: 'waive_fri', name: '免周五工作日全天', probability: 0.1, type: 'waive_weekday', targetDayOfWeek: 5 },
    { id: 'waive_week', name: '免下一周工作日 (神仙体验)', probability: 0.001, type: 'waive_week' },
  ];

  // Visual slices of the wheel (8 balanced visual categories)
  const VISUAL_SECTORS = [
    { label: '未中奖', color: 'bg-neutral-50 text-neutral-400 border-neutral-200' },
    { label: '免单项 1-3', color: 'bg-white text-neutral-800 border-neutral-300' },
    { label: '免单项 4-5', color: 'bg-neutral-50 text-neutral-800 border-neutral-300' },
    { label: '免周六努力', color: 'bg-yellow-50/50 text-amber-700 border-yellow-200/60' },
    { label: '免单项 7-8', color: 'bg-white text-neutral-800 border-neutral-300' },
    { label: '免全天(单日)', color: 'bg-emerald-50/40 text-emerald-800 border-emerald-200/50' },
    { label: '免整周工作日', color: 'bg-indigo-50/40 text-indigo-800 border-indigo-200/50' },
    { label: '未中奖', color: 'bg-neutral-50 text-neutral-400 border-neutral-200' },
  ];

  const hasDailySpinUsed = wheelState.lastSpunDate === currentDateStr;
  const extraSpinsRemaining = wheelState.extraSpinsTotal - wheelState.extraSpinsSpent;
  const canSpinDaily = !hasDailySpinUsed;
  const canSpinExtra = extraSpinsRemaining > 0;
  const canSpinAny = !isSpinning && (canSpinDaily || canSpinExtra);

  const startSpin = (isExtra: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsRollingExtra(isExtra);

    // Roll based on exact probabilities
    const roll = Math.random() * 100;
    let accum = 0;
    let selectedPrize = PRIZES[0]; // Default to none

    for (const p of PRIZES) {
      accum += p.probability;
      if (roll < accum) {
        selectedPrize = p;
        break;
      }
    }

    // Determine target rotation degree
    // Let's map prize to one of the 8 visual segments on the wheel to align nicely
    let targetSector = 0; // '未中奖'
    if (selectedPrize.type === 'waive_task') {
      const idx = selectedPrize.targetTaskIndex || 0;
      if (idx < 3) targetSector = 1;
      else if (idx < 5) targetSector = 2;
      else targetSector = 4;
    } else if (selectedPrize.type === 'waive_saturday') {
      targetSector = 3;
    } else if (selectedPrize.type === 'waive_weekday') {
      targetSector = 5;
    } else if (selectedPrize.type === 'waive_week') {
      targetSector = 6;
    } else {
      targetSector = Math.random() > 0.5 ? 0 : 7;
    }

    const sectorAngle = 360 / 8;
    const targetAngle = 360 - (targetSector * sectorAngle + sectorAngle / 2);
    const spins = 10; // spin 10 times for suspense
    const finalRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setLastWonPrize(selectedPrize.name);
      setShowResultModal(true);
      // Trigger state updates
      onSpin(selectedPrize, isExtra);
    }, 4500);
  };

  // Fun formulas for luck score (欧皇指数)
  const calculateLuckyStats = () => {
    const totalSpins = wheelState.logs.length;
    const wins = wheelState.logs.filter(l => l.prizeId !== 'none');
    const winCount = wins.length;
    
    let luckyIndex = 0;
    let tier = "非气缭绕 (心静自然凉)";
    let desc = "虽然还没有获得免除，但在踏踏实实手写练习中，你的实力在稳健提升。";

    if (totalSpins > 0) {
      // Calculate index based on rarity of prizes won
      let weightSum = 0;
      wins.forEach(w => {
        if (w.prizeId.startsWith('waive_task')) weightSum += 20;
        else if (w.prizeId === 'waive_saturday') weightSum += 50;
        else if (w.prizeId.startsWith('waive_weekday')) weightSum += 120;
        else if (w.prizeId === 'waive_week') weightSum += 1000;
      });
      luckyIndex = Math.min(100, Math.round((weightSum / totalSpins) + (winCount * 15)));
    }

    if (luckyIndex >= 85) {
      tier = "欧皇转世 (神明护体)";
      desc = "欧气爆棚！你简直是天选之子，连极小概率的免除都能轻松收入囊中！";
    } else if (luckyIndex >= 40) {
      tier = "锦鲤附体 (平步青云)";
      desc = "运气不错哦，常有小确幸降临在你的书桌前，免除了一些任务，省下了好些时间。";
    } else if (luckyIndex > 0) {
      tier = "平平无奇 (踏实小生)";
      desc = "普通的运气，大部分时候需要脚踏实地。不过别气馁，下一次好运就在眼前！";
    }

    return { luckyIndex, tier, desc, winCount, totalSpins };
  };

  const { luckyIndex, tier, desc, winCount, totalSpins } = calculateLuckyStats();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="lucky-wheel-view">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-neutral-800 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
          摸鱼大转盘
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-2">
          每天有一次基础抽奖机会，若完成试卷可登记额外抽取。所得免除任务将自动被彩色流光划去。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Wheel column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center" id="wheel-outer-container">
            {/* Arrow pointer */}
            <div className="absolute top-0 z-20 -mt-1 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-neutral-800" />
              <div className="w-1.5 h-3 bg-neutral-800 -mt-1 rounded-sm" />
            </div>

            {/* Spinning Circle */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={isSpinning ? { duration: 4.5, ease: [0.2, 0.8, 0.1, 1] } : { duration: 0 }}
              className="w-full h-full rounded-full border-[6px] border-neutral-800 relative overflow-hidden shadow-lg flex items-center justify-center bg-white"
              id="wheel-circle"
            >
              {/* Slices overlay */}
              {VISUAL_SECTORS.map((sec, i) => {
                const angle = 360 / 8;
                const rot = i * angle;
                return (
                  <div
                    key={i}
                    className={`absolute top-0 left-0 w-full h-full flex items-center justify-center`}
                    style={{
                      transform: `rotate(${rot}deg)`,
                    }}
                  >
                    {/* Visual dividing line */}
                    <div className="absolute top-0 bottom-1/2 left-1/2 w-px bg-neutral-800 origin-bottom" />
                    
                    {/* Sector Text */}
                    <div 
                      className={`absolute top-10 font-sans text-[10px] md:text-xs font-medium tracking-tight text-center max-w-[60px] select-none ${sec.color}`}
                      style={{
                        transform: 'rotate(22.5deg)', // rotate into the middle of the 45 deg sector
                        transformOrigin: 'center',
                      }}
                    >
                      {sec.label}
                    </div>
                  </div>
                );
              })}

              {/* Center button visual */}
              <div className="absolute w-12 h-12 bg-neutral-800 rounded-full border-4 border-white shadow flex items-center justify-center z-10">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center w-full max-w-md">
            <button
              id="daily-spin-btn"
              disabled={!canSpinDaily || isSpinning}
              onClick={() => startSpin(false)}
              className={`flex-1 py-3 px-5 rounded-xl text-sm font-sans font-medium border transition-all duration-300 flex items-center justify-center gap-2 ${
                canSpinDaily && !isSpinning
                  ? 'bg-neutral-800 text-white hover:bg-neutral-900 border-neutral-800 shadow'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
              }`}
            >
              {hasDailySpinUsed ? '📅 今日常规已转' : '🎯 每日一次抽奖'}
            </button>

            <button
              id="extra-spin-btn"
              disabled={!canSpinExtra || isSpinning}
              onClick={() => startSpin(true)}
              className={`flex-1 py-3 px-5 rounded-xl text-sm font-sans font-medium border transition-all duration-300 flex items-center justify-center gap-2 ${
                canSpinExtra && !isSpinning
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 shadow'
                  : 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed'
              }`}
            >
              🎁 试卷额外抽 ({extraSpinsRemaining}次)
            </button>
          </div>
        </div>

        {/* Info & Stats column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exam Claim Area */}
          <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-sm" id="exam-claim-card">
            <h3 className="font-sans font-medium text-sm text-neutral-800 flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-amber-500" />
              完成试卷兑换抽奖券
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed mb-4">
              假期辛苦刷题？每在单日独立完成一张试卷，即可兑换1张抽奖券。整个假期最多兑换 <span className="font-semibold text-neutral-800">3次</span>。
            </p>

            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((slot) => {
                const isEarned = wheelState.extraSpinsTotal >= slot;
                const isSpent = wheelState.extraSpinsSpent >= slot;
                return (
                  <div 
                    key={slot}
                    className={`flex-1 py-2 text-center rounded-lg border text-xs font-mono font-medium flex flex-col items-center justify-center gap-1 ${
                      isSpent 
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-400'
                        : isEarned 
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-white border-neutral-200 text-neutral-300 border-dashed'
                    }`}
                  >
                    <span>券 #{slot}</span>
                    <span className="text-[10px]">
                      {isSpent ? '已使用' : isEarned ? '待使用' : '未获得'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              id="register-exam-btn"
              disabled={wheelState.extraSpinsTotal >= 3}
              onClick={onRegisterExam}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-sans font-medium border transition-all duration-300 ${
                wheelState.extraSpinsTotal < 3
                  ? 'border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
              }`}
            >
              {wheelState.extraSpinsTotal < 3 ? '📝 登记：我今日刚独立做完一张试卷' : '已达兑换上限 (3次)'}
            </button>
          </div>

          {/* Lucky Stats Area */}
          <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-sm" id="lucky-stats-card">
            <h3 className="font-sans font-medium text-sm text-neutral-800 flex items-center gap-1.5 mb-4">
              <Trophy className="w-4 h-4 text-yellow-500" />
              欧气大盘点
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                  <span>欧皇指数</span>
                  <span className="font-mono font-semibold text-neutral-800">{luckyIndex}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neutral-800 transition-all duration-1000" 
                    style={{ width: `${luckyIndex}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-center">
                  <div className="text-[10px] text-neutral-400 font-sans">总抽奖次数</div>
                  <div className="text-lg font-mono font-semibold text-neutral-800 mt-0.5">{totalSpins}</div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-center">
                  <div className="text-[10px] text-neutral-400 font-sans">中奖次数</div>
                  <div className="text-lg font-mono font-semibold text-emerald-600 mt-0.5">{winCount}</div>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-150">
                <div className="text-xs font-sans font-medium text-neutral-700">{tier}</div>
                <div className="text-[11px] text-neutral-500 font-sans mt-1 leading-normal">{desc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spinnings Logs History */}
      {wheelState.logs.length > 0 && (
        <div className="mt-12 border-t border-neutral-200/50 pt-8" id="wheel-logs-container">
          <h3 className="font-sans font-medium text-sm text-neutral-800 mb-4 text-center">
            🎁 抽奖记录
          </h3>
          <div className="max-w-xl mx-auto space-y-2 max-h-48 overflow-y-auto pr-2">
            {wheelState.logs.map((log, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between text-xs py-2 px-3 bg-white border border-neutral-100 rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-neutral-400">{log.dateStr}</span>
                  <span className="text-neutral-300">|</span>
                  <span className={log.prizeId === 'none' ? 'text-neutral-500' : 'text-amber-600 font-medium'}>
                    {log.prizeName}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {log.isExtraSpin ? '试卷券' : '常规'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result dialog modal */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 bg-neutral-900/45 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-sm w-full p-6 text-center flex flex-col items-center"
              id="spin-result-modal"
            >
              <div className="w-14 h-14 bg-neutral-50 rounded-full border border-neutral-150 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>

              <h4 className="font-sans font-semibold text-lg text-neutral-800">
                {lastWonPrize === '未中奖 (再接再厉)' ? '遗憾擦肩' : '恭喜中奖！'}
              </h4>

              <p className="text-xs text-neutral-500 font-sans mt-2 px-2 leading-relaxed">
                {lastWonPrize === '未中奖 (再接再厉)' 
                  ? '这次没有中奖，去书桌前脚踏实地刷题吧。踏实前行才是欧皇的本色。'
                  : `获得奖项：【${lastWonPrize}】！该奖励已自动生效，对应日期任务将被彩色流光划去并算作完成。`}
              </p>

              <div className="mt-6 w-full">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="w-full py-2.5 bg-neutral-800 text-white rounded-lg text-xs font-sans font-medium hover:bg-neutral-900 transition-colors shadow-sm"
                  id="result-modal-close-btn"
                >
                  好 的
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
