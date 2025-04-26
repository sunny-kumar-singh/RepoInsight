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

const extractApis = async (repoDocument, apiKey) => {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-flash",
      apiKey,
      maxOutputTokens: 2048,
    });

    const template = `Extract and document all API endpoints from the provided codebase documentation:

Documentation:
{documentation}

For each API endpoint found, provide:

## API Documentation

### Endpoint 1
- **Path**: [HTTP Method] /path
- **Description**: Brief description of what the endpoint does
- **Request Parameters**:
  - Query params (if any)
  - Path params (if any)
- **Request Body**: Required fields and their types
- **Response**: Expected response format and status codes
- **Authentication**: Required authentication (if any)
- **Example Usage**: Simple request/response example

[Repeat for each endpoint found]

Note: Focus on Express.js routes, controller methods, and API-related code.
Format the response in clean markdown.`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      documentation: JSON.stringify(repoDocument),
    });

    return { content: result };
  } catch (error) {
    throw new Error(`API extraction failed: ${error.message}`);
  }
};

const generateReadme = async (repoDocument, apiKey) => {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-flash",
      apiKey,
      maxOutputTokens: 2048,
    });

    const template = `Analyze the provided documentation and generate a well-structured, concise, and informative README.md file.

Documentation:
{documentation}

Generate a README that includes the following sections:


## 1. Project Overview
- Briefly describe the purpose and functionality of the project.

## 2. Installation Instructions
- Provide step-by-step instructions for installing dependencies and setting up the project.
- Mention any prerequisites.

## 3. Usage Guide
- Explain how to run and use the project.
- Include sample commands or examples if applicable.

## 4. Key Features
- List the main features and functionalities of the project.

## 5. Project Structure
- Provide an overview of the directory and file structure.
- Briefly describe the purpose of key files or directories.

## 6. Dependencies
- List important dependencies and their versions.
- Include instructions on how to install them if necessary.

## 7. Contributing Guidelines
- Outline the process for contributing to the project.
- Include steps to create issues, submit pull requests, and follow coding standards.

## 8. License Information
- Specify the license under which the project is distributed.
- Provide a link to the full license text if applicable.

Format the response in markdown. Ensure that the content is concise, clear, and maintains a professional tone.`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      documentation: JSON.stringify(repoDocument),
    });

    return { content: result };
  } catch (error) {
    throw new Error(`README generation failed: ${error.message}`);
  }
};

const generateArchitectureDiagram = async (repoDocument, apiKey) => {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-flash",
      apiKey,
      maxOutputTokens: 2048,
    });

    const template = `Analyze the provided documentation and generate a Mermaid architecture diagram.

Documentation:
{documentation}

Create a Mermaid diagram that shows:
1. Main components and their relationships
2. Data flow between components
3. External dependencies and integrations
4. Key services and their interactions

Return only the Mermaid diagram code in this format:
\`\`\`mermaid
graph TD
   // Your diagram nodes and connections here
\`\`\`

Use appropriate Mermaid syntax for components, connections, and styling.`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      documentation: JSON.stringify(repoDocument),
    });

    return { content: result };
  } catch (error) {
    throw new Error(`Architecture diagram generation failed: ${error.message}`);
  }
};

const generateDocumentation = async (repoUrl, apiKey) => {
  try {
    const chain = initializeChain(apiKey);
    const repoPath = await repoCloneService.cloneRepository(repoUrl);
    const files = await readRepositoryFiles(repoPath);
    const documentation = await processFiles(files, chain);

    // Generate README, API documentation, and architecture diagram
    const readmeResponse = await generateReadme(documentation, apiKey);
    const apiResponse = await extractApis(documentation, apiKey);
    const architectureResponse = await generateArchitectureDiagram(
      documentation,
      apiKey
    );

    await cleanupRepository(repoPath);
    return {
      documentation,
      readme: readmeResponse,
      apis: apiResponse,
      architecture: architectureResponse,
    };
  } catch (error) {
    throw new Error(`Documentation generation failed: ${error.message}`);
  }
};

const generateDocumentationStream = async (repoUrl, apiKey, sendEvent) => {
  const chain = initializeChain(apiKey);
  const repoPath = await repoCloneService.cloneRepository(repoUrl);
  const files = await readRepositoryFiles(repoPath);

 

  // Process files in batches
  const documentation = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(batch, chain);
    const filtered = batchResults.filter(Boolean);
    documentation.push(...filtered);
    sendEvent("batch", {
      progress: `${documentation.length}/${files.length}`,
      batch: filtered,
    });
  }

  // Generate README separately
 
  try {
    const readmeResponse = await generateReadme(documentation, apiKey);
    sendEvent("readme", {
      type: "readme",
      content: readmeResponse.content,
      status: "completed",
    });
  } catch (error) {
    sendEvent("error", {
      type: "readme",
      message: "README generation failed",
      error: error.message,
    });
  }

  // Generate architecture diagram separately
  
  try {
    const architectureResponse = await generateArchitectureDiagram(
      documentation,
      apiKey
    );
    sendEvent("architecture", {
      type: "architecture",
      content: architectureResponse.content,
      status: "completed",
    });
  } catch (error) {
    sendEvent("error", {
      type: "architecture",
      message: "Architecture diagram generation failed",
      error: error.message,
    });
  }

  // Cleanup and complete
  await cleanupRepository(repoPath);
 
};

module.exports = {
  generateDocumentation,
  generateDocumentationStream,
  generateReadme,
  generateArchitectureDiagram,
};
