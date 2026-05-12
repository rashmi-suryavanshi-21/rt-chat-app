   import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import {
  BarChart, Bar, PieChart,Pie,Legend,XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { MessageSquare, Send, Inbox, Clock, User, Activity, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserAnalyticsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(`/analytics/${id}`);
        console.log("FULL RESPONSE:", res.data);
        console.log("HOURLY DATA:", res.data.hourlyActivity);



        setData(res.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
   if (!id) return;
fetchAnalytics();
  }, [id]);
  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await axiosInstance.get(`/analytics/${id}`);
      setData(res.data);
    } catch (err) {
      console.log("Auto refresh error:", err);
    }
  }, 60000); // 1 min

  return () => clearInterval(interval);
}, [id]);


  // SAFE DEBUG LOG (FIXED)
  useEffect(() => {
    if (data) {
      console.log("ONLINE TIME RAW:", data.totalOnlineTime);

      console.log("MOST ACTIVE DAY:", JSON.stringify(data.mostActiveDay, null, 2)); // ✅ ADD THIS
      // 🔥 YE LINE ADD KARO
    console.log("Response Time:", data.responseTimeAnalysis);

    console.log("ONLINE TIME RAW:", data.totalOnlineTime);
    }
  }, [data]);


  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error || !data) return (
    <div className="p-6 text-center text-red-500 font-medium">
      {error || "No analytics data found"}
    </div>
  );

  const hourlyData = Array.isArray(data?.hourlyActivity) ? data.hourlyActivity : [];
 const formatTime = (seconds) => {
  if (!seconds) return "0 min";

  const minutes = seconds / 60;

  if (minutes < 1) {
    return `${seconds} sec`; // 👈 small values ke liye
  }

  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);

  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};
  return (

    <div className="min-h-screen bg-base-200 pt-20 text-base-content">
      <div className="max-w-7xl mx-auto w-full">
        {/* HEADER SECTION */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">

  <button
    onClick={() => navigate(-1)}
    className="absolute right-0 -top-5 p-2 rounded-full hover:bg-base-300 transition z-50"
  >
    <X size={22} />
  </button>
          <div>
           <h1 className="text-3xl font-bold "> User Analytics</h1>
            <p className="opacity-70">Deep dive into communication patterns and activity.</p>
          </div>
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 w-fit ${data.isOnline ? "bg-success/20 text-success" 
  : "bg-base-300 text-base-content"}`}>
            <span className={`h-3 w-3 rounded-full ${data.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
            <span className="font-semibold text-sm">{data.isOnline ? "Online Now" : "Offline"}</span>
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<MessageSquare size={20} />} label="Total Chats" value={data.totalChats} color="blue" />
          <StatCard icon={<Send size={20} />} label="Sent" value={data.sent} color="indigo" />
          <StatCard icon={<Inbox size={20} />} label="Received" value={data.received} color="emerald" />
       

<StatCard
  icon={<Clock size={20} />}
  label=" Online Time" 
  value={formatTime(data.totalOnlineTime)}
  color="blue"
/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CHART AREA */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
              <div className="flex items-center gap-2 mb-6 text-base-content">
                <Activity size={20} className="text-blue-500" />
                <h2 className="font-bold text-lg">Hourly Peak Activity</h2>
              </div>
              <div style={{ height: 300, width: "100%", minHeight: 300 }}>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" >
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                      />
                      <YAxis 
                      allowDecimals={false}   // ✅ yeh add karo
                       axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#9ca3af' }} 
                            />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-50">No activity data recorded</div>
                )}
              </div>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
  

  
      
        {/* Response Time Analysis */}
        {/* ADD THIS INSIDE SAME WHITE BOX */}

<div className="mb-4">
  <h2 className="font-bold text-lg">
    Response Time Analysis
  </h2>
</div>


   <div className="space-y-2">
  
      {data?.responseTimeAnalysis?.length > 0 ? (
  data.responseTimeAnalysis.map((item, index) => {
  const seconds = Math.round(item.responseTime / 1000);
  const isFast = seconds <= 120;
    return (
      <div
        key={index}
        className="flex justify-between border-b py-2"
      >
        {/* username */}
        <span>{item.username}</span>

        {/* time */}
        <span>
          {formatTime(seconds)}
        </span>

        {/* status */}
        <span
          className={
            isFast
              ? "text-green-600 font-semibold"
              : "text-red-500 font-semibold"
          }
        >
          {isFast ? "Fast" : "Slow"}
        </span>
      </div>
    );
  })
) : (
  <p className="opacity-50">No response data</p>
)}   
  
</div>

   
</div>
          </div>

          {/* SIDEBAR: INTERACTION DETAILS */}
          <div className="space-y-6">
            <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                Interactions
              </h2>

              <InteractionList title="Chatted With" items={data.chattedWith} />
              <InteractionObjectList title="Messages Sent To" items={data.sentTo} />
              <InteractionObjectList title="Messages Received From" items={data.receivedFrom} />
            </div>

            <div className="bg-base-300 text-base-content p-6 rounded-2xl shadow-xl">
  <p className=" opacity-60 text-xs uppercase font-black tracking-widest mb-1">
    Most Active Day
  </p>

  <h3 className="text-2xl font-bold mb-4 italic text-blue-400">
   {data.mostActiveDay?.day || "N/A"}
  </h3>

  <p className="text-sm opacity-70">
    You exchanged{" "}
    <span className="text-white font-bold">
      {data.mostActiveDay?.count || 0}
    </span>{" "}
    messages on this day.
  </p>
</div>
          </div>

        </div>
      </div>
    </div>
  );
};

// HELPER COMPONENTS FOR CLEANER CODE
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50"
  };
  return (
    <div className="bg-base-100 p-5 rounded-2xl border border-base-300 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium opacity-60 uppercase">{label}</p>
        <p className="text-xl font-bold ">{value || 0}</p>
      </div>
    </div>
  );
};

const InteractionList = ({ title, items }) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2">{title}</h3>
    {items?.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="px-3 py-1 bg-base-200 text-base-content rounded-full text-xs font-medium border border-base-300">
            {item}
          </span>
        ))}
      </div>
    ) : <p className="opacity-50 text-xs italic">None found</p>}
  </div>
);

const InteractionObjectList = ({ title, items }) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
    {items && Object.keys(items).length > 0 ? (
      <ul className="space-y-2">
        {Object.entries(items).map(([user, count], i) => (
          <li key={i} className="flex justify-between items-center text-sm bg-base-200 p-2 rounded-lg">
            <span className="text-base-content font-medium">{user}</span>
            <span className="bg-base-100 px-2 py-0.5 rounded border text-xs font-bold text-blue-600">{count}</span>
          </li>
        ))}
      </ul>
    ) : <p className="text-gray-400 text-xs italic">None found</p>}
  </div>
);

export default UserAnalyticsPage;       