import { Worker, Attendance, Advance, SalaryDetail, TRADE_LABELS, ATTENDANCE_LABELS } from '@/types';
import { getYearMonth } from './date';

function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkers(workers: Worker[]) {
  const rows: (string | number)[][] = [
    ['工号', '姓名', '工种', '日薪(元/天)', '包活单价(元/平米)', '入职日期', '电话', '备注'],
  ];
  workers.forEach((w, i) => {
    rows.push([
      `W${String(i + 1).padStart(3, '0')}`,
      w.name,
      TRADE_LABELS[w.trade],
      w.dailyRate,
      w.unitPrice,
      w.joinDate,
      w.phone ?? '',
      w.remark ?? '',
    ]);
  });
  downloadCSV(toCSV(rows), `工地_工人花名册_${new Date().toISOString().slice(0, 7)}.csv`);
}

export function exportAttendance(workers: Worker[], attendances: Attendance[], yearMonth: string) {
  const monthAttendances = attendances.filter((a) => getYearMonth(a.date) === yearMonth);
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const rows: (string | number)[][] = [
    ['日期', '姓名', '工种', '考勤状态', '备注'],
  ];
  monthAttendances
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((a) => {
      const w = workerMap.get(a.workerId);
      rows.push([
        a.date,
        w?.name ?? '未知',
        w ? TRADE_LABELS[w.trade] : '',
        ATTENDANCE_LABELS[a.status],
        a.remark ?? '',
      ]);
    });
  downloadCSV(toCSV(rows), `工地_月度考勤表_${yearMonth}.csv`);
}

export function exportSalary(salaries: SalaryDetail[], yearMonth: string) {
  const rows: (string | number)[][] = [
    ['姓名', '工种', '出勤天数', '请假天数', '旷工天数', '点工工资', '完成面积(平米)', '包活单价', '包活工资', '应发工资', '借支总额', '实发工资'],
  ];
  salaries.forEach((s) => {
    rows.push([
      s.workerName,
      TRADE_LABELS[s.trade],
      s.presentDays,
      s.leaveDays,
      s.absentDays,
      s.dailyWage,
      s.totalArea,
      s.unitPrice,
      s.projectWage,
      s.grossSalary,
      s.totalAdvance,
      s.netSalary,
    ]);
  });
  downloadCSV(toCSV(rows), `工地_工资结算表_${yearMonth}.csv`);
}

export function exportAdvances(workers: Worker[], advances: Advance[], yearMonth?: string) {
  const filtered = yearMonth
    ? advances.filter((a) => getYearMonth(a.date) === yearMonth)
    : advances;
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const rows: (string | number)[][] = [
    ['日期', '姓名', '工种', '借支金额(元)', '备注'],
  ];
  filtered
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((a) => {
      const w = workerMap.get(a.workerId);
      rows.push([
        a.date,
        w?.name ?? '未知',
        w ? TRADE_LABELS[w.trade] : '',
        a.amount,
        a.remark ?? '',
      ]);
    });
  const suffix = yearMonth ?? '全部';
  downloadCSV(toCSV(rows), `工地_借支记录表_${suffix}.csv`);
}
