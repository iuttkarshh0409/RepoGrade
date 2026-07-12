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
        background:
          "linear-gradient(135deg,#ffe4ec,#ffd6e8,#fff0f5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          borderRadius: "30px",
          padding: "40px",
          boxShadow: "0 20px 50px rgba(255,182,193,0.3)",
        }}
      >
        {appState === "FORM" && (
          <div className="fade-in">
            <h1
              style={{
                textAlign: "center",
                color: "#ff4f87",
                fontSize: "48px",
                marginBottom: "10px",
                fontWeight: "800",
                letterSpacing: "-1px"
              }}
            >
              RepoGrade
            </h1>

            <p
              style={{
                textAlign: "center",
                color: "#555",
                fontSize: "18px",
                marginBottom: "10px",
                fontWeight: "500"
              }}
            >
              AI-Powered GitHub Assignment Evaluator
            </p>

            <p
              style={{
                textAlign: "center",
                color: "#777",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "35px",
              }}
            >
              Evaluate repositories instantly with detailed feedback,
              rubric scoring, strengths, weaknesses and improvement suggestions.
            </p>

            <input
              ref={titleInputRef}
              placeholder="Assignment Title (e.g. React Todo App)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Assignment Description (Describe the task instructions...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textareaStyle}
            />

            <textarea
              placeholder="Evaluation Rubric (e.g. Correctness: 40%, Code Quality: 30%, Documentation: 20%, Edge Cases: 10%)"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              style={textareaStyle}
            />

            <input
              placeholder="GitHub Repository URL (e.g. https://github.com/owner/repo)"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={handleEvaluate}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "15px",
                background: "linear-gradient(135deg,#ff6fa5,#ff9ec4)",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "15px",
                boxShadow: "0 8px 20px rgba(255,111,165,0.3)",
                transition: "all 0.2s ease"
              }}
            >
              🚀 Evaluate Repository
            </button>

            {message && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "#fff5f5",
                  border: "1px solid #fed7d7",
                  textAlign: "center",
                  color: "#c53030",
                  fontWeight: "bold",
                }}
              >
                {message}
              </div>
            )}
          </div>
        )}

        {appState === "LOADING" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 10px" }}>
            <svg className="float-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4f87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px" }}>
              <path d="M6 3v12" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
              <circle cx="9" cy="9" r="3" />
            </svg>
            
            <div className="spin-loader" style={{ marginBottom: "25px" }}></div>
            
            <h2 style={{ color: "#ff4f87", fontSize: "28px", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.5px" }}>
              Analyzing Repository
            </h2>
            
            <p style={{
              color: "#666",
              fontSize: "16px",
              fontWeight: "600",
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
                background: "linear-gradient(135deg, #fff7fb, #ffeef5)",
                borderRadius: "25px",
                marginBottom: "35px",
                border: "1px solid #ffd1df",
                boxShadow: "0 6px 20px rgba(255,182,193,0.2)"
              }}
            >
              <h3
                style={{
                  color: "#ff4f87",
                  marginBottom: "10px",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: "700"
                }}
              >
                📊 Overall Score
              </h3>

              <h1
                style={{
                  fontSize: "72px",
                  color: "#ff4f87",
                  margin: "0 0 5px 0",
                  fontWeight: "900",
                  lineHeight: "1.1"
                }}
              >
                {report.totalMarks !== undefined && report.maximumMarks !== undefined 
                  ? `${report.totalMarks} / ${report.maximumMarks}` 
                  : "--"}
              </h1>

              <div
                style={{
                  fontSize: "24px",
                  color: "#ff4f87",
                  fontWeight: "700",
                  marginBottom: "15px"
                }}
              >
                {report.percentage !== undefined ? `${report.percentage}%` : "--"}
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "8px 22px",
                  background: "linear-gradient(135deg, #ff4f87, #ff6fa5)",
                  color: "white",
                  borderRadius: "25px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  boxShadow: "0 4px 10px rgba(255,79,135,0.3)"
                }}
              >
                ⭐ {report.grade}
              </div>
            </div>

            {/* Rubric Breakdown */}
            {report.rubricBreakdown && (
              <div style={{ marginBottom: "35px" }}>
                <h3 style={{ color: "#ff4f87", marginBottom: "18px", fontSize: "20px", borderBottom: "2px solid #ffd1df", paddingBottom: "6px", fontWeight: "700" }}>
                  📋 Rubric Breakdown
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
                  {Array.isArray(report.rubricBreakdown) ? (
                    report.rubricBreakdown.map((item, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          background: "#fff", 
                          padding: "18px", 
                          borderRadius: "18px", 
                          border: "1px solid #ffd1df",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <strong style={{ color: "#ff4f87", fontSize: "16px", fontWeight: "700", marginRight: "10px" }}>
                              {item.criterion}
                            </strong>
                            <span 
                              style={{ 
                                background: "#ffeef5", 
                                color: "#ff4f87", 
                                padding: "3px 10px", 
                                borderRadius: "12px", 
                                fontSize: "13px", 
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {item.awardedMarks} / {item.maximumMarks}
                            </span>
                          </div>
                          <span style={{ fontSize: "14px", color: "#555", lineHeight: "1.5", display: "block" }}>
                            {item.feedback}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    Object.entries(report.rubricBreakdown).map(([criterion, feedback]) => (
                      <div 
                        key={criterion} 
                        style={{ 
                          background: "#fff", 
                          padding: "18px", 
                          borderRadius: "18px", 
                          border: "1px solid #ffd1df",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                        }}
                      >
                        <strong style={{ color: "#ff4f87", display: "block", marginBottom: "6px", fontSize: "16px", fontWeight: "700" }}>
                          {criterion}
                        </strong>
                        <span style={{ fontSize: "14px", color: "#555", lineHeight: "1.5", display: "block" }}>
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
              <div
                style={{
                  background: "#f6fff6",
                  padding: "20px",
                  borderRadius: "20px",
                  marginBottom: "20px",
                  border: "1px solid #c2ecc2"
                }}
              >
                <h3 style={{ color: "#22543d", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "18px" }}>
                  ✅ Key Strengths
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#2f6a4f", fontSize: "15px", lineHeight: "1.6" }}>
                  {report.strengths.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {report.weaknesses && report.weaknesses.length > 0 && (
              <div
                style={{
                  background: "#fff5f5",
                  padding: "20px",
                  borderRadius: "20px",
                  marginBottom: "20px",
                  border: "1px solid #fed7d7"
                }}
              >
                <h3 style={{ color: "#9b2c2c", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "18px" }}>
                  ⚠️ Areas for Improvement
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#9b2c2c", fontSize: "15px", lineHeight: "1.6" }}>
                  {report.weaknesses.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions && report.suggestions.length > 0 && (
              <div
                style={{
                  background: "#f0f7ff",
                  padding: "20px",
                  borderRadius: "20px",
                  marginBottom: "35px",
                  border: "1px solid #c3ddfd"
                }}
              >
                <h3 style={{ color: "#1a4b8c", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "18px" }}>
                  💡 Actionable Suggestions
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#1a4b8c", fontSize: "15px", lineHeight: "1.6" }}>
                  {report.suggestions.map((item, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "15px",
                background: "linear-gradient(135deg,#ff6fa5,#ff9ec4)",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(255,111,165,0.3)",
                transition: "all 0.2s ease"
              }}
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