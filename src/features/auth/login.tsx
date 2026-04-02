import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, role } = res.data;

      if (!token) {
        throw new Error("No token returned from server");
      }

      localStorage.setItem("bmsAdminToken", token);
      localStorage.setItem("bmsAdminRole", role ?? "");

      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex items-center justify-center relative">
      <img
        src="/src/assets/react.svg"
        alt=""
        className="pointer-events-none absolute -right-32 -bottom-24 w-[520px] opacity-10"
      />
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 relative z-10">
        <h1 className="text-2xl font-bold text-text-main mb-2">
          Admin Console
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Sign in to manage bicycles, bookings and users.
        </p>

        {error && (
          <p className="mb-3 text-xs font-medium text-status-booked">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-main">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="admin@bms.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-main">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-text-secondary">
          For security reasons, access is restricted to authorized administrators
          only.
        </p>
      </div>
    </div>
  );
}
