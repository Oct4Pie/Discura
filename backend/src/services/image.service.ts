import { ImageGenerationConfig, LLMProvider } from "@discura/common";
import axios from "axios";

import { getApiKey } from "./vercel-ai-sdk.service";
import { logger } from "../utils/logger";

// Generate an image using the specified provider
export const generateImage = async (
  prompt: string,
  config: ImageGenerationConfig,
): Promise<string | null> => {
  try {
    switch (config.provider) {
      case "openai":
        return await generateOpenAIImage(
          prompt,
          config.apiKey || "",
          config.model,
        );
      case "stability":
        return await generateStabilityImage(
          prompt,
          config.apiKey || "",
          config.model,
        );
      case "midjourney":
        return await generateMidjourneyImage(prompt, config.apiKey || "");
      case "together":
        return await generateTogetherImage(
          prompt,
          config.apiKey || "",
          config.model,
        );
      case "chutes_hidream":
        // Use the getApiKey function to retrieve the key properly
        const apiKey = config.apiKey || getApiKey(LLMProvider.CHUTES) || "";
        return await generateChutesHiDreamImage(prompt, apiKey);
      default:
        logger.error(`Unknown image provider: ${config.provider}`);
        return null;
    }
  } catch (error) {
    logger.error(`Image generation error (${config.provider}):`, error);
    return null;
  }
};

// Generate image with OpenAI DALL-E
const generateOpenAIImage = async (
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string | null> => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt,
        model: model || "dall-e-3",
        n: 1,
        size: "1024x1024",
        response_format: "url",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.data[0].url;
  } catch (error) {
    logger.error("OpenAI image generation error:", error);
    return null;
  }
};

// Generate image with Stability AI
const generateStabilityImage = async (
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string | null> => {
  try {
    const response = await axios.post(
      `https://api.stability.ai/v1/generation/${model || "stable-diffusion-xl-1024-v1-0"}/text-to-image`,
      {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    // Convert base64 image data to URL
    const imageData = response.data.artifacts[0].base64;
    return `data:image/png;base64,${imageData}`;
  } catch (error) {
    logger.error("Stability AI image generation error:", error);
    return null;
  }
};

// Generate image with Midjourney (via a custom API)
const generateMidjourneyImage = async (
  prompt: string,
  apiKey: string,
): Promise<string | null> => {
  try {
    // Note: This is a placeholder for a Midjourney API
    // You'll need to implement this based on the actual API you're using
    // As Midjourney doesn't have an official API yet

    const response = await axios.post(
      "https://your-midjourney-api-endpoint.com/generate",
      {
        prompt,
        apiKey,
      },
    );

    return response.data.imageUrl;
  } catch (error) {
    logger.error("Midjourney image generation error:", error);
    return null;
  }
};

// Generate image with Together AI
const generateTogetherImage = async (
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string | null> => {
  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/images/generations",
      {
        model: model || "black-forest-labs/FLUX.1-schnell-Free",
        prompt,
        steps: 10,
        n: 1
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Return the URL of the first generated image
    return response.data.data[0].url;
  } catch (error) {
    logger.error("Together AI image generation error:", error);
    return null;
  }
};

// Generate image with Chutes HiDream
const generateChutesHiDreamImage = async (
  prompt: string,
  apiKey: string,
): Promise<string | null> => {
  logger.info("Generating image with Chutes HiDream");
  logger.debug(`API Key available: ${apiKey ? "Yes" : "No"}`);
  
  try {
    const response = await axios.post(
      "https://chutes-hidream.chutes.ai/generate",
      {
        seed: null,
        shift: 3,
        prompt,
        resolution: "1024x1024",
        guidance_scale: 5,
        num_inference_steps: 50
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: 'arraybuffer'
      },
    );

    // Convert the binary image data to a base64 URL
    const imageBuffer = Buffer.from(response.data);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    logger.error("Chutes HiDream image generation error:", error);
    return null;
  }
};
