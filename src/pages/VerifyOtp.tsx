import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState<string>("");
  const [timer, setTimer] = useState<number>(60);

  const location = useLocation();
  const navigate = useNavigate();

  const email = (location.state as { email: string })?.email;

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      alert("Invalid OTP");
    } else {
      navigate("/");
    }
  };

  const resendOtp = async () => {
    if (timer === 0) {
      await supabase.auth.signInWithOtp({ email });
      setTimer(60);
    }
  };

  return (
    <div>
      <h2>Enter OTP</h2>

      <input
        type="text"
        maxLength={4}
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button onClick={verifyOtp}>Verify</button>

      <p>Resend OTP in {timer}s</p>

      <button disabled={timer !== 0} onClick={resendOtp}>
        Resend OTP
      </button>
    </div>
  );
}