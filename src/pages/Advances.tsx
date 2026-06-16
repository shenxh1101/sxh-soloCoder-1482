import { useState } from 'react';
import { HandCoins, Plus, Trash2, Download, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal/Modal';
import { TRADE_LABELS } from '@/types';
import { todayStr } from '@/utils/date';
import { exportAdvances } from '@/utils/export';

export default function Advances() {
  const { workers, advances, addAdvance, deleteAdvance } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    workerId: '',
    date: todayStr(),
    amount: 0,
    remark: '',
  });
  const [filterWorker, setFilterWorker] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const filteredAdvances = advances
    .filter((a) => !filterWorker || a.workerId === filterWorker)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = filteredAdvances.reduce((sum, a) => sum + a.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.workerId || form.amount <= 0) return;
    addAdvance(form);
    setModalOpen(false);
    setForm({ workerId: '', date: todayStr(), amount: 0, remark: '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">借支管理</h1>
          <p className="text-slate-500 mt-1">
            共 {filteredAdvances.length} 笔借支，合计 <span className="text-amber-600 font-semibold">¥{totalAmount.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">全部工人</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} - {TRADE_LABELS[w.trade]}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportAdvances(workers, advances, filterWorker ? undefined : undefined)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出记录
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            登记借支
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <HandCoins className="w-8 h-8 text-white/70" />
          </div>
          <p className="text-sm text-white/80 mt-3">借支总笔数</p>
          <p className="text-3xl font-bold mt-1">{advances.length}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl p-5 shadow-lg col-span-1 md:col-span-3">
          <p className="text-sm text-white/80">借支总金额</p>
          <p className="text-3xl font-bold mt-1">¥{advances.reduce((s, a) => s + a.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredAdvances.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            暂无借支记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="px-5 py-4 font-medium">日期</th>
                  <th className="px-5 py-4 font-medium">姓名</th>
                  <th className="px-5 py-4 font-medium">工种</th>
                  <th className="px-5 py-4 font-medium text-right">金额</th>
                  <th className="px-5 py-4 font-medium">备注</th>
                  <th className="px-5 py-4 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvances.map((a) => {
                  const w = workerMap.get(a.workerId);
                  return (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-slate-600">{a.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-sm font-bold">
                            {w?.name[0] || '?'}
                          </div>
                          <span className="font-medium text-slate-800">{w?.name || '未知工人'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{w ? TRADE_LABELS[w.trade] : '-'}</td>
                      <td className="px-5 py-4 text-right font-semibold text-amber-600 text-base">
                        ¥{a.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{a.remark || '-'}</td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setConfirmDelete(a.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="登记借支" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">选择工人</label>
            <select
              required
              value={form.workerId}
              onChange={(e) => setForm({ ...form, workerId: e.target.value })}
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
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">借支金额 (元)</label>
            <input
              type="number"
              min={0}
              required
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入借支金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
            <input
              type="text"
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：生活费、家里急用等"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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

      <Modal
        open={!!confirmDelete}
        title="确认删除"
        onClose={() => setConfirmDelete(null)}
      >
        <p className="text-slate-600">确定要删除这条借支记录吗？此操作不可撤销。</p>
        <div className="flex gap-3 pt-6">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (confirmDelete) deleteAdvance(confirmDelete);
              setConfirmDelete(null);
            }}
            className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
          >
            确认删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
