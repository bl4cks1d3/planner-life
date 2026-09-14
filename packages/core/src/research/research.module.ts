import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { ResearchService } from "./research.service";
import { ResearchController } from "./research.controller";

@Module({
  imports: [EventsModule],
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
