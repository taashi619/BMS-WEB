import { useEffect, useState } from "react";

interface Summary {
  totalBikes: number;
  availableBikes: number;
  openRequests: number;
  openMaintenance: number;
  openComplaints: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({
    totalBikes: 0,
    availableBikes: 0,
    openRequests: 0,
    openMaintenance: 0,
    openComplaints: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        // const res = await axios.get("/api/admin/summary");
        // setSummary(res.data);
        setSummary({
          totalBikes: 48,
          availableBikes: 31,
          openRequests: 4,
          openMaintenance: 3,
          openComplaints: 2,
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

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
          helper="Bookings & returns"
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
        <Panel title="New requests">
          <p className="text-xs text-text-secondary mb-2">
            Show latest booking / return requests from your
            <code className="ml-1 bg-slate-100 px-1 rounded text-[10px]">
              /admin/new-request
            </code>{" "}
            API.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-text-main">
                  Request #1043 · Bike 21
                </p>
                <p className="text-xs text-text-secondary">
                  Student: s123456 · 10 min ago
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs rounded-full bg-status-available text-white">
                  Approve
                </button>
                <button className="px-3 py-1 text-xs rounded-full bg-status-booked text-white">
                  Reject
                </button>
              </div>
            </li>
          </ul>
        </Panel>

        <Panel title="Maintenance & complaints">
          <p className="text-xs text-text-secondary mb-2">
            Combine data from your maintenance and complaint APIs.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-text-main">
                  Loose brake on Bike 10
                </p>
                <p className="text-xs text-text-secondary">
                  Maintenance · created today
                </p>
              </div>
              <span className="px-2 py-1 text-[11px] rounded-full bg-brand/10 text-brand-dark">
                Pending
              </span>
            </li>
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
