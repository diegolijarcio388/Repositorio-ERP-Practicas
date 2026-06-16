import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getContainer } from "../../../core/di/container";
import { Button, Input, Toast } from "../../../shared/ui";

export function LoginForm() {
  const auth = useMemo(() => getContainer().auth, []);
  const [email, setEmail] = useState("");
  const [tabletCode, setTabletCode] = useState("");
  const [isTabletLogin, setIsTabletLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const detectTabletLayout = () => {
      const hasTouch = navigator.maxTouchPoints > 0;
      const width = window.innerWidth;
      const shorterSide = Math.min(window.screen.width, window.screen.height);
      setIsTabletLogin(hasTouch && width >= 640 && width < 1180 && shorterSide >= 600);
    };

    detectTabletLayout();
    window.addEventListener("resize", detectTabletLayout);
    return () => window.removeEventListener("resize", detectTabletLayout);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isTabletLogin) {
      if (!tabletCode.trim()) {
        setToast({ message: "El código de trabajador es obligatorio.", tone: "error" });
        return;
      }

      setIsSubmitting(true);
      try {
        await auth.loginWithTabletCode(tabletCode);
        setToast({ message: "Sesión iniciada.", tone: "success" });
        window.location.href = "/control-horario";
      } catch {
        setToast({ message: "No se pudo iniciar sesión con ese código.", tone: "error" });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim()) {
      setToast({ message: "El email es obligatorio.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.login(email);
      setToast({ message: "Sesión iniciada.", tone: "success" });
      window.location.href = "/dashboard";
    } catch {
      setToast({ message: "No se pudo iniciar sesión.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {isTabletLogin ? (
          <>
            <Input
              label="Código de trabajador"
              type="password"
              inputMode="numeric"
              value={tabletCode}
              onChange={(event) => setTabletCode(event.target.value)}
              placeholder="Código"
              required
            />
            <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
              Acceso de tablet: introduce tu código personal para entrar
              directamente a control horario.
            </p>
          </>
        ) : (
          <>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
            <p className="text-xs text-slate-500">
              Roles mock: <strong>admin@example.com</strong> Admin,{" "}
              <strong>responsable@example.com</strong> Responsable.
            </p>
          </>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Entrando..."
            : isTabletLogin
              ? "Entrar a control horario"
              : "Entrar"}
        </Button>
      </form>
      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
