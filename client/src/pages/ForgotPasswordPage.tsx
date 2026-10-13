import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await authApi.forgotPassword(email);
      setSubmitted(true);
      if (res?.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Home<span className="text-blue-600">Finder</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900">Reset Password</h2>
          <p className="text-xs text-slate-500">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200/90 shadow-xl space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Check Your Email</h3>
              <p className="text-xs text-slate-500">
                If an account exists for <strong>{email}</strong>, we have dispatched instructions to reset your password.
              </p>

              {devResetUrl && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs space-y-1">
                  <span className="font-bold text-blue-900 block">Development Reset Link:</span>
                  <a
                    href={devResetUrl}
                    className="text-blue-600 break-all hover:underline"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                Send Reset Link
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
