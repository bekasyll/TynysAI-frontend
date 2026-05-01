import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Mail, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import Button from "../../components/ui/Button";
import logoIcon from "../../assets/TynysAI-logo.png";
import { setLanguage } from "../../i18n";
import { useToast } from "../../components/ui/Toast";
import { authApi } from "../../api/auth.api";
import type { ForgotPasswordRequest } from "../../api/auth.api";
import { getApiError } from "../../lib/api-error";

const LANGS = ["ru", "kk", "en"] as const;

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const { error: toastError } = useToast();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>();

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: () => setSent(true),
    onError: (e) =>
      toastError(getApiError(e) ?? t("auth.forgot_password_error")),
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 py-6 sm:p-4"
      style={{
        background:
          "linear-gradient(135deg, #0C1A2E 0%, #0E2A45 50%, #0C2030 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={logoIcon}
              alt="TynysAI"
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />
            <span className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
              TynysAI
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">
            {t("auth.subtitle")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-50 p-3">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {t("auth.forgot_password_title")}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("auth.forgot_password_sent")}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium text-sm"
              >
                <ArrowLeft size={16} />
                {t("auth.forgot_password_back")}
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((d) =>
                mutation.mutate({ email: d.email.trim() }),
              )}
              className="space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {t("auth.forgot_password_title")}
              </h2>
              <p className="text-sm text-gray-500 -mt-2">
                {t("auth.forgot_password_subtitle")}
              </p>

              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    inputMode="email"
                    className={`form-input pl-9 ${errors.email ? "border-red-400" : ""}`}
                    placeholder={t("auth.placeholder_email_login")}
                    {...register("email", {
                      required: t("common.required"),
                      pattern: {
                        value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                        message: t("auth.invalid_email"),
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={mutation.isPending}
                icon={<Send size={16} />}
              >
                {t("auth.forgot_password_btn")}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 pt-1"
              >
                <ArrowLeft size={14} />
                {t("auth.forgot_password_back")}
              </Link>
            </form>
          )}
        </div>

        <div className="flex justify-center mt-5">
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {LANGS.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  i18n.language === lang
                    ? "bg-white text-gray-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
