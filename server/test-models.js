import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function main() {
  try {
    // Check if the API key is actually loaded from .env
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing from .env');
      return;
    }
    
    // The older SDK method might be ai.models.listModels() or ai.listModels() depending on version
    // Let's use fetch directly using the API key to be safe and accurate with the REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error.message);
      return;
    }
    
    console.log('Available Models:');
    const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
    generateModels.forEach(m => console.log(m.name));
  } catch (error) {
    console.error(error);
  }
}

main();
