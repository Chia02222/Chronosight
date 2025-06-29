
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface NarrativeDisplayProps {
  narrative: string | null;
  insights: string[] | null | undefined;
  locationName: string;
  isLoading: boolean;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ narrative, insights, locationName, isLoading }) => {
  if (isLoading && !narrative) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center justify-center min-h-[200px]">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-gray-300">Loading historical details for {locationName}...</p>
      </div>
    );
  }

  if (!narrative) {
    return null; 
  }

  const processNarrative = (text: string): Array<React.ReactNode> => {
    // Split into paragraphs. Handles \n\n, \n \n, \n\r\n etc.
    // Filters out any empty paragraphs that might result from multiple newlines.
    const paragraphs = text.split(/\n\s*\n+/).filter(p => p.trim() !== '');

    return paragraphs.map((para, index) => {
      const trimmedPara = para.trim();
      // Regex to find the first sentence (ending with ., !, or ?) and the rest of the paragraph.
      // The 's' flag allows '.' to match newline characters within a sentence if any.
      const sentenceEndRegex = /^([^.!?]+[.!?])(.*)$/s;
      const match = trimmedPara.match(sentenceEndRegex);

      if (match) {
        const firstSentence = match[1];
        const restOfParagraph = match[2];
        return (
          <p key={index} className="text-gray-300 leading-relaxed mb-4">
            <strong className="text-gray-100 font-semibold">{firstSentence}</strong>
            {restOfParagraph}
          </p>
        );
      } else {
        // If no clear first sentence (e.g., short line, no standard punctuation), render the paragraph as is.
        // Or, could bold the whole thing if it's very short. For now, render normally.
        return (
          <p key={index} className="text-gray-300 leading-relaxed mb-4">
            {trimmedPara}
          </p>
        );
      }
    });
  };

  const formattedNarrative = processNarrative(narrative);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-h-[600px] overflow-y-auto" aria-live="polite">
      <h3 className="text-2xl font-semibold mb-4 text-sky-400">
        History of {locationName}
      </h3>
      
      {formattedNarrative.length > 0 ? (
        <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
          {formattedNarrative}
        </div>
      ) : (
        <p className="text-gray-400">No narrative available for this location.</p>
      )}
      
      {insights && insights.length > 0 && (
        <>
          <h4 className="text-xl font-semibold mt-6 mb-2 text-teal-400">Key Insights for this Era:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
            {insights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
