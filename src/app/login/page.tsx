"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setIsSetup(!data.passwordSet);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Setup failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Everything IP
          </h1>
          <p className="text-xs text-[var(--accent)] mono tracking-[0.3em] uppercase mt-1">
            CCTV Lead Manager
          </p>
        </div>

        <div className="card">
          <h2 className="label mb-4">
            {isSetup ? "Create Your Password" : "Sign In"}
          </h2>

          {isSetup ? (
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Set a password to secure your dashboard. You&apos;ll use this on your phone and computer.
            </p>
          ) : null}

          <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-4">
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSetup ? "Choose a password" : "Enter password"}
                className="input text-base"
                autoFocus
                autoComplete={isSetup ? "new-password" : "current-password"}
              />
            </div>

            {isSetup && (
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="input text-base"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-[var(--danger)] mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn btn-primary btn-lg w-full disabled:opacity-50 shadow-[0_0_25px_-5px_var(--accent)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#080b12]/30 border-t-[#080b12] rounded-full animate-spin" />
                  {isSetup ? "Setting up..." : "Signing in..."}
                </span>
              ) : (
                isSetup ? "Set Password & Continue" : "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
