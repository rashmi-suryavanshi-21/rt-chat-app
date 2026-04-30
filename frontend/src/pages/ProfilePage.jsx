import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();

  const [selectedImg, setSelectedImg] = useState(null);
  const [showImage, setShowImage] = useState(false);

  // 🔥 EDIT STATE (ALL IN ONE)
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    bio: authUser?.bio || "",
  });

  const navigate = useNavigate();

  // 🔥 SAVE ALL (NAME + USERNAME + BIO)
  const handleProfileSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditingProfile(false);
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
            className="absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 🔥 EDIT BUTTON */}
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn btn-sm btn-outline absolute top-4 left-4"
            >
              Edit
            </button>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative cursor-pointer">
              {selectedImg || authUser.profilePic ? (
                <img
                  src={selectedImg || authUser.profilePic}
                  alt="Profile"
                  onClick={() => setShowImage(true)}
                  className="w-40 h-40 rounded-full object-cover border-4 border-primary hover:scale-105 transition"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-base-300 flex items-center justify-center border-4 border-primary">
                  <User className="w-14 h-14 text-base-content/50" />
                </div>
              )}

              <label
                className={`absolute bottom-0 right-0 bg-base-content p-2 rounded-full cursor-pointer ${
                  isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                }`}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            {showImage && (
              <div
                className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                onClick={() => setShowImage(false)}
              >
                <img
                  src={selectedImg || authUser.profilePic}
                  className="max-w-full max-h-full"
                />
              </div>
            )}

            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* 🔥 FULL NAME */}
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </div>

            {isEditingProfile ? (
              <input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="input input-bordered w-full"
              />
            ) : (
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullName}
              </p>
            )}
          </div>

          {/* 🔥 USERNAME */}
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </div>

            {isEditingProfile ? (
              <input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="input input-bordered w-full"
              />
            ) : (
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                @{authUser?.username || "not_set"}
              </p>
            )}
          </div>

          {/* 🔥 BIO (NOW SAME EDIT MODE) */}
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              About
            </div>

            {isEditingProfile ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="textarea textarea-bordered w-full"
                placeholder="Write something..."
              />
            ) : (
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.bio || "No bio added"}
              </p>
            )}
          </div>

          {/* 🔥 SAVE BUTTON */}
          {isEditingProfile && (
            <button
              onClick={handleProfileSave}
              className="btn btn-primary w-full"
            >
              Save Changes
            </button>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
              {authUser?.email}
            </p>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-200 shadow-mid rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
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