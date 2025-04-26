import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

import { jsPDF } from "jspdf";

import ContentViewer from "../components/ContentViewer";

export default function Home() {
  const [documentation, setDocumentation] = useState(null);
  const [readme, setReadme] = useState(null);
  const [url, setUrl] = useState("");
  const router = useRouter();

  // Separate loading states
  const [loadingStates, setLoadingStates] = useState({
    documentation: false,
    readme: false,
    diagram: false,
  });

  // Separate error states
  const [errors, setErrors] = useState({
    documentation: null,
    readme: null,
    diagram: null,
  });

  const [streamProgress, setStreamProgress] = useState({
    files: 0,
    currentStep: "",
    isComplete: false,
  });

  const [streamingChunks, setStreamingChunks] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [showReadme, setShowReadme] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [hasReadme, setHasReadme] = useState(false);
  const [hasArchitecture, setHasArchitecture] = useState(false);

  // Add new state for PDF button visibility
  const [showPdfButton, setShowPdfButton] = useState(false);

  // Ref for auto-scrolling
  const consoleEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to the bottom of console output
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleOutput]);

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.includes("github.com");
    } catch {
      return false;
    }
  };

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  // Function to parse and format console log objects
  const parseConsoleObject = (obj) => {
    if (typeof obj === "string") {
      return obj;
    }

    if (obj === null) {
      return "null";
    }

    if (typeof obj !== "object") {
      return String(obj);
    }

    // Handle message property specifically
    if (obj.message) {
      return obj.message;
    }

    // For batch data, extract file information
    if (obj.batch && Array.isArray(obj.batch)) {
      return obj.batch.map((file) => ({
        filePath: file.filePath,
        documentation: file.documentation,
      }));
    }

    // For more complex objects or arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => parseConsoleObject(item));
    }

    // For regular objects
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (
        key !== "__proto__" &&
        key !== "constructor" &&
        typeof value !== "function"
      ) {
        acc[key] = parseConsoleObject(value);
      }
      return acc;
    }, {});
  };

  const handleButtonClick = async () => {
    if (!url.trim()) {
      setErrors((prev) => ({
        ...prev,
        documentation: "Please enter a URL",
      }));
      return;
    }

    if (!validateUrl(url)) {
      setErrors((prev) => ({
        ...prev,
        documentation: "Please enter a valid GitHub repository URL",
      }));
      return;
    }

    try {
      setStreamingChunks([]);
      setConsoleOutput([]);
      setErrors((prev) => ({ ...prev, documentation: null }));
      setLoadingStates((prev) => ({ ...prev, documentation: true }));
      setDocumentation(null);
      setStreamProgress({
        files: 0,
        currentStep: "Initializing...",
        isComplete: false,
      });
      setHasReadme(false);
      setHasArchitecture(false);

      // Add initial console message
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "info",
          message: "Starting documentation generation...",
          timestamp: new Date().toISOString(),
        },
      ]);

      const response = await fetch("http://localhost:3001/api/repos/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to stream");
      }

      // Add connection success message
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "success",
          message: "Connected to stream successfully",
          timestamp: new Date().toISOString(),
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() && line.startsWith("data:")) {
            const jsonStr = line.replace("data:", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              console.log("Received chunk:", parsed);

              // Add to console output with line-by-line visualization
              setConsoleOutput((prev) => [
                ...prev,
                {
                  type: "chunk",
                  rawData: parsed,
                  parsedData: parseConsoleObject(parsed),
                  timestamp: new Date().toISOString(),
                },
              ]);

              // Handle different event types as before
              if (parsed.type === "batch") {
                console.log("Processing batch:", parsed);
                const batchData = Array.isArray(parsed.batch)
                  ? parsed.batch
                  : [parsed];
                setStreamingChunks((prev) => [
                  ...prev,
                  {
                    type: "batch",
                    content: { batch: batchData },
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setDocumentation((prev) => ({
                  ...prev,
                  files: [...(prev?.files || []), ...batchData],
                }));
                setStreamProgress((prev) => ({
                  ...prev,
                  files: parsed.progress || prev.files + 1,
                  currentStep: "Processing files...",
                }));
              } else if (parsed.type === "readme") {
                setDocumentation((prev) => ({ ...prev, readme: parsed }));
                console.log("Received Readme:", parsed);
                setStreamProgress((prev) => ({
                  ...prev,
                  currentStep: "Generating README...",
                }));
                setHasReadme(true);
              } else if (parsed.type === "apis") {
                setDocumentation((prev) => ({ ...prev, apis: parsed }));
                setStreamProgress((prev) => ({
                  ...prev,
                  currentStep: "Extracting APIs...",
                }));
              } else if (parsed.type === "architecture") {
                setDocumentation((prev) => ({ ...prev, architecture: parsed }));
                console.log("Received architecture diagram:", parsed);
                setStreamProgress((prev) => ({
                  ...prev,
                  currentStep: "Creating architecture diagram...",
                }));
                setHasArchitecture(true);
              } else if (parsed.type === "done") {
                setStreamProgress((prev) => ({
                  ...prev,
                  isComplete: true,
                  currentStep: "Complete!",
                }));
                setShowPdfButton(true); // Show PDF button
                // Add completion message
                setConsoleOutput((prev) => [
                  ...prev,
                  {
                    type: "success",
                    message: "Documentation generation complete!",
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }
            } catch (e) {
              console.error("Invalid JSON chunk:", jsonStr);
              // Add error to console output
              setConsoleOutput((prev) => [
                ...prev,
                {
                  type: "error",
                  message: `Error parsing JSON: ${e.message}`,
                  rawData: jsonStr,
                  timestamp: new Date().toISOString(),
                },
              ]);
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setErrors((prev) => ({
        ...prev,
        documentation: "Failed to generate documentation",
      }));
      // Add error to console output
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: `Streaming error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentation: false }));
    }
  };

  const handleReset = () => {
    setDocumentation(null);
    setReadme(null);
    setUrl("");
    setConsoleOutput([]);
    setErrors({
      documentation: null,
      readme: null,
      diagram: null,
    });
  };

  // Add helper function for cleaning content
  const cleanContent = (content) => {
    return content
      .replace(/\u200B/g, "") // Remove zero-width spaces
      .replace(/\r\n/g, "\n") // Normalize line endings
      .trim();
  };

  const handleGeneratePDF = async () => {
    if (!documentation || !documentation.files) return;

    const pdf = new jsPDF();
    const pageWidth = 180;
    let yOffset = 20;

    // Add Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Documentation Report", 105, 10, { align: "center" });
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(10, 12, 200, 12);

    // Format and add content function
    const formatEntry = (filePath, content, indentLevel = 0) => {
      if (yOffset > 270) {
        pdf.addPage();
        yOffset = 10;
      }

      // Add file path as section header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(filePath, 10, yOffset);
      yOffset += 8;

      // Add documentation content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const cleanedContent = cleanContent(content);
      const lines = pdf.splitTextToSize(cleanedContent, pageWidth - 20);

      lines.forEach((line) => {
        if (yOffset > 270) {
          pdf.addPage();
          yOffset = 10;
        }
        pdf.text(line, 15, yOffset);
        yOffset += 5;
      });

      yOffset += 10; // Add space between files
    };

    // Process all files
    documentation.files.forEach((file) => {
      formatEntry(file.filePath, file.documentation);
    });

    // Save PDF with repository name
    const repoName = url.split("/").pop() || "documentation";
    pdf.save(`${repoName}-docs.pdf`);
  };

  // Custom component to display console objects with line-by-line animation
  const ConsoleObjectDisplay = ({ data, type }) => {
    if (!data) return null;

    // Skip readme, architecture, and specific messages
    if (
      data.type === "readme" ||
      data.type === "architecture" ||
      (typeof data === "string" &&
        (data.includes("Starting documentation generation") ||
          data.includes("Connected to stream successfully") ||
          data.includes("Files loaded. Starting documentation") ||
          data.includes("Documentation generation complete")))
    ) {
      return null;
    }

    // For simple messages
    if (typeof data === "string") {
      return (
        <div className="console-line animate-slideInRight">
          {type === "error" ? (
            <span className="text-red-400">{data}</span>
          ) : type === "success" ? (
            <span className="text-green-400">{data}</span>
          ) : (
            <span className="text-blue-300">{data}</span>
          )}
        </div>
      );
    }

    // For file objects with documentation
    if (data.filePath && data.documentation) {
      const lines = data.documentation.split("\n");

      return (
        <div className="border-l-2 border-purple-500 pl-4 mb-4">
          <div className="font-bold text-xl text-purple-400 mb-2 animate-pulse">
            {data.filePath}
          </div>
          <div className="pl-2">
            {lines.map((line, idx) => (
              <div
                key={`${data.filePath}-line-${idx}`}
                className="animate-slideInRight"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {line.trim() === "" ? (
                  <span className="text-gray-500 text-opacity-30">↵</span>
                ) : (
                  line
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // For arrays
    if (Array.isArray(data)) {
      return (
        <div className="pl-4 border-l border-gray-700">
          {data.map((item, idx) => (
            <div
              key={`array-item-${idx}`}
              className="animate-slideInRight"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="text-yellow-500 mr-2">{idx}:</span>
              <ConsoleObjectDisplay data={item} type={type} />
            </div>
          ))}
        </div>
      );
    }

    // For nested objects
    return (
      <div className="pl-4 border-l border-gray-700">
        {Object.entries(data).map(([key, value], idx) => (
          <div
            key={`obj-${key}-${idx}`}
            className="mb-1 animate-slideInRight"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <span className="text-yellow-500 mr-2">{key}:</span>
            {typeof value === "object" && value !== null ? (
              <div className="mt-1">
                <ConsoleObjectDisplay data={value} type={type} />
              </div>
            ) : (
              <span className="text-green-300">{String(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Terminal-like console output component
  const ConsoleOutputDisplay = () => {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-2xl">
        <div className="flex items-center bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="ml-4 text-gray-300">Console Output</div>
          <button
            onClick={handleReset}
            className="ml-auto px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
          >
            Clear
          </button>
        </div>

        <div className="p-4 font-italic text-sm text-gray-300 overflow-auto max-h-[600px]">
          {consoleOutput.map((output, index) => (
            <div key={`console-line-${index}`} className="mb-3">
              <div className="flex items-start gap-2">
                {/* <span className="text-gray-500 select-none">&gt;</span> */}
                <div className="flex-1">
                  {/* Message header with timestamp */}
                  <div className="flex items-center mb-1">
                    {/* <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        output.type === "error"
                          ? "bg-red-900/50 text-red-300"
                          : output.type === "success"
                          ? "bg-green-900/50 text-green-300"
                          : "bg-blue-900/50 text-blue-300"
                      }`}
                    >
                      {output.type}
                    </span> */}
                    {/* <span className="ml-2 text-xs text-gray-500">
                      {new Date(output.timestamp).toLocaleTimeString()}
                    </span> */}
                  </div>

                  {/* Message content */}
                  {output.message ? (
                    <div className="animate-slideInRight">{output.message}</div>
                  ) : output.parsedData ? (
                    <ConsoleObjectDisplay
                      data={output.parsedData}
                      type={output.type}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto custom-scrollbar">
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideInRight {
          opacity: 0;
          animation: slideInRight 0.5s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* For terminal font */
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");
      `}</style>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-4">
            Marvel Documentation Creator
          </h1>
          <p className="text-xl text-gray-300">
            Transform your repository into comprehensive documentation
          </p>
        </div>

        <div className="max-w-3xl mx-auto backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 mb-12">
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={handleInputChange}
                placeholder="Enter GitHub repository URL"
                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              {errors.documentation && (
                <p className="absolute -bottom-6 left-0 text-red-400 text-sm">
                  {errors.documentation}
                </p>
              )}
            </div>

            <button
              onClick={handleButtonClick}
              disabled={loadingStates.documentation}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loadingStates.documentation ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{streamProgress.currentStep}</span>
                  </div>
                  {streamProgress.files > 0 && (
                    <div className="text-sm text-gray-300">
                      Progress: {streamProgress.files}
                    </div>
                  )}
                </div>
              ) : (
                "Generate Documentation"
              )}
            </button>
          </div>
        </div>
        <ContentViewer
          showReadme={showReadme}
          showDiagram={showDiagram}
          setShowReadme={setShowReadme}
          setShowDiagram={setShowDiagram}
          hasReadme={hasReadme}
          hasArchitecture={hasArchitecture}
          documentation={documentation}
          handleGeneratePDF={handleGeneratePDF}
          showPdfButton={showPdfButton}
        />
        {consoleOutput.length > 0 && <ConsoleOutputDisplay />}
      </div>
    </div>
  );
}
