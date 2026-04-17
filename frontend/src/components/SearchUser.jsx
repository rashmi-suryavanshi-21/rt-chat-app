import { useState } from "react";

const SearchUser = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // 👈 Sidebar ko bhejo
  };

  return (
    <div className="p-3 border-b border-base-300">
      <input
        value={query}
        onChange={handleChange}
        placeholder="Search..."
        className="w-full border p-2 rounded"
      />
    </div>
  );
};

export default SearchUser;