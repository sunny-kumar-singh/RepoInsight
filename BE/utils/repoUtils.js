const { default: simpleGit } = require("simple-git");
const path = require("path");
const fs = require("fs");

const CLONED_REPO_DIR = path.join(__dirname, "../cloned_repo");

if (!fs.existsSync(CLONED_REPO_DIR)) fs.mkdirSync(CLONED_REPO_DIR);

const cloneRepo = async (repoUrl) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const repoName = `cloned_${timestamp}`;
  const repoPath = path.join(CLONED_REPO_DIR, repoName);

  try {
    await simpleGit().clone(repoUrl, repoPath);
    return repoPath;
  } catch (error) {
    console.error("Error cloning repo:", error);
    return null;
  }
};

module.exports = { cloneRepo };
