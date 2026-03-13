import { useState, type ReactElement } from "react";

type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

interface MaintenanceUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface MaintenanceBicycle {
  id: number;
  bicycleNumber: string;
  status: string;
}

interface MaintenanceItem {
  id: number;
  userId: number;
  bicycleId: number;
  description: string;
  status: MaintenanceStatus;
  reportedDate: string;
  resolvedBy: string | null;
  photoUrl: string | null;
  user: MaintenanceUser;
  bicycle: MaintenanceBicycle;
}

const initialQueue: MaintenanceItem[] = [
  {
    id: 6,
    userId: 2,
    bicycleId: 1,
    description: "Rear tire puncture near library stand.",
    status: "OPEN",
    reportedDate: "2026-02-12T19:09:08.378Z",
    resolvedBy: null,
    photoUrl:
      "https://bms-development-images.s3.us-east-1.amazonaws.com/maintenance/example-flat-tyre.png",
    user: {
      id: 2,
      firstName: "Student",
      lastName: "Two",
      email: "student2@uni.com",
      role: "STUDENT",
    },
    bicycle: {
      id: 1,
      bicycleNumber: "B001",
      status: "AVAILABLE",
    },
  },
  {
    id: 7,
    userId: 3,
    bicycleId: 4,
    description: "Front brake feels very loose when going downhill.",
    status: "IN_PROGRESS",
    reportedDate: "2026-02-13T08:21:45.000Z",
    resolvedBy: null,
    photoUrl: null,
    user: {
      id: 3,
      firstName: "Ayesha",
      lastName: "Singh",
      email: "s1234567@uni.com",
      role: "STUDENT",
    },
    bicycle: {
      id: 4,
      bicycleNumber: "B014",
      status: "MAINTENANCE",
    },
  },
  {
    id: 8,
    userId: 5,
    bicycleId: 9,
    description: "Gear shifter fixed and chain re‑lubed.",
    status: "RESOLVED",
    reportedDate: "2026-02-10T11:03:00.000Z",
    resolvedBy: "tech01",
    photoUrl: null,
    user: {
      id: 5,
      firstName: "Liam",
      lastName: "Brown",
      email: "s7654321@uni.com",
      role: "STUDENT",
    },
    bicycle: {
      id: 9,
      bicycleNumber: "B027",
      status: "AVAILABLE",
    },
  },
];

export default function MaintenancePage(): ReactElement {
  const [queue, setQueue] = useState<MaintenanceItem[]>(initialQueue);
  const [selected, setSelected] = useState<MaintenanceItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | MaintenanceStatus>("");

  const filteredQueue = queue.filter((item) =>
    statusFilter ? item.status === statusFilter : true
  );

  const handleDelete = (id: number) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-main">
          Maintenance queue
        </h1>
        <p className="text-sm text-text-secondary">
          Issues reported by students for bicycles currently in use.
        </p>
      </header>

      {/* status filter only */}
      <div className="flex gap-3 items-center">
        <span className="text-xs font-semibold text-text-secondary uppercase">
          Filter
        </span>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | MaintenanceStatus)
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Bicycle</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Reported</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-text-main">MT-{item.id}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {item.bicycle.bicycleNumber}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {item.user.firstName} {item.user.lastName}
                  <span className="block text-xs text-text-secondary">
                    {item.user.email}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary max-w-xs">
                  <span className="line-clamp-2">{item.description}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(item.reportedDate)}
                </td>
                <td className="px-4 py-3">{renderStatusBadge(item.status)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                    onClick={() => setSelected(item)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredQueue.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No maintenance tickets for this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <DetailsModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ----- Details modal (same as before, delete only here) -----

interface DetailsModalProps {
  item: MaintenanceItem;
  onClose: () => void;
  onDelete: (id: number) => void;
}

function DetailsModal({
  item,
  onClose,
  onDelete,
}: DetailsModalProps): ReactElement {
  const canDelete = item.status === "RESOLVED";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              Ticket
            </p>
            <p className="text-base font-semibold text-text-main">
              MT-{item.id} · {item.bicycle.bicycleNumber}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderStatusBadge(item.status)}
              <span className="text-xs text-text-secondary">
                Reported {formatDate(item.reportedDate)}
              </span>
            </div>
            {item.resolvedBy && (
              <p className="text-xs text-text-secondary">
                Resolved by{" "}
                <span className="font-medium">{item.resolvedBy}</span>
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-text-secondary uppercase">
                Student
              </p>
              <p className="text-sm font-medium text-text-main">
                {item.user.firstName} {item.user.lastName}
              </p>
              <p className="text-xs text-text-secondary">{item.user.email}</p>
              <p className="mt-1 text-xs text-text-secondary">
                Role: {item.user.role}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-text-secondary uppercase">
                Bicycle
              </p>
              <p className="text-sm font-medium text-text-main">
                {item.bicycle.bicycleNumber}
              </p>
              <p className="text-xs text-text-secondary">
                Current status: {item.bicycle.status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Description
            </p>
            <p className="text-sm text-text-main whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {item.photoUrl && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                Attached photo
              </p>
              <img
                src={item.photoUrl}
                alt="Reported issue"
                className="max-h-56 rounded-lg border border-slate-200 object-contain"
              />
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50"
          >
            Close
          </button>
          <button hidden = {canDelete} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
            Update status
          </button>
          <button
            hidden={!canDelete}
            onClick={() => onDelete(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${
              canDelete
                ? "border-status-booked text-status-booked hover:bg-status-booked/5"
                : "border-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            Delete ticket
          </button>
        </div>
      </div>
    </div>
  );
}

// helpers

function renderStatusBadge(status: MaintenanceStatus): ReactElement {
  if (status === "OPEN") {
    return (
      <span className="inline-flex rounded-full bg-status-booked/10 px-2.5 py-0.5 text-xs font-medium text-status-booked">
        Open
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        In progress
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-status-available/10 px-2.5 py-0.5 text-xs font-medium text-status-available">
      Resolved
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
 