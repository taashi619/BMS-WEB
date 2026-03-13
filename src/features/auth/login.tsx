import { useState, type SyntheticEvent  } from "react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    // call adminLogin here
  };
  return (
    <div className="min-h-screen w-screen bg-slate-100 flex items-center justify-center">
      <img
        src="/src/assets/react.svg"
        alt=""
        className="pointer-events-none absolute -right-32 -bottom-24 w-[520px] opacity-10"
      />
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold text-text-main mb-2">
          Admin Console
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Sign in to manage bicycles, bookings and users.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-main">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-white  outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="admin@example.com"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-text-secondary">
          For security reasons, access is restricted to authorized
          administrators only.
        </p>
      </div>
    </div>
  );
}

