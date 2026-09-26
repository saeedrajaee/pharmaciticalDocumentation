import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-500 sm:px-6 md:flex-row lg:px-8">
        <div className="flex flex-col justify-between">
          <div>
            <p>© 2026 Pharmaceutical Management System </p>
          </div>
          <div>
            <p> تمامی حقوق محفوظ است. </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-blue-600">
            درباره ما
          </Link>
          <Link href="/contact" className="hover:text-blue-600">
            تماس با ما
          </Link>
          <Link href="/privacy" className="hover:text-blue-600">
            حریم خصوصی
          </Link>
        </div>
      </div>
    </footer>
  );
}
