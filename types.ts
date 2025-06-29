
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EraData {
  eraName: string;
  historicalImagePrompt: string;
  keyImageInsights: string[];
}

export interface HistoricalContext {
  historicalNarrative: string;
  suggestedEras: EraData[];
  modernImagePrompt: string;
  resolvedCoordinates?: Coordinates | null; // Added for geocoded results
}

// For Leaflet, ensure L is globally available or import types if using @types/leaflet
declare global {
  // eslint-disable-next-line no-var
  var L: any; 
}