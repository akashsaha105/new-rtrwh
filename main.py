from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import csv
import math
import logging
from typing import List, Dict, Optional

# ---------------- logging ----------------
logger = logging.getLogger("new_rtrwh")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)
# -----------------------------------------

app = FastAPI(
    title="Groundwater Depth + RWH API",
    description="CGWB/WRIS groundwater depth + Rooftop RWH sizing",
    version="1.4.0"
)

# ---------- CORS CONFIGURATION ----------
allowed_origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
# ----------------------------------------

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"
INDIA_GW_FILE = "india_gw_stations.csv"
india_stations: List[Dict[str, str]] = []
india_data_loaded = False


@app.get("/")
def root():
    return {
        "message": "Groundwater Depth + RWH API",
        "endpoints": [
            "/gw-depth-india (CGWB/WRIS local CSV)",
            "/rwh-design (Rooftop rainwater harvesting design helper)"
        ]
    }


def load_india_data():
    global india_stations, india_data_loaded

    if india_data_loaded:
        return

    try:
        with open(INDIA_GW_FILE, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            india_stations = [row for row in reader]
        if not india_stations:
            raise RuntimeError("CSV has no rows")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail=(
                f"File '{INDIA_GW_FILE}' not found. "
                f"Place it next to main.py with columns: "
                f"station_id,station_name,latitude,longitude,depth_m_bgl,date,state,district"
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading '{INDIA_GW_FILE}': {e}",
        )

    india_data_loaded = True


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_india_depth_for_point(
    lat: float,
    lon: float,
    max_radius_km: float = 50.0,
) -> Dict[str, object]:
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid lat/lon")

    load_india_data()

    nearest_station: Optional[Dict[str, str]] = None
    nearest_dist_km: float = float("inf")

    for row in india_stations:
        try:
            s_lat = float(row["latitude"])
            s_lon = float(row["longitude"])
        except (KeyError, ValueError):
            continue

        dist = haversine_km(lat, lon, s_lat, s_lon)
        if dist < nearest_dist_km:
            nearest_dist_km = dist
            nearest_station = row

    if nearest_station is None or nearest_dist_km > max_radius_km:
        raise HTTPException(
            status_code=404,
            detail=f"No CGWB/WRIS station found within {max_radius_km} km of ({lat},{lon})",
        )

    try:
        depth_m = float(nearest_station["depth_m_bgl"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=500,
            detail="Nearest station has invalid 'depth_m_bgl' value in CSV",
        )

    return {
        "input_lat": lat,
        "input_lon": lon,
        "nearest_station_id": nearest_station.get("station_id"),
        "nearest_station_name": nearest_station.get("station_name"),
        "state": nearest_station.get("state"),
        "district": nearest_station.get("district"),
        "station_lat": float(nearest_station.get("latitude", 0.0)),
        "station_lon": float(nearest_station.get("longitude", 0.0)),
        "distance_km": round(nearest_dist_km, 2),
        "depth_m_below_ground": round(depth_m, 2),
        "date": nearest_station.get("date"),
        "note": "Depth from CGWB/India-WRIS stations (m below ground level, bgl)",
    }


@app.get("/gw-depth-india")
def gw_depth_india(
    lat: float = Query(..., description="Latitude in decimal degrees, e.g. 22.57"),
    lon: float = Query(..., description="Longitude in decimal degrees, e.g. 88.36"),
    max_radius_km: float = Query(
        50.0,
        description="Maximum radius (km) to search for nearest CGWB station",
    ),
):
    return get_india_depth_for_point(lat=lat, lon=lon, max_radius_km=max_radius_km)


def fetch_max_daily_rainfall(lat: float, lon: float, year: int = 2024) -> Dict[str, float]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "daily": "precipitation_sum",
        "timezone": "auto",
    }

    try:
        resp = requests.get(OPEN_METEO_URL, params=params, timeout=20)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Error calling Open-Meteo (daily): {e}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Open-Meteo (daily) returned status {resp.status_code}",
        )

    try:
        data = resp.json()
    except ValueError:
        raise HTTPException(status_code=500, detail="Failed to parse JSON from Open-Meteo (daily)")

    logger.debug("Open-Meteo daily response keys: %s", list(data.keys()))

    try:
        daily = data["daily"]
        precip_list = daily["precipitation_sum"]  # mm/day
        time_list = daily["time"]
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Missing key in daily response: {e}")

    if not precip_list:
        raise HTTPException(
            status_code=404, detail="No daily precipitation data returned from Open-Meteo"
        )

    max_daily_mm = max(precip_list)
    max_index = precip_list.index(max_daily_mm)
    max_date = time_list[max_index]

    return {
        "year": year,
        "max_daily_precip_mm": float(max_daily_mm),
        "max_daily_precip_date": max_date,
        "note": "Max daily rainfall depth from Open-Meteo archive (mm/day)",
    }


