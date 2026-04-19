import { useEffect, useState, type ReactElement, useCallback } from "react";
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

type FilterType = "ALL" | "ONLY_FINES" | BookingStatus;

export default function RequestsPage(): ReactElement {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [adjusting, setAdjusting] = useState<RequestItem | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(id);
  }, [load]);

  const filteredRequests = requests.filter((req) => {
    if (filter === "ALL") return true;
    if (filter === "ONLY_FINES") return req.fineAmount > 0;
    return req.status === filter;
  });

  const handlePrimaryAction = async (request: RequestItem) => {
    try {
      if (request.status === "BOOKED") {
        await api.patch(`/booking-confirm/${request.id}/key`);
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

  const handleSecondaryAction = async (request: RequestItem) => {
    try {
      if (request.status === "BOOKED") {
        await api.patch(`/booking-confirm/${request.id}/reject`);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, status: "CANCELLED" } : r
          )
        );
        setSelected((prev) =>
          prev && prev.id === request.id ? { ...prev, status: "CANCELLED" } : prev
        );
      } else if (request.status === "RETURN_PENDING") {
        await api.patch(`/booking-confirm/${request.id}/rejapprove`);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, status: "KEY_TAKEN" } : r
          )
        );
        setSelected((prev) =>
          prev && prev.id === request.id ? { ...prev, status: "KEY_TAKEN" } : prev
        );
      }
    } catch (err) {
      console.error("Failed to handle secondary booking action", err);
    }
  };

  const handleFineUpdated = (bookingId: number, newFine: number) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === bookingId ? { ...r, fineAmount: newFine } : r
      )
    );
    setSelected((prev) =>
      prev && prev.id === bookingId ? { ...prev, fineAmount: newFine } : prev
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify_between">
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
            <option value="ONLY_FINES">Only fines</option>
            <option value="BOOKED">Booked</option>
            <option value="KEY_TAKEN">Ride in progress</option>
            <option value="RETURN_PENDING">Issue Key</option>
            <option value="APPROVED_RETURN">Confirm key</option>
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fine (£)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
              const primaryLabel = getPrimaryActionLabel(req.status);
              const secondaryLabel = getSecondaryActionLabel(req.status);
              const hasPrimaryAction = !!primaryLabel;
              const hasSecondaryAction = !!secondaryLabel;

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
                  <td className="px-4 py-3 text-text-main">
                    £{req.fineAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setSelected(req)}
                        className="px-3 py-1 text-xs rounded-full border border-slate-200 text-text-main hover:bg-slate-50"
                      >
                        View
                      </button>
                      {req.fineAmount > 0 && (
                        <button
                          onClick={() => setAdjusting(req)}
                          className="px-3 py-1 text-xs rounded-full border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                          Adjust fine
                        </button>
                      )}
                      {hasPrimaryAction && (
                        <button
                          onClick={() => handlePrimaryAction(req)}
                          className="px-3 py-1 text-xs rounded-full bg-status-available text-white"
                        >
                          {primaryLabel}
                        </button>
                      )}
                      {hasSecondaryAction && (
                        <button
                          onClick={() => handleSecondaryAction(req)}
                          className="px-3 py-1 text-xs rounded-full bg-status-booked text-white"
                        >
                          {secondaryLabel}
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
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text_secondary"
                >
                  No bookings found for this filter.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text_secondary"
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
          onSecondaryAction={handleSecondaryAction}
        />
      )}

      {adjusting && (
        <AdjustFineModal
          booking={adjusting}
          onClose={() => setAdjusting(null)}
          onUpdated={handleFineUpdated}
        />
      )}
    </div>
  );
}

// ---------- Adjust fine modal ----------

interface AdjustFineModalProps {
  booking: RequestItem;
  onClose: () => void;
  onUpdated: (bookingId: number, newFine: number) => void;
}

function AdjustFineModal({
  booking,
  onClose,
  onUpdated,
}: AdjustFineModalProps): ReactElement {
  const [newFine, setNewFine] = useState<string>(
    booking.fineAmount.toString()
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const amount = Number(newFine);

    if (Number.isNaN(amount) || amount < 0) {
      setError("Fine must be a non‑negative number.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    try {
      setSaving(true);
      await api.post(`/audit/admin/bookings/${booking.id}/adjust-fine`, {
        newFineAmount: amount,
        reason: reason.trim(),
      });
      onUpdated(booking.id, amount);
      onClose();
    } catch (err) {
      console.error("Failed to adjust fine", err);
      setError("Could not adjust fine. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              Adjust fine
            </p>
            <p className="text-base font-semibold text-text-main">
              {booking.requestCode} · {booking.bicycleLabel}
            </p>
          </div>
          <button
            className="text-sm text-text-secondary hover:text-text-main"
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
              Current fine
            </p>
            <p className="text-sm text-text-main">
              £{booking.fineAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">
              New fine amount (£)
            </label>
            <input
              type="number"
              step="0.01"
              value={newFine}
              onChange={(e) => setNewFine(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">
              Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Explain why you are adjusting this fine..."
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- RequestDetailsModal + helpers (unchanged from your version) ----------

interface RequestDetailsModalProps {
  request: RequestItem;
  onClose: () => void;
  onPrimaryAction: (req: RequestItem) => void;
  onSecondaryAction: (req: RequestItem) => void;
}

function RequestDetailsModal({
  request,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
}: RequestDetailsModalProps): ReactElement {
  const primaryLabel = getPrimaryActionLabel(request.status);
  const secondaryLabel = getSecondaryActionLabel(request.status);

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
            <p className="text-xs font-semibold text-text_secondary uppercase">
              Student
            </p>
            <p className="text-sm font-medium text-text-main">
              {request.studentName}
            </p>
            <p className="text-xs text-text_secondary">
              {request.studentEmail}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-text_secondary uppercase">
              Time details
            </p>
            <p className="text-xs text-text_secondary">
              Booking time: {new Date(request.bookingTime).toLocaleString()}
            </p>
            <p className="text-xs text-text_secondary">
              Planned return:{" "}
              {request.plannedReturnTime
                ? new Date(request.plannedReturnTime).toLocaleString()
                : "Not set"}
            </p>
            {request.actualReturnTime && (
              <p className="text-xs text-text_secondary">
                Actual return:{" "}
                {new Date(request.actualReturnTime).toLocaleString()}
              </p>
            )}
          </div>

          {request.status === "RETURN_PENDING" && (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-text_secondary uppercase">
                Return summary
              </p>
              <p className="text-xs text-text_secondary">
                Fine:{" "}
                <span className="font-semibold">
                  £{Number(request.fineAmount).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          {request.note && (
            <div>
              <p className="text-xs font-semibold text-text_secondary uppercase mb-1">
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
          {secondaryLabel && (
            <button
              onClick={() => onSecondaryAction(request)}
              className="px-3 py-1.5 text-xs rounded-full bg-status-booked text-white"
            >
              {secondaryLabel}
            </button>
          )}
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

function mapBookingToRequest(b: any): RequestItem {
  const status = b.status as BookingStatus;
  const studentName = `${b.user?.firstName ?? ""} ${
    b.user?.lastName ?? ""
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

function getSecondaryActionLabel(status: BookingStatus): string | null {
  if (status === "BOOKED") return "Reject booking";
  if (status === "RETURN_PENDING") return "Reject return";
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