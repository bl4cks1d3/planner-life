import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { EventBusModule } from "./event-bus/event-bus.module";
import { EventsModule } from "./events/events.module";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { MemoryModule } from "./memory/memory.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    DatabaseModule,
    EventBusModule,
    EventsModule,
    ProjectsModule,
    TasksModule,
    MemoryModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
