export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-main">
          Booking & return requests
        </h1>
        <p className="text-sm text-text-secondary">
          Approve or reject new bookings and key returns.
        </p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Bicycle</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Requested at</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* example row */}
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-text-main">REQ-1043</td>
              <td className="px-4 py-3 text-text-secondary">s123456</td>
              <td className="px-4 py-3 text-text-secondary">Bike 21</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                  Booking
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">10 min ago</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-2">
                  <button className="px-3 py-1 text-xs rounded-full bg-status-available text-white">
                    Approve
                  </button>
                  <button className="px-3 py-1 text-xs rounded-full bg-status-booked text-white">
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
