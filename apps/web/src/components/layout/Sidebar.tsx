"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Brain03Icon,
  CrownIcon,
  CustomizeIcon,
  HelpCircleIcon,
  Invoice01Icon,
  KeyboardIcon,
  LanguageSkillIcon,
  Logout01Icon,
  ComputerActivityIcon,
  Moon02Icon,
  Plug01Icon,
  RoboticIcon,
  Settings05Icon,
  SidebarLeft01Icon,
  SlidersHorizontalIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "../ui/Button";

export type RunpaneTab =
  | "overview"
  | "agents"
  | "approvals"
  | "surfaces"
  | "audit"
  | "integrations"
  | "settings"
  | "billing"
  | "developers";

type SidebarProps = {
  tab: RunpaneTab;
  setTab: (tab: RunpaneTab) => void;
};

type NavItem = {
  label: string;
  tab: RunpaneTab;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  exact?: boolean;
};

type BottomNavItem =
  | {
      label: string;
      tab: RunpaneTab;
      icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
    }
  | {
      label: string;
      href: string;
      icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
    };

const MAIN_NAV: NavItem[] = [
  { label: "Overview", tab: "overview", icon: RoboticIcon, exact: true },
  { label: "Agents", tab: "agents", icon: UserAccountIcon },
  { label: "Approvals", tab: "approvals", icon: ComputerActivityIcon },
];

const UTILITY_NAV: NavItem[] = [
  { label: "Prism AX", tab: "surfaces", icon: Plug01Icon },
  { label: "Audit Log", tab: "audit", icon: Brain03Icon },
  { label: "Integrations", tab: "integrations", icon: SlidersHorizontalIcon },
  { label: "Billing", tab: "billing", icon: Invoice01Icon },
  { label: "Settings", tab: "settings", icon: Settings05Icon },
];

const BOTTOM_NAV: BottomNavItem[] = [
  { label: "Documentation", href: "https://docs.runpane.localhost", icon: BookOpen01Icon },
];

const SIDEBAR_OPEN_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 56;

const sidebarItemClass =
  "group flex h-10 min-h-10 items-center rounded-[10px] text-[14px] font-light transition-[background-color,color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";
const sidebarCollapsedItemClass = "w-10 px-0";
const sidebarExpandedItemClass = "w-full pr-3";
const sidebarRailButtonClass = "h-10 w-10 justify-center px-0 rounded-[10px]";
const sidebarToneClass =
  "text-[var(--app-sidebar-muted)] hover:bg-[var(--app-sidebar-hover)] hover:text-[var(--app-sidebar-text)]";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SidebarDivider() {
  return <div className="mx-2 my-1" style={{ height: 1, background: "var(--app-sidebar-divider)" }} />;
}

