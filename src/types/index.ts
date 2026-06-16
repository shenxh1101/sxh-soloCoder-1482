export type Trade = 'carpenter' | 'mason' | 'plumber_electrician' | 'painter';

export type AttendanceStatus = 'present' | 'leave' | 'absent';

export type PayrollStatus = 'unpaid' | 'paid';

export const TRADE_LABELS: Record<Trade, string> = {
  carpenter: '木工',
  mason: '瓦工',
  plumber_electrician: '水电工',
  painter: '油漆工',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: '出勤',
  leave: '请假',
  absent: '旷工',
};

export const ATTENDANCE_BG_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  leave: 'bg-amber-500',
  absent: 'bg-rose-500',
};

export const ATTENDANCE_TEXT_COLORS: Record<AttendanceStatus, string> = {
  present: 'text-emerald-600',
  leave: 'text-amber-600',
  absent: 'text-rose-600',
};

export const ATTENDANCE_LIGHT_BG: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50',
  leave: 'bg-amber-50',
  absent: 'bg-rose-50',
};

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  unpaid: '未发',
  paid: '已发',
};

export type PayrollFilterStatus = 'all' | 'paid' | 'unpaid' | 'partial';

export const PAYROLL_FILTER_LABELS: Record<PayrollFilterStatus, string> = {
  all: '全部',
  paid: '已发',
  unpaid: '未发',
  partial: '部分发放',
};

export interface Worker {
  id: string;
  name: string;
  trade: Trade;
  dailyRate: number;
  unitPrice: number;
  joinDate: string;
  phone?: string;
  remark?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  remark?: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  workerId: string;
  date: string;
  amount: number;
  remark?: string;
  createdAt: string;
}

export interface ProjectWork {
  id: string;
  workerId: string;
  date: string;
  project?: string;
  building?: string;
  floor?: string;
  area: number;
  remark?: string;
  createdAt: string;
}

export interface PayrollSlip {
  id: string;
  workerId: string;
  yearMonth: string;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  dailyWage: number;
  totalArea: number;
  projectWage: number;
  grossSalary: number;
  totalAdvance: number;
  netSalary: number;
  status: PayrollStatus;
  paidDate?: string;
  signature?: string;
  signBy?: string;
  operator?: string;
  remark?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  yearMonth: string;
  workerId: string;
  slipId: string;
  paidDate: string;
  amount: number;
  operator: string;
  signature?: string;
  signBy?: string;
  remark?: string;
  createdAt: string;
}

export interface SalaryDetail {
  workerId: string;
  workerName: string;
  trade: Trade;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  dailyWage: number;
  totalArea: number;
  unitPrice: number;
  projectWage: number;
  totalAdvance: number;
  grossSalary: number;
  netSalary: number;
}

export interface ProjectWorkGroup {
  project: string;
  building: string;
  floor: string;
  totalArea: number;
  totalWage: number;
  items: ProjectWork[];
}
