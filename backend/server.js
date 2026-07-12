require("dotenv").config();
const Groq = require("groq-sdk");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());

// Helper to recursively retrieve code files and README from a GitHub repository
async function getRepoFiles(owner, repo) {
  try {
    // 1. Get repository info to get default branch
    const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const defaultBranch = repoInfo.data.default_branch || "main";

    // 2. Fetch the recursive tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeResponse = await axios.get(treeUrl);

    if (treeResponse.data && Array.isArray(treeResponse.data.tree)) {
      const allowedExtensions = [
        "js", "jsx", "ts", "tsx", "java", "py", "cpp", "c", "cs", "go", "rs", "php", "rb", "html", "css"
      ];
      const ignoredDirs = [
        "node_modules", "dist", "build", ".git", "coverage", ".next",
        "target", "bin", "obj", ".idea", ".vscode", "venv", ".venv"
      ];

      const allFiles = treeResponse.data.tree.filter(item => {
        if (item.type !== "blob") return false;
        
        const parts = item.path.split("/");
        // Check if any part of the path is in the ignored directories
        const isIgnored = parts.some(part => ignoredDirs.includes(part));
        if (isIgnored) return false;

        const ext = item.path.split(".").pop().toLowerCase();
        return allowedExtensions.includes(ext);
      });

      // Find README
      const readmeFile = treeResponse.data.tree.find(item => {
        if (item.type !== "blob") return false;
        const name = item.path.split("/").pop().toLowerCase();
        return name.includes("readme");
      });

      let readme = null;
      if (readmeFile) {
        readme = {
          path: readmeFile.path,
          download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${readmeFile.path}`
        };
      }

      const codeFiles = allFiles.map(item => ({
        path: item.path,
        download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`
      }));

      return { codeFiles, readme, defaultBranch };
    }
  } catch (error) {
    console.error("Error fetching repository tree from API:", error.message);
  }

  // Fallback to original contents API if Trees API fails or repo is empty
  console.log("Falling back to contents API...");
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`);
    if (Array.isArray(response.data)) {
      const allowedExtensions = ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "php", "rb"];
      const codeFiles = response.data
        .filter(item => {
          if (item.type !== "file") return false;
          const ext = item.name.split(".").pop().toLowerCase();
          return allowedExtensions.includes(ext);
        })
        .map(item => ({
          path: item.path,
          download_url: item.download_url
        }));

      const readmeFile = response.data.find(item => item.name.toLowerCase().includes("readme"));
      let readme = null;
      if (readmeFile) {
        readme = {
          path: readmeFile.path,
          download_url: readmeFile.download_url
        };
      }

      return { codeFiles, readme, defaultBranch: "main" };
    }
  } catch (err) {
    console.error("Fallback contents API failed:", err.message);
  }

  return { codeFiles: [], readme: null, defaultBranch: "main" };
}

// Helper to select priority files and download their content up to limits
async function selectAndDownloadFiles(codeFiles, maxFiles = 8, charLimit = 25000) {
  const priorityFiles = [];
  const secondaryFiles = [];

  const ignoredKeywords = ["test", "spec", "config", "eslint", "prettier", "tsconfig", "webpack", "babel", "vite", "setup", "reportwebvitals"];

  for (const file of codeFiles) {
    const nameLower = file.path.toLowerCase();
    const isIgnoredKeyword = ignoredKeywords.some(keyword => nameLower.includes(keyword));
    
    // Check if the file is in a source-like directory
    const isSrcDir = nameLower.startsWith("src/") || 
                     nameLower.startsWith("app/") || 
                     nameLower.startsWith("lib/") || 
                     nameLower.startsWith("backend/") || 
                     nameLower.includes("/src/") ||
                     nameLower.includes("/app/") ||
                     nameLower.includes("/lib/");

    if (!isIgnoredKeyword && isSrcDir) {
      priorityFiles.push(file);
    } else if (!isIgnoredKeyword) {
      secondaryFiles.push(file);
    } else {
      secondaryFiles.push(file);
    }
  }

  const orderedFiles = [...priorityFiles, ...secondaryFiles];
  const selectedFiles = orderedFiles.slice(0, maxFiles);

  let mergedContent = "";
  const downloadedPaths = [];

  for (const file of selectedFiles) {
    try {
      const response = await axios.get(file.download_url);
      const fileData = typeof response.data === "string" 
        ? response.data 
        : JSON.stringify(response.data);

      const formattedFile = `\n\n===== ${file.path} =====\n${fileData}`;
      
      if (mergedContent.length + formattedFile.length > charLimit) {
        const remainingSpace = charLimit - mergedContent.length;
        if (remainingSpace > 1000) {
          mergedContent += `\n\n===== ${file.path} =====\n${fileData.substring(0, remainingSpace - 100)}... [truncated]`;
          downloadedPaths.push(file.path);
        }
        break;
      }

      mergedContent += formattedFile;
      downloadedPaths.push(file.path);
    } catch (error) {
      console.error(`Failed to download ${file.path}:`, error.message);
    }
  }

  return { mergedContent, downloadedPaths };
}

function getGrade(percentage) {
  if (percentage >= 97) return "Outstanding";
  if (percentage >= 90) return "Excellent";
  if (percentage >= 80) return "Good";
  if (percentage >= 70) return "Satisfactory";
  if (percentage >= 60) return "Needs Improvement";
  return "Poor";
}

app.post("/evaluate", async (req, res) => {
  try {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        error: "GitHub URL is required.",
      });
    }

    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: "Invalid GitHub repository URL format. Please enter a valid URL.",
      });
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    console.log(`Evaluating repository: ${owner}/${repo}`);

    const { codeFiles, readme } = await getRepoFiles(owner, repo);

    if (codeFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No supported code files found in the repository (supported extensions: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .cs, .go, .rs, .html, .css, .php, .rb).",
      });
    }

    let readmeContent = {
      data: "No README found"
    };

    if (readme) {
      try {
        readmeContent = await axios.get(readme.download_url);
      } catch (err) {
        console.error(`Failed to load README from ${readme.download_url}:`, err.message);
      }
    }

    const { mergedContent, downloadedPaths } = await selectAndDownloadFiles(codeFiles, 8, 25000);

    const prompt = `
