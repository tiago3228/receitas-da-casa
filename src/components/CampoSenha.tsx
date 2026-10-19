import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete?: "new-password" | "current-password";
  placeholder?: string;
  className?: string;
};

/** Campo de senha com o "olhinho" para mostrar ou ocultar o que foi digitado. */
export function CampoSenha({
  id,
  value,
  onChange,
  autoComplete = "new-password",
  placeholder,
  className = "",
}: Props) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className={`relative ${className}`.trim()}>
      <input
        id={id}
        type={mostrando ? "text" : "password"}
        required
        className="h-14 w-full rounded-xl border-2 border-input bg-card pl-4 pr-14 text-lg outline-none focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setMostrando((v) => !v)}
        aria-pressed={mostrando}
        aria-label={mostrando ? "Ocultar a senha" : "Mostrar a senha"}
        title={mostrando ? "Ocultar a senha" : "Mostrar a senha"}
        className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {mostrando ? <EyeOff className="h-6 w-6" aria-hidden /> : <Eye className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
