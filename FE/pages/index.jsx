import React, { useState } from "react";
import DocumentationCard from "../components/DocumentationCard";
import axios from "axios";
import { repoAPI } from "../services/api";
import { useRouter } from "next/router";

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
      setErrors((prev) => ({ ...prev, documentation: null }));
      setLoadingStates((prev) => ({ ...prev, documentation: true }));
      const response = await repoAPI.createDocument({ repoUrl: url });
      if (!response.data) {
        router.push("/404");
        return;
      }
      console.log(response.data)
      setDocumentation(response.data);
    } catch (err) {
      router.push("/404");
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentation: false }));
    }
  };

  const handleCreateReadme = async () => {
    if (!url.trim()) {
      setErrors((prev) => ({ ...prev, readme: "Please enter a URL" }));
      return;
    }

    if (!validateUrl(url)) {
      setErrors((prev) => ({
        ...prev,
        readme: "Please enter a valid GitHub repository URL",
      }));
      return;
    }

    try {
      setErrors((prev) => ({ ...prev, readme: null }));
      setLoadingStates((prev) => ({ ...prev, readme: true }));
      const response = await repoAPI.createReadme({ repoUrl: url });
      if (!response.data) {
        router.push("/404");
        return;
      }
      setReadme(response.data);
    } catch (err) {
      router.push("/404");
    } finally {
      setLoadingStates((prev) => ({ ...prev, readme: false }));
    }
  };

  const handleDiagramClick = async () => {
    if (!url.trim()) {
      setErrors((prev) => ({ ...prev, diagram: "Please enter a valid URL" }));
      return;
    }
    try {
      setErrors((prev) => ({ ...prev, diagram: null }));
      setLoadingStates((prev) => ({ ...prev, diagram: true }));
      // Add your diagram API call here
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        diagram:
          err.response?.data?.message ||
          err.message ||
          "Failed to create diagram",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, diagram: false }));
    }
  };

  const handleReset = () => {
    setDocumentation(null);
    setReadme(null);
    setUrl("");
    setErrors({
      documentation: null,
      readme: null,
      diagram: null,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white py-8">
      <h1 className="text-4xl font-bold text-red-600">
        Marvel Documentation Creator
      </h1>
      {!documentation ? (
        <>
          <p className="mt-4 text-lg text-gray-300">
            Enter the URL to generate your documentation
          </p>
          <div className="w-full max-w-2xl flex flex-col items-center">
            <input
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="Enter your URL here"
              className="mt-4 px-4 py-2 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white w-2/3"
            />
            <div className="flex gap-4">
              <button
                onClick={handleCreateReadme}
                disabled={loadingStates.readme}
                className={`mt-4 px-4 py-2 bg-blue-600 text-white rounded ${
                  loadingStates.readme
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {loadingStates.readme ? "Creating..." : "Create ReadMe File"}
              </button>
              {errors.readme && (
                <p className="mt-4 text-red-500">{errors.readme}</p>
              )}

              <button
                onClick={handleButtonClick}
                disabled={loadingStates.documentation}
                className={`mt-4 px-4 py-2 bg-green-600 text-white rounded ${
                  loadingStates.documentation
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-700"
                }`}
              >
                {loadingStates.documentation
                  ? "Creating..."
                  : "Create Documentation"}
              </button>
              {errors.documentation && (
                <p className="mt-4 text-red-500">{errors.documentation}</p>
              )}

              <button
                onClick={handleDiagramClick}
                disabled={loadingStates.diagram}
                className={`mt-4 px-4 py-2 bg-purple-600 text-white rounded ${
                  loadingStates.diagram
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-purple-700"
                }`}
              >
                {loadingStates.diagram
                  ? "Creating..."
                  : "Create Architecture Diagram"}
              </button>
              {errors.diagram && (
                <p className="mt-4 text-red-500">{errors.diagram}</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <DocumentationCard
          documentation={documentation}
          readme={readme}
          onBack={handleReset}
        />
      )}
    </div>
  );
}
