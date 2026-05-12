import { useAuthStore } from "../store/useAuthStore";
import { useState, useRef, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    username: "",
  });
  const usernameRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (usernameRef.current && !usernameRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim())
      return toast.error("Full name is required");

    if (!formData.email.trim())
      return toast.error("Email is required");

    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");

    if (!formData.password)
      return toast.error("Password is required");

    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const getSuggestions = async (fullName) => {
    try {
      const res = await axiosInstance.post(
        "/auth/suggest-usernames",
        { fullName }
      );

      setSuggestions(res.data.suggestions);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">

      <div className="grid lg:grid-cols-2 max-w-6xl w-full bg-base-100 shadow-2xl rounded-2xl overflow-hidden">

        {/* Left Hero Section */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-primary/10 p-12 text-center">
          <div className="space-y-6">

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h1 className="text-3xl font-bold">
              Join <span className="text-primary">TalkHub</span>
            </h1>

            <p className="text-base-content/70">
              Connect with friends, share ideas, and build meaningful
              conversations in real time.
            </p>

          </div>
        </div>

        {/* Signup Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">
              Create Account 🚀
            </h2>
            <p className="text-base-content/60">
              Get started with TalkHub today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Full Name
                </span>
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3 size-5 text-base-content/40" />

                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => {
                    const value = e.target.value;

                    setFormData({
                      ...formData,
                      fullName: value,
                    });

                    setSuggestions([]);        // 🔥 clear old suggestions
                    setShowSuggestions(false); // 🔥 hide dropdown
                  }}
                />
              </div>

            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Email
                </span>
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 size-5 text-base-content/40" />

                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {/* Username */}
            <div ref={usernameRef} className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Username
                </span>
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3 size-5 text-base-content/40" />

                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="your_username"
                  value={formData.username}
                  onClick={async () => {
                    setShowSuggestions(true);

                    if (formData.fullName.trim().length >2) {
                      await getSuggestions(formData.fullName);
                    }
                  }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value.toLowerCase().trim(), // 🔥 normalize
                    })
                  }
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((u, i) => (
                    <span
                      key={i}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          username: u,
                        }));

                        setShowSuggestions(false); // hide after select
                      }}
                      className="cursor-pointer bg-base-200 px-3 py-1 rounded-full text-sm hover:bg-primary hover:text-white"
                    >
                      @{u}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Password
                </span>
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 size-5 text-base-content/40" />

                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="link link-primary font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SignUpPage;