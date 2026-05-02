"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import { NeonDrift } from "../components/NeonDrift";

type Mode = "signin" | "signup";

export function LoginPage({ mode: initialMode = "signin" }: { mode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        const next = searchParams.get("next") ?? "/app/overview";
        router.push(next);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center">
          <img src="/runpane-logo.png" alt="Runpane" className="h-5 object-contain brightness-0 invert" />
        </Link>
        <span className="text-sm text-zinc-500">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button onClick={() => { setMode("signup"); setError(null); setMessage(null); }} className="text-zinc-300 underline-offset-2 hover:underline">
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(null); setMessage(null); }} className="text-zinc-300 underline-offset-2 hover:underline">
                Sign in
              </button>
            </>
          )}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              {mode === "signin" ? "Sign in to Runpane" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {mode === "signin"
                ? "Welcome back. Enter your credentials to continue."
                : "Set up your control plane in seconds."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3.5 py-2.5 text-sm text-emerald-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-60"
            >
              {loading ? (
                <NeonDrift size={20} dotSize={3} color="rgba(0,0,0,0.6)" speed={1.2} />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
            By continuing, you agree to Runpane&apos;s{" "}
            <a href="#" className="text-zinc-500 hover:text-zinc-300">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-zinc-500 hover:text-zinc-300">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
