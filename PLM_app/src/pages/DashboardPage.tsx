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
    { label: 'Total Products', icon: Package, key: 'products', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600/10 dark:bg-blue-400/10' },
    { label: 'Active BOMs', icon: Layers, key: 'boms', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/10 dark:bg-emerald-400/10' },
    { label: 'Open ECOs', icon: GitPullRequest, key: 'openEcos', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-600/10 dark:bg-amber-400/10' },
    { label: 'Pending Approvals', icon: Clock, key: 'pending', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-600/10 dark:bg-rose-400/10' },
  ];
  if (user?.role === 'OPERATIONS') {
    statCards = statCards.filter(c => c.key === 'products' || c.key === 'boms');
  }

  return (
    <div className="animate-fade-in text-foreground pb-12">
      {/* Header Hero Section */}
      <div className="relative mb-8 bg-card border border-border p-8 shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sans">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted border border-border text-muted-foreground rounded-full text-xs font-medium uppercase tracking-wider mb-4">
              <Zap className="h-3 w-3 text-primary" /> System Online
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-2">
              Command Center
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Real-time telemetry and management overview.
            </p>
          </div>
          {user?.role === 'ENGINEERING' && (
            <div className="flex gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg h-11 px-6 font-medium text-sm transition-all">
                <Link to="/ecos/create"><GitPullRequest className="mr-2 h-4 w-4" /> Initiate ECO</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Glass KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
        {statCards.map(card => (
          <Card key={card.key} className={`bg-card border-border shadow-sm overflow-hidden group rounded-xl`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-widest mb-2 ${card.color}`}>{card.label}</p>
                  <p className={`text-4xl font-semibold tracking-tight ${card.color}`}>{stats[card.key as keyof typeof stats]}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center border border-border ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asymmetric Core Layout */}
      <div className={`grid grid-cols-1 gap-6 ${isOperations ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>

        {/* Recent ECOs - Takes 2 columns */}
        {!isOperations && <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-sm h-full flex flex-col rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground tracking-tight">Active Telemetry: ECOs</h3>
              </div>
              <Link to="/ecos" className="text-sm font-medium text-primary hover:underline transition-colors">View Trajectory →</Link>
            </div>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-transparent hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium py-4 px-6 text-xs uppercase tracking-widest">Designation</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-widest">Classification</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-widest">Target Schema</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 text-xs uppercase tracking-widest">Status Node</TableHead>
                    <TableHead className="text-muted-foreground font-medium py-4 pr-6 text-right text-xs uppercase tracking-widest">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecos.slice(0, 6).map(eco => (
                    <TableRow key={eco.id} className="border-border transition-colors hover:bg-muted/50 group">
                      <TableCell className="font-medium py-4 px-6 text-foreground text-sm">
                        <Link to={`/ecos/${eco.id}`} className="group-hover:text-primary transition-colors">{eco.title}</Link>
                      </TableCell>
                      <TableCell><TypeBadge type={eco.type} /></TableCell>
                      <TableCell className="text-muted-foreground font-normal text-sm">{eco.productName}</TableCell>
                      <TableCell><StatusBadge status={eco.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm pr-6 text-right font-normal">{eco.createdAt}</TableCell>
                    </TableRow>
                  ))}
                  {ecos.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-normal">No active telemetry found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* Quick Links & Operations - Takes 1 column */}
        <div className="space-y-6 flex flex-col">
          <Card className="bg-card border-border shadow-sm relative overflow-hidden rounded-xl">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg text-foreground tracking-tight">Execution Shortcuts</h3>
            </div>
            <CardContent className="p-6 space-y-3 relative z-10">
              {(roleShortcuts[user?.role ?? ''] ?? roleShortcuts['ADMIN']).map(({ label, to, Icon }) => (
                <Button key={label} asChild className="w-full justify-start h-12 bg-card hover:bg-muted border border-border text-foreground font-medium group rounded-lg transition-colors shadow-sm" variant="outline">
                  <Link to={to}>
                    <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Environment Status Card */}
          <Card className="bg-card border-border shadow-sm flex-1 flex flex-col justify-center items-center p-8 relative overflow-hidden rounded-xl">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-5">
              <ShieldCheckIcon className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-foreground font-semibold text-lg mb-2 tracking-tight">System Nominal</h4>
            <p className="text-sm text-muted-foreground text-center font-normal leading-relaxed">All infrastructure nodes are responding optimally.</p>
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