def fetch_max_hourly_rainfall(lat: float, lon: float, year: int = 2024) -> Dict[str, float]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "hourly": "precipitation",
        "timezone": "auto",
    }

    try:
        resp = requests.get(OPEN_METEO_URL, params=params, timeout=20)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Error calling Open-Meteo (hourly): {e}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Open-Meteo (hourly) returned status {resp.status_code}",
        )

    try:
        data = resp.json()
    except ValueError:
        raise HTTPException(status_code=500, detail="Failed to parse JSON from Open-Meteo (hourly)")

    logger.debug("Open-Meteo hourly response keys: %s", list(data.keys()))

    try:
        hourly = data["hourly"]
        precip_list = hourly["precipitation"]
        time_list = hourly["time"]
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Missing key in hourly response: {e}")

    if not precip_list:
        raise HTTPException(
            status_code=404, detail="No hourly precipitation data returned from Open-Meteo"
        )

    max_hourly_mm = max(precip_list)
    max_index = precip_list.index(max_hourly_mm)
    max_time = time_list[max_index]

    # RETURN both key variants to be defensive / backwards-compatible
    return {
        "year": year,
        "max_hourly_precip_mm": float(max_hourly_mm),
        "max_hourly_prec_mm": float(max_hourly_mm),  # legacy/alt key
        "max_hourly_precip_time": max_time,
        "note": "Max hourly rainfall intensity from Open-Meteo archive (mm/hour)",
    }


def get_runoff_coefficient(rooftop_type: str) -> float:
    rt = rooftop_type.strip().lower()
    mapping = {
        "concrete": 0.9,
        "rcc": 0.9,
        "reinforced_concrete": 0.9,
        "tile": 0.8,
        "tiles": 0.8,
        "metal": 0.85,
        "corrugated": 0.8,
        "asbestos": 0.75,
        "paved": 0.7,
        "stone": 0.7,
        "green": 0.5,
        "garden": 0.5,
        "unpaved": 0.4,
    }
    return mapping.get(rt, 0.8)


def design_recharge_pit_dimensions(volume_m3: float) -> Optional[Dict[str, float]]:
    if volume_m3 <= 0:
        return None

    if volume_m3 <= 10.0:
        depth = 2.0
    elif volume_m3 <= 50.0:
        depth = 3.0
    else:
        depth = 4.0

    area = volume_m3 / depth
    breadth = math.sqrt(area / 2.0)
    length = 2.0 * breadth

    return {
        "length_m": round(length, 2),
        "breadth_m": round(breadth, 2),
        "depth_m": depth,
    }


