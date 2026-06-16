import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Attendance, AttendanceStatus, ATTENDANCE_LABELS, ATTENDANCE_BG_COLORS, ATTENDANCE_LIGHT_BG, Worker } from '@/types';

interface AttendanceCalendarProps {
  worker: Worker;
  yearMonth: string;
  attendances: Attendance[];
  onClose: () => void;
  onChangeMonth: (ym: string) => void;
}

export default function AttendanceCalendar({
  worker,
  yearMonth,
  attendances,
  onClose,
  onChangeMonth,
}: AttendanceCalendarProps) {
  const [year, month] = yearMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const attendanceMap = useMemo(() => {
    const map = new Map<number, AttendanceStatus>();
    attendances.forEach((a) => {
      const day = Number(a.date.split('-')[2]);
      map.set(day, a.status);
    });
    return map;
  }, [attendances]);

  const stats = useMemo(() => {
    let present = 0,
      leave = 0,
      absent = 0;
    attendanceMap.forEach((s) => {
      if (s === 'present') present++;
      else if (s === 'leave') leave++;
      else if (s === 'absent') absent++;
    });
    return { present, leave, absent };
  }, [attendanceMap]);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    onChangeMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    onChangeMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {worker.name[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{worker.name}</h3>
              <p className="text-sm text-slate-500">月度考勤日历</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold text-slate-800">
              {year} 年 {month} 月
            </h4>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl p-3 text-center ${ATTENDANCE_LIGHT_BG.present}`}>
              <p className="text-xs text-emerald-700">出勤天数</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${ATTENDANCE_LIGHT_BG.leave}`}>
              <p className="text-xs text-amber-700">请假天数</p>
              <p className="text-2xl font-bold text-amber-600">{stats.leave}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${ATTENDANCE_LIGHT_BG.absent}`}>
              <p className="text-xs text-rose-700">旷工天数</p>
              <p className="text-2xl font-bold text-rose-600">{stats.absent}</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 font-medium py-2 border-b border-slate-200">
            {weekDays.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} className="aspect-square" />;
              const status = attendanceMap.get(day);
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium relative ${
                    status
                      ? `${ATTENDANCE_BG_COLORS[status]} text-white shadow-sm`
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <span>{day}</span>
                  {status && (
                    <span className="text-[10px] mt-0.5 opacity-90">
                      {ATTENDANCE_LABELS[status]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-5 pt-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              出勤
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              请假
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" />
              旷工
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
              未记录
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
