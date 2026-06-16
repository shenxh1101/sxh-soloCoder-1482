import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Download, Check, X, AlertCircle, RefreshCw, CalendarDays } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Trade, AttendanceStatus, TRADE_LABELS, ATTENDANCE_LABELS, Worker } from '@/types';
import { todayStr, getCurrentYearMonth } from '@/utils/date';
import { exportAttendance } from '@/utils/export';
import AttendanceCalendar from '@/components/AttendanceCalendar/AttendanceCalendar';

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'leave', 'absent'];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white border-emerald-500',
  leave: 'bg-amber-500 text-white border-amber-500',
  absent: 'bg-rose-500 text-white border-rose-500',
};

const STATUS_INACTIVE: Record<AttendanceStatus, string> = {
  present: 'bg-white text-emerald-600 border-slate-200 hover:border-emerald-400',
  leave: 'bg-white text-amber-600 border-slate-200 hover:border-amber-400',
  absent: 'bg-white text-rose-600 border-slate-200 hover:border-rose-400',
};

export default function Attendance() {
  const {
    workers,
    attendances,
    markAttendance,
    batchMarkAttendance,
    clearAttendanceByDate,
  } = useStore();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [pending, setPending] = useState<Map<string, AttendanceStatus>>(new Map());
  const [calendarWorker, setCalendarWorker] = useState<Worker | null>(null);
  const [calendarYm, setCalendarYm] = useState(getCurrentYearMonth());

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendances
      .filter((a) => a.date === selectedDate)
      .forEach((a) => map.set(a.workerId, a.status));
    pending.forEach((status, id) => map.set(id, status));
    return map;
  }, [attendances, selectedDate, pending]);

  const workerMonthAttendances = useMemo(() => {
    if (!calendarWorker) return [];
    return attendances.filter(
      (a) => a.workerId === calendarWorker.id && a.date.startsWith(calendarYm)
    );
  }, [calendarWorker, calendarYm, attendances]);

  function cycleStatus(workerId: string) {
    const current = attendanceMap.get(workerId);
    const idx = current ? STATUS_OPTIONS.indexOf(current) : -1;
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setPending((prev) => new Map(prev).set(workerId, next));
  }

  function setTradeAll(trade: Trade, status: AttendanceStatus) {
    const tradeWorkers = workers.filter((w) => w.trade === trade);
    const newPending = new Map(pending);
    tradeWorkers.forEach((w) => newPending.set(w.id, status));
    setPending(newPending);
  }

  function saveAll() {
    const records = Array.from(pending.entries()).map(([workerId, status]) => ({
      workerId,
      date: selectedDate,
      status,
    }));
    if (records.length > 0) {
      batchMarkAttendance(records);
      setPending(new Map());
    }
  }

  function resetDay() {
    clearAttendanceByDate(selectedDate);
    setPending(new Map());
  }

  const workersByTrade = (Object.keys(TRADE_LABELS) as Trade[]).map((trade) => ({
    trade,
    list: workers.filter((w) => w.trade === trade),
  }));

  const stats = STATUS_OPTIONS.map((s) => ({
    status: s,
    count: Array.from(attendanceMap.values()).filter((v) => v === s).length,
  }));

  const isToday = selectedDate === todayStr();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">考勤打卡</h1>
          <p className="text-slate-500 mt-1">
            {isToday ? '今天' : selectedDate} 的考勤记录，点击工人姓名旁的日历可查看月历
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPending(new Map());
              }}
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button
            onClick={() =>
              exportAttendance(workers, attendances, selectedDate.slice(0, 7))
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出考勤
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {stats.map(({ status, count }) => {
              const Icon =
                status === 'present'
                  ? Check
                  : status === 'leave'
                    ? AlertCircle
                    : X;
              const colors: Record<AttendanceStatus, string> = {
                present: 'text-emerald-600 bg-emerald-50',
                leave: 'text-amber-600 bg-amber-50',
                absent: 'text-rose-600 bg-rose-50',
              };
              return (
                <div
                  key={status}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${colors[status]}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">
                    {ATTENDANCE_LABELS[status]} {count}人
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetDay}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              清空当日
            </button>
            <button
              onClick={saveAll}
              disabled={pending.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              保存考勤 ({pending.size})
            </button>
          </div>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
          请先在"工人管理"中添加工人
        </div>
      ) : (
        <div className="space-y-4">
          {workersByTrade.map(({ trade, list }) => {
            if (list.length === 0) return null;
            const allPresent = list.every(
              (w) => attendanceMap.get(w.id) === 'present'
            );
            return (
              <div
                key={trade}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {TRADE_LABELS[trade]}
                    <span className="text-sm font-normal text-slate-500">
                      ({list.length}人)
                    </span>
                  </h3>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTradeAll(trade, s)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                          allPresent && s === 'present'
                            ? STATUS_STYLES[s]
                            : STATUS_INACTIVE[s]
                        }`}
                      >
                        全部{ATTENDANCE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                  {list.map((w) => {
                    const status = attendanceMap.get(w.id);
                    const hasPending = pending.has(w.id);
                    return (
                      <div
                        key={w.id}
                        className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                          status
                            ? STATUS_STYLES[status]
                            : 'border-dashed border-slate-200 hover:border-slate-300 bg-slate-50'
                        } ${hasPending ? 'ring-2 ring-offset-2 ring-indigo-400' : ''}`}
                      >
                        <div className="flex items-center justify-between px-3 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalendarWorker(w);
                              setCalendarYm(selectedDate.slice(0, 7));
                            }}
                            className={`p-1 rounded-lg transition-colors ${
                              status
                                ? 'text-white/80 hover:text-white hover:bg-white/20'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="查看月度考勤日历"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </button>
                          {hasPending && (
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white" />
                          )}
                        </div>
                        <button
                          onClick={() => cycleStatus(w.id)}
                          className={`w-full text-left px-4 pb-4 pt-1 ${status ? '' : ''}`}
                        >
                          <p
                            className={`font-semibold ${status ? '' : 'text-slate-700'}`}
                          >
                            {w.name}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              status ? 'text-white/80' : 'text-slate-500'
                            }`}
                          >
                            {status ? ATTENDANCE_LABELS[status] : '点击打卡'}
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {calendarWorker && (
        <AttendanceCalendar
          worker={calendarWorker}
          yearMonth={calendarYm}
          attendances={workerMonthAttendances}
          onClose={() => setCalendarWorker(null)}
          onChangeMonth={(ym) => setCalendarYm(ym)}
          onEditDay={(workerId, date, status) => {
            markAttendance(workerId, date, status);
          }}
        />
      )}
    </div>
  );
}
