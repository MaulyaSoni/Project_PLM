import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductStore } from '@/stores/useProductStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, Send, Play, ChevronLeft, Package, Layers, ArrowRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import CreateECODialog from '@/components/CreateECODialog';

const stages = ['NEW', 'IN_REVIEW', 'DONE'] as const;
const stageLabels = { NEW: 'New', IN_REVIEW: 'In Review', DONE: 'Done' };

export default function ECODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentECO, isLoading, fetchECOById, updateECOStage } = useECOStore();
  const { fetchProducts } = useProductStore();
  const { fetchBOMs } = useBOMStore();
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [applyConfirm, setApplyConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id) fetchECOById(id); }, [id, fetchECOById]);

  if (isLoading) return <LoadingSpinner />;
  if (!currentECO) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/ecos')} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Back to ECOs
        </Button>
        <EmptyState message="ECO not found" />
      </div>
    );
  }

  const eco = currentECO;
  const canSubmit = eco.status === 'NEW' && user?.role === 'ENGINEERING';
  const canEdit = eco.status === 'NEW' && user?.role === 'ENGINEERING';
  const canApprove = eco.status === 'IN_REVIEW' && (user?.role === 'APPROVER' || user?.role === 'ADMIN');
  const canApply = eco.status === 'APPROVED' && user?.role === 'ADMIN';

  const stageIndex = stages.indexOf(eco.stage);

  const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'apply') => {
    await updateECOStage(eco.id, action, comment, user?.id, user?.name);
    if (action === 'apply') {
      await Promise.all([fetchProducts(), fetchBOMs()]);
    }
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
            <div className="flex items-center gap-2">
              {eco.versionUpdate && <Badge variant="outline" className="bg-success/10 text-success border-success/30">Creates New Version</Badge>}
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1" />Edit ECO
                </Button>
              )}
            </div>
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
        <div className="col-span-3 space-y-6">
          {eco.type === 'PRODUCT' && eco.productChanges && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Product Specification Changes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eco.productChanges.map((c, idx) => {
                  const isPositive = c.newValue > c.oldValue;
                  const isNegative = c.newValue < c.oldValue;

                  return (
                    <Card key={c.field + '-' + idx} className="bg-card/40 backdrop-blur-xl border border-foreground/10 shadow-xl overflow-hidden relative group hover:border-foreground/20 transition-colors">
                      <div className={cn("absolute top-0 left-0 w-1 h-full",
                        isPositive ? 'bg-success' : isNegative ? 'bg-destructive' : 'bg-muted-foreground'
                      )} />
                      <CardContent className="p-5 pl-6">
                        <p className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">{c.field}</p>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1 w-[40%]">
                            <p className="text-xs text-foreground/40 font-medium">Previous</p>
                            <p className="font-mono text-lg text-foreground/70 line-through decoration-destructive/50 decoration-2">
                              ${c.oldValue.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-center w-[20%]">
                            <ArrowRight className="h-5 w-5 text-foreground/20" />
                          </div>

                          <div className="space-y-1 w-[40%] text-right">
                            <p className="text-xs text-primary/70 font-medium text-right shadow-primary">Proposed</p>
                            <p className={cn("font-mono text-xl font-bold dropshadow-md",
                              isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-foreground'
                            )}>
                              ${c.newValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {eco.type === 'BOM' && eco.bomComponentChanges && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-secondary" /> BOM Architecture Diff
              </h3>

              <Card className="bg-card/40 backdrop-blur-xl border border-foreground/10 shadow-xl p-0 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-foreground/[0.02]">
                      <TableRow className="border-foreground/5 hover:bg-transparent">
                        <TableHead className="text-foreground font-semibold py-4 px-6">Component Node</TableHead>
                        <TableHead className="text-foreground font-semibold py-4">Before</TableHead>
                        <TableHead className="text-foreground font-semibold py-4">After</TableHead>
                        <TableHead className="text-right text-foreground font-semibold py-4 pr-6">Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eco.bomComponentChanges.map((c, idx) => {
                        const isAdded = c.changeType === 'ADDED';
                        const isRemoved = c.changeType === 'REMOVED';
                        const isChanged = c.changeType === 'CHANGED';
                        const isUnchanged = c.changeType === 'UNCHANGED';

                        const increase = isChanged && Number(c.newQty) > Number(c.oldQty);
                        const decrease = isChanged && Number(c.newQty) < Number(c.oldQty);

                        return (
                          <TableRow key={c.componentName + '-' + idx} className={cn('border-foreground/5 transition-colors group',
                            isAdded && 'bg-success/[0.02] hover:bg-success/[0.05]',
                            isRemoved && 'bg-destructive/[0.02] hover:bg-destructive/[0.05]',
                            isChanged && 'bg-warning/[0.02] hover:bg-warning/[0.05]',
                            isUnchanged && 'hover:bg-foreground/[0.02]'
                          )}>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                  isAdded ? 'bg-success shadow-[0_0_8px_rgba(0,255,128,0.6)]' :
                                    isRemoved ? 'bg-destructive shadow-[0_0_8px_rgba(255,0,0,0.6)]' :
                                      isChanged ? 'bg-warning shadow-[0_0_8px_rgba(255,166,0,0.6)]' :
                                        'bg-foreground/20'
                                )} />
                                <span className="font-medium text-foreground">{c.componentName}</span>
                              </div>
                            </TableCell>

                            <TableCell className="font-mono text-foreground/50">
                              {isAdded ? '—' : isRemoved ? <span className="text-destructive max-w-max line-through decoration-destructive/50">{c.oldQty}</span> : isChanged ? <span className="text-foreground/60 line-through decoration-foreground/30">{c.oldQty}</span> : c.oldQty}
                            </TableCell>

                            <TableCell className="font-mono text-foreground">
                              {isRemoved ? '—' : isAdded ? <span className="text-success font-bold">{c.newQty}</span> : isChanged ? <span className={increase ? 'text-success font-bold' : 'text-destructive font-bold'}>{c.newQty}</span> : c.newQty}
                            </TableCell>

                            <TableCell className="text-right pr-6">
                              {isAdded && <Badge className="bg-success text-success-foreground border-0 shadow-[0_0_10px_rgba(0,255,128,0.2)]">CREATED</Badge>}
                              {isRemoved && <Badge className="bg-destructive text-destructive-foreground border-0 shadow-[0_0_10px_rgba(255,0,0,0.2)]">PURGED</Badge>}
                              {isChanged && increase && <Badge className="bg-warning text-warning-foreground border-0 shadow-[0_0_10px_rgba(255,166,0,0.2)]">SCALED UP</Badge>}
                              {isChanged && decrease && <Badge className="bg-warning text-warning-foreground border-0 shadow-[0_0_10px_rgba(255,166,0,0.2)]">SCALED DOWN</Badge>}
                              {isUnchanged && <span className="text-xs font-mono text-foreground/30 tracking-widest">STABLE</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-foreground/10"><span className="text-[10px] uppercase font-bold text-foreground">PDF</span></div>
              Supporting Documentation
            </h3>
            <Card
              className="bg-card/40 backdrop-blur-xl border border-foreground/10 border-dashed hover:border-foreground/30 transition-colors shadow-none cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files!)]) }}
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]) }} />
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  <ArrowUp className="h-6 w-6 text-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-foreground font-medium mb-1">Drag & drop technical payloads here</p>
                <p className="text-sm text-foreground/40">Only authorized engineering documents (.pdf, .cad, .zip)</p>
              </CardContent>
            </Card>

            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-foreground/10 animate-fade-in shadow-sm">
                    <span className="text-sm text-foreground font-medium tracking-wide flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      {f.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-foreground/40 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setAttachments(attachments.filter((_, idx) => idx !== i)) }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  {eco.approvals.map((a, idx) => (
                    <div key={a.id || idx} className="flex items-start gap-3">
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
                {eco.auditLog.slice(0, 10).reverse().map((entry, idx) => {
                  const colors = { CREATE: 'text-primary', UPDATE: 'text-warning', APPROVE: 'text-success', REJECT: 'text-destructive', ARCHIVE: 'text-muted-foreground' };
                  return (
                    <div key={entry.id || idx} className="flex items-start gap-3 text-sm">
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
      {editOpen && (
        <CreateECODialog
          open={editOpen}
          onOpenChange={(next) => {
            setEditOpen(next);
            if (!next && id) fetchECOById(id);
          }}
          eco={currentECO}
        />
      )}
    </div>
  );
}
