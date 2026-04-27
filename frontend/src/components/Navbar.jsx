import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, Palette } from "lucide-react";
import { User } from "lucide-react";
import Avatar from "./Avatar";
const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="
      fixed top-0 w-full z-50
      bg-base-100/80 backdrop-blur-lg
      border-b border-base-300
      shadow-sm
      "
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group hover:opacity-80 transition-all"
          >
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>

            <h1 className="text-xl font-bold">
              Talk<span className="text-primary">Hub</span>
            </h1>
          </Link>

          {/* Right Section */}
          {authUser && (
            <div className="flex items-center gap-3">

              {/* Profile */}
              <Link
                to="/profile"
                className="
                flex items-center gap-2
                hover:bg-base-200
                px-2 py-1.5
                rounded-lg
                transition-all
                "
              >
                <div className="relative">
                  <div className="relative">
                    <Avatar src={authUser?.profilePic} size="w-9 h-9" />

                    {/* Online Dot */}
                    <span
                      className="
                    absolute bottom-0 right-0
                    w-3 h-3
                   bg-green-500
                    rounded-full
                    border-2 border-base-100
                    "
                    />
                  </div>

                </div>
                <span className="hidden sm:inline font-medium">
                  {authUser?.fullName}
                </span>
              </Link>

              {/* Settings */}
              <Link
                to="/settings"
                className="
                btn btn-sm 
                btn-ghost
                gap-2
                hover:bg-base-200
                "
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Themes</span>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="
                btn btn-sm 
                btn-error 
                btn-outline
                gap-2
                hover:scale-105
                transition-all
                "
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;