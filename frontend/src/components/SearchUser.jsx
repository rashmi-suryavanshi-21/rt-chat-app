import { useState } from "react";
import { X } from "lucide-react";

const SearchUser = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // 👈 Sidebar ko bhejo
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="p-3 border-b border-base-300">
      <div className="relative">

        <input
          value={query}
          onChange={handleChange}
          placeholder="Search..."
          className="w-full border p-2 pr-10 rounded"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}

      </div>

    </div>
  );
};

export default SearchUser;