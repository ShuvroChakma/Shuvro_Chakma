/* ============================================
   PROJECTS.JS
   Handles: default seed data, reading projects
   (from localStorage, falling back to defaults),
   rendering cards, category filtering, and the
   project detail modal.
   ============================================ */

var PortfolioProjects = (function () {
  "use strict";

  var STORAGE_KEY = "portfolio_projects";

  /* Default projects — used the first time the site loads,
     before any admin edits exist in localStorage. Mirrors
     /data/projects.json so the static JSON stays useful for
     reference or manual deployment edits. */
  var DEFAULT_PROJECTS = [
    {
      id: "proj-1",
      title: "Nazumeah Jewellers — Jewelry E-commerce Platform",
      category: "Frontend",
      summary: "A full-scale e-commerce frontend for customer-facing shopping and an admin dashboard for catalog and order management.",
      description: "Built a full-scale e-commerce frontend covering both customer-facing shopping flows and an admin dashboard for product catalog and order management. Structured routing and data flow with TanStack Router, nested routes, loaders, and TypeScript interfaces to keep the codebase consistent and reduce runtime errors, while working closely with API integration requirements and documenting data structures for long-term maintainability.",
      tech: ["React", "TypeScript", "Vite", "TanStack Router"],
      features: [
        "Customer-facing storefront and product catalog",
        "Admin dashboard for product and order management",
        "Nested routing with TanStack Router loaders",
        "TypeScript interfaces for consistent data structures"
      ],
      challenges: "Coordinating consistent data flow and routing across two very different experiences — a public storefront and an internal admin dashboard — while keeping the codebase maintainable.",
      solutions: "Used TanStack Router's nested routes and loaders alongside well-defined TypeScript interfaces, and documented API data structures clearly to reduce integration errors and improve team communication.",
      image: "",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "proj-2",
      title: "InsiderJobs — Job Portal / Job Management System",
      category: "Frontend",
      summary: "A role-based job portal supporting job seekers and recruiters with posting, application tracking, and CRUD workflows.",
      description: "Developed role-based interfaces for job seekers and recruiters, supporting dashboard workflows, job posting, application tracking, and CRUD operations. Coordinated applicant and recruiter actions through REST APIs while maintaining clean, responsive frontend flows across both user roles.",
      tech: ["React", "REST APIs"],
      features: [
        "Separate dashboards for job seekers and recruiters",
        "Job posting and application tracking",
        "Full CRUD operations on listings and applications",
        "Responsive interfaces across both user roles"
      ],
      challenges: "Mapping two distinct user roles with different permissions and workflows onto a single, coherent application without duplicating logic.",
      solutions: "Built role-based interfaces on top of REST APIs, keeping shared components reusable while clearly separating recruiter and job-seeker workflows — deepening the approach to requirements, user roles, and process mapping.",
      image: "",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "proj-3",
      title: "ClimateX — Weather Application",
      category: "Full Stack",
      summary: "A responsive weather app with real-time data, a clean UI, and a custom Node.js backend for API integration.",
      description: "Developed a responsive weather application with a clean user interface, API-based real-time data display, and performance-focused state handling. Paired the frontend with a custom Node.js backend to manage API integration, which deepened understanding of client-server architecture and technical troubleshooting.",
      tech: ["React", "Tailwind CSS", "Node.js", "WeatherAPI"],
      features: [
        "Real-time weather data display",
        "Custom Node.js backend for API integration",
        "Performance-focused state handling",
        "Clean, responsive UI with Tailwind CSS"
      ],
      challenges: "Handling real-time API data efficiently on the frontend without unnecessary re-renders or stale state.",
      solutions: "Introduced performance-focused state handling on the client and routed API calls through a custom Node.js backend, which also made debugging and troubleshooting the data flow more straightforward.",
      image: "",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "proj-4",
      title: "Core Dhaka Landing Page — Corporate Website",
      category: "Frontend",
      summary: "A responsive corporate landing page built with WordPress and Elementor for business presentation and marketing.",
      description: "Designed and customized a responsive corporate landing page using Elementor sections, layouts, and reusable UI components, supporting business presentation and digital marketing goals through a polished, conversion-focused page structure.",
      tech: ["WordPress", "Elementor"],
      features: [
        "Custom Elementor sections and layouts",
        "Reusable UI components",
        "Conversion-focused page structure",
        "Fully responsive across devices"
      ],
      challenges: "Balancing a visually polished, marketing-ready design with fast load times and mobile responsiveness inside a page-builder workflow.",
      solutions: "Built the page from reusable Elementor components and layouts, tuning sections for both visual polish and responsiveness to support the client's presentation and marketing goals.",
      image: "",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "proj-5",
      title: "Northstar Trading Landing Page — Corporate Website",
      category: "Frontend",
      summary: "A responsive Elementor landing page built for lead generation and client engagement.",
      description: "Built and optimized a responsive landing page for Northstar Trading using Elementor, ensuring mobile compatibility, intuitive navigation, and a professional user experience that translates business requirements into visually appealing sections.",
      tech: ["WordPress", "Elementor"],
      features: [
        "Mobile-compatible responsive layout",
        "Intuitive navigation structure",
        "Sections built around marketing and lead generation goals",
        "Professional, business-ready visual design"
      ],
      challenges: "Translating business requirements into a page structure that supports marketing and lead-generation goals without overcomplicating navigation.",
      solutions: "Mapped business requirements directly to visually clear Elementor sections, prioritizing intuitive navigation and mobile compatibility throughout.",
      image: "",
      liveUrl: "#",
      githubUrl: "#"
    }
  ];

  function getProjects() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read stored projects, using defaults.", e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS.slice();
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function categoryClass(cat) {
    return cat.toLowerCase().replace(/\s+/g, "-");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function cardTemplate(p) {
    var bannerContent = p.image
      ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.title) + ' banner">'
      : "// no banner image set";
    var techChips = (p.tech || [])
      .slice(0, 5)
      .map(function (t) { return '<span class="tech-chip">' + escapeHtml(t) + '</span>'; })
      .join("");

    return (
      '<article class="project-card reveal in-view" data-category="' + escapeHtml(p.category) + '" data-id="' + escapeHtml(p.id) + '">' +
        '<div class="project-banner">' + bannerContent + '</div>' +
        '<div class="project-body">' +
          '<span class="project-tag">' + escapeHtml(p.category) + '</span>' +
          '<h3 class="project-title">' + escapeHtml(p.title) + '</h3>' +
          '<p class="project-summary">' + escapeHtml(p.summary) + '</p>' +
          '<div class="project-tech">' + techChips + '</div>' +
          '<button type="button" class="project-more" data-open-project="' + escapeHtml(p.id) + '">View full details →</button>' +
          '<div class="project-actions">' +
            '<a class="btn btn-outline btn-sm" href="' + escapeHtml(p.liveUrl || "#") + '" target="_blank" rel="noopener">Live Demo</a>' +
            '<a class="btn btn-ghost btn-sm" href="' + escapeHtml(p.githubUrl || "#") + '" target="_blank" rel="noopener">GitHub</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderGrid(containerEl, projects, emptyMessage) {
    if (!projects.length) {
      containerEl.innerHTML = '<div class="empty-state">' + (emptyMessage || "No projects to show yet.") + '</div>';
      return;
    }
    containerEl.innerHTML = projects.map(cardTemplate).join("");
  }

  function openModal(project) {
    var overlay = document.querySelector("#project-modal");
    if (!overlay || !project) return;

    overlay.querySelector("[data-modal-banner]").innerHTML = project.image
      ? '<img src="' + escapeHtml(project.image) + '" alt="' + escapeHtml(project.title) + '">'
      : "";
    overlay.querySelector("[data-modal-tag]").textContent = project.category;
    overlay.querySelector("[data-modal-title]").textContent = project.title;
    overlay.querySelector("[data-modal-desc]").textContent = project.description || project.summary;

    var techWrap = overlay.querySelector("[data-modal-tech]");
    techWrap.innerHTML = (project.tech || [])
      .map(function (t) { return '<span class="tech-chip">' + escapeHtml(t) + '</span>'; })
      .join("");

    var featuresWrap = overlay.querySelector("[data-modal-features]");
    featuresWrap.innerHTML = (project.features || [])
      .map(function (f) { return "<li>" + escapeHtml(f) + "</li>"; })
      .join("");

    overlay.querySelector("[data-modal-challenges]").textContent = project.challenges || "—";
    overlay.querySelector("[data-modal-solutions]").textContent = project.solutions || "—";

    var liveBtn = overlay.querySelector("[data-modal-live]");
    var repoBtn = overlay.querySelector("[data-modal-repo]");
    liveBtn.href = project.liveUrl || "#";
    repoBtn.href = project.githubUrl || "#";

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var overlay = document.querySelector("#project-modal");
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initModalHandlers(allProjects) {
    var overlay = document.querySelector("#project-modal");
    if (!overlay) return;

    document.body.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-open-project]");
      if (trigger) {
        var id = trigger.getAttribute("data-open-project");
        var project = allProjects.find(function (p) { return p.id === id; });
        openModal(project);
        return;
      }
      if (e.target.closest("[data-modal-close]") || e.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function initFilterBar(gridEl, allProjects) {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.getAttribute("data-filter");
      var filtered = filter === "All" ? allProjects : allProjects.filter(function (p) { return p.category === filter; });
      renderGrid(gridEl, filtered, "No projects in this category yet.");
    });
  }

  /* Public: render the full grid + filters + modal on projects.html */
  function initProjectsPage() {
    var gridEl = document.querySelector("[data-projects-grid]");
    if (!gridEl) return;
    var projects = getProjects();
    renderGrid(gridEl, projects);
    initFilterBar(gridEl, projects);
    initModalHandlers(projects);
  }

  /* Public: render a small "featured" set on the homepage */
  function initFeaturedProjects(limit) {
    var gridEl = document.querySelector("[data-featured-grid]");
    if (!gridEl) return;
    var projects = getProjects().slice(0, limit || 3);
    renderGrid(gridEl, projects, "No projects added yet — check back soon!");
    initModalHandlers(getProjects());
  }

  return {
    getProjects: getProjects,
    saveProjects: saveProjects,
    DEFAULT_PROJECTS: DEFAULT_PROJECTS,
    initProjectsPage: initProjectsPage,
    initFeaturedProjects: initFeaturedProjects
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  PortfolioProjects.initProjectsPage();
  PortfolioProjects.initFeaturedProjects(3);
});