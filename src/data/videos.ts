import { RoleType } from "../entrataTypes";

export interface TrainingVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  duration?: string;
  category: "Leasing" | "Move-In/Move-Out" | "Maintenance" | "Financial" | "Reports" | "Overview" | "Resident Services";
  role: RoleType[];
  relatedWorkflows: string[];
}

export const PLAYLIST_ID = "PLLrFxqbnV5eH_RKS8zZbEI5o8Uf1pXq5H";

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: "v-full-demo-2026",
    youtubeId: "4ZZjZ8O5sL0",
    title: "Entrata Full Platform Demo 2026",
    description: "Complete walkthrough of all core Entrata features: leasing, resident management, maintenance, rent collection, and reporting. Great starting point for new users.",
    duration: "~15 min",
    category: "Overview",
    role: ["Leasing", "Maintenance", "Manager"],
    relatedWorkflows: ["create-prospect", "move-in", "create-work-order", "daily-operations-report"],
  },
  {
    id: "v-beginner-tutorial",
    youtubeId: "_clI1Sa52TE",
    title: "Entrata Beginner Tutorial — Getting Started",
    description: "Covers the core features and how to use the Entrata CRM software, including Resident Pay, Resident Verify, Access Connect, Message Center, and Facilities Management.",
    duration: "8 min",
    category: "Overview",
    role: ["Leasing", "Manager"],
    relatedWorkflows: ["create-prospect", "process-application", "resident-portal-setup"],
  },
  {
    id: "v-crm-leasing",
    youtubeId: "PLLrFxqbnV5eH_RKS8zZbEI5o8Uf1pXq5H",
    title: "Entrata CRM Training Playlist",
    description: "Official Entrata CRM training playlist — covers community relationship management, leasing workflows, prospect tracking, and more. Browse all videos in the playlist.",
    duration: "Full playlist",
    category: "Leasing",
    role: ["Leasing", "Manager"],
    relatedWorkflows: ["create-prospect", "process-application", "lease-renewal", "move-in"],
  },
];

// Maps workflow IDs to the most relevant video ID for that workflow
export const WORKFLOW_VIDEO_MAP: Record<string, string> = {
  "create-prospect": "v-crm-leasing",
  "process-application": "v-crm-leasing",
  "move-in": "v-full-demo-2026",
  "move-out": "v-full-demo-2026",
  "lease-renewal": "v-crm-leasing",
  "notice-to-vacate": "v-crm-leasing",
  "create-work-order": "v-full-demo-2026",
  "post-manual-fee": "v-full-demo-2026",
  "accept-payment": "v-beginner-tutorial",
  "daily-operations-report": "v-full-demo-2026",
  "resident-portal-setup": "v-beginner-tutorial",
};
