'use client';
import { useEffect, useRef, useState } from "react";

// Define the shape of a single option (Board or Sprint)
interface DropdownOption {
  id: number | string;
  name: string;
  [key: string]: any; // Allows for other properties like 'type' or 'state'
}

// Define the Props interface
interface SearchableDropdownProps {
  options: DropdownOption[];
  label: keyof DropdownOption; // Ensures the label is a valid key of the option
  idKey: keyof DropdownOption; // Ensures the idKey is a valid key of the option
  selectedVal: string;
  handleChange: (option: DropdownOption | null) => void;
}

const SearchableDropdown = ({
  options,
  label,
  idKey,
  selectedVal,
  handleChange
}: SearchableDropdownProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const toggle = (e: MouseEvent) => {
      setIsOpen(e && e.target === inputRef.current);
    };
    document.addEventListener("click", toggle);
    return () => document.removeEventListener("click", toggle);
  }, []);

  const selectOption = (option: DropdownOption) => {
    setQuery("");
    handleChange(option);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (query) return query;
    if (selectedVal) return selectedVal;
    return "";
  };

  const filteredOptions = options.filter(
    (option) => 
      option[label]?.toString().toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="dropdown w-full relative">
      <div className="control relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Search ${String(label)}...`}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={getDisplayValue()}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isOpen && (
        <div className="options absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
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
          {filteredOptions.length === 0 && (
            <div className="p-3 text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;