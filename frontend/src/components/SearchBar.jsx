import { FiSearch } from "react-icons/fi";

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <FiSearch className="text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
