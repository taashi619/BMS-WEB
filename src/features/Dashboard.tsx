import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

interface Summary {
  totalBikes: number;
  availableBikes: number;
  openRequests: number;
  openMaintenance: number;
  openComplaints: number;
}

interface DashboardLists {
  openBookings: any[];
  maintenance: any[];
  complaints: any[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({
    totalBikes: 0,
    availableBikes: 0,
    openRequests: 0,
    openMaintenance: 0,
    openComplaints: 0,
  });

  const [lists, setLists] = useState<DashboardLists>({
    openBookings: [],
    maintenance: [],
    complaints: [],
  });

  const load = useCallback(async () => {
    try {
      const [bikesRes, maintenanceRes, complaintsRes, bookingsRes] =
        await Promise.all([
          api.get("/bicycles/all"),
          api.get("/maintenance/queue"),
          api.get("/complain/all"),
          api.get("/booking-confirm/open"),
        ]);

      const bikes = bikesRes.data as Array<{ status: string }>;
      const maintenanceQueue = (maintenanceRes.data.queue ??
        []) as Array<{ status: string }>;
      const complaints = (complaintsRes.data.complaints ??
        []) as Array<{ status: string }>;
      const bookings = (bookingsRes.data.bookings ??
        []) as Array<{ status: string }>;

      const totalBikes = bikes.length;
      const availableBikes = bikes.filter(
        (b) => b.status === "AVAILABLE"
      ).length;

      const openMaintenance = maintenanceQueue.filter(
        (m) => m.status === "OPEN"
      ).length;

      const openComplaints = complaints.filter(
        (c) => c.status === "NEW"
      ).length;

      const openRequests = bookings.length; // already filtered on backend

      setSummary({
        totalBikes,
        availableBikes,
        openRequests,
        openMaintenance,
        openComplaints,
      });

      setLists({
        openBookings: bookings.slice(0, 5),
        maintenance: maintenanceQueue.slice(0, 5),
        complaints: complaints.slice(0, 5),
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(id);
  }, [load]);

  async function handleIssueKey(bookingId: number) {
    try {
      await api.patch(`/booking-confirm/${bookingId}/key`);
      await load();
    } catch (err) {
      console.error("Failed to issue key", err);
    }
  }

  async function handleApproveReturn(bookingId: number) {
    try {
      await api.patch(`/booking-confirm/${bookingId}/approve-return`);
      await load();
    } catch (err) {
      console.error("Failed to approve return", err);
    }
  }

  async function handleRejectBooking(bookingId: number) {
    try {
      await api.patch(`/booking-confirm/${bookingId}/reject`);
      await load();
    } catch (err) {
      console.error("Failed to reject booking", err);
    }
  }

  async function handleRejectReturn(bookingId: number) {
    try {
      await api.patch(`/booking-confirm/${bookingId}/rejapprove`);
      await load();
    } catch (err) {
      console.error("Failed to reject return", err);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold text-text-main">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Quick overview of bicycles, requests, and issues.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total bicycles"
          value={summary.totalBikes}
          helper={`${summary.availableBikes} available`}
        />
        <SummaryCard
          title="Open requests"
          value={summary.openRequests}
          helper="Keys to issue / returns"
        />
        <SummaryCard
          title="Open maintenance"
          value={summary.openMaintenance}
          helper="Waiting for action"
        />
        <SummaryCard
          title="Open complaints"
          value={summary.openComplaints}
          helper="Student issues"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* New requests panel */}
        <Panel title="New requests">
          <p className="text-xs text-text-secondary mb-2">
            Latest booking / return requests from your
            <code className="ml-1 bg-slate-100 px-1 rounded text-[10px]">
              /booking-confirm/open
            </code>{" "}
            API.
          </p>
          <ul className="space-y-2 text-sm">
            {lists.openBookings
              .filter(
                (bk: any) =>
                  bk.status === "BOOKED" || bk.status === "RETURN_PENDING"
              )
              .map((bk: any) => (
                <li
                  key={bk.id}
                  className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-text-main">
                      Request #{bk.id} · Bike{" "}
                      {bk.bicycle?.bicycleNumber ?? bk.bicycleId}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Student: {bk.user?.firstName} {bk.user?.lastName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {bk.status === "BOOKED" && (
                      <>
                        <button
                          className="px-3 py-1 text-xs rounded-full bg-status-available text-white"
                          onClick={() => handleIssueKey(bk.id)}
                        >
                          Issue key
                        </button>
                        <button
                          className="px-3 py-1 text-xs rounded-full bg-status-booked text-white"
                          onClick={() => handleRejectBooking(bk.id)}
                        >
                          Reject booking
                        </button>
                      </>
                    )}

                    {bk.status === "RETURN_PENDING" && (
                      <>
                        <button
                          className="px-3 py-1 text-xs rounded-full bg-status-available text-white"
                          onClick={() => handleApproveReturn(bk.id)}
                        >
                          Approve return
                        </button>
                        <button
                          className="px-3 py-1 text-xs rounded-full bg-status-booked text-white"
                          onClick={() => handleRejectReturn(bk.id)}
                        >
                          Reject return
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            {lists.openBookings.filter(
              (bk: any) =>
                bk.status === "BOOKED" || bk.status === "RETURN_PENDING"
            ).length === 0 && (
                <li className="text-xs text-text-secondary">
                  No pending booking or return requests.
                </li>
              )}
          </ul>
        </Panel>

        {/* Maintenance & complaints panel */}
        <Panel title="Maintenance & complaints">
          <p className="text-xs text-text-secondary mb-2">
            Combined view from your maintenance and complaint APIs.
          </p>
          <ul className="space-y-2 text-sm">
            {lists.maintenance.map((m: any) => (
              <li
                key={`m-${m.id}`}
                className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-text-main">
                    {m.description} · Bike{" "}
                    {m.bicycle?.bicycleNumber ?? m.bicycleId}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Maintenance · {m.status}
                  </p>
                </div>
                <span className="px-2 py-1 text-[11px] rounded-full bg-brand/10 text-brand-dark">
                  Pending
                </span>
              </li>
            ))}

            {lists.complaints.map((c: any) => (
              <li
                key={`c-${c.id}`}
                className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-text-main">
                    {c.description}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Complaint · {c.status}
                  </p>
                </div>
                <span className="px-2 py-1 text-[11px] rounded-full bg-brand/10 text-brand-dark">
                  Pending
                </span>
              </li>
            ))}

            {lists.maintenance.length === 0 &&
              lists.complaints.length === 0 && (
                <li className="text-xs text-text-secondary">
                  No open maintenance or complaints.
                </li>
              )}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  helper?: string;
}

function SummaryCard({ title, value, helper }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex flex-col justify-between">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-text-main">{value}</p>
      {helper && (
        <p className="mt-1 text-xs text-text-secondary truncate">{helper}</p>
      )}
    </div>
  );
}

interface PanelProps {
  title: string;
  children: React.ReactNode;
}

function Panel({ title, children }: PanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-text-main mb-1">{title}</h2>
      {children}
    </div>
  );
}