import { useEffect } from "react";
import { useRequestStore } from "../store/useRequestStore";
import { useAuthStore } from "../store/useAuthStore";

const RequestList = () => {

  const {
    requests,
    getPendingRequests,
    acceptRequest,
    rejectRequest,
  } = useRequestStore();

 const { socket } = useAuthStore();
const { addRequestRealtime } = useRequestStore();
useEffect(() => {

  if (!socket) return;

  socket.on("newRequest", (newRequest) => {
    addRequestRealtime(newRequest);
  });

  return () => {
    socket.off("newRequest");
  };

}, [socket]);

  useEffect(() => {
    getPendingRequests();
  }, []);

  return (
    <div className="p-4">

      <h2 className="font-bold mb-4">
        Message Requests
      </h2>

      {requests.map((req) => (

        <div
          key={req._id}
          className="flex items-center justify-between mb-3"
        >

          <div className="flex items-center gap-3">

            <img
              src={req.senderId.profilePic}
              className="w-10 h-10 rounded-full"
            />

            <div>
              <p>{req.senderId.fullName}</p>
              <p className="text-sm opacity-70">
                @{req.senderId.username}
              </p>
            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() => acceptRequest(req._id)}
              className="btn btn-success btn-sm"
            >
              Accept
            </button>

            <button
              onClick={() => rejectRequest(req._id)}
              className="btn btn-error btn-sm"
            >
              Reject
            </button>

          </div>

        </div>

      ))}

    </div>
  );
};

export default RequestList;