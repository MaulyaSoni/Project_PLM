import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useProductStore } from '@/stores/useProductStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Layers, ArrowRight, Plus, Trash2, Sparkles, AlertTriangle, ShieldCheck, Info, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ECO, ECOType, ECOProductChange, ECOBOMComponentChange } from '@/data/mockData';
import { useEffect } from 'react';
import api from '@/services/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: ECOType;
  initialProductId?: string;
  initialBOMId?: string;
  initialTitle?: string;
  /** When provided, the dialog operates in edit mode, pre-filling fields from the ECO. */
  eco?: ECO;
}

type ConflictData = {
  has_conflicts?: boolean;
  conflict_count?: number;
  conflicts?: Array<{
    conflicting_eco_title?: string;
    description?: string;
    suggestion?: string;
  }>;
};

type TemplateSuggestion = {
  has_suggestion?: boolean;
  confidence?: string;
  insight?: string;
  pattern_detected?: string;
  based_on_ecos?: number;
  suggested_title_prefix?: string;
  suggested_changes?: Array<{
    fieldName?: string;
    oldValue?: string | number;
    newValue?: string | number;
    changeType?: string;
  }>;
};

type QualityScore = {
  blocking?: boolean;
  total_score?: number;
  summary?: string;
  improvements?: string[];
};

type ApprovalPrediction = {
  approval_probability?: number;
  predicted_outcome?: 'APPROVE' | 'REJECT';
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  top_risk_factors?: string[];
  recommended_fixes?: string[];
  rationale?: string;
};

