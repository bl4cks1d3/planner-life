import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { ToolRegistry } from "./tool-registry";
import { McpManager } from "./mcp/mcp-manager";
import { SkillsManager } from "./skills/skills-manager";

@Module({
  controllers: [AgentController],
  providers: [AgentService, ToolRegistry, McpManager, SkillsManager],
})
export class AppModule {}
