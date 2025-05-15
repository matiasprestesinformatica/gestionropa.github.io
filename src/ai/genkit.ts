
import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import {isDev} from "genkit/dev_internal"; // Not typically needed for basic setup

let aiInstance;

try {
  // The googleAI() plugin will automatically look for GEMINI_API_KEY in process.env
  aiInstance = genkit({
    plugins: [
      googleAI(),
    ],
    model: 'googleai/gemini-2.0-flash', // Default model, can be overridden in generate calls
  });
} catch (e: any) {
  // Log a more detailed error to help diagnose issues during build or runtime
  console.error(
    "CRITICAL: Failed to initialize Genkit AI. This might be due to missing or invalid API keys (e.g., GEMINI_API_KEY), network issues, or plugin configuration errors.",
    "Error Details:", e.message, 
    "Stack:", e.stack
  );
  // Re-throw the error to ensure the build process or application startup
  // fails clearly if AI initialization is a critical problem.
  throw new Error(`Genkit initialization failed: ${e.message || String(e)}`);
}

export const ai = aiInstance;
