import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import { AgentService } from "./agent.service";

@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get("health")
  health() {
    return { ok: true, service: "planner-agent" };
  }

  @Post("chat")
  async chat(@Body() body: { message?: string }) {
    if (!body?.message) {
      throw new BadRequestException("message e obrigatorio");
    }
    const reply = await this.agentService.chat(body.message);
    return { reply };
  }
}