function NavList({
  items,
  open,
  activeTab,
  setTab,
}: {
  items: NavItem[];
  open: boolean;
  activeTab: RunpaneTab;
  setTab: (tab: RunpaneTab) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = activeTab === item.tab;
        return (
          <li key={item.label}>
            <Button
              variant="sidebarTab"
              tone={active ? "active" : "default"}
              onClick={() => setTab(item.tab)}
              className={cn(
                open ? sidebarExpandedItemClass : sidebarCollapsedItemClass,
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  strokeWidth={1.8}
                  className={cn(
                    "w-[18px] shrink-0 transition-colors duration-200",
                    active
                      ? "text-[var(--app-sidebar-text)]"
                      : "text-[var(--app-sidebar-muted)] group-hover:text-[var(--app-sidebar-text)]",
                  )}
                />
              </span>
              <span
                className={cn(
                  "flex h-10 items-center overflow-hidden whitespace-nowrap leading-none transition-[max-width,opacity] duration-200",
                  open ? "max-w-[144px] opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {item.label}
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function BottomNavList({
  items,
  open,
  activeTab,
  setTab,
}: {
  items: BottomNavItem[];
  open: boolean;
  activeTab: RunpaneTab;
  setTab: (tab: RunpaneTab) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = "tab" in item && activeTab === item.tab;
        const className = cn(
          buttonVariants({ variant: "sidebarTab", tone: active ? "active" : "default" }),
          open ? sidebarExpandedItemClass : sidebarCollapsedItemClass,
        );
        const content = (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                strokeWidth={1.8}
                className={cn(
                  "w-[18px] shrink-0 transition-colors duration-200",
                  active
                    ? "text-[var(--app-sidebar-text)]"
                    : "text-[var(--app-sidebar-muted)] group-hover:text-[var(--app-sidebar-text)]",
                )}
              />
            </span>
            <span
              className={cn(
                "flex h-10 items-center overflow-hidden whitespace-nowrap leading-none transition-[max-width,opacity] duration-200",
                open ? "max-w-[144px] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              {item.label}
            </span>
          </>
        );

        return (
          <li key={item.label}>
            {"tab" in item ? (
              <button type="button" onClick={() => setTab(item.tab)} className={className}>
                {content}
              </button>
            ) : (
              <a href={item.href} target="_blank" rel="noreferrer" className={className}>
                {content}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ tab, setTab }: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <aside
      className="sticky inset-y-0 left-0 z-30 flex h-screen shrink-0 flex-col"
      style={{
        width: open ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        background: "var(--app-sidebar-bg)",
        transition: "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        overflow: "hidden",
      }}
    >
      <div className={cn("relative flex items-center px-2 pb-1.5 pt-3", open ? "justify-between" : "justify-start")}>
        <div className="group relative flex h-10 w-10 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => setTab("overview")}
            aria-label="Operator"
            className={cn(
              sidebarItemClass,
              "absolute inset-0 text-[var(--app-sidebar-text)] transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--app-sidebar-hover)]",
              sidebarRailButtonClass,
              !open && "group-hover:opacity-0",
            )}
          >
            <HelixLogo />
          </button>
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setOpen(true)}
            className={cn(
              sidebarItemClass,
              "absolute inset-0 transition-opacity duration-200",
              sidebarToneClass,
              sidebarRailButtonClass,
              open
                ? "pointer-events-none opacity-0"
                : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
            )}
          >
            <HugeiconsIcon icon={SidebarLeft01Icon} size={18} strokeWidth={1.8} className="shrink-0" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className={cn(
            sidebarItemClass,
            "shrink-0 transition-opacity duration-200",
            sidebarToneClass,
            sidebarRailButtonClass,
            open ? "opacity-100" : "pointer-events-none absolute right-2 opacity-0",
          )}
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} size={18} strokeWidth={1.8} className="shrink-0" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-0">
        <NavList items={MAIN_NAV} open={open} activeTab={tab} setTab={setTab} />
        <SidebarDivider />
        <NavList items={UTILITY_NAV} open={open} activeTab={tab} setTab={setTab} />
      </nav>

      <div className="px-2 pb-2 pt-1.5">
        <BottomNavList items={BOTTOM_NAV} open={open} activeTab={tab} setTab={setTab} />
        <SidebarDivider />
        <button
          ref={userButtonRef}
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className={cn(
            sidebarItemClass,
            open ? sidebarExpandedItemClass : sidebarCollapsedItemClass,
            "w-full",
            sidebarToneClass,
            menuOpen && "bg-[var(--app-sidebar-surface)] text-[var(--app-sidebar-text)]",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <span
              className="flex items-center justify-center rounded-full text-[11px] font-semibold leading-none"
              style={{
                width: 24,
                height: 24,
                background: "var(--app-sidebar-avatar-bg)",
                color: "var(--app-sidebar-avatar-fg)",
              }}
            >
              NR
            </span>
          </span>
          <span
            className={cn(
              "flex h-10 items-center overflow-hidden whitespace-nowrap text-[14px] font-normal leading-none transition-[max-width,opacity] duration-200",
              open ? "max-w-[144px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            Niko
          </span>
        </button>
      </div>

      <UserMenuPopup
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={userButtonRef}
        sidebarOpen={open}
      />
    </aside>
  );
}

function UserMenuPopup({
  open,
  onClose,
  anchorRef,
  sidebarOpen,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  sidebarOpen: boolean;
}) {
  const router = useRouter();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  async function signOut() {
    onClose();
    const { createClient } = await import("../../lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!open) return null;

  const anchorRect = anchorRef.current?.getBoundingClientRect();
  const popupLeft = anchorRect ? Math.round(anchorRect.right + 16) : (sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH) + 16;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: popupLeft,
        width: 240,
        background: "var(--app-popup-bg)",
        border: "1px solid var(--app-popup-border)",
        borderRadius: 12,
        zIndex: 100,
        padding: "8px",
        animation: "userMenuPopupIn 180ms cubic-bezier(0.22, 1, 0.36, 1)",
        transition: "left 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="mb-1 flex items-center gap-3 px-2.5 py-2.5">
        <span
          className="flex shrink-0 items-center justify-center rounded-full text-[12px] font-semibold leading-none"
          style={{ width: 32, height: 32, background: "var(--app-sidebar-avatar-bg)", color: "var(--app-sidebar-avatar-fg)" }}
        >
          NR
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium leading-none text-[var(--app-popup-text)]">Niko</span>
          <span className="mt-1 truncate text-[11px] leading-none text-[var(--app-popup-muted)]">hello@runpane.com</span>
        </div>
      </div>

      <PopupDivider />
      <MenuItem icon={UserAccountIcon} label="Account" />
      <MenuItem icon={SlidersHorizontalIcon} label="Preferences" />
      <MenuItem icon={CustomizeIcon} label="Personalization" />
      <MenuItem icon={KeyboardIcon} label="Shortcuts" />
      <MenuItem icon={Settings05Icon} label="All Settings" shortcut="⇧⌘," />
      <PopupDivider />
      <MenuItem icon={CrownIcon} label="Upgrade Plan" />
      <PopupDivider />
      <MenuItem
        icon={Moon02Icon}
        label="Appearance"
        hasArrow
        arrowOpen={appearanceOpen}
        subLabel="Dark"
        onClick={() => setAppearanceOpen((value) => !value)}
      />
      <div
        className="grid overflow-hidden pl-10 transition-[grid-template-rows,opacity,transform,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          gridTemplateRows: appearanceOpen ? "1fr" : "0fr",
          opacity: appearanceOpen ? 1 : 0,
          transform: appearanceOpen ? "translateY(0)" : "translateY(-4px)",
          marginTop: appearanceOpen ? 4 : 0,
          pointerEvents: appearanceOpen ? "auto" : "none",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-0.5 pb-0.5">
            <AppearanceOption label="System (Dark)" selected={false} />
            <AppearanceOption label="Light" selected={false} />
            <AppearanceOption label="Dark" selected />
          </div>
        </div>
      </div>
      <MenuItem icon={LanguageSkillIcon} label="Language" hasArrow subLabel="English" />
      <MenuItem icon={HelpCircleIcon} label="Help" hasArrow />
      <PopupDivider />
      <MenuItem icon={Logout01Icon} label="Sign out" danger onClick={signOut} />
    </div>
  );
}

function PopupDivider() {
  return <div className="my-1 h-px" style={{ background: "var(--app-sidebar-divider)" }} />;
}

function MenuItem({
  icon,
  label,
  shortcut,
  hasArrow,
  arrowOpen,
  subLabel,
  onClick,
  danger,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  label: string;
  shortcut?: string;
  hasArrow?: boolean;
  arrowOpen?: boolean;
  subLabel?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left text-[13px] transition-colors duration-100",
        danger
          ? "text-[var(--app-popup-muted)] hover:bg-[var(--app-popup-hover)] hover:text-[#cf8d75]"
          : "text-[var(--app-popup-text)] hover:bg-[var(--app-popup-hover)] hover:text-[var(--app-popup-text)]",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--app-popup-muted)]">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="leading-none">{label}</span>
        {subLabel && <span className="mt-0.5 text-[11px] leading-none text-[var(--app-popup-muted)]">{subLabel}</span>}
      </span>
      {shortcut && <span className="shrink-0 font-mono text-[11px] text-[var(--app-popup-muted)]">{shortcut}</span>}
      {hasArrow && (
        <span
          className={cn(
            "flex shrink-0 items-center text-[var(--app-popup-muted)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            arrowOpen && "rotate-90",
          )}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
        </span>
      )}
    </button>
  );
}

function AppearanceOption({ label, selected }: { label: string; selected: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-[12px] transition-colors duration-100",
        selected
          ? "bg-[var(--app-sidebar-surface)] text-[var(--app-popup-text)]"
          : "text-[var(--app-popup-muted)] hover:bg-[var(--app-popup-hover)] hover:text-[var(--app-popup-text)]",
      )}
    >
      <span>{label}</span>
      <span className="flex h-4 w-4 items-center justify-center">{selected ? "✓" : null}</span>
    </button>
  );
}

function HelixLogo() {
  return (
    <svg
      width="11.25"
      height="18.13"
      viewBox="0 0 241.13 392.27"
      fill="none"
      aria-hidden="true"
      style={{ filter: "var(--sidebar-logo-filter)" }}
    >
      <path
        d="M16.5 0v63.67c0 17.06 6.78 33.43 18.84 45.49l170.45 170.45c12.07 12.07 18.84 28.43 18.84 45.49v67.17"
        stroke="white"
        strokeWidth="33"
        strokeMiterlimit="10"
      />
      <path
        d="M224.63 0v63.67c0 17.06-6.78 33.43-18.84 45.49L35.34 279.61C23.27 291.68 16.5 308.04 16.5 325.1v67.17"
        stroke="white"
        strokeWidth="33"
        strokeMiterlimit="10"
      />
      <path d="M16.5 196.14h208.13" stroke="white" strokeWidth="33" strokeMiterlimit="10" strokeLinecap="square" />
    </svg>
  );
}
