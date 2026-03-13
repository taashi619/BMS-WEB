export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-main">Students</h1>
        <p className="text-sm text-text-secondary">
          Manage student accounts and view their booking history.
        </p>
      </header>

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by student ID or name…"
          className="w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm text-text-main outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-text-main hover:bg-slate-50">
          Export list
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Active bookings</th>
              <th className="px-4 py-3">Fines</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* example row */}
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-text-main">s123456</td>
              <td className="px-4 py-3 text-text-secondary">Alex Brown</td>
              <td className="px-4 py-3 text-text-secondary">
                alex.brown@uni.ac.uk
              </td>
              <td className="px-4 py-3 text-text-secondary">1</td>
              <td className="px-4 py-3 text-status-booked">£0.00</td>
              <td className="px-4 py-3 text-right">
                <button className="text-xs font-semibold text-brand hover:text-brand-dark">
                  View profile
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
