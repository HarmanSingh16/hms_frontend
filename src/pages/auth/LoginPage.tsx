import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../utils/demoData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Activity, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const role = await login(email.trim(), password);
      // Route based on role
      switch (role) {
        case 'receptionist':
          navigate('/receptionist/queue');
          break;
        case 'doctor':
          navigate('/doctor/queue');
          break;
        case 'patient':
          navigate('/patient/appointments');
          break;
        case 'admin':
          navigate('/admin/departments');
          break;
        default:
          navigate('/');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ed] via-[#f3ede1] to-[#eae0cf] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#204079] text-[#faf6f0] shadow-md border border-[#1b3769] mb-4">
          <Activity className="w-7 h-7 text-[#faf6f0]" />
        </div>
        <div className="eyebrow mb-1">Cornerstone Healthcare Systems</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#17223a] tracking-tight">
          Cornerstone HealthPulse
        </h1>
        <p className="mt-1.5 text-sm text-[#6c747f]">
          Trustworthy Clinical Operations & Scheduling
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-xs py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-[#dfdcd7]">
          {/* Quick Demo Pre-seed Bar */}
          <div className="mb-6 p-3.5 bg-[#f0ebe1]/80 border border-[#dfdcd7] rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17223a] mb-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" />
              <span>One-Click Role Authentication:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className="px-2.5 py-1.5 text-left text-xs bg-white hover:bg-[#faf6f0] hover:border-[#204079]/50 border border-[#dfdcd7] rounded-lg transition-colors font-medium text-[#17223a] flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{acc.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#6c747f] font-mono uppercase">
                    {acc.role.slice(0, 3)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-lg text-[#ab2b1a] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., reception.clara@hospital.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Console
            </Button>
          </form>

          <div className="mt-6 border-t border-[#dfdcd7] pt-4 text-center">
            <Link
              to="/claim-invite"
              className="text-xs text-[#204079] hover:text-[#18315c] font-medium inline-flex items-center gap-1"
            >
              Have a clinical invitation token? Activate your account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
