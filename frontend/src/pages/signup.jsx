

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from '../authSlice';
import { useEffect } from "react";

 
const signupSchema = z.object({
  firstname: z.string().min(3, "Name should have at least 3 characters"),
  emailId: z.email("Invalid email"),
  password: z.string().min(8, "Password should be at least 8 characters"),
});
 
function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });


  const dispatch=useDispatch();
  const navigate=useNavigate();
  const {isAuthenticated,loading,error}=useSelector((state)=>state.auth);

  useEffect(()=>{
    if(isAuthenticated)
      navigate('/');

  },[isAuthenticated]);

  const onSubmit=(data)=>{
    console.log(data);
    dispatch(registerUser(data));
  }
 
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0b0a08] overflow-hidden px-4 py-10">
      {/* ambient background: mist + ember glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7a1616]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #c9a24b 0px, transparent 1px, transparent 3px)",
          }}
        />
      </div>
 
      <div className="relative w-full max-w-md">
        {/* corner ornaments */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#c9a24b]" />
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#c9a24b]" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#c9a24b]" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#c9a24b]" />
 
        <div className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-8 py-10 sm:px-10 sm:py-12">
          {/* header / seal */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-full border-2 border-[#c9a24b] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(201,162,75,0.6)]">
              <span className="text-[#c9a24b] text-2xl font-bold">悟</span>
            </div>
            <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
              Wukong Code
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="h-px w-8 bg-[#c9a24b]/50" />
              <p className="text-[11px] tracking-[0.25em] text-[#c9a24b]/80 uppercase">
                Begin the Trial
              </p>
              <span className="h-px w-8 bg-[#c9a24b]/50" />
            </div>
          </div>
 
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-y-5"
          >
            {/* Name */}
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                  Wanderer's Name
                </span>
              </label>
              <input
                {...register("firstname")}
                placeholder="Enter your name"
                className="input input-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
              />
              {errors.firstname && (
                <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                  ⚠ {errors.firstname.message}
                </span>
              )}
            </div>
 
            {/* Email */}
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                  Email
                </span>
              </label>
              <input
                {...register("emailId")}
                placeholder="Enter your email"
                className="input input-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
              />
              {errors.emailId && (
                <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                  ⚠ {errors.emailId.message}
                </span>
              )}
            </div>
 
            {/* Password */}
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                  Sealing Word (Password)
                </span>
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
              />
              {errors.password && (
                <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                  ⚠ {errors.password.message}
                </span>
              )}
            </div>
 
            <button
              type="submit"
              className="btn mt-4 w-full rounded-none border-0 bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] text-[#1a1512] font-semibold tracking-[0.15em] uppercase hover:from-[#f0cd7e] hover:to-[#c9963c] hover:shadow-[0_0_25px_-3px_rgba(201,162,75,0.7)] transition-all"
               disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
 
            <p className="text-center text-xs text-[#7a6f56] mt-2">
              Already sworn to the path?{" "}
             <Link
  to="/login"
  className="text-[#c9a24b] hover:text-[#e2be6d] underline underline-offset-4 transition-colors duration-300"
>
  Sign in
</Link>
            </p>
          </form>
        </div>
 
       
      </div>
    </div>
  );
}
 
export default Signup;


