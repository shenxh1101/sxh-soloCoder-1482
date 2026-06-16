import { useState, useMemo } from 'react';
import {
  Wallet,
  Download,
  ChevronRight,
  Layers,
  Calendar,
  HandCoins,
  CheckCircle2,
  CircleDashed,
  FileCheck,
  Building2,
  PenLine,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal/Modal';
import {
  Trade,
  TRADE_LABELS,
  SalaryDetail,
  PayrollSlip,
  PayrollStatus,
  PAYROLL_STATUS_LABELS,
  ProjectWork,
  Worker,
} from '@/types';
import { getCurrentYearMonth, todayStr } from '@/utils/date';
import { exportSalary } from '@/utils/export';

type TabKey = 'salary' | 'payroll';

interface WorkFormData {
  workerId: string;
  date: string;
  project: string;
  building: string;
  floor: string;
  area: number;
  remark: string;
}

function groupProjectWorks(
  works: ProjectWork[],
  workers: Worker[]
): Record<string, { project: string; building: string; floor: string; totalArea: number; count: number; wage: number; items: ProjectWork[] }> {
  const workerMap = new Map(workers.map((w) => [w.id, w]));
  const groups: Record<string, any> = {};
  works.forEach((w) => {
    const key = `${w.project || '未命名项目'}||${w.building || '-'}||${w.floor || '-'}`;
    const worker = workerMap.get(w.workerId);
    const unitPrice = worker?.unitPrice || 0;
    if (!groups[key]) {
      groups[key] = {
        project: w.project || '未命名项目',
        building: w.building || '-',
        floor: w.floor || '-',
        totalArea: 0,
        count: 0,
        wage: 0,
        items: [],
      };
    }
    groups[key].totalArea += w.area;
    groups[key].count += 1;
    groups[key].wage += w.area * unitPrice;
    groups[key].items.push(w);
  });
  return groups;
}

export default function Salary() {
  const {
    workers,
    projectWorks,
    calculateAllSalaries,
    addProjectWork,
    deleteProjectWork,
    getProjectWorksByWorkerMonth,
    generatePayrollSlips,
    getPayrollSlipsByMonth,
    updatePayrollStatus,
    batchUpdatePayrollStatusByTrade,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>('salary');
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());
  const [detailModal, setDetailModal] = useState<SalaryDetail | null>(null);
  const [payrollDetail, setPayrollDetail] = useState<PayrollSlip | null>(null);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [workForm, setWorkForm] = useState<WorkFormData>({
    workerId: '',
    date: todayStr(),
    project: '阳光花园小区',
    building: '1号楼',
    floor: '1层',
    area: 0,
    remark: '',
  });

  const salaries = useMemo(
    () => calculateAllSalaries(yearMonth),
    [calculateAllSalaries, yearMonth]
  );

  const payrollSlips = useMemo(
    () => getPayrollSlipsByMonth(yearMonth),
    [getPayrollSlipsByMonth, yearMonth]
  );

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

  const payrollStats = useMemo(() => {
    const total = payrollSlips.length;
    const paid = payrollSlips.filter((p) => p.status === 'paid').length;
    const unpaid = total - paid;
    const paidAmount = payrollSlips
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.netSalary, 0);
    const unpaidAmount = payrollSlips
      .filter((p) => p.status === 'unpaid')
      .reduce((s, p) => s + p.netSalary, 0);
    return { total, paid, unpaid, paidAmount, unpaidAmount };
  }, [payrollSlips]);

  const monthProjectWorks = useMemo(
    () => projectWorks.filter((p) => p.date.startsWith(yearMonth)),
    [projectWorks, yearMonth]
  );

  const projectSummaryGroups = useMemo(
    () => groupProjectWorks(monthProjectWorks, workers),
    [monthProjectWorks, workers]
  );

  const detailWorker = useMemo(() => {
    if (!detailModal) return null;
    return workers.find((w) => w.id === detailModal.workerId);
  }, [detailModal, workers]);

  const detailProjectWorks = useMemo(() => {
    if (!detailModal) return [];
    return getProjectWorksByWorkerMonth(detailModal.workerId, yearMonth);
  }, [detailModal, getProjectWorksByWorkerMonth, yearMonth]);

  const salariesByTrade = (Object.keys(TRADE_LABELS) as Trade[]).map((trade) => ({
    trade,
    list: salaries.filter((s) => s.trade === trade),
  }));

  const slipsByTrade = (Object.keys(TRADE_LABELS) as Trade[]).map((trade) => {
    const tradeWorkerIds = new Set(
      workers.filter((w) => w.trade === trade).map((w) => w.id)
    );
    return {
      trade,
      list: payrollSlips.filter((p) => tradeWorkerIds.has(p.workerId)),
    };
  });

  const workerMap = useMemo(
    () => new Map(workers.map((w) => [w.id, w])),
    [workers]
  );

  function handleWorkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workForm.workerId || workForm.area <= 0) return;
    addProjectWork({
      workerId: workForm.workerId,
      date: workForm.date,
      project: workForm.project || undefined,
      building: workForm.building || undefined,
      floor: workForm.floor || undefined,
      area: workForm.area,
      remark: workForm.remark,
    });
    setWorkModalOpen(false);
    setWorkForm({
      workerId: '',
      date: todayStr(),
      project: '阳光花园小区',
      building: '1号楼',
      floor: '1层',
      area: 0,
      remark: '',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工资结算</h1>
          <p className="text-slate-500 mt-1">{yearMonth} 月度工资与发薪管理</p>
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('salary')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'salary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          工资报表
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          月度发薪单
        </button>
      </div>

      {activeTab === 'salary' ? (
        <>
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

          {monthProjectWorks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800">
                  本月包活工程量汇总（共 {monthProjectWorks.length} 条记录）
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-4 py-3 font-medium">项目名称</th>
                      <th className="px-4 py-3 font-medium">楼号</th>
                      <th className="px-4 py-3 font-medium">楼层</th>
                      <th className="px-4 py-3 font-medium text-right">记录数</th>
                      <th className="px-4 py-3 font-medium text-right">总面积</th>
                      <th className="px-4 py-3 font-medium text-right">合计金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(projectSummaryGroups).map((g, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{g.project}</td>
                        <td className="px-4 py-3 text-slate-600">{g.building}</td>
                        <td className="px-4 py-3 text-slate-600">{g.floor}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{g.count}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sky-600">
                          {g.totalArea} ㎡
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">
                          ¥{g.wage.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                      <span className="text-slate-500">
                        应发 <span className="font-semibold text-slate-800">¥{tradeTotal.gross.toLocaleString()}</span>
                      </span>
                      <span className="text-slate-500">
                        借支 <span className="font-semibold text-amber-600">¥{tradeTotal.advance.toLocaleString()}</span>
                      </span>
                      <span className="text-slate-500">
                        实发 <span className="font-semibold text-emerald-600">¥{tradeTotal.net.toLocaleString()}</span>
                      </span>
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
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">发薪单总数</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{payrollStats.total}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-700">已发人数</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{payrollStats.paid}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <p className="text-xs text-rose-700">未发人数</p>
                <p className="text-xl font-bold text-rose-600 mt-1">{payrollStats.unpaid}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-700">已发金额</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">¥{payrollStats.paidAmount.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 col-span-2 md:col-span-1">
                <p className="text-xs text-rose-700">待发金额</p>
                <p className="text-xl font-bold text-rose-600 mt-1">¥{payrollStats.unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => generatePayrollSlips(yearMonth)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
            >
              <FileCheck className="w-4 h-4" />
              生成本月发薪单
            </button>
          </div>

          {payrollSlips.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center text-slate-400">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无发薪单，点击上方"生成本月发薪单"按钮创建</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slipsByTrade.map(({ trade, list }) => {
                if (list.length === 0) return null;
                return (
                  <div key={trade} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-800">
                        {TRADE_LABELS[trade]}
                        <span className="text-sm font-normal text-slate-500 ml-2">
                          ({list.filter((p) => p.status === 'paid').length}/{list.length} 已发)
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            batchUpdatePayrollStatusByTrade(yearMonth, trade, 'paid')
                          }
                          className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          全部标记已发
                        </button>
                        <button
                          onClick={() =>
                            batchUpdatePayrollStatusByTrade(yearMonth, trade, 'unpaid')
                          }
                          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                        >
                          <CircleDashed className="w-4 h-4" />
                          全部标记未发
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-left">
                            <th className="px-4 py-3 font-medium">姓名</th>
                            <th className="px-4 py-3 font-medium text-center">出勤</th>
                            <th className="px-4 py-3 font-medium text-right">应发工资</th>
                            <th className="px-4 py-3 font-medium text-right">借支扣除</th>
                            <th className="px-4 py-3 font-medium text-right">实发工资</th>
                            <th className="px-4 py-3 font-medium text-center">发薪状态</th>
                            <th className="px-4 py-3 font-medium">发薪日期</th>
                            <th className="px-4 py-3 font-medium text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((slip) => {
                            const w = workerMap.get(slip.workerId);
                            return (
                              <tr key={slip.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-sm font-bold">
                                      {w?.name[0] || slip.workerId.slice(-1)}
                                    </div>
                                    {w?.name || '未知工人'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-emerald-600 font-semibold">
                                  {slip.presentDays}天
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                  ¥{slip.grossSalary.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-amber-600">
                                  -¥{slip.totalAdvance.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-600 text-base">
                                  ¥{slip.netSalary.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                      slip.status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {slip.status === 'paid' ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <CircleDashed className="w-3 h-3" />
                                    )}
                                    {PAYROLL_STATUS_LABELS[slip.status]}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-xs">
                                  {slip.paidDate || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setPayrollDetail(slip)}
                                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                      title="查看详情"
                                    >
                                      <FileCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        updatePayrollStatus(
                                          slip.id,
                                          slip.status === 'paid' ? 'unpaid' : 'paid'
                                        )
                                      }
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        slip.status === 'paid'
                                          ? 'text-slate-500 hover:bg-slate-100'
                                          : 'text-emerald-600 hover:bg-emerald-50'
                                      }`}
                                      title={slip.status === 'paid' ? '标记未发' : '标记已发'}
                                    >
                                      {slip.status === 'paid' ? (
                                        <CircleDashed className="w-4 h-4" />
                                      ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={!!detailModal} title="工资明细" onClose={() => setDetailModal(null)}>
        {detailModal && detailWorker && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {detailModal.workerName[0]}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">{detailModal.workerName}</h4>
                <p className="text-slate-500 text-sm">
                  {TRADE_LABELS[detailModal.trade]} · 日薪¥{detailWorker.dailyRate} · 包活¥
                  {detailWorker.unitPrice}/㎡
                </p>
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
                <span className="text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 点工工资（{detailModal.presentDays}天 × ¥
                  {detailWorker.dailyRate}）
                </span>
                <span className="font-semibold text-slate-800">
                  ¥{detailModal.dailyWage.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 包活工资（{detailModal.totalArea}㎡ × ¥
                  {detailWorker.unitPrice}）
                </span>
                <span className="font-semibold text-slate-800">
                  ¥{detailModal.projectWage.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-slate-100">
                <span className="text-slate-700 font-medium">应发工资</span>
                <span className="font-bold text-indigo-600 text-lg">
                  ¥{detailModal.grossSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2">
                  <HandCoins className="w-4 h-4" /> 借支扣除
                </span>
                <span className="font-semibold text-amber-600">
                  -¥{detailModal.totalAdvance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-slate-100 bg-gradient-to-r from-emerald-50 to-transparent -mx-6 px-6 rounded-b-xl">
                <span className="text-slate-800 font-bold">实发工资</span>
                <span className="font-bold text-emerald-600 text-2xl">
                  ¥{detailModal.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            {detailProjectWorks.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  包活工程量明细（按项目/楼层）
                </h5>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {detailProjectWorks.map((pw) => (
                    <div
                      key={pw.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/60 border border-sky-100"
                    >
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {pw.project || '未命名项目'} · {pw.building || '-'} · {pw.floor || '-'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pw.date}
                          {pw.remark && ` · ${pw.remark}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sky-700">{pw.area} ㎡</p>
                        <p className="text-xs text-slate-500">
                          ¥{(pw.area * detailWorker.unitPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!payrollDetail} title="发薪确认单" onClose={() => setPayrollDetail(null)}>
        {payrollDetail && (() => {
          const w = workerMap.get(payrollDetail.workerId);
          const signSlip = payrollDetail;
          return (
            <div className="space-y-5">
              <div className="text-center pb-4 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-800">月度工资发薪单</h4>
                <p className="text-slate-500 text-sm mt-1">{yearMonth}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">工人姓名</span>
                  <span className="font-semibold text-slate-800">{w?.name || '未知工人'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">工种</span>
                  <span className="font-semibold text-slate-800">
                    {w ? TRADE_LABELS[w.trade] : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">联系电话</span>
                  <span className="font-semibold text-slate-800">{w?.phone || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">出勤天数</span>
                  <span className="font-semibold text-emerald-600">{signSlip.presentDays} 天</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">请假 / 旷工</span>
                  <span className="font-semibold text-slate-700">
                    {signSlip.leaveDays} / {signSlip.absentDays}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">点工工资</span>
                  <span className="font-semibold text-slate-800">
                    ¥{signSlip.dailyWage.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">
                    包活工资（{signSlip.totalArea}㎡）
                  </span>
                  <span className="font-semibold text-slate-800">
                    ¥{signSlip.projectWage.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-slate-200 mt-2 pt-2">
                  <span className="font-medium text-slate-700">应发工资</span>
                  <span className="font-bold text-indigo-600 text-lg">
                    ¥{signSlip.grossSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">借支扣除</span>
                  <span className="font-semibold text-amber-600">
                    -¥{signSlip.totalAdvance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-200 mt-2 pt-3 bg-emerald-50/70 -mx-4 px-4 -mb-4 rounded-b-xl">
                  <span className="font-bold text-slate-800 text-base">实发工资（大写）</span>
                  <span className="font-bold text-emerald-600 text-xl">
                    ¥{signSlip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-2">工人签字</p>
                  <div className="h-10 flex items-center justify-center">
                    {signSlip.signature ? (
                      <span className="font-serif text-2xl text-indigo-700">
                        {signSlip.signature}
                      </span>
                    ) : signSlip.status === 'paid' ? (
                      <PenLine className="w-5 h-5 text-slate-400" />
                    ) : (
                      <span className="text-slate-300 text-sm">未签字</span>
                    )}
                  </div>
                </div>
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-2">发薪状态</p>
                  <div className="h-10 flex items-center justify-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        signSlip.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {signSlip.status === 'paid' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <CircleDashed className="w-4 h-4" />
                      )}
                      {PAYROLL_STATUS_LABELS[signSlip.status]}
                    </span>
                  </div>
                </div>
              </div>

              {signSlip.paidDate && (
                <p className="text-center text-xs text-slate-500">
                  发薪日期：{signSlip.paidDate}
                </p>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPayrollDetail(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  关闭
                </button>
                {signSlip.status === 'unpaid' ? (
                  <button
                    onClick={() => {
                      updatePayrollStatus(signSlip.id, 'paid');
                      setPayrollDetail({ ...signSlip, status: 'paid', paidDate: todayStr() });
                    }}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认已发
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updatePayrollStatus(signSlip.id, 'unpaid');
                      setPayrollDetail({ ...signSlip, status: 'unpaid', paidDate: undefined });
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <CircleDashed className="w-4 h-4" />
                    标记未发
                  </button>
                )}
              </div>
            </div>
          );
        })()}
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
                  {w.name} - {TRADE_LABELS[w.trade]}（¥{w.unitPrice}/㎡）
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                项目名称
              </label>
              <input
                type="text"
                value={workForm.project}
                onChange={(e) => setWorkForm({ ...workForm, project: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="如：阳光花园小区"
              />
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">楼号</label>
              <input
                type="text"
                value={workForm.building}
                onChange={(e) => setWorkForm({ ...workForm, building: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="如：1号楼"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">楼层</label>
              <input
                type="text"
                value={workForm.floor}
                onChange={(e) => setWorkForm({ ...workForm, floor: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="如：3层"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              完成面积 (㎡)
            </label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              工作内容（选填）
            </label>
            <input
              type="text"
              value={workForm.remark}
              onChange={(e) => setWorkForm({ ...workForm, remark: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：吊顶、地砖铺贴、内墙腻子等"
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
