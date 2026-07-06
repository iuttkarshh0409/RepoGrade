import { useState } from "react";
import axios from "axios";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rubric, setRubric] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState("");
  const overallScore = report?.overallScore ?? null;

const handleEvaluate = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/evaluate",
      {
        title,
        description,
        rubric,
        githubUrl,
      }
    );

    console.log(response.data);

    setMessage("✅ Evaluation Complete");
setReport(response.data.report);
  } catch (error) {
    console.error(error);

    setMessage("❌ Error Sending Data");
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#ffe4ec,#ffd6e8,#fff0f5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: "30px",
          padding: "40px",
          boxShadow: "0 20px 50px rgba(255,182,193,0.3)",
        }}
      >
        <h1
  style={{
    textAlign: "center",
    color: "#ff4f87",
    fontSize: "48px",
    marginBottom: "10px",
  }}
>
   RepoGrade
</h1>

<p
  style={{
    textAlign: "center",
    color: "#666",
    fontSize: "18px",
    marginBottom: "10px",
  }}
>
  AI-Powered GitHub Assignment Evaluator
</p>

<p
  style={{
    textAlign: "center",
    color: "#888",
    marginBottom: "35px",
  }}
>
  Evaluate repositories instantly with detailed feedback,
  rubric scoring, strengths, weaknesses and improvement suggestions.
</p>

        <input
  placeholder="Assignment Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  style={inputStyle}
/>

       <textarea
  placeholder="Assignment Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  style={textareaStyle}
/>

      <textarea
  placeholder="Evaluation Rubric"
  value={rubric}
  onChange={(e) => setRubric(e.target.value)}
  style={textareaStyle}
/>

       <input
  placeholder="GitHub Repository URL"
  value={githubUrl}
  onChange={(e) => setGithubUrl(e.target.value)}
  style={inputStyle}
/>
        <button
          onClick={handleEvaluate}
          style={{
            width: "100%",
            padding: "15px",
            border: "none",
            borderRadius: "15px",
            background:
              "linear-gradient(135deg,#ff6fa5,#ff9ec4)",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "15px",
          }}
        >
          🚀 Evaluate Repository
        </button>

        {message && (
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: "#ff4f87",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}
{report && (
  <div>

    <div
      style={{
        textAlign: "center",
        padding: "20px",
        background: "#fff7fb",
        borderRadius: "20px",
        marginBottom: "25px",
      }}
    >
      <h3
        style={{
          color: "#ff4f87",
          marginBottom: "10px",
        }}
      >
        📊 Overall Score
      </h3>

      <h1
        style={{
          fontSize: "56px",
          color: "#ff4f87",
          margin: 0,
        }}
      >
{overallScore !== null ? `${overallScore}/10` : "--"}      </h1>

      <p
        style={{
          color: "#888",
          fontWeight: "bold",
        }}
      >
        ⭐ {report.grade}
  
      </p>
    </div>

   <div
  style={{
    background: "#f8fff8",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
  }}
>
  <h3 style={{ color: "green" }}>
    ✅ Strengths
  </h3>

  <ul>
    {report.strengths.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
</div>

  </div>
)}

      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "15px",
  border: "2px solid #ffd1df",
  outline: "none",
  fontSize: "16px",
};

const textareaStyle = {
  width: "100%",
  height: "120px",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "15px",
  border: "2px solid #ffd1df",
  outline: "none",
  fontSize: "16px",
};

export default App;