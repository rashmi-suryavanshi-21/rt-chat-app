import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { useChatStore } from "./useChatStore";

export const useRequestStore = create((set) => ({

  requests: [],
sentRequests: [],

  getPendingRequests: async () => {
    try {

      const res = await axios.get(
  "http://localhost:5001/api/request/pending",
  {
    withCredentials: true,
  }
);

      set({
        requests: res.data,
      });

    } catch (error) {
      toast.error("Failed to load requests");
    }
  },

  acceptRequest: async (id) => {
    try {

      await axios.put(
  `http://localhost:5001/api/request/accept/${id}`,
  {},
  {
    withCredentials: true,
  }
);
      toast.success("Request accepted");

      const res = await axios.get("/api/request/status/" + id);

      set((state) => ({
        requests: state.requests.filter(
          (req) => req._id !== id
        ),
         sentRequests: state.sentRequests.map((req) =>
        req._id === id
          ? { ...req, status: "accepted" }
          : req
      ),
      }));

      const connectedUserId = res.data.userId;
      const { selectedUser } = useChatStore.getState();
      

      if (selectedUser?._id === connectedUserId) {
      useChatStore.setState({
        selectedUser: {
          ...selectedUser,
          isConnected: true,
        },
      });
      }


    } catch (error) {
      toast.error("Failed to accept");
    }
  },

  rejectRequest: async (id) => {
  try {

    console.log("Rejecting:", id);

    const res = await axios.delete(
      `http://localhost:5001/api/request/reject/${id}`,
      {
        withCredentials: true,
      }
    );

    console.log(res.data);

    toast.success("Request rejected");

    set((state) => ({
      requests: state.requests.filter(
        (req) => req._id !== id
      ),
    }));

  } catch (error) {
    console.log(error);
    toast.error("Failed to reject");
  }
},
  addRequestRealtime: (request) => {
  set((state) => ({
    requests: [request, ...state.requests],
  }));
},
  getSentRequests: async () => {
  try {

    const res = await axios.get(
      "http://localhost:5001/api/request/sent",
      {
        withCredentials: true,
      }
    );

    set({
      sentRequests: res.data,
    });

  } catch (error) {
    console.log(error);
  }
},
hideRequest: async (id) => {
  try {

    await axios.put(
      `/api/request/hide/${id}`
    );

    set((state) => ({
      sentRequests: state.sentRequests.filter(
        (req) => req._id !== id
      ),
    }));

  } catch (error) {

    console.log(error);

  }
},
removeConnection: async (userId) => {
  try {

    await axios.delete(
      `/api/request/remove/${userId}`
    );

    toast.success("Connection removed");

    const {selectedUser} = useChatStore.getState();


    set((state) => ({
      sentRequests: state.sentRequests.filter(
        (req) => req._id !== userId
      ),

      // optional but IMPORTANT for chat UI
      requests: state.requests.filter(
        (req) => req._id !== userId
      ),
    }));

    if (selectedUser?._id === userId) {
      useChatStore.setState({
        selectedUser: {
          ...selectedUser,
          isConnected: false,
        },
      });
    }


  } catch (error) {

    toast.error(
      error.response?.data?.message ||
      "Failed to remove connection"
    );

  }
},

}));