"use client";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Label from "../../components/ui/Label";

const Login = ({ searchParams }) => {
  const [state, action] = useActionState(signIn, undefined);

  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center items-center p-4 relative overflow-hidden"
    >
      {/* افکت‌های نوری پس‌زمینه (Ambient Background) */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      {/* کارت لاگین */}
      <div className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white/60 p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* بخش هدر و آیکون */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          {/* <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20 -rotate-3 hover:rotate-0 transition-transform duration-300"> */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:border-rose-200 transition-all duration-300">
            <Image
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
              src="/logo.png"
              alt="pharmaceutical Management Logo"
              width={50}
              height={50}
            />
            {/* </div> */}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ورود
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            خوش آمدید! لطفاً اطلاعات خود را وارد کنید.
          </p>
        </div>
        {/* فرم ورود */}
        <form className="grid gap-6" action={action}>
          <div className="grid gap-2.5">
            <Label className="text-sm font-bold text-slate-700" required>
              نام کاربری
            </Label>
            <Input
              type="text"
              placeholder="شماره تماس خود را وارد کنید"
              name="mobile"
              required
              className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all duration-300 rounded-xl px-4 py-3"
            />
          </div>

          <div className="grid gap-2.5">
            <Label className="text-sm font-bold text-slate-700" required>
              رمز عبور
            </Label>
            <Input
              type="password"
              minLength={8}
              placeholder="••••••••"
              name="password"
              required
              className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all duration-300 rounded-xl px-4 py-3 text-left tracking-widest placeholder:tracking-normal placeholder:text-right"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 mt-2 font-semibold shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]"
          >
            ورود به پنل
          </Button>
          <div className="text-center">
            <span className="text-base font-medium ">
              برای ورود ثبت نام کنید:
              <Link
                href="/auth/sign-up"
                className="text-blue-600 font-semibold mx-1 hover:underline"
              >
                ثبت نام
              </Link>
            </span>
          </div>
        </form>

        {/* فوتر کوچک */}
        {/* <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          ناحیه امن مدیریت
        </p> */}
      </div>
    </div>
  );
};

export default Login;
