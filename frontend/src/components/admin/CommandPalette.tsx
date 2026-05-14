// Cmd+K / Ctrl+K command palette. Provides instant navigation between
// admin pages and quick-jump into any CMS section.

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ExternalLink,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import { adminLogout } from "@/lib/api";

const SECTION_QUICK_JUMPS = [
  { key: "hero", label: "Edit Hero" },
  { key: "mentors", label: "Edit Mentors" },
  { key: "testimonials", label: "Edit Testimonials" },
  { key: "upcoming_courses", label: "Edit Upcoming Courses" },
  { key: "webinars", label: "Edit Webinars" },
  { key: "contact", label: "Edit Contact" },
  { key: "site_footer", label: "Edit Footer" },
  { key: "announcement_bar", label: "Edit Announcement Bar" },
  { key: "site_header", label: "Edit Site Header" },
  { key: "seo_home", label: "Edit Homepage SEO" },
];

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChangePassword: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onChangePassword,
}: Props) {
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K listener — toggles the palette globally.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  const goContent = (key: string) => {
    onOpenChange(false);
    // Stash key so the content page opens this section directly.
    sessionStorage.setItem("admin.content.activeKey", key);
    void navigate({ to: "/admin/content" });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/admin")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
            <CommandShortcut>g d</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/leads")}>
            <Users className="mr-2 h-4 w-4" />
            Leads
            <CommandShortcut>g l</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/content")}>
            <FileText className="mr-2 h-4 w-4" />
            Site Content
            <CommandShortcut>g c</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/blogs")}>
            <Newspaper className="mr-2 h-4 w-4" />
            Blog
            <CommandShortcut>g b</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <CommandShortcut>g s</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick edit">
          {SECTION_QUICK_JUMPS.map((j) => (
            <CommandItem
              key={j.key}
              onSelect={() => goContent(j.key)}
              value={`${j.label} ${j.key}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              {j.label}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {j.key}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onChangePassword();
            }}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Change password
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.open("/", "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open public site
          </CommandItem>
          <CommandItem
            onSelect={async () => {
              onOpenChange(false);
              await adminLogout();
              window.location.href = "/admin";
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Single-key Go-To shortcuts: press "g" then "d/l/c/s" to navigate.
export function useGoToShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let armed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (!armed && e.key.toLowerCase() === "g") {
        armed = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          armed = false;
        }, 800);
        return;
      }

      if (armed) {
        const map: Record<string, string> = {
          d: "/admin",
          l: "/admin/leads",
          c: "/admin/content",
          b: "/admin/blogs",
          s: "/admin/settings",
        };
        const dest = map[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          void navigate({ to: dest });
        }
        armed = false;
        if (timer) clearTimeout(timer);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [navigate]);
}
