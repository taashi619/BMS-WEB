import { useEffect, useState, type ReactElement } from "react";
import { api } from "../services/api";

type BikeStatus = "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "IN_USE";

interface Bicycle {
  id: number;
  bicycleNumber: string;
  status: BikeStatus;
  lastMaintenanceDate: string | null;
  isActive: boolean;
  bookings: unknown[];
}

export default function BikesPage(): ReactElement {
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | BikeStatus>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bicycle | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/bicycles/all");
        const data = (res.data ?? []) as Array<{
          id: number;
          bicycleNumber: string;
          status: "AVAILABLE" | "BOOKED" | "UNDER_MAINTENANCE" |"IN_USE"| string;
          lastMaintenanceDate: string | null;
          isActive: boolean;
          bookings: unknown[];
        }>;

        const mapped: Bicycle[] = data.map((b) => ({
          id: b.id,
          bicycleNumber: b.bicycleNumber,
          status:
            b.status === "UNDER_MAINTENANCE"
              ? "MAINTENANCE"
              : (b.status as BikeStatus),
          lastMaintenanceDate: b.lastMaintenanceDate,
          isActive: b.isActive,
          bookings: b.bookings ?? [],
        }));

        setBicycles(mapped);
      } catch (err) {
        console.error("Failed to load bicycles", err);
      }
    }

    load();
  }, []);

  const filtered = bicycles.filter((b) => {
    const matchSearch = b.bicycleNumber
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter ? b.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // ADD: always create as AVAILABLE, active
  const handleAddBike = async (payload: {
    bicycleNumber: string;
    status: BikeStatus;
    isActive: boolean;
  }) => {
    try {
      const res = await api.post("/bicycles/add", {
        bicycleNumber: payload.bicycleNumber,
        status: "AVAILABLE",
        isActive: true,
      });

      const b = res.data.bicycle ?? res.data;
      const newBike: Bicycle = {
        id: b.id,
        bicycleNumber: b.bicycleNumber,
        status: "AVAILABLE",
        lastMaintenanceDate: b.lastMaintenanceDate ?? null,
        isActive: b.isActive ?? true,
        bookings: [],
      };

      setBicycles((prev) => [newBike, ...prev]);
      setIsAddOpen(false);
    } catch (err) {
      console.error("Failed to add bicycle", err);
    }
  };

  // EDIT: PUT /bicycles/:id with number + status (isActive controlled via toggle)
  const handleUpdateBike = async (
    id: number,
    payload: { bicycleNumber: string; status: BikeStatus; isActive: boolean }
  ) => {
    try {
      let backendStatus: string;
      if (payload.status === "MAINTENANCE") {
        backendStatus = "UNDER_MAINTENANCE";
      } else {
        backendStatus = payload.status;
      }

      const res = await api.put(`/bicycles/${id}`, {
        bicycleNumber: payload.bicycleNumber,
        status: backendStatus,
        // do not change isActive here; toggle handles it
      });

      const updated = res.data.bicycle ?? res.data;

      setBicycles((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
              ...b,
              bicycleNumber: updated.bicycleNumber,
              status:
                updated.status === "UNDER_MAINTENANCE"
                  ? "MAINTENANCE"
                  : (updated.status as BikeStatus),
              lastMaintenanceDate: updated.lastMaintenanceDate,
            }
            : b
        )
      );
      setEditingBike(null);
    } catch (err) {
      console.error("Failed to update bicycle", err);
    }
  };

  // ACTIVE TOGGLE
  const handleToggleActive = async (bike: Bicycle) => {
    try {
      if (bike.isActive) {
        // turning OFF
        const res = await api.patch(`/bicycles/${bike.id}/deactivate`);
        const updated = res.data.bicycle ?? res.data;
        setBicycles((prev) =>
          prev.map((b) =>
            b.id === bike.id ? { ...b, isActive: updated.isActive } : b
          )
        );
      } else {
        // turning ON – reuse PUT with current number/status but isActive true
        const backendStatus =
          bike.status === "MAINTENANCE"
            ? "UNDER_MAINTENANCE"
            : bike.status;

        const res = await api.put(`/bicycles/${bike.id}`, {
          bicycleNumber: bike.bicycleNumber,
          status: backendStatus,
          isActive: true,
        });

        const updated = res.data.bicycle ?? res.data;
        setBicycles((prev) =>
          prev.map((b) =>
            b.id === bike.id ? { ...b, isActive: updated.isActive } : b
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle active", err);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-main">Bicycles</h1>
        <p className="text-sm text-text-secondary">
          View and manage all bicycles in the campus fleet.
        </p>
      </header>

      {/* filters + add button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bicycle number…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | BikeStatus)
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_USE">Inuse</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          + Add bicycle
        </button>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last maintenance</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bike) => (
              <tr key={bike.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-text-secondary">{bike.id}</td>
                <td className="px-4 py-3 text-text-main">
                  {bike.bicycleNumber}
                </td>
                <td className="px-4 py-3">{renderStatusBadge(bike.status)}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {bike.lastMaintenanceDate
                    ? new Date(bike.lastMaintenanceDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (bike.status === "BOOKED") return; 
                      handleToggleActive(bike);
                    }}
                    disabled={bike.status === "BOOKED"}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${bike.isActive ? "bg-status-available" : "bg-slate-300"
                      } ${bike.status === "BOOKED" ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={
                      bike.status === "BOOKED"
                        ? "Cannot deactivate a booked bicycle"
                        : bike.isActive
                          ? "Click to deactivate"
                          : "Click to activate"
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${bike.isActive ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                    onClick={() => setEditingBike(bike)}
                  >
                    Edit
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
                  No bicycles match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <BikeFormModal
          mode="add"
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleAddBike}
        />
      )}

      {editingBike && (
        <BikeFormModal
          mode="edit"
          initialBike={editingBike}
          onClose={() => setEditingBike(null)}
          onSubmit={(payload) => handleUpdateBike(editingBike.id, payload)}
        />
      )}
    </div>
  );
}

// ---------- modal form used for add & edit ----------

interface BikeFormValues {
  bicycleNumber: string;
  status: BikeStatus;
  isActive: boolean;
}

interface BikeFormModalProps {
  mode: "add" | "edit";
  initialBike?: Bicycle;
  onClose: () => void;
  onSubmit: (values: BikeFormValues) => void;
}

function BikeFormModal({
  mode,
  initialBike,
  onClose,
  onSubmit,
}: BikeFormModalProps): ReactElement {
  const [bicycleNumber, setBicycleNumber] = useState(
    initialBike?.bicycleNumber ?? ""
  );
  const [status, setStatus] = useState<BikeStatus>(
    initialBike?.status ?? "AVAILABLE"
  );

  const title = mode === "add" ? "Add bicycle" : "Edit bicycle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // isActive is controlled by the toggle; pass current (or true for add)
    onSubmit({
      bicycleNumber,
      status,
      isActive: initialBike?.isActive ?? true,
    });
  };

  const disableStatus = mode === "add";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-text-main">{title}</h2>
          <button
            className="text-sm text-text-secondary hover:text-text-main"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-main">
              Bicycle number
            </label>
            <input
              type="text"
              value={bicycleNumber}
              onChange={(e) => setBicycleNumber(e.target.value)}
              placeholder="e.g. B012"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-main">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BikeStatus)}
              disabled={disableStatus}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="IN_USE">Inuse</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            {disableStatus && (
              <p className="text-[11px] text-text-secondary">
                New bicycles always start as Available.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              {mode === "add" ? "Add bicycle" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function renderStatusBadge(status: BikeStatus): ReactElement {
  if (status === "AVAILABLE") {
    return (
      <span className="inline-flex rounded-full bg-status-available/10 px-2.5 py-0.5 text-xs font-medium text-status-available">
        Available
      </span>
    );
  }
  if (status === "BOOKED") {
    return (
      <span className="inline-flex rounded-full bg-status-booked/10 px-2.5 py-0.5 text-xs font-medium text-status-booked">
        Booked
      </span>
    );
  }
  if (status === "IN_USE") {
    return (
      <span className="inline-flex rounded-full bg-status-booked/10 px-2.5 py-0.5 text-xs font-medium text-status-booked">
        Inuse
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
      Maintenance
    </span>
  );
}