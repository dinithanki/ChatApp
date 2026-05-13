import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";
import { Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || "";
  const [form, setForm] = useState({ email: emailFromState, otp: "" });
  const [loading, setLoading] = useState(false);

  const { verifyEmail, resendOTP } = useAuthStore();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail(form);
      navigate("/");
    } catch (err) {
      // errors are shown by store
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) return toast.error("Email is required to resend OTP");
    setLoading(true);
    await resendOTP({ email: form.email });
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Verify Your Email</h1>
              <p className="text-base-content/60">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                type="email"
                className={`input input-bordered w-full`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">OTP Code</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full`}
                placeholder="123456"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleResend}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Didn't receive the code? Click resend.
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Verify Your Identity"
        subtitle="Security first! We've sent a one-time code to your email to make sure it's really you."
      />
    </div>
  );
};

export default VerifyEmailPage;
