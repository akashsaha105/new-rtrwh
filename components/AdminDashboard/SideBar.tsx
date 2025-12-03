"use client";

import React, { useState, useEffect } from "react";
import { Bars3Icon, ChartPieIcon, XMarkIcon } from "@heroicons/react/16/solid";
import UserInfo from "./UserInfo";
import { BadgeCent, BellPlus, DownloadIcon, StoreIcon, User2, WorkflowIcon } from "lucide-react";

interface DashboardSideBarProps {
  username?: string | null | undefined;
  email?: string | null | undefined;
  activeItem: string;
  setActiveItem: (id: string) => void;
}

const SideBar: React.FC<DashboardSideBarProps> = ({
  username,
  email,
  activeItem,
  setActiveItem,
}) => {

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const width = 20,
    height = 20;

  const SideBarItems = [
    {
      id: "overview",
      name: "Overview",
      icon: <ChartPieIcon width={width} height={height} />,
    },
    {
      id: "orders",
      name: "Orders",
      icon: <DownloadIcon width={width} height={height} />,
    },
    {
      id: "users",
      name: "Users",
      icon: <WorkflowIcon width={width} height={height} />,
    },
    {
      id: "maintenance",
      name: "Maintenance",
      icon: <BadgeCent width={width} height={height} />,
    },
    {
      id: "products",
      name: "Products",
      icon: <StoreIcon width={width} height={height} />,
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: <BellPlus width={width} height={height} />,
    },
  ];
  
  if (!mounted) return null;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } relative z-50 hidden md:flex flex-col p-4 border-r border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300`}
    >
      {/* Sidebar Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 text-sky-300 text-sm font-semibold cursor-pointer"
      >
        {collapsed ? <Bars3Icon className="w-6 h-6 text-sky-300 animate-pulse mx-auto" /> : (
          <XMarkIcon className="w-6 h-6 text-sky-300 animate-pulse" />
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-2">
        {SideBarItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={`relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all group
              ${
                activeItem === item.id
                  ? "bg-sky-500/30 text-sky-300"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
          >
            {item.icon}
            {!collapsed && <span>{item.name}</span>}
            {collapsed && (
              <span className="absolute z-50 left-16 px-2 py-1 text-xs rounded bg-slate-800/90 text-white opacity-0 group-hover:opacity-100 transition">
                {item.name}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="mt-auto">
        <UserInfo displayName={username} email={email} collapsed={collapsed}/>
      </div>
    </aside>
  );
};

export default SideBar;
