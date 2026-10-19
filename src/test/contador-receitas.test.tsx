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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cabecalho } from "@/components/Cabecalho";

// O caderno completo: é daqui que o contador do topo deve tirar o número.
const catalogo = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "public/receitas.json"), "utf8"),
) as unknown[];

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const pagina = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <Cabecalho /> });
const routeTree = rootRoute.addChildren([pagina]);

describe("Contador de receitas no topo", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => catalogo })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mostra no topo o total real de receitas do caderno", async () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    render(
      <QueryClientProvider client={router.options.context.queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    const selo = await screen.findByLabelText(new RegExp(`^${catalogo.length} receitas no app$`));
    expect(selo).toHaveTextContent(`${catalogo.length} receitas`);
  });

  it("o caderno continua com mais de 500 receitas", () => {
    expect(catalogo.length).toBeGreaterThan(500);
  });

  it("usa o singular quando há só uma receita", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => [{ id: "1", nome: "Bolo", categoria: "Doces", imagem: null, texto: "x" }] })),
    );
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    render(
      <QueryClientProvider client={router.options.context.queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText("1 receita no app")).toHaveTextContent("1 receita"));
  });
});
