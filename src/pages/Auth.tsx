import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Camera, Loader2, GraduationCap } from 'lucide-react';
import { getUniConfig, UNI_ORDER } from '@/config/universities';
import { Input } from '@/components/ui/input';

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
