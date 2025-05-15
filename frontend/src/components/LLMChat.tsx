import React, { useState } from "react";
import ModelSelector from "./ModelSelector";
import { LlmService } from "../api";
import { LLMCompletionRequestDto } from "../api";

const LLMChat: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    if (!selectedModel) {
      setError("Please select a model first");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Use the API client generated from the common package
      const request: LLMCompletionRequestDto = {
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      };

      // Use the LlmService instead of the missing createChatCompletion function
      const completion = await LlmService.createChatCompletion(request);

      // Extract the response text from the completion, safely handling potentially undefined values
      if (
        completion.choices &&
        completion.choices.length > 0 &&
        completion.choices[0]?.message
      ) {
        setResponse(completion.choices[0].message.content || "");
      } else {
        setResponse("No response received.");
      }
    } catch (err) {
      console.error("Error generating text:", err);
      setError(
        "Failed to generate text. Please check if the API is available and you have proper authentication.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="llm-chat-container">
      <h2>LLM Chat</h2>

      <div className="model-selection">
        <h3>Select Model</h3>
        <ModelSelector onModelSelect={handleModelSelect} />
        {selectedModel && (
          <div className="selected-model">
            <p>
              Selected model: <strong>{selectedModel}</strong>
            </p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-area">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={4}
            disabled={isGenerating}
          />
        </div>

        <button type="submit" disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? "Generating..." : "Generate Response"}
        </button>
      </form>

      {response && (
        <div className="response-area">
          <h3>Response</h3>
          <div className="response-content">
            {response.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMChat;
