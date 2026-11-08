# TaskTrack

A simple student task manager built with:
- HTML, CSS, and JavaScript
- Node.js and Express
- SQLite (`better-sqlite3`)

## Features
- Add tasks with a title, description, and deadline
- Edit and delete tasks
- Track Pending, In Progress, and Completed tasks
- Search tasks and filter by status
- Dashboard counts for each task status
- Responsive layout for phones, tablets, and computers

## Run locally
1. Install Node.js 20 or newer.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Deploy to Render
This repository includes `render.yaml` with:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free

Connect the GitHub repository to Render as a Web Service. If Render asks for settings manually, use the values above and leave Root Directory blank.

## Important note about SQLite on Render Free
Render Free web services do not have persistent disks. The app can run for a school demonstration, but SQLite data stored on the free service's local filesystem may be lost after a restart, redeploy, or instance replacement. Do not use this free setup for important or permanent data.

The app creates `tasktrack.db` automatically when the server starts. Do not upload a local database file to GitHub.
