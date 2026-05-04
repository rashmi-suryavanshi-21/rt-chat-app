import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, Palette } from "lucide-react";
import { User } from "lucide-react";
import Avatar from "./Avatar";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const testSound = () => {
  const audio = new Audio("/sound/notification.mp3");

  audio.volume = 1;
  audio.currentTime = 0;

  audio.play()
    .then(() => {
      console.log("🔊 SOUND WORKING");
    })
    .catch((err) => {
      console.log("❌ SOUND FAILED:", err);
    });
};
 useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

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

              {/* 3 DOT MENU */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>

                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="btn btn-ghost btn-sm"
                >
                  ⋮
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-base-200 rounded-lg shadow-lg z-50 overflow-hidden">

                    {/* STARRED */}
                    <button
                      onClick={() => {
                        navigate("/starred");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-300 flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Starred
                    </button>

                    {/* THEMES */}
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-300 flex items-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      Themes
                    </button>

                    {/* LOGOUT */}
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>

                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;