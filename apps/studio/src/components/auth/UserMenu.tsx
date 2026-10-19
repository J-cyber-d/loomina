import React, { useState } from 'react';
import { LogOut, ChevronDown, Activity } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { UserSessionData } from './AuthGate';
import { authClient } from '../../lib/auth-client';

interface UserMenuProps {
  session: UserSessionData;
  onSignOut: () => void;
  onOpenSessionsTab?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ session, onSignOut, onOpenSessionsTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Fallback
    }
    onSignOut();
  };

  const initials = session.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[10px]">
          {initials}
        </div>
        <div className="text-left font-medium text-zinc-200 truncate max-w-[110px] hidden sm:block">
          {session.name}
        </div>
        <Badge
          variant="outline"
          className="text-[10px] py-0 px-1.5 h-4 border-indigo-500/20 text-indigo-400 bg-indigo-500/10 hidden md:inline-flex"
        >
          {session.role}
        </Badge>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl z-50 p-2 text-xs">
            {/* User Profile Header */}
            <div className="p-2 border-b border-[#27272a] mb-1">
              <div className="font-semibold text-white">{session.name}</div>
              <div className="text-zinc-400 text-[11px] truncate">{session.email}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30">
                  {session.role.toUpperCase()}
                </Badge>
                <span className="text-[11px] text-zinc-500 truncate">
                  Workspace: {session.organizationName}
                </span>
              </div>
            </div>

            {/* Menu Options */}
            {onOpenSessionsTab && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSessionsTab();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-300 hover:bg-[#27272a] hover:text-white transition-colors text-left"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Logins & Sessions</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Studio</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
