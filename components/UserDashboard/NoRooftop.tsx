import React from "react";

interface NoRoofTopProps {
  setActiveItem: (tab: string) => void;
}

const NoRoofTop: React.FC<NoRoofTopProps> = ({ setActiveItem }) => {
  return (
    <div className="flex justify-center items-center h-152">
      <div className="flex bg-gradient-to-br text-white">
        <div className="bg-white/10 p-10 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            🏠 Rooftop Details Missing
          </h2>
          <p className="text-sky-300 mb-6">
            Please enter your rooftop details to access the dashboard.
          </p>
          <button
            onClick={() => setActiveItem("profile")}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold transition cursor-pointer"
          >
            Enter Rooftop Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoRoofTop;
