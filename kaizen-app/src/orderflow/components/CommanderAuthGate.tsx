import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface CommanderAuthGateProps {
  isDark: boolean;
  email: string;
  password: string;
  mode: 'signin' | 'signup';
  loading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSubmit: () => void;
}

export function CommanderAuthGate({
  isDark,
  email,
  password,
  mode,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
}: CommanderAuthGateProps) {
  return (
    <Card className={`mx-auto max-w-xl ${isDark ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/90'}`}>
      <CardHeader>
        <CardTitle>Connect OrderFlow Commander</CardTitle>
        <CardDescription>
          Sign in with Supabase email/password to sync levels, order-flow rows, plans, journal data, templates, and news events to the Kaizen cloud project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant={mode === 'signin' ? 'default' : 'secondary'} onClick={() => onModeChange('signin')}>
            Sign In
          </Button>
          <Button variant={mode === 'signup' ? 'default' : 'secondary'} onClick={() => onModeChange('signup')}>
            Create Account
          </Button>
        </div>
        <Input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email" className="rounded-[1.1rem]" />
        <Input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Password" className="rounded-[1.1rem]" />
        {error && <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>}
        <Button onClick={onSubmit} disabled={loading || !email || !password} className="w-full">
          {loading ? 'Connecting...' : mode === 'signin' ? 'Sign In to Commander' : 'Create Commander Account'}
        </Button>
        <p className={`text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Use this when you want Supabase-backed persistence across devices. Until the full backend schema is deployed, some cloud-synced features may fall back to the local defaults.
        </p>
      </CardContent>
    </Card>
  );
}
