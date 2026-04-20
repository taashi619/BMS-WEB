// src/components/TopBar.tsx
import { useState, type ReactElement } from "react";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function TopBar({
  profile,
}: {
  profile: Profile | null;
}): ReactElement {
  const [open, setOpen] = useState(false);

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : "Admin";

  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase()
    : "AD";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 relative">
      <div>
        <p className="text-xs text-text-secondary">Admin console</p>
        <p className="text-sm font-semibold text-text-main">
          Welcome back, {fullName}
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full h-9 w-9 flex items-center justify-center bg-brand/10 text-brand-dark text-sm font-semibold border border-brand/30"
        >
          {initials}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg border border-slate-200 py-1 text-sm">
            <button
              className="w-full text-left px-3 py-2 text-text-main hover:bg-slate-50"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-profile"));
                setOpen(false);
              }}
            >
              Profile
            </button>
            <button
              className="w-full text-left px-3 py-2 text-text-main hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Settings
            </button>
          </div>
        )}
      </div>
    </header>
  );
}