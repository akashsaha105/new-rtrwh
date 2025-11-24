// app/api/aquifer/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// Optional: if @turf/boolean-point-in-polygon is installed, use it for robustness.
let booleanPointInPolygon: ((pt: any, poly: any) => boolean) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  booleanPointInPolygon = require("@turf/boolean-point-in-polygon").default;
} catch {
  booleanPointInPolygon = null;
}

type Feature = {
  type: string;
  properties?: Record<string, any>;
  geometry?: any;
};

const CANDIDATE_FILES = [
  path.join(process.cwd(), "public", "AquiferMaterial.geojson"),
  path.join(process.cwd(), "public", "MajorAquifers.geojson"),
  "/mnt/data/AquiferMaterial.geojson",
  "/mnt/data/MajorAquifers.geojson",
  // path.join(process.cwd(), "public", "aquifer.geojson"),
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lng = parseFloat(url.searchParams.get("lng") || "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: "lat & lng required" }, { status: 400 });
    }

    // Find first existing candidate file
    const geoPath = CANDIDATE_FILES.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    if (!geoPath) {
      return NextResponse.json({
        aquifer: null,
        history: null,
        note:
          "No GeoJSON found. Place AquiferMaterial.geojson or MajorAquifers.geojson in public/ or upload to /mnt/data/",
      });
    }

    const raw = fs.readFileSync(geoPath, "utf8");
    let geo: any;
    try {
      geo = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ error: "Invalid GeoJSON file" }, { status: 500 });
    }

    // Build lightweight bbox index to skip far polygons quickly
    const point = [lng, lat] as [number, number];
    const candidates: Feature[] = [];

    for (const feat of geo.features || []) {
      if (!feat || !feat.geometry) continue;
      // compute bounding box from geometry coordinates (fast)
      const bbox = geometryBBox(feat.geometry);
      if (bbox) {
        const [minX, minY, maxX, maxY] = bbox;
        if (lng < minX || lng > maxX || lat < minY || lat > maxY) {
          continue; // cannot contain point
        }
      }
      // full point-in-polygon test
      const inside = pointInGeom(point, feat.geometry);
      if (inside) candidates.push(feat);
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        aquifer: null,
        history: null,
        note: "No local aquifer polygon matched this point.",
      });
    }

    // choose the most specific polygon (smallest area)
    let chosen = candidates[0];
    try {
      let bestArea = polygonArea(chosen.geometry);
      for (const c of candidates) {
        const a = polygonArea(c.geometry);
        if (a < bestArea) {
          bestArea = a;
          chosen = c;
        }
      }
    } catch {
      chosen = candidates[0];
    }

    const props = chosen.properties || {};
    const aquifer = {
      name: props.name || props.title || null,
      type: props.type || props.AQUIFER_TYPE || null,
      depth_to_water:
        parseNumber(props.depth_to_water ?? props.DEPTH_M ?? props.depth ?? props.depth_to_w) ?? null,
      measured_at: props.measured_at || props.measured || null,
      yield: props.yield || props.YIELD || null,
      recharge: props.recharge || props.RECHARGE || null,
      suitability: props.suitability || null,
      notes: props.notes || null,
      bbox: geometryBBox(chosen.geometry) ?? null,
      raw_properties: props,
    };

    // history: if feature has 'history' or 'levels', use it; otherwise sample
    let history = null;
    if (Array.isArray(props.history)) {
      history = props.history.map((h: any) => ({ date: String(h.date || h.dt), level: parseNumber(h.level ?? h.value) ?? 0 }));
    } else if (Array.isArray(props.levels)) {
      history = props.levels.map((v: any, i: number) => ({ date: new Date(Date.now() - (props.levels.length - i) * 30 * 24 * 3600 * 1000).toISOString().slice(0, 10), level: parseNumber(v) ?? 0 }));
    } else {
      history = generateSampleHistory(aquifer.depth_to_water);
    }

    return NextResponse.json({ aquifer, history });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

/* ---------- helpers ---------- */

function parseNumber(v: any): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/[^\d.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function geometryBBox(geom: any): [number, number, number, number] | null {
  if (!geom || !geom.type) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  try {
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        for (const coord of ring) {
          const [x, y] = coord;
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          for (const coord of ring) {
            const [x, y] = coord;
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
        }
      }
    } else if (geom.type === "Point") {
      const [x, y] = geom.coordinates;
      minX = maxX = x; minY = maxY = y;
    } else {
      return null;
    }
    if (!isFinite(minX)) return null;
    return [minX, minY, maxX, maxY];
  } catch {
    return null;
  }
}

function pointInGeom(point: [number, number], geom: any): boolean {
  // if turf available server-side prefer that
  if (booleanPointInPolygon) {
    try {
      const pt = { type: "Feature", geometry: { type: "Point", coordinates: point } };
      return booleanPointInPolygon(pt, geom);
    } catch {
      // fall through to ray cast
    }
  }
  const [x, y] = point;
  if (!geom || !geom.type) return false;

  if (geom.type === "Polygon") return polygonContains(geom.coordinates, [x, y]);
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) if (polygonContains(poly, [x, y])) return true;
    return false;
  }
  return false;
}

function polygonContains(coords: any[], point: [number, number]) {
  if (!coords || coords.length === 0) return false;
  if (!rayCastContains(coords[0], point)) return false;
  for (let i = 1; i < coords.length; i++) {
    if (rayCastContains(coords[i], point)) return false; // point in a hole
  }
  return true;
}

function rayCastContains(ring: number[][], point: [number, number]) {
  const x = point[0], y = point[1];
  if (!Array.isArray(ring) || ring.length === 0) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonArea(geom: any): number {
  // approximate planar area for polygon or multipolygon (sum of rings using shoelace)
  if (!geom || !geom.type) return Infinity;
  function areaOfRing(ring: number[][]) {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      a += (xj - xi) * (yj + yi);
    }
    return Math.abs(a);
  }
  if (geom.type === "Polygon") {
    return areaOfRing(geom.coordinates[0] || []);
  } else if (geom.type === "MultiPolygon") {
    return geom.coordinates.reduce((sum: number, poly: any) => sum + areaOfRing(poly[0] || []), 0);
  }
  return Infinity;
}

function generateSampleHistory(base?: number | null) {
  const b = typeof base === "number" ? base : 6.0;
  const now = new Date();
  const arr: { date: string; level: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const jitter = (Math.random() - 0.5) * 1.2;
    arr.push({ date: d.toISOString().slice(0, 10), level: +(b + jitter).toFixed(2) });
  }
  return arr;
}
