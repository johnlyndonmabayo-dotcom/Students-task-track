const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Render Free uses temporary local storage. For a small assignment/demo,
// this local SQLite database is sufficient, but data may reset after redeploys.
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "tasktrack.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "TaskTrack" });
});

app.get("/api/tasks", (req, res) => {
  try {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY id DESC").all();
    res.json(tasks);
  } catch (error) {
    console.error("Could not load tasks:", error);
    res.status(500).json({ error: "Could not load tasks." });
  }
});

app.post("/api/tasks", (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const deadline = typeof req.body.deadline === "string" ? req.body.deadline : "";

  if (!title) {
    return res.status(400).json({ error: "Please enter a task title." });
  }

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, deadline)
      VALUES (?, ?, ?)
    `).run(title, description, deadline);

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (error) {
    console.error("Could not create task:", error);
    res.status(500).json({ error: "Could not create task." });
  }
});

app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const deadline = typeof req.body.deadline === "string" ? req.body.deadline : "";
  const status = req.body.status;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }
  if (!title) {
    return res.status(400).json({ error: "Please enter a task title." });
  }
  if (!["Pending", "In Progress", "Completed"].includes(status)) {
    return res.status(400).json({ error: "Please choose a valid task status." });
  }

  try {
    const result = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, deadline = ?, status = ?
      WHERE id = ?
    `).run(title, description, deadline, status, id);

    if (!result.changes) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json(task);
  } catch (error) {
    console.error("Could not update task:", error);
    res.status(500).json({ error: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  try {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    if (!result.changes) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({ message: "Task deleted." });
  } catch (error) {
    console.error("Could not delete task:", error);
    res.status(500).json({ error: "Could not delete task." });
  }
});

// Return the app for all non-API routes (useful if a route is refreshed).
app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskTrack is running on port ${PORT}`);
});
