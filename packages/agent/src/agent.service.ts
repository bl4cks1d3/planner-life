import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, runTool } from "./tools";

const SYSTEM_PROMPT = `Voce e o Personal Agent do Planner Life, um sistema operacional pessoal de IA.
Seu papel e ajudar o usuario a organizar tarefas, projetos e memoria pessoal.
Use as ferramentas disponiveis sempre que precisar criar, listar ou concluir
tarefas e projetos, ou salvar algo importante na memoria. Responda sempre em
portugues, de forma direta e util. Nao invente dados: se precisar de uma
informacao que so existe no Planner Core, use a ferramenta apropriada.`;

const MODEL = process.env.AGENT_MODEL ?? "claude-sonnet-5";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly history: Anthropic.MessageParam[] = [];
  private anthropic: Anthropic | undefined;

  /**
   * Cliente criado sob demanda: assim o servico sobe (e /health responde)
   * mesmo sem ANTHROPIC_API_KEY configurada, e so falha quando alguem
   * realmente tenta conversar com o agente.
   */
  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException(
        "ANTHROPIC_API_KEY nao configurada. Defina no arquivo .env na raiz do projeto."
      );
    }
    if (!this.anthropic) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.anthropic;
  }

  async chat(userMessage: string): Promise<string> {
    const anthropic = this.getClient();
    this.history.push({ role: "user", content: userMessage });

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
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
