# RepoGrade

RepoGrade is an AI-powered GitHub assignment evaluator. It lets an evaluator enter an assignment title, assignment description, rubric, and GitHub repository URL, then returns an AI-generated grading report with an overall score, grade, rubric breakdown, strengths, weaknesses, and improvement suggestions.

The application has a React frontend built with Vite and an Express backend that fetches repository contents from GitHub, reads the repository README and first supported source file, and sends that context to Groq for evaluation.

## Features

- Evaluate a GitHub repository from a browser form.
- Provide assignment context through title, description, and rubric fields.
- Fetch repository files through the GitHub Contents API.
- Include README content in the AI evaluation when available.
- Analyze supported source files from the repository root.
- Generate structured JSON feedback from an LLM.
- Display the overall score, grade, and strengths in the frontend.

## Tech Stack

### Frontend

- React
- Vite
- Axios
- CSS and inline component styles

### Backend

- Node.js
- Express
- CORS
- Dotenv
- Axios
- Groq SDK

## Project Structure

```text
AI-Github-Evaluator/
|-- backend/
|   |-- package.json
|   |-- package-lock.json
|   `-- server.js
|-- public/
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- assets/
|   |-- App.css
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- .gitignore
|-- eslint.config.js
|-- index.html
|-- package.json
|-- package-lock.json
|-- README.md
`-- vite.config.js
```

## How It Works

1. The user fills out the RepoGrade form in the frontend.
2. The frontend sends a `POST` request to `http://localhost:5000/evaluate`.
3. The backend extracts the repository owner and name from the GitHub URL.
4. The backend calls the GitHub Contents API for the repository root.
5. The backend looks for:
   - README files
   - root-level source files ending in `.js`, `.java`, `.py`, `.cpp`, or `.c`
6. If a README is found, its raw content is downloaded.
7. If supported code files are found, the first source file is downloaded.
8. The backend sends the assignment details, rubric, README, and source code to Groq.
9. Groq returns a JSON report.
10. The frontend displays the evaluation result.

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- A Groq API key

You can create a Groq API key from the Groq developer console.

## Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
```

The `.env` file is ignored by Git, so secrets are not committed.

## Installation

Install frontend dependencies from the project root:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

## Running the App

Start the backend server from the `backend/` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

In a second terminal, start the frontend from the project root:

```bash
npm run dev
```

Vite will print the local frontend URL, usually:

```text
http://localhost:5173
```

Open the frontend URL in your browser and use the form to evaluate a GitHub repository.

## API Reference

### `POST /evaluate`

Evaluates a GitHub repository against assignment details and a rubric.

Request body:

```json
{
  "title": "Todo App Assignment",
  "description": "Build a todo app with create, update, delete, and filter features.",
  "rubric": "Correctness: 40%, Code Quality: 30%, Documentation: 20%, Edge Cases: 10%",
  "githubUrl": "https://github.com/owner/repository"
}
```

Successful response:

```json
{
  "success": true,
  "report": {
    "overallScore": 8,
    "grade": "Excellent",
    "rubricBreakdown": {
      "Correctness": "...",
      "Code Quality": "...",
      "Documentation": "...",
      "Edge Cases": "..."
    },
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "suggestions": ["...", "..."]
  }
}
```

Error response:

```json
{
  "success": false,
  "error": "Something went wrong while evaluating the repository."
}
```

## Supported Repository Content

The backend currently checks only the root directory of the submitted repository. It looks for source files with these extensions:

- `.js`
- `.java`
- `.py`
- `.cpp`
- `.c`

If multiple supported files exist, only the first supported file returned by the GitHub Contents API is sent for evaluation.

## Available Scripts

From the project root:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the frontend for production.

```bash
npm run preview
```

Previews the production frontend build locally.

```bash
npm run lint
```

Runs ESLint on the project.

From the `backend/` directory:

```bash
node server.js
```

Starts the Express API server.

## Current Limitations

- The backend only reads files from the repository root.
- Only the first supported source file is evaluated.
- Private GitHub repositories are not supported unless GitHub authentication is added.
- The frontend currently displays only part of the AI report.
- Invalid GitHub URLs are not deeply validated before the backend parses them.
- Large files or large READMEs may exceed model context limits.
- The backend error message mentions Gemini quota, but the current AI provider in code is Groq.

## Future Improvements

- Add recursive repository traversal.
- Evaluate multiple files instead of only the first supported file.
- Add GitHub token support for private repositories and higher rate limits.
- Display rubric breakdown, weaknesses, and suggestions in the frontend.
- Add form validation and loading states.
- Add backend scripts such as `npm start` and `npm run dev`.
- Add automated tests for URL parsing, GitHub fetching, and AI response parsing.
- Improve error handling for invalid repositories, missing files, and malformed AI JSON.

## Notes for Development

- Keep API keys in `backend/.env`.
- Do not commit `node_modules/`, build output, or local environment files.
- The frontend expects the backend to be available at `http://localhost:5000`.
- If the backend port changes, update the Axios URL in `src/App.jsx`.
