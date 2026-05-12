import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
const UserProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const navigate = useNavigate();
const [requestStatus, setRequestStatus] = useState(null);
const [sendingRequest, setSendingRequest] = useState(false);
const { socket } = useAuthStore();
useEffect(() => {

  socket?.on("requestAccepted", ({ userId }) => {

    if (userId === user?._id) {
      setRequestStatus("accepted");
    }

  });

  return () => {
    socket?.off("requestAccepted");
  };

}, [socket, user]);
const handleSendRequest = async () => {
  try {

    if (!user?._id) return;

    setSendingRequest(true);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/request/send/${user._id}`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (res.ok) {
      setRequestStatus("pending");
      toast.success("Request sent");
    } else {
      toast.error(data.message || "Failed to send request");
    }

  } catch (error) {
    console.log(error);
    toast.error("Something went wrong");
  } finally {
    setSendingRequest(false);
  }
};
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/users/${username}`,
          {
            credentials: "include", // ✅ REQUIRED
          }
        );

        const data = await res.json();

        if (res.ok) {

  setUser(data);

  const statusRes = await fetch(
    `${import.meta.env.VITE_API_URL}/request/status/${data._id}`,
    {
      credentials: "include",
    }
  );

  const statusData = await statusRes.json();

  setRequestStatus(statusData.status);

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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        User not found
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-10 flex justify-center bg-base-200">
      <div className="max-w-2xl w-full p-6 bg-base-300 rounded-2xl shadow-lg">
        <div className="flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-circle btn-ghost text-xl"
          >
            ✕
          </button>
        </div>
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              className="w-40 h-40 rounded-full object-cover border-2 border-primary cursor-pointer"
              onClick={() => setShowImage(true)}
            />
          ) : (
            <div className="size-32 rounded-full bg-base-200 flex items-center justify-center border-2 border-primary">
              <User className="size-12 text-base-content/50" />
            </div>
          )}
          {showImage && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={() => setShowImage(false)}
            >
              <img
                src={user.profilePic}
                className="max-w-[90%] max-h-[90%] rounded-lg"
              />
            </div>
          )}

        </div>

        {/* Info */}
        <div className="mt-6 space-y-4 text-center">
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-base-content/60">@{user.username}</p>

          <div className="flex justify-center gap-2 text-sm text-base-content/60">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
          {user.bio && (
            <p className="bg-base-200 p-3 rounded-lg">
              {user.bio}
            </p>
          )}

{requestStatus === "accepted" ? (

  <button
    onClick={() => navigate("/")}
    className="btn btn-primary mt-4 w-full"
  >
    Start Chat
  </button>

) : requestStatus === "pending" ? (

  <button
    disabled
    className="btn mt-4 w-full"
  >
    Requested
  </button>

) : (

  <button
    onClick={handleSendRequest}
    disabled={sendingRequest}
    className="btn btn-primary mt-4 w-full"
  >
    {sendingRequest ? "Sending..." : "Send Request"}
  </button>

)}
        </div>
      </div>
    </div>
  );
};


export default UserProfilePage;  