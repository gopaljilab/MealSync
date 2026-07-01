import { useEffect, useRef, useState } from "react";
import { Crosshair, LocateFixed, MapPin, Search } from "lucide-react";
import { GlowButton } from "@/components/ui/premium";

const DEFAULT_CENTER: GoogleMapsLatLngLiteral = { lat: 20.5937, lng: 78.9629 };
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-javascript-api";

let googleMapsScriptPromise: Promise<GoogleMapsNamespace> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    window.gm_authFailure = () => {
      reject(new Error("Google Maps authentication failed. Check the API key, referrer restrictions, billing, and enabled APIs."));
    };

    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.maps?.places) resolve(window.google.maps);
        else reject(new Error("Google Maps loaded without the Places library."));
      });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")));
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      libraries: "places",
      v: "weekly",
    });

    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded without the Places library."));
    };
    script.onerror = () => reject(new Error("Google Maps failed to load. Check your network and API configuration."));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Search for a pickup area or enable location access in your browser.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your current location is unavailable right now. Search still works.";
  }

  return "Location lookup timed out. Search still works.";
}

export function GoogleLocationMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mapInstanceRef = useRef<GoogleMapsMap | null>(null);
  const userMarkerRef = useRef<GoogleMapsMarker | null>(null);
  const selectedMarkerRef = useRef<GoogleMapsMarker | null>(null);
  const currentPositionRef = useRef<GoogleMapsLatLngLiteral | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("Requesting your current location...");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const apiKey = __GOOGLE_MAPS_API_KEY__;

  useEffect(() => {
    let cancelled = false;
    let autocompleteListener: { remove(): void } | null = null;

    async function initialiseMap() {
      if (!mapRef.current) return;

      if (!apiKey) {
        setStatus("error");
        setError("Google Maps is not configured. Set GOOGLE_MAPS_API_KEY in the environment and restart the app.");
        setLocationMessage("");
        return;
      }

      setStatus("loading");
      setError("");

      try {
        const maps = await loadGoogleMaps(apiKey);
        if (cancelled || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: 5,
          clickableIcons: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapInstanceRef.current = map;
        setStatus("ready");

        if (searchRef.current) {
          const autocomplete = new maps.places.Autocomplete(searchRef.current, {
            fields: ["formatted_address", "geometry", "name"],
            types: ["geocode", "establishment"],
          });

          autocompleteListener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const location = place.geometry?.location;

            if (!location) {
              setError("We could not find that place on the map. Try a more specific search.");
              return;
            }

            const position = { lat: location.lat(), lng: location.lng() };
            setError("");
            setSelectedPlace(place.name || place.formatted_address || "Selected place");

            if (place.geometry?.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(position);
              map.setZoom(15);
            }

            if (!selectedMarkerRef.current) {
              selectedMarkerRef.current = new maps.Marker({
                map,
                position,
                title: place.name || "Selected place",
              });
            } else {
              selectedMarkerRef.current.setPosition(position);
            }
          });
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Google Maps could not be initialized.");
        setLocationMessage("");
      }
    }

    initialiseMap();

    return () => {
      cancelled = true;
      autocompleteListener?.remove();
      userMarkerRef.current?.setMap(null);
      selectedMarkerRef.current?.setMap(null);
    };
  }, [apiKey]);

  const requestLocation = () => {
    const maps = window.google?.maps;
    const map = mapInstanceRef.current;

    if (!maps || !map) return;

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser. Search still works.");
      return;
    }

    setIsLocating(true);
    setLocationMessage("Requesting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        currentPositionRef.current = current;
        setLocationMessage("Current location pinned.");
        setIsLocating(false);
        map.setCenter(current);
        map.setZoom(15);

        if (!userMarkerRef.current) {
          userMarkerRef.current = new maps.Marker({
            map,
            position: current,
            title: "Your current location",
          });
        } else {
          userMarkerRef.current.setPosition(current);
        }
      },
      (geoError) => {
        setLocationMessage(getLocationErrorMessage(geoError));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 12000,
      },
    );
  };

  useEffect(() => {
    if (status === "ready") {
      requestLocation();
    }
  }, [status]);

  const centerOnCurrentLocation = () => {
    if (currentPositionRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(currentPositionRef.current);
      mapInstanceRef.current.setZoom(15);
      return;
    }

    requestLocation();
  };

  return (
    <div className="overflow-hidden border border-[var(--border-strong)] bg-[var(--surface-primary)]" data-testid="card-google-map-view">
      <div className="flex flex-col gap-4 border-b border-[var(--border-strong)] bg-[var(--surface-secondary)] p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
            <MapPin size={16} className="text-[var(--brand-accent)]" />
            <span>Redistribution Mapping</span>
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Live Google Maps view with location and place search.</p>
        </div>
        <GlowButton
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-[var(--border-strong)] bg-[var(--surface-primary)] text-xs font-bold uppercase tracking-wider"
          onClick={centerOnCurrentLocation}
          disabled={status !== "ready" || isLocating}
        >
          <LocateFixed size={15} />
          <span>{isLocating ? "Locating..." : "My Location"}</span>
        </GlowButton>
      </div>

      <div className="relative min-h-[360px] md:min-h-[460px]">
        <div className="absolute left-3 right-3 top-3 z-10 md:left-5 md:right-auto md:w-[min(420px,calc(100%-2.5rem))]">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-3 py-2 shadow-lg focus-within:border-[var(--brand-accent)]">
            <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              type="search"
              className="h-9 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search places or pickup addresses"
              aria-label="Search places or pickup addresses"
              disabled={status !== "ready"}
            />
          </div>
        </div>

        <div ref={mapRef} className="h-[360px] w-full md:h-[460px]" aria-label="Interactive Google map" />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-primary)]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 py-3 text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
              <Crosshair size={15} className="text-[var(--brand-accent)]" />
              Loading map
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-primary)] p-5 text-center">
            <div className="max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-5">
              <p className="text-sm font-black text-[var(--text-primary)]">Map unavailable</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">{error}</p>
            </div>
          </div>
        )}
      </div>

      {(locationMessage || selectedPlace || error) && status !== "error" && (
        <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between">
          <span>{locationMessage}</span>
          {selectedPlace && <span className="text-[var(--brand-accent)]">Selected: {selectedPlace}</span>}
          {error && <span className="text-[var(--status-danger)]">{error}</span>}
        </div>
      )}
    </div>
  );
}
