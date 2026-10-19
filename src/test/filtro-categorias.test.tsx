import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Lista } from "@/routes/receitas.index";

// Catálogo pequeno e controlado: duas categorias, para conferir o filtro.
const catalogo = [
  { id: "1", nome: "Bolo de cenoura", categoria: "Bolos, tortas e cupcakes", imagem: null, texto: "cenoura" },
  { id: "2", nome: "Suco de laranja", categoria: "Bebidas", imagem: null, texto: "laranja" },
  { id: "3", nome: "Torta de frango", categoria: "Bolos, tortas e cupcakes", imagem: null, texto: "frango" },
];

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const pagina = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Lista });
const routeTree = rootRoute.addChildren([pagina]);

function mostrarLista(receitas: unknown[]) {
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

const painel = () => document.getElementById("painel-categorias");

describe("Filtro de categorias na página Receitas", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("começa fechado, sem mostrar as categorias", async () => {
    mostrarLista(catalogo);

    // A lista de receitas aparece, mas o painel de categorias não.
    await screen.findByText("3 receitas encontradas");
    expect(painel()).toBeNull();
  });

  it("abre as categorias ao clicar", async () => {
    mostrarLista(catalogo);
    await screen.findByText("3 receitas encontradas");

    fireEvent.click(screen.getByRole("button", { name: "Categorias" }));

    await waitFor(() => expect(painel()).not.toBeNull());
    expect(screen.getByRole("button", { name: /^Bebidas/ })).toBeInTheDocument();
  });

  it("filtra, fecha o painel e mostra só as receitas da categoria", async () => {
    mostrarLista(catalogo);
    await screen.findByText("3 receitas encontradas");

    fireEvent.click(screen.getByRole("button", { name: "Categorias" }));
    await waitFor(() => expect(painel()).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /^Bebidas/ }));

    await waitFor(() => expect(painel()).toBeNull());
    await screen.findByText("1 receita encontrada");
    expect(screen.getByText("Suco de laranja")).toBeInTheDocument();
    expect(screen.queryByText("Bolo de cenoura")).not.toBeInTheDocument();
  });
});
