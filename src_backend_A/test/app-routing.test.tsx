import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

declare const require: (id: string) => any;

function loadRouteTree(): any {
  const candidates = [
    "../src/routeTree.gen",
    "../src/routeTree",
    "../src/routes/routeTree.gen",
    "../src/routes/routeTree",
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate) as { routeTree?: any };
      if (mod?.routeTree) {
        return mod.routeTree;
      }
    } catch {
      // Try the next plausible location for the generated route tree.
    }
  }

  throw new Error("Unable to locate the generated routeTree export for tests.");
}

const routeTree: any = loadRouteTree();

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
