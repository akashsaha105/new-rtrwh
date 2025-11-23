"use client";

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { GoogleGenAI, Type } from "@google/genai";
import { area, polygon } from "@turf/turf";
import {
  MapPin,
  Maximize,
  Loader2,
  Calculator,
  Scan,
  PenTool,
  Trash2,
  Search,
  MousePointerClick
} from "lucide-react";

// --- Types ---

type Coord = { lat: number; lng: number };
type Point = { x: number; y: number };

interface RoofData {
  id: string;
  polygon: Coord[];
  areaSqM: number;
  type: 'auto' | 'manual';
}

// --- Helpers for Tile Math ---

// Convert Lat/Lon to Tile Coordinates (Mercator)
function long2tile(lon: number, zoom: number) { return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom))); }
function lat2tile(lat: number, zoom: number) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))); }

// Convert Tile Coordinate + Percent Offset to Lat/Lon
function tile2long(x: number, z: number) { return (x / Math.pow(2, z) * 360 - 180); }
function tile2lat(y: number, z: number) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

// --- Components ---

const DetectArea: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [manualPoints, setManualPoints] = useState<Coord[]>([]);
  const [roofs, setRoofs] = useState<RoofData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for drawing layer
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    const initMap = () => {
      // Default to San Francisco
      const initialLat = 37.7749;
      const initialLng = -122.4194;

      const map = L.map("map-container", {
        zoomControl: false,
        attributionControl: false
      }).setView([initialLat, initialLng], 19);

      // Esri World Imagery (Satellite)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      }).addTo(map);

      // Add labels overlay (optional, but helps context)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        pane: 'shadowPane' // Use a lower pane or custom pane to sit above satellite but below polygons
      }).addTo(map);

      // Drawing layer
      const drawLayer = L.layerGroup().addTo(map);
      drawingLayerRef.current = drawLayer;

      setMapInstance(map);

      // Try to get real user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            map.flyTo([latitude, longitude], 19);
          },
          (err) => console.warn("Geolocation denied or failed", err)
        );
      }
    };

    if (typeof window !== "undefined") {
      const el = document.getElementById("map-container");
      if (el && !(el as any)._leaflet_id) {
        initMap();
      }
    }
  }, []);

  // Handle Map Clicks for Manual Drawing
  useEffect(() => {
    if (!mapInstance) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!drawMode) return;
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setManualPoints(prev => [...prev, newPoint]);
    };

    mapInstance.on('click', handleMapClick);
    return () => {
      mapInstance.off('click', handleMapClick);
    };
  }, [mapInstance, drawMode]);

  // Render Polygons on Map
  useEffect(() => {
    if (!mapInstance || !drawingLayerRef.current) return;

    const layerGroup = drawingLayerRef.current;
    layerGroup.clearLayers();

    // Render Manual Points in Progress
    if (drawMode && manualPoints.length > 0) {
      manualPoints.forEach(pt => {
        L.circleMarker([pt.lat, pt.lng], {
          radius: 4,
          color: '#3b82f6',
          fillColor: '#fff',
          fillOpacity: 1
        }).addTo(layerGroup);
      });

      if (manualPoints.length > 1) {
        L.polyline(manualPoints.map(p => [p.lat, p.lng]), {
          color: '#3b82f6',
          dashArray: '5, 5'
        }).addTo(layerGroup);
      }
    }

    // Render Completed Roofs
    roofs.forEach(roof => {
      const latlngs = roof.polygon.map(p => [p.lat, p.lng] as [number, number]);
      const polygon = L.polygon(latlngs, {
        color: roof.type === 'auto' ? '#ef4444' : '#10b981', // Red for Auto, Green for Manual
        weight: 2,
        fillColor: roof.type === 'auto' ? '#ef4444' : '#10b981',
        fillOpacity: 0.3
      }).addTo(layerGroup);

      // Add Tooltip with Area
      const center = polygon.getBounds().getCenter();
      const areaLabel = L.divIcon({
        className: 'bg-white/90 px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap',
        html: `<div>${Math.round(roof.areaSqM)} m²</div><div class="text-[10px] text-gray-500">${Math.round(roof.areaSqM * 10.764)} sqft</div>`
      });
      L.marker(center, { icon: areaLabel }).addTo(layerGroup);
    });

  }, [mapInstance, roofs, manualPoints, drawMode]);

  // -- Logic --

  const calculateArea = (coords: Coord[]) => {
    if (coords.length < 3) return 0;

    // Close the polygon if needed
    const points = coords.map(c => [c.lng, c.lat]);
    if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) {
      points.push(points[0]);
    }

    const poly = polygon([points]);
    return area(poly);
  };

  const finishManualDraw = () => {
    if (manualPoints.length < 3) {
      setError("Need at least 3 points to close a polygon.");
      return;
    }

    const area = calculateArea(manualPoints);
    const newRoof: RoofData = {
      id: Date.now().toString(),
      polygon: manualPoints,
      areaSqM: area,
      type: 'manual'
    };

    setRoofs(prev => [...prev, newRoof]);
    setManualPoints([]);
    setDrawMode(false);
  };

  const performSearch = async () => {
    if (!searchQuery || !mapInstance) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        mapInstance.flyTo([parseFloat(lat), parseFloat(lon)], 19);
      } else {
        setError("Location not found");
      }
    } catch (e) {
      setError("Search failed");
    }
  };

  const detectRoofWithGemini = async () => {
    if (!mapInstance) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Get current center and zoom
      const center = mapInstance.getCenter();
      const zoom = Math.round(mapInstance.getZoom());

      if (zoom < 18) {
        throw new Error("Please zoom in closer to a specific building (Zoom 18+).");
      }

      // 2. Calculate Tile coordinates
      const x = long2tile(center.lng, zoom);
      const y = lat2tile(center.lat, zoom);
      const z = zoom;

      // 3. Fetch Tile Image
      // NOTE: Fetching directly might hit CORS if we try to read bytes. 
      // Esri usually allows it, but if this fails, we would need a proxy or fallback to user upload.
      // We will try standard fetch.
      const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

      const response = await fetch(tileUrl);
      if (!response.ok) throw new Error("Failed to fetch satellite data.");
      const blob = await response.blob();

      // Convert to Base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      // 4. Call Gemini
      const apiKey = "AIzaSyBvGFSk2uT0Vw7M9-94p_6paSbBVMOiLIo";
      if (!apiKey) throw new Error("API Key not found");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Analyze this satellite tile. 
        Identify the polygon boundary of the MAIN BUILDING ROOF located exactly in the CENTER of this image.
        Return a JSON object with a 'polygon' property containing an array of vertex points.
        Each point should have 'x' and 'y' values representing percentage (0-100) of the image width/height.
        Example: Top-Left is 0,0. Bottom-Right is 100,100. Center is 50,50.
        Ignore other buildings. Only outline the one in the center.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polygon: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      const safeJson = result.text ?? "";
      const json = JSON.parse(safeJson);

      if (!json.polygon || json.polygon.length < 3) {
        throw new Error("Could not detect a distinct roof in the center.");
      }

      // 5. Convert 0-100% Image Coords back to Lat/Lon
      // The tile covers a specific geographic bbox.
      // x (tile coord) -> x+0 to x+1
      // We interpolate.

      const polyLatLons: Coord[] = json.polygon.map((pt: Point) => {
        // pt.x is 0-100 on the specific tile x
        // Global tile X coordinate = tileX + (pt.x / 100)
        const globalTileX = x + (pt.x / 100);
        const globalTileY = y + (pt.y / 100);

        return {
          lat: tile2lat(globalTileY, z),
          lng: tile2long(globalTileX, z)
        };
      });

      const area = calculateArea(polyLatLons);

      setRoofs(prev => [...prev, {
        id: Date.now().toString(),
        polygon: polyLatLons,
        areaSqM: area,
        type: 'auto'
      }]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Detection failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -- Render --

  return (
    <div className="relative w-full h-full font-sans text-slate-900">

      {/* Map Container */}
      <div id="map-container" className="absolute inset-0 bg-slate-200" />

      {/* Center Crosshair (Target) */}
      <div className="center-crosshair text-white/80 drop-shadow-md">
        <Scan size={48} strokeWidth={1} />
      </div>

      {/* Top Left Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 w-80">

        {/* Title Card */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50">
          <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-700">
            <Calculator className="w-5 h-5" />
            Roof Area AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live Satellite View + Auto Detection
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg flex gap-2">
          <input
            type="text"
            placeholder="Search address..."
            className="bg-transparent outline-none text-sm px-2 flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
          />
          <button onClick={performSearch} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Search size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">

          {/* Auto Detect */}
          <button
            onClick={detectRoofWithGemini}
            disabled={isAnalyzing || drawMode}
            className={`
              relative overflow-hidden group
              flex items-center justify-center gap-2 p-3 rounded-xl shadow-lg font-semibold text-sm transition-all
              ${isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'}
            `}
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin" size={18} /> Analyzing Tile...</>
            ) : (
              <><Scan size={18} /> Auto-Detect Roof (AI)</>
            )}
            {!isAnalyzing && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />}
          </button>

          {/* Manual Draw Toggle */}
          {!drawMode ? (
            <button
              onClick={() => { setDrawMode(true); setManualPoints([]); }}
              className="flex items-center justify-center gap-2 p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all"
            >
              <PenTool size={18} /> Draw Manually
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={finishManualDraw}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 font-medium text-sm"
              >
                <MousePointerClick size={18} /> Finish Shape
              </button>
              <button
                onClick={() => { setDrawMode(false); setManualPoints([]); }}
                className="px-3 bg-white text-slate-600 rounded-xl shadow hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Draw Instructions */}
        {drawMode && (
          <div className="bg-emerald-50/90 backdrop-blur border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2">
            Click on the map to outline the roof points. Click "Finish Shape" to calculate area.
          </div>
        )}

        {/* Stats Card */}
        {roofs.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-700">Calculated Areas</h3>
              <button onClick={() => setRoofs([])} className="text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {roofs.map((roof, i) => (
                <div key={roof.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 last:border-0">
                  <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roof.type === 'auto' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    Roof {i + 1}
                  </span>
                  <span className="font-mono font-medium">
                    {Math.round(roof.areaSqM)} m²
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-indigo-900">
                <span>Total</span>
                <span>{Math.round(roofs.reduce((acc, r) => acc + r.areaSqM, 0))} m²</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm shadow-lg flex items-center gap-2 animate-in slide-in-from-left-2">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
          </div>
        )}

      </div>

      {/* Locate Me Button */}
      <button
        onClick={() => {
          if (navigator.geolocation && mapInstance) {
            navigator.geolocation.getCurrentPosition(pos => {
              mapInstance.flyTo([pos.coords.latitude, pos.coords.longitude], 19);
            });
          }
        }}
        className="absolute bottom-8 right-8 bg-white p-3 rounded-full shadow-xl hover:bg-slate-50 text-slate-700 z-[1000]"
        title="Find my location"
      >
        <MapPin size={24} />
      </button>
    </div>
  );
};

export default DetectArea;