import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";


const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();
  if (!selectedUser) return null;

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
      {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
    </p>
  )}
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
