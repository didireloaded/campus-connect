/**
 * Dark Mode Toggle
 * 
 * Drop this wherever you want a theme switch.
 * It reads/writes the "theme" key in localStorage and toggles
 * the `dark` class on <html>. Works with Tailwind's darkMode: "class" config.
 * 
 * Usage in Profile header:
 *   import { DarkModeToggle } from "@/components/DarkModeToggle";
 *   <DarkModeToggle />
 */

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
      className="relative w-12 h-6 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ backgroundColor: dark ? "hsl(var(--primary))" : "hsl(var(--border))" }}
    >
      <motion.div
        layout
        animate={{ x: dark ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {dark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon size={11} className="text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun size={11} className="text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}

/**
 * Add to your main.tsx or index.html <head> to prevent flash of unstyled theme:
 *
 * <script>
 *   (function() {
 *     const theme = localStorage.getItem('theme');
 *     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 *     if (theme === 'dark' || (!theme && prefersDark)) {
 *       document.documentElement.classList.add('dark');
 *     }
 *   })();
 * </script>
 */
