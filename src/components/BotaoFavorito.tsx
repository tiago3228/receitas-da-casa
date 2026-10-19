import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";

type Props = {
  ativo: boolean;
  aoAlternar: () => void;
  idUsuario?: string | undefined;
  disabled?: boolean;
  compacto?: boolean;
};

export function BotaoFavorito({
  ativo,
  aoAlternar,
  idUsuario,
  disabled = false,
  compacto = false,
}: Props) {
  const irPara = useNavigate();
  return (
    <button
      type="button"
      aria-label={
        idUsuario
          ? ativo
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
          : "Entre para favoritar"
      }
      aria-pressed={ativo}
      title={
        idUsuario
          ? ativo
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
          : "Entre para favoritar"
      }
      disabled={disabled}
      onClick={() => {
        if (!idUsuario) {
          irPara({ to: "/auth", search: { redirect: "/favoritos" } });
          return;
        }
        aoAlternar();
      }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 font-semibold transition hover:bg-secondary disabled:cursor-wait disabled:opacity-60 ${
        ativo
          ? "border-destructive text-destructive"
          : "border-border text-foreground hover:border-primary"
      } ${compacto ? "h-12 w-12 p-0" : ""}`}
    >
      <Heart className="h-5 w-5" fill={ativo ? "currentColor" : "none"} aria-hidden />
      {!compacto && <span>{ativo ? "Salva" : "Favoritar"}</span>}
    </button>
  );
}
