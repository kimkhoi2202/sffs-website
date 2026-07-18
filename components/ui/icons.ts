"use client";

/*
  Client-reference re-exports of the lucide icons used on pages.

  Server Component pages cannot pass a raw lucide icon *component* as a prop into a
  Client Component section (e.g. FeatureTabs, ResourceGrid), React can't serialize a
  function across the RSC boundary ("Functions cannot be passed directly to Client
  Components"). Re-exporting the icons through this "use client" module registers them
  as client references, so pages may pass them to both server AND client sections
  safely. Import page-level icons from here instead of directly from "lucide-react".

  To use a new icon on a page that feeds a client section, add it to this list.
*/
export {
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  ListChecks,
  Mail,
  Mic,
  Network,
  PhoneCall,
  Search,
  Send,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";
