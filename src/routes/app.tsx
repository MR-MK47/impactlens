import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { requireOrg } from "../lib/guards";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    await requireOrg();
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell title="">
      <Outlet />
    </AppShell>
  );
}
