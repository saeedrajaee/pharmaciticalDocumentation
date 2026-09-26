import Login from "@/screen/login";

const LoginPage = async () => {
  // const token = await createJWT({
  //     userId:1,
  //     userType:"SuperAmin"
  // })
  // const verify=await verifyJWT(token)
  // console.log("jwt-verify",verify)

  return (
    <>
      <Login />
    </>
  );
};

export default LoginPage;
