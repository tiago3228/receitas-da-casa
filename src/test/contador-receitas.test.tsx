import { readFileSync } from "node:fs";
import path from "node:path";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Cabecalho } from "@/components/Cabecalho";

// O caderno completo: é daqui que o contador do topo deve tirar o número.
const catalogo = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "public/receitas.json"), "utf8"),
) as unknown[];

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const pagina = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Cabecalho />,
});
const routeTree = rootRoute.addChildren([pagina]);

// Monta o topo dentro de um app de verdade, com o mesmo cache de dados usado pelo site.
function mostrarTopo(receitas: unknown[]) {
  const queryClient = new QueryClient();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => receitas })),
  );
  const router = createRouter({ routeTree, context: { queryClient } });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Contador de receitas no topo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mostra no topo o total real de receitas do caderno", async () => {
    mostrarTopo(catalogo);

    const selo = await screen.findByLabelText(new RegExp(`^${catalogo.length} receitas no app$`));
    // O número sobe de 0 até o total, então damos tempo para a animação terminar.
    await waitFor(() => expect(selo).toHaveTextContent(`${catalogo.length} receitas`), {
      timeout: 3000,
    });
  });

  it("o caderno continua com mais de 500 receitas", () => {
    expect(catalogo.length).toBeGreaterThan(500);
  });

  it("usa o singular quando há só uma receita", async () => {
    mostrarTopo([
      {
        id: "1",
        nome: "Bolo",
        categoria: "Doces, sobremesas e doces de festa",
        imagem: null,
        texto: "x",
      },
    ]);

    await waitFor(
      () => expect(screen.getByLabelText("1 receita no app")).toHaveTextContent("1 receita"),
      {
        timeout: 3000,
      },
    );
  });
});
