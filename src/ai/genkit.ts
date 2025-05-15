
import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import {isDev} from "genkit/dev_internal"; // Not typically needed for basic setup

let aiInstance: any; // Use 'any' to allow for undefined in case of critical failure

try {
  // The googleAI() plugin will automatically look for GEMINI_API_KEY in process.env
  aiInstance = genkit({
    plugins: [
      googleAI(),
    ],
    // The 'model' option is generally not part of the top-level genkit() constructor in v1.x.
    // Models are typically specified in ai.generate() calls or when defining specific model instances.
    // model: 'googleai/gemini-2.0-flash', 
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
  // For "Cannot find module for page" errors, sometimes allowing 'aiInstance' to be undefined
  // can help the build pass, but it's better to fix the root cause.
  // If an invalid option here causes genkit() to throw, this catch will handle it.
  throw new Error(`Genkit initialization failed: ${e.message || String(e)}`);
}

export const ai = aiInstance;

