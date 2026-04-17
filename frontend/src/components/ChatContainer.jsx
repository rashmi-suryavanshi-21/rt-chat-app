import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const [openImage, setOpenImage] = useState(null);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
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
  // =========================
  // LOAD CHAT
  // =========================
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================
  // MARK AS READ
  // =========================
  useEffect(() => {
    if (!selectedUser?._id || !socket?.connected) return;

    const timer = setTimeout(() => {
      socket.emit("markAsRead", {
        senderId: selectedUser._id,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedUser?._id, socket?.connected]);

  // =========================
  // LOADING
  // =========================
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

  // =========================
  // UI
  // =========================
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message, index) => (
          <div
            key={message._id}
            ref={index === messages.length - 1 ? messageEndRef : null}
            className={`chat ${message.senderId === authUser._id
              ? "chat-end"
              : "chat-start"
              }`}
          >

            {/* Avatar */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser?.profilePic || "/avatar.png"
                  }
                  alt="profile"
                />
              </div>
            </div>

            {/* Time */}
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            {/* Bubble */}
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                  onClick={() => setOpenImage(message.image)}
                />
              )}

              {message.text && <p>{message.text}</p>}

              {/* Read Receipt */}
              {message.senderId === authUser._id && (
                <div className="flex justify-end mt-1">
                  {message.isRead ? (
                    <CheckCheck className="size-4 text-blue-500" />
                  ) : (
                    <Check className="size-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Image Modal */}
        {openImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpenImage(null)}
          >
            <img
              src={openImage}
              className="max-h-[90%] rounded-lg"
            />
          </div>
        )}
        
        
        {typingUsers[selectedUser?._id] ? (
          <div className="text-xs text-gray-400 animate-pulse px-3">
            typing...
          </div>
        ) : null}


      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;