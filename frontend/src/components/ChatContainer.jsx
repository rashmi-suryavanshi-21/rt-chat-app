import { useChatStore } from "../store/useChatStore";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import {
  Check,
  CheckCheck,
  Clock,
  Star,
  Pin,
  Trash2,
  Edit3,
  ArrowDown,
} from "lucide-react";
import Avatar from "./Avatar";

const ChatContainer = () => {
  const getId = (id) => id?._id || id;
  const [openImage, setOpenImage] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [pinIndex, setPinIndex] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [stickyDate, setStickyDate] = useState("");
  const [newMsgCount, setNewMsgCount] = useState(0);

  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
    highlightId,
    setHighlightId,
    clearHighlightId,
    pinMessage,
    starMessage,
    unblockUser,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const scrollPositions = useRef({});

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const scrollRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const container = chatContainerRef.current;

    const handleScroll = () => {
      // hide at top
      if (container.scrollTop <= 20) {
        setStickyDate("");
        return;
      }

      const dateElements = [...document.querySelectorAll("[data-date]")];

      let currentDate = "";

      dateElements.forEach((el) => {
        const rect = el.getBoundingClientRect();

        // find last crossed visible date
        if (rect.top <= 100) {
          currentDate = el.dataset.date;
        }
      });

      if (currentDate) {
        setStickyDate(currentDate);
      }
    };

    container?.addEventListener("scroll", handleScroll);

    return () => {
      container?.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  // useEffect(() => {
  //   const el = scrollRef.current;
  //   if (!el) return;

  //   const handleScroll = () => {
  //     const isNearBottom =
  //       el.scrollHeight - el.scrollTop - el.clientHeight < 120;

  //     setShowScrollBtn(!isNearBottom);
  //   };

  //   el.addEventListener("scroll", handleScroll);
  //   handleScroll(); // run once

  //   return () => el.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages?.();

    return () => {
      unsubscribeFromMessages?.();
    };
  }, [selectedUser?._id]);

  const isMyMsg = (msg) => {
    const userId = authUser?._id;
    if (!userId) return false;

    return String(getId(msg?.senderId)) === String(userId);
  };

  const canEditMessage = (message) => {
    const createdTime = new Date(message.createdAt).getTime();
    const now = Date.now();

    const oneHour = 60 * 60 * 1000;

    return now - createdTime <= oneHour;
  };
  const prevMessagesRef = useRef([]);
  const initialLoadDone = useRef(false);
const hasOpenedChat = useRef(false);
const prevMsgLength = useRef(0);

