import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Store, Lock, Mail, Phone, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@tamilenterprises.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    const result = await quickDemoLogin(role);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-teal-600 items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-teal-600/30">
            TE
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tamizh Enterprises</h1>
          <p className="text-xs text-slate-500">Distribution & Dealer Management ERP</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="Email ID or Mobile Number (+91...)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Role Login Demo Section */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Owner')}
              className="p-2.5 rounded-lg border border-teal-100 bg-teal-50/50 hover:bg-teal-100/60 transition-colors text-center group"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800">Owner</span>
              <span className="block text-[10px] text-slate-500">Muralitharan</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Salesman')}
              className="p-2.5 rounded-lg border border-sky-100 bg-sky-50/50 hover:bg-sky-100/60 transition-colors text-center group"
            >
              <UserCheck className="w-4 h-4 text-sky-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800">Salesman</span>
              <span className="block text-[10px] text-slate-500">Murugan P</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Store')}
              className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/50 hover:bg-amber-100/60 transition-colors text-center group"
            >
              <Store className="w-4 h-4 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-xs font-bold text-slate-800">Store</span>
              <span className="block text-[10px] text-slate-500">Sri Krishna</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          GSTIN: 33AABCT9988C1Z4 &bull; Madurai, Tamil Nadu
        </div>
      </div>
    </div>
  );
};

export default Login;
