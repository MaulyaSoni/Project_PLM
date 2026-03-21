import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cog } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-[#050514] font-sans relative overflow-hidden">
      {/* Soft Cyber Glowing Orbs Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF00FF]/20 rounded-full mix-blend-screen filter blur-[140px] opacity-60" />

      <Card className="z-10 w-full max-w-[460px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">
        {/* Soft edge glowing cyan line inside */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="text-center pt-12 pb-6 space-y-3">
          <CardTitle className="text-4xl font-extrabold text-white tracking-tight flex flex-col items-center justify-center gap-2 drop-shadow-md">
            PLM_CONTROL
            <div className="w-12 h-1.5 bg-gradient-to-r from-primary to-[#FF00FF] rounded-full mt-2 opacity-80" />
          </CardTitle>
          <p className="text-[15px] text-white/60 font-medium">
            Authentication Required
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5 relative group">
              <Label className="text-white/70 font-semibold px-1">Email Space</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@plmcontrol.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-white/20 rounded-[16px] px-4 py-6 shadow-inner transition-all hover:bg-black/30 text-base"
              />
            </div>
            <div className="space-y-1.5 relative group">
              <Label className="text-white/70 font-semibold px-1">Passkey</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-white/20 rounded-[16px] px-4 py-6 shadow-inner transition-all hover:bg-black/30 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#FF00FF] text-white border-0 hover:opacity-90 rounded-[16px] transition-all duration-300 shadow-[0_10px_20px_rgba(0,212,255,0.3)] hover:shadow-[0_15px_30px_rgba(255,0,255,0.4)] font-bold text-lg tracking-wide mt-8 h-14"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Enter System'}
            </Button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-white/40 font-medium">
              Secure Connection Established
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
