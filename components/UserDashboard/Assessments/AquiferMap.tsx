/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  Marker,
} from "react-leaflet";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
// import "leaflet/dist/leaflet.css";
import { LocationEdit } from "lucide-react";
import { formatAquiferProperties } from "./formatAquiferProperties";

type ClickState = {
  props: { [key: string]: string };
} | null;

// BLUE DOT LIKE GOOGLE MAPS
const userIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function MajorAquifersMap() {
  const [geojson, setGeojson] = useState();
  const [clicked, setClicked] = useState<ClickState>(null);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // const circleRadius = 400; // Google Maps style small radius

  // Load GeoJSON
  useEffect(() => {
    fetch("/MajorAquifers.geojson")
      .then((r) => r.json())
      .then((data) => setGeojson(data));
  }, []);

  // Fit to bounds
  useEffect(() => {
    if (geojson && mapRef.current && geoJsonRef.current) {
      try {
        const layer = geoJsonRef.current as L.GeoJSON;
        const bounds = layer.getBounds();
        if (bounds.isValid())
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      } catch {}
    }
  }, [geojson]);

  // STYLE GEOJSON
  function styleFeature() {
    return {
      weight: 1,
      color: "#2563eb",
      fillColor: "#93c5fd",
      fillOpacity: 0.5,
    };
  }

  // FEATURE EVENTS
  function onEachFeature(feature: any, layer: any) {
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        (e.target as L.Path).setStyle({
          weight: 2,
          color: "#7dd3fc",
          fillOpacity: 0.7,
        });
      },
      mouseout: (e: LeafletMouseEvent) => {
        geoJsonRef.current?.resetStyle(e.target);
      },
      click: (e: LeafletMouseEvent) => {
        setClicked({ props: feature.properties });
        mapRef.current?.fitBounds(e.target.getBounds(), { padding: [20, 20] });
      },
    });
  }

  // 📍 GOOGLE-MAPS STYLE LOCATION DETECTION
  // 📍 DETECT LOCATION + FIND AQUIFER
  async function detectLocation() {
    if (!navigator.geolocation) {
      alert("Your browser does not support location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setUserLat(lat);
        setUserLng(lng);

        mapRef.current?.flyTo([lat, lng], 14, { duration: 1.2 });

        // LOAD IF NOT YET LOADED
        let aquifer = geojson;
        if (!aquifer) {
          const res = await fetch("/MajorAquifers.geojson");
          aquifer = await res.json();
        }

        const point = L.latLng(lat, lng);
        let matched: any = null;

        L.geoJSON(aquifer, {
          onEachFeature: (feature, layer) => {
            if (layer.getBounds().contains(point)) {
              matched = feature;
            }
          },
        });

        if (matched) {
          setClicked({ props: matched.properties });

          const tempLayer = L.geoJSON(matched);
          mapRef.current?.fitBounds(tempLayer.getBounds(), {
            padding: [20, 20],
          });
        } else {
          setClicked({
            props: { message: "No aquifer polygon found at your location." },
          });
        }
      },
      (err) => alert("Please allow location access. " + err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  return (
    <div className="flex flex-col justify-evenly rounded-xl shadow-lg overflow-hidden relative mx-5">
      {/* LEFT: MAP */}
      <h2 className="text-2xl font-semibold text-teal-300 mt-5 mb-10">
        GIS BASED AQUIFER MAP
      </h2>
      {/* MAP SECTION */}
      <div className="w-full h-[60vh] rounded-full overflow-hidden shadow-xl mb-10">
        <MapContainer
          whenCreated={(map: LeafletMap | null) => (mapRef.current = map)}
          center={[20, 78]}
          zoom={5}
          className="w-full h-full rounded-full"
        >
          <TileLayer
            // url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <button
            onClick={detectLocation}
            className="
          absolute z-[9999] bottom-6 left-40
          bg-blue-500
          border border-white/20 text-white shadow-xl
          px-4 py-3 rounded-xl flex items-center gap-2
          hover:bg-white/20 transition cursor-pointer
        "
          >
            <LocationEdit className="w-5 h-5 text-white" />
          </button>

          {geojson && (
            <GeoJSON
              data={geojson}
              style={styleFeature}
              onEachFeature={onEachFeature}
              ref={geoJsonRef}
            />
          )}

          {userLat && userLng && (
            <>
              <Marker position={[userLat, userLng]} icon={userIcon} />
              <Circle
                center={[userLat, userLng]}
                radius={350}
                pathOptions={{
                  color: "#14b8a6",
                  fillColor: "#14b8a6",
                  fillOpacity: 0.2,
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* RIGHT PANEL */}
      {/* PROPERTIES PANEL */}
      <div
        className="w-full backdrop-blur-xl 
                rounded-xl p-5 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-teal-300 mb-7 ml-4">
          Aquifer Details
        </h2>
        {clicked && (
          <div className="mb-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 
                    bg-teal-900/30 border border-teal-700/40 
                    rounded-full shadow-sm"
            >
              <LocationEdit className="w-4 h-4 text-teal-300" />

              <span className="text-teal-200 text-sm font-medium">
                {clicked.props.state || "N/A"} — Aquifer Code:{" "}
                {clicked.props.test || "N/A"}
              </span>
            </div>
          </div>
        )}

        {!clicked && (
          <div className="text-gray-400 text-sm">
            Click on an aquifer zone on the map below to view details.
          </div>
        )}

        {clicked && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {formatAquiferProperties(clicked.props)
              .filter((item) => item.category !== "Location")
              .map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/5 backdrop-blur-lg 
                     border border-white/10 shadow 
                     hover:bg-white/10 transition flex gap-3"
                >
                  <div className="h-8 p-2 bg-teal-900/40 rounded-lg">
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
        )}
      </div>
    </div>
  );
}
