import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Sidebar from "../components/Sidebar";
import { Resource } from "sst";

export const Route = createRootRoute({
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
