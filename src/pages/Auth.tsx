import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';
import { getUniConfig, UNI_ORDER } from '@/config/universities';

type Step = 'grid' | 'signup' | 'login';

interface University {
  id: string;
  name: string;
  short_name: string | null;
}

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('grid');
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (session) navigate('/', { replace: true }); }, [session]);

  useEffect(() => {
    supabase.from('universities').select('id, name, short_name').then(({ data }) => {
      if (!data) return;
      const sorted = [...data].sort((a: any, b: any) => {
        const ai = UNI_ORDER.indexOf(a.short_name as any);
        const bi = UNI_ORDER.indexOf(b.short_name as any);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      setUniversities(sorted);
    });
  }, []);

  const handleSelectUni = (uni: University) => {
    setSelectedUni(uni);
    setTimeout(() => setStep('signup'), 300);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSignup = async () => {
    if (!firstName.trim() || !username.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields'); return;
    }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!selectedUni) { toast.error('Please select your university'); return; }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: {
          data: { username: username.trim(), full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) { toast.error(error.message); return; }

      const userId = data.user?.id;
      if (userId) {
        let avatarUrl: string | undefined;
        if (avatarFile) {
          const ext = avatarFile.name.split('.').pop();
          const path = `${userId}/avatar.${ext}`;
          await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
          const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = pub.publicUrl;
        }
        await supabase.from('profiles').update({
          university_id: selectedUni.id,
          full_name: fullName,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        }).eq('id', userId);
      }
      toast.success('Account created! Check your email to verify.');
    } catch (e: any) {
      toast.error(e?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) toast.error(error.message);
    } catch (e: any) {
      toast.error(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">

        {step === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
            className="flex flex-col min-h-screen"
          >
            <div className="px-6 pt-16 pb-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-[10px] font-bold tracking-[0.18em] text-primary/70 uppercase mb-3">Welcome to</p>
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-2">Your campus. Connected.</p>
              </motion.div>
            </div>

            <div className="px-5 flex-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                Choose your university
              </p>

              <div className="grid grid-cols-2 gap-3">
                {universities.map((uni, i) => {
                  const cfg = getUniConfig(uni.short_name);
                  return (
                    <motion.button
                      key={uni.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectUni(uni)}
                      className="relative bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 group hover:border-primary/30 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden">
                        <img src={cfg.logo} alt={uni.short_name || uni.name}
                          className="w-12 h-12 object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {uni.short_name || uni.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Windhoek</p>
                      </div>
                      <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/20 transition-all" />
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={() => setStep('login')}
                className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
              >
                Sign in to existing account
              </button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground py-6">
              By continuing you agree to our Terms &amp; Privacy Policy
            </p>
          </motion.div>
        )}

        {step === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex flex-col min-h-screen px-5"
          >
            <div className="pt-14 pb-6 flex items-center gap-4">
              <button onClick={() => setStep('grid')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={22} />
              </button>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {selectedUni?.short_name || selectedUni?.name}
                </p>
                <h2 className="text-xl font-black text-foreground mt-0.5">Create your account</h2>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <button onClick={() => fileRef.current?.click()} className="relative group">
                <div className="w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border group-hover:border-primary/40 flex items-center justify-center overflow-hidden transition-all">
                  {avatarPreview
                    ? <img src={avatarPreview} className="w-full h-full object-cover" />
                    : <Camera size={24} className="text-muted-foreground" />
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Camera size={13} className="text-primary-foreground" />
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">First name *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40"
                    placeholder="Ada" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Last name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40"
                    placeholder="Lovelace" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Username *</label>
                <div className="flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                  <span className="text-muted-foreground text-sm mr-1">@</span>
                  <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    placeholder="ada_lovelace" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Student email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40"
                  placeholder="s12345@student.nust.na" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Password *</label>
                <div className="flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    type={showPass ? 'text' : 'password'}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    placeholder="Min. 6 characters" />
                  <button onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-foreground ml-2">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="py-6">
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Already have an account?{' '}
                <button onClick={() => setStep('login')} className="text-primary font-semibold">Sign in</button>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen px-5"
          >
            <div className="pt-14 pb-8 flex items-center gap-4">
              <button onClick={() => setStep('grid')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={22} />
              </button>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Welcome back</p>
                <h2 className="text-xl font-black text-foreground mt-0.5">Sign in</h2>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" autoFocus
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
                <div className="flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    type={showPass ? 'text' : 'password'}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    placeholder="Your password" />
                  <button onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="text-xs text-primary font-semibold">Forgot password?</button>
            </div>

            <div className="py-6">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Don't have an account?{' '}
                <button onClick={() => setStep('grid')} className="text-primary font-semibold">Sign up</button>
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Camera, Loader2, GraduationCap } from "lucide-react";

import { getUniConfig, UNI_ORDER } from "@/config/universities";

type AuthStep = "choose-university" | "signup" | "login";

interface University {
  id: string;
  name: string;
  short_name: string | null;
}

function getLogoForUni(uni: University): string {
  const cfg = getUniConfig(uni.short_name);
  return cfg.logo;
}

function getColorsForUni(uni: University) {
  const cfg = getUniConfig(uni.short_name);
  return cfg.colors;
}

// UNI_ORDER imported from config

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("choose-university");
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [tappedId, setTappedId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").then(({ data }) => {
      if (data) {
        // Sort to match UNI_ORDER
        const sorted = [...(data as University[])].sort((a, b) => {
          const ai = UNI_ORDER.indexOf(a.short_name as any);
          const bi = UNI_ORDER.indexOf(b.short_name as any);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        setUniversities(sorted);
      }
    });
  }, []);

  const handleSelectUni = (uni: University) => {
    setTappedId(uni.id);
    setSelectedUni(uni);
    setTimeout(() => setStep("signup"), 500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSignup = async () => {
    if (!firstName.trim() || !username.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!selectedUni) {
      toast.error("Please select your university");
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim(), full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").update({
          university_id: selectedUni.id,
          full_name: fullName,
        }).eq("id", userId);

        if (avatarFile) {
          const ext = avatarFile.name.split(".").pop();
          const path = `${userId}/avatar.${ext}`;
          await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
        }
      }

      toast.success("Check your email to verify your account!");
      setStep("login");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) toast.error(error.message);
    else navigate("/", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {/* ─── CHOOSE UNIVERSITY ─── */}
        {step === "choose-university" && (
          <motion.div
            key="uni"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col px-5 pt-14 pb-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
            <h1 className="text-[26px] font-black tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-muted-foreground mt-1.5"
              >
                Your campus workspace
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-8 mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <h2 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Choose your university</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {universities.map((uni, i) => {
                const isSelected = tappedId === uni.id;
                return (
                  <motion.button
                    key={uni.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectUni(uni)}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                      <img src={getLogoForUni(uni)} alt={uni.name} className="w-12 h-12 object-contain" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">{uni.short_name || uni.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{uni.name}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <GraduationCap size={14} />
                <p className="text-[11px]">You'll only see content from your campus</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setStep("login")} className="text-primary font-semibold">Sign In</button>
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ─── SIGNUP ─── */}
        {step === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 22 }}
            className="flex-1 flex flex-col px-5 pt-5 pb-6"
          >
            <button
              onClick={() => { setStep("choose-university"); setTappedId(null); setSelectedUni(null); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 self-start"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {selectedUni && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2.5 mb-5 bg-card rounded-xl p-3 border border-border"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                  <img src={getLogoForUni(selectedUni)} alt="" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedUni.short_name || selectedUni.name}</p>
                  <p className="text-[10px] text-muted-foreground">Campus Community</p>
                </div>
              </motion.div>
            )}

            <h2 className="text-lg font-bold text-foreground text-center mb-5">Create your account</h2>

            <div className="flex justify-center mb-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary/40 transition-colors"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <Camera size={20} className="text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-medium">Photo</span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Camera size={10} className="text-primary-foreground" />
                </div>
              </motion.button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex gap-3">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="text-foreground h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring" />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="text-foreground h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="text-foreground h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-foreground pr-10 h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Creating...</> : "Create Account"}
              </motion.button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <button onClick={() => setStep("login")} className="text-primary font-semibold">Sign In</button>
            </p>
          </motion.div>
        )}

        {/* ─── LOGIN ─── */}
        {step === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center px-5 pb-8"
          >
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">Welcome back</p>
              </div>

              <div className="space-y-3">
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring" />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-foreground pr-10 h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="animate-spin" size={16} /> Signing in...</> : "Sign In"}
                </motion.button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button onClick={() => setStep("choose-university")} className="text-primary font-semibold">Sign Up</button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
