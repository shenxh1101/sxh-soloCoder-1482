import { Link } from 'react-router-dom';
import { Users, CalendarCheck, Wallet, HandCoins, Plus, ArrowRight, Clock, PersonStanding } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { todayStr, getCurrentYearMonth } from '@/utils/date';
import { TRADE_LABELS, Trade } from '@/types';

export default function Dashboard() {
  const { workers, attendances, advances, calculateAllSalaries } = useStore();

  const today = todayStr();
  const yearMonth = getCurrentYearMonth();
  const todayAttendance = attendances.filter(a => a.date === today);
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const leaveCount = todayAttendance.filter(a => a.status === 'leave').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;

  const salaries = calculateAllSalaries(yearMonth);
  const totalGross = salaries.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalAdvance = advances
    .filter(a => a.date.startsWith(yearMonth))
    .reduce((sum, a) => sum + a.amount, 0);

  const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0);

  const workersByTrade = workers.reduce<Record<Trade, number>>((acc, w) => {
    acc[w.trade] = (acc[w.trade] || 0) + 1;
    return acc;
  }, {} as Record<Trade, number>);

  const stats = [
    { label: '工人总数', value: workers.length, icon: Users, color: 'from-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
    { label: '今日出勤', value: `${presentCount}人`, icon: CalendarCheck, color: 'from-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    { label: '本月应发', value: `¥${totalGross.toLocaleString()}`, icon: Wallet, color: 'from-amber-500', gradient: 'from-amber-500 to-amber-600' },
    { label: '本月借支', value: `¥${totalAdvance.toLocaleString()}`, icon: HandCoins, color: 'from-rose-500', gradient: 'from-rose-500 to-rose-600' },
  ];

  const quickActions = [
    { label: '今日打卡', to: '/attendance', icon: Clock, desc: '批量点卯记考勤', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: '添加工人', to: '/workers', icon: Plus, desc: '录入新工人信息', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { label: '登记借支', to: '/advances', icon: HandCoins, desc: '记录工人借支', color: 'bg-amber-500 hover:bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          欢迎回来 👋
        </h1>
        <p className="text-slate-500 mt-1">
          今天是 {today}，一起来看看今天的工地情况吧。
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80">{label}</p>
                <p className="text-2xl md:text-3xl font-bold mt-2">{value}</p>
              </div>
              <Icon className="w-8 h-8 text-white/70" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {quickActions.map(({ label, to, icon: Icon, desc, color }) => (
          <Link
            key={label}
            to={to}
            className={`${color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 block group`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-7 h-7" />
              <span className="text-xl font-bold">{label}</span>
              <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="mt-2 text-white/80 text-sm">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PersonStanding className="w-5 h-5 text-indigo-600" />
            按工种统计
          </h2>
          <div className="space-y-3">
            {(Object.entries(TRADE_LABELS) as [Trade, string][]).map(([trade, label]) => {
              const count = workersByTrade[trade] || 0;
              const percent = workers.length > 0 ? (count / workers.length) * 100 : 0;
              return (
                <div key={trade}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="text-slate-500">{count} 人</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            今日考勤概览
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-sm text-emerald-700 mt-1">出勤</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-amber-600">{leaveCount}</p>
              <p className="text-sm text-amber-700 mt-1">请假</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-rose-600">{absentCount}</p>
              <p className="text-sm text-rose-700 mt-1">旷工</p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">本月实发工资总额</span>
              <span className="text-2xl font-bold text-indigo-600">
                ¥{totalNet.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
