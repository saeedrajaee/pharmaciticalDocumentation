const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center p-6">
      {children}
    </div>
  );
};


export default AuthLayout;
