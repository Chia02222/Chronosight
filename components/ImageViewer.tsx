
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageViewerProps {
  modernImageUrl: string | null;
  historicalImageUrl: string | null;
  isLoadingModern: boolean;
  isLoadingHistorical: boolean;
  currentEraName?: string | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  modernImageUrl,
  historicalImageUrl,
  isLoadingModern,
  isLoadingHistorical,
  currentEraName,
}) => {
  const canShowHistorical = historicalImageUrl || isLoadingHistorical || currentEraName;
  const canShowModern = modernImageUrl || isLoadingModern;

  const renderImagePanel = (
    title: string,
    imageUrl: string | null,
    isLoading: boolean,
    typeDefaultText: string
  ) => {
    return (
      <div className="flex-1 flex flex-col bg-gray-700 rounded-lg p-3 min-h-[250px] md:min-h-[300px] lg:min-h-[350px]">
        <h4 className="text-lg font-semibold text-center mb-2 text-sky-300">{title}</h4>
        <div className="flex-grow relative flex justify-center items-center overflow-hidden rounded">
          {isLoading && (
            <div className="w-full h-full flex flex-col justify-center items-center ">
              <LoadingSpinner size="lg" />
              <p className="mt-3 text-gray-300">Generating {title}...</p>
            </div>
          )}
          {!isLoading && imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="object-contain w-full h-full shadow-md"
            />
          )}
          {!isLoading && !imageUrl && (
            <div className="w-full h-full flex justify-center items-center ">
              <p className="text-gray-400 text-center px-2">
                {typeDefaultText}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
      {(!canShowModern && !canShowHistorical) && (
         <div className="w-full h-[300px] flex justify-center items-center bg-gray-700 rounded-lg">
            <p className="text-gray-400 text-center">
              Image views will appear here once a location is processed and an era is selected.
            </p>
         </div>
      )}

      {(canShowModern || canShowHistorical) && (
        <div className="flex flex-col md:flex-row gap-4">
          {canShowModern && renderImagePanel(
            'Modern View',
            modernImageUrl,
            isLoadingModern,
            'Modern view will appear here.'
          )}
          {canShowHistorical && renderImagePanel(
            currentEraName || 'Historical View',
            historicalImageUrl,
            isLoadingHistorical,
            'Select an era to see the historical view.'
          )}
        </div>
      )}
    </div>
  );
};
