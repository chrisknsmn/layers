import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.NVIDIA_NIM_API_KEY;
const baseURL =
  process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const modelId =
  process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.3-70b-instruct";

const nim = createOpenAICompatible({
  name: "nvidia-nim",
  apiKey,
  baseURL,
});

export const nimModel = nim.chatModel(modelId);
export const nimModelId = modelId;
