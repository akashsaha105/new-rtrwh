"use client";

import React from "react";

interface UserRank {
  name: string;
  litres: number;
  points: number;
  reward: string;
  rank: number;
}

const topUsers: UserRank[] = [
  {
    name: "Arjun Sharma",
    litres: 320000,
    points: 640,
    reward: "1 Year Free Maintenance + Gold Badge",
    rank: 1,
  },
  {
    name: "Priya Verma",
    litres: 275000,
    points: 550,
    reward: "30% Maintenance Discount + Silver Badge",
    rank: 2,
  },
  {
    name: "Rahul Das",
    litres: 210000,
    points: 460,
    reward: "Free Filter Replacement + Bronze Badge",
    rank: 3,
  },
];

const RewardPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <h1 className="text-4xl font-bold text-center mb-10 text-teal-300">
        Top 3 Groundwater Heroes (2025)
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {topUsers.map((user) => (
          <div
            key={user.rank}
            className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-teal-700/40"
          >
            <h2 className="text-3xl font-bold text-teal-400 mb-2">#{user.rank}</h2>
            <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
            <p className="text-gray-300 text-sm mb-1">
              Recharge Volume: <span className="font-semibold">{user.litres.toLocaleString()} L</span>
            </p>
            <p className="text-gray-300 text-sm mb-1">
              Points: <span className="font-semibold">{user.points}</span>
            </p>
            <p className="text-gray-200 mt-3">
              <span className="font-semibold text-teal-300">Reward:</span> {user.reward}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-3xl font-semibold text-teal-300 mb-6">Rewards You Can Earn</h2>
      <div className="space-y-4 mb-12">
        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-xl font-semibold text-teal-400 mb-2">Gold Tier</h3>
          <ul className="text-gray-300 list-disc ml-5 space-y-1">
            <li>Free Annual Maintenance</li>
            <li>Gold Profile Badge</li>
            <li>Featured on Leaderboard</li>
            <li>Priority Support</li>
          </ul>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-xl font-semibold text-teal-400 mb-2">Silver Tier</h3>
          <ul className="text-gray-300 list-disc ml-5 space-y-1">
            <li>20-30% Maintenance Discount</li>
            <li>Free Filter Replacement</li>
            <li>Silver Badge</li>
          </ul>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-xl font-semibold text-teal-400 mb-2">Bronze Tier</h3>
          <ul className="text-gray-300 list-disc ml-5 space-y-1">
            <li>10% Maintenance Discount</li>
            <li>Bronze Badge</li>
            <li>Monthly System Health Tips</li>
          </ul>
        </div>
      </div>

      <h2 className="text-3xl font-semibold text-teal-300 mb-6">Rules & Eligibility</h2>
      <ul className="bg-slate-800 p-6 rounded-2xl border border-teal-700/40 text-gray-300 list-disc ml-5 space-y-2 mb-12">
        <li>User must have an active rooftop rainwater harvesting system.</li>
        <li>Rewards calculated based on recharge litres, maintenance, and active months.</li>
        <li>Top 3 selected automatically every year.</li>
        <li>Rewards reset annually and are non-transferable.</li>
        <li>False data results in disqualification.</li>
      </ul>

      <h2 className="text-3xl font-semibold text-teal-300 mb-6">FAQs</h2>

      <div className="space-y-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-lg font-bold text-teal-400 mb-1">How do I earn points?</h3>
          <p className="text-gray-300">By recharging groundwater and maintaining your system regularly.</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-lg font-bold text-teal-400 mb-1">Do I need sensors installed?</h3>
          <p className="text-gray-300">Not mandatory. Sensors provide bonus points.</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-lg font-bold text-teal-400 mb-1">How are the top 3 chosen?</h3>
          <p className="text-gray-300">Based purely on the total points accumulated in the year.</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-teal-700/40">
          <h3 className="text-lg font-bold text-teal-400 mb-1">Will my name be shown publicly?</h3>
          <p className="text-gray-300">Only if you&apos;re in the top 3 contributors.</p>
        </div>
      </div>
    </div>
  );
};

export default RewardPage;