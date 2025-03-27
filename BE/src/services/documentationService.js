const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const fs = require("fs").promises;
const path = require("path");
const RepoCloneService = require("./repoCloneService");

const initializeChain = (apiKey) => {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash",
    apiKey,
    maxOutputTokens: 2048,
  });

  const template = `Analyze the following code and provide comprehensive documentation:
  
  File: {fileName}
  
  Code:
  {fileContent}
  
  Provide:
  1. Overview: Brief description of the file's purpose
  2. Main Components: Key functions/classes and their purposes
  3. Dependencies: Important external dependencies
  4. Examples: Usage examples where applicable
  5. Technical Details: Any important implementation details
  
  Format the response in markdown.`;

  const promptTemplate = PromptTemplate.fromTemplate(template);

  return RunnableSequence.from([
    promptTemplate,
    model,
    new StringOutputParser(),
  ]);
};

const readRepositoryFiles = async (repoPath) => {
  const files = [];
  const ignoreDirs = [".git", "node_modules"];

  async function readDir(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name)) {
            await readDir(fullPath);
          }
        } else {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            files.push({ path: fullPath, content });
          } catch (error) {
            console.error(`Error reading file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }

  await readDir(repoPath);
  return files;
};

const BATCH_SIZE = 5; // Number of files to process simultaneously

const processBatch = async (batch, chain) => {
  return Promise.all(
    batch.map(async (file) => {
      try {
        const result = await chain.invoke({
          fileName: path.basename(file.path),
          fileContent: file.content,
        });
        return {
          filePath: file.path,
          documentation: result,
        };
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
        return null;
      }
    })
  );
};

const processFiles = async (files, chain) => {
  const documentation = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(batch, chain);
    documentation.push(...batchResults.filter(Boolean));
  }
  return documentation;
};

const cleanupRepository = async (repoPath) => {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error cleaning up repository at ${repoPath}:`, error);
  }
};

const repoCloneService = new RepoCloneService();

const generateDocumentation = async (repoUrl, apiKey) => {
  try {
    const chain = initializeChain(apiKey);
    const repoPath = await repoCloneService.cloneRepository(repoUrl);
    const files = await readRepositoryFiles(repoPath);
    const documentation = await processFiles(files, chain);
    await cleanupRepository(repoPath);
    return documentation;
  } catch (error) {
    throw new Error(`Documentation generation failed: ${error.message}`);
  }
};

module.exports = {
  generateDocumentation,
};
