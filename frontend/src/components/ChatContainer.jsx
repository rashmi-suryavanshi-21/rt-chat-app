import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Clock } from "lucide-react";
import Avatar from "./Avatar";

const ChatContainer = () => {
  const [openImage, setOpenImage] = useState(null);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const [menu, setMenu] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null); // 🔥 edit state

  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);

    if (typeof subscribeToMessages === "function") {
      subscribeToMessages();
    }

    return () => {
      if (typeof unsubscribeFromMessages === "function") {
        unsubscribeFromMessages();
      }
    };
  }, [selectedUser?._id]);

  useEffect(() => {
    console.log("MESSAGES ARRAY:", messages);
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!selectedUser?._id || !socket?.connected) return;

    const timer = setTimeout(() => {
      socket.emit("markAsRead", {
        senderId: selectedUser._id,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedUser?._id, socket?.connected]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const isTyping =
    selectedUser?._id && typingUsers?.[selectedUser._id];

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message, index) => (
          <div
            key={message._id}
            ref={index === messages.length - 1 ? messageEndRef : null}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            onContextMenu={(e) => {
              if (message.senderId !== authUser._id || message.isDeleted)
                return;

              e.preventDefault();

              setMenu({
                x: e.pageX,
                y: e.pageY,
                message,
              });
            }}
          >
            <div className="chat-image avatar">
              <Avatar
                src={
                  message.senderId === authUser._id
                    ? authUser.profilePic
                    : selectedUser?.profilePic
                }
                size="w-10 h-10"
              />
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(
                  message.isScheduled
                    ? message.sentAt || message.scheduledTime
                    : message.createdAt,
                )}
              </time>
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                  onClick={() => setOpenImage(message.image)}
                />
              )}

              {/* Deleted */}
              {message.isDeleted ? (
                <p className="text-gray-400 italic text-sm">
                  This message was deleted
                </p>
              ) : (
                message.text && <p>{message.text}</p>
              )}

              {message.isScheduled && !message.isSent && (
                <div className="text-xs text-gray-400 mt-1">
                  Scheduled for{" "}
                  {new Date(message.scheduledTime).toLocaleString()}
                </div>
              )}

              {/* Ticks */}
              {message.senderId === authUser._id && (
                <div className="flex justify-end mt-1">
                  {message.isScheduled && !message.isSent ? (
                    <Clock className="size-4 text-yellow-500" />
                  ) : message.isDeleted ? (
                    <Check className="size-4 text-gray-400" />
                  ) : message.isRead ? (
                    <CheckCheck className="size-4 text-blue-500" />
                  ) : (
                    <Check className="size-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 🔥 MENU */}
        {menu && (
          <div
            style={{
              position: "fixed",
              top: Math.min(menu.y, window.innerHeight - 120),
              left: Math.min(menu.x, window.innerWidth - 150),
              background: "#1f1f1f",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "6px 0",
              zIndex: 9999,
              minWidth: "120px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {/* DELETE */}
            <div
              className="px-4 py-2 text-sm hover:bg-red-500/20 text-red-400 cursor-pointer"
              onClick={() => {
                if (!menu?.message?._id) return;
                useChatStore.getState().deleteMessage(menu.message._id);
                setMenu(null);
              }}
            >
              Delete
            </div>

            {/* 🔥 EDIT FIX */}
            <div
              className="px-4 py-2 text-sm hover:bg-blue-500/20 text-blue-400 cursor-pointer"
              onClick={() => {
                setEditingMsg(menu.message); // ✅ main fix
                setMenu(null);
              }}
            >
              Edit
            </div>
          </div>
        )}

        {/* Image Modal */}
        {openImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpenImage(null)}
          >
            <img src={openImage} className="max-h-[90%] rounded-lg" />
          </div>
        )}

        {/* Typing */}
        {isTyping && (
          <div className="text-xs text-gray-400 animate-pulse px-3">
            typing...
          </div>
        )}
      </div>

      {/* 🔥 IMPORTANT */}
      <MessageInput editingMsg={editingMsg} setEditingMsg={setEditingMsg} />
    </div>
  );
};

export default ChatContainer;