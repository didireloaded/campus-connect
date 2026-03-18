import unamLogo from "@/assets/universities/unam.png";
import nustLogo from "@/assets/universities/nust.png";
import iumLogo from "@/assets/universities/ium.png";
import welwitchiaLogo from "@/assets/universities/welwitchia.png";

export interface UniversityConfig {
  shortName: string;
  name: string;
  logo: string;
  colors: { bg: string; border: string; glow: string };
}

export const UNI_ORDER = ["UNAM", "NUST", "IUM", "Welwitchia"] as const;

export const universities: Record<string, UniversityConfig> = {
  UNAM: {
    shortName: "UNAM",
    name: "University of Namibia",
    logo: unamLogo,
    colors: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300", glow: "shadow-[0_0_20px_-4px_hsl(221_83%_53%/0.3)]" },
  },
  NUST: {
    shortName: "NUST",
    name: "Namibia University of Science and Technology",
    logo: nustLogo,
    colors: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-300", glow: "shadow-[0_0_20px_-4px_hsl(25_95%_53%/0.3)]" },
  },
  IUM: {
    shortName: "IUM",
    name: "International University of Management",
    logo: iumLogo,
    colors: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300", glow: "shadow-[0_0_20px_-4px_hsl(142_76%_36%/0.3)]" },
  },
  Welwitchia: {
    shortName: "WU",
    name: "Welwitchia University",
    logo: welwitchiaLogo,
    colors: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-300", glow: "shadow-[0_0_20px_-4px_hsl(262_83%_58%/0.3)]" },
  },
};

/**
 * Look up university config by short_name from the DB record.
 * Falls back to UNAM config if not found.
 */
export function getUniConfig(shortName: string | null | undefined): UniversityConfig {
  if (!shortName) return universities.UNAM;
  return universities[shortName] || universities.UNAM;
}
