
import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let aiInstance: any;
let googleAiPluginInstance: any;

try {
  console.log("[Genkit] Attempting to instantiate googleAI() plugin...");
  // The googleAI() plugin will automatically look for GEMINI_API_KEY in process.env
  googleAiPluginInstance = googleAI();
  console.log("[Genkit] googleAI() plugin instantiated successfully.");
} catch (pluginError: any) {
  console.error(
    "CRITICAL GENKIT PLUGIN ERROR: Failed to INSTANTIATE googleAI() plugin. This often means GEMINI_API_KEY is missing, invalid, or inaccessible in the build environment.",
    "Plugin Error Type:", Object.prototype.toString.call(pluginError),
    "Plugin Error Message:", pluginError?.message,
    "Plugin Error Stack:", pluginError?.stack
  );
  googleAiPluginInstance = null; // Ensure it's null so Genkit initialization is skipped
}

if (googleAiPluginInstance) {
  try {
    console.log("[Genkit] Attempting to initialize Genkit core with the googleAI plugin...");
    aiInstance = genkit({
      plugins: [googleAiPluginInstance],
    });
    console.log("[Genkit] Genkit core initialized successfully with the googleAI plugin.");
  } catch (genkitInitError: any) {
    console.error(
      "CRITICAL GENKIT CORE ERROR: Genkit core initialization FAILED with the googleAI plugin. This could be due to Genkit core issues or deeper plugin integration problems.",
      "Genkit Init Error Type:", Object.prototype.toString.call(genkitInitError),
      "Genkit Init Error Message:", genkitInitError?.message,
      "Genkit Init Error Stack:", genkitInitError?.stack
    );
    aiInstance = undefined; // Ensure aiInstance is undefined on error
  }
} else {
  console.warn("[Genkit] Genkit core initialization SKIPPED because the googleAI plugin could not be instantiated.");
  aiInstance = undefined;
}

export const ai = aiInstance;
