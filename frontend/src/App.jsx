import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import StarredPage from "./pages/StarredPage"; 

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
 

  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
   document.documentElement.setAttribute("data-theme", theme);
 }, [theme]);

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

useEffect(() => {
  console.log("Requesting notification permission...");

  if ("Notification" in window) {
    Notification.requestPermission().then((perm) => {
      console.log("Permission result:", perm);
    });
  }
}, []);
// useEffect(() => {
//   window.focus();
// }, []);
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <Loader className="size-10 animate-spin" />
      </div>
    );

 
  return (
    <div className="min-h-screen">
      <Navbar />
    
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/starred" element={<StarredPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
      </Routes>
      
      <Toaster />
    </div>
  );
};
export default App;
