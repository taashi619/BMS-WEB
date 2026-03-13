import { useState, type ReactElement } from "react";

type ComplaintStatus = "NEW" | "IN_REVIEW" | "CLOSED";

interface ComplaintUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ComplaintAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ComplaintItem {
  id: number;
  userId: number;
  adminId: number | null;
  description: string;
  status: ComplaintStatus;
  photoUrl: string | null;
  createdAt: string;
  user: ComplaintUser;
  admin: ComplaintAdmin | null;
}

// ---------- dummy data shaped like API ----------
const initialComplaints: ComplaintItem[] = [
  {
    id: 1,
    userId: 2,
    adminId: null,
    description: "Staff was late to unlock the bicycle stand at 8:30am.",
    status: "NEW",
    photoUrl: null,
    createdAt: "2026-02-02T15:40:10.000Z",
    user: {
      id: 2,
      firstName: "Student",
      lastName: "Two",
      email: "student2@uni.com",
      role: "STUDENT",
    },
    admin: null,
  },
  {
    id: 2,
    userId: 2,
    adminId: null,
    description: "Bicycle chain is broken.",
    status: "NEW",
    photoUrl:
      "https://bms-development-images.s3.us-east-1.amazonaws.com/complaints/example-chain-broken.png",
    createdAt: "2026-02-02T16:14:10.849Z",
    user: {
      id: 2,
      firstName: "Student",
      lastName: "Two",
      email: "student2@uni.com",
      role: "STUDENT",
    },
    admin: null,
  },
  {
    id: 3,
    userId: 5,
    adminId: 1,
    description: "Was charged a fine although I returned the bicycle on time.",
    status: "IN_REVIEW",
    photoUrl: null,
    createdAt: "2026-02-03T09:05:00.000Z",
    user: {
      id: 5,
      firstName: "Liam",
      lastName: "Brown",
      email: "s7654321@uni.com",
      role: "STUDENT",
    },
    admin: {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@uni.com",
    },
  },
  {
    id: 4,
    userId: 7,
    adminId: 1,
    description: "Seat height was stuck; issue already fixed, just feedback.",
    status: "CLOSED",
    photoUrl: null,
    createdAt: "2026-02-01T12:30:00.000Z",
    user: {
      id: 7,
      firstName: "Ayesha",
      lastName: "Singh",
      email: "s1234567@uni.com",
      role: "STUDENT",
    },
    admin: {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@uni.com",
    },
  },
];

// ---------- main page ----------
export default function ComplaintsPage(): ReactElement {
  const [complaints, setComplaints] =
    useState<ComplaintItem[]>(initialComplaints);
  const [statusFilter, setStatusFilter] = useState<
    "" | ComplaintStatus
  >("");
  const [selected, setSelected] = useState<ComplaintItem | null>(null);

  const filtered = complaints.filter((c) =>
    statusFilter ? c.status === statusFilter : true
  );

  const handleStatusChange = (id: number, status: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    if (selected?.id === id) {
      setSelected({ ...selected, status });
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-main">
          Complaints
        </h1>
        <p className="text-sm text-text-secondary">
          Review student complaints and update their status.
        </p>
      </header>

      {/* status filter */}
      <div className="flex gap-3 items-center">
        <span className="text-xs font-semibold text-text-secondary uppercase">
          Filter
        </span>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | ComplaintStatus)
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="IN_REVIEW">In review</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-text-main">C-{c.id}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {c.user.firstName} {c.user.lastName}
                  <span className="block text-xs text-text-secondary">
                    {c.user.email}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary max-w-xs">
                  <span className="line-clamp-2">{c.description}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(c.createdAt)}
                </td>
                <td className="px-4 py-3">{renderStatusBadge(c.status)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                    onClick={() => setSelected(c)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No complaints for this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ComplaintDetailsModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ---------- details modal ----------

interface ComplaintDetailsModalProps {
  complaint: ComplaintItem;
  onClose: () => void;
  onStatusChange: (id: number, status: ComplaintStatus) => void;
}

function ComplaintDetailsModal({
  complaint,
  onClose,
  onStatusChange,
}: ComplaintDetailsModalProps): ReactElement {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              Complaint
            </p>
            <p className="text-base font-semibold text-text-main">
              C-{complaint.id} · {complaint.user.firstName}{" "}
              {complaint.user.lastName}
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
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* status + created */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderStatusBadge(complaint.status)}
              <span className="text-xs text-text-secondary">
                Created {formatDate(complaint.createdAt)}
              </span>
            </div>
            {complaint.admin && (
              <p className="text-xs text-text-secondary">
                Assigned to{" "}
                <span className="font-medium">
                  {complaint.admin.firstName} {complaint.admin.lastName}
                </span>
              </p>
            )}
          </div>

          {/* student info */}
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">
              Student
            </p>
            <p className="text-sm font-medium text-text-main">
              {complaint.user.firstName} {complaint.user.lastName}
            </p>
            <p className="text-xs text-text-secondary">
              {complaint.user.email}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Role: {complaint.user.role}
            </p>
          </div>

          {/* description */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Description
            </p>
            <p className="text-sm text-text-main whitespace-pre-line">
              {complaint.description}
            </p>
          </div>

          {/* photo if exists */}
          {complaint.photoUrl && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                Attached photo
              </p>
              <img
                src={complaint.photoUrl}
                alt="Complaint evidence"
                className="max-h-56 rounded-lg border border-slate-200 object-contain"
              />
            </div>
          )}
        </div>

        {/* footer: change status */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Set status:</span>
            <select
              value={complaint.status}
              onChange={(e) =>
                onStatusChange(
                  complaint.id,
                  e.target.value as ComplaintStatus
                )
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In review</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function renderStatusBadge(status: ComplaintStatus): ReactElement {
  if (status === "NEW") {
    return (
      <span className="inline-flex rounded-full bg-status-booked/10 px-2.5 py-0.5 text-xs font-medium text-status-booked">
        New
      </span>
    );
  }
  if (status === "IN_REVIEW") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        In review
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-status-available/10 px-2.5 py-0.5 text-xs font-medium text-status-available">
      Closed
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
