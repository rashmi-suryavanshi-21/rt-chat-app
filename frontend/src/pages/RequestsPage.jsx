import { useEffect } from "react";
import { useRequestStore } from "../store/useRequestStore";
import { useNavigate } from "react-router-dom";

const RequestsPage = () => {

  const navigate = useNavigate();

  const {
    requests,
    sentRequests,
    getPendingRequests,
    getSentRequests,
    acceptRequest,
    rejectRequest,
    hideRequest,
  } = useRequestStore();

  useEffect(() => {

    getPendingRequests();
    getSentRequests();

  }, []);

  return (
    <div className="min-h-screen bg-base-200 pt-24 px-4">

      <div className="max-w-3xl mx-auto space-y-8">

        {/* Incoming Requests */}
        <div className="bg-base-300 rounded-2xl p-6 shadow">

          <h2 className="text-2xl font-bold mb-6">
            Incoming Requests
          </h2>

          {requests.length === 0 ? (

            <p className="text-base-content/60">
              No incoming requests
            </p>

          ) : (

            <div className="space-y-4">

              {requests.map((req) => (

                <div
                  key={req._id}
                  className="flex items-center justify-between bg-base-200 p-4 rounded-xl"
                >

                  <div className="flex items-center gap-4">

                    <img
                      src={req.senderId.profilePic}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div>

                      <h3 className="font-semibold">
                        {req.senderId.fullName}
                      </h3>

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

          )}

        </div>

        {/* Sent Requests */}
        <div className="bg-base-300 rounded-2xl p-6 shadow">

          <h2 className="text-2xl font-bold mb-6">
            Sent Requests
          </h2>

          {sentRequests.length === 0 ? (

            <p className="text-base-content/60">
              No sent requests
            </p>

          ) : (

            <div className="space-y-4">

              {sentRequests.map((req) => (

                <div
                  key={req._id}
                  className="flex items-center justify-between bg-base-200 p-4 rounded-xl"
                >

                  <div className="flex items-center gap-4">

                    <img
                      src={req.receiverId.profilePic}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div>

                      <h3 className="font-semibold">
                        {req.receiverId.fullName}
                      </h3>

                      <p className="text-sm opacity-70">
                        @{req.receiverId.username}
                      </p>

                    </div>

                  </div>

                  {req.status === "accepted" ? (

                    <button
  onClick={async () => {

    await hideRequest(req._id);

    navigate("/");

  }}
  className="btn btn-primary btn-sm"
>
  Start Chat
</button>

                  ) : (

                    <span className="badge badge-warning badge-lg">
                      Pending
                    </span>

                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default RequestsPage;