"use client";

import React, { useState, useEffect, useRef } from "react";

type MapboxFeature = { place_name: string };

type Props = {
  label: string;
  value: string;
  name: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (value: string) => void;
};

export default function AutocompleteInput({
  label,
  value,
  name,
  placeholder,
  onChange,
  onSelect,
}: Props) {
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [active, setActive] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // ⭐ KEY FIX

  const userTriggered = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // HIDE WHEN CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShow(false);
        setIsTyping(false); // hide suggestions & disable future popup
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FETCH SUGGESTIONS
  useEffect(() => {
    if (!isTyping || !value.trim()) {
      setResults([]);
      setShow(false);
      return;
    }

    if (!userTriggered.current) {
      userTriggered.current = true;
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json?access_token=pk.eyJ1IjoiYWthc2hzYWhhMTAyIiwiYSI6ImNtaWl2dG13bjBlZzUzZ3I0aHFrcDNycm0ifQ.JSrM4AivZLEumWdZ_HP0uQ&autocomplete=true&country=in`
      );
      const data = await res.json();

      setResults(data.features || []);
      setShow(true);
      setLoading(false);
    };

    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [value, isTyping]); // ⭐ depends on typing

  const finishSelection = (text: string) => {
    userTriggered.current = false;
    onSelect(text);
    setShow(false);
    setIsTyping(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-teal-300 mb-1">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          // DO NOT show suggestions yet
          // Only typing will trigger suggestions
        }}
        onChange={(e) => {
          userTriggered.current = true;
          setIsTyping(true); // ⭐ activate autocompletion ONLY now
          onChange(e);
        }}
        onKeyDown={(e) => {
          if (!show) return;

          if (e.key === "ArrowDown") {
            setActive((prev) => (prev + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            setActive((prev) => (prev - 1 + results.length));
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            finishSelection(results[active].place_name);
          }
        }}
        className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-600 focus:border-teal-400 outline-none"
      />

      {show && isTyping && (
        <ul className="absolute left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
          {loading && (
            <li className="p-3 text-slate-400 text-sm animate-pulse">
              Loading address…
            </li>
          )}

          {!loading &&
            results.map((item, index) => (
              <li
                key={item.place_name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  finishSelection(item.place_name);
                }}
                className={`p-3 cursor-pointer hover:bg-slate-700 ${
                  index === active ? "bg-slate-700" : ""
                }`}
              >
                {item.place_name}
              </li>
            ))}

          {!loading && results.length === 0 && (
            <li className="p-3 text-slate-500 text-sm">No matches found</li>
          )}
        </ul>
      )}
    </div>
  );
}
