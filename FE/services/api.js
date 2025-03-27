import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const repoAPI = {
  getAllRepos: () => api.get("/repos"),
  createDocument: (data) => api.post("/repos", data),
  createReadme: (data) => api.post("/reposReadme", data),
};

export default api;
