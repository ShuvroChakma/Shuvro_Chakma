/* ============================================
   ADMIN.JS
   Runs only on admin.html. Everything is saved
   to localStorage — no backend/server required.
   ============================================ */

(function () {
  "use strict";

  var form = document.querySelector("#project-form");
  var listEl = document.querySelector("[data-admin-project-list]");
  var formTitle = document.querySelector("[data-form-title]");
  var cancelEditBtn = document.querySelector("[data-cancel-edit]");
  var editingId = null;

  /* ---------- Image compression ----------
     localStorage has a small quota (usually 5-10MB total for the
     whole site). Raw phone photos can be several MB each as base64,
     which fills that quota after just one or two uploads and makes
     every save after that fail silently. To avoid this, every image
     is resized down and re-encoded as a compressed JPEG before it's
     ever turned into a data URL. */
  function compressImage(file, maxDimension, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Could not read the file.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Could not read the image.")); };
        img.onload = function () {
          var width = img.width;
          var height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality || 0.75));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Projects: list / render ---------- */
  function renderList() {
    var projects = PortfolioProjects.getProjects();
    if (!projects.length) {
      listEl.innerHTML = '<div class="empty-state">No projects yet. Add your first one using the form above.</div>';
      return;
    }
    listEl.innerHTML = projects.map(function (p) {
      return (
        '<div class="admin-row" data-row-id="' + p.id + '">' +
          '<div class="admin-row-main">' +
            '<span class="project-tag">' + p.category + '</span>' +
            '<strong>' + p.title + '</strong>' +
            '<span class="admin-row-summary">' + p.summary + '</span>' +
          '</div>' +
          '<div class="admin-row-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + p.id + '">Edit</button>' +
            '<button type="button" class="btn btn-danger btn-sm" data-delete="' + p.id + '">Delete</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function getFormData() {
    var data = new FormData(form);
    return {
      id: editingId || ("proj-" + Date.now()),
      title: data.get("title").trim(),
      category: data.get("category"),
      summary: data.get("summary").trim(),
      description: data.get("description").trim(),
      tech: data.get("tech").split(",").map(function (t) { return t.trim(); }).filter(Boolean),
      features: data.get("features").split("\n").map(function (f) { return f.trim(); }).filter(Boolean),
      challenges: data.get("challenges").trim(),
      solutions: data.get("solutions").trim(),
      image: form.querySelector("[data-image-preview] img") ? form.querySelector("[data-image-preview] img").src : "",
      liveUrl: data.get("liveUrl").trim() || "#",
      githubUrl: data.get("githubUrl").trim() || "#"
    };
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Add a new project";
    cancelEditBtn.hidden = true;
    var preview = form.querySelector("[data-image-preview]");
    preview.innerHTML = "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var newProject = getFormData();
    if (!newProject.title || !newProject.summary) {
      showStatus("Please fill in at least a title and summary.", true);
      return;
    }

    var projects = PortfolioProjects.getProjects();

    if (editingId) {
      projects = projects.map(function (p) { return p.id === editingId ? newProject : p; });
    } else {
      projects.push(newProject);
    }

    try {
      PortfolioProjects.saveProjects(projects);
    } catch (err) {
      showStatus("Couldn't save — browser storage is full. Try a smaller banner image or remove an older project first. (" + err.name + ")", true);
      return;
    }

    showStatus(editingId ? "Project updated." : "Project added.");
    renderList();
    resetForm();
  });

  cancelEditBtn.addEventListener("click", resetForm);

  listEl.addEventListener("click", function (e) {
    var editBtn = e.target.closest("[data-edit]");
    var deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
      var id = editBtn.getAttribute("data-edit");
      var project = PortfolioProjects.getProjects().find(function (p) { return p.id === id; });
      if (!project) return;
      editingId = id;
      formTitle.textContent = "Edit project";
      cancelEditBtn.hidden = false;

      form.title.value = project.title;
      form.category.value = project.category;
      form.summary.value = project.summary;
      form.description.value = project.description || "";
      form.tech.value = (project.tech || []).join(", ");
      form.features.value = (project.features || []).join("\n");
      form.challenges.value = project.challenges || "";
      form.solutions.value = project.solutions || "";
      form.liveUrl.value = project.liveUrl === "#" ? "" : project.liveUrl;
      form.githubUrl.value = project.githubUrl === "#" ? "" : project.githubUrl;

      var preview = form.querySelector("[data-image-preview]");
      preview.innerHTML = project.image ? '<img src="' + project.image + '" alt="Banner preview">' : "";

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (deleteBtn) {
      var delId = deleteBtn.getAttribute("data-delete");
      if (!confirm("Delete this project? This cannot be undone.")) return;
      var remaining = PortfolioProjects.getProjects().filter(function (p) { return p.id !== delId; });
      PortfolioProjects.saveProjects(remaining);
      renderList();
      if (editingId === delId) resetForm();
      showStatus("Project deleted.");
    }
  });

  /* ---------- Project banner image upload → base64 ---------- */
  var imageInput = document.querySelector("#project-image-input");
  if (imageInput) {
    imageInput.addEventListener("change", function () {
      var file = imageInput.files[0];
      var preview = form.querySelector("[data-image-preview]");
      if (!file) { preview.innerHTML = ""; return; }
      if (!file.type.startsWith("image/")) {
        showStatus("Please select an image file.", true);
        return;
      }
      preview.innerHTML = '<span class="form-hint">Compressing image…</span>';
      compressImage(file, 900, 0.75)
        .then(function (dataUrl) {
          preview.innerHTML = '<img src="' + dataUrl + '" alt="Banner preview">';
        })
        .catch(function (err) {
          preview.innerHTML = "";
          showStatus("Could not process that image: " + err.message, true);
        });
    });
  }

  /* ---------- Profile photo upload ---------- */
  var photoInput = document.querySelector("#profile-photo-input");
  var photoPreview = document.querySelector("[data-photo-preview]");
  var photoRemoveBtn = document.querySelector("[data-remove-photo]");

  function renderPhotoPreview() {
    var saved = localStorage.getItem("portfolio_profile_photo");
    photoPreview.innerHTML = saved
      ? '<img src="' + saved + '" alt="Current profile photo">'
      : '<span class="photo-placeholder">No photo set yet</span>';
  }
  renderPhotoPreview();

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      var file = photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showStatus("Please select an image file.", true);
        return;
      }
      showStatus("Compressing and saving photo…");
      compressImage(file, 700, 0.8)
        .then(function (dataUrl) {
          try {
            localStorage.setItem("portfolio_profile_photo", dataUrl);
            renderPhotoPreview();
            showStatus("Profile photo updated. It's now live on the About page.");
          } catch (err) {
            showStatus("Storage is full. Try removing some projects or using a smaller photo. (" + err.name + ")", true);
          }
        })
        .catch(function (err) {
          showStatus("Could not process that image: " + err.message, true);
        });
      photoInput.value = "";
    });
  }

  if (photoRemoveBtn) {
    photoRemoveBtn.addEventListener("click", function () {
      localStorage.removeItem("portfolio_profile_photo");
      renderPhotoPreview();
      showStatus("Profile photo removed.");
    });
  }

  /* ---------- Status banner ---------- */
  var statusEl = document.querySelector("[data-admin-status]");
  var statusTimer;
  function showStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "admin-status show" + (isError ? " admin-status--error" : "");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      statusEl.classList.remove("show");
    }, 4000);
  }

  /* ---------- Export / Import (for deploying data as JSON) ---------- */
  var exportBtn = document.querySelector("[data-export-json]");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var data = JSON.stringify(PortfolioProjects.getProjects(), null, 2);
      var blob = new Blob([data], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "projects.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  var importInput = document.querySelector("#import-json-input");
  if (importInput) {
    importInput.addEventListener("change", function () {
      var file = importInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error("JSON must be an array of projects.");
          PortfolioProjects.saveProjects(parsed);
          renderList();
          showStatus("Projects imported from JSON.");
        } catch (err) {
          showStatus("Could not import file: " + err.message, true);
        }
      };
      reader.readAsText(file);
      importInput.value = "";
    });
  }

  /* ---------- Reset to defaults ---------- */
  var resetBtn = document.querySelector("[data-reset-defaults]");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (!confirm("Reset projects back to the original 3 sample projects? This removes any projects you've added.")) return;
      PortfolioProjects.saveProjects(PortfolioProjects.DEFAULT_PROJECTS);
      renderList();
      showStatus("Projects reset to defaults.");
    });
  }

  renderList();
})();