You are an automated assignment evaluator. You are grading a student's GitHub repository.

Assignment Title:
${req.body.title || "Untitled Assignment"}

Assignment Description:
${req.body.description || "No description provided"}

Instructor's Evaluation Rubric:
${req.body.rubric || "Evaluate based on general programming best practices, correctness, and code quality."}

README Content:
${readmeContent.data}

Source Code Context:
${mergedContent}

---
TASK:
Evaluate the repository against the Instructor's Evaluation Rubric.

1. Rubric Breakdown: Evaluate each specific criterion defined in the Instructor's Evaluation Rubric. For each criterion found, provide:
   - "criterion": The name of the criterion.
   - "awardedMarks": The marks awarded for this criterion (must be a number).
   - "maximumMarks": The maximum marks possible for this criterion (must be a number). If the rubric does not define specific maximum marks or weights, split the marks across the criteria so they sum up to 100.
   - "feedback": A brief explanation of how that score was determined.

   If the rubric does not define specific criteria, use the following default criteria and maximum marks:
   - "Correctness" (maximumMarks: 25)
   - "Code Quality" (maximumMarks: 25)
   - "Documentation" (maximumMarks: 25)
   - "Edge Cases" (maximumMarks: 25)

2. Strengths: List key positive aspects of the code.
3. Weaknesses: List areas that need improvement.
4. Suggestions: Provide actionable improvement steps.

You MUST return ONLY a valid JSON object matching this structure:
{
  "rubricBreakdown": [
    {
      "criterion": "Criterion Name 1",
      "awardedMarks": 14,
      "maximumMarks": 15,
      "feedback": "Feedback for Criterion 1..."
    },
    {
      "criterion": "Criterion Name 2",
      "awardedMarks": 19,
      "maximumMarks": 20,
      "feedback": "Feedback for Criterion 2..."
    }
  ],
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2"
  ],
  "suggestions": [
    "suggestion 1",
    "suggestion 2"
  ]
}

