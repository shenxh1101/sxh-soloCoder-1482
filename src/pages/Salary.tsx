import { useState, useMemo } from 'react';
import { Wallet, Download, ChevronRight, Layers, Calendar, HandCoins } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal/Modal';
import { Trade, TRADE_LABELS, SalaryDetail } from '@/types';
import { getCurrentYearMonth } from '@/utils/date';
import { exportSalary } from '@/utils/export';

export default function Salary() {
  const { workers, calculateAllSalaries, addProjectWork } = useStore();
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());
  const [detailModal, setDetailModal] = useState<SalaryDetail | null>(null);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    workerId: '',
    date: todayStr(),
    area: 0,
    remark: '',
  });

  const salaries = useMemo(() => calculateAllSalaries(yearMonth), [calculateAllSalaries, yearMonth]);

  const totals = salaries.reduce(
    (acc, s) => ({
      dailyWage: acc.dailyWage + s.dailyWage,
      projectWage: acc.projectWage + s.projectWage,
      grossSalary: acc.grossSalary + s.grossSalary,
      totalAdvance: acc.totalAdvance + s.totalAdvance,
      netSalary: acc.netSalary + s.netSalary,
    }),
    { dailyWage: 0, projectWage: 0, grossSalary: 0, totalAdvance: 0, netSalary: 0 }
  );

  const salariesByTrade = (Object.keys(TRADE_LABELS) as Trade[]).map((trade) => ({
    trade,
    list: salaries.filter((s) => s.trade === trade),
  }));

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleWorkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workForm.workerId || workForm.area <= 0) return;
    addProjectWork({
      workerId: workForm.workerId,
      date: workForm.date,
      area: workForm.area,
      remark: workForm.remark,
    });
    setWorkModalOpen(false);
    setWorkForm({ workerId: '', date: todayStr(), area: 0, remark: '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工资结算</h1>
          <p className="text-slate-500 mt-1">{yearMonth} 月度工资报表</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            onClick={() => setWorkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4" />
            登记包活
          </button>
          <button
            onClick={() => exportSalary(salaries, yearMonth)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            导出工资表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-white/80">点工工资</p>
          <p className="text-2xl font-bold mt-1">¥{totals.dailyWage.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-white/80">包活工资</p>
          <p className="text-2xl font-bold mt-1">¥{totals.projectWage.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-white/80">应发合计</p>
          <p className="text-2xl font-bold mt-1">¥{totals.grossSalary.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-white/80">借支扣除</p>
          <p className="text-2xl font-bold mt-1">¥{totals.totalAdvance.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl p-4 shadow-lg col-span-2 lg:col-span-1">
          <p className="text-sm text-white/80">实发工资</p>
          <p className="text-2xl font-bold mt-1">¥{totals.netSalary.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {salariesByTrade.map(({ trade, list }) => {
          if (list.length === 0) return null;
          const tradeTotal = list.reduce(
            (acc, s) => ({
              gross: acc.gross + s.grossSalary,
              advance: acc.advance + s.totalAdvance,
              net: acc.net + s.netSalary,
            }),
            { gross: 0, advance: 0, net: 0 }
          );
          return (
            <div key={trade} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-800">
                  {TRADE_LABELS[trade]}
                  <span className="text-sm font-normal text-slate-500 ml-2">({list.length}人)</span>
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">应发 <span className="font-semibold text-slate-800">¥{tradeTotal.gross.toLocaleString()}</span></span>
                  <span className="text-slate-500">借支 <span className="font-semibold text-amber-600">¥{tradeTotal.advance.toLocaleString()}</span></span>
                  <span className="text-slate-500">实发 <span className="font-semibold text-emerald-600">¥{tradeTotal.net.toLocaleString()}</span></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-4 py-3 font-medium">姓名</th>
                      <th className="px-4 py-3 font-medium text-center">出勤</th>
                      <th className="px-4 py-3 font-medium text-center">请假</th>
                      <th className="px-4 py-3 font-medium text-center">旷工</th>
                      <th className="px-4 py-3 font-medium text-right">点工工资</th>
                      <th className="px-4 py-3 font-medium text-right">完成面积</th>
                      <th className="px-4 py-3 font-medium text-right">包活工资</th>
                      <th className="px-4 py-3 font-medium text-right">应发</th>
                      <th className="px-4 py-3 font-medium text-right">借支</th>
                      <th className="px-4 py-3 font-medium text-right">实发</th>
                      <th className="px-4 py-3 font-medium text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s) => (
                      <tr key={s.workerId} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{s.workerName}</td>
                        <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{s.presentDays}</td>
                        <td className="px-4 py-3 text-center text-amber-600">{s.leaveDays}</td>
                        <td className="px-4 py-3 text-center text-rose-600">{s.absentDays}</td>
                        <td className="px-4 py-3 text-right text-slate-700">¥{s.dailyWage.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{s.totalArea}㎡</td>
                        <td className="px-4 py-3 text-right text-slate-700">¥{s.projectWage.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">¥{s.grossSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-amber-600">-¥{s.totalAdvance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">¥{s.netSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailModal(s)}
                            className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 text-sm"
                          >
                            明细 <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!detailModal} title="工资明细" onClose={() => setDetailModal(null)}>
        {detailModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {detailModal.workerName[0]}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">{detailModal.workerName}</h4>
                <p className="text-slate-500 text-sm">{TRADE_LABELS[detailModal.trade]}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-700">出勤天数</p>
                <p className="text-xl font-bold text-emerald-600">{detailModal.presentDays}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-700">请假天数</p>
                <p className="text-xl font-bold text-amber-600">{detailModal.leaveDays}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 text-center">
                <p className="text-xs text-rose-700">旷工天数</p>
                <p className="text-xl font-bold text-rose-600">{detailModal.absentDays}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2"><Calendar className="w-4 h-4" /> 点工工资</span>
                <span className="font-semibold text-slate-800">¥{detailModal.dailyWage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2"><Layers className="w-4 h-4" /> 包活工资 ({detailModal.totalArea}㎡ × ¥{detailModal.unitPrice})</span>
                <span className="font-semibold text-slate-800">¥{detailModal.projectWage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-slate-100">
                <span className="text-slate-700 font-medium">应发工资</span>
                <span className="font-bold text-indigo-600 text-lg">¥{detailModal.grossSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2"><HandCoins className="w-4 h-4" /> 借支扣除</span>
                <span className="font-semibold text-amber-600">-¥{detailModal.totalAdvance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-slate-100 bg-gradient-to-r from-emerald-50 to-transparent -mx-6 px-6">
                <span className="text-slate-800 font-bold">实发工资</span>
                <span className="font-bold text-emerald-600 text-2xl">¥{detailModal.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={workModalOpen} title="登记包活工作量" onClose={() => setWorkModalOpen(false)}>
        <form onSubmit={handleWorkSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">选择工人</label>
            <select
              required
              value={workForm.workerId}
              onChange={(e) => setWorkForm({ ...workForm, workerId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">请选择工人</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} - {TRADE_LABELS[w.trade]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">日期</label>
            <input
              type="date"
              required
              value={workForm.date}
              onChange={(e) => setWorkForm({ ...workForm, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">完成面积 (㎡)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              required
              value={workForm.area || ''}
              onChange={(e) => setWorkForm({ ...workForm, area: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入完成面积"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
            <input
              type="text"
              value={workForm.remark}
              onChange={(e) => setWorkForm({ ...workForm, remark: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：3层吊顶、客厅地砖等"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWorkModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
            >
              确认登记
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
