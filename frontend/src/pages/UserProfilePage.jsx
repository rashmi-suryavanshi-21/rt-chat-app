import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Mail } from "lucide-react";

const UserProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const res = await fetch(
  `http://localhost:5001/api/users/${username}`,
  {
    credentials: "include", // ✅ REQUIRED
  }
);

        const data = await res.json();

        if (res.ok) {
          setUser(data);
        } else {
          console.log("API Error:", data.message);
          setUser(null);
        }
      } catch (err) {
        console.log("Fetch error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        User not found
      </div>
    );
  }

  return (
    <div className="h-screen pt-20 flex justify-center">
      <div className="max-w-2xl w-full p-6 bg-base-300 rounded-2xl">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              className="size-32 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="size-32 rounded-full bg-base-200 flex items-center justify-center border-2 border-primary">
              <User className="size-12 text-base-content/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 space-y-4 text-center">
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-base-content/60">@{user.username}</p>

          {user.bio && (
            <p className="bg-base-200 p-3 rounded-lg">
              {user.bio}
            </p>
          )}

          <div className="flex justify-center gap-2 text-sm text-base-content/60">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
        </div>
      </div>
    </div>
  );
};


export default UserProfilePage;