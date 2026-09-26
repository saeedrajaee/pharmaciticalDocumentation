import { getSession } from "../../lib/session";
import Link from "next/link";
import React from "react";

const SignInButton = async () => {
  const session = await getSession();
  return (
    <div className="flex items-center gap-2 mt-auto">
      {!session || !session.user ? (
        <>
          <Link href={"/auth/signin"}>ورود</Link>
          <Link href={"/auth/signup"}>ثبت نام</Link>
        </>
      ) : (
        <>
          <p>{session.user.name}</p>
          <Link href={"/api/auth/signout"}>خروج</Link>
        </>
      )}
    </div>
  );
};

export default SignInButton;
