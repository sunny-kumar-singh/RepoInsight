import React from "react";
import ReadmeViewer from "../components/ReadmeViewer";
import MermaidDiagram from "../components/MermaidDiagram";

const ContentViewer = ({
  showReadme,
  showDiagram,
  setShowReadme,
  setShowDiagram,
  hasReadme,
  hasArchitecture,
  documentation,
  handleGeneratePDF, // Add new prop
  showPdfButton      // Add new prop
}) => {
  // Check if documentation has required data
  const hasRequiredData = documentation?.readme || documentation?.architecture;

  if (!hasRequiredData) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex gap-4 mb-4">
        {hasReadme && (
          <button
            onClick={() => setShowReadme(!showReadme)}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              showReadme
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {showReadme ? "Hide README" : "Show README"}
          </button>
        )}
        {hasArchitecture && (
          <button
            onClick={() => setShowDiagram(!showDiagram)}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              showDiagram
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {showDiagram ? "Hide Architecture" : "Show Architecture"}
          </button>
        )}
        {showPdfButton && (
          <button
            onClick={handleGeneratePDF}
            className="px-4 py-2 rounded-lg transition-all duration-300 bg-purple-600 text-white hover:bg-purple-700"
          >
            Generate PDF
          </button>
        )}
      </div>

      {showReadme && documentation?.readme?.content && (
        <ReadmeViewer
          content={documentation.readme.content}
          onClose={() => setShowReadme(false)}
        />
      )}

      {showDiagram && documentation?.architecture?.content && (
        <MermaidDiagram
          content={documentation.architecture.content}
          onClose={() => setShowDiagram(false)}
        />
      )}
    </div>
  );
};

export default ContentViewer;
