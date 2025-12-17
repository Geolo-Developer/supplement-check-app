import React, { useState, useEffect } from 'react';
import { Sun, Moon, Coffee, CheckCircle, Circle, Pill } from 'lucide-react';

// 型定義
type TimeSlot = 'morning' | 'lunch' | 'dinner';

interface CheckState {
  morning: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface StoredData {
  date: string;
  checks: CheckState;
}

export default function App() {
  // 今日の日付文字列を取得 (YYYY-MM-DD形式)
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // 状態管理
  const [checks, setChecks] = useState<CheckState>({
    morning: false,
    lunch: false,
    dinner: false,
  });
  const [lastDate, setLastDate] = useState<string>(getTodayString());
  const [isLoaded, setIsLoaded] = useState(false);

  // 初期ロードと日付変更チェック
  useEffect(() => {
    const loadData = () => {
      const today = getTodayString();
      const storedJson = localStorage.getItem('supplement-check-data');
      
      if (storedJson) {
        try {
          const storedData: StoredData = JSON.parse(storedJson);
          
          // 日付が変わっている場合はリセット
          if (storedData.date !== today) {
            const newData = { date: today, checks: { morning: false, lunch: false, dinner: false } };
            setChecks(newData.checks);
            setLastDate(today);
            localStorage.setItem('supplement-check-data', JSON.stringify(newData));
          } else {
            // 同日の場合はデータを復元
            setChecks(storedData.checks);
            setLastDate(storedData.date);
          }
        } catch (e) {
          console.error("データの読み込みに失敗しました", e);
        }
      } else {
        // 初回起動時
        setLastDate(today);
      }
      setIsLoaded(true);
    };

    loadData();

    // アプリがアクティブになった時にも日付を再チェック（深夜に開きっぱなしの場合などの対策）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // チェック状態を保存
  const toggleCheck = (slot: TimeSlot) => {
    const today = getTodayString();
    
    // もし操作中に日付が変わっていたらリセット処理を優先
    if (today !== lastDate) {
      const newData = { date: today, checks: { morning: false, lunch: false, dinner: false } };
      // 今回押したボタンだけをtrueにするかは要検討だが、混乱を防ぐため一度全リセットしてユーザーに再操作を促すUIも手だが、
      // ここではシンプルに「日付更新＆リセット」を行い、クリックは無効化（または新規として扱う）
      setChecks(newData.checks);
      setLastDate(today);
      localStorage.setItem('supplement-check-data', JSON.stringify(newData));
      return; 
    }

    const newChecks = { ...checks, [slot]: !checks[slot] };
    setChecks(newChecks);
    
    const dataToStore: StoredData = {
      date: today,
      checks: newChecks
    };
    localStorage.setItem('supplement-check-data', JSON.stringify(dataToStore));
  };

  // 進捗率の計算
  const completedCount = Object.values(checks).filter(Boolean).length;
  const progress = (completedCount / 3) * 100;

  // 今日の日付表示用
  const todayDisplay = new Date().toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">
        
        {/* ヘッダー */}
        <header className="bg-emerald-600 text-white p-6 rounded-b-[2rem] shadow-lg z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">サプリメント管理</p>
              <h1 className="text-3xl font-bold">{todayDisplay}</h1>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <Pill className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1 text-emerald-100">
              <span>今日の達成度</span>
              <span>{completedCount} / 3</span>
            </div>
            <div className="w-full bg-emerald-800/30 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6 flex flex-col gap-4 justify-center">
          
          <TimeSlotCard 
            slot="morning"
            label="朝食後"
            icon={<Coffee className="w-6 h-6" />}
            isChecked={checks.morning}
            onToggle={() => toggleCheck('morning')}
            colorClass="text-orange-500 bg-orange-50 border-orange-100"
            checkColorClass="bg-orange-500 border-orange-500"
          />

          <TimeSlotCard 
            slot="lunch"
            label="昼食後"
            icon={<Sun className="w-6 h-6" />}
            isChecked={checks.lunch}
            onToggle={() => toggleCheck('lunch')}
            colorClass="text-sky-500 bg-sky-50 border-sky-100"
            checkColorClass="bg-sky-500 border-sky-500"
          />

          <TimeSlotCard 
            slot="dinner"
            label="夕食後"
            icon={<Moon className="w-6 h-6" />}
            isChecked={checks.dinner}
            onToggle={() => toggleCheck('dinner')}
            colorClass="text-indigo-500 bg-indigo-50 border-indigo-100"
            checkColorClass="bg-indigo-500 border-indigo-500"
          />

        </main>

        {/* フッター的なメッセージ */}
        <footer className="p-6 text-center text-slate-400 text-xs">
          {completedCount === 3 ? (
            <p className="text-emerald-600 font-bold animate-pulse">🎉 今日の目標達成！お疲れ様でした！</p>
          ) : (
            <p>日付が変わると自動でリセットされます</p>
          )}
        </footer>
      </div>
    </div>
  );
}

// カードコンポーネント
function TimeSlotCard({ 
  slot, 
  label, 
  icon, 
  isChecked, 
  onToggle, 
  colorClass,
  checkColorClass 
}: { 
  slot: string;
  label: string; 
  icon: React.ReactNode; 
  isChecked: boolean; 
  onToggle: () => void;
  colorClass: string;
  checkColorClass: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative w-full p-5 rounded-2xl border-2 transition-all duration-300 ease-in-out group
        flex items-center justify-between
        ${isChecked 
          ? 'bg-white border-emerald-500 shadow-sm' 
          : `hover:shadow-md ${colorClass} border-transparent`
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          p-3 rounded-full transition-colors duration-300
          ${isChecked ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm'}
        `}>
          {isChecked ? <CheckCircle className="w-6 h-6" /> : icon}
        </div>
        <div className="text-left">
          <span className={`block text-xs font-bold uppercase tracking-wider mb-0.5 ${isChecked ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isChecked ? '摂取済み' : '未摂取'}
          </span>
          <span className={`text-xl font-bold ${isChecked ? 'text-slate-800' : 'text-slate-700'}`}>
            {label}
          </span>
        </div>
      </div>

      <div className={`
        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
        ${isChecked 
          ? 'bg-emerald-500 border-emerald-500 scale-110' 
          : 'border-slate-300 bg-white group-hover:border-slate-400'
        }
      `}>
        {isChecked && <CheckCircle className="w-5 h-5 text-white" />}
      </div>
    </button>
  );
}