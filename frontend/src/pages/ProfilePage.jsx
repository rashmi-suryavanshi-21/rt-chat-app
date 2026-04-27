import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(authUser?.bio || "");
  const navigate = useNavigate();

  const handleBioSave = async () => {
    try {
      await updateProfile({ bio });
      setIsEditingBio(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;

      try {
        await updateProfile({ profilePic: base64Image });
        setSelectedImg(base64Image);
      } catch (err) {
        console.log(err);
      }
    };
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-2xl shadow-lg p-6 space-y-4 relative">
          {/* Close Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 "
          >
            <X className="w-5 h-5" />
          </button>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {selectedImg || authUser.profilePic ? (
                <img
                  src={selectedImg || authUser.profilePic}
                  alt="Profile"
                  className="size-32 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="size-32 rounded-full bg-base-300 flex items-center justify-center border-2 border-primary">
                  <User className="size-12 text-base-content/50" />
                </div>
              )}

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>
          {/* Username */}
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
              @{authUser?.username || "not_set"}
            </p>
          </div>
          {/* Bio Section */}

          {/* ✅ Show Add Button when no bio */}
          {!authUser?.bio && !isEditingBio && (
            <button
              onClick={() => setIsEditingBio(true)}
              className="btn btn-sm btn-outline"
            >
              + Add Bio
            </button>
          )}
          {/* Bio Section */}
          {(authUser?.bio || isEditingBio) && (
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                About
              </div>

              {!isEditingBio ? (
                <p
                  onClick={() => setIsEditingBio(true)}
                  className="px-4 py-2.5 bg-base-200 rounded-lg border cursor-pointer hover:bg-base-300 transition"
                >
                  {authUser?.bio}
                </p>
              ) : (
                <input
                  type="text"
                  autoFocus
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  onBlur={handleBioSave}
                  onKeyDown={(e) => e.key === "Enter" && handleBioSave()}
                  className="input input-bordered w-full"
                  placeholder="Write something..."
                />
              )}
            </div>
          )}

          <div className="mt-6 bg-base-200 shadow-mid rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
