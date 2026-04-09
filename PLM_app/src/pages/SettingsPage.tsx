import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { RoleBadge } from '@/components/RoleBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Pencil, Trash2, UserPlus, Bot, Play, Loader2 } from 'lucide-react';
import type { Role } from '@/data/mockData';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { settingsService, type StageItem, type UserItem } from '@/services/settings.service';
import api from '@/services/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [stages, setStages] = useState<StageItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageApproval, setNewStageApproval] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('ENGINEERING');
  const [agentActions, setAgentActions] = useState<any[]>([]);
  const [bottleneckData, setBottleneckData] = useState<any | null>(null);
  const [runningAgent, setRunningAgent] = useState(false);
  const [overrideEcoId, setOverrideEcoId] = useState('');
  const [overrideApproverId, setOverrideApproverId] = useState('');

  useEffect(() => {
    settingsService.getStages()
      .then(setStages)
      .catch(() => toast.error('Failed to load stages'));
    settingsService.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'));
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/reports/agent-actions')
        .then((r) => setAgentActions(r.data))
        .catch(console.error);
    }
  }, [user?.role]);

  const runAgentNow = async () => {
    setRunningAgent(true);
    try {
      const res = await api.post('/reports/agent/run-now');
      setBottleneckData(res.data.bottleneckAnalysis);
      const actions = await api.get('/reports/agent-actions');
      setAgentActions(actions.data);
      toast.success('Agent run completed');
    } catch {
      toast.error('Agent run failed');
    } finally {
      setRunningAgent(false);
    }
  };

  const overrideApprover = async () => {
    if (!overrideEcoId || !overrideApproverId) {
      toast.error('Provide ECO ID and approver');
      return;
    }

    try {
      await api.post('/reports/agent/override-approver', {
        ecoId: overrideEcoId,
        approverId: overrideApproverId,
        reason: 'Admin override from NIYANTRAK AI monitor',
      });
      toast.success('Approver assignment overridden');
      setOverrideEcoId('');
      setOverrideApproverId('');
      const actions = await api.get('/reports/agent-actions');
      setAgentActions(actions.data);
    } catch {
      toast.error('Failed to override approver assignment');
    }
  };

  const ACTION_META: Record<string, { label: string; color: string }> = {
    NUDGE_SENT: { label: 'Nudge Sent', color: 'text-blue-400' },
    BOTTLENECK_FLAGGED: { label: 'Bottleneck', color: 'text-red-400' },
    AUTO_ASSIGNED: { label: 'Auto Assigned', color: 'text-green-400' },
    ESCALATED: { label: 'Escalated', color: 'text-amber-400' },
  };

  const handleInvite = () => {
    setInviteOpen(false);
    setInviteEmail('');
    toast.success('Invitation sent');
  };

  const handleStageToggle = async (stage: StageItem, requiresApproval: boolean) => {
    try {
      const updated = await settingsService.updateStage(stage.id, { requiresApproval });
      setStages((prev) => prev.map((s) => (s.id === stage.id ? updated : s)));
      toast.success('Stage updated successfully');
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleStageRename = async (stage: StageItem) => {
    const name = editingName.trim();
    if (!name || name === stage.name) {
      setEditingStage(null);
      return;
    }
    try {
      const updated = await settingsService.updateStage(stage.id, { name });
      setStages((prev) => prev.map((s) => (s.id === stage.id ? updated : s)));
      toast.success('Stage updated successfully');
    } catch {
      toast.error('Failed to update stage');
    } finally {
      setEditingStage(null);
    }
  };

  const handleAddStage = async () => {
    const name = newStageName.trim();
    if (!name) return;
    try {
      const highestOrder = stages.reduce((max, s) => Math.max(max, s.order), 0);
      const newStage = await settingsService.createStage({
        name,
        requiresApproval: newStageApproval,
        order: highestOrder + 1,
      });
      setStages((prev) => [...prev, newStage].sort((a, b) => a.order - b.order));
      toast.success('Stage added successfully');
      setAddStageOpen(false);
      setNewStageName('');
      setNewStageApproval(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to add stage');
    }
  };

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      if (id === user?.id) {
        toast.error('You cannot change your own role');
        return;
      }
      const updated = await settingsService.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)));
      toast.success('User role updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="System Settings" subtitle="Manage ECO stages and users" />

      <div className="grid grid-cols-2 gap-6">
        {/* ECO Stages */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ECO Stages</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setAddStageOpen(true)}><Plus className="h-3 w-3 mr-1" />Add Stage</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead></TableHead><TableHead>Stage</TableHead><TableHead>Order</TableHead><TableHead>Approval</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {stages.map(s => (
                  <TableRow key={s.id} className="border-border">
                    <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                    <TableCell className="font-medium">
                      {editingStage === s.id ? (
                        <Input
                          value={editingName}
                          autoFocus
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleStageRename(s)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStageRename(s);
                            if (e.key === 'Escape') setEditingStage(null);
                          }}
                          className="h-8"
                        />
                      ) : (
                        s.name
                      )}
                    </TableCell>
                    <TableCell>{s.order}</TableCell>
                    <TableCell><Switch checked={s.requiresApproval} onCheckedChange={(v) => handleStageToggle(s, v)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingStage(s.id); setEditingName(s.name); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">User Management</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="h-3 w-3 mr-1" />Invite User</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        <span className="text-xs text-muted-foreground">{u.createdAt}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as Role)}
                      >
                        <SelectTrigger className="w-32 h-8 bg-muted border-border text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="ENGINEERING">Engineering</SelectItem>
                          <SelectItem value="APPROVER">Approver</SelectItem>
                          <SelectItem value="OPERATIONS">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="mt-6">
          <Card className="border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  NIYANTRAK AI Agent Monitor
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600"
                  onClick={runAgentNow}
                  disabled={runningAgent}
                >
                  {runningAgent ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Run Now
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Hourly ECO lifecycle checks and 6-hour bottleneck detection run automatically. Use Run Now for immediate analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bottleneckData && (
                <div
                  className={`rounded-lg border p-3 ${!bottleneckData.has_bottleneck ? 'border-green-500/40 bg-green-950/15' : bottleneckData.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-950/20' : bottleneckData.severity === 'HIGH' ? 'border-amber-500/40 bg-amber-950/20' : 'border-blue-500/40 bg-blue-950/15'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-white">System Health</p>
                    <Badge
                      className={!bottleneckData.has_bottleneck ? 'bg-green-950/40 text-green-400 border-green-500/30' : bottleneckData.severity === 'CRITICAL' ? 'bg-red-950/40 text-red-400 border-red-500/30' : 'bg-amber-950/40 text-amber-400 border-amber-500/30'}
                    >
                      {bottleneckData.has_bottleneck ? bottleneckData.severity : 'HEALTHY'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{bottleneckData.summary}</p>
                  {bottleneckData.recommendation && (
                    <p className="text-xs text-blue-400 mt-1.5">→ {bottleneckData.recommendation}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Agent Actions</p>
                {agentActions.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-6">
                    No agent actions yet. Click Run Now to trigger the first check.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {agentActions.slice(0, 8).map((action) => {
                      const meta = ACTION_META[action.actionType] || { label: action.actionType, color: 'text-slate-400' };
                      return (
                        <div
                          key={action.id}
                          className="flex items-start gap-3 text-xs rounded border border-slate-800/50 bg-slate-900/30 px-3 py-2"
                        >
                          <span className={`font-medium flex-shrink-0 mt-0.5 ${meta.color}`}>{meta.label}</span>
                          <p className="text-slate-400 flex-1 leading-relaxed">{action.reasoning || action.reason || action.message}</p>
                          <span className="text-slate-600 flex-shrink-0 text-xs">
                            {new Date(action.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 space-y-3">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Smart Approver Override</p>
                <Input
                  value={overrideEcoId}
                  onChange={(e) => setOverrideEcoId(e.target.value)}
                  placeholder="ECO ID"
                  className="bg-slate-950/60 border-slate-700"
                />
                <Select value={overrideApproverId} onValueChange={setOverrideApproverId}>
                  <SelectTrigger className="bg-slate-950/60 border-slate-700">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter((u) => u.role === 'APPROVER').map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={overrideApprover}>Override Assignment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-muted border-border" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={v => setInviteRole(v as Role)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ENGINEERING">Engineering</SelectItem>
                  <SelectItem value="APPROVER">Approver</SelectItem>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add ECO Stage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} className="bg-muted border-border" placeholder="e.g. Quality Check" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={newStageApproval} onCheckedChange={setNewStageApproval} id="require-approval" />
              <Label htmlFor="require-approval">Requires Approval</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddStageOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStage} disabled={!newStageName.trim()}>Add Stage</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
