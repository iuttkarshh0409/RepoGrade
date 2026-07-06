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

app.post("/evaluate", async (req, res) => {
  try {
    const { githubUrl } = req.body;

    const parts = githubUrl.split("/");

    const owner = parts[3];
    const repo = parts[4];

    const githubApi =
      `https://api.github.com/repos/${owner}/${repo}/contents`;

    const response = await axios.get(githubApi);

    console.log("ROOT CONTENTS:");
console.log(response.data);

    const codeFiles = response.data.filter(
  (file) =>
    file.type === "file" &&
    (
      file.name.endsWith(".js") ||
      file.name.endsWith(".java") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".cpp") ||
      file.name.endsWith(".c")
    )
);

console.log("CODE FILES:");
console.log(codeFiles);
    const readme = response.data.find(
  file => file.name.toLowerCase().includes("readme")

);

console.log("README FILE:");
console.log(readme);
let readmeContent = {
  data: "No README found"
};

if (readme) {
  readmeContent = await axios.get(
    readme.download_url
  );
}

console.log("README CONTENT:");
console.log(readmeContent.data);
let aiReport = "No code files found";
if (codeFiles.length > 0) {

  const firstFile = await axios.get(
    codeFiles[0].download_url
  );

  console.log("FIRST CODE FILE CONTENT:");
  console.log(firstFile.data);
  const prompt = `
Assignment Title:
${req.body.title}

Assignment Description:
${req.body.description}

Rubric:
${req.body.rubric}

README:
${readmeContent.data}

Code:
${firstFile.data}

Return ONLY valid JSON.

{
  "overallScore": 8,
  "grade": "Excellent",
  "rubricBreakdown": {
    "Correctness": "...",
    "Code Quality": "...",
    "Documentation": "...",
    "Edge Cases": "..."
  },
  "strengths": [
    "...",
    "...",
    "..."
  ],
  "weaknesses": [
    "...",
    "..."
  ],
  "suggestions": [
    "...",
    "...",
    "..."
  ]
}

Do not return markdown.
Do not use triple backticks.
Return only valid JSON.
`;
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
const cleanText = aiText
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

console.log("RAW AI RESPONSE:");
console.log(aiText);

aiReport = JSON.parse(cleanText);}

 res.json({
  success: true,
  report: aiReport,
});
  } catch (error) {
  console.error(error);

  if (
    error.message.includes("503") ||
    error.message.includes("429") ||
    error.message.includes("quota")
  ) {
    return res.status(429).json({
      success: false,
      error:
        "Gemini API is currently busy or you've reached the free quota. Please wait a minute and try again.",
    });
  }

  res.status(500).json({
    success: false,
    error: "Something went wrong while evaluating the repository.",
  });
}
  }
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});