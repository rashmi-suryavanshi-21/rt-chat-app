import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

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

      set((state) => ({
        requests: state.requests.filter(
          (req) => req._id !== id
        ),
      }));

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

  } catch (error) {

    toast.error(
      error.response?.data?.message ||
      "Failed to remove connection"
    );

  }
},

}));