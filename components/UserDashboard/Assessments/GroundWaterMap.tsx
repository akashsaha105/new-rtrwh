/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatGroundWaterProperties } from "./formatGroundWaterProperties";

type HoverState = {
  props: { [key: string]: any };
  x: number;
  y: number;
} | null;

type ClickState = {
  props: { [key: string]: any };
} | null;

/** compact formatter for cluster counts (5k, 5.1k, 1.2M) */
function formatCompact(n: number) {
  if (n >= 1_000_000) {
    const v = +(n / 1_000_000).toFixed(1);
    return `${v % 1 === 0 ? v.toFixed(0) : v}M`;
  }
  if (n >= 1_000) {
    const v = +(n / 1_000).toFixed(1);
    return `${v % 1 === 0 ? v.toFixed(0) : v}k`;
  }
  return `${n}`;
}

/**
 * GroundWaterMap
 * - Loads data from uploaded file path: /mnt/data/groundwater.geojson
 * - Uses clustering to avoid bombardment
 * - Hover shows a floating quick info card under cursor
 * - Click locks selection in bottom properties panel and shows formatted properties
 * - UI matches the modern style you specified (no further structural changes)
 */
export default function GroundWaterMap() {
  const [gwData, setGwData] = useState<any | null>(null);

  const [hover, setHover] = useState<HoverState>(null);
  const [clicked, setClicked] = useState<ClickState>(null);

  const mapRef = useRef<LeafletMap | null>(null);
  const [isClustered] = useState<boolean>(true); // keep clustering enabled

  // load geojson from the uploaded local path (tool will transform path to accessible URL)
  useEffect(() => {
    fetch("/groundwater.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load groundwater.geojson");
        return r.json();
      })
      .then((data) => setGwData(data))
      .catch((err) => console.error("Error loading groundwater.geojson:", err));
  }, []);

  // color / radius logic (kept small and readable)
  const getColor = (depth: number) => {
    if (depth <= 50) return "#60a5fa"; // blue
    if (depth <= 150) return "#fcd34d"; // yellow
    return "#f472b6"; // pink
  };

  const getRadius = (depth: number) => {
    return Math.min(16, Math.max(6, depth * 0.05));
  };

  // cluster icon with compact count
  function createClusterIcon(cluster: any) {
    const count = cluster.getChildCount();
    const label = formatCompact(count);

    let color = "#60a5fa";
    if (count > 1000) color = "#f472b6";
    else if (count > 300) color = "#fcd34d";

    const html = `
      <div style="
        background: linear-gradient(135deg, rgba(255,255,255,0.14), ${color});
        box-shadow: 0 6px 18px rgba(15,23,42,0.12);
        width:56px;height:56px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border: 3px solid rgba(255,255,255,0.9);
        color:rgba(17,24,39,0.95);
        font-weight:700;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue";
      ">
        <div style="font-size:14px">${label}</div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "gw-cluster-icon",
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });
  }

  console.log(clicked?.props);


  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-teal-400">
            Groundwater Map
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Clustered visualization — zoom to explore wells. Hover for quick
            info, click for full details.
          </p>
        </div>

        {/* Legend (kept minimal and consistent with previous UI) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#60a5fa]" />
              <span className="text-xs text-slate-600">Shallow</span>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="w-3 h-3 rounded-full bg-[#fcd34d]" />
              <span className="text-xs text-slate-600">Medium</span>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="w-3 h-3 rounded-full bg-[#f472b6]" />
              <span className="text-xs text-slate-600">Deep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-[68vh] rounded-full shadow-2xl overflow-hidden relative">
        <MapContainer
          whenCreated={(map) => (mapRef.current = map)}
          center={[22.5, 79]}
          zoom={5}
          className="w-full h-full rounded-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {gwData && isClustered && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={80}
              iconCreateFunction={createClusterIcon}
            >
              {gwData.features.map((f: any, i: number) => {
                // some files have coords in properties, some in geometry — handle both
                const lat = f.geometry?.type?.toLowerCase().includes("point")
                  ? Number(f.geometry.coordinates[1])
                  : Number(f.properties?.Latitude);
                const lng = f.geometry?.type?.toLowerCase().includes("point")
                  ? Number(f.geometry.coordinates[0])
                  : Number(f.properties?.Longitude);

                if (!lat || !lng) return null;

                // depth field can vary; pick common names, fallback to 0
                const depth =
                  Number(
                    f.properties?.[
                      "Pre-monsoon_2022 (meters below ground level)"
                    ]
                  ) ||
                  Number(f.properties?.["Well_Depth (meters)"]) ||
                  Number(f.properties?.Well_Depth) ||
                  0;

                const color = getColor(depth);
                const radius = getRadius(depth);

                return (
                  <CircleMarker
                    key={i}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.88,
                      weight: 0.8,
                    }}
                    eventHandlers={{
                      mouseover: (e) =>
                        setHover({
                          props: f.properties,
                          x: e.originalEvent.clientX,
                          y: e.originalEvent.clientY,
                        }),
                      mouseout: () => setHover(null),
                      click: () => setClicked({ props: f.properties }),
                    }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{depth} m</div>
                      {Object.entries(f.properties ?? {})
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div key={k} className="text-xs text-slate-600">
                            <strong>{k}:</strong> {String(v)}
                          </div>
                        ))}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {gwData && !isClustered && (
            <>
              {gwData.features.map((f: any, i: number) => {
                const lat = f.geometry?.type?.toLowerCase().includes("point")
                  ? Number(f.geometry.coordinates[1])
                  : Number(f.properties?.Latitude);
                const lng = f.geometry?.type?.toLowerCase().includes("point")
                  ? Number(f.geometry.coordinates[0])
                  : Number(f.properties?.Longitude);

                if (!lat || !lng) return null;

                const depth =
                  Number(
                    f.properties?.[
                      "Pre-monsoon_2022 (meters below ground level)"
                    ]
                  ) ||
                  Number(f.properties?.["Well_Depth (meters)"]) ||
                  Number(f.properties?.Well_Depth) ||
                  0;

                const color = getColor(depth);
                const radius = getRadius(depth);

                return (
                  <CircleMarker
                    key={i}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.88,
                      weight: 0.8,
                    }}
                    eventHandlers={{
                      mouseover: (e) =>
                        setHover({
                          props: f.properties,
                          x: e.originalEvent.clientX,
                          y: e.originalEvent.clientY,
                        }),
                      mouseout: () => setHover(null),
                      click: () => setClicked({ props: f.properties }),
                    }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{depth} m</div>
                      {Object.entries(f.properties ?? {})
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div key={k} className="text-xs text-slate-600">
                            <strong>{k}:</strong> {String(v)}
                          </div>
                        ))}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </>
          )}
        </MapContainer>

        {/* hover quick info (floating under cursor) */}
        {hover && (
          <div
            className="absolute bg-white/95 border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-[320px]"
            style={{
              //   left: hover.x + 12,
              left: 100,
              top: 40,
              zIndex: 9999,
            }}
          >
            <div className="text-xs text-slate-500 mb-1">Quick info</div>
            <div className="text-sm font-semibold text-slate-800 mb-2">
              {hover.props?.Site_Name ?? hover.props?.Village ?? "Location"}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(hover.props ?? {})
                .slice(0, 6)
                .map(([k, v]) => (
                  <div key={k} className="text-xs text-slate-700">
                    <div className="text-slate-400">{k}</div>
                    <div className="font-medium">{String(v)}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* bottom properties panel — uses your properties formatter */}
      {/* bottom properties panel — UPDATED UI */}
      {/* -------------- BOTTOM DETAILS PANEL -------------- */}
      <div className="mt-6 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-teal-300">
              Groundwater Details
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Click any dot or cluster to lock details here.
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}
        {!clicked && (
          <div className="text-sm text-slate-500">No well selected.</div>
        )}

        {clicked && (
          <div className="space-y-6">
            {/* ------------------------ LOCATION BADGES ------------------------ */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                {/* State */}
                {clicked.props.State_Name_With_LGD_Code && (
                  <span className="px-4 py-1.5 bg-blue-900/40 text-blue-200 rounded-full text-xs font-medium border border-blue-700/50 shadow-sm">
                    State:{" "}
                    {clicked.props.State_Name_With_LGD_Code.split("_")[0]}
                  </span>
                )}

                {/* District */}
                {clicked.props.District_Name_With_LGD_Code && (
                  <span className="px-4 py-1.5 bg-teal-900/40 text-teal-200 rounded-full text-xs font-medium border border-teal-700/50 shadow-sm">
                    District:{" "}
                    {clicked.props.District_Name_With_LGD_Code.split("_")[0]}
                  </span>
                )}

                {/* Block */}
                {clicked.props.Block_Name_With_LGD_Code && (
                  <span className="px-4 py-1.5 bg-emerald-900/40 text-emerald-200 rounded-full text-xs font-medium border border-emerald-700/50 shadow-sm">
                    Block:{" "}
                    {clicked.props.Block_Name_With_LGD_Code.split("_")[0]}
                  </span>
                )}

                {/* Village / Site */}
                {(clicked.props.Site_Name || clicked.props.Village) && (
                  <span className="px-4 py-1.5 bg-purple-900/40 text-purple-200 rounded-full text-xs font-medium border border-purple-700/50 shadow-sm">
                    {clicked.props.Site_Name || clicked.props.Village}
                  </span>
                )}
              </div>

              <div>
                {clicked.props.SOURCE && (
                  <span className="flex items-center justify-between gap-4 px-1.5 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-xl shadow">
                    <span className="p-1.5 bg-teal-700/40 rounded-md">
                      <svg
                        className="w-3 h-3 text-teal-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M2 10h16M10 2v16"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                    <span className="text-xs text-gray-100 font-medium">
                    {clicked.props.SOURCE}
                    </span>
                  </span>
                )}
              </div>
              {/* Source */}
            </div>

            {/* ---------------------------- CATEGORY SECTIONS ---------------------------- */}

            <div className="space-y-6">
              {/* ---------- AQUIFER DETAILS ---------- */}
              <div>
                <h4 className="text-sm font-semibold text-teal-200 mb-3">
                  Aquifer Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formatGroundWaterProperties(clicked.props)
                    .filter((item) => item.category === "aquifer")
                    .map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 backdrop-blur-lg 
                     border border-white/10 shadow 
                     hover:bg-white/10 transition flex gap-3"
                      >
                        <div className="h-9 w-9 flex items-center justify-center bg-teal-900/40 rounded-lg">
                          {item.icon}
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">
                            {item.label}
                          </div>
                          <div className="text-sm text-gray-100 mt-1">
                            {String(item.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* ---------- WELL DETAILS ---------- */}
              <div>
                <h4 className="text-sm font-semibold text-teal-200 mb-3">
                  Well Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formatGroundWaterProperties(clicked.props)
                    .filter(
                      (item) =>
                        item.category === "well" || item.category === "wellType"
                    )
                    .map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 backdrop-blur-lg 
                     border border-white/10 shadow 
                     hover:bg-white/10 transition flex gap-3"
                      >
                        <div className="h-9 w-9 flex items-center justify-center bg-teal-900/40 rounded-lg">
                          {item.icon}
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">
                            {item.label} {item.category == "well" && (
                              <span className="lowercase">(m)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-100 mt-1">
                            {String(item.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* ---------- 2022 SPECIAL SECTION ---------- */}
              <div>
                <h4 className="text-sm font-semibold text-teal-200 mb-3">
                  Ground Water Level (2022)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formatGroundWaterProperties(clicked.props)
                    .filter(
                      (item) =>
                        item.category === "PreMonsoon2022" ||
                        item.category === "PostMonsoon2022"
                    )
                    .map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 backdrop-blur-lg 
                     border border-white/10 shadow 
                     hover:bg-white/10 transition flex gap-3"
                      >
                        <div className="h-9 w-9 flex items-center justify-center bg-teal-900/40 rounded-lg">
                          {item.icon}
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">
                            {item.label} <span className="lowercase">(m)</span>
                          </div>
                          <div className="text-sm text-gray-100 mt-1">
                            {String(item.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
