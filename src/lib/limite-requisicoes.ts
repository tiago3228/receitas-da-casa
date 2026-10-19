type Janela = { inicio: number; requisicoes: number };

const JANELA_MS = 60_000;
const MAX_REQUISICOES = 10;
const MAX_ORIGENS = 2_048;
const janelas = new Map<string, Janela>();

/** Limite em memória por instância; use apenas uma origem confiável ou um id autenticado. */
export function excedeuLimite(chaveEntrada: string, agora = Date.now()): boolean {
  const chave = chaveEntrada.trim();
  if (!chave) return false;

  const janela = janelas.get(chave);
  if (!janela || agora - janela.inicio >= JANELA_MS || agora < janela.inicio) {
    if (janelas.size >= MAX_ORIGENS && !janela) {
      for (const [origem, registro] of janelas) {
        if (agora - registro.inicio >= JANELA_MS || agora < registro.inicio) janelas.delete(origem);
      }
      if (janelas.size >= MAX_ORIGENS) {
        const maisAntiga = janelas.keys().next().value;
        if (maisAntiga) janelas.delete(maisAntiga);
      }
    }
    janelas.set(chave, { inicio: agora, requisicoes: 1 });
    return false;
  }

  if (janela.requisicoes >= MAX_REQUISICOES) return true;
  janela.requisicoes += 1;
  return false;
}
