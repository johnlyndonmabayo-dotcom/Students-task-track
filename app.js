const taskList = document.getElementById("taskList");
const modal = document.getElementById("taskModal");
const form = document.getElementById("taskForm");
const message = document.getElementById("message");

let tasks = [];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function showMessage(text = "") {
  message.textContent = text;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function updateStats() {
  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent = tasks.filter(t => t.status === "Pending").length;
  document.getElementById("progressCount").textContent = tasks.filter(t => t.status === "In Progress").length;
  document.getElementById("completedCount").textContent = tasks.filter(t => t.status === "Completed").length;
}

function formatDeadline(value) {
  if (!value) return "No deadline";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) :
    date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function renderTasks() {
  updateStats();
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const filter = document.getElementById("statusFilter").value;
  const visible = tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.description || ""}`.toLowerCase().includes(search);
    return matchesSearch && (filter === "All" || task.status === filter);
  });

  if (!visible.length) {
    taskList.innerHTML = `<div class="empty-state"><div class="empty-icon">☷</div><h3>${tasks.length ? "No matching tasks" : "No tasks yet"}</h3><p>${tasks.length ? "Try another search or status filter." : "Add your first task to get started."}</p></div>`;
    return;
  }

  taskList.innerHTML = visible.map(task => {
    const badgeClass = task.status.toLowerCase().replace(" ", "-");
    return `
      <article class="task-card">
        <div class="task-main">
          <h3>${escapeHTML(task.title)}</h3>
          ${task.description ? `<p>${escapeHTML(task.description)}</p>` : ""}
          <div class="task-meta">
            <span>▦ ${formatDeadline(task.deadline)}</span>
            <span class="badge ${badgeClass}">${escapeHTML(task.status)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="small-button" data-action="edit" data-id="${task.id}">Edit</button>
          <button class="small-button delete" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </article>`;
  }).join("");
}

async function loadTasks() {
  showMessage("");
  try {
    tasks = await api("/api/tasks");
    renderTasks();
  } catch (error) {
    showMessage(`${error.message} Please refresh the page.`);
    taskList.innerHTML = `<div class="empty-state"><h3>Unable to load tasks</h3><p>Check your connection and try again.</p></div>`;
  }
}

function openModal(task = null) {
  form.reset();
  document.getElementById("taskId").value = task ? task.id : "";
  document.getElementById("titleInput").value = task ? task.title : "";
  document.getElementById("descriptionInput").value = task ? task.description || "" : "";
  document.getElementById("deadlineInput").value = task ? task.deadline || "" : "";
  document.getElementById("taskStatus").value = task ? task.status : "Pending";
  document.getElementById("modalTitle").textContent = task ? "Edit Task" : "Add New Task";
  document.getElementById("saveTaskButton").textContent = task ? "Save Changes" : "Save Task";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("titleInput").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.getElementById("addTaskTop").addEventListener("click", () => openModal());
document.getElementById("addTaskMobile").addEventListener("click", () => openModal());
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
document.getElementById("searchInput").addEventListener("input", renderTasks);
document.getElementById("statusFilter").addEventListener("change", renderTasks);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("taskId").value;
  const payload = {
    title: document.getElementById("titleInput").value,
    description: document.getElementById("descriptionInput").value,
    deadline: document.getElementById("deadlineInput").value,
    status: document.getElementById("taskStatus").value
  };
  const saveButton = document.getElementById("saveTaskButton");
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  showMessage("");
  try {
    await api(id ? `/api/tasks/${id}` : "/api/tasks", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await loadTasks();
    showMessage(id ? "Task updated successfully." : "Task added successfully.");
  } catch (error) {
    showMessage(error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? "Save Changes" : "Save Task";
  }
});

taskList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  if (button.dataset.action === "edit") {
    openModal(task);
    return;
  }

  if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    button.disabled = true;
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      await loadTasks();
      showMessage("Task deleted successfully.");
    } catch (error) {
      showMessage(error.message);
      button.disabled = false;
    }
  }
});

loadTasks();
