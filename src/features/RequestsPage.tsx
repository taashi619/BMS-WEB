import { useEffect, useState, type ReactElement } from "react";
import { api } from "../services/api";

type BookingStatus =
  | "BOOKED"
  | "KEY_TAKEN"
  | "RETURN_PENDING"
  | "APPROVED_RETURN"
  | "CANCELLED";

interface RequestItem {
  id: number;
  requestCode: string;
  studentName: string;
  studentEmail: string;
  bicycleLabel: string;
  status: BookingStatus;
  bookingTime: string;
  plannedReturnTime: string;
  actualReturnTime: string | null;
  note?: string | null;
  fineAmount: number;
  helmetRequired: boolean;
}

type FilterType = "ALL" | BookingStatus;

export default function RequestsPage(): ReactElement {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [selected, setSelected] = useState<RequestItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/booking-confirm/open");
        const data = (res.data.bookings ?? []) as Array<any>;
        const mapped = data.map(mapBookingToRequest);
        setRequests(mapped);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredRequests = requests.filter((req) =>
    filter === "ALL" ? true : req.status === filter
  );

  const handlePrimaryAction = async (request: RequestItem) => {
    try {
      if (request.status === "BOOKED") {
        await api.patch(`/booking-confirm/${request.id}/key`);

        // update status locally instead of removing
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, status: "KEY_TAKEN" } : r
          )
        );
        setSelected((prev) =>
          prev && prev.id === request.id ? { ...prev, status: "KEY_TAKEN" } : prev
        );
      } else if (request.status === "RETURN_PENDING") {
        await api.patch(`/booking-confirm/${request.id}/approve-return`);

        // return approved: either update or remove, your choice
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, status: "APPROVED_RETURN" } : r
          )
        );
        setSelected((prev) =>
          prev && prev.id === request.id
            ? { ...prev, status: "APPROVED_RETURN" }
            : prev
        );
      }
    } catch (err) {
      console.error("Failed to handle booking action", err);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-main">
            Booking & return requests
          </h1>
          <p className="text-sm text-text-secondary">
            Manage bookings, rides in progress, and return requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary uppercase">
            Filter
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="ALL">All statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="KEY_TAKEN">Key taken</option>
            <option value="RETURN_PENDING">Return pending</option>
            <option value="APPROVED_RETURN">Return approved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Bicycle</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
              const primaryLabel = getPrimaryActionLabel(req.status);
              const hasPrimaryAction = !!primaryLabel;

              return (
                <tr key={req.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-text-main">
                    {req.requestCode}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {req.studentName}
                    <span className="block text-xs text-text-secondary">
                      {req.studentEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {req.bicycleLabel}
                  </td>
                  <td className="px-4 py-3">
                    {renderStatusChip(req.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setSelected(req)}
                        className="px-3 py-1 text-xs rounded-full border border-slate-200 text-text-main hover:bg-slate-50"
                      >
                        View
                      </button>
                      {hasPrimaryAction && (
                        <button
                          onClick={() => handlePrimaryAction(req)}
                          className="px-3 py-1 text-xs rounded-full bg-status-available text-white"
                        >
                          {primaryLabel}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredRequests.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No bookings found for this filter.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  Loading bookings…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <RequestDetailsModal
          request={selected}
          onClose={() => setSelected(null)}
          onPrimaryAction={handlePrimaryAction}
        />
      )}
    </div>
  );
}

// ---------- details modal ----------

interface RequestDetailsModalProps {
  request: RequestItem;
  onClose: () => void;
  onPrimaryAction: (req: RequestItem) => void;
}

function RequestDetailsModal({
  request,
  onClose,
  onPrimaryAction,
}: RequestDetailsModalProps): ReactElement {
  const primaryLabel = getPrimaryActionLabel(request.status);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              Booking
            </p>
            <p className="text-base font-semibold text-text-main">
              {request.requestCode} · {request.bicycleLabel}
            </p>
          </div>
          <button
            className="text-sm text-text-secondary hover:text-text-main"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            {renderStatusChip(request.status)}
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">
              Student
            </p>
            <p className="text-sm font-medium text-text-main">
              {request.studentName}
            </p>
            <p className="text-xs text-text-secondary">
              {request.studentEmail}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">
              Time details
            </p>
            <p className="text-xs text-text-secondary">
              Booking time: {new Date(request.bookingTime).toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              Planned return:{" "}
              {request.plannedReturnTime
                ? new Date(request.plannedReturnTime).toLocaleString()
                : "Not set"}
            </p>
            {request.actualReturnTime && (
              <p className="text-xs text-text-secondary">
                Actual return:{" "}
                {new Date(request.actualReturnTime).toLocaleString()}
              </p>
            )}
          </div>

          {request.status === "RETURN_PENDING" && (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-text-secondary uppercase">
                Return summary
              </p>
              <p className="text-xs text-text-secondary">
                Fine:{" "}
                <span className="font-semibold">
                  £{Number(request.fineAmount).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          {request.note && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
                Note
              </p>
              <p className="text-sm text-text-main whitespace-pre-line">
                {request.note}
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50"
          >
            Close
          </button>
          {primaryLabel && (
            <button
              onClick={() => onPrimaryAction(request)}
              className="px-3 py-1.5 text-xs rounded-full bg-status-available text-white"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- mapping + helpers ----------

function mapBookingToRequest(b: any): RequestItem {
  const status = b.status as BookingStatus;
  const studentName = `${b.user?.firstName ?? ""} ${b.user?.lastName ?? ""
    }`.trim();

  return {
    id: b.id,
    requestCode: `REQ-${b.id}`,
    studentName: studentName,
    studentEmail: b.user?.email ?? "",
    bicycleLabel: b.bicycle?.bicycleNumber ?? `Bike ${b.bicycleId}`,
    status,
    bookingTime: b.bookingTime,
    plannedReturnTime: b.returnTime,
    actualReturnTime: b.actualReturnTime ?? null,
    note: b.note ?? null,
    fineAmount: Number(b.fineAmount ?? 0),
    helmetRequired: Boolean(b.helmetRequired),
  };
}

function getPrimaryActionLabel(status: BookingStatus): string | null {
  if (status === "BOOKED") return "Issue key";
  if (status === "RETURN_PENDING") return "Approve return";
  return null;
}

function renderStatusChip(status: BookingStatus): ReactElement {
  let label = "";
  let classes = "";

  switch (status) {
    case "BOOKED":
      label = "Booking request";
      classes = "bg-brand/10 text-brand-dark";
      break;
    case "KEY_TAKEN":
      label = "Ride in progress";
      classes = "bg-sky-100 text-sky-700";
      break;
    case "RETURN_PENDING":
      label = "Return request";
      classes = "bg-amber-100 text-amber-800";
      break;
    case "APPROVED_RETURN":
      label = "Return approved";
      classes = "bg-status-available/10 text-status-available";
      break;
    case "CANCELLED":
      label = "Cancelled";
      classes = "bg-slate-100 text-slate-500";
      break;
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}