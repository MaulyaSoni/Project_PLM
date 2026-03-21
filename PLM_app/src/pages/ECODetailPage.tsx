import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, Send, Play, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stages = ['NEW', 'IN_REVIEW', 'DONE'] as const;
const stageLabels = { NEW: 'New', IN_REVIEW: 'In Review', DONE: 'Done' };

export default function ECODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentECO, isLoading, fetchECOById, updateECOStage } = useECOStore();
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [applyConfirm, setApplyConfirm] = useState(false);

  useEffect(() => { if (id) fetchECOById(id); }, [id, fetchECOById]);

  if (isLoading || !currentECO) return <LoadingSpinner />;

  const eco = currentECO;
  const canSubmit = eco.status === 'NEW' && (eco.createdBy === user?.id || user?.role === 'ADMIN');
  const canApprove = eco.status === 'IN_REVIEW' && (user?.role === 'APPROVER' || user?.role === 'ADMIN');
  const canApply = eco.status === 'APPROVED' && (user?.role === 'ADMIN' || user?.role === 'ENGINEERING');

  const stageIndex = stages.indexOf(eco.stage);

  const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'apply') => {
    await updateECOStage(eco.id, action, comment, user?.id, user?.name);
    setComment('');
    const msgs = { submit: 'Submitted for review', approve: 'ECO approved', reject: 'ECO rejected', apply: 'ECO applied successfully' };
    toast.success(msgs[action]);
  };

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/ecos')} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to ECOs
      </Button>

      {/* Header Card */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">{eco.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={eco.type} />
                <StatusBadge status={eco.status} />
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{eco.productName}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">Assigned to {eco.assignedToName}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">Effective {eco.effectiveDate}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Created by {eco.createdByName} on {eco.createdAt}</p>
            </div>
            {eco.versionUpdate && <Badge variant="outline" className="bg-success/10 text-success border-success/30">Creates New Version</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Stage Progress */}
      <div className="flex items-center justify-center mb-6 gap-0">
        {stages.map((stage, i) => {
          const isCompleted = i < stageIndex;
          const isCurrent = i === stageIndex;
          return (
            <div key={stage} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border',
                isCompleted && 'bg-success/15 text-success border-success/30',
                isCurrent && 'bg-primary/15 text-primary border-primary/30',
                !isCompleted && !isCurrent && 'bg-muted/40 text-muted-foreground border-border'
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {stageLabels[stage]}
              </div>
              {i < stages.length - 1 && <div className={cn('w-12 h-0.5 mx-1', isCompleted ? 'bg-success' : 'bg-border')} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left — Changes */}
        <div className="col-span-3 space-y-4">
          {eco.type === 'PRODUCT' && eco.productChanges && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Product Changes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Field</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {eco.productChanges.map(c => (
                      <TableRow key={c.field} className="border-border">
                        <TableCell className="font-medium">{c.field}</TableCell>
                        <TableCell className="text-muted-foreground">${c.oldValue.toLocaleString()}</TableCell>
                        <TableCell className={c.newValue > c.oldValue ? 'text-success' : c.newValue < c.oldValue ? 'text-destructive' : 'text-muted-foreground'}>
                          ${c.newValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {c.newValue > c.oldValue && <ArrowUp className="h-4 w-4 text-success" />}
                          {c.newValue < c.oldValue && <ArrowDown className="h-4 w-4 text-destructive" />}
                          {c.newValue === c.oldValue && <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {eco.type === 'BOM' && eco.bomComponentChanges && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">BOM Component Changes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Old Qty</TableHead><TableHead>New Qty</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {eco.bomComponentChanges.map(c => (
                      <TableRow key={c.componentName} className={cn('border-border', c.changeType === 'ADDED' && 'bg-success/5', c.changeType === 'REMOVED' && 'bg-destructive/5')}>
                        <TableCell className="font-medium">{c.componentName}</TableCell>
                        <TableCell>{c.changeType === 'ADDED' ? '—' : c.changeType === 'CHANGED' ? <span className="line-through text-destructive">{c.oldQty}</span> : c.oldQty}</TableCell>
                        <TableCell>{c.changeType === 'REMOVED' ? '—' : c.changeType === 'CHANGED' ? <span className="text-success font-medium">{c.newQty}</span> : c.newQty}</TableCell>
                        <TableCell>
                          {c.changeType === 'ADDED' && <Badge variant="outline" className="bg-success/15 text-success border-success/30 text-xs">ADDED</Badge>}
                          {c.changeType === 'REMOVED' && <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-xs">REMOVED</Badge>}
                          {c.changeType === 'CHANGED' && <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 text-xs">CHANGED</Badge>}
                          {c.changeType === 'UNCHANGED' && <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Actions */}
        <div className="col-span-2 space-y-4">
          {/* Stage Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {canSubmit && (
                <Button onClick={() => handleAction('submit')} className="w-full">
                  <Send className="h-4 w-4 mr-2" />Submit for Review
                </Button>
              )}
              {canApprove && (
                <>
                  <Input placeholder="Add comment..." value={comment} onChange={e => setComment(e.target.value)} className="bg-muted border-border" />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction('approve')} className="flex-1 bg-success hover:bg-success/90">
                      <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                    </Button>
                    <Button onClick={() => handleAction('reject')} variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Waiting for approval from Approver</p>
                </>
              )}
              {canApply && (
                <>
                  <p className="text-xs text-warning">Applying will create a new version and archive the current one.</p>
                  <Button onClick={() => setApplyConfirm(true)} className="w-full">
                    <Play className="h-4 w-4 mr-2" />Apply ECO & Close
                  </Button>
                </>
              )}
              {eco.status === 'DONE' && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm font-medium text-success">ECO Applied Successfully</p>
                </div>
              )}
              {eco.status === 'NEW' && !canSubmit && (
                <p className="text-sm text-muted-foreground text-center py-2">No actions available for your role.</p>
              )}
            </CardContent>
          </Card>

          {/* Approvals */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Approvals</CardTitle></CardHeader>
            <CardContent>
              {eco.approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approvals yet</p>
              ) : (
                <div className="space-y-3">
                  {eco.approvals.map(a => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {a.userName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{a.userName}</span>
                          <StatusBadge status={a.action} />
                        </div>
                        {a.comment && <p className="text-xs text-muted-foreground mt-1">{a.comment}</p>}
                        <p className="text-xs text-muted-foreground">{a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Audit Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eco.auditLog.slice(0, 10).reverse().map(entry => {
                  const colors = { CREATE: 'text-primary', UPDATE: 'text-warning', APPROVE: 'text-success', REJECT: 'text-destructive', ARCHIVE: 'text-muted-foreground' };
                  return (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', colors[entry.actionType]?.replace('text-', 'bg-'))} />
                      <div>
                        <p>{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={applyConfirm} onOpenChange={setApplyConfirm} title="Apply ECO" description="This will create a new version and archive the current one. This cannot be undone." confirmLabel="Apply" onConfirm={() => { handleAction('apply'); setApplyConfirm(false); }} />
    </div>
  );
}
