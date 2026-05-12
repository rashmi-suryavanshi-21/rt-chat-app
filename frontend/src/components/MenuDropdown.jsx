import { useEffect, useRef, useState } from "react";
import { Trash2, UserMinus, Ban } from "lucide-react";

const MenuDropdown = ({
  setOpen,
  handleClearChat,
  removeConnection,
  blockUser,
  selectedUser,
}) => {
  const menuRef = useRef();

  
  const [showConfirm, setShowConfirm] = useState(false);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !showConfirm &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpen, showConfirm]);


  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-0 mt-2 w-52 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95"
      >
        {/* Clear Chat */}
        <button
          onClick={() => {
            setShowConfirm(true);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-base-200 transition"
        >
          <Trash2 size={16} className="text-red-400" />
          Clear Chat
        </button>

        {/* Remove Connection */}
        <button
          onClick={() => {
            removeConnection(selectedUser._id);
            setOpen(false);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-base-200 transition"
        >
          <UserMinus size={16} className="text-orange-400" />
          Remove Connection
        </button>

        {/* Block User */}
        <button
          onClick={() => {
            blockUser(selectedUser._id);
            setOpen(false);
          }}
          disabled={selectedUser.isBlocked}
          className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition
             ${
               selectedUser.isBlocked
                 ? "opacity-40 cursor-not-allowed"
                 : "hover:bg-base-200 text-red-400"
             }
  `}
        >
          <Ban size={16} />
          Block User
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]">
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl w-80">
            <h2 className="text-lg font-semibold mb-2">Clear Chat</h2>

            <p className="text-sm text-base-content/70 mb-6">
              Are you sure you want to clear this chat?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleClearChat();
                  setShowConfirm(false);
                  setOpen(false);
                }}
                className="btn btn-error btn-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuDropdown;
