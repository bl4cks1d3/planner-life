import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NotificationsService } from "./notifications.service";

const CORE_API_URL = process.env.CORE_API_URL ?? "http://localhost:4000";
const AGENT_PORT = process.env.AGENT_PORT ?? "4100";

interface UpcomingEvent {
  id: string;
  title: string;
  start: string;
}

/**
 * Rotinas proativas: o Jarvis nao fica so esperando voce perguntar. Resumo
 * da manha todo dia, e aviso antes de cada compromisso -- as duas usam a
 * fila de notificacoes (NotificationsService), que o app desktop/dashboard
 * consomem via polling.
 *
 * Chama o proprio /chat via HTTP (em vez de injetar AgentService por DI)
 * porque AgentService vive no AppModule raiz e nao e exportado -- e o
 * mesmo padrao ja usado aqui pra falar com o Core.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly remindedEventIds = new Set<string>();

  constructor(private readonly notifications: NotificationsService) {}

  @Cron("0 8 * * *")
  async morningBriefing(): Promise<void> {
    try {
      const res = await fetch(`http://localhost:${AGENT_PORT}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "Bom dia. Resuma rapidamente: tarefas pendentes, compromissos de hoje e por onde comecar. Seja breve (max 4 frases).",
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = (await res.json()) as { reply?: string };
      if (data.reply) this.notifications.push("Bom dia", data.reply);
    } catch (err) {
      this.logger.error(`falha no resumo da manha: ${err instanceof Error ? err.message : err}`);
    }
  }

  @Cron("*/5 * * * *")
  async upcomingEvents(): Promise<void> {
    try {
      const res = await fetch(`${CORE_API_URL}/integrations/google/calendar?limit=20`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const events = (await res.json()) as UpcomingEvent[];
      const now = Date.now();
      for (const ev of events) {
        const minutesUntil = (new Date(ev.start).getTime() - now) / 60_000;
        if (minutesUntil > 0 && minutesUntil <= 15 && !this.remindedEventIds.has(ev.id)) {
          this.remindedEventIds.add(ev.id);
          this.notifications.push("Compromisso em breve", `${ev.title} em ${Math.round(minutesUntil)} min`);
        }
      }
    } catch (err) {
      this.logger.debug(`falha ao checar proximos eventos: ${err instanceof Error ? err.message : err}`);
    }
  }
}
