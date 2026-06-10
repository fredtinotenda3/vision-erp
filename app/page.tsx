import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] flex flex-col">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white font-bold">
            V
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Vision ERP
          </h1>
        </div>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            Login
          </Link>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1E3A8A] text-white hover:bg-[#162c66]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-4xl text-center">

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Advanced Optometry
            <span className="text-[#1E3A8A]"> ERP System</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage patients, appointments, clinical records, dispensing,
            inventory, finance, lab orders, and reports — all in one unified
            intelligent system.
          </p>

          {/* CTA BUTTONS */}
          <div className="mt-8 flex gap-4 justify-center flex-wrap">

            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-[#1E3A8A] text-white font-medium hover:bg-[#162c66]"
            >
              Enter System
            </Link>

            <Link
              href="/patients"
              className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Manage Patients
            </Link>

          </div>

          {/* FEATURE GRID */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Patient Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Registration, history tracking, clinical records, and quick search.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Clinical System
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Eye examinations, prescriptions, and treatment workflows.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Finance & Reports
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Cash flow, VAT reports, sales analytics, and audit logs.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="px-8 py-6 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Vision ERP — Optometry Management System
      </footer>

    </div>
  );
}