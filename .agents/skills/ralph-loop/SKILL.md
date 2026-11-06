---
name: ralph-loop
description: >-
  Executes the Ralph Loop autonomous AI agent execution methodology in Antigravity.
  Use this skill whenever the user asks to run an autonomous loop, work through tasks in a PRD/task list iteratively,
  execute unattended development workflows, or references "Ralph Loop", "autonomous loop", or "loop mode".
---

# Ralph Loop for Antigravity

The **Ralph Loop** is an autonomous execution methodology designed to overcome context window degradation and eliminate the need for constant human oversight by externalizing task state and memory to files on disk.

## Core Principles

1. **External Memory Over Context Window:** Never rely on the conversation history to remember what was done 10 steps ago. All progress and state are committed to files (`PRD.md` and `progress.txt`).
2. **One Task Per Iteration:** Complete exactly **ONE** task or discrete subtask per iteration cleanly.
3. **Continuous Verification:** Every task must be verified (build, test, lint, or run) before marking it done.
4. **Append-Only Progress:** `progress.txt` is an append-only log of accomplishments, decisions, and blockers.
5. **Git Commit Per Task:** Every completed task is committed to Git with a clean message so rollback is effortless.

---

## File Architecture

A Ralph Loop project uses three standard files in the project root:

```text
├── PRD.md (or TASKS.md)    # The task backlog with discrete checkboxes
├── progress.txt            # Append-only chronological log of completions
└── @ralph-loop             # Activation trigger
```

### 1. `PRD.md` (Task Backlog Example)
```markdown
# Project Requirements Document (PRD)

## Tasks
- [ ] Task 1: Initialize database schema and migrations
- [ ] Task 2: Create user authentication endpoints
- [ ] Task 3: Build frontend login form and connect API
- [ ] Task 4: Write unit and integration tests
```

### 2. `progress.txt` (Log Example)
```text
=== RALPH LOOP PROGRESS LOG ===
[Iteration 1] [2026-11-06 18:00] Completed Task 1: Schema initialized and verified with pytest. Git commit: a1b2c3d.
[Iteration 2] [2026-11-06 18:15] Completed Task 2: Auth endpoints created. JWT tokens verified with curl. Git commit: e4f5g6h.
```

---

## Execution Protocol for the Agent

When activated on a task file (e.g., `PRD.md`):

### Step 1: Ingest State
1. Read `progress.txt` if it exists. Note what has already been accomplished.
2. Read `PRD.md` (or the specified task file). Find the **first unchecked item** (`- [ ]`).

### Step 2: Implement Single Task
1. Focus **exclusively** on this single unchecked task. Do not jump ahead to subsequent tasks.
2. Make code edits, create files, or modify configuration as needed.

### Step 3: Verify & Test
1. Run relevant automated tests, linters, or build scripts to confirm the change works.
2. If tests fail, debug and fix the current task before proceeding.

### Step 4: Record Progress & Commit
1. Check off the completed task in `PRD.md` (`- [x]`).
2. Append a timestamped entry to `progress.txt` detailing:
   - What was implemented
   - Verification status
   - Any architectural decisions or caveats
3. Stage and commit changes to git:
   ```bash
   git add .
   git commit -m "feat(ralph): complete <task name>"
   ```

### Step 5: Check Termination Condition
- If all tasks in `PRD.md` are marked `[x]`:
  - Append completion marker `=== RALPH LOOP COMPLETE ===` to `progress.txt`.
  - Provide a final summary of all completed tasks.
- If more tasks remain:
  - Proceed to the next iteration (or notify the runner/VS Code extension for the next loop).

---

## How to Call This Skill

### In Antigravity Chat:
You can invoke this skill at any time by telling Antigravity:
* *"Run the Ralph loop on PRD.md"*
* *"Use Ralph loop to complete the remaining tasks in TASKS.md"*
* *"Start Ralph loop mode for this workspace"*

### In the VS Code Extension:
1. Open the **Ralph Loop** sidebar icon in VS Code / Antigravity IDE.
2. Select your task file (`PRD.md`).
3. Set max iterations (e.g., 20).
4. Click **Start Loop** (or press `Ctrl+Shift+P` -> `Ralph: Start Ralph Loop`).

