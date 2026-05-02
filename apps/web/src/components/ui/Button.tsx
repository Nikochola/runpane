"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "agentPathSolid" | "agentPathOutline" | "sidebarTab";
type ButtonTone = "default" | "active";

type ButtonVariantsInput = {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function buttonVariants({ variant = "default", tone = "default", className }: ButtonVariantsInput = {}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm transition-[background-color,color,opacity,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";

  if (variant === "agentPathSolid") {
    return cn(base, "min-w-32 border border-zinc-100 bg-zinc-100 px-6 py-2 font-normal text-zinc-950", className);
  }

  if (variant === "agentPathOutline") {
    return cn(
      base,
      "min-w-32 border border-zinc-100 bg-transparent px-6 py-2 font-normal text-zinc-100 hover:bg-zinc-900",
      className,
    );
  }

  if (variant === "sidebarTab") {
    return cn(
      "group flex h-10 min-h-10 items-center rounded-[10px] text-[14px] font-light transition-[background-color,color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
      tone === "active"
        ? "bg-[var(--app-sidebar-surface)] text-[var(--app-sidebar-text)]"
        : "text-[var(--app-sidebar-muted)] hover:bg-[var(--app-sidebar-hover)] hover:text-[var(--app-sidebar-text)]",
      className,
    );
  }

  return cn(base, "border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-100", className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<ButtonVariantsInput, "className"> & {
    className?: string;
  };

export function Button({ variant = "default", tone = "default", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, tone, className })} {...props} />;
}
