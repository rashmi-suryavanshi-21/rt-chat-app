import { User } from "lucide-react";

const Avatar = ({ src, size = "w-10 h-10" }) => {
  return (
    <div
      className={`${size} rounded-full overflow-hidden bg-base-300 flex items-center justify-center border`}
    >
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
  );
};

export default Avatar;