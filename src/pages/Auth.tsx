import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Camera, Loader2 } from "lucide-react";

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

function getLogoForUni(uni: University): string {
  if (uni.short_name && UNI_LOGOS[uni.short_name]) return UNI_LOGOS[uni.short_name];
  for (const key of Object.keys(UNI_LOGOS)) {
    if (uni.name.toLowerCase().includes(key.toLowerCase())) return UNI_LOGOS[key];
  }
  return unamLogo;
}

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("choose-university");
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Signup fields
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
      if (data) setUniversities(data as University[]);
    });
  }, []);

  const handleSelectUni = (uni: University) => {
    setSelectedUni(uni);
    setTimeout(() => setStep("signup"), 400);
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

      // Update profile with university
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").update({
          university_id: selectedUni.id,
          full_name: fullName,
        }).eq("id", userId);

        // Upload avatar if provided
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
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {/* STEP 1: Choose University */}
        {step === "choose-university" && (
          <motion.div
            key="uni"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pt-16 pb-8"
          >
            <div className="text-center mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Camp<span className="text-primary">Life</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Your campus community</p>
            </div>

            <div className="mt-8 mb-6">
              <h2 className="text-lg font-bold text-foreground text-center">Choose Your University</h2>
              <p className="text-xs text-muted-foreground text-center mt-1">
                You'll only see content from your campus
              </p>
            </div>

            <div className="space-y-3 flex-1">
              {universities.map((uni, i) => (
                <motion.button
                  key={uni.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                  whileTap={{ scale: 1.03 }}
                  onClick={() => handleSelectUni(uni)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all ${
                    selectedUni?.id === uni.id
                      ? "border-primary bg-primary/5 shadow-elevated"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-card"
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    <img src={getLogoForUni(uni)} alt={uni.name} className="w-12 h-12 object-contain" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[15px] font-semibold text-foreground">{uni.name}</p>
                    {uni.short_name && (
                      <p className="text-xs text-muted-foreground font-medium">{uni.short_name}</p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setStep("login")} className="text-primary font-semibold">
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Signup */}
        {step === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pt-6 pb-8"
          >
            <button onClick={() => { setStep("choose-university"); setSelectedUni(null); }}
              className="flex items-center gap-1 text-sm text-muted-foreground mb-4 self-start">
              <ArrowLeft size={16} /> Back
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Create Your Account</h2>
              {selectedUni && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <img src={getLogoForUni(selectedUni)} alt="" className="w-5 h-5 object-contain" />
                  <span className="text-xs font-semibold text-primary">{selectedUni.short_name || selectedUni.name}</span>
                </div>
              )}
            </div>

            {/* Avatar upload */}
            <div className="flex justify-center mb-5">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-muted-foreground" />
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Camera size={10} className="text-primary-foreground" />
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex gap-3">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="text-foreground" />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="text-foreground" />
              </div>
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="text-foreground" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-foreground pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
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

        {/* STEP 3: Login */}
        {step === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-8"
          >
            <div className="w-full max-w-sm">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Camp<span className="text-primary">Life</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Welcome back</p>
              </div>

              <div className="space-y-4">
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground" />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-foreground pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
