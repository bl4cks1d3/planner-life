import { InternalServerErrorException, Logger } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, SYSTEM_PROMPT, runTool } from "../tools";
import type { LlmProvider } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const MISSING_KEY_MESSAGE =
  "ANTHROPIC_API_KEY nao configurada. Configure GROQ_API_KEY, GEMINI_API_KEY ou ANTHROPIC_API_KEY no .env (veja .env.example) e ajuste AGENT_PROVIDER se necessario.";

function toAnthropicTools(): Anthropic.Tool[] {
  return AGENT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters as Anthropic.Tool.InputSchema,
  }));
}

/**
 * Provider pago (Claude). Mantido como opcao para quem tem credito na
 * Anthropic; o padrao do Planner Life e usar Groq ou Gemini (free tier).
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly logger = new Logger("AnthropicProvider");
  private readonly history: Anthropic.MessageParam[] = [];
  private client: Anthropic | undefined;

  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException(MISSING_KEY_MESSAGE);
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  async chat(userMessage: string): Promise<string> {
    const client = this.getClient();
    this.history.push({ role: "user", content: userMessage });

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: toAnthropicTools(),
        messages: this.history,
      });

      this.history.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        return response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        this.logger.log(`ferramenta: ${block.name} ${JSON.stringify(block.input)}`);
        try {
          const result = await runTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: true,
            content: err instanceof Error ? err.message : String(err),
          });
        }
      }

      this.history.push({ role: "user", content: toolResults });
    }
  }
}
