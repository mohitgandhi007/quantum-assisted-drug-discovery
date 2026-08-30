import { mockCandidates } from './mockData';

// Global flag to toggle between mock data and the live FastAPI backend
export const USE_MOCK = false;

// Centralized Backend URL
export const API_BASE_URL = "http://localhost:8000";

/**
 * Fetch candidate molecules for the drug discovery target.
 */
export async function getCandidates() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockCandidates;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching candidates from FastAPI backend:", error);
    throw new Error("Unable to connect to discovery backend.");
  }
}

/**
 * Fetch a specific candidate with explanation
 */
export async function getCandidateDetails(candidateId) {
  if (USE_MOCK) return null;
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`);
  if (!response.ok) throw new Error("Failed to fetch candidate details.");
  return await response.json();
}

/**
 * Trigger pipeline run (returns DetailedPipelineResponse)
 */
export async function runPipeline() {
  if (USE_MOCK) return { status: "READY" };
  const response = await fetch(`${API_BASE_URL}/pipeline/run`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to run pipeline.");
  return await response.json();
}

/**
 * Fetch Quantum Results
 */
export async function getQuantumResults() {
  if (USE_MOCK) return null;
  const response = await fetch(`${API_BASE_URL}/quantum/result`);
  if (!response.ok) throw new Error("Failed to fetch quantum results.");
  return await response.json();
}
