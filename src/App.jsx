import { useState } from "react";
import axios from "axios";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rubric, setRubric] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const overallScore = report?.overallScore ?? null;

  const handleEvaluate = async () => {
    setLoading(true);
    setMessage("⏳ Evaluating repository... This may take up to a minute.");
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
      setMessage("✅ Evaluation Complete");
      setReport(response.data.report);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || "Error Sending Data";
      setMessage(`❌ ${errMsg}`);
    } finally {
      setLoading(false);
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
          placeholder="Assignment Title (e.g. React Todo App)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />

        <textarea
          placeholder="Assignment Description (Describe the task instructions...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={textareaStyle}
          disabled={loading}
        />

        <textarea
          placeholder="Evaluation Rubric (e.g. Correctness: 40%, Code Quality: 30%, Documentation: 20%, Edge Cases: 10%)"
          value={rubric}
          onChange={(e) => setRubric(e.target.value)}
          style={textareaStyle}
          disabled={loading}
        />

        <input
          placeholder="GitHub Repository URL (e.g. https://github.com/owner/repo)"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />

        <button
          onClick={handleEvaluate}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            borderRadius: "15px",
            background: loading 
              ? "#cccccc"
              : "linear-gradient(135deg,#ff6fa5,#ff9ec4)",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "15px",
            boxShadow: loading ? "none" : "0 8px 20px rgba(255,111,165,0.3)",
            transition: "all 0.2s ease"
          }}
        >
          {loading ? "⏳ Evaluating Repository..." : "🚀 Evaluate Repository"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              borderRadius: "12px",
              background: message.startsWith("❌") ? "#fff5f5" : message.startsWith("⏳") ? "#fffaf0" : "#f0fff4",
              border: message.startsWith("❌") ? "1px solid #fed7d7" : message.startsWith("⏳") ? "1px solid #feebc8" : "1px solid #c6f6d5",
              textAlign: "center",
              color: message.startsWith("❌") ? "#c53030" : message.startsWith("⏳") ? "#dd6b20" : "#22543d",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}

        {report && (
          <div style={{ marginTop: "40px" }}>
            
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
                  marginBottom: "20px",
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