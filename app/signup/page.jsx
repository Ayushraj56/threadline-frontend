"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/FormField";
import { api } from "@/lib/api";
import {
  IconUser,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
} from "@/components/icons";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function passwordStrength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  const strength = passwordStrength(password);
  const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][strength];
  const strengthColor = ["bg-line", "bg-red-300", "bg-amber-300", "bg-mint", "bg-mintDeep"][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const next = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!email.trim()) next.email = "Enter your email.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match.";
    if (!agreed) next.agreed = "Accept the terms to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await api.signup({ name, email, password });
      router.push("/login");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Set up your inbox in under a minute."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600">
            {serverError}
          </p>
        )}

        <FormField
          label="Full name"
          icon={<IconUser className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ayush Sharma"
          error={errors.name}
        />

        <FormField
          label="Email"
          icon={<IconMail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          error={errors.email}
        />

        <div>
          <FormField
            label="Password"
            icon={<IconLock className="h-4 w-4" />}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
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
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-full ${
                      i < strength ? strengthColor : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] text-muted">{strengthLabel}</span>
            </div>
          )}
        </div>

        <FormField
          label="Confirm password"
          icon={<IconLock className="h-4 w-4" />}
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <label className="flex items-start gap-2 pt-1 text-[12.5px] text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-line accent-ink"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-ink hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-ink hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.agreed && <p className="text-[12px] text-red-500">{errors.agreed}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[13.5px] font-medium text-white transition-opacity disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
          {!submitting && <IconArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}