import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, Lock, Mail, User, Building2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { authClient } from '../../lib/auth-client';

export interface UserSessionData {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface AuthGateProps {
  onAuthenticated: (session: UserSessionData) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Live Better Auth Sign-In / Sign-Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split('@')[0],
        });

        if (error) {
          throw new Error(error.message || 'Failed to create account.');
        }

        const userObj = data?.user;
        const orgId = `org_${Date.now().toString(36)}`;
        const resolvedOrgName = orgName.trim() || `${name || 'My'} Workspace`;

        onAuthenticated({
          id: userObj?.id || `usr_${Date.now()}`,
          name: userObj?.name || name || 'Loomina Developer',
          email: userObj?.email || email,
          role: 'owner',
          organizationId: orgId,
          organizationName: resolvedOrgName,
        });
      } else {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid credentials or user not found.');
        }

        const userObj = data?.user;
        onAuthenticated({
          id: userObj?.id || `usr_${Date.now()}`,
          name: userObj?.name || email.split('@')[0],
          email: userObj?.email || email,
          role: 'admin',
          organizationId: 'org_acme_corp',
          organizationName: 'Acme SaaS Corp',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Instant 1-Click Demo Shortcut
  const handleDemoSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      onAuthenticated({
        id: 'usr_founder_01',
        name: 'Alex Morgan',
        email: 'alex@loomina.dev',
        role: 'superadmin',
        organizationId: 'org_acme_corp',
        organizationName: 'Acme SaaS Corp',
      });
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Badge */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Better Auth Multi-Tenant Console</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-indigo-500/30 text-indigo-300">
            v0.1.0
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Loomina <span className="text-indigo-400">Studio</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1 max-w-sm">
          High-performance embedded analytics admin console. Sign in to manage customer dashboards.
        </p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md bg-[#18181b]/90 border-[#27272a] shadow-2xl backdrop-blur-xl relative z-10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`text-sm font-semibold pb-1 transition-colors ${
                  mode === 'signin' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`text-sm font-semibold pb-1 transition-colors ${
                  mode === 'signup' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Better Auth 1.7</span>
          </div>

          <CardTitle className="text-lg pt-3 text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create developer workspace'}
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            {mode === 'signin'
              ? 'Enter your work email and password to access your dashboards.'
              : 'Deploy sub-second embedded dashboards into your SaaS in minutes.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-9 bg-[#09090b] border-[#27272a] text-zinc-200 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Organization / Workspace Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="e.g. Acme SaaS Corp"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      className="pl-9 bg-[#09090b] border-[#27272a] text-zinc-200 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 bg-[#09090b] border-[#27272a] text-zinc-200 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                {mode === 'signin' && (
                  <span className="text-[11px] text-zinc-500 hover:text-indigo-400 cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-9 pr-9 bg-[#09090b] border-[#27272a] text-zinc-200 placeholder:text-zinc-600 text-sm focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm mt-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : mode === 'signin' ? (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Sign In to Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Create Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Quick Demo Bypass Shortcut */}
          <div className="mt-5 pt-4 border-t border-[#27272a]">
            <div className="text-center mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                Local Development Shortcut
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2 px-3 rounded-lg bg-[#27272a]/60 hover:bg-[#27272a] border border-[#3f3f46]/40 text-xs text-zinc-200 font-medium flex items-center justify-center gap-2 transition-all hover:border-indigo-500/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Continue as Demo Admin (Alex Morgan @ Acme Corp)</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-zinc-500 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Better Auth PostgreSQL Drizzle Engine
        </span>
        <span>•</span>
        <span>Apache 2.0 OSS</span>
        <span>•</span>
        <a href="https://better-auth.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
          better-auth.com
        </a>
      </div>
    </div>
  );
};
