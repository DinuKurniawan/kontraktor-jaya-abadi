import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";

// Kerangka halaman admin: sidebar tetap di desktop, drawer di mobile
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="lg:pl-[18rem]">
        <AdminTopbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="px-4 pb-10 pt-2 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
