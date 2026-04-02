import { useEffect, useState, type ReactElement } from "react";
import { api } from "../services/api";

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

export default function MaintenancePage(): ReactElement {
  const [queue, setQueue] = useState<MaintenanceItem[]>([]);
  const [selected, setSelected] = useState<MaintenanceItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | MaintenanceStatus>("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/maintenance/queue");
        const data = (res.data.queue ?? []) as Array<any>;

        const mapped: MaintenanceItem[] = data.map((m) => ({
          id: m.id,
          userId: m.userId,
          bicycleId: m.bicycleId,
          description: m.description,
          status: m.status as MaintenanceStatus,
          reportedDate: m.reportedDate,
          resolvedBy: m.resolvedBy ?? null,
          photoUrl: m.photoUrl ?? null,
          user: m.user,
          bicycle: m.bicycle,
        }));

        setQueue(mapped);
      } catch (err) {
        console.error("Failed to load maintenance queue", err);
      }
    }

    load();
  }, []);

  const filteredQueue = queue.filter((item) =>
    statusFilter ? item.status === statusFilter : true
  );

  const handleDelete = (id: number) => {
    // later: call backend DELETE/PATCH for real delete
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleUpdateStatus = async (
  id: number,
  nextStatus: MaintenanceStatus
) => {
  try {
    await api.patch(`/maintenance/${id}/status`, {
      status: nextStatus,
    });

    // use nextStatus instead of updated.status
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              // keep resolvedBy only when moving to RESOLVED;
              // otherwise clear it
              resolvedBy:
                nextStatus === "RESOLVED" ? item.resolvedBy : null,
            }
          : item
      )
    );

    // no need to keep selected in sync if we close
    setSelected(null);
  } catch (err) {
    console.error("Failed to update maintenance status", err);
  }
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

      {/* status filter */}
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

      {/* table */}
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
                  {item.bicycle?.bicycleNumber ?? item.bicycleId}
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
                <td className="px-4 py-3">
                  {renderStatusBadge(item.status)}
                </td>
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
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

// ----- Details modal -----

interface DetailsModalProps {
  item: MaintenanceItem;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, nextStatus: MaintenanceStatus) => void;
}

function DetailsModal({
  item,
  onClose,
  onDelete,
  onUpdateStatus,
}: DetailsModalProps): ReactElement {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus>(
    item.status
  );
  // useEffect(() => {
  //   setSelectedStatus(item.status);
  // }, [item.status]);
  const canDelete = item.status === "RESOLVED";

  const handleSaveStatus = () => {
    if (selectedStatus !== item.status) {
      onUpdateStatus(item.id, selectedStatus);
    }
  };

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
            <div className="flex items-center gap-3">
              {renderStatusBadge(item.status)}
              <span className="text-xs text-text-secondary">
                Reported {formatDate(item.reportedDate)}
              </span>

              {/* status dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as MaintenanceStatus)
                }
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
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
          <button
            onClick={handleSaveStatus}
            disabled={selectedStatus === item.status}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed ${selectedStatus === "OPEN"
                ? "bg-status-booked hover:bg-status-booked/90"
                : selectedStatus === "IN_PROGRESS"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-status-available hover:bg-status-available/90"
              }`}
          >
            Save status
          </button>
          <button
            hidden={!canDelete}
            onClick={() => onDelete(item.id)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-status-booked text-status-booked hover:bg-status-booked/5"
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