@app.get("/rwh-design")
def rwh_design(
    rooftop_area_m2: float = Query(
        ..., gt=0, description="Rooftop area in square metres"
    ),
    rooftop_type: str = Query(
        ..., description="Rooftop type, e.g. concrete, tile, metal, green"
    ),
    lat: float = Query(..., description="Latitude of rooftop"),
    lon: float = Query(..., description="Longitude of rooftop"),
    year: int = Query(2024, description="Year for rainfall archive (default 2024)"),
    max_radius_km: float = Query(
        50.0,
        description="Search radius for nearest CGWB station (km)",
    ),
):
    gw_info = get_india_depth_for_point(lat=lat, lon=lon, max_radius_km=max_radius_km)
    depth_m = gw_info["depth_m_below_ground"]

    daily_rain = fetch_max_daily_rainfall(lat=lat, lon=lon, year=year)
    hourly_rain = fetch_max_hourly_rainfall(lat=lat, lon=lon, year=year)

    # Defensive extraction: support both key names and provide clear 502 if missing
    max_daily_mm = (
        daily_rain.get("max_daily_precip_mm")
        or daily_rain.get("max_daily_prec_mm")
        or daily_rain.get("max_daily_precip")  # possible variant
    )
    if max_daily_mm is None:
        logger.error("Daily rainfall key missing; daily_rain=%s", daily_rain)
        raise HTTPException(status_code=502, detail={"message": "daily rainfall missing expected key", "daily_rain_keys": list(daily_rain.keys())})

    # hourly: support multiple key variants (we return two variants above)
    max_hourly_mm = (
        hourly_rain.get("max_hourly_precip_mm")
        or hourly_rain.get("max_hourly_prec_mm")
        or hourly_rain.get("max_hourly_precip")
        or hourly_rain.get("max_hourly_prec")  # last-resort
    )
    if max_hourly_mm is None:
        logger.error("Hourly rainfall key missing; hourly_rain=%s", hourly_rain)
        raise HTTPException(status_code=502, detail={"message": "hourly rainfall missing expected key", "hourly_rain_keys": list(hourly_rain.keys())})

    # convert to floats (fast-fail if not convertible)
    try:
        max_daily_mm = float(max_daily_mm)
        max_hourly_mm = float(max_hourly_mm)
    except (ValueError, TypeError) as e:
        logger.exception("Failed converting rainfall values to float: %s", e)
        raise HTTPException(status_code=502, detail="Invalid rainfall numeric format from upstream")

    rainfall_depth_m = max_daily_mm / 1000.0
    c_runoff = get_runoff_coefficient(rooftop_type)
    runoff_depth_m = c_runoff * rainfall_depth_m
    runoff_volume_m3 = runoff_depth_m * rooftop_area_m2

    i_mm_per_hr = max_hourly_mm
    i_m_per_hr = i_mm_per_hr / 1000.0
    q_cia_m3_per_hr = c_runoff * i_m_per_hr * rooftop_area_m2

    if depth_m <= 3.0:
        design_category = "Storage only (rainwater harvesting tank). Groundwater is shallow (0–3 m bgl)."
        recharge_pit_volume_m3 = 0.0
        components = ["storage_tank"]
        pit_dimensions = None
    elif depth_m < 10.0:
        design_category = "Recharge pit + storage tank (depth between 3–10 m bgl)."
        recharge_pit_volume_m3 = runoff_volume_m3
        components = ["recharge_pit", "storage_tank"]
        pit_dimensions = design_recharge_pit_dimensions(recharge_pit_volume_m3)
    else:
        design_category = "Recharge pit + storage tank + recharge trench (depth ≥ 10 m bgl)."
        recharge_pit_volume_m3 = runoff_volume_m3
        components = ["recharge_pit", "storage_tank", "recharge_trench"]
        pit_dimensions = design_recharge_pit_dimensions(recharge_pit_volume_m3)

    feasible = "yes" if depth_m > 3.0 else "no"

    return {
        "input": {
            "rooftop_area_m2": rooftop_area_m2,
            "rooftop_type": rooftop_type,
            "latitude": lat,
            "longitude": lon,
            "year": year,
        },
        "groundwater": gw_info,
        "rainfall": {
            "daily": daily_rain,
            "hourly": hourly_rain,
        },
        "runoff_calculation": {
            "runoff_coefficient": c_runoff,
            "rainfall_depth_m_from_max_daily": rainfall_depth_m,
            "runoff_depth_m": runoff_depth_m,
            "runoff_volume_m3": runoff_volume_m3,
            "i_mm_per_hr_from_max_hourly": i_mm_per_hr,
            "i_m_per_hr_from_max_hourly": i_m_per_hr,
            "q_cia_m3_per_hr": q_cia_m3_per_hr,
        },
        "design": {
            "category": design_category,
            "components": components,
            "recharge_pit_volume_m3": recharge_pit_volume_m3,
            "recharge_pit_dimensions_m": pit_dimensions,
            "feasible": feasible,
            "note": (
                "Runoff volume is computed using rainfall depth from max daily rainfall (mm/day), "
                "runoffDepth = C * rainfallDepth, Volume = runoffDepth * Area. "
                "Q_cia_m3_per_hr uses C I A with I from max hourly rainfall (mm/hour). "
                "Recharge pit volume is taken equal to total runoff volume when depth > 3 m bgl. "
                "Pit dimensions assume a rectangular pit with L:B = 2:1 and depth based on volume class."
            ),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
