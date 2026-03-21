import { useState } from 'react';
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
import { mockUsers } from '@/data/mockData';
import type { Role } from '@/data/mockData';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';

const defaultStages = [
  { id: '1', name: 'New', order: 1, requiresApproval: false },
  { id: '2', name: 'In Review', order: 2, requiresApproval: true },
  { id: '3', name: 'Done', order: 3, requiresApproval: false },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [stages, setStages] = useState(defaultStages);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('ENGINEERING');

  const handleInvite = () => {
    setInviteOpen(false);
    setInviteEmail('');
    toast.success('Invitation sent');
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
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.order}</TableCell>
                    <TableCell><Switch checked={s.requiresApproval} onCheckedChange={v => setStages(stages.map(st => st.id === s.id ? { ...st, requiresApproval: v } : st))} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm"><Pencil className="h-3 w-3" /></Button>
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
                {mockUsers.map(u => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-right">
                      <Select
                        defaultValue={u.role}
                        onValueChange={() => {
                          if (u.id === user?.id) {
                            toast.error('You cannot change your own role');
                          }
                        }}
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
