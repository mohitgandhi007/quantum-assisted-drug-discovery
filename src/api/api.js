import { mockCandidates } from './mockData';

// Global flag to toggle between mock data and the live FastAPI backend
export const USE_MOCK = false;

// Centralized Backend URL
export const API_BASE_URL = "http://localhost:8000";

/**
 * Fetch candidate molecules for the drug discovery target.
 * Uses the agreed endpoint from the project plan when USE_MOCK is false.
 */
export async function getCandidates(runId) {
  if (USE_MOCK) {
    // Simulate minor network delay for realistic visual feedback
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockCandidates;
  }

  try {
    const url = runId 
      ? `${API_BASE_URL}/api/discover/${runId}/candidates` 
      : `${API_BASE_URL}/api/discover/test/candidates`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching candidates from FastAPI backend:", error);
    throw new Error("Unable to connect to discovery backend.");
  }
}

/**
 * Optional pipeline detail fetching if backend implements it.
 * Defaults to mock data for demo robustness.
 */
export async function getPipelineStatus() {
  if (USE_MOCK) {
    return { status: "success" };
  }
  // Implement a status check endpoint if needed by Person 1
  try {
    const response = await fetch(`${API_BASE_URL}/api/discover/status`);
    if (response.ok) {
      return await response.json();
    }
    return { status: "unknown" };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}
