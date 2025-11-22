"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";

interface SearchButtonProps {
  setActiveItem: (id: string) => void;
}

const SearchBar: React.FC<SearchButtonProps> = ({ setActiveItem }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [elements, setElements] = useState<
    { id: string; text: string; tab: string }[]
  >([]);
  const [filtered, setFiltered] = useState<typeof elements>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // ------------------------------
  // MUTATION OBSERVER FIX (MAIN FIX)
  // ------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const collectElements = () => {
      const list: { id: string; text: string; tab: string }[] = [];

      document.querySelectorAll("[data-tab]").forEach((el) => {
        const target = el as HTMLElement;
        if (!target.id) return;

        list.push({
          id: target.id,
          text: target.innerText.trim(),
          tab: target.getAttribute("data-tab") || "",
        });
      });

      setElements(list);
    };

    // Initial load
    collectElements();

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      collectElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  // Filter results when user types
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      setHighlightIndex(-1);
      return;
    }

    const result = elements.filter((el) =>
      el.text.toLowerCase().includes(query.toLowerCase())
    );

    setFiltered(result);
    setHighlightIndex(result.length ? 0 : -1);
  }, [query, elements]);

  const scrollToElement = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const selectItem = (id: string, tab: string) => {
    setActiveItem(tab);

    setTimeout(() => scrollToElement(id), 150);

    setQuery("");
    setFiltered([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    }

    if (e.key === "Enter" && highlightIndex >= 0) {
      const item = filtered[highlightIndex];
      selectItem(item.id, item.tab);
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center px-6 relative z-50">
      <div className="relative w-full max-w-md">
        <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-teal-500 h-5 w-5 cursor-pointer" onClick={() => inputRef.current?.focus()}/>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 text-white/90 
          placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-teal-500 
          backdrop-blur-sm shadow-md"
        />
      </div>

      {showDropdown && query && (
        <div className="absolute mt-2 top-12 w-full max-w-md 
        bg-slate-900/95 backdrop-blur-lg rounded-2xl 
        border border-white/10 shadow-2xl p-2 z-50">

          {filtered.length > 0 ? (
            <ul>
              {filtered.map((el, index) => (
                <li
                  key={el.id}
                  onClick={() => selectItem(el.id, el.tab)}
                  className={`px-4 py-2 rounded-lg cursor-pointer text-white/90 transition ${
                    index === highlightIndex
                      ? "bg-indigo-600/60"
                      : "hover:bg-indigo-600/40"
                  }`}
                >
                  {el.text.length > 80
                    ? el.text.slice(0, 80) + "…"
                    : el.text}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
