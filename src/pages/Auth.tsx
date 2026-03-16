import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Camera, Loader2, GraduationCap } from "lucide-react";

import unamLogo from "@/assets/unam-logo.png";
import nustLogo from "@/assets/nust-logo.png";
import iumLogo from "@/assets/ium-logo.png";
import welwitchiaLogo from "@/assets/welwitchia-logo.png";

type AuthStep = "choose-university" | "signup" | "login";

interface University {
  id: string;
  name: string;
  short_name: string | null;
}

const UNI_LOGOS: Record<string, string> = {
  UNAM: unamLogo,
  NUST: nustLogo,
  IUM: iumLogo,
  Welwitchia: welwitchiaLogo,
};

const UNI_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  UNAM: { bg: "bg-blue-50", border: "border-blue-300", glow: "shadow-[0_0_20px_-4px_hsl(221_83%_53%/0.3)]" },
  NUST: { bg: "bg-orange-50", border: "border-orange-300", glow: "shadow-[0_0_20px_-4px_hsl(25_95%_53%/0.3)]" },
  IUM: { bg: "bg-emerald-50", border: "border-emerald-300", glow: "shadow-[0_0_20px_-4px_hsl(142_76%_36%/0.3)]" },
  Welwitchia: { bg: "bg-purple-50", border: "border-purple-300", glow: "shadow-[0_0_20px_-4px_hsl(262_83%_58%/0.3)]" },
};

function getLogoForUni(uni: University): string {
  if (uni.short_name && UNI_LOGOS[uni.short_name]) return UNI_LOGOS[uni.short_name];
  for (const key of Object.keys(UNI_LOGOS)) {
    if (uni.name.toLowerCase().includes(key.toLowerCase())) return UNI_LOGOS[key];
  }
  return unamLogo;
}

function getColorsForUni(uni: University) {
  const key = uni.short_name || "";
  return UNI_COLORS[key] || UNI_COLORS.UNAM;
}

// Fixed 2x2 grid order
const UNI_ORDER = ["UNAM", "NUST", "IUM", "Welwitchia"];

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
          const ai = UNI_ORDER.indexOf(a.short_name || "");
          const bi = UNI_ORDER.indexOf(b.short_name || "");
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
            {/* App brand */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[15px] text-muted-foreground mt-2 font-medium"
              >
                Your campus. Your community.
              </motion.p>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-10 mb-5"
            >
              <h2 className="text-xl font-bold text-foreground text-center">Choose Your University</h2>
            </motion.div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {universities.map((uni, i) => {
                const colors = getColorsForUni(uni);
                const isSelected = tappedId === uni.id;
                return (
                  <motion.button
                    key={uni.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.05 : 1,
                    }}
                    transition={{
                      delay: 0.3 + i * 0.08,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    whileTap={{ scale: 1.05 }}
                    onClick={() => handleSelectUni(uni)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ${colors.glow}`
                        : "border-border bg-card hover:shadow-card"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={getLogoForUni(uni)}
                        alt={uni.name}
                        className="w-14 h-14 object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-bold text-foreground leading-tight">
                        {uni.short_name || uni.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                        {uni.name}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer note */}
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
                <button onClick={() => setStep("login")} className="text-primary font-semibold">
                  Sign In
                </button>
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
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 self-start"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* University badge */}
            {selectedUni && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2.5 mb-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${getColorsForUni(selectedUni).bg}`}>
                  <img src={getLogoForUni(selectedUni)} alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedUni.short_name || selectedUni.name}</p>
                  <p className="text-[10px] text-muted-foreground">Campus Community</p>
                </div>
              </motion.div>
            )}

            <h2 className="text-xl font-bold text-foreground text-center mb-5">Create Your Account</h2>

            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileRef.current?.click()}
                className="relative w-22 h-22 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                style={{ width: 88, height: 88 }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera size={22} className="text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-medium">Add photo</span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Camera size={11} className="text-primary-foreground" />
                </div>
              </motion.button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex gap-3">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="text-foreground h-12" />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="text-foreground h-12" />
              </div>
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="text-foreground h-12" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground h-12" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-foreground pr-10 h-12"
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
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] disabled:opacity-50 mt-1 flex items-center justify-center gap-2 shadow-elevated"
              >
                {loading ? <><Loader2 className="animate-spin" size={18} /> Creating...</> : "Create Account"}
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
              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
                <p className="text-[15px] text-muted-foreground mt-2 font-medium">Welcome back</p>
              </div>

              <div className="space-y-3">
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground h-12" />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-foreground pr-10 h-12"
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
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] disabled:opacity-50 flex items-center justify-center gap-2 shadow-elevated"
                >
                  {loading ? <><Loader2 className="animate-spin" size={18} /> Signing in...</> : "Sign In"}
                </motion.button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button onClick={() => setStep("choose-university")} className="text-primary font-semibold">
                  Sign Up
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
