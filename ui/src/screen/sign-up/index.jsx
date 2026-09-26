"use client";


import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../../lib/auth";
import { Input } from "../../components/ui/Input";
import Label from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";

const SignUp = ({ searchParams }) => {
  const [state, action] = useActionState(signUp, undefined);
  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center items-center p-4 relative overflow-hidden"
    >
      {/* افکت‌های نوری پس‌زمینه (Ambient Background) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      {/* کارت ثبت‌نام */}
      <div className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white/60 p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* بخش هدر و آیکون */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:border-rose-200 transition-all duration-300 mb-6">
            <Image
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
              src="/logo.png"
              alt="pharmaceutical Management Logo"
              width={50}
              height={50}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ثبت نام
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            برای ایجاد حساب کاربری، اطلاعات خود را وارد کنید.
          </p>
        </div>

        {/* فرم ثبت‌نام */}

        <form className="grid gap-6" action={action}>
          {/* فیلد نام */}
          {state?.message && (
            <p className="text-sm text-red-500">{state.message}</p>
          )}
          <div className="grid gap-2.5">
            <Label className="text-sm font-bold text-slate-700" required>
              نام و نام خانوادگی
            </Label>
            <Input
              type="text"
              placeholder="نام خود را وارد کنید"
              name="name"
              required
              className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all duration-300 rounded-xl px-4 py-3"
            />
          </div>
          {state?.error?.name && (
            <p className="text-sm text-red-500">{state.error.name}</p>
          )}
          {/* فیلد ایمیل */}
          <div className="grid gap-2.5">
            <Label className="text-sm font-bold text-slate-700" required>
               آدرس ایمیل
            </Label>
            <Input
              type="text"
              placeholder=" شماره تماس خود را وارد کنید"
              name="mobile"
              required
              className="bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all duration-300 rounded-xl px-4 py-3 text-left placeholder:text-right"
            />
          </div>
          {state?.error?.mobile && (
            <p className="text-sm text-red-500">{state.error.mobile}</p>
          )}
          {/* فیلد رمز عبور */}
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
          {state?.error?.password && (
            <div className="text-sm text-red-500">
              <p>Password Must:</p>
              <ul>
                {state?.error?.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {/* دکمه ثبت */}
          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 mt-2 font-semibold shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]"
          >
            ثبت نام
          </Button>

          {/* لینک ورود */}
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-slate-600">
              قبلاً ثبت نام کرده‌اید؟
              <Link
                href="/auth/signin"
                className="text-blue-600 font-bold mx-1 hover:underline transition-all"
              >
                ورود
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
