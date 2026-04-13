import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { api } from "../services/api";

// ---- types ----

type AuditAction = "APPROVE_RETURN" | "UNDO_CHARGE" | "STATUS_CHANGE";

interface AuditLogItem {
  id: number;
  actionType: AuditAction;
  reason: string | null;
  timestamp: string;
  adminName: string;
  bookingId: number;
  studentIndex: string | null;
  studentName: string | null;
  studentFaculty: string | null;
  studentRoom: string | null;
  studentTotalFines: string | null; // decimal from backend
  fineAmount: string;               // current fine for that booking (string)
  previousFineAmount?: string | null;
  newFineAmount?: string | null;
}

// ---------- main page ----------

export default function FinesAuditPage(): ReactElement {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState<"" | AuditAction>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [changeFilter, setChangeFilter] = useState<
    "" | "INCREASE" | "DECREASE"
  >("");
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function reloadAuditLogs() {
    try {
      setLoading(true);
      const res = await api.get("/audit/admin/audit-logs");
      const data = (res.data.logs ?? []) as Array<any>;

      const mapped: AuditLogItem[] = data.map((l) => ({
        id: l.id,
        actionType: l.actionType as AuditAction,
        reason: l.reason ?? null,
        timestamp: l.timestamp,
        adminName: l.adminName,
        bookingId: l.bookingId,
        studentIndex: l.studentIndex ?? null,
        studentName: l.studentName ?? null,
        studentFaculty: l.studentFaculty ?? null,
        studentRoom: l.studentRoom ?? null,
        studentTotalFines: l.studentTotalFines ?? null,
        fineAmount: l.fineAmount?.toString() ?? "0",
        previousFineAmount: l.previousFineAmount?.toString() ?? null,
        newFineAmount: l.newFineAmount?.toString() ?? null,
      }));

      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAuditLogs();
  }, []);

  // quick stats (still based on newFineAmount or fineAmount)
  const stats = useMemo(() => {
    const adjustments = logs.filter((l) => l.actionType === "UNDO_CHARGE");
    const totalAdjusted = adjustments.reduce((sum, l) => {
      const v = l.newFineAmount != null ? Number(l.newFineAmount) : Number(l.fineAmount);
      return Number.isFinite(v) ? sum + v : sum;
    }, 0);
    const studentSet = new Set(
      adjustments
        .map((l) => l.studentIndex || l.studentName)
        .filter(Boolean) as string[]
    );

    return {
      count: adjustments.length,
      totalAdjusted,
      studentCount: studentSet.size,
    };
  }, [logs]);

  const filtered = logs.filter((log) => {
    const matchesAction = actionFilter ? log.actionType === actionFilter : true;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = (() => {
      if (!term) return true;
      const inStudent =
        (log.studentIndex ?? "").toLowerCase().includes(term) ||
        (log.studentName ?? "").toLowerCase().includes(term);
      const inBooking = log.bookingId.toString().includes(term);
      return inStudent || inBooking;
    })();

    const matchesChange = (() => {
      if (!changeFilter || log.actionType !== "UNDO_CHARGE") return true;
      const prev = log.previousFineAmount != null ? Number(log.previousFineAmount) : NaN;
      const next = log.newFineAmount != null ? Number(log.newFineAmount) : NaN;
      if (!Number.isFinite(prev) || !Number.isFinite(next)) return true;
      const diff = next - prev;
      if (changeFilter === "INCREASE") return diff > 0;
      if (changeFilter === "DECREASE") return diff <= 0;
      return true;
    })();

    return matchesAction && matchesSearch && matchesChange;
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-main">
            Fines & audit
          </h1>
          <p className="text-sm text-text-secondary">
            See fine adjustments and other actions that affect charges or
            approvals.
          </p>
        </div>

        <button
          onClick={reloadAuditLogs}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          label="Fine adjustments"
          value={stats.count.toString()}
          helper="Logged UNDO_CHARGE entries"
        />
        <SummaryCard
          label="Total adjusted fines"
          value={`£${stats.totalAdjusted.toFixed(2)}`}
          helper="Current fine values after adjustments"
        />
        <SummaryCard
          label="Students affected"
          value={stats.studentCount.toString()}
          helper="Distinct students with adjustments"
        />
      </div>

      {/* filters row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase">
              Action
            </span>
            <select
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value as "" | AuditAction)
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All actions</option>
              <option value="UNDO_CHARGE">Fine adjustments</option>
              <option value="APPROVE_RETURN">Return approvals</option>
              <option value="STATUS_CHANGE">Status changes</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase">
              Change
            </span>
            <select
              value={changeFilter}
              onChange={(e) =>
                setChangeFilter(e.target.value as "" | "INCREASE" | "DECREASE")
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All</option>
              <option value="DECREASE">Reductions</option>
              <option value="INCREASE">Increases</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student or booking ID..."
            className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Fine (£)</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                onClick={() => setSelected(log)}
              >
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(log.timestamp)}
                </td>
                <td className="px-4 py-3">{renderActionBadge(log.actionType)}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {log.studentName ?? "-"}
                  {log.studentIndex && (
                    <span className="block text-xs text-text-secondary">
                      {log.studentIndex}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Bkg-{log.bookingId}
                </td>
                <td className="px-4 py-3 text-text-main">
                  <div className="flex flex-col">
                    <span>£{Number(log.fineAmount).toFixed(2)}</span>
                    {log.studentTotalFines && (
                      <span className="text-xs text-text-secondary">
                        Total for student: £{log.studentTotalFines}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {log.adminName}
                </td>
                <td className="px-4 py-3 text-text-secondary max-w-sm">
                  <span className="line-clamp-2">
                    {log.reason || "—"}
                  </span>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No audit entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <AuditDetailsDrawer
          log={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ---------- details drawer (read‑only) ----------

interface AuditDetailsDrawerProps {
  log: AuditLogItem;
  onClose: () => void;
}

function AuditDetailsDrawer({
  log,
  onClose,
}: AuditDetailsDrawerProps): ReactElement {
  const prev = log.previousFineAmount != null ? Number(log.previousFineAmount) : null;
  const next = log.newFineAmount != null ? Number(log.newFineAmount) : null;
  const diff =
    prev != null && next != null ? Number((next - prev).toFixed(2)) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
      <div className="h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              Audit entry
            </p>
            <p className="text-base font-semibold text-text-main">
              #{log.id} · Bkg-{log.bookingId}
            </p>
          </div>
          <button
            className="text-sm text-text-secondary hover:text-text-main"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Time
            </p>
            <p className="text-sm text-text-main">
              {formatDate(log.timestamp)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Action
            </p>
            {renderActionBadge(log.actionType)}
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">
              Student
            </p>
            <p className="text-sm font-medium text-text-main">
              {log.studentName ?? "-"}
            </p>
            {log.studentIndex && (
              <p className="text-xs text-text-secondary">
                Index: {log.studentIndex}
              </p>
            )}
            {log.studentFaculty && (
              <p className="mt-1 text-xs text-text-secondary">
                Faculty: {log.studentFaculty}
              </p>
            )}
            {log.studentRoom && (
              <p className="text-xs text-text-secondary">
                Room: {log.studentRoom}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Fine
            </p>
            <p className="text-sm text-text-main">
              Current fine: £{Number(log.fineAmount).toFixed(2)}
            </p>

            {prev != null && next != null && (
              <div className="mt-1 text-xs text-text-secondary space-y-0.5">
                <p>Previous fine: £{prev.toFixed(2)}</p>
                <p>New fine: £{next.toFixed(2)}</p>
                <p>
                  Change:{" "}
                  <span className={diff != null && diff < 0 ? "text-emerald-700" : "text-amber-700"}>
                    {diff != null && diff > 0 ? "+" : ""}
                    £{diff?.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {log.studentTotalFines && (
              <p className="mt-1 text-xs text-text-secondary">
                Total for student after this change: £{log.studentTotalFines}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Admin
            </p>
            <p className="text-sm text-text-main">{log.adminName}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Reason
            </p>
            <p className="text-sm text-text-main whitespace-pre-line">
              {log.reason || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- small components / helpers ----------

interface SummaryCardProps {
  label: string;
  value: string;
  helper?: string;
}

function SummaryCard({ label, value, helper }: SummaryCardProps): ReactElement {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold text-text-secondary uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-text-main">
        {value}
      </p>
      {helper && (
        <p className="mt-0.5 text-xs text-text-secondary">
          {helper}
        </p>
      )}
    </div>
  );
}

function renderActionBadge(action: AuditAction): ReactElement {
  if (action === "UNDO_CHARGE") {
    return (
      <span className="inline-flex rounded-full bg-status-booked/10 px-2.5 py-0.5 text-xs font-medium text-status-booked">
        Fine adjusted
      </span>
    );
  }
  if (action === "APPROVE_RETURN") {
    return (
      <span className="inline-flex rounded-full bg-status-available/10 px-2.5 py-0.5 text-xs font-medium text-status-available">
        Return approved
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      Status change
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}