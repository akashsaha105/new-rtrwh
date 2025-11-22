import React from "react";

export default function InstallNow() {
  return (
    <div className="fixed bottom-0 w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg">
      <div className="max-w-3xl ml-80 px-6 py-3 flex items-center justify-between">
        {/* Message */}
        <p className="text-sm md:text-base font-medium">
          🚀 Your system is now inactive! Install now to start tracking water
          savings.
        </p>

        {/* Button */}
        <button className="bg-white text-green-700 font-semibold px-5 py-2 rounded-xl shadow hover:bg-green-100 transition cursor-pointer">
          Install Now
        </button>
      </div>
    </div>
  );
}
