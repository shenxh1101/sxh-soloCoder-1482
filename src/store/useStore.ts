import { create } from 'zustand';
import {
  Worker,
  Attendance,
  Advance,
  ProjectWork,
  AttendanceStatus,
  PayrollSlip,
  PayrollStatus,
  SalaryDetail,
} from '@/types';
import { generateId, todayStr } from '@/utils/date';
import { calculateAllSalaries, calculateWorkerSalary } from '@/utils/salary';

interface AppState {
  initialized: boolean;
  workers: Worker[];
  attendances: Attendance[];
  advances: Advance[];
  projectWorks: ProjectWork[];
  payrollSlips: PayrollSlip[];

  initialize: () => void;

  addWorker: (data: Omit<Worker, 'id' | 'createdAt'>) => void;
  updateWorker: (id: string, data: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  markAttendance: (workerId: string, date: string, status: AttendanceStatus) => void;
  batchMarkAttendance: (
    records: { workerId: string; date: string; status: AttendanceStatus }[]
  ) => void;
  getAttendanceByDate: (date: string) => Attendance[];
  getAttendanceByWorkerMonth: (workerId: string, yearMonth: string) => Attendance[];
  clearAttendanceByDate: (date: string) => void;

  addAdvance: (data: Omit<Advance, 'id' | 'createdAt'>) => void;
  deleteAdvance: (id: string) => void;

  addProjectWork: (data: Omit<ProjectWork, 'id' | 'createdAt'>) => void;
  deleteProjectWork: (id: string) => void;
  getProjectWorksByWorkerMonth: (workerId: string, yearMonth: string) => ProjectWork[];

  generatePayrollSlips: (yearMonth: string) => void;
  updatePayrollStatus: (
    slipId: string,
    status: PayrollStatus,
    paidDate?: string,
    signature?: string
  ) => void;
  batchUpdatePayrollStatusByTrade: (
    yearMonth: string,
    trade: string,
    status: PayrollStatus
  ) => void;
  deletePayrollSlip: (id: string) => void;
  getPayrollSlipsByMonth: (yearMonth: string) => PayrollSlip[];

  calculateAllSalaries: (yearMonth: string) => SalaryDetail[];

  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'construction_site_payroll_v2';

function getMockData(): {
  workers: Worker[];
  attendances: Attendance[];
  advances: Advance[];
  projectWorks: ProjectWork[];
  payrollSlips: PayrollSlip[];
} {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const ym = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`;

  const workers: Worker[] = [
    { id: generateId(), name: '张建国', trade: 'carpenter', dailyRate: 350, unitPrice: 80, joinDate: '2025-03-15', phone: '13800138001', remark: '带班师傅', createdAt: todayStr() },
    { id: generateId(), name: '李明华', trade: 'carpenter', dailyRate: 320, unitPrice: 75, joinDate: '2025-04-01', phone: '13800138002', createdAt: todayStr() },
    { id: generateId(), name: '王志强', trade: 'carpenter', dailyRate: 300, unitPrice: 70, joinDate: '2025-05-10', phone: '13800138003', createdAt: todayStr() },
    { id: generateId(), name: '赵德福', trade: 'mason', dailyRate: 380, unitPrice: 60, joinDate: '2025-02-20', phone: '13800138004', remark: '瓦工组长', createdAt: todayStr() },
    { id: generateId(), name: '孙满堂', trade: 'mason', dailyRate: 350, unitPrice: 55, joinDate: '2025-03-01', phone: '13800138005', createdAt: todayStr() },
    { id: generateId(), name: '周立春', trade: 'mason', dailyRate: 330, unitPrice: 50, joinDate: '2025-04-15', phone: '13800138006', createdAt: todayStr() },
    { id: generateId(), name: '吴水电', trade: 'plumber_electrician', dailyRate: 400, unitPrice: 45, joinDate: '2025-01-10', phone: '13800138007', remark: '水电大工', createdAt: todayStr() },
    { id: generateId(), name: '郑光明', trade: 'plumber_electrician', dailyRate: 360, unitPrice: 40, joinDate: '2025-03-20', phone: '13800138008', createdAt: todayStr() },
    { id: generateId(), name: '刘漆匠', trade: 'painter', dailyRate: 320, unitPrice: 25, joinDate: '2025-04-01', phone: '13800138009', createdAt: todayStr() },
    { id: generateId(), name: '陈彩虹', trade: 'painter', dailyRate: 300, unitPrice: 22, joinDate: '2025-05-01', phone: '13800138010', createdAt: todayStr() },
  ];

  const attendances: Attendance[] = [];
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const today = now.getDate();

  workers.forEach((worker) => {
    for (let day = 1; day <= Math.min(today, daysInMonth); day++) {
      const date = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(thisYear, thisMonth, day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      let status: AttendanceStatus;
      const rand = Math.random();
      if (isWeekend && rand < 0.4) {
        status = rand < 0.15 ? 'leave' : 'absent';
      } else if (rand < 0.08) {
        status = 'leave';
      } else if (rand < 0.12) {
        status = 'absent';
      } else {
        status = 'present';
      }

      attendances.push({
        id: generateId(),
        workerId: worker.id,
        date,
        status,
        createdAt: todayStr(),
      });
    }
  });

  const advances: Advance[] = [
    { id: generateId(), workerId: workers[0].id, date: `${ym}-05`, amount: 2000, remark: '生活费', createdAt: todayStr() },
    { id: generateId(), workerId: workers[3].id, date: `${ym}-05`, amount: 2000, remark: '生活费', createdAt: todayStr() },
    { id: generateId(), workerId: workers[6].id, date: `${ym}-08`, amount: 3000, remark: '家里急用', createdAt: todayStr() },
    { id: generateId(), workerId: workers[1].id, date: `${ym}-10`, amount: 1500, remark: '', createdAt: todayStr() },
    { id: generateId(), workerId: workers[0].id, date: `${ym}-15`, amount: 1000, remark: '', createdAt: todayStr() },
  ];

  const projectWorks: ProjectWork[] = [
    { id: generateId(), workerId: workers[0].id, date: `${ym}-03`, project: '阳光花园小区', building: '1号楼', floor: '3层', area: 25, remark: '吊顶', createdAt: todayStr() },
    { id: generateId(), workerId: workers[0].id, date: `${ym}-10`, project: '阳光花园小区', building: '1号楼', floor: '4层', area: 30, remark: '隔墙', createdAt: todayStr() },
    { id: generateId(), workerId: workers[3].id, date: `${ym}-05`, project: '阳光花园小区', building: '2号楼', floor: '2层', area: 80, remark: '地砖铺贴', createdAt: todayStr() },
    { id: generateId(), workerId: workers[3].id, date: `${ym}-12`, project: '阳光花园小区', building: '2号楼', floor: '3层', area: 65, remark: '墙砖铺贴', createdAt: todayStr() },
    { id: generateId(), workerId: workers[8].id, date: `${ym}-08`, project: '阳光花园小区', building: '1号楼', floor: '1层', area: 120, remark: '内墙腻子', createdAt: todayStr() },
  ];

  return { workers, attendances, advances, projectWorks, payrollSlips: [] };
}

export const useStore = create<AppState>((set, get) => ({
  initialized: false,
  workers: [],
  attendances: [],
  advances: [],
  projectWorks: [],
  payrollSlips: [],

  initialize: () => {
    if (!get().initialized) {
      get().loadFromStorage();
      set({ initialized: true });
    }
  },

  addWorker: (data) => {
    set((s) => ({ workers: [...s.workers, { ...data, id: generateId(), createdAt: todayStr() }] }));
    get().saveToStorage();
  },

  updateWorker: (id, data) => {
    set((s) => ({ workers: s.workers.map((w) => (w.id === id ? { ...w, ...data } : w)) }));
    get().saveToStorage();
  },

  deleteWorker: (id) => {
    set((s) => ({
      workers: s.workers.filter((w) => w.id !== id),
      attendances: s.attendances.filter((a) => a.workerId !== id),
      advances: s.advances.filter((a) => a.workerId !== id),
      projectWorks: s.projectWorks.filter((p) => p.workerId !== id),
      payrollSlips: s.payrollSlips.filter((p) => p.workerId !== id),
    }));
    get().saveToStorage();
  },

  markAttendance: (workerId, date, status) => {
    set((s) => {
      const existing = s.attendances.find((a) => a.workerId === workerId && a.date === date);
      if (existing) {
        return {
          attendances: s.attendances.map((a) =>
            a.id === existing.id ? { ...a, status } : a
          ),
        };
      }
      return {
        attendances: [
          ...s.attendances,
          { id: generateId(), workerId, date, status, createdAt: todayStr() },
        ],
      };
    });
    get().saveToStorage();
  },

  batchMarkAttendance: (records) => {
    set((s) => {
      const newAttendances = [...s.attendances];
      records.forEach(({ workerId, date, status }) => {
        const idx = newAttendances.findIndex(
          (a) => a.workerId === workerId && a.date === date
        );
        if (idx >= 0) {
          newAttendances[idx] = { ...newAttendances[idx], status };
        } else {
          newAttendances.push({
            id: generateId(),
            workerId,
            date,
            status,
            createdAt: todayStr(),
          });
        }
      });
      return { attendances: newAttendances };
    });
    get().saveToStorage();
  },

  getAttendanceByDate: (date) => get().attendances.filter((a) => a.date === date),

  getAttendanceByWorkerMonth: (workerId, yearMonth) =>
    get().attendances.filter(
      (a) => a.workerId === workerId && a.date.startsWith(yearMonth)
    ),

  clearAttendanceByDate: (date) => {
    set((s) => ({ attendances: s.attendances.filter((a) => a.date !== date) }));
    get().saveToStorage();
  },

  addAdvance: (data) => {
    set((s) => ({
      advances: [...s.advances, { ...data, id: generateId(), createdAt: todayStr() }],
    }));
    get().saveToStorage();
  },

  deleteAdvance: (id) => {
    set((s) => ({ advances: s.advances.filter((a) => a.id !== id) }));
    get().saveToStorage();
  },

  addProjectWork: (data) => {
    set((s) => ({
      projectWorks: [...s.projectWorks, { ...data, id: generateId(), createdAt: todayStr() }],
    }));
    get().saveToStorage();
  },

  deleteProjectWork: (id) => {
    set((s) => ({ projectWorks: s.projectWorks.filter((p) => p.id !== id) }));
    get().saveToStorage();
  },

  getProjectWorksByWorkerMonth: (workerId, yearMonth) =>
    get().projectWorks.filter(
      (p) => p.workerId === workerId && p.date.startsWith(yearMonth)
    ),

  generatePayrollSlips: (yearMonth) => {
    const { workers, attendances, advances, projectWorks } = get();
    const salaries = calculateAllSalaries(
      workers,
      attendances,
      advances,
      projectWorks,
      yearMonth
    );
    const workerMap = new Map(workers.map((w) => [w.id, w]));

    set((s) => {
      const existingIds = new Set(
        s.payrollSlips
          .filter((p) => p.yearMonth === yearMonth)
          .map((p) => p.workerId)
      );
      const newSlips: PayrollSlip[] = salaries
        .filter((sal) => !existingIds.has(sal.workerId))
        .map((sal) => {
          const w = workerMap.get(sal.workerId);
          return {
            id: generateId(),
            workerId: sal.workerId,
            yearMonth,
            presentDays: sal.presentDays,
            leaveDays: sal.leaveDays,
            absentDays: sal.absentDays,
            dailyWage: sal.dailyWage,
            totalArea: sal.totalArea,
            projectWage: sal.projectWage,
            grossSalary: sal.grossSalary,
            totalAdvance: sal.totalAdvance,
            netSalary: sal.netSalary,
            status: 'unpaid',
            remark: w?.remark || '',
            createdAt: todayStr(),
          };
        });
      return { payrollSlips: [...s.payrollSlips, ...newSlips] };
    });
    get().saveToStorage();
  },

  updatePayrollStatus: (slipId, status, paidDate, signature) => {
    set((s) => ({
      payrollSlips: s.payrollSlips.map((p) =>
        p.id === slipId
          ? {
              ...p,
              status,
              paidDate: status === 'paid' ? paidDate || todayStr() : undefined,
              signature: status === 'paid' ? signature || p.signature : undefined,
            }
          : p
      ),
    }));
    get().saveToStorage();
  },

  batchUpdatePayrollStatusByTrade: (yearMonth, trade, status) => {
    const { workers, payrollSlips } = get();
    const tradeWorkerIds = new Set(
      workers.filter((w) => w.trade === trade).map((w) => w.id)
    );
    set((s) => ({
      payrollSlips: s.payrollSlips.map((p) =>
        p.yearMonth === yearMonth && tradeWorkerIds.has(p.workerId)
          ? {
              ...p,
              status,
              paidDate: status === 'paid' ? todayStr() : p.paidDate,
            }
          : p
      ),
    }));
    get().saveToStorage();
  },

  deletePayrollSlip: (id) => {
    set((s) => ({ payrollSlips: s.payrollSlips.filter((p) => p.id !== id) }));
    get().saveToStorage();
  },

  getPayrollSlipsByMonth: (yearMonth) =>
    get().payrollSlips.filter((p) => p.yearMonth === yearMonth),

  calculateAllSalaries: (yearMonth) => {
    const { workers, attendances, advances, projectWorks } = get();
    return calculateAllSalaries(
      workers,
      attendances,
      advances,
      projectWorks,
      yearMonth
    );
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          workers: parsed.workers || [],
          attendances: parsed.attendances || [],
          advances: parsed.advances || [],
          projectWorks: parsed.projectWorks || [],
          payrollSlips: parsed.payrollSlips || [],
        });
      } else {
        const mock = getMockData();
        set(mock);
        get().saveToStorage();
      }
    } catch {
      const mock = getMockData();
      set(mock);
    }
  },

  saveToStorage: () => {
    try {
      const { workers, attendances, advances, projectWorks, payrollSlips } =
        get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          workers,
          attendances,
          advances,
          projectWorks,
          payrollSlips,
        })
      );
    } catch {
      // ignore
    }
  },
}));
