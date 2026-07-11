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

// Helper function to recursively retrieve code files and README from a GitHub repository
async function getRepoFiles(owner, repo) {
  try {
    // 1. Get repository info to find the default branch
    const repoInfoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const defaultBranch = repoInfoResponse.data.default_branch || "main";

    // 2. Fetch the recursive git tree
    const treeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    
    if (treeResponse.data && Array.isArray(treeResponse.data.tree)) {
      const allowedExtensions = ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "php", "rb"];
      
      const codeFiles = treeResponse.data.tree
        .filter(item => {
          if (item.type !== "blob") return false;
          const parts = item.path.split("/");
          // Ignore files inside common dependency/build directories
          const isIgnored = parts.some(part => 
            ["node_modules", ".git", "dist", "build", "out", "target", "bin", "obj", ".idea", ".vscode"].includes(part)
          );
          if (isIgnored) return false;
          
          const ext = item.path.split(".").pop().toLowerCase();
          return allowedExtensions.includes(ext);
        })
        .map(item => ({
          name: item.path.split("/").pop(),
          path: item.path,
          download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`
        }));
      
      // Find README
      const readmeFile = treeResponse.data.tree.find(item => {
        if (item.type !== "blob") return false;
        const name = item.path.split("/").pop().toLowerCase();
        return name.includes("readme");
      });

      let readme = null;
      if (readmeFile) {
        readme = {
          name: readmeFile.path.split("/").pop(),
          path: readmeFile.path,
          download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${readmeFile.path}`
        };
      }

      return { codeFiles, readme };
    }
  } catch (error) {
    console.error("Error fetching repository tree:", error.message);
  }
  
  // Fallback to the original contents API logic if recursive tree fails
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
          name: item.name,
          path: item.path,
          download_url: item.download_url
        }));
      
      const readmeFile = response.data.find(item => item.name.toLowerCase().includes("readme"));
      
      return { codeFiles, readme: readmeFile };
    }
  } catch (err) {
    console.error("Fallback contents API failed:", err.message);
  }

  return { codeFiles: [], readme: null };
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

    console.log(`Found ${codeFiles.length} code files and ${readme ? "1" : "0"} README file.`);

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

    // Limit evaluation content size to avoid overloading LLM context
    const firstFile = await axios.get(codeFiles[0].download_url);
    const codeSnippet = typeof firstFile.data === "string" 
      ? firstFile.data.substring(0, 15000) 
      : JSON.stringify(firstFile.data).substring(0, 15000);

    const prompt = `
Assignment Title:
${req.body.title || "Untitled Assignment"}

Assignment Description:
${req.body.description || "No description provided"}

Rubric:
${req.body.rubric || "No specific rubric provided"}

README:
${readmeContent.data}

Code Sample from "${codeFiles[0].path}":
${codeSnippet}

Evaluate the repository and return a detailed response.
Return ONLY a valid JSON object matching this structure EXACTLY:
{
  "overallScore": 8,
  "grade": "Excellent",
  "rubricBreakdown": {
    "Correctness": "Brief explanation...",
    "Code Quality": "Brief explanation...",
    "Documentation": "Brief explanation...",
    "Edge Cases": "Brief explanation..."
  },
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

Do not include markdown markers like \`\`\`json or \`\`\`.
Do not return any conversational text outside of the JSON object.
Return ONLY valid JSON.
`;

    console.log("Sending prompt to Groq...");
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
    console.log("RAW AI RESPONSE RECEIVED.");

    // Extract JSON block using regex
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response.");
    }

    const rawReport = JSON.parse(jsonMatch[0]);

    // Sanitize and normalize report structure to guarantee contract safety for frontend
    const sanitizedReport = {
      overallScore: typeof rawReport.overallScore === "number" ? rawReport.overallScore : (parseFloat(rawReport.overallScore) || null),
      grade: rawReport.grade || "Evaluated",
      rubricBreakdown: {
        Correctness: rawReport.rubricBreakdown?.Correctness || rawReport.rubricBreakdown?.correctness || "No evaluation provided.",
        "Code Quality": rawReport.rubricBreakdown?.["Code Quality"] || rawReport.rubricBreakdown?.codeQuality || "No evaluation provided.",
        Documentation: rawReport.rubricBreakdown?.Documentation || rawReport.rubricBreakdown?.documentation || "No evaluation provided.",
        "Edge Cases": rawReport.rubricBreakdown?.["Edge Cases"] || rawReport.rubricBreakdown?.edgeCases || "No evaluation provided."
      },
      strengths: Array.isArray(rawReport.strengths) ? rawReport.strengths : [],
      weaknesses: Array.isArray(rawReport.weaknesses) ? rawReport.weaknesses : [],
      suggestions: Array.isArray(rawReport.suggestions) ? rawReport.suggestions : []
    };

    res.json({
      success: true,
      report: sanitizedReport,
    });
  } catch (error) {
    console.error("Evaluation error:", error);

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
}
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});