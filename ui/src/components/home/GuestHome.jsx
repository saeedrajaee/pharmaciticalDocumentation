import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function GuestHome() {
  return (
    <main
      className="min-h-screen flex flex-col bg-white text-gray-900"
    >
      <Header isLoggedIn={false} user={null} />

      <section className="flex-1 flex items-center justify-center px-4">
        <p className="text-lg text-gray-500">محتوای تست صفحه اصلی</p>
      </section>

      <Footer />
    </main>
  );
}
