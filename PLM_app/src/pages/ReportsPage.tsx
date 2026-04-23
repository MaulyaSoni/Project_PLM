import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, BarChart3, Archive, Grid2x2, RefreshCcw, Loader2 } from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { useProductStore } from '@/stores/useProductStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';
import type { ECO, ProductVersion, AuditEntry } from '@/data/mockData';

const actionColors: Record<string, string> = {
  CREATE: 'bg-primary/15 text-primary border-primary/30',
  UPDATE: 'bg-warning/15 text-warning border-warning/30',
  APPROVE: 'bg-success/15 text-success border-success/30',
  REJECT: 'bg-destructive/15 text-destructive border-destructive/30',
  ARCHIVE: 'bg-muted/60 text-muted-foreground border-muted',
};

type ArchivedProduct = {
  id: string;
  name: string;
  totalVersions: number;
  lastVersion: number | null;
  finalSalePrice: number | null;
  finalCostPrice: number | null;
  createdAt: string;
  versions: ProductVersion[];
  archivedVia: { id: string; title: string } | null;
};

type MatrixRow = {
  productId: string;
  productName: string;
  productStatus: string;
  activeVersion: { version: number; salePrice: number; costPrice: number } | null;
  activeBOM: {
    version: number;
    components: Array<{ id: string; componentName: string; quantity: number; unit: string }>;
    operations: Array<{ id: string; name: string; duration: number; workCenter: string }>;
  } | null;
  hasVersion: boolean;
  hasBOM: boolean;
  isComplete: boolean;
  componentCount: number;
  operationCount: number;
};

type AiResultRow = {
  id: string;
  featureType: string;
  output: string;
  latencyMs?: number | null;
  cached?: boolean;
  createdAt: string;
  eco?: { title: string; status: string } | null;
  user?: { name: string; role: string } | null;
};

type AgentAlertItem = {
  id: string;
  title: string;
  productName: string;
  assignedToName: string;
  daysInReview: number;
  createdAt: string;
};

