import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
};

export function ImagemReceita({
  src,
  alt,
  className = "aspect-[4/3]",
  imageClassName = "",
  loading = "lazy",
}: Props) {
  const [urlComFalha, setUrlComFalha] = useState<string | null>(null);

  if (!src || urlComFalha === src) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-secondary`}
        role="img"
        aria-label={`Imagem não disponível: ${alt}`}
      >
        <UtensilsCrossed className="h-12 w-12 text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setUrlComFalha(src)}
      className={`${className} w-full object-cover ${imageClassName}`}
    />
  );
}
