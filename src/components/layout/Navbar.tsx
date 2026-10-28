import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel, formatDoctorName } from '../../utils/formatters';
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
    <header className="bg-[#faf7f2]/95 backdrop-blur-md border-b border-[#dfdcd7] sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#204079] text-[#faf6f0] flex items-center justify-center shadow-xs border border-[#1b3769]">
            <Activity className="w-5 h-5 text-[#faf6f0]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[#17223a] text-lg tracking-tight">
              Cornerstone HealthPulse
            </span>
            <span className="text-[10px] text-[#204079] font-bold tracking-widest px-1.5 py-0.5 bg-[#f0ebe1] rounded border border-[#dfdcd7] uppercase">
              HMS
            </span>
          </div>
        </div>

        {/* Right side: Quick Demo Switcher + Current User + Logout */}
        <div className="flex items-center gap-4">
          {/* Demo account switcher pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#f0ebe1] p-1 rounded-lg border border-[#dfdcd7] text-xs">
            <span className="text-[#6c747f] font-medium px-2 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" /> Role:
            </span>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoSwitch(acc.email)}
                  className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#204079] text-[#faf6f0] shadow-xs font-semibold'
                      : 'text-[#17223a] hover:bg-[#e6dfd1]'
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
            <div className="flex items-center gap-3 pl-3 border-l border-[#dfdcd7]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[#17223a] leading-tight">
                  {role === 'doctor' ? formatDoctorName(user.email) : user.email}
                </p>
                <span className="inline-block text-[11px] font-semibold text-[#204079] bg-[#e8edf5] px-2 py-0.2 rounded border border-[#c8d7eb] mt-0.5">
                  {role ? getRoleLabel(role) : ''}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#f0ebe1] border border-[#dfdcd7] flex items-center justify-center text-[#204079]">
                <UserCircle2 className="w-5 h-5" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-[#6c747f] hover:text-[#ab2b1a] hover:bg-[#f0ebe1] p-2"
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
