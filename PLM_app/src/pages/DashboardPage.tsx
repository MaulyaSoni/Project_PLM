import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Layers, GitPullRequest, Clock, Activity, Zap } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useECOStore } from '@/stores/useECOStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ShortcutDef = { label: string; to: string; Icon: React.ElementType; color: string };

const roleShortcuts: Record<string, ShortcutDef[]> = {
  ENGINEERING: [
    { label: 'Initialize Product Matrix', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Construct BOM', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'Draft Change Order', to: '/ecos/create', Icon: GitPullRequest, color: 'text-warning' },
  ],
  APPROVER: [
    { label: 'Review Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Review BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'Review Change Orders', to: '/ecos', Icon: GitPullRequest, color: 'text-warning' },
  ],
  ADMIN: [
    { label: 'Manage Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Manage BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'View Change Orders', to: '/ecos', Icon: GitPullRequest, color: 'text-warning' },
  ],
  OPERATIONS: [
    { label: 'View Active Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'View Active BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
  ],
};

export default function DashboardPage() {
  const { products, fetchProducts } = useProductStore();
  const { ecos, fetchECOs } = useECOStore();
  const { boms, fetchBOMs } = useBOMStore();
  const { user } = useAuthStore();
  const isOperations = user?.role === 'OPERATIONS';

  useEffect(() => {
    const refresh = () => {
      const requests = [fetchProducts(), fetchBOMs()];
      if (!isOperations) requests.push(fetchECOs());
      void Promise.all(requests);
    };
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const onFocus = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [fetchProducts, fetchECOs, fetchBOMs, isOperations]);

  const stats = {
    products: products.length,
    boms: boms.filter(b => b.status === 'ACTIVE').length,
    openEcos: ecos.filter(e => e.status !== 'DONE').length,
    pending: ecos.filter(e => e.status === 'IN_REVIEW').length,
  };

  let statCards = [
    { label: 'Total Products', icon: Package, color: 'text-primary', glow: 'shadow-[0_0_30px_-5px_rgba(0,242,255,0.4)]', bg: 'bg-primary/10', border: 'border-primary/20', key: 'products' },
    { label: 'Active BOMs', icon: Layers, color: 'text-success', glow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]', bg: 'bg-success/10', border: 'border-success/20', key: 'boms' },
    { label: 'Open ECOs', icon: GitPullRequest, color: 'text-warning', glow: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)]', bg: 'bg-warning/10', border: 'border-warning/20', key: 'openEcos' },
    { label: 'Pending Approvals', icon: Clock, color: 'text-destructive', glow: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)]', bg: 'bg-destructive/10', border: 'border-destructive/20', key: 'pending' },
  ];
  if (user?.role === 'OPERATIONS') {
    statCards = statCards.filter(c => c.key === 'products' || c.key === 'boms');
  }

  return (
    <div className="animate-fade-in text-foreground pb-12">
      {/* Header Hero Section */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-card to-background border border-foreground/5 p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Zap className="h-3 w-3" /> System Online
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-2">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Center</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Real-time telemetry and management logic for your Product Lifecycle infrastructure.
            </p>
          </div>
          {user?.role === 'ENGINEERING' && (
            <div className="flex gap-3">
              <Button asChild className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,242,255,0.5)] border-0 h-11 px-6">
                <Link to="/ecos/create"><GitPullRequest className="mr-2 h-4 w-4" /> Raise ECO</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Glass KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
        {statCards.map(card => (
          <Card key={card.key} className={`bg-card/40 backdrop-blur-xl border ${card.border} card-hover relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
                  <p className="text-4xl font-display font-bold text-foreground tracking-tight">{stats[card.key as keyof typeof stats]}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:${card.glow} ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asymmetric Core Layout */}
      <div className={`grid grid-cols-1 gap-8 ${isOperations ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>

        {/* Recent ECOs - Takes 2 columns */}
        {!isOperations && <div className="lg:col-span-2">
          <Card className="bg-card/40 backdrop-blur-xl border border-foreground/5 shadow-xl h-full flex flex-col">
            <div className="p-6 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.02]">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg text-foreground">Active Telemetry: ECOs</h3>
              </div>
              <Link to="/ecos" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">View Trajectory →</Link>
            </div>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-foreground/5 bg-transparent hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium py-4 px-6 text-xs uppercase tracking-wider">Designation</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-wider">Classification</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-wider">Target Schema</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-wider">Status Node</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 pr-6 text-right text-xs uppercase tracking-wider">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecos.slice(0, 6).map(eco => (
                    <TableRow key={eco.id} className="border-foreground/5 transition-colors hover:bg-foreground/[0.02] group">
                      <TableCell className="font-medium py-4 px-6">
                        <Link to={`/ecos/${eco.id}`} className="text-foreground group-hover:text-primary transition-colors underline-offset-4">{eco.title}</Link>
                      </TableCell>
                      <TableCell><TypeBadge type={eco.type} /></TableCell>
                      <TableCell className="text-muted-foreground">{eco.productName}</TableCell>
                      <TableCell><StatusBadge status={eco.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm pr-6 text-right font-mono">{eco.createdAt}</TableCell>
                    </TableRow>
                  ))}
                  {ecos.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No active telemetry found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* Quick Links & Operations - Takes 1 column */}
        <div className="space-y-6 flex flex-col">
          <Card className="bg-card/40 backdrop-blur-xl border border-foreground/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px]"></div>
            <div className="p-6 border-b border-foreground/5 bg-foreground/[0.02]">
              <h3 className="font-display font-bold text-lg text-foreground">Execution Shortcuts</h3>
            </div>
            <CardContent className="p-6 space-y-3 relative z-10">
              {(roleShortcuts[user?.role ?? ''] ?? roleShortcuts['ADMIN']).map(({ label, to, Icon, color }) => (
                <Button key={label} asChild className="w-full justify-start h-12 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground group" variant="outline">
                  <Link to={to}><Icon className={`h-5 w-5 mr-3 ${color} group-hover:scale-110 transition-transform`} /> {label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Environment Status Card */}
          <Card className="bg-card/40 backdrop-blur-xl border border-foreground/5 shadow-xl flex-1 flex flex-col justify-center items-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"></div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mb-4 shadow-[0_0_30px_0_rgba(0,242,255,0.3)] animate-pulse">
              <ShieldCheckIcon className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-foreground font-display font-bold mb-1">System Nominal</h4>
            <p className="text-sm text-muted-foreground text-center">All infrastructure nodes are responding optimally inside the Forge environment.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
