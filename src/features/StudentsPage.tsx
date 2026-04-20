import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";

type StudentRow = {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalFines: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [onlyWithFines, setOnlyWithFines] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/students", {
        params: {
          withFinesOnly: onlyWithFines,
          search: search || undefined,
        },
      });
      setStudents(res.data.students);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  }, [onlyWithFines, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-text-main">Students</h1>
          <p className="text-sm text-text-secondary">
            Manage student accounts and view their booking history.
          </p>
        </header>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search by student ID or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              onClick={load}
              className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-text-main hover:bg-slate-50"
            >
              Search
            </button>
            <label className="ml-4 flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={onlyWithFines}
                onChange={(e) => setOnlyWithFines(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Show only students with fines
            </label>
          </div>

          {/* ADD STUDENT BUTTON (replaces Export list) */}
          <button
            onClick={() => setShowAddStudent(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90"
          >
            Add student
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Active bookings</th>
                <th className="px-4 py-3">Fines</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-text-secondary"
                  >
                    Loading students…
                  </td>
                </tr>
              )}

              {!loading &&
                students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-text-main">
                      {s.studentId}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {/* hook up activeBookings when backend is ready */}
                      0
                    </td>
                    <td className="px-4 py-3 text-status-booked">
                      £{Number(s.totalFines).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-xs font-semibold text-brand hover:text-brand-dark"
                        onClick={() => setSelected(s)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && students.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-text-secondary"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDE PANEL FOR PROFILE */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">
                {selected.firstName} {selected.lastName}
              </h2>
              <p className="text-xs text-text-secondary">
                Student ID: {selected.studentId}
              </p>
            </div>
            <button
              className="text-xs text-text-secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
            <p>
              <span className="font-semibold text-text-main">Email: </span>
              <span className="text-text-secondary">{selected.email}</span>
            </p>
            <p>
              <span className="font-semibold text-text-main">Fines: </span>
              <span className="text-status-booked">
                £{Number(selected.totalFines).toFixed(2)}
              </span>
            </p>
            {/* later: residential flag, active bookings list, etc. */}
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onCreated={load}
        />
      )}
    </>
  );
}

/* ---------- AddStudentModal component ---------- */

function AddStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    indexNo: "",
    faculty: "",
    roomNumber: "",
    phone: "",
    isResidential: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/profile/add/student", form); // your existing endpoint
      onCreated(); // reload list
      onClose();   // close modal
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create student";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-text-main">
            Add student
          </h2>
          <button
            className="text-sm text-text-secondary hover:text-text-main"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                First name
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Last name
              </label>
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Student ID / Index No.
              </label>
              <input
                value={form.indexNo}
                onChange={(e) =>
                  setForm({ ...form, indexNo: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Faculty
              </label>
              <input
                value={form.faculty}
                onChange={(e) =>
                  setForm({ ...form, faculty: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Room number
              </label>
              <input
                value={form.roomNumber}
                onChange={(e) =>
                  setForm({ ...form, roomNumber: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isResidential"
              type="checkbox"
              checked={form.isResidential}
              onChange={(e) =>
                setForm({ ...form, isResidential: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <label
              htmlFor="isResidential"
              className="text-xs text-text-secondary"
            >
              Residential student
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-text-secondary hover:bg-slate-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}