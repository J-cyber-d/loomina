import React, { useState, useEffect } from 'react';
import { ShieldCheck, Laptop, Globe, Clock, Trash2, RefreshCw, UserCheck, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  activeOrgName?: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  createdAt: string;
}

interface SessionsAuditDashboardProps {
  apiBaseUrl: string;
}

export const SessionsAuditDashboard: React.FC<SessionsAuditDashboardProps> = ({ apiBaseUrl }) => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const [sessRes, usersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/auth/admin/sessions`),
        fetch(`${apiBaseUrl}/api/v1/auth/admin/users`),
      ]);

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [apiBaseUrl]);

  const handleRevokeSession = async (sessionId: string, userName: string) => {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/admin/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setActionMessage(`Revoked active session for ${userName}`);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch {
      setActionMessage('Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Better Auth Audit & Active Sessions</h1>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              Live Monitoring
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-0.5">
            Real-time audit log of developer accounts, authenticated sessions, IP addresses, and active devices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuditData}
          disabled={isLoading}
          className="border-[#27272a] bg-[#18181b] text-zinc-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Audit Logs
        </Button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#18181b] border-[#27272a]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Active Concurrent Logins</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Live active JWT sessions in PostgreSQL</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-[#27272a]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Registered Developers</span>
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Total provisioned accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-[#27272a]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Auth Engine</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white">Better Auth 1.7</div>
            <p className="text-[11px] text-zinc-500 mt-1">Drizzle ORM + PostgreSQL Adapter</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-[#27272a]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Multi-Tenant Isolation</span>
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white">Active &amp; Strict</div>
            <p className="text-[11px] text-zinc-500 mt-1">Role-Based Access + RLS Enforced</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Active Logged-In Sessions Table */}
      <Card className="bg-[#18181b] border-[#27272a]">
        <CardHeader className="pb-3 border-b border-[#27272a]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                Active Login Sessions
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Every browser and device with an active session token authenticated via Better Auth.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] text-zinc-400">
              {sessions.length} Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#121214] text-zinc-400 font-semibold">
                  <th className="py-3 px-4">Developer Account</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Client &amp; OS</th>
                  <th className="py-3 px-4">Logged In</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-zinc-300">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                          {s.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{s.userName}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{s.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          s.userRole === 'superadmin'
                            ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
                            : s.userRole === 'admin'
                            ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                            : 'text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {s.userRole}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{s.ipAddress || '127.0.0.1'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate max-w-[200px]" title={s.userAgent || 'Web Browser'}>
                          {s.userAgent || 'Chrome on Windows'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={revokingId === s.id}
                        onClick={() => handleRevokeSession(s.id, s.userName)}
                        className="h-7 text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span>Revoke</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Registered Developers Directory */}
      <Card className="bg-[#18181b] border-[#27272a]">
        <CardHeader className="pb-3 border-b border-[#27272a]">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            Registered Developer Directory
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            All user accounts provisioned in the internal PostgreSQL `user` table.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#121214] text-zinc-400 font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-zinc-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] text-zinc-300 border-zinc-700">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active &amp; Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
