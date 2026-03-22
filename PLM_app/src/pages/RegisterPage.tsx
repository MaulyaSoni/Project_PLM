import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@/data/mockData';
import axios from 'axios';

export default function RegisterPage() {
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ENGINEERING');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleAdminVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Adminpanel@1234') {
      setIsAdminVerified(true);
      toast.success('Admin verified. Registration unlocked.');
    } else {
      toast.error('Invalid admin password.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || 'Registration failed')
        : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 font-sans">
        <Card className="w-full max-w-sm bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Admin Clearance Required</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Only administrators can provision accounts</p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleAdminVerification} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Master Access Key</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                  className="bg-background border-input text-foreground h-11"
                  placeholder="Enter admin key..."
                />
              </div>
              <Button type="submit" className="w-full h-11 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors rounded-lg">
                Unlock Registration
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 font-sans">
      <Card className="w-full max-w-md bg-card border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground font-medium">Provisioning New System User</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background border-input h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background border-input h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Account Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background border-input h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Role Selection</Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger className="bg-background border-input h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ENGINEERING">Engineering</SelectItem>
                  <SelectItem value="APPROVER">Approver</SelectItem>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-11 font-medium bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-lg" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
