import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Clock, Star, Pin } from "lucide-react";
import Avatar from "./Avatar";

const ChatContainer = () => {
  const [openImage, setOpenImage] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);

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

  // ✅ ADD STORE ACTIONS (ONLY ADDITION)
  const { pinMessage, starMessage } = useChatStore();

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages?.();

    return () => {
      unsubscribeFromMessages?.();
    };
  }, [selectedUser?._id]);

  useEffect(() => {
    console.log("MSG:", messages);
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

              {message.isDeleted ? (
                <p className="text-gray-400 italic text-sm">
                  This message was deleted
                </p>
              ) : message.text ? (
                <p className="flex items-end gap-1">
                  {message.text}

                  {message.isEdited && (
                    <span className="text-[10px] text-gray-400 italic">
                      (edited)
                    </span>
                  )}
                </p>
              ) : null}

              {message.isScheduled && !message.isSent && (
                <div className="text-xs text-gray-400 mt-1">
                  Scheduled for{" "}
                  {new Date(message.scheduledTime).toLocaleString()}
                </div>
              )}

              {/* ⭐📌 ADDED ICONS (ONLY ADDITION) */}
              {message.senderId === authUser._id && (
                <div className="flex justify-end items-end gap-1 mt-1 leading-none">
                  <div className="flex gap-2 text-xs mb-1">
                    {message.pinned && (
                      <span className="text-yellow-400"><Pin className="w-3 h-3  fill-gray-500 text-gray-500 "  /></span>
                    )}
                    {message.starred && (
                      <span className="text-purple-400">
                        <Star className="w-3 h-3 fill-gray-500 text-gray-500" />
                      </span>
                    )}
                  </div>

                  {/* TICKS */}
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
              )}
            </div>
          </div>
        ))}

        {/* MENU */}
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
            <div
              className="px-4 py-2 text-sm hover:bg-red-500/20 text-red-400 cursor-pointer"
              onClick={() => {
                useChatStore.getState().deleteMessage(menu.message._id);
                setMenu(null);
              }}
            >
              Delete
            </div>

            <div
              className="px-4 py-2 text-sm hover:bg-blue-500/20 text-blue-400 cursor-pointer"
              onClick={() => {
                setEditingMsg(menu.message);
                setMenu(null);
              }}
            >
              Edit
            </div>

            {/* 📌 PIN (ADDED) */}
            <div
              className="px-4 py-2 text-sm hover:bg-yellow-500/20 text-yellow-400 cursor-pointer"
              onClick={() => {
                pinMessage(menu.message._id);
                setMenu(null);
              }}
            >
              {menu.message.pinned ? "Unpin" : "Pin"}
            </div>

            {/* ⭐ STAR (ADDED) */}
            <div
              className="px-4 py-2 text-sm hover:bg-purple-500/20 text-purple-400 cursor-pointer"
              onClick={() => {
                starMessage(menu.message._id);
                setMenu(null);
              }}
            >
              {menu.message.starred ? "Unstarred" : "Starred"}
            </div>
          </div>
        )}

        {/* IMAGE MODAL */}
        {openImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpenImage(null)}
          >
            <img src={openImage} className="max-h-[90%] rounded-lg" />
          </div>
        )}

        {/* TYPING */}
        {isTyping && (
          <div className="text-xs text-gray-400 animate-pulse px-3">
            typing...
          </div>
        )}
      </div>

      <MessageInput editingMsg={editingMsg} setEditingMsg={setEditingMsg} />
    </div>
  );
};

export default ChatContainer;