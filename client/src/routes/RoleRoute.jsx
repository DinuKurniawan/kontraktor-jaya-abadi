import { ShieldAlert } from "lucide-react";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", EDITOR: "Editor" };

// Pembatas peran: halaman admin tertentu hanya untuk role tertentu
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  const allowed = roles.includes(user?.role);

  if (allowed) return children;

  return (
    <Card className="mx-auto max-w-md">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <ShieldAlert size={26} />
        </div>
        <h2 className="font-display text-lg font-semibold text-text">Akses ditolak</h2>
        <p className="max-w-xs text-sm text-text-muted">
          Halaman ini hanya untuk {roles.map((r) => ROLE_LABEL[r] ?? r).join(" / ")}.
        </p>
        <Button variant="soft" onClick={() => window.history.back()}>
          Kembali
        </Button>
      </div>
    </Card>
  );
}
