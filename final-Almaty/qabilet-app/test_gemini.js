const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyCulUwH4j8J-U19sOkUWkFpDaBLXrxFqLM');

async function run() {
  try {
    // The SDK doesn't expose ListModels directly, we can fetch via REST
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCulUwH4j8J-U19sOkUWkFpDaBLXrxFqLM');
    const data = await response.json();
    console.log("Available models:", data.models.map(m => m.name));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
