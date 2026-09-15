import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";

export type ClaudeCodeActionStatus = "pending" | "running" | "done" | "error" | "rejected";

export interface ClaudeCodeAction {
  id: string;
  prompt: string;
  cwd: string;
  status: ClaudeCodeActionStatus;
  createdAt: string;
  output?: string;
  error?: string;
}

// "claude" no Windows e instalado como .cmd/.ps1 -- chamar o binario certo
// evita precisar de shell:true (e do risco de injecao que vem junto).
const CLAUDE_BIN = process.platform === "win32" ? "claude.cmd" : "claude";

/**
 * O Personal Agent nunca executa run_claude_code sozinho: ele so registra um
 * pedido pendente aqui. O dashboard mostra esse pedido e o usuario precisa
 * clicar em "confirmar" para o comando de verdade rodar no terminal --
 * dar a um agente autonomo (inclusive por comando de voz) permissao pra
 * chamar outro agente de codigo com acesso total ao sistema sem essa
 * confirmacao e um padrao perigoso demais pra liberar sem humano no meio.
 */
@Injectable()
export class ClaudeCodeService {
  private readonly logger = new Logger(ClaudeCodeService.name);
  private readonly actions = new Map<string, ClaudeCodeAction>();

  createPending(prompt: string, cwd?: string): ClaudeCodeAction {
    const id = randomUUID();
    const action: ClaudeCodeAction = {
      id,
      prompt,
      cwd: cwd?.trim() || process.env.CLAUDE_CODE_CWD || process.cwd(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.actions.set(id, action);
    return action;
  }

  listPending(): ClaudeCodeAction[] {
    return [...this.actions.values()]
      .filter((a) => a.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  reject(id: string): ClaudeCodeAction {
    const action = this.mustGet(id);
    action.status = "rejected";
    return action;
  }

  async confirm(id: string): Promise<ClaudeCodeAction> {
    const action = this.mustGet(id);
    action.status = "running";
    try {
      action.output = await this.run(action.prompt, action.cwd);
      action.status = "done";
    } catch (err) {
      action.error = err instanceof Error ? err.message : String(err);
      action.status = "error";
      this.logger.error(action.error);
    }
    return action;
  }

  private mustGet(id: string): ClaudeCodeAction {
    const action = this.actions.get(id);
    if (!action) throw new NotFoundException(`pedido ${id} nao encontrado`);
    return action;
  }

  private run(prompt: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        CLAUDE_BIN,
        ["-p", prompt],
        { cwd, timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(stderr.trim() || err.message));
            return;
          }
          resolve(stdout.trim() || stderr.trim());
        }
      );
    });
  }
}
