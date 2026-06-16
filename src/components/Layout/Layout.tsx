import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, Wallet, HandCoins, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/workers', label: '工人管理', icon: Users },
  { to: '/attendance', label: '考勤打卡', icon: CalendarCheck },
  { to: '/salary', label: '工资结算', icon: Wallet },
  { to: '/advances', label: '借支管理', icon: HandCoins },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initialize = useStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-60 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white flex-col shadow-xl">
        <div className="p-5 border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-lg font-bold tracking-wide">工地考勤系统</h1>
              <p className="text-xs text-indigo-300 text-left">考勤工资管理</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 font-medium'
                    : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800 text-xs text-indigo-400 text-center">
          数据保存在本地浏览器
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span className="font-bold">工地考勤系统</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-indigo-800"
            aria-label="菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {mobileOpen && (
          <nav className="lg:hidden bg-indigo-900 text-white p-2 space-y-1 shadow-lg">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-indigo-200'
                }`
            }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
