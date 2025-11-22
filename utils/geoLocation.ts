import { useEffect, useState } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });6

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return { ...coords, error };
}