useLayoutEffect(() => {
  const container = chatContainerRef.current;
  if (!container || !selectedUser?._id) return;
 // reset on user change

  const saved = scrollPositions.current[selectedUser._id];

  requestAnimationFrame(() => {
    if (saved !== undefined) {
      container.scrollTop = saved;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  });
}, [selectedUser?._id, isMessagesLoading]);

useEffect(() => {
  const container = chatContainerRef.current;
  if (!container || !selectedUser?._id) return;

  const handleScroll = () => {
    scrollPositions.current[selectedUser._id] = container.scrollTop;
  };

  container.addEventListener("scroll", handleScroll);

  return () => {
    container.removeEventListener("scroll", handleScroll);
  };
}, [selectedUser?._id]);

useEffect(() => {
  const container = chatContainerRef.current;
  if (!container || !selectedUser?._id) return;
  const isNewMessage = messages.length > prevMsgLength.current;

  prevMsgLength.current = messages.length;

  if (!isNewMessage) return; 

  if (shouldAutoScroll.current) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

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

  useEffect(() => {
    if (!socket) return;

    socket.on("messageSent", (updatedMsg) => {
      useChatStore.getState().updateMessage(updatedMsg._id, updatedMsg.text);
    });

    return () => socket.off("messageSent");
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("messagePinned", (updatedMsg) => {
      useChatStore.setState((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === updatedMsg._id
            ? {
                ...msg,
                pinned: updatedMsg.pinned,
              }
            : msg,
        ),
      }));
    });

    return () => {
      socket.off("messagePinned");
    };
  }, [socket]);

  const pinnedMessages = messages.filter((m) => m.pinned && !m.isDeleted);
  const oldestPinned = pinnedMessages[0];

  const currentPinned = pinnedMessages[pinIndex];

  const [showReplacePinBox, setShowReplacePinBox] = useState(false);
  const [pendingPinMsg, setPendingPinMsg] = useState(null);

  useEffect(() => {
    if (pinIndex >= pinnedMessages.length) setPinIndex(0);
  }, [pinnedMessages]);

  useEffect(() => {
    if (!highlightId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(highlightId);

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        el.classList.add("highlight-temp");

        setTimeout(() => {
          el.classList.remove("highlight-temp");
          clearHighlightId();
        }, 1000);
      }
    }, 200); // small delay = DOM ready guarantee

    return () => clearTimeout(timer);
  }, [highlightId, messages.length]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!authUser?._id) return null;

  const isTyping = selectedUser?._id && typingUsers?.[selectedUser._id];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ChatHeader />

      <div
        ref={(el) => {
          scrollRef.current = el;
          chatContainerRef.current = el;
        }}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 chat-scroll"
        onContextMenu={(e) => e.preventDefault()}
      >
        {currentPinned && (
          <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur border-b border-base-300 px-3 py-2 shadow-sm">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => {
                if (!pinnedMessages.length) return;

                const nextIndex = (pinIndex + 1) % pinnedMessages.length;
                const nextMsg = pinnedMessages[nextIndex];

                if (!nextMsg?._id) return;

                setPinIndex(nextIndex);

                // give DOM time to render first
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    setHighlightId(nextMsg._id);
                  }, 100);
                });
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {/* INDICATORS */}
                <div className="flex flex-col gap-[2px] mr-2">
                  {pinnedMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-[3px] h-[12px] rounded-full transition-all ${
                        i === pinIndex ? "bg-blue-500" : "bg-gray-400/40"
                      }`}
                    />
                  ))}
                </div>

                <Pin className="w-4 h-4 text-gray-400 shrink-0" />

                <div className="flex flex-col">
                  <span className="text-sm">
                    {(currentPinned.text || "Media").length > 20
                      ? (currentPinned.text || "Media").slice(0, 20) + "..."
                      : currentPinned.text || "Media"}
                  </span>
                </div>
              </div>

              <button
                className="text-xs text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();

                  setMenu(null);

                  pinMessage(currentPinned._id, 0);
                }}
              >
                Unpin
              </button>
            </div>
          </div>
        )}
        {stickyDate && stickyDate !== "Today" && (
          <div
            className={`sticky ${
              currentPinned ? "top-16" : "top-2"
            } z- flex justify-center pointer-events-none`}
          >
            <div className="bg-base-300 text-xs px-4 py-1 rounded-full shadow">
              {stickyDate}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const currentDate = new Date(message.createdAt);

          const prevMessage = messages[index - 1];

          const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;

          // show separator only when day changes
          const showDateSeparator =
            !prevDate || currentDate.toDateString() !== prevDate.toDateString();

          const today = new Date();

          const isToday = currentDate.toDateString() === today.toDateString();

          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);

          const isYesterday =
            currentDate.toDateString() === yesterday.toDateString();

          const diffTime =
            new Date(today).setHours(0, 0, 0, 0) -
            new Date(currentDate).setHours(0, 0, 0, 0);

          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          let dateLabel = "";

          if (isToday) {
            dateLabel = "Today";
          } else if (isYesterday) {
            dateLabel = "Yesterday";
          } else if (diffDays < 7) {
            dateLabel = currentDate.toLocaleDateString("en-IN", {
              weekday: "long",
            });
          } else if (currentDate.getFullYear() === today.getFullYear()) {
            dateLabel = currentDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          } else {
            dateLabel = currentDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          }

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <div className="flex justify-center my-4" data-date={dateLabel}>
                  <div className="bg-base-300 text-xs px-4 py-1 rounded-full">
                    {dateLabel}
                  </div>
                </div>
              )}
              <div
                key={message._id}
                id={message._id}
                className={`chat ${isMyMsg(message) ? "chat-end" : "chat-start"} ${
                  highlightId === message._id
                    ? "bg-yellow-400/30 scale-[1.02] rounded-lg p-1 transition-all duration-300"
                    : ""
                }`}
              >
                <div className="chat-image avatar">
                  <Avatar
                    src={
                      isMyMsg(message)
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

                <div
                  className="chat-bubble flex flex-col max-w-[75%] whitespace-pre-wrap overflow-hidden [overflow-wrap:anywhere]"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (message.isDeleted) return;

                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      message,
                    });
                  }}
                >
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

                      {message.isEdited && !message.isScheduled && (
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

                  <div className="flex justify-end items-end gap-1 mt-1 leading-none">
                    <div className="flex gap-2 text-xs mb-1">
                      {message.pinned && (
                        <span className="text-yellow-400">
                          <Pin className="w-3 h-3  fill-gray-500 text-gray-500 " />
                        </span>
                      )}
                      {message.starred === true && (
                        <span className="text-purple-400">
                          <Star className="w-3 h-3 fill-gray-500 text-gray-500" />
                        </span>
                      )}
                    </div>

                    {/* TICKS */}
                    {isMyMsg(message) && (
                      <div className="flex justify-end mt-1">
                        {message.isScheduled && !message.isSent ? (
                          <Clock className="size-4 text-yellow-500" />
                        ) : message.isDeleted ? (
                          <Check className="size-4 text-gray-400" />
                        ) : selectedUser?.isBot ? (
                          <CheckCheck className="size-4 text-blue-500" />
                        ) : message.isRead ? (
                          <CheckCheck className="size-4 text-blue-500" />
                        ) : (
                          <Check className="size-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* MENU */}
        {menu && (
          <div
            style={{
              position: "fixed",
              top: Math.min(menu.y, window.innerHeight - 160),
              left: Math.min(menu.x, window.innerWidth - 180),
              zIndex: 9999,
            }}
            className="bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden w-48"
          >
            <div className="py-1 text-sm text-base-content">
              {/* DELETE + EDIT ONLY FOR OWNER */}
              {isMyMsg(menu.message) && (
                <>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition"
                    onClick={() => {
                      useChatStore.getState().deleteMessage(menu.message._id);
                      setMenu(null);
                    }}
                  >
                    <Trash2 size={16} className="text-zinc-400" />
                    Delete
                  </button>

                  {canEditMessage(menu.message) && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition"
                      onClick={() => {
                        setEditingMsg(menu.message);
                        setMenu(null);
                      }}
                    >
                      <Edit3 size={16} className="text-zinc-400" />
                      Edit
                    </button>
                  )}
                </>
              )}

              {/* PIN */}
              <button
                onClick={() => {
                  // unpin
                  if (menu.message.pinned) {
                    pinMessage(menu.message._id, 0);
                    setMenu(null);
                    return;
                  }

                  // already 3 pins
                  if (pinnedMessages.length >= 3) {
                    setPendingPinMsg(menu.message);
                    setShowReplacePinBox(true);
                    setMenu(null);
                    return;
                  }

                  // normal pin
                  pinMessage(menu.message._id, 1);
                  setMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition"
              >
                <Pin size={16} className="text-zinc-400" />
                {menu.message.pinned ? "Unpin" : "Pin"}
              </button>

              {/* STAR */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition"
                onClick={() => {
                  starMessage(menu.message._id);
                  setMenu(null);
                }}
              >
                <Star size={16} className="text-zinc-400" />
                {menu.message.starred ? "Unstar" : "Star"}
              </button>
            </div>
          </div>
        )}

        {showReplacePinBox && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="bg-base-100 rounded-2xl p-5 w-[320px] shadow-2xl border border-base-300">
              <h2 className="text-lg font-semibold mb-2">
                Replace pinned message?
              </h2>

              <p className="text-sm text-gray-400 mb-5">
                You can only pin 3 chats. Replace the oldest pinned message?
              </p>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg bg-base-200 hover:bg-base-300"
                  onClick={() => {
                    setShowReplacePinBox(false);
                    setPendingPinMsg(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => {
                    // remove oldest
                    pinMessage(oldestPinned._id, 0);

                    // pin new
                    setTimeout(() => {
                      pinMessage(pendingPinMsg._id, 1);
                    }, 100);

                    setShowReplacePinBox(false);
                    setPendingPinMsg(null);
                  }}
                >
                  Replace
                </button>
              </div>
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
        <div ref={messageEndRef} />
      </div>
      {/* {showScrollBtn && (
  <button
    onClick={() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }}
    className="
  absolute bottom-12 left-1/2
  -translate-x-1/2
  z-50
  bg-base-200 hover:bg-base-300
  shadow-xl rounded-full p-3
  transition-all
  backdrop-blur
"
  > */}
      {/* <ArrowDown className="w-5 h-5" />
  </button>
)} */}

      {selectedUser?.isBlocked ? (
  <div className="border-t border-base-300 bg-base-200 p-4 text-center">
    <p className="text-red-400 text-sm font-medium">
      You blocked this user
    </p>

    <button
      onClick={() => unblockUser(selectedUser._id)}
      className="mt-2 text-xs text-blue-400 hover:underline"
    >
      Unblock
    </button>
  </div>
): selectedUser?.blockedByUser ? (

  <div className="border-t border-base-300 bg-base-200 p-4 text-center">
    <p className="text-red-400 text-sm font-medium">
      You cannot reply to this conversation
    </p>
  </div>

) : (
  <MessageInput
    editingMsg={editingMsg}
    setEditingMsg={setEditingMsg}
  />
)}
    </div>
  );
};

export default ChatContainer;
