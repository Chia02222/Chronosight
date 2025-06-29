
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Coordinates, HistoricalContext, EraData } from './types';
import { LocationSearch } from './components/LocationSearch';
import { MapDisplay } from './components/MapDisplay';
import { ImageViewer } from './components/ImageViewer';
import { NarrativeDisplay } from './components/NarrativeDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { fetchHistoricalContext, generateImageApi } from './services/geminiService';

const App: React.FC = () => {
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  const [historicalContext, setHistoricalContext] = useState<HistoricalContext | null>(null);
  const [currentEraData, setCurrentEraData] = useState<EraData | null>(null);
  
  const [modernImageUrl, setModernImageUrl] = useState<string | null>(null);
  const [historicalImageUrl, setHistoricalImageUrl] = useState<string | null>(null);
  
  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(false);
  const [isLoadingModernImage, setIsLoadingModernImage] = useState<boolean>(false);
  const [isLoadingHistoricalImage, setIsLoadingHistoricalImage] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);

  const [apiKeyExists, setApiKeyExists] = useState<boolean>(true);

  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("Gemini API Key is missing. Please set the API_KEY environment variable.");
      setApiKeyExists(false);
    }
  }, []);

  const handleLocationSelect = useCallback(async (coords: Coordinates, name?: string) => {
    if (!apiKeyExists) return;

    // If it's a named search (name provided, coords are dummy 0,0), 
    // `selectedCoords` would have been set to null by `handleSearch`.
    // Otherwise, for map clicks or direct coord input, set `selectedCoords` now.
    if (!(name && coords.lat === 0 && coords.lng === 0)) {
        setSelectedCoords(coords);
    }
    
    setLocationName(name || `Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lng.toFixed(4)}`);
    setError(null);
    setHistoricalContext(null);
    setModernImageUrl(null);
    setHistoricalImageUrl(null);
    setCurrentEraData(null);
    setIsLoadingContext(true);
    setIsLoadingModernImage(true);

    try {
      // Pass the original coords (which might be 0,0 for named search) and name to fetchHistoricalContext
      const context = await fetchHistoricalContext(coords, name);
      setHistoricalContext(context);

      // If Gemini returned resolved coordinates for a named search, update the map
      if (name && context.resolvedCoordinates && 
          (context.resolvedCoordinates.lat !== 0 || context.resolvedCoordinates.lng !== 0)) {
        setSelectedCoords(context.resolvedCoordinates); // This will trigger map update
        setLocationName(name || `Lat: ${context.resolvedCoordinates.lat.toFixed(4)}, Lon: ${context.resolvedCoordinates.lng.toFixed(4)}`); // Update location name if resolved
      } else if (!name && coords) {
         // This case is for direct coordinate input or map click, selectedCoords is already set.
         // Location name is already set.
      }


      // Generate modern image
      if (context.modernImagePrompt) {
        const modernImg = await generateImageApi(context.modernImagePrompt);
        setModernImageUrl(modernImg);
      }
    } catch (e: any) {
      console.error("Error fetching historical context or modern image:", e);
      setError(e.message || "Failed to fetch historical context or modern image.");
      if (name && coords.lat === 0 && coords.lng === 0) { // If it was a named search that failed
        // setSelectedCoords(null); // Keep map as is, or reset, TBD. For now, keep as is.
      }
    } finally {
      setIsLoadingContext(false);
      setIsLoadingModernImage(false);
    }
  }, [apiKeyExists]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!apiKeyExists) return;
    
    const coordsMatch = searchTerm.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[3]);
      setSelectedCoords({ lat, lng: lon }); // Set coords immediately for map update
      handleLocationSelect({ lat, lng: lon });
    } else {
      // Named search
      setLocationName(searchTerm); // Set display name immediately
      setSelectedCoords(null);     // Clear current map marker/view until Gemini resolves
      handleLocationSelect({lat:0, lng:0}, searchTerm); // Pass dummy coords, Gemini will use name
    }
  }, [handleLocationSelect, apiKeyExists]);

  const handleEraSelect = useCallback(async (era: EraData) => {
    if (!apiKeyExists || !historicalContext) return;
    setCurrentEraData(era);
    setHistoricalImageUrl(null);
    setIsLoadingHistoricalImage(true);
    setError(null);
    try {
      const histImg = await generateImageApi(era.historicalImagePrompt);
      setHistoricalImageUrl(histImg);
    } catch (e: any) {
      console.error("Error generating historical image:", e);
      setError(e.message || "Failed to generate historical image.");
    } finally {
      setIsLoadingHistoricalImage(false);
    }
  }, [apiKeyExists, historicalContext]);
  
  useEffect(() => {
    if (initialLoadRef.current && apiKeyExists) {
      // Example: Eiffel Tower
      // handleSearch("Eiffel Tower, Paris");
      // initialLoadRef.current = false;
    }
  }, [apiKeyExists, handleSearch]); // Changed from handleLocationSelect to handleSearch for example


  const totalLoading = isLoadingContext || isLoadingModernImage || isLoadingHistoricalImage;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-2">
          ChronoSight
        </h1>
        <p className="text-gray-400 text-lg">Your Window to the Past</p>
      </header>

      {!apiKeyExists && <ErrorDisplay message="API Key not configured. Please contact administrator." />}

      {apiKeyExists && (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col space-y-6 md:col-span-1">
            <LocationSearch onSearch={handleSearch} />
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl h-64 sm:h-80 md:h-96">
              <MapDisplay onLocationSelect={handleLocationSelect} initialCoords={selectedCoords} />
            </div>
            {isLoadingContext && <div className="flex justify-center items-center h-20"><LoadingSpinner size="md" /> <span className="ml-3">Fetching History...</span></div>}
            {historicalContext && !isLoadingContext && (
              <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-3 text-sky-400">Select an Era:</h3>
                <div className="flex flex-wrap gap-2">
                  {historicalContext.suggestedEras.map((era) => (
                    <button
                      key={era.eraName}
                      onClick={() => handleEraSelect(era)}
                      disabled={totalLoading}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${currentEraData?.eraName === era.eraName ? 'bg-sky-500 text-white' : 'bg-gray-700 hover:bg-sky-600 text-gray-200'}
                        ${totalLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {era.eraName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-6 md:col-span-2">
            {(isLoadingModernImage || isLoadingHistoricalImage || modernImageUrl || historicalImageUrl) && (
                 <ImageViewer
                    modernImageUrl={modernImageUrl}
                    historicalImageUrl={historicalImageUrl}
                    isLoadingModern={isLoadingModernImage}
                    isLoadingHistorical={isLoadingHistoricalImage}
                    currentEraName={currentEraData?.eraName}
                />
            )}
            {error && <ErrorDisplay message={error} />}
            {historicalContext && (
              <NarrativeDisplay
                narrative={historicalContext.historicalNarrative}
                insights={currentEraData?.keyImageInsights}
                locationName={locationName}
                isLoading={isLoadingContext}
              />
            )}
             {!historicalContext && !isLoadingContext && !error && selectedCoords && ( // Show this if context is fetched (selectedCoords valid) but no era picked yet
                 <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center text-gray-400">
                    <p>Historical data loaded for {locationName}. Select an era to visualize the past.</p>
                 </div>
             )}
            {!historicalContext && !isLoadingContext && !error && !selectedCoords && ( // Welcome message state
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center text-gray-400 h-full flex flex-col justify-center items-center min-h-[300px] md:min-h-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-lg">Welcome to ChronoSight!</p>
                <p>Enter a location or click on the map to begin your journey through time.</p>
              </div>
            )}
          </div>
        </div>
      )}
       <footer className="w-full max-w-6xl mt-12 text-center text-gray-500 text-sm">
        <p>ChronoSight &copy; {new Date().getFullYear()}. Powered by Gemini AI.</p>
        <p>Note: Historical depictions are AI-generated interpretations and may not be perfectly accurate.</p>
      </footer>
    </div>
  );
};

export default App;
