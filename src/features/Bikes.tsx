import { useState, type ReactElement } from "react";

type BikeStatus = "AVAILABLE" | "BOOKED" | "MAINTENANCE";

interface Bicycle {
  id: number;
  bicycleNumber: string;
  status: BikeStatus;
  lastMaintenanceDate: string | null;
  isActive: boolean;
  bookings: unknown[]; // you can type this later
}

// dummy data similar to GET /bicycles/all
const initialBicycles: Bicycle[] = [
  {
    id: 11,
    bicycleNumber: "B011",
    status: "BOOKED",
    lastMaintenanceDate: null,
    isActive: true,
    bookings: [],
  },
  {
    id: 9,
    bicycleNumber: "B008",
    status: "AVAILABLE",
    lastMaintenanceDate: null,
    isActive: true,
    bookings: [
      {
        id: 5,
        userId: 5,
        bicycleId: 9,
        note: "",
      },
    ],
  },
  {
    id: 8,
    bicycleNumber: "B009",
    status: "MAINTENANCE",
    lastMaintenanceDate: "2026-02-10T10:00:00.000Z",
    isActive: true,
    bookings: [],
  },
];

export default function BikesPage(): ReactElement {
  const [bicycles, setBicycles] = useState<Bicycle[]>(initialBicycles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | BikeStatus>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bicycle | null>(null);

  const filtered = bicycles.filter((b) => {
    const matchSearch = b.bicycleNumber
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter ? b.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleAddBike = (payload: {
    bicycleNumber: string;
    status: BikeStatus;
    isActive: boolean;
  }) => {
    // later: call POST /bicycles/add, then refetch; for now update local
    const newBike: Bicycle = {
      id: Date.now(),
      bicycleNumber: payload.bicycleNumber,
      status: payload.status,
      isActive: payload.isActive,
      lastMaintenanceDate: null,
      bookings: [],
    };
    setBicycles((prev) => [newBike, ...prev]);
    setIsAddOpen(false);
  };

  const handleUpdateBike = (
    id: number,
    payload: { bicycleNumber: string; status: BikeStatus; isActive: boolean }
  ) => {
    // later: PUT /bicycles/:id then update state from response
    setBicycles((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...payload } : b
      )
    );
    setEditingBike(null);
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
                  {bike.isActive ? (
                    <span className="inline-flex rounded-full bg-status-available/10 px-2.5 py-0.5 text-xs font-medium text-status-available">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      Inactive
                    </span>
                  )}
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
  const [isActive, setIsActive] = useState<boolean>(
    initialBike?.isActive ?? true
  );

  const title = mode === "add" ? "Add bicycle" : "Edit bicycle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ bicycleNumber, status, isActive });
  };

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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-text-secondary"
            >
              Active in system
            </label>
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
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
      Maintenance
    </span>
  );
}
