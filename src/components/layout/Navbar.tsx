import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../utils/formatters';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../utils/demoData';
import { LogOut, UserCircle2, Activity, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { user, role, logout, login } = useAuth();

  const handleDemoSwitch = async (email: string) => {
    try {
      await login(email, DEMO_PASSWORD);
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch demo account', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight">HealthPulse</span>
            <span className="text-xs text-sky-600 font-semibold ml-1.5 px-1.5 py-0.5 bg-sky-50 rounded border border-sky-200">
              HMS
            </span>
          </div>
        </div>

        {/* Right side: Quick Demo Switcher + Current User + Logout */}
        <div className="flex items-center gap-4">
          {/* Demo account switcher pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Switch Role:
            </span>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoSwitch(acc.email)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    isCurrent
                      ? 'bg-white text-sky-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={acc.email}
                >
                  {acc.role.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.email}</p>
                <span className="inline-block text-[11px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 mt-0.5">
                  {role ? getRoleLabel(role) : ''}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <UserCircle2 className="w-5 h-5" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-500 hover:text-rose-600 p-2"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
