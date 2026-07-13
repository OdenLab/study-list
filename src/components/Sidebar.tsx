import React from 'react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  BookOpen, 
  LayoutGrid, 
  Trophy 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'day' | 'week' | 'month' | 'stats' | 'quotes' | 'wheel';
  onViewChange: (view: 'day' | 'week' | 'month' | 'stats' | 'quotes' | 'wheel') => void;
  onJumpToWeeklyStats: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  currentView,
  onViewChange,
  onJumpToWeeklyStats
}: SidebarProps) {
  const menuItems = [
    { id: 'day', label: '每日清单', icon: BookOpen },
    { id: 'week', label: '周视图', icon: Calendar },
    { id: 'month', label: '月视图', icon: LayoutGrid },
    { id: 'stats', label: '总统计页', icon: TrendingUp },
    { id: 'quotes', label: '赠语收藏页', icon: Heart },
    { id: 'wheel', label: '摸鱼大转盘', icon: Sparkles },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/10 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={onClose}
          id="sidebar-backdrop"
        />
      )}

      {/* Sidebar drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-72 bg-neutral-50/95 border-r border-neutral-200/60 shadow-xl z-50 flex flex-col p-6 backdrop-blur-md"
        id="sidebar-panel"
      >
        <div className="flex items-center justify-between mb-10 border-b border-neutral-200/50 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neutral-800 stroke-[1.5]" />
            <span className="font-sans font-medium tracking-wide text-neutral-800 text-lg">
              极简学习清单
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-200/40 rounded-full transition-colors duration-200"
            id="sidebar-close-btn"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                  isActive 
                    ? 'bg-neutral-800 text-white font-medium shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-200/30 hover:text-neutral-900'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[1.8] ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-200/50">
          <button
            id="sidebar-week-stats-btn"
            onClick={() => {
              onJumpToWeeklyStats();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-sans border border-neutral-300 text-neutral-700 hover:bg-neutral-800 hover:text-white hover:border-neutral-800 transition-all duration-300 shadow-sm"
          >
            📊 跳转至当周统计
          </button>
          
          <div className="mt-4 text-center">
            <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
              2026 SUMMER PLANNER
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
