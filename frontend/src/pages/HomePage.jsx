import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import RequestList from "../components/RequestList";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  return (
    <div className="min-h-screen bg-base-200">

      {/* Main Container */}
      <div className="flex items-center justify-center pt-20 px-4">

        <div
          className="
          w-full max-w-7xl
          h-[calc(100vh-8rem)]
          bg-base-100
          rounded-2xl
          shadow-xl
          border border-base-300
          overflow-hidden
          "
        >

          

          {/* Chat Section */}
          <div className="flex h-[calc(100%-4rem)]">
            {/* Sidebar */}
            <Sidebar />

            {/* Chat Area */}
            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer />
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default HomePage;