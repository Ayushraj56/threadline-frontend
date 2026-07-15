"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/FormField";
import { api } from "@/lib/api";
import { IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const next = {};
    if (!email.trim()) next.email = "Enter your email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await api.login({ email, password });
      router.push("/chat");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to Threadline"
      subtitle="Pick up right where your conversations left off."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600">
            {serverError}
          </p>
        )}

        <FormField
          label="Email"
          icon={<IconMail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          error={errors.email}
        />

        <FormField
          label="Password"
          icon={<IconLock className="h-4 w-4" />}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={errors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <IconEyeOff className="h-4 w-4" />
              ) : (
                <IconEye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-line accent-ink"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-[12.5px] font-medium text-ink hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[13.5px] font-medium text-white transition-opacity disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
          {!submitting && <IconArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-ink hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}