type AgentAlertsPayload = {
  thresholds: { reviewThresholdHours: number };
  stuckCount: number;
  stuckEcos: AgentAlertItem[];
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const [ecoReport, setEcoReport] = useState<ECO[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [bomHistory, setBomHistory] = useState<ECO[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [activeMatrix, setActiveMatrix] = useState<MatrixRow[]>([]);
  const [changesOpen, setChangesOpen] = useState(false);
  const [selectedEco, setSelectedEco] = useState<ECO | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedArchivedProduct, setSelectedArchivedProduct] = useState<ArchivedProduct | null>(null);
  const [expandedMatrix, setExpandedMatrix] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AiResultRow[]>([]);
  const [activeTab, setActiveTab] = useState('matrix');
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [lastAiRefreshAt, setLastAiRefreshAt] = useState<Date | null>(null);
  const [agentAlerts, setAgentAlerts] = useState<AgentAlertsPayload | null>(null);
  const [runningAgent, setRunningAgent] = useState(false);

  const loadAiResults = useCallback(async (silent = false) => {
    if (user?.role !== 'ADMIN') return;
    if (!silent) setRefreshingAi(true);
    try {
      const res = await reportsService.getAiResults();
      const rows = (res?.data || []) as AiResultRow[];
      setAiResults(
        [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      setLastAiRefreshAt(new Date());
    } catch {
      if (!silent) setAiResults([]);
    } finally {
      if (!silent) setRefreshingAi(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchProducts();
    reportsService.getECOReport().then(setEcoReport);
    reportsService.getAuditLog().then(setAuditLog);
    reportsService.getArchivedProducts().then(setArchivedProducts);
    reportsService.getActiveMatrix().then(setActiveMatrix);
    if (user?.role === 'ADMIN') {
      loadAiResults();
      reportsService.getAgentAlerts().then(setAgentAlerts).catch(() => setAgentAlerts(null));
    }
  }, [fetchProducts, user?.role, loadAiResults]);

  const runLifecycleAgent = async () => {
    setRunningAgent(true);
    try {
      await reportsService.runAgentNow();
      await Promise.all([loadAiResults(), reportsService.getAgentAlerts().then(setAgentAlerts)]);
    } finally {
      setRunningAgent(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN' || activeTab !== 'ai-observatory') return;
    const interval = window.setInterval(() => {
      loadAiResults(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [user?.role, activeTab, loadAiResults]);

  useEffect(() => {
    if (selectedProduct) {
      reportsService.getVersionHistory(selectedProduct).then(setVersions);
      reportsService.getBOMHistory(selectedProduct).then(setBomHistory);
    } else {
      setVersions([]);
      setBomHistory([]);
    }
  }, [selectedProduct]);

  const openChangesModal = (eco: ECO) => {
    setSelectedEco(eco);
    setChangesOpen(true);
  };

  const matrixSummary = useMemo(() => {
    const total = activeMatrix.length;
    const withBom = activeMatrix.filter((r) => r.hasBOM).length;
    const withoutBom = activeMatrix.filter((r) => !r.hasBOM).length;
    const complete = activeMatrix.filter((r) => r.isComplete).length;
    return { total, withBom, withoutBom, complete };
  }, [activeMatrix]);

  const getMatrixStatus = (row: MatrixRow) => {
    if (row.hasVersion && row.hasBOM) return { label: 'Complete', cls: 'bg-success/15 text-success border-success/30' };
    if (!row.hasVersion && !row.hasBOM) return { label: 'Incomplete', cls: 'bg-destructive/15 text-destructive border-destructive/30' };
    if (!row.hasVersion) return { label: 'Missing Version', cls: 'bg-warning/15 text-warning border-warning/30' };
    return { label: 'Missing BOM', cls: 'bg-warning/15 text-warning border-warning/30' };
  };

  const splitBomChanges = (eco: ECO) => {
    const changes = eco.bomComponentChanges || [];
    const componentChanges = changes.filter((c) => !String(c.componentName || '').startsWith('OP_'));
    const operationChanges = changes.filter((c) => String(c.componentName || '').startsWith('OP_'));
    return { componentChanges, operationChanges };
  };

  const FEATURE_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
    QUALITY_SCORE: { label: 'Quality Score', bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-500/30' },
    COMPLEXITY_ESTIMATE: { label: 'Complexity', bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-500/30' },
    TEMPLATE_SUGGESTION: { label: 'Template', bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-500/30' },
    PRECEDENT_MATCH: { label: 'Precedent', bg: 'bg-green-950/40', text: 'text-green-400', border: 'border-green-500/30' },
    IMPACT_ANALYSIS: { label: 'Impact', bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-500/30' },
    CONFLICT_DETECTION: { label: 'Conflict', bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-500/30' },
    DESCRIPTION: { label: 'Description', bg: 'bg-slate-800/40', text: 'text-slate-400', border: 'border-slate-600/30' },
  };

  const getOutputSummary = (result: AiResultRow) => {
    try {
      const out = JSON.parse(result.output || '{}') as Record<string, unknown>;
      switch (result.featureType) {
        case 'QUALITY_SCORE':
          return `Score: ${out.total_score}/10 — ${out.grade}`;
        case 'COMPLEXITY_ESTIMATE':
          return `${out.complexity_level} — ~${out.estimated_approval_days_range || out.estimated_approval_days} days`;
        case 'TEMPLATE_SUGGESTION':
          return out.has_suggestion
            ? `${out.suggested_changes?.length || 0} changes suggested (${out.confidence})`
            : 'No pattern found';
        case 'PRECEDENT_MATCH':
          return out.has_precedents
            ? `${out.precedent_count} match(es) — top: ${out.precedents?.[0]?.similarity_score}%`
            : 'No precedents';
        case 'IMPACT_ANALYSIS':
          return `${out.risk_level} risk · ${out.urgency_score}/10 urgency`;
        case 'CONFLICT_DETECTION':
          return out.has_conflicts ? `${out.conflict_count} conflict(s) detected` : 'Clean — no conflicts';
        default:
          return 'Result stored';
      }
    } catch {
      return '—';
    }
  };

  const totalCalls = aiResults.length;
  const avgLatency = aiResults.length
    ? Math.round(aiResults.reduce((s, r) => s + (r.latencyMs || 0), 0) / aiResults.length)
    : 0;
  const cacheHits = aiResults.filter((r) => r.cached).length;
  const cacheHitRate = aiResults.length ? Math.round((cacheHits / aiResults.length) * 100) : 0;
  const featureCounts = aiResults.reduce((acc: Record<string, number>, r) => {
    acc[r.featureType] = (acc[r.featureType] || 0) + 1;
    return acc;
  }, {});
  const topFeatureKey = Object.entries(featureCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const topFeatureLabel = topFeatureKey ? (FEATURE_META[topFeatureKey]?.label || topFeatureKey) : 'N/A';

  return (
    <div className="animate-fade-in text-foreground pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
            <BarChart3 className="h-3 w-3" /> System Intelligence
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Reports & Matrix</h1>
          <p className="text-foreground/60 tracking-wide font-medium">Deep-dive matrix analysis, history tracking, and system telemetry.</p>
        </div>
        <Button variant="outline" className="border-primary/20 hover:bg-primary/5 hover:text-primary rounded-xl h-11 px-6 transition-all duration-300">
          <Download className="mr-2 h-4 w-4" /> Export Telemetry
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          'w-full h-auto bg-muted/50 border border-border shadow-sm rounded-xl p-2 mb-8 font-medium',
          user?.role === 'ADMIN' ? 'grid grid-cols-2 md:grid-cols-7' : 'grid grid-cols-2 md:grid-cols-6'
        )}>
          <TabsTrigger value="matrix" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">Product Matrix</TabsTrigger>
          <TabsTrigger value="eco" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">ECO Analytics</TabsTrigger>
          <TabsTrigger value="product" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">Versions</TabsTrigger>
          <TabsTrigger value="bom" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">BOM History</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">Audit Log</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">Vault</TabsTrigger>
          {user?.role === 'ADMIN' && (
            <TabsTrigger value="ai-observatory" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-3 transition-all">AI Observatory</TabsTrigger>
          )}
        </TabsList>

        {user?.role === 'ADMIN' && (
          <TabsContent value="ai-observatory" className="animate-slide-up space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live refresh every 15s
                {lastAiRefreshAt && (
                  <span>• Last sync {lastAiRefreshAt.toLocaleTimeString()}</span>
                )}
              </div>
              <Button size="sm" variant="outline" className="h-8" onClick={() => loadAiResults()} disabled={refreshingAi}>
                {refreshingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                <span className="ml-2 text-xs">Refresh</span>
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifecycle Agent</p>
                    <p className="text-sm font-medium">
                      {agentAlerts?.stuckCount || 0} ECO(s) beyond {agentAlerts?.thresholds?.reviewThresholdHours || 24}h in review
                    </p>
                  </div>
                  <Button size="sm" onClick={runLifecycleAgent} disabled={runningAgent}>
                    {runningAgent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                    <span className="ml-2">Run Agent Now</span>
                  </Button>
                </div>

                {(agentAlerts?.stuckEcos || []).length > 0 ? (
                  <div className="space-y-2">
                    {agentAlerts?.stuckEcos.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productName} • Assigned to {item.assignedToName} • {item.daysInReview} day(s) in review
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No current lifecycle bottlenecks detected.</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total AI Calls', value: totalCalls, color: 'text-blue-400' },
                  {
                    label: 'Avg Latency',
                    value: `${avgLatency}ms`,
                    color: avgLatency < 1000 ? 'text-green-400' : avgLatency < 3000 ? 'text-amber-400' : 'text-red-400',
                  },
                  { label: 'Cache Hit Rate', value: `${cacheHitRate}%`, color: 'text-purple-400' },
                  { label: 'Top Feature', value: topFeatureLabel, color: 'text-amber-400' },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                <div className="bg-slate-900/80 border-b border-slate-700/50 px-3 py-2.5 flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Activity Feed</p>
                  <p className="text-xs text-slate-600">Last {aiResults.length} calls</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      {['Feature', 'ECO', 'User', 'Output', 'Latency', 'Time'].map((h) => (
                        <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {aiResults.map((result) => {
                      const meta = FEATURE_META[result.featureType] || FEATURE_META.DESCRIPTION;
                      const latencyColor = !result.latencyMs
                        ? 'text-slate-600'
                        : result.latencyMs < 1000
                          ? 'text-green-400'
                          : result.latencyMs < 3000
                            ? 'text-amber-400'
                            : 'text-red-400';

                      return (
                        <tr key={result.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 max-w-[8rem]">
                            <p className="text-xs text-slate-300 truncate">{result.eco?.title || '—'}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs text-slate-400">{result.user?.name || '—'}</p>
                          </td>
                          <td className="px-3 py-2.5 max-w-[12rem]">
                            <p className="text-xs text-slate-300 truncate">{getOutputSummary(result)}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs font-mono ${latencyColor}`}>
                              {result.cached ? 'cached' : result.latencyMs ? `${result.latencyMs}ms` : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs text-slate-500">{new Date(result.createdAt).toLocaleTimeString()}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {aiResults.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-500">No AI activity yet</p>
                    <p className="text-xs text-slate-600 mt-1">Activity appears here as engineers use AI features</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="eco" className="animate-slide-up">
          <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-xl text-foreground">Engineering Change Orders Report</h3>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden rounded-lg bg-background border-border"><Download className="h-4 w-4 mr-2" />Export PDF</Button>
              </div>
              {ecoReport.length === 0 ? <EmptyState message="No ECO data" icon={BarChart3} /> : (
                <div className="overflow-x-auto">
                  <Table className="print:w-full print:border-collapse">
                    <TableHeader className="bg-foreground/5 h-14">
                      <TableRow className="border-border hover:bg-transparent print:border-b-2 print:border-black">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-4">Title</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Changes</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-6">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ecoReport.map(eco => (
                        <TableRow key={eco.id} className="border-border hover:bg-muted/10 transition-all group">
                          <TableCell className="font-medium text-foreground px-6 py-5 text-base">{eco.title}</TableCell>
                          <TableCell><TypeBadge type={eco.type} /></TableCell>
                          <TableCell className="text-foreground/80 font-medium">{eco.productName}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="rounded-xl border-border bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all" onClick={() => openChangesModal(eco)}>
                              View {eco.type === 'PRODUCT' ? (eco.productChanges?.length || 0) : (eco.bomComponentChanges?.length || 0)} change{(eco.type === 'PRODUCT' ? (eco.productChanges?.length || 0) : (eco.bomComponentChanges?.length || 0)) !== 1 ? 's' : ''}
                            </Button>
                          </TableCell>
                          <TableCell><StatusBadge status={eco.stage} /></TableCell>
                          <TableCell><StatusBadge status={eco.status} /></TableCell>
                          <TableCell className="text-foreground/60 text-sm font-mono pr-6">{eco.createdAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product" className="animate-slide-up">
          <div className="mb-6 flex">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-80 h-14 bg-background border-border rounded-xl shadow-sm text-base font-medium">
                <SelectValue placeholder="Select matrix product..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border rounded-xl">
                {products.map(p => <SelectItem key={p.id} value={p.id} className="rounded-lg my-1">{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {versions.length === 0 ? <div className="py-20"><EmptyState message="Select a product to view version matrix" /></div> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30 h-14">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6 py-4">Version Node</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Market Value</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cost Value</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Origin</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-6">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...versions].sort((a, b) => a.version - b.version).map((v, i, arr) => {
                        const prev = i > 0 ? arr[i - 1] : null;
                        const salePriceChanged = prev && v.salePrice !== prev.salePrice;
                        const salePriceIncreased = prev && v.salePrice > prev.salePrice;
                        const costPriceChanged = prev && v.costPrice !== prev.costPrice;
                        const costPriceIncreased = prev && v.costPrice > prev.costPrice;

                        return (
                          <TableRow key={v.version} className={`border-border hover:bg-muted/10 transition-all group ${v.status === 'ACTIVE' ? 'bg-primary/5' : ''}`}>
                            <TableCell className="font-mono text-primary font-medium px-6 py-5">v{v.version}.0</TableCell>
                            <TableCell className={`font-medium ${salePriceChanged ? (salePriceIncreased ? 'text-success drop-shadow-md' : 'text-destructive drop-shadow-md') : 'text-foreground'}`}>
                              ${v.salePrice}
                            </TableCell>
                            <TableCell className={`font-medium ${costPriceChanged ? (costPriceIncreased ? 'text-destructive drop-shadow-md' : 'text-success drop-shadow-md') : 'text-foreground'}`}>
                              ${v.costPrice}
                            </TableCell>
                            <TableCell><StatusBadge status={v.status} /></TableCell>
                            <TableCell className="text-foreground/70 font-medium">{v.createdVia || '—'}</TableCell>
                            <TableCell className="text-foreground/50 text-sm font-mono pr-6">{v.createdAt}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom" className="animate-slide-up">
          <div className="mb-6 flex">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-80 h-14 bg-background border-border rounded-xl shadow-sm text-base font-medium">
                <SelectValue placeholder="Select matrix product..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border rounded-xl">
                {products.map(p => <SelectItem key={p.id} value={p.id} className="rounded-lg my-1">{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {!selectedProduct ? <div className="py-20"><EmptyState message="Select a product above to view its BOM history matrix" /></div> : bomHistory.length === 0 ? <div className="py-20"><EmptyState message="No BOM changes found for this product" /></div> : (
                <Accordion type="single" collapsible className="p-6 space-y-4">
                  {bomHistory.map((eco) => {
                    const { componentChanges, operationChanges } = splitBomChanges(eco);
                    return (
                      <AccordionItem key={eco.id} value={eco.id} className="border border-border rounded-xl bg-card overflow-hidden transition-all hover:border-primary/20">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="text-left flex-1">
                            <div className="font-semibold text-lg text-foreground mb-1">Vault ECO: <span className="text-primary">{eco.title}</span></div>
                            <div className="text-xs text-muted-foreground font-mono tracking-wide uppercase">Committed on {eco.createdAt} | By {eco.createdByName}</div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-6 pt-4 border-t border-border">
                            {componentChanges.length > 0 && (
                            <div className="rounded-xl border border-border overflow-hidden bg-muted/10">
                              <Table>
                                <TableHeader className="bg-muted/30 h-12"><TableRow className="border-border hover:bg-transparent"><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase pl-6">Component</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Old Qty</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">New Qty</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Mutation</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {componentChanges.map((c, i) => (
                                    <TableRow key={`${c.componentName}-${i}`} className="border-border">
                                      <TableCell className="font-medium pl-6">{c.componentName}</TableCell>
                                      <TableCell className="font-mono text-foreground/50">{c.oldQty ?? '—'}</TableCell>
                                      <TableCell className="font-mono font-medium text-foreground">{c.newQty ?? '—'}</TableCell>
                                      <TableCell><Badge variant="outline" className={c.changeType === 'ADDED' ? 'bg-success/15 text-success border-success/30' : c.changeType === 'REMOVED' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30'}>{c.changeType}</Badge></TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            )}
                            {operationChanges.length > 0 && (
                              <div className="rounded-2xl border border-border overflow-hidden bg-background/30">
                                <Table>
                                  <TableHeader className="bg-muted/10 h-12"><TableRow className="border-border hover:bg-transparent"><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase pl-6">Operation / WorkCenter</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Old</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">New</TableHead><TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">Mutation</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {operationChanges.map((op, i) => (
                                      <TableRow key={`${op.componentName}-${i}`} className="border-border">
                                        <TableCell className="font-medium text-warning pl-6">{String(op.componentName).replace(/^OP_/, '')}</TableCell>
                                        <TableCell className="font-mono text-foreground/50">{op.oldQty ?? '—'}</TableCell>
                                        <TableCell className="font-mono font-medium text-foreground">{op.newQty ?? '—'}</TableCell>
                                        <TableCell><Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{op.changeType}</Badge></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            <div className="text-sm">
                              <Link className="inline-flex items-center text-primary font-semibold hover:opacity-80 transition-all bg-primary/10 px-4 py-2 rounded-xl" to={`/ecos/${eco.id}`}>View ECO Trace</Link>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {auditLog.length === 0 ? <EmptyState message="No audit entries" /> : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Action</TableHead><TableHead>Type</TableHead><TableHead>User</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {auditLog.map(entry => (
                      <TableRow key={entry.id} className="border-border">
                        <TableCell className="font-medium">{entry.action}</TableCell>
                        <TableCell><Badge variant="outline" className={actionColors[entry.actionType]}>{entry.actionType}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{entry.userName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={entry.oldValue}>
                          {(() => {
                            if (!entry.oldValue) return '—';
                            try {
                              const parsed = JSON.parse(entry.oldValue);
                              if (typeof parsed === 'object' && parsed !== null) {
                                return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
                              }
                            } catch { /* empty */ }
                            return entry.oldValue;
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={entry.newValue}>
                          {(() => {
                            if (!entry.newValue) return '—';
                            try {
                              const parsed = JSON.parse(entry.newValue);
                              if (typeof parsed === 'object' && parsed !== null) {
                                return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
                              }
                            } catch { /* empty */ }
                            return entry.newValue;
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {archivedProducts.length === 0 ? (
                <EmptyState message="No archived products found. Archived products appear here for audit and traceability purposes" icon={Archive} />
              ) : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Product Name</TableHead><TableHead>Total Versions</TableHead><TableHead>Last Version</TableHead><TableHead>Final Sale Price</TableHead><TableHead>Final Cost Price</TableHead><TableHead>Archived Date</TableHead><TableHead>Archived Via</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {archivedProducts.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.totalVersions}</TableCell>
                        <TableCell>{p.lastVersion ? `v${p.lastVersion}` : '—'}</TableCell>
                        <TableCell>{p.finalSalePrice != null ? `$${p.finalSalePrice}` : '—'}</TableCell>
                        <TableCell>{p.finalCostPrice != null ? `$${p.finalCostPrice}` : '—'}</TableCell>
                        <TableCell>{p.createdAt}</TableCell>
                        <TableCell>{p.archivedVia ? <Link className="text-primary hover:underline" to={`/ecos/${p.archivedVia.id}`}>{p.archivedVia.title}</Link> : '—'}</TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => { setSelectedArchivedProduct(p); setHistoryOpen(true); }}>View History</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="animate-slide-up">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border shadow-sm rounded-[2rem] overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Grid2x2 className="w-6 h-6" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground/60 tracking-wider">TOTAL ACTIVE</div>
                      <div className="text-3xl  font-bold text-foreground drop-shadow-md">{matrixSummary.total}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm rounded-[2rem] overflow-hidden group hover:border-success/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-2xl text-success"><Grid2x2 className="w-6 h-6" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground/60 tracking-wider">WITH BOM</div>
                      <div className="text-3xl  font-bold text-success drop-shadow-md">{matrixSummary.withBom}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm rounded-[2rem] overflow-hidden group hover:border-warning/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-2xl text-warning"><Grid2x2 className="w-6 h-6" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground/60 tracking-wider">WITHOUT BOM</div>
                      <div className="text-3xl  font-bold text-warning drop-shadow-md">{matrixSummary.withoutBom}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border shadow-sm rounded-[2rem] overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-2xl text-primary"><Grid2x2 className="w-6 h-6" /></div>
                    <div>
                      <div className="text-sm font-medium text-foreground/60 tracking-wider">COMPLETE MATRIX</div>
                      <div className="text-3xl  font-bold text-primary drop-shadow-md">{matrixSummary.complete}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border shadow-sm rounded-[2.5rem] overflow-hidden mt-6">
              <div className="p-6 border-b border-border bg-muted/10">
                <h3 className=" font-medium text-xl text-foreground">Global Product State Matrix</h3>
                <p className="text-foreground/60 text-sm mt-1">Cross-referencing active versions, component dependencies, and operational integrity.</p>
              </div>
              <CardContent className="p-0">
                {activeMatrix.length === 0 ? <div className="py-20"><EmptyState message="All products are fully configured in the matrix" icon={Grid2x2} /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-foreground/5 h-14">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground px-6">Product Core</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Revision</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sale Value</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cost Value</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">BOM Reference</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nodes</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Operations</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Health</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-6 text-right">Expansion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeMatrix.map((row) => {
                          const status = getMatrixStatus(row);
                          const isExpanded = expandedMatrix === row.productId;
                          return (
                            <Fragment key={row.productId}>
                              <TableRow className={`border-border cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-primary/5' : 'hover:bg-muted/10'}`} onClick={() => setExpandedMatrix(isExpanded ? null : row.productId)}>
                                <TableCell className=" font-medium text-foreground px-6 py-5 text-base">{row.productName} <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/20">ACTIVE</Badge></TableCell>
                                <TableCell className="text-foreground/80 font-mono">{row.activeVersion ? `v${row.activeVersion.version}` : 'Undev'}</TableCell>
                                <TableCell className="text-success font-medium">{row.activeVersion ? `$${row.activeVersion.salePrice}` : '—'}</TableCell>
                                <TableCell className="text-warning font-medium">{row.activeVersion ? `$${row.activeVersion.costPrice}` : '—'}</TableCell>
                                <TableCell className="text-primary font-mono">{row.activeBOM ? `BOM v${row.activeBOM.version}` : 'Unmapped'}</TableCell>
                                <TableCell className="text-foreground/80">{row.componentCount || '—'}</TableCell>
                                <TableCell className="text-foreground/80">{row.operationCount || '—'}</TableCell>
                                <TableCell><Badge variant="outline" className={`${status.cls} border`}>{status.label}</Badge></TableCell>
                              <TableCell className="pr-6 text-right">{!row.isComplete ? <Button size="sm" variant="outline" className="border-border hover:bg-muted/30 rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); navigate('/ecos', { state: { openCreate: true, productId: row.productId } }); }}>Raise ECO</Button> : <span className="text-muted-foreground font-mono">—</span>}</TableCell>
                            </TableRow>
                            {expandedMatrix === row.productId && (
                              <TableRow className="border-border bg-foreground/[0.02]">
                                <TableCell colSpan={9} className="p-6">
                                  <div className="text-sm space-y-4">
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border">
                                      <div className=" text-primary uppercase text-xs tracking-widest font-semibold mb-3">Matrix Components</div>
                                      <div className="flex flex-wrap gap-2">
                                        {row.activeBOM?.components?.length ? row.activeBOM.components.map((c) => <Badge key={c.id} variant="outline" className="bg-background/60 border-border font-mono py-1 px-3 text-sm">{c.componentName} <span className="text-primary ml-2">{c.quantity}{c.unit}</span></Badge>) : <span className="text-muted-foreground italic font-mono px-2 py-1 bg-muted/10 rounded-md">—</span>}
                                      </div>
                                    </div>
                                    <div className="bg-muted/10 p-4 rounded-xl border border-border">
                                      <div className=" text-success uppercase text-xs tracking-widest font-semibold mb-3">Node Operations</div>
                                      <div className="flex flex-wrap gap-2">
                                        {row.activeBOM?.operations?.length ? row.activeBOM.operations.map((o) => <Badge key={o.id} variant="outline" className="bg-background/60 border-border font-mono py-1 px-3 text-sm">{o.name} <span className="text-success ml-2">{o.duration}m</span> <span className="text-muted-foreground ml-2">@{o.workCenter}</span></Badge>) : <span className="text-muted-foreground italic font-mono px-2 py-1 bg-muted/10 rounded-md">—</span>}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent className="max-w-4xl bg-card border-border shadow-lg rounded-[2.5rem]">
          <DialogHeader className="p-2">
            <DialogTitle className=" text-2xl text-foreground mb-1">{selectedEco ? `Matrix Changes in ${selectedEco.title}` : 'ECO Changes'}</DialogTitle>
            <DialogDescription className="text-foreground/60 text-base">
              {selectedEco ? `${selectedEco.type} Blueprint • ${selectedEco.status} • ${selectedEco.productName}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="p-2">
          {selectedEco && (
            <div className="space-y-4">
              {selectedEco.type === 'PRODUCT' && (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Field</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead><TableHead>Direction</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(selectedEco.productChanges || []).map((c, i) => (
                      <TableRow key={`${c.field}-${i}`} className="border-border">
                        <TableCell>{c.field}</TableCell>
                        <TableCell className="text-destructive">${c.oldValue}</TableCell>
                        <TableCell className="text-success">${c.newValue}</TableCell>
                        <TableCell>{c.newValue > c.oldValue ? 'Increase' : c.newValue < c.oldValue ? 'Decrease' : 'No change'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {selectedEco.type === 'BOM' && (
                <>
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Old Qty</TableHead><TableHead>New Qty</TableHead><TableHead>Change Type</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {splitBomChanges(selectedEco).componentChanges.map((c, i) => (
                        <TableRow key={`${c.componentName}-${i}`} className={`border-border ${c.changeType === 'ADDED' ? 'bg-success/5' : c.changeType === 'REMOVED' ? 'bg-destructive/5' : ''}`}>
                          <TableCell>{c.componentName}</TableCell>
                          <TableCell>{c.oldQty ?? '—'}</TableCell>
                          <TableCell>{c.newQty ?? '—'}</TableCell>
                          <TableCell><Badge variant="outline" className={c.changeType === 'ADDED' ? 'bg-success/15 text-success border-success/30' : c.changeType === 'REMOVED' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30'}>{c.changeType}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Operation</TableHead><TableHead>Old</TableHead><TableHead>New</TableHead><TableHead>Change Type</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {splitBomChanges(selectedEco).operationChanges.map((c, i) => (
                        <TableRow key={`${c.componentName}-${i}`} className="border-border">
                          <TableCell>{String(c.componentName).replace(/^OP_/, '')}</TableCell>
                          <TableCell>{c.oldQty ?? '—'}</TableCell>
                          <TableCell>{c.newQty ?? '—'}</TableCell>
                          <TableCell><Badge variant="outline">{c.changeType}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              <div>
                <Link to={`/ecos/${selectedEco.id}`} className="text-primary hover:underline">View Full ECO</Link>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{selectedArchivedProduct?.name} Version History</DialogTitle>
            <DialogDescription>{selectedArchivedProduct ? `${selectedArchivedProduct.totalVersions} versions in history` : ''}</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Version</TableHead><TableHead>Sale Price</TableHead><TableHead>Cost Price</TableHead><TableHead>Status</TableHead><TableHead>Created Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(selectedArchivedProduct?.versions || []).map((v) => (
                <TableRow key={v.version} className="border-border">
                  <TableCell>v{v.version}</TableCell>
                  <TableCell>${v.salePrice}</TableCell>
                  <TableCell>${v.costPrice}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell>{v.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
