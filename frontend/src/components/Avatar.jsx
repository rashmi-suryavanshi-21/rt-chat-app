import { User } from "lucide-react";

const Avatar = ({ src, size = "w-10 h-10", isOnline = false }) => {
  return (
    <div className={`relative ${size}`}>
      
      <div className="w-full h-full rounded-full overflow-hidden bg-base-300 flex items-center justify-center border">
        {src ? (
          <img
            src={src}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <User className="w-6 h-6 text-base-content/80" />
          </div>
        )}
      </div>

      {/* 🔥 GREEN DOT */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      )}
      
    </div>
  );
};

export default Avatar;