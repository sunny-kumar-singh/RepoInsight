Deployment Status:
Deployment is currently underway but not fully completed due to Nginx configuration issues. The deployed link is accessible; however, some functionalities of the application may not work properly until the configuration is fully resolved. Work is in progress to fix the issue and ensure full functionality.


# RepoInsight
# Marvel Documentation Creator

A powerful, automated documentation generator that transforms GitHub repositories into comprehensive, well-structured documentation with real-time progress tracking and architecture visualization.

## 🚀 Features

- **Automated Documentation Generation**: Analyzes repository content and generates detailed documentation
- **Real-time Progress Tracking**: Live console updates showing documentation generation progress
- **Architecture Diagram Generation**: Automatically creates visual architecture diagrams using Mermaid.js
- **Interactive UI**: Modern, responsive interface with smooth animations
- **PDF Export**: Generate and download documentation in PDF format
- **README Generation**: Automatic generation of project README files
- **Error Handling**: Robust error handling with user-friendly error messages

## 🛠️ Tech Stack

### Frontend
- Next.js & React
- Tailwind CSS for styling
- React Icons for UI elements
- Server-Sent Events (SSE) for real-time updates

### Backend
- Node.js & Express
- Google Gemini AI for content generation
- Langchain for AI prompt management
- Mermaid.js for diagram generation

## 🏗️ Project Structure

```bash
project/
├── FE/                     # Frontend Next.js application
│   ├── components/         # Reusable React components
│   ├── pages/             # Next.js pages
│   └── styles/            # Global styles and Tailwind config
│
└── BE/                     # Backend Express application
    ├── controllers/        # Request handlers
    ├── routes/            # API routes
    ├── services/          # Business logic
    └── utils/             # Utility functions
