const projectList = document.querySelector("#project-list");
const projectCount = document.querySelector("#project-count");
const status = document.querySelector("#status");

async function loadProjects() {
  try {
    const response = await fetch("/api/projects", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`The server returned ${response.status}.`);
    }

    const { projects } = await response.json();
    renderProjects(projects);
  } catch (error) {
    status.textContent = `Unable to load projects. ${error.message}`;
    status.classList.add("status-error");
  }
}

function renderProjects(projects) {
  status.hidden = true;
  projectList.hidden = false;
  projectCount.textContent = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  if (projects.length === 0) {
    projectList.innerHTML = "<p class=\"empty-state\">No projects are available yet.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";

    const category = document.createElement("p");
    category.className = "project-category";
    category.textContent = project.category;

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.className = "project-description";
    description.textContent = project.description || `${project.type} project`;

    const link = document.createElement("a");
    link.className = "launch-button";
    link.href = project.url;
    link.textContent = "Launch project";
    link.setAttribute("aria-label", `Launch ${project.title}`);

    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.append(arrow);

    card.append(category, title, description, link);
    fragment.append(card);
  }
  projectList.replaceChildren(fragment);
}

loadProjects();
