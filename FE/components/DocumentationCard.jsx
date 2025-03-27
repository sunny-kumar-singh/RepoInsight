"use client";
import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DocumentationCard = ({ documentation, onBack, readme }) => {
  console.log(readme)
  const docRef = useRef(null);
  const [showReadme, setShowReadme] = useState(false);

  const handleGeneratePDF = async () => {
    if (!documentation) return;

    const entries = Object.entries(documentation);
    const [lastKey, lastValue] = entries[entries.length - 1] || [];

    if (!lastKey) return; // Handle empty documentation

    const parsedValue =
      typeof lastValue === "object" ? lastValue : JSON.parse(lastValue);

    const pdf = new jsPDF();
    const pageWidth = 180; // Max width for text
    let yOffset = 20; // Start position

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("API Documentation", 105, 10, { align: "center" });
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(10, 12, 200, 12); // Underline title

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(30, 144, 255); // Blue color for section
    pdf.text(`${lastKey}:`, 10, yOffset);
    yOffset += 8;

    pdf.setFontSize(12);
    pdf.setTextColor(0); // Reset text color

    // Function to recursively format nested objects
    const formatEntry = (key, value, indentLevel = 0) => {
      if (yOffset > 270) {
        pdf.addPage();
        yOffset = 10;
      }

      let indent = "  ".repeat(indentLevel);

      // Section headers
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(34, 139, 34); // Green for keys
      pdf.text(`${indent}${key}:`, 10, yOffset);
      yOffset += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0); // Reset color

      if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          formatEntry(subKey, subValue, indentLevel + 1);
        });
      } else {
        // Format values with indentation
        const formattedValue = String(value).replace(/[\{\}\[\],"]/g, "");
        const textLines = pdf.splitTextToSize(
          `${indent}  ${formattedValue}`,
          pageWidth
        );

        textLines.forEach((line) => {
          if (yOffset > 270) {
            pdf.addPage();
            yOffset = 10;
          }
          pdf.text(line, 10, yOffset);
          yOffset += 6;
        });
      }

      yOffset += 4; // Add spacing between entries
    };

    Object.entries(parsedValue).forEach(([key, value]) =>
      formatEntry(key, value)
    );

    pdf.save("documentation.pdf");
  };

  return (
    <div className="w-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <div className="flex justify-between mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
        >
          <span>Back to HomePage</span>
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setShowReadme(!showReadme)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          >
            {showReadme ? "Show API Docs" : "Show README"}
          </button>
          {!showReadme && (
            <button
              onClick={handleGeneratePDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
            >
              Generate PDF
            </button>
          )}
        </div>
      </div>

      {showReadme ? (
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
            {readme?.content || "No README content available"}
          </pre>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-300">Endpoints</h3>
            <ul className="mt-2 space-y-2">
              {documentation
                ? (() => {
                    const entries = Object.entries(documentation);
                    const [lastKey, lastValue] =
                      entries[entries.length - 1] || [];
                    const parsedValue =
                      typeof lastValue === "object"
                        ? lastValue
                        : JSON.parse(lastValue);

                    return (
                      <li className="bg-gray-700 p-3 rounded">
                        <ul className="mt-2 pl-4">
                          {Object.entries(parsedValue).map(([key, value]) => (
                            <li key={key} className="text-green-400">
                              <h1 className="text-blue-400 text-xl">{key}</h1>:{" "}
                              {JSON.stringify(value)}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })()
                : null}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationCard;
