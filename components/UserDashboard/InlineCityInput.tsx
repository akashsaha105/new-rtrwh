"use client";

import React, { useState } from "react";

const cities = [
  "Adilabad",
  "Agartala",
  "Agra",
  "Ahmedabad",
  "Ahmednagar",
  "Aizawl",
  "Ajmer",
  "Akola",
  "Alappuzha",
  "Aligarh",
  "Allahabad",
  "Almora",
  "Alwar",
  "Amaravati",
  "Ambala",
  "Ambikapur",
  "Amravati",
  "Amreli",
  "Amritsar",
  "Anand",
  "Anantapur",
  "Ankleshwar",
  "Asansol",
  "Aurangabad",
  "Ayodhya",
  "Azamgarh",
  "Bagalkot",
  "Bagdogra",
  "Bahadurgarh",
  "Bahraich",
  "Bajpe",
  "Baleshwar",
  "Ballari",
  "Balrampur",
  "Balurghat",
  "Banda",
  "Bangalore",
  "Bankura",
  "Baramulla",
  "Baran",
  "Barasat",
  "Bareilly",
  "Barh",
  "Baripada",
  "Barmi",
  "Barnala",
  "Barshi",
  "Barwani",
  "Basirhat",
  "Basti",
  "Bathinda",
  "Beawar",
  "Begusarai",
  "Belagavi",
  "Bellary",
  "Belonia",
  "Bengaluru",
  "Berhampore",
  "Berhampur",
  "Betul",
  "Bhagalpur",
  "Bhandara",
  "Bharatpur",
  "Bharuch",
  "Bhatinda",
  "Bhavnagar",
  "Bhilai",
  "Bhilwara",
  "Bhimavaram",
  "Bhind",
  "Bhiwadi",
  "Bhiwani",
  "Bhopal",
  "Bhubaneswar",
  "Bhuj",
  "Bhusawal",
  "Bidar",
  "Bihar Sharif",
  "Bijapur",
  "Bijnor",
  "Bikaner",
  "Bilaspur",
  "Bina",
  "Bishnupur",
  "Bodhan",
  "Bokaro",
  "Bolpur",
  "Bongaigaon",
  "Budaun",
  "Budhwal",
  "Bulandshahr",
    "Buldhana",
  "Bundi",
  "Burhanpur",
  "Byadgi",
  "Chaibasa",
  "Chalakkudy",
  "Chamba",
  "Chandigarh",
  "Chandrapur",
  "Changlang",
  "Chapra",
  "Charkhi Dadri",
  "Chennai",
  "Cherthala",
  "Chhapra",
  "Chhatarpur",
  "Chhindwara",
  "Chikballapur",
  "Chikkamagaluru",
  "Chillarige",
  "Chiplun",
  "Chirala",
  "Chirkunda",
  "Chitradurga",
  "Chittoor",
  "Chittorgarh",
  "Chowk",
  "Coimbatore",
  "Cooch Behar",
  "Coonoor",
  "Cuddalore",
  "Cuttack",
  "Dadra",
  "Dahanu",
  "Daltonganj",
  "Daman",
  "Damoh",
  "Darbhanga",
  "Darjeeling",
  "Darrang",
  "Datia",
  "Dausa",
  "Davanagere",
  "Deesa",
  "Dehradun",
  "Dehri",
  "Delhi",
  "Deoghar",
  "Devakottai",
  "Dewas",
  "Dhamtari",
  "Dhanbad",
  "Dhar",
  "Dharmanagar",
  "Dharmapuri",
  "Dhule",
  "Dibrugarh",
  "Dimapur",
  "Dindigul",
  "Dindori",
  "Dispur",
  "Diu",
  "Doddaballapur",
  "Durg",
  "Durgapur"

]


export default function InlineCityInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [ghost, setGhost] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    onChange(typed);

    const match = cities.find((city) =>
      city.toLowerCase().startsWith(typed.toLowerCase())
    );

    if (typed && match) {
      setGhost(match.slice(typed.length)); // remaining "ata"
      setShowHint(true);
    } else {
      setGhost("");
      setShowHint(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Tab" || e.key === "Enter" || e.key === "ArrowRight") && ghost) {
      e.preventDefault();
      onChange(value + ghost);
      setGhost("");
      setShowHint(false);
    }
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-teal-300 mb-1">
        City
      </label>

      <div className="relative">
        {/* GHOST TEXT OVERLAY */}
        <div
          className="
            absolute inset-0 p-3 
            pointer-events-none select-none 
            text-white
          "
          style={{ whiteSpace: "pre" }}
        >
          <span className="opacity-0">{value}</span>
          <span className="text-slate-500">{ghost}</span>
        </div>

        {/* USER INPUT */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="City"
          className="
            relative w-full p-3 rounded-lg
            bg-slate-900 text-white 
            border border-slate-600
            focus:border-teal-400 outline-none
          "
        />
      </div>

      {/* AUTOCOMPLETE HINT BELOW */}
      {showHint && ghost && (
        <p className="text-xs text-slate-400 mt-1">
          Press <span className="text-teal-400 font-semibold">Tab</span> to autocomplete (
          <span className="text-slate-300">{value + ghost}</span>)
        </p>
      )}
    </div>
  );
}
