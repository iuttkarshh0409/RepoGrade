# RepoGrade Evaluation Pipeline Refactor

This document details the root causes, architecture changes, and implementation details of the refactored evaluation pipeline for RepoGrade.

## 🔍 Root Cause of Current Problems

1. **Root-Only File Scanning**: The repository evaluation only checked the root folder of a GitHub repository for files matching a narrow list of extensions. In modern project structures (e.g. React/Vite, Next.js, Java, Python, Express), the source code resides in nested directories (`src/`, `app/`, `backend/`, etc.). This resulted in no code files found, or only scanning top-level configurations.
2. **Single-File Evaluation**: The pipeline sent only the first discovered source file to the LLM. Evaluating a single file (like `vite.config.js` or `index.js`) leads to highly incomplete, skewed, and inconsistent scores and feedback.
3. **Fragile JSON Parsing & Non-Safe Schema**: The LLM frequently wrapped JSON in markdown backticks or wrote conversational text. Parsing the whole string caused JSON syntax errors. Furthermore, missing properties inside the parsed response crashed the frontend (previously) or caused sections to disappear silently.
4. **Subjective/Invented Scores**: The LLM was asked to return an overall score subjectively rather than mathematically computing it based on individual rubric criteria.
5. **Hardcoded Rubric Categories**: The backend ignored the user-supplied evaluation rubric and forced the LLM to rate based on hardcoded categories ("Correctness", "Code Quality", "Documentation", "Edge Cases").

---

## 🛠️ Architectural & Pipeline Improvements

### 1. Recursive Repository Scanning via Git Trees API
Instead of sending multiple folder-traversal requests, the backend now calls the GitHub Git Trees API with `recursive=1` to retrieve the entire folder hierarchy in a single API request.
- **Ignored Folders**: The scanner ignores non-source folders (`node_modules`, `dist`, `build`, `.git`, `coverage`, `.next`, `target`, `bin`, `obj`, `.idea`, `.vscode`, `venv`).
- **Extended Language Support**: Supports a broad list of programming and template file extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.java`, `.py`, `.cpp`, `.c`, `.cs`, `.go`, `.rs`, `.php`, `.rb`, `.html`, `.css`.

### 2. Multi-File Context Compilation
To evaluate the repo holistically while staying within LLM token budgets:
- **Heuristic Prioritization**: Evaluator prioritizes files in core source directories (such as `src/`, `app/`, `lib/`, `backend/`) and pushes test/config files to the bottom of the download queue.
- **Representative Selection**: Downloads up to 8 of the highest-priority source files.
- **Character Budget Guard**: Enforces a strict budget of `25,000` characters total. If a file would exceed this limit, it is either safely truncated or omitted to protect the LLM context window.
- **Structured Layout**: Files are joined into a single context string separated by clear headers:
  ```
  ===== path/to/file.ext =====
  content
  ```

### 3. Dynamic Rubric Scoring & Mathematical Calculation
- The LLM prompt is dynamically loaded with the instructor-provided rubric.
- The LLM is instructed to identify each grading criterion in the rubric, evaluate it, and mathematically calculate the `overallScore` out of 10 based on the weights in the rubric (or equal weights if no weights are defined).
- This ensures scores are objective, reproducible, and tied directly to the rubric.

### 4. Resilient Extraction, Parsing, & Schema Normalization
- **Regex Extraction**: Extracts only the outer JSON object matching `/\{[\s\S]*\}/` to guarantee robust parsing even if conversational text is included.
- **Schema Sanitization**: Normalizes the response before sending it to the client. If arrays or rubric breakdown objects are missing or not structured correctly, the backend falls back to safe default structures (e.g. empty arrays `[]` or flat string-value pairs) so that the React frontend is completely safe from rendering errors.

---

## 📂 Files Modified

1. **`backend/server.js`**:
   - Replaced Contents API call with Git Trees recursive call.
   - Added `getRepoFiles` and `selectAndDownloadFiles` helper functions.
   - Re-wrote the LLM prompt, Groq completion handler, regex JSON extraction, schema normalization, and detailed logging.
2. **`src/App.jsx`**:
   - Added dynamic grid mapping for `rubricBreakdown`, safelist iteration for `strengths`/`weaknesses`/`suggestions`, and updated loading/message displays.

---

## 📊 Testing Performed

1. **Port Verification**: Confirmed the new server processes evaluation requests on port `5000` correctly.
2. **Recursive Path Verification**: Tested the Git Trees API against complex repository structures (including React/Vite and Express backends) to verify nested source files were discovered and selected.
3. **LLM Output & Sanitization**: Verified that raw responses from Llama-3.3-70b-versatile are parsed successfully even when wrapped in markdown backticks, and the normalized schema renders properly in the frontend components.

---

## ⚠️ Remaining Limitations

1. **GitHub API Rate Limits**: GitHub limits unauthenticated API requests to 60/hour. If the backend is under heavy load, it could trigger a rate limit response (403). Using GitHub OAuth/Personal Access tokens would resolve this.
2. **Context Window Size**: The total context size of downloaded files is capped at 25,000 characters to keep Groq completions fast and prevent timeout errors. For exceptionally large repositories, some files might be truncated.
