import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Sidebar from "../components/Sidebar";
import { fallback, zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const sidebarSearchSchema = z.object({
  q: fallback(z.string().optional(), ``),
})

export const Route = createRootRoute({
  validateSearch: zodValidator(sidebarSearchSchema),
  component: () => (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
});
