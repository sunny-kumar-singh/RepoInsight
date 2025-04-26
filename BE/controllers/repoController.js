const {
  generateDocumentationStream,
  generateReadme,
  generateArchitectureDiagram,
} = require("../src/services/documentationService");
require("dotenv").config();
const createDocumentation = async (req, res) => {
  const { repoUrl, type } = req.body;

  if (!repoUrl) {
    return res.status(400).json({
      success: false,
      message: "Repository URL is required",
    });
  }

  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
  };

  try {
    switch (type) {
      case "readme":
       
        const readmeResult = await generateReadme(
          repoUrl,
          process.env.GEMINI_API_KEY
        );
        sendEvent("readme", { content: readmeResult.content });
        break;

      case "architecture":
      
        const architectureResult = await generateArchitectureDiagram(
          repoUrl,
          process.env.GEMINI_API_KEY
        );
        sendEvent("architecture", { content: architectureResult.content });
        break;

      default:
        await generateDocumentationStream(
          repoUrl,
          process.env.GEMINI_API_KEY,
          sendEvent
        );
    }

     sendEvent("done", { message: "Documentation generation completed" });
  } catch (error) {
    console.error("Generation error:", error);
    sendEvent("error", {
      message: error.message || "Generation failed",
      code: error.code || 500,
    });
  } finally {
    res.end();
  }
};

const getRepoByname = async (req, res) => {
  // To be implemented
};

module.exports = {
  createDocumentation,
  getRepoByname,
};
