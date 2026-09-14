import { getProjects, getTasks } from "@/lib/api";
import PlanDayButton from "./plan-day-button";

function formatTime(iso?: string) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function Home() {
  const [projects, tasks] = await Promise.all([getProjects(), getTasks()]);
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(
    (task) => task.dueAt && new Date(task.dueAt).toDateString() === today
  );

  return (
    <main className="dashboard">
      <h1>Planner Life</h1>

      <section>
        <h2>Hoje</h2>
        {todayTasks.length === 0 && <p className="muted">Nenhuma tarefa para hoje.</p>}
        <ul className="agenda">
          {todayTasks.map((task) => (
            <li key={task.id}>
              <span className="time">{formatTime(task.dueAt)}</span>
              <span>{task.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Projetos</h2>
        {projects.length === 0 && <p className="muted">Nenhum projeto ainda.</p>}
        <ul className="projects">
          {projects.map((project) => (
            <li key={project.id}>
              <div className="project-row">
                <span>{project.name}</span>
                <span>{project.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${project.progress}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PlanDayButton />
    </main>
  );
}
