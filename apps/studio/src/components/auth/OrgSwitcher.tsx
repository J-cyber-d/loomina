import React, { useState } from 'react';
import { Building2, Check, ChevronDown, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';

export interface OrgItem {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrgSwitcherProps {
  currentOrg: OrgItem;
  organizations: OrgItem[];
  onSelectOrg: (org: OrgItem) => void;
  onCreateOrg: (name: string, slug: string) => void;
}

export const OrgSwitcher: React.FC<OrgSwitcherProps> = ({
  currentOrg,
  organizations,
  onSelectOrg,
  onCreateOrg,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    onCreateOrg(newOrgName, slug);
    setShowCreateModal(false);
    setNewOrgName('');
    setNewOrgSlug('');
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs transition-colors"
        >
          <div className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] border border-indigo-500/30">
            {currentOrg.name.charAt(0)}
          </div>
          <div className="text-left font-medium text-zinc-200 truncate max-w-[140px]">
            {currentOrg.name}
          </div>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-indigo-500/20 text-indigo-400 bg-indigo-500/10">
            {currentOrg.role}
          </Badge>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl z-50 p-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Workspaces</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                  <ShieldCheck className="w-3 h-3" />
                  Better Auth
                </span>
              </div>

              <div className="space-y-0.5 my-1">
                {organizations.map((org) => {
                  const isSelected = org.id === currentOrg.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        onSelectOrg(org);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/30'
                          : 'text-zinc-300 hover:bg-[#27272a] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace...</span>
                </button>
              </div>

              <div className="pt-1.5 mt-1 border-t border-[#27272a] px-2 py-1 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-indigo-400" />
                  Superadmin mode
                </span>
                <span className="font-mono">v0.1.0</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organization Workspace</DialogTitle>
            <DialogDescription>
              Better Auth Multi-Tenant Workspace: isolate databases, team members, and client dashboards.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs py-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Workspace Name</label>
              <Input
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  if (!newOrgSlug) {
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }
                }}
                placeholder="e.g. Acme SaaS Global"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">Workspace Slug</label>
              <Input
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="e.g. acme-saas-global"
              />
            </div>

            <div className="pt-4 border-t border-[#27272a] flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Create Workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
