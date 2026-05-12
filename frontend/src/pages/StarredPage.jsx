import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Star, X } from "lucide-react";
import { formatMessageTime } from "../lib/utils";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { formatSmartDateTime } from "../lib/utils";

const StarredPage = () => {
  const { getStarredMessages, starMessage, setSelectedUser, setHighlightId } =
    useChatStore();
  const [starred, setStarred] = useState([]);
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const data = await getStarredMessages();
      setStarred(data);
    };

    load();
  }, []);

  const handleUnstar = async (id) => {
    await starMessage(id);

    setStarred((prev) => prev.filter((m) => m._id !== id));

    toast.success("Removed from starred");
  };
  const getName = (msg) => {
    const myId = authUser?._id?.toString();

    const sender = msg.senderId;

    const isMe =
      (typeof sender === "object" ? sender._id : sender)?.toString() === myId;

    const username = sender?.username || "User";
    const fullName = sender?.fullName || "";

    const displayName = fullName ? `${username} (${fullName})` : username;

    return isMe ? `You (${fullName || "You"})` : displayName;
  };

  const handleOpenMessage = (msg) => {
    const otherUser =
      msg.senderId._id === authUser._id ? msg.receiverId : msg.senderId;

    setSelectedUser(otherUser);
    setHighlightId(null);
    navigate("/");
    setTimeout(() => {
      setHighlightId(msg._id);
    }, 300);
    // chat page
  };

  return (
    <div className="min-h-screen w-full pt-24 p-6 overflow-y-auto bg-base-100">
      {/* HEADER */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          {/* <Star className="text-yellow-400" /> */}
          <h1 className="text-lg font-semibold">Starred Messages</h1>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute right-0 p-2 rounded-full hover:bg-base-200 transition z-50"
        >
          <X size={20} className="text-base-content" />
        </button>
      </div>

      {/* EMPTY STATE */}
      {starred.length === 0 && (
        <div className="text-center text-gray-400 mt-20">
          No starred messages yet
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4 max-w-3xl mx-auto  ">
        {starred.map((msg) => (
          <div
            onClick={() => handleOpenMessage(msg)}
            key={msg._id}
            className="group bg-base-200 hover:bg-base-300 transition rounded-xl p-4 shadow-sm flex justify-between gap-4 cursor-pointer"
          >
            {/* PROFILE PIC */}
            <img
              src={
                msg.senderId?.profilePic ||
                "https://ui-avatars.com/api/?name=User"
              }
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* LEFT CONTENT */}
            <div className="flex flex-col gap-1 flex-1">
              {/* NAME */}
              <p className="text-xs text-gray-400 font-medium">
                {getName(msg)}
              </p>

              {/* MESSAGE */}
              <p className="text-sm text-base-content break-words">
                {msg.text || "Media message"}
              </p>
              {/* FULL DATE TIME */}
              <span className="text-xs text-gray-500">
                {formatSmartDateTime(msg.createdAt)}
              </span>
            </div>

            {/* RIGHT ACTION */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnstar(msg._id);
              }}
              className="opacity-70 group-hover:opacity-100 transition text-sm text-purple-500 hover:text-purple-400 font-medium"
            >
              Unstar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StarredPage;
