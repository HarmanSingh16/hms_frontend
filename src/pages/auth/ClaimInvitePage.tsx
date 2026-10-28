import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { InviteVerificationResponse } from '../../types/api';
import { DEMO_INVITE_TOKENS } from '../../utils/demoData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Activity, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

export const ClaimInvitePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [inviteData, setInviteData] = useState<InviteVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const verifyToken = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    setIsVerifying(true);
    setVerifyError(null);
    setInviteData(null);

    try {
      const data = await authApi.verifyInvite(tokenToVerify);
      setInviteData(data);
    } catch (err: unknown) {
      setVerifyError(
        getErrorMessage(
          err,
          'Invalid or expired invite token. Please request a new invite from the clinic.'
        )
      );
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    if (tokenParam) {
      setTokenInput(tokenParam);
      verifyToken(tokenParam);
    }
  }, [tokenParam, verifyToken]);

  const handleApplyToken = (tok: string) => {
    setTokenInput(tok);
    setSearchParams({ token: tok });
    verifyToken(tok);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await authApi.claimInvite(tokenInput, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Failed to activate account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ed] via-[#f3ede1] to-[#eae0cf] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#204079] text-[#faf6f0] shadow-md border border-[#1b3769] mb-4">
          <Activity className="w-7 h-7 text-[#faf6f0]" />
        </div>
        <div className="eyebrow mb-1">Cornerstone Healthcare Systems</div>
        <h1 className="font-serif text-3xl font-semibold text-[#17223a] tracking-tight">
          Activate Your Credentials
        </h1>
        <p className="mt-1.5 text-sm text-[#6c747f]">
          Secure onboarding for verified healthcare personnel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-xs py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-[#dfdcd7]">
          {/* Demo Tokens Quick Selection */}
          <div className="mb-6 p-3.5 bg-[#f0ebe1]/80 border border-[#dfdcd7] rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17223a] mb-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gap)]" />
              <span>Test Pre-Seeded Tokens:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {DEMO_INVITE_TOKENS.map((t) => (
                <button
                  key={t.token}
                  type="button"
                  onClick={() => handleApplyToken(t.token)}
                  className="px-2.5 py-1.5 text-left text-xs bg-white hover:bg-[#faf6f0] hover:border-[#204079]/50 border border-[#dfdcd7] rounded-lg transition-colors font-medium text-[#17223a] flex items-center justify-between cursor-pointer"
                >
                  <span>{t.label}</span>
                  <span className="text-[10px] text-[#204079] font-semibold font-mono">Use Token &rarr;</span>
                </button>
              ))}
            </div>
          </div>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#e8f5f0] text-[#1f6b4e] mx-auto flex items-center justify-center border border-[#b8dfd0]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-[#17223a]">Account Activated!</h3>
              <p className="text-xs text-[#6c747f]">
                Your password has been successfully established. Redirecting to login...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!inviteData && (
                <div className="space-y-3">
                  <Input
                    label="Invitation Token"
                    placeholder="Enter or paste your hex invite token..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => verifyToken(tokenInput)}
                    isLoading={isVerifying}
                    disabled={!tokenInput.trim()}
                    className="w-full"
                  >
                    Verify Token
                  </Button>
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center justify-center py-4 text-xs text-[#6c747f] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#204079]" />
                  Verifying invite validity...
                </div>
              )}

              {verifyError && (
                <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-lg text-[#ab2b1a] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {inviteData && (
                <form onSubmit={handleClaim} className="space-y-4 pt-2 border-t border-[#dfdcd7]">
                  <div className="p-3.5 bg-[#f0ebe1]/70 border border-[#dfdcd7] rounded-lg">
                    <p className="text-xs text-[#17223a] font-semibold">
                      Activating account for: <span className="text-[#204079]">{inviteData.email}</span>
                    </p>
                    <p className="text-[11px] text-[#6c747f] capitalize mt-0.5 font-medium">
                      Role assigned: <strong className="text-[#17223a]">{inviteData.role}</strong>
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-[#fcedea] border border-[#f7c2bb] rounded-lg text-[#ab2b1a] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <Input
                    label="Create Password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />

                  <Button type="submit" className="w-full" isLoading={isSubmitting}>
                    Activate Account
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-[#dfdcd7] pt-4 text-center">
            <Link to="/login" className="text-xs text-[#204079] hover:text-[#18315c] font-medium">
              &larr; Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
