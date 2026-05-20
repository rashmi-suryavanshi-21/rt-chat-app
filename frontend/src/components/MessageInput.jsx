import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { axiosInstance } from "../lib/axios";

const MessageInput = ({ editingMsg, setEditingMsg }) => {
  // 🔥 props added
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  const fileInputRef = useRef(null);
  const { sendMessage, updateMessage } = useChatStore(); // 🔥 added
  const typingTimeout = useRef(null);
  const { selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  const [showEmoji, setShowEmoji] = useState(false);

  const isTypingRef = useRef(false);

  // 🔥 EDIT MODE SYNC
  useEffect(() => {
    if (editingMsg) {
      setText(editingMsg.text || "");
      setImagePreview(null); // optional: image edit disabled
    }
  }, [editingMsg]);

  // ================= IMAGE =================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (isSending) return;

    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ================= EMOJI =================
  const addEmoji = (emoji) => {
    const symbol = emoji.native || "";
    setText((prev) => prev + symbol);
  };
  const [isSending, setIsSending] = useState(false);

  // ================= SEND / EDIT =================
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (isSending) return;

    if (!text.trim() && !imagePreview) return;

    try {
      setIsSending(true);
      if (editingMsg) {
        // 🔥 EDIT MODE
        await updateMessage(editingMsg._id, text.trim());
        setEditingMsg(null);
      } else {
        // NORMAL SEND
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });
      }

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ================= SCHEDULE =================
  const handleSchedule = async () => {
    if (!text.trim() || !scheduledTime) {
      toast.error("Text and time is required");
      return;
    }

    const selectedDate = new Date(scheduledTime);

    if (selectedDate <= new Date()) {
      toast.error("Please select a future time");
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/messages/schedule",
        {
          receiverId: selectedUser._id,
          text: text.trim(),
          scheduledTime: new Date(scheduledTime),
        },
        {
          withCredentials: true,
        },
      );

      const savedMessage = res.data;

      useChatStore.setState((state) => ({
        messages: [...state.messages, savedMessage],
      }));

      toast.success("Message scheduled");

      setText("");
      setScheduledTime("");
      setShowScheduler(false);
    } catch (err) {
      console.error(err);
      toast.error("Error scheduling message");
    }
  };

  // ================= TYPING =================
  const handleTyping = (value) => {
    setText(value);

    if (!selectedUser?._id || !socket) return;

    if (value.trim().length > 0 && !isTypingRef.current) {
      socket.emit("typing", {
        receiverId: selectedUser._id,
      });
      isTypingRef.current = true;
    }

    clearTimeout(typingTimeout.current);

    if (value.trim().length === 0) {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
      });
      isTypingRef.current = false;
      return;
    }

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: selectedUser._id,
      });
      isTypingRef.current = false;
    }, 2000);
  };

  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="p-4 w-full">
      {/* 🔥 EDIT MODE UI */}
      {editingMsg && (
        <div className="mb-2 text-xs text-blue-400 flex justify-between items-center">
          Editing message...
          <button onClick={() => setEditingMsg(null)}>Cancel</button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            {!isSending && (
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                type="button"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 relative"
      >
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            disabled={isSending}
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="btn btn-circle"
        >
          😊
        </button>

        <button
          type="button"
          onClick={() => setShowScheduler((prev) => !prev)}
          className="btn btn-circle"
        >
          <Clock size={20} />
        </button>

        <button
          type="submit"
          className="btn btn-circle"
          disabled={isSending || (!text.trim() && !imagePreview)}
        >
          {isSending ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Send size={20} />
          )}
        </button>

        {showEmoji && (
          <div className="absolute bottom-full mb-3 left-0 z-50">
            <Picker data={data} onEmojiSelect={addEmoji} />
          </div>
        )}
      </form>

      {showScheduler && (
        <div className="mt-2 flex gap-2">
          <input
            type="datetime-local"
            min={now}
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="input input-bordered input-sm"
          />

          <button onClick={handleSchedule} className="btn btn-sm btn-primary">
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
