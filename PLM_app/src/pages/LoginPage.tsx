import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cog, Layers } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('alice@plmcontrol.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const loggedInUser = useAuthStore.getState().user;
      toast.success('Access Granted 👋');
      navigate(loggedInUser?.role === 'OPERATIONS' ? '/products' : '/dashboard');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || 'Access Denied')
        : 'Access Denied';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 font-sans relative">
      <Card className="z-10 w-full max-w-[460px] bg-card border-border rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6 space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">
            PLM Enterprise
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Sign in to your account
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background border-input text-foreground h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-background border-input text-foreground h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-11 mt-6 transition-colors rounded-lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center flex flex-col justify-center items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
