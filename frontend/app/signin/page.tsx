"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Key,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { isValidEmail, checkEmailExists, loginWithEmail, AuthUser } from "../../lib/auth";
import { OAuthModal } from "../../components/modals/OAuthModal";
import { useToast } from "../../components/ui/Toast";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "microsoft" | "apple" | "sso" | null>(null);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmailInput(qEmail);
  }, [searchParams]);

  const isEmailValid = isValidEmail(emailInput);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setAccountNotFound(false);

    if (!isEmailValid) {
      setErrorMessage("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    try {
      setLoading(true);

      // 1. Check if email exists in database
      const check = await checkEmailExists(emailInput);
      if (!check.exists) {
        setAccountNotFound(true);
        setErrorMessage(`No account found for '${emailInput}'. Please sign up first.`);
        return;
      }

      // 2. If password field not yet shown, reveal it
      if (!showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }

      // 3. Authenticate with email and password
      const user = await loginWithEmail(emailInput, passwordInput);
      showToast(`Welcome back, ${user.name}!`, "success");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMessage(msg);
      if (msg.toLowerCase().includes("no account found") || msg.toLowerCase().includes("sign up first")) {
        setAccountNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = (user: AuthUser) => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="focus:outline-none">
          <span className="text-3xl font-black tracking-tight text-[#0B5CFF]">
            zoom
          </span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <span>New to Zoom?</span>
            <Link
              href="/signup"
              className="text-[#0B5CFF] font-semibold hover:underline"
            >
              Sign Up Free
            </Link>
          </div>
          <button
            onClick={() => showToast("Opening Zoom Support Center", "info")}
            className="text-gray-600 hover:text-[#0B5CFF] transition-colors hidden sm:block"
          >
            Support
          </button>
          <div className="flex items-center gap-1 text-gray-600 cursor-pointer hover:text-[#0B5CFF]">
            <span>English</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-16 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
        {/* Left Column: Zoomtopia Promo Card */}
        <div className="w-full lg:w-[480px] h-[460px] bg-gradient-to-br from-[#0B5CFF] via-[#0848CA] to-[#012E8B] rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter">zoomtopia</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wider text-blue-200">
              2026年10月22日(木)開催
            </p>
          </div>

          <div className="relative z-10 my-auto py-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug drop-shadow-sm">
              忙しいだけの仕事から、
              <br />
              成果を生み出す仕事へ。
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-2 font-medium">
              Transform busy work into real business impact with Zoom AI Companion.
            </p>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center -space-x-3">
              <div className="w-11 h-11 rounded-full border-2 border-white bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                EY
              </div>
              <div className="w-11 h-11 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                AJ
              </div>
              <div className="w-11 h-11 rounded-full border-2 border-white bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                RW
              </div>
            </div>
            <div className="text-right text-[11px] text-blue-200 font-medium leading-tight">
              <span>Zoom 創業者 Eric Yuan</span>
              <br />
              <span>NASA 宇宙飛行士 Reid Wiseman</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-xs text-gray-500 mt-1">
              Access your meetings, recordings, and account settings
            </p>
          </div>

          {/* Error / Account not found Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {accountNotFound && (
                  <div className="mt-2 flex items-center gap-3">
                    <Link
                      href={`/signup?email=${encodeURIComponent(emailInput)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5CFF] text-white font-bold rounded-lg hover:bg-[#0845BF] transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Sign Up Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) setErrorMessage("");
                  setAccountNotFound(false);
                }}
                placeholder="Enter email, Zoom Mail or phone number"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/20 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                required
              />
              {emailInput && !isEmailValid && (
                <p className="text-[11px] text-amber-600 mt-1 pl-1">
                  Please enter a valid email format (e.g. name@example.com)
                </p>
              )}
            </div>

            {showPassword && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/20 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isEmailValid}
              className={`w-full h-12 font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                isEmailValid && !loading
                  ? "bg-[#0B5CFF] hover:bg-[#0845BF] active:scale-[0.99] text-white shadow-blue-500/20 cursor-pointer"
                  : "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
              }`}
            >
              {loading ? "Checking..." : showPassword ? "Sign In" : "Next"}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[11px] text-gray-600 flex items-center justify-between">
            <span>Seeded Demo Account: <strong className="text-gray-900">vinayak@zoomclone.com</strong></span>
            <button
              onClick={() => {
                setEmailInput("vinayak@zoomclone.com");
                setErrorMessage("");
                setAccountNotFound(false);
              }}
              className="text-[#0B5CFF] font-semibold hover:underline"
            >
              Auto-fill
            </button>
          </div>

          {/* Or sign in with */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500 uppercase">
              <span className="bg-white px-3 font-medium">Or sign in with</span>
            </div>
          </div>

          {/* Social Sign-in Icons Row */}
          <div className="flex items-center justify-between px-2 pt-1">
            <button
              onClick={() => setOauthProvider("sso")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-gray-200 group-hover:border-[#0B5CFF] group-hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-xs">
                <Key className="w-5 h-5 text-gray-800 group-hover:text-[#0B5CFF]" />
              </div>
              <span className="text-xs text-gray-600 font-medium">SSO</span>
            </button>

            <button
              onClick={() => setOauthProvider("apple")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-gray-200 group-hover:border-black group-hover:bg-gray-50 flex items-center justify-center transition-all shadow-xs">
                <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.92.04-2.03.62-2.67 1.37-.56.64-.99 1.68-.86 2.7 1.03.08 2-.47 2.61-1.22z" />
                </svg>
              </div>
              <span className="text-xs text-gray-600 font-medium">Apple</span>
            </button>

            <button
              onClick={() => setOauthProvider("google")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-gray-200 group-hover:border-blue-400 group-hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <span className="text-xs text-gray-600 font-medium">Google</span>
            </button>

            <button
              onClick={() => showToast("Facebook OAuth provider", "info")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-gray-200 group-hover:border-[#1877F2] group-hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-xs">
                <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-xs text-gray-600 font-medium">Facebook</span>
            </button>

            <button
              onClick={() => setOauthProvider("microsoft")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-gray-200 group-hover:border-gray-400 group-hover:bg-gray-50 flex items-center justify-center transition-all shadow-xs">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <span className="bg-[#F25022] w-1.5 h-1.5" />
                  <span className="bg-[#7FBA00] w-1.5 h-1.5" />
                  <span className="bg-[#00A4EF] w-1.5 h-1.5" />
                  <span className="bg-[#FFB900] w-1.5 h-1.5" />
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">Microsoft</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => showToast("Account recovery link sent to your phone/email", "info")}
              className="text-xs font-semibold text-[#0B5CFF] hover:underline"
            >
              Forgot email?
            </button>
          </div>

          {/* Legal and Terms Footer */}
          <div className="pt-8 border-t border-gray-100 text-center space-y-3">
            <p className="text-[11px] text-gray-400 leading-relaxed px-4">
              Zoom is protected by reCAPTCHA and the Google{" "}
              <a href="https://policies.google.com/privacy" className="text-gray-500 underline" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="https://policies.google.com/terms" className="text-gray-500 underline" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </div>
        </div>
      </div>

      {/* OAuth Simulator Modal */}
      <OAuthModal
        isOpen={oauthProvider !== null}
        provider={oauthProvider}
        onClose={() => setOauthProvider(null)}
        onSuccess={handleOAuthSuccess}
      />
    </div>
  );
}
