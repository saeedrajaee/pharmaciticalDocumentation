import Header from "@/components/layout/Header";

export default function DashboardHome({ user }) {
  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <Header isLoggedIn user={user} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">خوش آمدید</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            {user?.name}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            نقش:
            <span className="mr-2 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              {user?.role}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
