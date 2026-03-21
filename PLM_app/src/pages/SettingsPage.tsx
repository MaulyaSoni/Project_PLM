import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { RoleBadge } from '@/components/RoleBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, GripVertical, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { Role } from '@/data/mockData';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { settingsService, type StageItem, type UserItem } from '@/services/settings.service';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [stages, setStages] = useState<StageItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('ENGINEERING');

  useEffect(() => {
    settingsService.getStages()
      .then(setStages)
      .catch(() => toast.error('Failed to load stages'));
    settingsService.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'));
  }, []);

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
            <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" />Add Stage</Button>
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
    </div>
  );
}
