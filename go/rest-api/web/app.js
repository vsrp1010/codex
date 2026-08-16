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

    const preview = createPreview(project);
    if (project.featured) {
      const featured = document.createElement("span");
      featured.className = "featured-badge";
      featured.textContent = "Featured";
      preview.append(featured);
    }

    const content = document.createElement("div");
    content.className = "project-content";

    const metadata = document.createElement("div");
    metadata.className = "project-metadata";

    const category = document.createElement("span");
    category.className = "project-category";
    category.textContent = project.category;

    const projectStatus = document.createElement("span");
    projectStatus.className = "project-status";
    projectStatus.textContent = `Status: ${project.status || "not specified"}`;

    metadata.append(category, projectStatus);

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.className = "project-description";
    description.textContent = project.description || `${project.type} project`;

    const technologies = createTechnologyTags(project.technologies);

    const link = document.createElement("a");
    link.className = "launch-button";
    link.href = project.url;
    link.textContent = "Launch project";
    link.setAttribute("aria-label", `Launch ${project.title}`);

    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.append(arrow);

    content.append(metadata, title, description);
    if (technologies) {
      content.append(technologies);
    }
    content.append(link);
    card.append(preview, content);
    fragment.append(card);
  }
  projectList.replaceChildren(fragment);
}

function createPreview(project) {
  const preview = document.createElement("div");
  preview.className = "project-preview";

  if (!project.image) {
    addPreviewFallback(preview, project.category);
    return preview;
  }

  const image = document.createElement("img");
  image.src = project.image;
  image.alt = `Preview of ${project.title}`;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.remove();
    addPreviewFallback(preview, project.category);
  });
  preview.append(image);
  return preview;
}

function addPreviewFallback(preview, category) {
  const fallback = document.createElement("span");
  fallback.className = "preview-fallback";
  fallback.textContent = category || "project";
  preview.append(fallback);
}

function createTechnologyTags(technologies) {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return null;
  }

  const list = document.createElement("ul");
  list.className = "technology-list";
  for (const technology of technologies) {
    const item = document.createElement("li");
    item.textContent = technology;
    list.append(item);
  }
  return list;
}

loadProjects();
