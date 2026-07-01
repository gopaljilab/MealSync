declare const __GOOGLE_MAPS_API_KEY__: string;

type GoogleMapsLatLngLiteral = {
  lat: number;
  lng: number;
};

type GoogleMapsPlaceResult = {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat(): number;
      lng(): number;
    };
    viewport?: unknown;
  };
};

type GoogleMapsAutocomplete = {
  addListener(eventName: "place_changed", handler: () => void): { remove(): void };
  getPlace(): GoogleMapsPlaceResult;
};

type GoogleMapsMarker = {
  setPosition(position: GoogleMapsLatLngLiteral): void;
  setMap(map: GoogleMapsMap | null): void;
};

type GoogleMapsMap = {
  setCenter(position: GoogleMapsLatLngLiteral): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: unknown): void;
};

type GoogleMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: {
      center: GoogleMapsLatLngLiteral;
      zoom: number;
      clickableIcons?: boolean;
      fullscreenControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
    },
  ) => GoogleMapsMap;
  Marker: new (options: {
    map: GoogleMapsMap;
    position: GoogleMapsLatLngLiteral;
    title?: string;
  }) => GoogleMapsMarker;
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      options: {
        fields: string[];
        types?: string[];
      },
    ) => GoogleMapsAutocomplete;
  };
};

declare global {
  interface Window {
    google?: {
      maps: GoogleMapsNamespace;
    };
    gm_authFailure?: () => void;
  }
}

export {};
