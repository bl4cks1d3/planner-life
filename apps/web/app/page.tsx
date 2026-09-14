import {
  getCalendarEvents,
  getClients,
  getEvents,
  getGoogleStatus,
  getGoogleTasks,
  getHabits,
  getMessages,
  getPapers,
  getProjects,
  getResearchLines,
  getServiceHealth,
  getSubjects,
  getTasks,
} from "@/lib/api";
import DashboardShell from "./dashboard-shell";

export default async function Home() {
  const [
    projects,
    tasks,
    events,
    clients,
    subjects,
    researchLines,
    papers,
    messages,
    habits,
    googleStatus,
    calendarEvents,
    googleTasks,
    health,
  ] = await Promise.all([
    getProjects(),
    getTasks(),
    getEvents(30),
    getClients(),
    getSubjects(),
    getResearchLines(),
    getPapers(),
    getMessages(),
    getHabits(),
    getGoogleStatus(),
    getCalendarEvents(8),
    getGoogleTasks(),
    getServiceHealth(),
  ]);

  return (
    <DashboardShell
      projects={projects}
      tasks={tasks}
      events={events}
      clients={clients}
      subjects={subjects}
      researchLines={researchLines}
      papers={papers}
      messages={messages}
      habits={habits}
      googleAccounts={googleStatus.accounts}
      calendarEvents={calendarEvents}
      googleTasks={googleTasks}
      health={health}
    />
  );
}
