import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

const MermaidDiagram = ({ content, onClose }) => {
  const mermaidRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMermaid = async () => {
      setIsLoading(true);
      setError(null);

      const processContent = (text) => {
        const trimmed = text.trim();

        const removeMarkdownFence = (str) =>
          str
            .replace(/^```mermaid\s*/i, "")
            .replace(/```$/, "")
            .trim();

        const cleaned = removeMarkdownFence(trimmed);

        // Remove potentially problematic lines
        const safeLines = cleaned
          .split("\n")
          .map((line) => line.trim())
          .filter(
            (line) =>
              !line.match(/\.js|\.css|import|export|require|from/i) &&
              !line.match(/^\[.*\];?$/) &&
              line.length > 0
          );

        if (
          !safeLines[0]?.match(
            /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/
          )
        ) {
          const guess =
            safeLines.join("\n").includes("->") ||
            safeLines.join("\n").includes("-->")
              ? "flowchart LR"
              : "flowchart TB";
          return `${guess}\n${safeLines.join("\n")}`;
        }

        return safeLines.join("\n");
      };

      try {
        const processedContent = processContent(content);

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "light",
          logLevel: "error",
          fontFamily: "system-ui, sans-serif",
          themeVariables: {
            primaryColor: "#3a506b",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#4a5568",
            lineColor: "#212f3c",
            secondaryColor: "#2d3748",
            tertiaryColor: "#1a202c",
            fontFamily: "system-ui, sans-serif",
          },
          flowchart: {
            htmlLabels: true,
            curve: "linear",
            diagramPadding: 8,
            nodeSpacing: 50,
            rankSpacing: 50,
            defaultRenderer: "dagre-d3",
          },
          er: { useMaxWidth: true },
          sequence: { useMaxWidth: true },
          graph: { useMaxWidth: true },
        });

        try {
          await mermaid.parse(processedContent);
        } catch (parseError) {
          const message = parseError.str || parseError.message;
          const lines = processedContent.split("\n");

          const hintLine = message.match(/line (\d+)/i);
          const errorLineIndex = hintLine
            ? parseInt(hintLine[1], 10) - 1
            : null;
          const errorLineContent =
            errorLineIndex !== null ? lines[errorLineIndex] : null;

          throw new Error(
            `Syntax Error: ${message}\n${
              errorLineContent
                ? `Problematic line ${
                    errorLineIndex + 1
                  }: "${errorLineContent}"`
                : ""
            }\nPlease check your diagram syntax.`
          );
        }

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = "";
          const id = `mermaid-diagram-${Date.now()}`;
          const { svg } = await mermaid.render(id, processedContent);
          mermaidRef.current.innerHTML = svg;

          const svgElement = mermaidRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.setAttribute("width", "100%");
            svgElement.setAttribute("height", "100%");
            svgElement.style.maxWidth = "100%";

            const nodes = svgElement.querySelectorAll(".node");
            nodes.forEach((node) => {
              node.addEventListener("mouseenter", () => {
                node.style.filter =
                  "drop-shadow(0 0 6px rgba(66, 153, 225, 0.5))";
                node.style.cursor = "pointer";
                // Removed scale transform to keep boxes same size when hovered
                node.style.transition = "all 0.2s ease";
              });

              node.addEventListener("mouseleave", () => {
                node.style.filter = "none";
              });
            });
          }
        }
      } catch (error) {
        console.error("Mermaid error:", error);
        setError(error.message || "Failed to render diagram");
      } finally {
        setIsLoading(false);
      }
    };

    initializeMermaid();
  }, [content]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="min-h-screen flex items-center justify-center p-2">
        <div className="relative bg-gray-900 w-[95vw] h-[90vh] rounded-xl shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="p-8 h-full overflow-y-auto custom-scrollbar">
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-400">Rendering diagram...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900 border-l-4 border-red-500 p-4 my-4 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      Diagram Error
                    </h3>
                    <p className="text-sm text-red-300 mt-1">{error}</p>
                    <div className="mt-2 p-2 bg-gray-800 rounded overflow-auto max-h-32">
                      <code className="text-xs text-gray-300 whitespace-pre-wrap">
                        {content}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              ref={mermaidRef}
              className="mermaid bg-transparent rounded-lg relative text-gray-200"
              style={{ minHeight: "400px" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagram;
