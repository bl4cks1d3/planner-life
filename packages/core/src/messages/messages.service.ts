import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PlannerDb } from "../db";
import { PLANNER_DB } from "../database/database.module";
import { PlannerEventBus } from "../eventBus";
import { EventsService } from "../events/events.service";
import * as messagesRepo from "../repositories/messages";

@Injectable()
export class MessagesService {
  constructor(
    @Inject(PLANNER_DB) private readonly db: PlannerDb,
    private readonly eventsService: EventsService,
    private readonly eventBus: PlannerEventBus
  ) {}

  list() {
    return messagesRepo.listMessages(this.db);
  }

  get(id: string) {
    return messagesRepo.getMessage(this.db, id);
  }

  /**
   * Usado tanto por uma futura sincronizacao com o Gmail (um id externo do
   * provedor evita duplicar a mesma mensagem a cada sync) quanto por
   * qualquer outra fonte que queira alimentar o inbox do Planner Life.
   */
  upsert(input: {
    id?: string;
    from: string;
    subject: string;
    snippet?: string;
    tag?: string;
    action?: string;
    receivedAt: string;
  }) {
    const message = messagesRepo.upsertMessage(this.db, input);
    this.eventsService.record("message.synced", { messageId: message.id, from: message.from });
    this.eventBus.publish("message.synced", { messageId: message.id, from: message.from });
    return message;
  }

  setHandled(id: string, handled: boolean) {
    const message = messagesRepo.setMessageHandled(this.db, id, handled);
    if (!message) {
      throw new NotFoundException("mensagem nao encontrada");
    }
    this.eventsService.record("message.handled", { messageId: id, handled });
    this.eventBus.publish("message.handled", { messageId: id, handled });
    return message;
  }
}
