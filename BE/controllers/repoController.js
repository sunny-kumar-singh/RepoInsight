const { generateDocumentation } = require("../src/services");
require("dotenv").config();

const createDocumentation = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const documentation = await generateDocumentation(
      repoUrl,
      process.env.GEMINI_API_KEY
    );

    res.status(200).json({
      success: true,
      message: "Documentation generated successfully",
      data: documentation,
    });
  } catch (error) {
    console.error("Documentation generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate documentation",
      error: error.message,
    });
  }
};

const getRepoByname = async (req, res) => {
  // To be implemented
};

const createReadme = async (req, res) => {
  // To be implemented
};

module.exports = {
  createDocumentation,
  getRepoByname,
  createReadme,
};
