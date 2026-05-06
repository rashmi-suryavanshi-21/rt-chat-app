import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, Ban } from "lucide-react";
import SearchUser from "./SearchUser";
import Avatar from "./Avatar";

const Sidebar = () => {
  const {
    users,
    getUsers,
    setSelectedUser,
    selectedUser: currentChatUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    getUsers();
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, []);

  const q = query.toLowerCase();

  // =========================
  // HIGHLIGHT FUNCTION
  // =========================
  const highlight = (text) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");

    return text.split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // =========================
  // FILTER + SORT
  // =========================
  const displayUsers = (users || [])
    .filter((user) =>
      user.username?.toLowerCase().includes(q) ||
      user.fullName?.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      if (!q) {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }

      const aName = (a.username + " " + (a.fullName || "")).toLowerCase();
      const bName = (b.username + " " + (b.fullName || "")).toLowerCase();

      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });

    
  return (
    <div className="w-80 border-r border-base-300 bg-base-100 overflow-y-auto">

      {/* Header */}
      <div className="p-4 border-b border-base-300 font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Chats
      </div>

      {/* SEARCH */}
      <SearchUser onSearch={setQuery} />

      {/* LIST */}
      <div className="p-2 space-y-2">
        {displayUsers.map((user) => {
          const isOnline = onlineUsers?.includes(user._id);
          const isActiveChat = currentChatUser?._id === user._id;
          const unreadCount = isActiveChat ? 0 : user.unreadCount || 0;

          // ✅ FIX: unified delete check
          const isDeleted =
            user.lastMessage === "deleted" ||
            user.lastMessage === "This message was deleted";

          return (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-base-200 transition ${
                isActiveChat ? "bg-base-200" : ""
              }`}
            >
              {/* Avatar */}
              <Avatar
                src={user.profilePic}
                size="w-10 h-10"
                isOnline={isOnline}
              />

              {/* INFO */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    {highlight(user.username || user.fullName)}
                  </p>

                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* LAST MESSAGE */}
                <p className="text-xs text-base-content/60 truncate">
                  {Boolean(typingUsers && typingUsers[user._id]) ? (
                    <span className="text-blue-400 animate-pulse">
                      typing...
                    </span>
                  ) : isDeleted ? (
                    <span className="italic text-gray-400 flex items-center gap-1">
                      <Ban className="w-3 h-3 text-gray-400" />
                      deleted
                    </span>
                  ) : user.lastMessage ? (
                    user.lastMessage.length > 25
                      ? user.lastMessage.slice(0, 25) + "..."
                      : user.lastMessage
                  ) : (
                    "No messages yet"
                  )}
                </p>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;