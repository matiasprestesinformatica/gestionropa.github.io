
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let aiInstance: any;

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "CRITICAL GENKIT SETUP ERROR: GEMINI_API_KEY environment variable is not set. Genkit will not be initialized. Please ensure this variable is correctly set in your build environment (e.g., Netlify environment variables)."
  );
  aiInstance = undefined;
} else {
  try {
    console.log("[Genkit] GEMINI_API_KEY is detected. Attempting to instantiate googleAI() plugin and initialize Genkit core...");
    
    const googleAiPluginInstance = googleAI(); // This plugin uses GEMINI_API_KEY from process.env
    console.log("[Genkit] googleAI() plugin instantiated successfully.");

    aiInstance = genkit({
      plugins: [googleAiPluginInstance],
    });
    console.log("[Genkit] Genkit core initialized successfully with the googleAI plugin.");

  } catch (error: any) {
    console.error(
      "CRITICAL GENKIT INITIALIZATION FAILURE: An error occurred during Genkit or googleAI plugin setup. This likely means the GEMINI_API_KEY is invalid, has insufficient permissions, or there's an issue with the Genkit/GoogleAI packages.",
      "Error Type:", Object.prototype.toString.call(error),
      "Error Message:", error?.message,
      "Error Stack:", error?.stack
    );
    aiInstance = undefined; // Ensure aiInstance is undefined on any error during setup
  }
}

export const ai = aiInstance;
