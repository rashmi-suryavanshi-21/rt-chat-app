import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
const ChatHeader = () => {
  const { selectedUser, setSelectedUser, setMessages } = useChatStore(); // ✅ FIX
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
const { users } = useChatStore.getState();
  const toggleMenu = () => {
    setOpen(!open);
  };

  if (!selectedUser) return null;

 const handleClearChat = async () => {
  try {
    await axios.delete(`/api/messages/clear/${selectedUser._id}`);

    const { users, moveUserToTop } = useChatStore.getState();

    // ✅ clear messages
    setMessages([]);

    // ✅ sidebar update (clean way)
    const updatedUsers = users.map((u) =>
      u._id === selectedUser._id
        ? {
            ...u,
            lastMessage: "You cleared this chat",
            lastMessageId: null,
            updatedAt: new Date().toISOString(),
          }
        : u
    );

    useChatStore.setState({
      users: moveUserToTop(updatedUsers, selectedUser._id, {
        text: "You cleared this chat",
        _id: null,
        createdAt: new Date().toISOString(),
      }),
    });

    setOpen(false);
  } catch (error) {
    console.log("Clear chat error:", error);
  }
};

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="avatar cursor-pointer"
            onClick={() =>
              selectedUser && navigate(`/user/${selectedUser.username}`)
            }
          >
            <div className="size-10 rounded-full relative">
              {selectedUser?.profilePic ? (
                <img
                  src={selectedUser.profilePic}
                  alt={selectedUser?.username}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-base-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-base-content/50" />
                </div>
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.username}</h3>
            {!selectedUser.isBot && (
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id)
                  ? "Online"
                  : "Offline"}
              </p>
            )}
          </div>
          
        </div>

        <div className="relative ">
          {/* 3 dots menu */}
        <button onClick={() => setOpen(!open)}
          className="btn btn-ghost btn-sm">⋮</button>

{open && (
  <div className="absolute right-0 mt-2 w-44 bg-base-200 rounded-lg shadow-lg z-50 overflow-hidden">
    
    <button
      onClick={handleClearChat}
      className="w-full text-left px-4 py-2 hover:bg-base-300 flex items-center gap-2 text-red-400"
    >
      🗑️ Clear Chat
    </button>

  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;