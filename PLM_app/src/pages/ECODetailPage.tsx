import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductStore } from '@/stores/useProductStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { settingsService, type StageItem } from '@/services/settings.service';
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
import api from '@/services/api';

const legacyStages = ['NEW', 'IN_REVIEW', 'DONE'] as const;
const defaultStageLabels: Record<string, string> = { NEW: 'New', IN_REVIEW: 'In Review', DONE: 'Done' };

import { AlertTriangle, Sparkles, TrendingUp, Info } from 'lucide-react';

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
  const [dynamicStages, setDynamicStages] = useState<StageItem[]>([]);
  const [generatingImpact, setGeneratingImpact] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchECOById(id);
    settingsService.getStages().then(setDynamicStages).catch(console.error);
  }, [id, fetchECOById]);

  useEffect(() => {
    if (currentECO?.aiAnalysis) {
      try {
        setImpactData(JSON.parse(currentECO.aiAnalysis));
      } catch (e) {
        console.error('Failed to parse AI Analysis:', e);
      }
    }
  }, [currentECO]);

  const generateImpact = async () => {
    if (!id) return;
    setGeneratingImpact(true);
    try {
      const response = await api.get(`/ai/impact-analysis/${id}`);
      setImpactData(response.data.data);
      toast.success('AI Impact Analysis generated!');
      fetchECOById(id); // Refresh to get the cached analysis
    } catch (err: any) {
      toast.error('Failed to generate impact analysis: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingImpact(false);
    }
  };

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

  const stagesList = dynamicStages.length > 0 ? dynamicStages.map(s => s.name.toUpperCase().replace(/ /g, '_')) : legacyStages;
  const stageIndex = Math.max(0, stagesList.indexOf(eco.stage));

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
              <h1 className="text-2xl font-semibold mb-2">{eco.title}</h1>
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
      <div className="flex items-center justify-center mb-6 gap-0 overflow-x-auto pb-4">
        {stagesList.map((stage, i) => {
          const isCompleted = i < stageIndex;
          const isCurrent = i === stageIndex;

          let displayLabel = stage;
          if (dynamicStages.length > 0) {
            displayLabel = dynamicStages[i]?.name || stage;
          } else {
            displayLabel = defaultStageLabels[stage] || stage.replace(/_/g, ' ');
          }

          return (
            <div key={stage} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap',
                isCompleted && 'bg-success/15 text-success border-success/30',
                isCurrent && 'bg-primary/15 text-primary border-primary/30',
                !isCompleted && !isCurrent && 'bg-muted/40 text-muted-foreground border-border'
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {displayLabel}
              </div>
              {i < stagesList.length - 1 && <div className={cn('w-12 h-0.5 mx-1 shrink-0', isCompleted ? 'bg-success' : 'bg-border')} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left — Changes */}
        <div className="col-span-3 space-y-6">
          {eco.type === 'PRODUCT' && eco.productChanges && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Product Specification Changes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost/Sale Fields */}
                {eco.productChanges.map((c, idx) => {
                  const isPositive = c.newValue > c.oldValue;
                  const isNegative = c.newValue < c.oldValue;
                  const isNeutral = c.newValue === c.oldValue;

                  return (
                    <Card key={c.field + '-' + idx} className="bg-card border border-border shadow-sm overflow-hidden relative group hover:border-primary/50 transition-colors rounded-xl">
                      <div className={cn("absolute top-0 left-0 w-1.5 h-full",
                        isPositive ? 'bg-success' :
                          isNegative ? 'bg-destructive' :
                            'bg-muted'
                      )} />
                      <CardContent className="p-6 pl-8">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">{c.field}</p>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1 w-[40%]">
                            <p className="text-xs text-muted-foreground font-medium">Old Value</p>
                            <p className={cn("font-mono text-lg",
                              isPositive || isNegative ? "text-muted-foreground line-through" : "text-foreground"
                            )}>
                              ${c.oldValue.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-center w-[20%]">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="space-y-1 w-[40%] text-right">
                            <p className="text-xs text-primary font-medium">New Value</p>
                            <p className={cn("font-mono text-xl font-semibold",
                              isPositive ? 'text-success' :
                                isNegative ? 'text-destructive' :
                                  'text-foreground'
                            )}>
                              ${c.newValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Attachments comparison card */}
                <Card className="bg-card border border-border shadow-sm overflow-hidden relative group hover:border-primary/50 transition-colors rounded-xl col-span-full md:col-span-1">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
                  <CardContent className="p-6 pl-8">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Attachments</p>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 w-[40%]">
                        <p className="text-xs text-muted-foreground font-medium">Old Version</p>
                        <p className="font-mono text-muted-foreground line-through">0 files</p>
                      </div>
                      <div className="flex items-center justify-center w-[20%]">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 w-[40%] text-right">
                        <p className="text-xs text-primary font-medium">New Version</p>
                        <p className="font-mono text-xl font-semibold text-success">1 file</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {eco.type === 'BOM' && eco.bomComponentChanges && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> BOM Component Comparison
              </h3>

              <Card className="bg-card border-border shadow-sm p-0 overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium py-4 px-6">Component</TableHead>
                        <TableHead className="text-muted-foreground font-medium py-4">Old Version</TableHead>
                        <TableHead className="text-muted-foreground font-medium py-4">New Version</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium py-4 pr-6">Variance</TableHead>
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

                        const isGreen = isAdded || increase;
                        const isRed = isRemoved || decrease;
                        const isNeutral = isUnchanged;

                        return (
                          <TableRow key={c.componentName + '-' + idx} className={cn('border-border transition-colors group',
                            isGreen && 'bg-success/5 hover:bg-success/10',
                            isRed && 'bg-destructive/5 hover:bg-destructive/10',
                            isNeutral && 'hover:bg-muted/50'
                          )}>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full",
                                  isGreen ? 'bg-success' :
                                    isRed ? 'bg-destructive' :
                                      'bg-muted-foreground'
                                )} />
                                <span className="font-medium text-foreground">{c.componentName}</span>
                              </div>
                            </TableCell>

                            <TableCell className="font-mono text-muted-foreground text-sm">
                              {isAdded ? '—' : isRemoved ? <span className="text-destructive line-through">{c.oldQty}</span> : isChanged ? <span className="text-muted-foreground line-through">{c.oldQty}</span> : c.oldQty}
                            </TableCell>

                            <TableCell className="font-mono text-foreground tracking-widest text-sm">
                              {isRemoved ? '—' : isAdded ? <span className="text-success font-semibold">{c.newQty}</span> : isChanged ? <span className={increase ? 'text-success font-semibold' : 'text-destructive font-semibold'}>{c.newQty}</span> : c.newQty}
                            </TableCell>

                            <TableCell className="text-right pr-6">
                              {isAdded && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Added</Badge>}
                              {isRemoved && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Removed</Badge>}
                              {isChanged && increase && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Increased</Badge>}
                              {isChanged && decrease && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Decreased</Badge>}
                              {isUnchanged && <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Neutral</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Operation time changes placeholder if empty */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Operation Time Changes
                </h4>
                <Card className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">No modifications to Assembly or Work Center durations in this ECO.</span>
                  <Badge variant="secondary" className="uppercase text-[10px] tracking-widest">Neutral</Badge>
                </Card>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
              <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-muted"><span className="text-[10px] uppercase font-medium text-muted-foreground">PDF</span></div>
              Supporting Documentation
            </h3>
            <Card
              className="bg-card border border-border border-dashed hover:border-primary/50 transition-colors shadow-sm cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files!)]) }}
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]) }} />
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-primary/10 transition-all">
                  <ArrowUp className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-foreground font-medium mb-1">Drag & drop technical payloads here</p>
                <p className="text-sm text-muted-foreground">Only authorized engineering documents (.pdf, .cad, .zip)</p>
              </CardContent>
            </Card>

            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-card border border-border shadow-sm">
                    <span className="text-sm text-foreground font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      {f.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setAttachments(attachments.filter((_, idx) => idx !== i)) }}>
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
          {/* AI Impact Analysis */}
          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> AI Risk & Impact Assessment
              </h3>
              {!impactData && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground hover:text-foreground"
                  onClick={generateImpact}
                  disabled={generatingImpact}
                >
                  {generatingImpact ? 'Analyzing...' : 'Analyze Now'}
                </Button>
              )}
            </div>
            <CardContent className="p-4 space-y-4">
              {impactData ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Risk Level</p>
                      <Badge variant="outline" className={cn(
                        "font-medium px-2 py-0.5",
                        impactData.risk_level === 'LOW' && 'bg-success/10 text-success border-success/20',
                        impactData.risk_level === 'MEDIUM' && 'bg-warning/10 text-warning border-warning/20',
                        impactData.risk_level === 'HIGH' && 'bg-destructive/10 text-destructive border-destructive/20',
                        impactData.risk_level === 'CRITICAL' && 'bg-destructive text-destructive-foreground border-destructive'
                      )}>
                        {impactData.risk_level}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest">Urgency</p>
                      <div className="flex items-center gap-1 justify-end">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <div key={i} className={cn("h-1 w-2 rounded-full", i <= impactData.urgency_score ? 'bg-primary' : 'bg-muted')} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-md border border-border">
                    <p className="text-xs font-medium italic text-muted-foreground">"{impactData.risk_summary}"</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Estimated Impact
                    </p>
                    <p className="text-xs text-foreground">{impactData.estimated_impact}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Key Considerations
                    </p>
                    <ul className="space-y-1">
                      {impactData.key_considerations?.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <Info className="h-3 w-3" /> AI Recommendation
                    </p>
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
                      <p className="text-xs font-semibold text-primary">{impactData.recommendation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto opacity-50">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI has not yet performed impact analysis for this ECO.</p>
                </div>
              )}
            </CardContent>
          </Card>

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
