import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampoSenha } from "@/components/CampoSenha";

function Demo() {
  const [senha, setSenha] = useState("");
  return <CampoSenha id="senha" value={senha} onChange={setSenha} placeholder="Pelo menos 6 letras" />;
}

const campo = () => screen.getByPlaceholderText("Pelo menos 6 letras") as HTMLInputElement;

describe("olhinho do campo de senha", () => {
  it("começa com a senha escondida", () => {
    render(<Demo />);
    fireEvent.change(campo(), { target: { value: "Km9#vT2melo$w7" } });
    expect(campo().type).toBe("password");
    expect(screen.getByRole("button", { name: "Mostrar a senha" })).toBeInTheDocument();
  });

  it("mostra a senha digitada ao tocar no olhinho", () => {
    render(<Demo />);
    fireEvent.change(campo(), { target: { value: "Km9#vT2melo$w7" } });
    fireEvent.click(screen.getByRole("button", { name: "Mostrar a senha" }));
    expect(campo().type).toBe("text");
    expect(campo().value).toBe("Km9#vT2melo$w7");
    expect(screen.getByRole("button", { name: "Ocultar a senha" })).toBeInTheDocument();
  });

  it("esconde a senha de novo ao tocar outra vez", () => {
    render(<Demo />);
    fireEvent.change(campo(), { target: { value: "Km9#vT2melo$w7" } });
    const botao = screen.getByRole("button", { name: "Mostrar a senha" });
    fireEvent.click(botao);
    expect(campo().type).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar a senha" }));
    expect(campo().type).toBe("password");
  });
});