CRITICAL RULES:
1. Do NOT calculate or return overallScore, percentage, or grade in your JSON response. These are computed on the backend.
2. Do not use markdown wrappers like \`\`\`json or \`\`\` in your response.
3. Return ONLY the JSON object. Do not include any conversational preamble or postscript.
4. Every field ("rubricBreakdown", "strengths", "weaknesses", "suggestions") MUST be present in the returned JSON object.
5. Empty lists must be represented as empty arrays [], never as missing or null fields.
`;

    console.log("Sending evaluation request to Groq...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const aiText = completion.choices[0].message.content;

    // Extract JSON block using regex
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response.");
    }

    let rawReport;
    try {
      rawReport = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error(`Failed to parse extracted JSON: ${parseError.message}`);
    }

    // Normalize and extract rubricBreakdown array safely
    let rubricBreakdown = [];
    if (Array.isArray(rawReport.rubricBreakdown)) {
      rubricBreakdown = rawReport.rubricBreakdown.map(item => ({
        criterion: item.criterion || "Unnamed Criterion",
        awardedMarks: typeof item.awardedMarks === "number" ? item.awardedMarks : (parseFloat(item.awardedMarks) || 0),
        maximumMarks: typeof item.maximumMarks === "number" ? item.maximumMarks : (parseFloat(item.maximumMarks) || 10),
        feedback: item.feedback || ""
      }));
    } else if (rawReport.rubricBreakdown && typeof rawReport.rubricBreakdown === "object") {
      // Fallback: convert old object format to new array format
      rubricBreakdown = Object.entries(rawReport.rubricBreakdown).map(([criterion, feedbackVal]) => {
        const feedbackStr = typeof feedbackVal === "string" ? feedbackVal : JSON.stringify(feedbackVal);
        const scoreMatch = feedbackStr.match(/^(\d+)\s*\/\s*(\d+)/);
        let awarded = 0;
        let max = 10;
        let feedback = feedbackStr;
        if (scoreMatch) {
          awarded = parseInt(scoreMatch[1], 10);
          max = parseInt(scoreMatch[2], 10);
          feedback = feedbackStr.substring(scoreMatch[0].length).replace(/^[:\s-]+/, "");
        }
        return {
          criterion,
          awardedMarks: awarded,
          maximumMarks: max,
          feedback
        };
      });
    } else {
      rubricBreakdown = [
        {
          criterion: "General Evaluation",
          awardedMarks: 0,
          maximumMarks: 100,
          feedback: "Evaluation complete. Rubric breakdown was not structured as expected."
        }
      ];
    }

    // Deterministic Score Calculations
    const totalMarks = rubricBreakdown.reduce((sum, item) => sum + (Number(item.awardedMarks) || 0), 0);
    const maximumMarks = rubricBreakdown.reduce((sum, item) => sum + (Number(item.maximumMarks) || 0), 0);
    const percentage = maximumMarks > 0 ? Math.round((totalMarks / maximumMarks) * 100) : 0;
    const overallScore = parseFloat((percentage / 10).toFixed(1));
    const grade = getGrade(percentage);

    // Validation
    const sumAwarded = rubricBreakdown.reduce((sum, item) => sum + (Number(item.awardedMarks) || 0), 0);
    const isSumValid = sumAwarded === totalMarks;
    const isPercentageValid = Math.abs(percentage - (totalMarks / maximumMarks * 100)) <= 0.5;
    const isOverallScoreValid = Math.abs(overallScore - (percentage / 10)) < 1e-9;

    if (!isSumValid || !isPercentageValid || !isOverallScoreValid) {
      console.error("Score validation check failed/discrepancy detected:", {
        isSumValid,
        isPercentageValid,
        isOverallScoreValid,
        computed: { totalMarks, maximumMarks, percentage, overallScore },
        expectedPercentage: totalMarks / maximumMarks * 100,
        expectedOverallScore: percentage / 10
      });
    }

    const sanitizedReport = {
      overallScore,
      totalMarks,
      maximumMarks,
      percentage,
      grade,
      rubricBreakdown,
      strengths: Array.isArray(rawReport.strengths) ? rawReport.strengths : [],
      weaknesses: Array.isArray(rawReport.weaknesses) ? rawReport.weaknesses : [],
      suggestions: Array.isArray(rawReport.suggestions) ? rawReport.suggestions : []
    };

    // Logging
    console.log("=== EVALUATION PIPELINE LOGS ===");
    console.log(`- Number of scanned files: ${codeFiles.length}`);
    console.log(`- Number of files selected: ${downloadedPaths.length}`);
    console.log(`- Filenames selected:`, downloadedPaths);
    console.log("--------------------------------");
    console.log(`Computed Total: ${totalMarks}`);
    console.log(`Maximum: ${maximumMarks}`);
    console.log(`Percentage: ${percentage}%`);
    console.log(`Overall Score: ${overallScore}`);
    console.log(`Grade: ${grade}`);
    console.log("================================");

    res.json({
      success: true,
      report: sanitizedReport,
    });
  } catch (error) {
    console.error("Evaluation pipeline error:", error);

    let errorMsg = "Something went wrong while evaluating the repository.";
    if (error.message && (error.message.includes("503") || error.message.includes("429") || error.message.includes("quota"))) {
      errorMsg = "API quota exceeded or busy. Please wait a minute and try again.";
    } else if (error.response && error.response.status === 404) {
      errorMsg = "GitHub repository not found or is private. Make sure it is public.";
    }

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});