export type Trade = 'carpenter' | 'mason' | 'plumber_electrician' | 'painter';

export type AttendanceStatus = 'present' | 'leave' | 'absent';

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

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  leave: 'bg-amber-500',
  absent: 'bg-rose-500',
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
  area: number;
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