type BomImpactGraph = {
  affected_components?: Array<{
    component?: string;
    impact_type?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  likely_bottlenecks?: string[];
  rollback_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  qa_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

type SimilarECOResult = {
  eco_id?: string;
  eco_title?: string;
  match_confidence?: number;
  outcome?: string;
  timeline_days?: number;
  applied_fixes?: string[];
  reusable_template?: {
    suggested_title?: string;
    suggested_description?: string;
    suggested_changes?: Array<{
      fieldName?: string;
      componentName?: string;
      oldValue?: string | number | null;
      newValue?: string | number | null;
      changeType?: string;
    }>;
  };
};

type SimilarECOData = {
  top_similar_ecos?: SimilarECOResult[];
  reusable_template?: SimilarECOResult['reusable_template'];
};

type WritingCopilotData = {
  improved_title?: string;
  concise_summary?: string;
  technical_detail_version?: string;
  approver_version?: string;
};

type RolloutSimulationData = {
  rollout_strategy?: string;
  predicted_stability?: string;
  estimated_days_to_full_rollout?: number;
  phases?: Array<{
    phase?: string;
    timeline?: string;
    objective?: string;
  }>;
  likely_blockers?: string[];
  rollback_plan?: string;
};

export default function CreateECODialog({ open, onOpenChange, initialType, initialProductId, initialBOMId, initialTitle, eco: editEco }: Props) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ECOType | ''>('');
  const [productId, setProductId] = useState('');
  const [bomId, setBomId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [versionUpdate, setVersionUpdate] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Description fields
  const [description, setDescription] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [templateSuggestion, setTemplateSuggestion] = useState<TemplateSuggestion | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [animatedQualityScore, setAnimatedQualityScore] = useState(0);
  const [scoringDraft, setScoringDraft] = useState(false);
  const [approvalPrediction, setApprovalPrediction] = useState<ApprovalPrediction | null>(null);
  const [bomImpactGraph, setBomImpactGraph] = useState<BomImpactGraph | null>(null);
  const [runningPreSubmitGate, setRunningPreSubmitGate] = useState(false);
  const [similarECOs, setSimilarECOs] = useState<SimilarECOData | null>(null);
  const [loadingSimilarECOs, setLoadingSimilarECOs] = useState(false);
  const [writingCopilot, setWritingCopilot] = useState<WritingCopilotData | null>(null);
  const [runningWritingCopilot, setRunningWritingCopilot] = useState(false);
  const [rolloutSimulation, setRolloutSimulation] = useState<RolloutSimulationData | null>(null);
  const [runningRolloutSim, setRunningRolloutSim] = useState(false);

  // Product changes
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');

  // BOM changes
  const [bomChanges, setBomChanges] = useState<{ name: string; oldQty: string; newQty: string; changeType: string }[]>([]);

  const { createECO, updateECO } = useECOStore();
  const { products, fetchProducts } = useProductStore();
  const { boms, fetchBOMs } = useBOMStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Only fetch when dialog opens, and only if data isn't already loaded — prevents infinite loop
  // caused by Zustand store functions being recreated on every render causing the deps to always change
  useEffect(() => {
    if (!open) return;
    if (products.length === 0) fetchProducts();
    if (boms.length === 0) fetchBOMs();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;

    // Edit mode: pre-fill all fields from existing ECO
    if (editEco) {
      setTitle(editEco.title);
      setType(editEco.type);
      setProductId(editEco.productId);
      if (editEco.bomId) setBomId(editEco.bomId);
      setEffectiveDate(editEco.effectiveDate);
      setVersionUpdate(editEco.versionUpdate);
      if (editEco.type === 'PRODUCT' && editEco.productChanges) {
        const saleChange = editEco.productChanges.find(c => c.field === 'Sale Price');
        const costChange = editEco.productChanges.find(c => c.field === 'Cost Price');
        if (saleChange) setNewSalePrice(String(saleChange.newValue));
        if (costChange) setNewCostPrice(String(costChange.newValue));
      }
      if (editEco.type === 'BOM' && editEco.bomComponentChanges) {
        setBomChanges(editEco.bomComponentChanges.map(c => ({
          name: c.componentName,
          oldQty: c.oldQty !== null ? String(c.oldQty) : '0',
          newQty: c.newQty !== null ? String(c.newQty) : '',
          changeType: c.changeType,
        })));
      }
      if (editEco.description) setDescription(editEco.description);
      if (editEco.aiSummary) setAiSummary(editEco.aiSummary);
      if (editEco.aiTags) setAiTags(editEco.aiTags);
      if (editEco.aiApprovalPrediction) {
        try {
          setApprovalPrediction(JSON.parse(editEco.aiApprovalPrediction));
        } catch {
          setApprovalPrediction(null);
        }
      }
      if (editEco.aiBomImpactGraph) {
        try {
          setBomImpactGraph(JSON.parse(editEco.aiBomImpactGraph));
        } catch {
          setBomImpactGraph(null);
        }
      }
      return;
    }

    if (initialType) setType(initialType);
    if (initialTitle) setTitle(initialTitle);

    if (initialProductId) {
      handleProductSelect(initialProductId);
      setProductId(initialProductId);
    }

    if (initialBOMId) {
      handleBOMSelect(initialBOMId);
      setBomId(initialBOMId);
    }
  }, [open, initialType, initialProductId, initialBOMId, initialTitle, editEco]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !productId || !type) return;
    fetchTemplateSuggestion();
  }, [open, productId, type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!qualityScore?.total_score) {
      setAnimatedQualityScore(0);
      return;
    }

    const target = Math.max(0, Math.min(10, Number(qualityScore.total_score) || 0));
    let current = 0;
    setAnimatedQualityScore(0);

    const timer = window.setInterval(() => {
      current += 1;
      setAnimatedQualityScore(Math.min(current, target));
      if (current >= target) {
        window.clearInterval(timer);
      }
    }, 70);

    return () => window.clearInterval(timer);
  }, [qualityScore?.total_score]);

  const selectedProduct = products.find(p => p.id === productId);
  const selectedBOM = boms.find(b => b.id === bomId);
  const filteredBOMs = boms.filter(b => b.productId === productId && b.status === 'ACTIVE');

  const resetForm = () => {
    setStep(1); setTitle(''); setType(''); setProductId(''); setBomId('');
    setEffectiveDate(''); setVersionUpdate(true); setConfirmed(false);
    setNewSalePrice(''); setNewCostPrice(''); setBomChanges([]);
    setDescription(''); setAiSummary(''); setAiTags([]);
    setConflictData(null);
    setTemplateSuggestion(null);
    setLoadingTemplate(false);
    setQualityScore(null);
    setScoringDraft(false);
    setApprovalPrediction(null);
    setBomImpactGraph(null);
    setRunningPreSubmitGate(false);
    setSimilarECOs(null);
    setLoadingSimilarECOs(false);
    setWritingCopilot(null);
    setRunningWritingCopilot(false);
    setRolloutSimulation(null);
    setRunningRolloutSim(false);
    setIsSubmitting(false);
  };

  const getDraftChanges = () => {
    if (type === 'PRODUCT') {
      return [
        { fieldName: 'Sale Price', oldValue: selectedProduct?.salePrice, newValue: Number(newSalePrice), changeType: 'CHANGED' },
        { fieldName: 'Cost Price', oldValue: selectedProduct?.costPrice, newValue: Number(newCostPrice), changeType: 'CHANGED' },
      ];
    }

    return bomChanges
      .filter(c => c.changeType !== 'UNCHANGED')
      .map(c => ({
        fieldName: c.name,
        oldValue: c.oldQty,
        newValue: c.newQty,
        changeType: c.changeType
      }));
  };

  const fetchTemplateSuggestion = async () => {
    setLoadingTemplate(true);
    try {
      const res = await api.get('/ai/template-suggestion', {
        params: { productId, ecoType: type }
      });
      const suggestion = res.data?.data;
      if (suggestion?.has_suggestion) {
        setTemplateSuggestion(suggestion);
      } else {
        setTemplateSuggestion(null);
      }
    } catch (e) {
      console.error('Template suggestion failed:', e);
      setTemplateSuggestion(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleStep2Next = async () => {
    setScoringDraft(true);
    try {
      const res = await api.post('/ai/quality-score', {
        ecoId: editEco?.id || null,
        title,
        type,
        productId,
        changes: getDraftChanges(),
        description,
        effectiveDate,
        versionUpdate,
      });

      const score = res.data?.data;
      setQualityScore(score);

      if (score?.blocking) {
        toast.error('ECO draft is blocked. Improve quality before continuing.');
        return;
      }

      if ((score?.total_score || 0) <= 5) {
        toast.warning('Quality score is low. Review suggestions before continuing.');
        return;
      }

      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setScoringDraft(false);
    }
  };

  const isDirty =
    step > 1 ||
    !!title ||
    !!type ||
    !!productId ||
    !!bomId ||
    !!effectiveDate ||
    !versionUpdate ||
    !!newSalePrice ||
    !!newCostPrice ||
    !!description ||
    bomChanges.length > 0;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!open || !isDirty || isSubmitting) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [open, isDirty, isSubmitting]);

  const handleProductSelect = (pid: string) => {
    setProductId(pid);
    setBomId('');
    const p = products.find(x => x.id === pid);
    if (p) { setNewSalePrice(String(p.salePrice)); setNewCostPrice(String(p.costPrice)); }
  };

  const handleBOMSelect = (bid: string) => {
    setBomId(bid);
    if (bid === 'NEW') {
      setBomChanges([]);
      return;
    }
    const b = boms.find(x => x.id === bid);
    if (b) {
      setBomChanges(b.components.map(c => ({ name: c.name, oldQty: String(c.quantity), newQty: String(c.quantity), changeType: 'UNCHANGED' })));
    }
  };

  const generateDescription = async () => {
    if (!title) {
      toast.error('Please enter a title to generate a description.');
      return;
    }
    if (!productId) {
      toast.error('Please select a product to generate a description.');
      return;
    }
    if (!type) return;

    setGeneratingDesc(true);
    try {
      const changes = getDraftChanges();

      if (changes.length === 0 && type === 'BOM') {
        toast.error('Please stage at least one BOM component change before generating the description.');
        setGeneratingDesc(false);
        return;
      }

      const response = await api.post('/ai/eco-description', {
        ecoTitle: title,
        ecoType: type,
        productId,
        changes,
        versionUpdate,
        effectiveDate: effectiveDate || null
      });

      const { description: aiDesc, summary, tags } = response.data.data;
      setDescription(aiDesc);
      setAiSummary(summary);
      setAiTags(tags);
      toast.success('AI description generated!');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error('Failed to generate description: ' + (apiErr.response?.data?.error || apiErr.message || 'Unknown error'));
    } finally {
      setGeneratingDesc(false);
    }
  };

  const checkConflicts = async () => {
    if (!productId) return;
    setCheckingConflicts(true);
    try {
      const changes = getDraftChanges();

      const response = await api.post('/ai/conflict-detection', {
        ecoTitle: title,
        ecoType: type,
        productId,
        changes,
        currentEcoId: editEco?.id
      });

      setConflictData(response.data.data);
      if (response.data.data.has_conflicts) {
        toast.warning(`AI detected ${response.data.data.conflict_count} potential conflicts!`);
      } else {
        toast.success('No conflicts detected by AI.');
      }
    } catch (err: unknown) {
      console.error('Conflict detection error:', err);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const runPreSubmitGate = async () => {
    if (!title || !type || !productId) {
      toast.error('Complete title, type and product before running pre-submit checks.');
      return;
    }

    setRunningPreSubmitGate(true);
    try {
      const changes = getDraftChanges();

      const approvalRes = await api.post('/ai/approval-outcome-predictor', {
        ecoId: editEco?.id || null,
        ecoTitle: title,
        ecoType: type,
        productId,
        changes,
        effectiveDate: effectiveDate || null,
        versionUpdate,
        description,
      });

      const approval = approvalRes.data?.data;
      setApprovalPrediction(approval);

      if (type === 'BOM') {
        const impactRes = await api.post('/ai/bom-impact-graph', {
          ecoId: editEco?.id || null,
          ecoTitle: title,
          productId,
          bomId: bomId || null,
          changes,
        });
        setBomImpactGraph(impactRes.data?.data || null);
      } else {
        setBomImpactGraph(null);
      }

      if ((approval?.approval_probability || 0) < 55 || approval?.predicted_outcome === 'REJECT') {
        toast.warning('Pre-submit gate found elevated rejection risk. Apply recommended fixes first.');
      } else {
        toast.success('Pre-submit gate passed. This ECO looks ready for approver review.');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(apiErr.response?.data?.error || apiErr.message || 'Pre-submit gate failed');
    } finally {
      setRunningPreSubmitGate(false);
    }
  };

  const runSimilaritySearch = async () => {
    if (!title || !type || !productId) {
      toast.error('Provide title, type and product before similarity search.');
      return;
    }

    setLoadingSimilarECOs(true);
    try {
      const response = await api.post('/ai/similar-ecos', {
        ecoId: editEco?.id || null,
        ecoTitle: title,
        ecoType: type,
        productId,
        description,
        changes: getDraftChanges(),
      });

      setSimilarECOs(response.data?.data || null);
      toast.success('Similar ECO search completed.');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(apiErr.response?.data?.error || apiErr.message || 'Similarity search failed');
    } finally {
      setLoadingSimilarECOs(false);
    }
  };

  const applyReusableTemplate = (template?: SimilarECOResult['reusable_template']) => {
    if (!template) return;

    if (template.suggested_title && !title) setTitle(template.suggested_title);
    if (template.suggested_description) setDescription(template.suggested_description);

    if (type === 'BOM' && Array.isArray(template.suggested_changes) && template.suggested_changes.length > 0) {
      const suggested = template.suggested_changes.map((c) => ({
        name: c.componentName || c.fieldName || '',
        oldQty: c.oldValue != null ? String(c.oldValue) : '0',
        newQty: c.newValue != null ? String(c.newValue) : '',
        changeType: c.changeType || 'CHANGED',
      }));
      setBomChanges(suggested);
    }

    toast.success('Reusable template applied. Review before submit.');
  };

  const runWritingCopilot = async () => {
    if (!type || !productId) {
      toast.error('Select ECO type and product before using Writing Co-Pilot.');
      return;
    }

    setRunningWritingCopilot(true);
    try {
      const response = await api.post('/ai/eco-writing-copilot', {
        ecoId: editEco?.id || null,
        title,
        description,
        ecoType: type,
        productId,
        changes: getDraftChanges(),
      });
      setWritingCopilot(response.data?.data || null);
      toast.success('Writing Co-Pilot suggestions ready.');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(apiErr.response?.data?.error || apiErr.message || 'Writing Co-Pilot failed');
    } finally {
      setRunningWritingCopilot(false);
    }
  };

  const runRolloutSimulation = async () => {
    if (!title || !type || !productId) {
      toast.error('Provide title, type and product before rollout simulation.');
      return;
    }

    setRunningRolloutSim(true);
    try {
      const response = await api.post('/ai/rollout-simulator', {
        ecoId: editEco?.id || null,
        ecoTitle: title,
        ecoType: type,
        productId,
        effectiveDate: effectiveDate || null,
        changes: getDraftChanges(),
      });
      setRolloutSimulation(response.data?.data || null);
      toast.success('Production rollout simulation generated.');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(apiErr.response?.data?.error || apiErr.message || 'Rollout simulation failed');
    } finally {
      setRunningRolloutSim(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !type) return;
    if (isSubmitting) return;

    if (!approvalPrediction) {
      toast.error('Run the pre-submit gate before submitting this ECO.');
      return;
    }

    if ((approvalPrediction.approval_probability || 0) < 55 || approvalPrediction.predicted_outcome === 'REJECT') {
      toast.error('Predicted rejection risk is high. Address recommended fixes before submit.');
      return;
    }

    if (type === 'BOM' && !bomImpactGraph) {
      toast.error('Run BOM impact graph analysis before submitting BOM ECOs.');
      return;
    }

    if (effectiveDate) {
      const selected = new Date(effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        toast.warning('Effective date is in the past');
      }
    }

    setIsSubmitting(true);
    let productChanges: ECOProductChange[] | undefined;
    let bomComponentChanges: ECOBOMComponentChange[] | undefined;

    if (type === 'PRODUCT' && selectedProduct) {
      productChanges = [
        { field: 'Sale Price', oldValue: selectedProduct.salePrice, newValue: Number(newSalePrice) },
        { field: 'Cost Price', oldValue: selectedProduct.costPrice, newValue: Number(newCostPrice) },
      ];
    }
    if (type === 'BOM') {
      bomComponentChanges = bomChanges.map(c => ({
        componentName: c.name,
        oldQty: c.changeType === 'ADDED' ? null : Number(c.oldQty),
        newQty: c.changeType === 'REMOVED' ? null : Number(c.newQty),
        changeType: c.changeType as 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED',
      }));
    }

    try {
      if (editEco) {
        await updateECO(editEco.id, {
          title, effectiveDate, versionUpdate, productChanges, bomComponentChanges,
          description, aiSummary, aiTags,
          aiApprovalPrediction: approvalPrediction ? JSON.stringify(approvalPrediction) : null,
          aiBomImpactGraph: bomImpactGraph ? JSON.stringify(bomImpactGraph) : null,
        });
        toast.success('ECO updated');
        onOpenChange(false);
        resetForm();
      } else {
        const eco = await createECO({
          title, type, productId, productName: selectedProduct?.name || '',
          bomId: bomId || undefined, assignedTo: user.id, assignedToName: user.name,
          effectiveDate, versionUpdate, createdBy: user.id, createdByName: user.name,
          productChanges, bomComponentChanges,
          description, aiSummary, aiTags,
          aiApprovalPrediction: approvalPrediction ? JSON.stringify(approvalPrediction) : null,
          aiBomImpactGraph: bomImpactGraph ? JSON.stringify(bomImpactGraph) : null,
        });
        toast.success('ECO created');
        onOpenChange(false);
        resetForm();
        navigate(`/ecos/${eco.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && isDirty && !isSubmitting) {
          const shouldClose = window.confirm('You have unsaved changes. Leave anyway?');
          if (!shouldClose) return;
        }
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{editEco ? 'Edit Engineering Change Order' : 'Create Engineering Change Order'}</DialogTitle></DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                {s}
              </div>
              {s < 3 && <div className={cn('w-8 h-0.5', s < step ? 'bg-success' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ECO Title</Label>
              <div className="flex items-center gap-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Describe the change..." className="bg-muted border-border" />
                <Button variant="outline" size="sm" onClick={runWritingCopilot} disabled={runningWritingCopilot || !type || !productId}>
                  {runningWritingCopilot ? '...' : 'Co-Pilot'}
                </Button>
              </div>
              {writingCopilot?.improved_title && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Suggested title: <span className="text-foreground">{writingCopilot.improved_title}</span></p>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTitle(writingCopilot.improved_title || title)}>Use</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>ECO Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['PRODUCT', 'BOM'] as const).map(t => (
                  <Card key={t} className={cn('cursor-pointer transition-all border-2', type === t ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground')} onClick={() => setType(t)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {t === 'PRODUCT' ? <Package className="h-8 w-8 text-primary" /> : <Layers className="h-8 w-8 text-primary" />}
                      <div>
                        <p className="font-medium">{t === 'PRODUCT' ? 'Product Changes' : 'BOM Structure Changes'}</p>
                        <p className="text-xs text-muted-foreground">{t === 'PRODUCT' ? 'Modify pricing or specs' : 'Change components or operations'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={handleProductSelect}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.filter(p => p.status === 'ACTIVE').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Card className="border-indigo-500/30 bg-indigo-950/20">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">ECO Similarity Search + Reuse</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={runSimilaritySearch} disabled={loadingSimilarECOs || !title || !type || !productId}>
                    {loadingSimilarECOs ? 'Searching...' : 'Find Similar'}
                  </Button>
                </div>
                {similarECOs?.top_similar_ecos?.length ? (
                  <div className="space-y-2">
                    {similarECOs.top_similar_ecos.slice(0, 3).map((item, idx) => (
                      <div key={item.eco_id || idx} className="rounded border border-slate-700/50 bg-slate-900/40 p-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-200 truncate">{item.eco_title}</p>
                          <Badge variant="outline" className="text-[10px] border-indigo-300/30 text-indigo-300">{item.match_confidence}%</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400">Outcome: {item.outcome} · Timeline: {item.timeline_days} day(s)</p>
                        {(item.applied_fixes || []).slice(0, 1).map((fix, i) => (
                          <p key={i} className="text-[11px] text-emerald-300">Fix: {fix}</p>
                        ))}
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => applyReusableTemplate(item.reusable_template)}>
                          Apply Reusable Template
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Search similar completed ECOs to reuse proven outcomes and fixes.</p>
                )}
              </CardContent>
            </Card>

            {loadingTemplate && (
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3 space-y-3 overflow-hidden animate-fade-in">
                <div className="h-3 w-36 rounded bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:200%_100%] animate-shimmer" />
                <div className="h-2.5 w-full rounded bg-gradient-to-r from-muted via-muted-foreground/15 to-muted bg-[length:200%_100%] animate-shimmer" />
                <div className="h-2.5 w-3/4 rounded bg-gradient-to-r from-muted via-muted-foreground/15 to-muted bg-[length:200%_100%] animate-shimmer" />
              </div>
            )}

            {templateSuggestion?.has_suggestion && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">AI Template Suggestion</span>
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                      {templateSuggestion.confidence} confidence
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplateSuggestion(null)}
                    className="text-slate-500 h-6 w-6 p-0"
                  >
                    x
                  </Button>
                </div>
                <p className="text-xs text-slate-400">{templateSuggestion.insight}</p>
                <p className="text-xs text-slate-500 italic">
                  Pattern: {templateSuggestion.pattern_detected} · Based on {templateSuggestion.based_on_ecos} previous ECOs
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    if (templateSuggestion.suggested_changes?.length > 0 && type === 'BOM') {
                      const suggested = templateSuggestion.suggested_changes.map((c) => ({
                        name: c.fieldName,
                        oldQty: c.oldValue ? String(c.oldValue) : '0',
                        newQty: c.newValue ? String(c.newValue) : '',
                        changeType: c.changeType || 'CHANGED',
                      }));
                      setBomChanges(suggested);
                    }
                    if (!title) {
                      setTitle(templateSuggestion.suggested_title_prefix || title);
                    }
                    toast.success('Template applied. Review and modify before submitting.');
                    setTemplateSuggestion(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                >
                  Apply Template
                </Button>
              </div>
            )}

            {type === 'BOM' && productId && (
              <div className="space-y-2">
                <Label>BOM</Label>
                <Select value={bomId} onValueChange={handleBOMSelect}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select BOM" /></SelectTrigger>
                  <SelectContent>
                    {filteredBOMs.length === 0 && <SelectItem value="NEW">✨ Initialize New BOM</SelectItem>}
                    {filteredBOMs.length > 0 && <SelectItem value="NEW">✨ Create Alterate BOM</SelectItem>}
                    {filteredBOMs.map(b => <SelectItem key={b.id} value={b.id}>{b.productName} v{b.currentVersion}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="bg-muted border-border" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Version Update</p>
                <p className={cn('text-xs', versionUpdate ? 'text-success' : 'text-warning')}>{versionUpdate ? 'Creates new version (recommended)' : 'Updates same version'}</p>
              </div>
              <Switch checked={versionUpdate} onCheckedChange={setVersionUpdate} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!title || !type || !productId || (type === 'BOM' && !bomId)}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            {type === 'PRODUCT' && selectedProduct && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div><Label className="text-xs text-muted-foreground">Current Sale Price</Label><p className="text-lg font-mono text-muted-foreground">${selectedProduct.salePrice}</p></div>
                  <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="space-y-1"><Label>New Sale Price</Label><Input type="number" value={newSalePrice} onChange={e => setNewSalePrice(e.target.value)} className="bg-muted border-border" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div><Label className="text-xs text-muted-foreground">Current Cost Price</Label><p className="text-lg font-mono text-muted-foreground">${selectedProduct.costPrice}</p></div>
                  <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="space-y-1"><Label>New Cost Price</Label><Input type="number" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="bg-muted border-border" /></div>
                </div>
              </div>
            )}

            {type === 'BOM' && (
              <div className="space-y-3">
                <Label>Components</Label>
                {bomChanges.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={c.name} onChange={e => { const n = [...bomChanges]; n[i].name = e.target.value; setBomChanges(n); }} className="bg-muted border-border flex-1" readOnly={c.changeType !== 'ADDED'} />
                    <Input type="number" value={c.newQty} onChange={e => {
                      const n = [...bomChanges]; n[i].newQty = e.target.value;
                      n[i].changeType = e.target.value !== c.oldQty ? 'CHANGED' : 'UNCHANGED';
                      setBomChanges(n);
                    }} className="bg-muted border-border w-20" />
                    {c.changeType !== 'ADDED' && (
                      <Button variant="ghost" size="sm" onClick={() => { const n = [...bomChanges]; n[i].changeType = 'REMOVED'; n[i].newQty = ''; setBomChanges(n); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {c.changeType === 'ADDED' && (
                      <Button variant="ghost" size="sm" onClick={() => setBomChanges(bomChanges.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setBomChanges([...bomChanges, { name: '', oldQty: '0', newQty: '', changeType: 'ADDED' }])}>
                  <Plus className="h-3 w-3 mr-1" />Add Component
                </Button>

                <Card className="border-blue-500/30 bg-blue-950/15">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Intelligent BOM Change Impact</p>
                      {bomImpactGraph?.rollback_risk && (
                        <Badge variant="outline" className="text-[10px] border-blue-300/30 text-blue-300">
                          Rollback {bomImpactGraph.rollback_risk}
                        </Badge>
                      )}
                    </div>
                    {bomImpactGraph ? (
                      <>
                        <p className="text-xs text-slate-300">Affected components: {(bomImpactGraph.affected_components || []).length}</p>
                        {(bomImpactGraph.likely_bottlenecks || []).slice(0, 2).map((item, i) => (
                          <p key={i} className="text-xs text-slate-400">- {item}</p>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Run Pre-Submit Gate in the next step to generate the impact graph card.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {qualityScore && (
              <div className={cn(
                'rounded-lg border p-3 space-y-3',
                qualityScore.blocking
                  ? 'border-red-500/40 bg-red-950/20'
                  : qualityScore.total_score <= 5
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-green-500/40 bg-green-950/20'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    ECO Quality Score
                  </span>
                  <span className={cn(
                    'text-2xl font-bold',
                    qualityScore.blocking
                      ? 'text-red-400'
                      : qualityScore.total_score <= 5
                        ? 'text-amber-400'
                        : 'text-green-400'
                  )}>
                    {animatedQualityScore}/10
                  </span>
                </div>

                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 flex-1 rounded-sm transition-all',
                        i < animatedQualityScore
                          ? qualityScore.blocking
                            ? 'bg-red-400'
                            : qualityScore.total_score <= 5
                              ? 'bg-amber-400'
                              : 'bg-green-400'
                          : 'bg-slate-700'
                      )}
                      style={{ transitionDelay: `${i * 30}ms` }}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-300">{qualityScore.summary}</p>

                {qualityScore.improvements?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Suggestions:</p>
                    {qualityScore.improvements.map((imp: string, i: number) => (
                      <p key={i} className="text-xs text-slate-400">- {imp}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {!qualityScore.blocking && (
                    <Button size="sm" onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Continue to Review
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setQualityScore(null)} className="border-slate-600">
                    Improve First
                  </Button>
                </div>
              </div>
            )}

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">AI Co-Pilot for ECO Writing</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={runWritingCopilot} disabled={runningWritingCopilot || !type || !productId}>
                    {runningWritingCopilot ? 'Writing...' : 'Rewrite'}
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Draft Description (Step 2)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Draft your technical/audit-ready description here..."
                    className="bg-muted border-border min-h-[90px] text-sm"
                  />
                </div>

                {writingCopilot && (
                  <div className="rounded-md border border-border bg-card p-2 space-y-2">
                    {writingCopilot.concise_summary && <p className="text-xs text-slate-300">Summary: {writingCopilot.concise_summary}</p>}
                    {writingCopilot.technical_detail_version && (
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Technical Detail Version</p>
                        <p className="text-xs text-slate-300">{writingCopilot.technical_detail_version}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => setDescription(writingCopilot.technical_detail_version || description)}>Use Technical</Button>
                      </div>
                    )}
                    {writingCopilot.approver_version && (
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Approver Version</p>
                        <p className="text-xs text-slate-300">{writingCopilot.approver_version}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => setDescription(writingCopilot.approver_version || description)}>Use Approver</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleStep2Next} disabled={scoringDraft}>
                {scoringDraft ? 'Scoring...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Title:</span> {title}</p>
                <div className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{type}</Badge>
                </div>
                <p className="text-sm"><span className="text-muted-foreground">Product:</span> {selectedProduct?.name}</p>
                <p className="text-sm"><span className="text-muted-foreground">Effective:</span> {effectiveDate}</p>
                {type === 'PRODUCT' && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">Sale: ${selectedProduct?.salePrice} → <span className={Number(newSalePrice) > (selectedProduct?.salePrice || 0) ? 'text-success' : 'text-destructive'}>${newSalePrice}</span></p>
                    <p className="text-sm">Cost: ${selectedProduct?.costPrice} → <span className={Number(newCostPrice) > (selectedProduct?.costPrice || 0) ? 'text-success' : 'text-destructive'}>${newCostPrice}</span></p>
                  </div>
                )}
                {type === 'BOM' && bomChanges.filter(c => c.changeType !== 'UNCHANGED').length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bomChanges.filter(c => c.changeType !== 'UNCHANGED').map((c, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs mr-2',
                          c.changeType === 'ADDED' && 'bg-success/15 text-success',
                          c.changeType === 'REMOVED' && 'bg-destructive/15 text-destructive',
                          c.changeType === 'CHANGED' && 'bg-warning/15 text-warning'
                        )}>{c.changeType}</Badge>
                        {c.name} {c.changeType === 'CHANGED' && `(${c.oldQty} → ${c.newQty})`}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ECO Description</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
                  onClick={generateDescription}
                  disabled={generatingDesc || !title || !productId}
                >
                  <Sparkles className={cn("h-3.5 w-3.5", generatingDesc && "animate-pulse")} />
                  {generatingDesc ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Professional description of the changes..."
                className="bg-muted border-border min-h-[100px] text-sm"
              />
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {aiTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  AI Conflict Detection
                  {conflictData?.has_conflicts ? (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px] animate-pulse">Conflicts Found</Badge>
                  ) : conflictData ? (
                    <Badge variant="outline" className="h-4 px-1 text-[10px] bg-success/10 text-success border-success/30">Clear</Badge>
                  ) : null}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 hover:bg-primary/10"
                  onClick={checkConflicts}
                  disabled={checkingConflicts || !productId}
                >
                  <ShieldCheck className={cn("h-3.5 w-3.5", checkingConflicts && "animate-spin")} />
                  {checkingConflicts ? 'Checking...' : 'Check Conflicts'}
                </Button>
              </div>

              {conflictData?.has_conflicts && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
                  {conflictData.conflicts.map((c, i: number) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive">Conflict with "{c.conflicting_eco_title}"</p>
                        <p className="text-muted-foreground">{c.description}</p>
                        <p className="text-primary font-medium mt-1">💡 {c.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">Pre-Submit Approval Gate</p>
                    <p className="text-xs text-muted-foreground">Runs approval outcome predictor and, for BOM ECOs, impact graph analysis.</p>
                  </div>
                  <Button size="sm" onClick={runPreSubmitGate} disabled={runningPreSubmitGate || !title || !productId || !type}>
                    {runningPreSubmitGate ? 'Running...' : 'Run Gate'}
                  </Button>
                </div>

                {approvalPrediction ? (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Approval Probability</span>
                      <Badge variant="outline" className={cn(
                        (approvalPrediction.approval_probability || 0) >= 70 && 'bg-success/10 text-success border-success/30',
                        (approvalPrediction.approval_probability || 0) >= 55 && (approvalPrediction.approval_probability || 0) < 70 && 'bg-warning/10 text-warning border-warning/30',
                        (approvalPrediction.approval_probability || 0) < 55 && 'bg-destructive/10 text-destructive border-destructive/30'
                      )}>
                        {approvalPrediction.approval_probability || 0}% · {approvalPrediction.predicted_outcome}
                      </Badge>
                    </div>
                    {(approvalPrediction.top_risk_factors || []).slice(0, 3).map((risk, i) => (
                      <p key={i} className="text-xs text-muted-foreground">Risk: {risk}</p>
                    ))}
                    {(approvalPrediction.recommended_fixes || []).slice(0, 3).map((fix, i) => (
                      <p key={i} className="text-xs text-primary">Fix: {fix}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Run the gate to unlock submit readiness.</p>
                )}

                {type === 'BOM' && bomImpactGraph && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-blue-300">BOM Impact Analysis Card</p>
                    <p className="text-xs text-slate-300">Affected components: {(bomImpactGraph.affected_components || []).length}</p>
                    {(bomImpactGraph.affected_components || []).slice(0, 3).map((item, i) => (
                      <p key={i} className="text-xs text-slate-400">{item.component} · {item.impact_type} · {item.severity}</p>
                    ))}
                    {(bomImpactGraph.likely_bottlenecks || []).slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-amber-300">Bottleneck: {item}</p>
                    ))}
                    <p className="text-xs text-red-300">Rollback risk: {bomImpactGraph.rollback_risk || 'N/A'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-cyan-500/30 bg-cyan-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-cyan-300">Production Rollout Simulator (MVP)</p>
                  <Button size="sm" variant="outline" onClick={runRolloutSimulation} disabled={runningRolloutSim || !title || !type || !productId}>
                    {runningRolloutSim ? 'Simulating...' : 'Simulate'}
                  </Button>
                </div>
                {rolloutSimulation ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300">Strategy: {rolloutSimulation.rollout_strategy} · Stability: {rolloutSimulation.predicted_stability}</p>
                    <p className="text-xs text-slate-400">ETA full rollout: {rolloutSimulation.estimated_days_to_full_rollout} day(s)</p>
                    {(rolloutSimulation.phases || []).slice(0, 3).map((phase, idx) => (
                      <p key={idx} className="text-xs text-slate-300">{phase.phase}: {phase.timeline} · {phase.objective}</p>
                    ))}
                    {(rolloutSimulation.likely_blockers || []).slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-xs text-amber-300">Blocker: {item}</p>
                    ))}
                    {rolloutSimulation.rollback_plan && <p className="text-xs text-red-300">Rollback: {rolloutSimulation.rollback_plan}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Generate phased rollout and rollback risk simulation before final submit.</p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={v => setConfirmed(!!v)} />
              <label htmlFor="confirm" className="text-sm">I confirm these changes are correct</label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={!confirmed || isSubmitting}>{isSubmitting ? 'Saving...' : (editEco ? 'Save Changes' : 'Submit ECO')}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
