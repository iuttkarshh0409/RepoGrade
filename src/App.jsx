import { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rubric, setRubric] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(null);

  // UX Refactor States: "FORM", "LOADING", "REPORT"
  const [appState, setAppState] = useState("FORM");
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeMessage, setFadeMessage] = useState(true);
  const [displayMessage, setDisplayMessage] = useState("Fetching repository...");

  const titleInputRef = useRef(null);

  const progressMessages = [
    "Fetching repository...",
    "Reading README...",
    "Downloading source files...",
    "Inspecting project structure...",
    "Evaluating implementation...",
    "Applying rubric...",
    "Generating report..."
  ];

  // Rotate messages during LOADING state
  useEffect(() => {
    if (appState !== "LOADING") {
      setFadeMessage(true);
      setDisplayMessage(progressMessages[0]);
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setFadeMessage(false);
      setTimeout(() => {
        const nextIndex = (messageIndex + 1) % progressMessages.length;
        setMessageIndex(nextIndex);
        setDisplayMessage(progressMessages[nextIndex]);
        setFadeMessage(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, [appState, messageIndex]);

  const handleEvaluate = async () => {
    if (!githubUrl) {
      setMessage("❌ GitHub URL is required.");
      return;
    }

    setAppState("LOADING");
    setMessage("");
    setReport(null);

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
      if (response.data && response.data.success && response.data.report) {
        setReport(response.data.report);
        setAppState("REPORT");
      } else {
        throw new Error(response.data.error || "Failed to retrieve evaluation report.");
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || "Error Sending Data";
      setMessage(`❌ ${errMsg}`);
      setAppState("FORM");
    }
  };

  const handleReset = () => {
    setReport(null);
    setTitle("");
    setDescription("");
    setRubric("");
    setGithubUrl("");
    setMessage("");
    setAppState("FORM");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 8px 24px rgba(1,4,9,0.8)",
        }}
      >
        {appState === "FORM" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "15px" }}>
              <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" fill="#f0f6fc">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 01-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.1 1.02.01.66.01 1.29.01 1.48 0 .21-.15.48-.55.38A7.995 7.995 0 010 8c0-4.42 3.58-8 8-8z"></path>
              </svg>
              <h1
                style={{
                  color: "#f0f6fc",
                  fontSize: "36px",
                  margin: 0,
                  fontWeight: "600",
                  letterSpacing: "-0.5px"
                }}
              >
                RepoGrade
              </h1>
            </div>

            <p
              style={{
                textAlign: "center",
                color: "#c9d1d9",
                fontSize: "18px",
                marginBottom: "8px",
                fontWeight: "400"
              }}
            >
              AI-Powered GitHub Assignment Evaluator
            </p>

            <p
              style={{
                textAlign: "center",
                color: "#8b949e",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "30px",
              }}
            >
              Evaluate repositories instantly with detailed feedback,
              rubric scoring, strengths, weaknesses, and improvement suggestions.
            </p>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label htmlFor="title-input" style={{ display: "block", color: "#c9d1d9", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
                Assignment Title
              </label>
              <input
                id="title-input"
                ref={titleInputRef}
                placeholder="e.g. React Todo App"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="gh-input"
              />
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label htmlFor="description-input" style={{ display: "block", color: "#c9d1d9", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
                Assignment Description
              </label>
              <textarea
                id="description-input"
                placeholder="Describe the task instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="gh-input"
                style={{ height: "120px", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label htmlFor="rubric-input" style={{ display: "block", color: "#c9d1d9", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
                Evaluation Rubric
              </label>
              <textarea
                id="rubric-input"
                placeholder="e.g. Correctness: 40%, Code Quality: 30%, Documentation: 20%, Edge Cases: 10%"
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                className="gh-input"
                style={{ height: "100px", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <label htmlFor="github-url-input" style={{ display: "block", color: "#c9d1d9", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
                GitHub Repository URL
              </label>
              <input
                id="github-url-input"
                placeholder="e.g. https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="gh-input"
              />
            </div>

            <button
              id="evaluate-button"
              onClick={handleEvaluate}
              className="gh-btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "600" }}
            >
              🚀 Evaluate Repository
            </button>

            {message && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  borderRadius: "6px",
                  background: "rgba(248, 81, 73, 0.1)",
                  border: "1px solid rgba(248, 81, 73, 0.4)",
                  textAlign: "center",
                  color: "#f85149",
                  fontWeight: "bold",
                  fontSize: "14px"
                }}
              >
                {message}
              </div>
            )}
          </div>
        )}

        {appState === "LOADING" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 10px" }}>
            <svg className="float-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px" }}>
              <path d="M6 3v12" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
              <circle cx="9" cy="9" r="3" />
            </svg>
            
            <div className="spin-loader" style={{ marginBottom: "25px" }}></div>
            
            <h2 style={{ color: "#f0f6fc", fontSize: "28px", fontWeight: "600", marginBottom: "12px", letterSpacing: "-0.5px" }}>
              Analyzing Repository
            </h2>
            
            <p style={{
              color: "#8b949e",
              fontSize: "16px",
              fontWeight: "500",
              minHeight: "24px",
              opacity: fadeMessage ? 1 : 0,
              transform: fadeMessage ? "translateY(0)" : "translateY(5px)",
              transition: "all 0.3s ease",
              textAlign: "center"
            }}>
              {displayMessage}
            </p>
          </div>
        )}

        {appState === "REPORT" && report && (
          <div className="fade-in">
            {/* Header: Score & Grade */}
            <div
              style={{
                textAlign: "center",
                padding: "30px 25px",
                background: "#0d1117",
                borderRadius: "6px",
                marginBottom: "35px",
                border: "1px solid #30363d",
                boxShadow: "inset 0 1px 0 rgba(1,4,9,0.075)"
              }}
            >
              <h3
                style={{
                  color: "#8b949e",
                  marginBottom: "10px",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: "600"
                }}
              >
                📊 Overall Score
              </h3>

              <h1
                style={{
                  fontSize: "64px",
                  color: "#58a6ff",
                  margin: "0 0 5px 0",
                  fontWeight: "700",
                  lineHeight: "1.1"
                }}
              >
                {report.totalMarks !== undefined && report.maximumMarks !== undefined 
                  ? `${report.totalMarks} / ${report.maximumMarks}` 
                  : "--"}
              </h1>

              <div
                style={{
                  fontSize: "20px",
                  color: "#c9d1d9",
                  fontWeight: "600",
                  marginBottom: "15px"
                }}
              >
                {report.percentage !== undefined ? `${report.percentage}%` : "--"}
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "6px 18px",
                  background: "#238636",
                  color: "white",
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "1px solid rgba(240,246,252,0.1)"
                }}
              >
                ⭐ {report.grade}
              </div>
            </div>

            {/* Rubric Breakdown */}
            {report.rubricBreakdown && (
              <div style={{ marginBottom: "35px" }}>
                <h3 style={{ color: "#f0f6fc", marginBottom: "18px", fontSize: "18px", borderBottom: "1px solid #30363d", paddingBottom: "8px", fontWeight: "600", textAlign: "left" }}>
                  📋 Rubric Breakdown
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
                  {Array.isArray(report.rubricBreakdown) ? (
                    report.rubricBreakdown.map((item, index) => (
                      <div 
                        key={index} 
                        className="gh-card"
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <strong style={{ color: "#58a6ff", fontSize: "15px", fontWeight: "600", marginRight: "10px" }}>
                              {item.criterion}
                            </strong>
                            <span 
                              style={{ 
                                background: "#21262d", 
                                color: "#c9d1d9", 
                                border: "1px solid #30363d",
                                padding: "2px 8px", 
                                borderRadius: "12px", 
                                fontSize: "12px", 
                                fontWeight: "600",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {item.awardedMarks} / {item.maximumMarks}
                            </span>
                          </div>
                          <span style={{ fontSize: "13px", color: "#8b949e", lineHeight: "1.5", display: "block" }}>
                            {item.feedback}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    Object.entries(report.rubricBreakdown).map(([criterion, feedback]) => (
                      <div 
                        key={criterion} 
                        className="gh-card"
                      >
                        <strong style={{ color: "#58a6ff", display: "block", marginBottom: "6px", fontSize: "15px", fontWeight: "600" }}>
                          {criterion}
                        </strong>
                        <span style={{ fontSize: "13px", color: "#8b949e", lineHeight: "1.5", display: "block" }}>
                          {feedback}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Strengths */}
            {report.strengths && report.strengths.length > 0 && (
              <div className="gh-alert-success" style={{ marginBottom: "20px" }}>
                <h3 style={{ color: "#3fb950", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  ✅ Key Strengths
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#c9d1d9", fontSize: "14px", lineHeight: "1.6" }}>
                  {report.strengths.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {report.weaknesses && report.weaknesses.length > 0 && (
              <div className="gh-alert-danger" style={{ marginBottom: "20px" }}>
                <h3 style={{ color: "#f85149", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  ⚠️ Areas for Improvement
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#c9d1d9", fontSize: "14px", lineHeight: "1.6" }}>
                  {report.weaknesses.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions && report.suggestions.length > 0 && (
              <div className="gh-alert-info" style={{ marginBottom: "35px" }}>
                <h3 style={{ color: "#58a6ff", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  💡 Actionable Suggestions
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#c9d1d9", fontSize: "14px", lineHeight: "1.6" }}>
                  {report.suggestions.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reset Button */}
            <button
              id="reset-button"
              onClick={handleReset}
              className="gh-btn-secondary"
              style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "600" }}
            >
              🔄 Evaluate Another Repository
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "15px",
  border: "2px solid #ffd1df",
  outline: "none",
  fontSize: "16px",
  transition: "border-color 0.2s ease"
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: "120px",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "15px",
  border: "2px solid #ffd1df",
  outline: "none",
  fontSize: "16px",
  resize: "vertical",
  transition: "border-color 0.2s ease"
};

export default App;