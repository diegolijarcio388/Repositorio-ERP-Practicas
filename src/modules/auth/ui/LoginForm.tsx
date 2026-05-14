import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getContainer } from "../../../core/di/container";
import { Button, Input, Toast } from "../../../shared/ui";

export function LoginForm() {
  const auth = useMemo(() => getContainer().auth, []);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setToast({ message: "El email es obligatorio.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.login(email);
      setToast({ message: "Sesion iniciada.", tone: "success" });
      window.location.href = "/dashboard";
    } catch {
      setToast({ message: "No se pudo iniciar sesion.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
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
