'use client';
import { useEffect, useRef, useState } from "react";

const SearchableDropdown = ({
  options,
  label, // e.g., "name"
  idKey, // e.g., "id"
  selectedVal,
  handleChange
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const toggle = (e) => setIsOpen(e && e.target === inputRef.current);
    document.addEventListener("click", toggle);
    return () => document.removeEventListener("click", toggle);
  }, []);

  const selectOption = (option) => {
    setQuery("");
    // Pass the whole option back so we have access to the ID and Label
    handleChange(option); 
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (query) return query;
    if (selectedVal) return selectedVal;
    return "";
  };

  const filter = (options) => {
    return options.filter(
      (option) => option[label].toLowerCase().indexOf(query.toLowerCase()) > -1
    );
  };

  return (
    <div className="dropdown w-full relative">
      <div className="control relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Search ${label}...`}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={getDisplayValue()}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
        <div className={`arrow ${isOpen ? "open" : ""}`}></div>
      </div>

      {isOpen && (
        <div className="options absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filter(options).map((option, index) => (
            <div
              key={`${option[idKey]}-${index}`}
              onClick={() => selectOption(option)}
              className={`p-3 cursor-pointer hover:bg-blue-50 ${
                option[label] === selectedVal ? "bg-blue-100 font-bold" : ""
              }`}
            >
              {option[label]}
            </div>
          ))}
          {filter(options).length === 0 && (
            <div className="p-3 text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;