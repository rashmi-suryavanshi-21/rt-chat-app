import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">

      {/* Hero Container */}
      <div className="grid lg:grid-cols-2 bg-base-100 shadow-2xl rounded-2xl overflow-hidden max-w-6xl w-full">

        {/* Left Hero Section */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-primary/10 p-12 text-center">
          <div className="space-y-6">

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h1 className="text-3xl font-bold">
              Welcome to <span className="text-primary">TalkHub</span>
            </h1>

            <p className="text-base-content/70">
              Connect instantly with your friends, share ideas,
              and stay in touch anytime, anywhere.
            </p>

          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex flex-col justify-center p-8 sm:p-12">

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
            <p className="text-base-content/60">
              Sign in to continue chatting
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-base-content/40" />

                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Enter email or username"
                  value={formData.email || formData.username}
                  onChange={(e) => {
                    const value = e.target.value;

                    // 🔥 detect email vs username
                    if (value.includes("@")) {
                      setFormData({
                        ...formData,
                        email: value,
                        username: "",
                      });
                    } else {
                      setFormData({
                        ...formData,
                        username: value,
                        email: "",
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-base-content/40" />

                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-base-content/60">
              Don't have an account?{" "}
              <Link to="/signup" className="link link-primary font-medium">
                Create account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;