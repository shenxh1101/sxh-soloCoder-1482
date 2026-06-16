import { useState } from 'react';
import { Plus, Pencil, Trash2, Download, ChevronDown, ChevronUp, User, Phone } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal/Modal';
import { Worker, Trade, TRADE_LABELS } from '@/types';
import { todayStr } from '@/utils/date';
import { exportWorkers } from '@/utils/export';

const emptyForm: Omit<Worker, 'id' | 'createdAt'> = {
  name: '',
  trade: 'carpenter',
  dailyRate: 300,
  unitPrice: 50,
  joinDate: todayStr(),
  phone: '',
  remark: '',
};

export default function Workers() {
  const { workers, addWorker, updateWorker, deleteWorker } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedTrades, setExpandedTrades] = useState<Set<Trade>>(
    new Set(Object.keys(TRADE_LABELS) as Trade[])
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(w: Worker) {
    setEditing(w);
    setForm({
      name: w.name,
      trade: w.trade,
      dailyRate: w.dailyRate,
      unitPrice: w.unitPrice,
      joinDate: w.joinDate,
      phone: w.phone ?? '',
      remark: w.remark ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editing) {
      updateWorker(editing.id, form);
    } else {
      addWorker(form);
    }
    setModalOpen(false);
  }

  function toggleTrade(trade: Trade) {
    setExpandedTrades((prev) => {
      const next = new Set(prev);
      if (next.has(trade)) {
        next.delete(trade);
      } else {
        next.add(trade);
      }
      return next;
    });
  }

  const workersByTrade = (Object.keys(TRADE_LABELS) as Trade[]).map((trade) => ({
    trade,
    list: workers.filter((w) => w.trade === trade),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工人管理</h1>
          <p className="text-slate-500 mt-1">共 {workers.length} 名工人</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportWorkers(workers)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出花名册
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            添加工人
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {workersByTrade.map(({ trade, list }) => {
          const isExpanded = expandedTrades.has(trade);
          const tradeColor: Record<Trade, string> = {
            carpenter: 'from-amber-500 to-amber-600',
            mason: 'from-stone-500 to-stone-600',
            plumber_electrician: 'from-sky-500 to-sky-600',
            painter: 'from-rose-500 to-rose-600',
          };
          return (
            <div key={trade} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => toggleTrade(trade)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tradeColor[trade]} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                    {TRADE_LABELS[trade][0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{TRADE_LABELS[trade]}</h3>
                    <p className="text-sm text-slate-500">{list.length} 人</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {isExpanded && list.length > 0 && (
                <div className="border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                    {list.map((w) => (
                      <div
                        key={w.id}
                        className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-lg">
                              {w.name[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{w.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                <User className="w-3 h-3" />
                                <span>{TRADE_LABELS[w.trade]}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(w)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(w.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-500">日薪</p>
                            <p className="font-semibold text-slate-800">¥{w.dailyRate}/天</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-500">包活单价</p>
                            <p className="font-semibold text-slate-800">¥{w.unitPrice}/㎡</p>
                          </div>
                        </div>
                        {w.phone && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{w.phone}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && list.length === 0 && (
                <div className="p-8 text-center text-slate-400 border-t border-slate-100">
                  暂无工人，点击右上角添加
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} title={editing ? '编辑工人' : '添加工人'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">工种</label>
            <select
              value={form.trade}
              onChange={(e) => setForm({ ...form, trade: e.target.value as Trade })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              {(Object.entries(TRADE_LABELS) as [Trade, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">日薪 (元/天)</label>
              <input
                type="number"
                min={0}
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">包活单价 (元/㎡)</label>
              <input
                type="number"
                min={0}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">入职日期</label>
            <input
              type="date"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">电话（选填）</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="请输入电话号码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="备注信息"
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
              {editing ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="确认删除"
        onClose={() => setConfirmDelete(null)}
      >
        <p className="text-slate-600">确定要删除该工人吗？相关的考勤、借支等数据也会一并删除。</p>
        <div className="flex gap-3 pt-6">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (confirmDelete) deleteWorker(confirmDelete);
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
