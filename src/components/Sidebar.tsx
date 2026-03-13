import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/bicycles", label: "Bicycles" },
  { to: "/admin/requests", label: "Bookings / Returns" },
  { to: "/admin/maintenance", label: "Maintenance" },
  { to: "/admin/complaints", label: "Complaints" },
  { to: "/admin/students", label: "Students" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="h-9 w-9 rounded-full bg-brand-dark flex items-center justify-center text-white font-semibold">
          B
        </div>
        <div className="ml-3">
          <p className="text-sm font-semibold text-text-main">BikeShare Admin</p>
          <p className="text-xs text-text-secondary">Campus management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "text-text-secondary hover:bg-slate-100",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
