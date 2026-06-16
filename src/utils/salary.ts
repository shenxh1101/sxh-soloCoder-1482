import { Worker, Attendance, Advance, ProjectWork, SalaryDetail } from '@/types';
import { getYearMonth } from './date';

export function calculateWorkerSalary(
  worker: Worker,
  attendances: Attendance[],
  advances: Advance[],
  projectWorks: ProjectWork[],
  yearMonth: string
): SalaryDetail {
  const workerAttendances = attendances.filter(
    (a) => a.workerId === worker.id && getYearMonth(a.date) === yearMonth
  );
  const workerAdvances = advances.filter(
    (a) => a.workerId === worker.id && getYearMonth(a.date) === yearMonth
  );
  const workerWorks = projectWorks.filter(
    (w) => w.workerId === worker.id && getYearMonth(w.date) === yearMonth
  );

  const presentDays = workerAttendances.filter((a) => a.status === 'present').length;
  const leaveDays = workerAttendances.filter((a) => a.status === 'leave').length;
  const absentDays = workerAttendances.filter((a) => a.status === 'absent').length;

  const dailyWage = presentDays * worker.dailyRate;
  const totalArea = workerWorks.reduce((sum, w) => sum + w.area, 0);
  const projectWage = totalArea * worker.unitPrice;
  const totalAdvance = workerAdvances.reduce((sum, a) => sum + a.amount, 0);
  const grossSalary = dailyWage + projectWage;
  const netSalary = grossSalary - totalAdvance;

  return {
    workerId: worker.id,
    workerName: worker.name,
    trade: worker.trade,
    presentDays,
    leaveDays,
    absentDays,
    dailyWage,
    totalArea,
    unitPrice: worker.unitPrice,
    projectWage,
    totalAdvance,
    grossSalary,
    netSalary,
  };
}

export function calculateAllSalaries(
  workers: Worker[],
  attendances: Attendance[],
  advances: Advance[],
  projectWorks: ProjectWork[],
  yearMonth: string
): SalaryDetail[] {
  return workers.map((w) =>
    calculateWorkerSalary(w, attendances, advances, projectWorks, yearMonth)
  );
}
