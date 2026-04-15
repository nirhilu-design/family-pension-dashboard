import React from "react";

export default function UploadPage({
  selectedOwner,
  setSelectedOwner,
  uploadedFiles,
  uploadSummary,
  onFileUpload,
  onDeleteFile,
  onAnalyzeFiles,
  isAnalyzing,
}) {
  const getOwnerLabel = (owner) => {
    if (owner === "self") return "שלי";
    if (owner === "spouse") return "בן/בת זוג";
    return "לא ידוע";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "uploaded":
        return "הועלה";
      case "processing":
        return "בעיבוד";
      case "parsed":
        return "נותח";
      case "error":
        return "שגיאה";
      default:
        return "לא ידוע";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f6fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h1 style={{ color: "#0f172a", marginBottom: "10px" }}>
          דוח פנסיוני משפחתי מאוחד
        </h1>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>
          העלאת דוחות PDF, שיוך לבני זוג, ניתוח מסמכים ומעבר לדוח משפחתי מסכם
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <SummaryCard title='סה"כ קבצים' value={uploadSummary.totalFiles} />
          <SummaryCard title="קבצים שלי" value={uploadSummary.selfFiles} />
          <SummaryCard
            title="קבצי בן/בת זוג"
            value={uploadSummary.spouseFiles}
          />
          <SummaryCard title="קבצים שנותחו" value={uploadSummary.parsedFiles} />
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitle}>העלאת קבצי PDF</h2>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <label style={{ fontWeight: "bold", color: "#334155" }}>
              הקבצים שייכים ל:
            </label>

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              style={selectStyle}
            >
              <option value="self">שלי</option>
              <option value="spouse">בן/בת זוג</option>
            </select>

            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={onFileUpload}
              style={inputStyle}
            />
          </div>

          <p style={{ color: "#64748b", marginBottom: "18px" }}>
            כרגע העלאה תומכת רק ב־PDF. כל זוג קבצים נשמר תחת משפחה אחת, ובהמשך
            parser אמיתי יחזיר שמות מתוך המסמכים עצמם.
          </p>

          <button
            onClick={onAnalyzeFiles}
            disabled={!uploadedFiles.length || isAnalyzing}
            style={{
              ...primaryButton,
              opacity: !uploadedFiles.length || isAnalyzing ? 0.7 : 1,
              cursor:
                !uploadedFiles.length || isAnalyzing ? "not-allowed" : "pointer",
            }}
          >
            {isAnalyzing ? "מנתח מסמכים..." : "המשך לניתוח והפקת דוח"}
          </button>
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitle}>רשימת קבצים</h2>

          {uploadedFiles.length === 0 ? (
            <p style={{ color: "#64748b" }}>עדיין לא הועלו קבצי PDF.</p>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "18px",
                          color: "#0f172a",
                        }}
                      >
                        {file.fileName}
                      </h3>

                      <p style={lineStyle}>
                        <strong>שייך ל:</strong> {getOwnerLabel(file.owner)}
                      </p>
                      <p style={lineStyle}>
                        <strong>סוג:</strong> PDF
                      </p>
                      <p style={lineStyle}>
                        <strong>גודל:</strong>{" "}
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <p style={lineStyle}>
                        <strong>סטטוס:</strong> {getStatusLabel(file.status)}
                      </p>
                      <p style={lineStyle}>
                        <strong>הועלה ב:</strong> {file.uploadedAt}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <button
                        onClick={() => onDeleteFile(file.id)}
                        disabled={isAnalyzing}
                        style={{
                          ...dangerButton,
                          opacity: isAnalyzing ? 0.7 : 1,
                          cursor: isAnalyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        מחק קובץ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ color: "#64748b", fontWeight: "bold", marginBottom: "12px" }}>
        {title}
      </div>
      <div style={{ fontSize: "34px", fontWeight: "bold", color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

const panelStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
  marginBottom: "28px",
};

const panelTitle = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#0f172a",
  fontSize: "22px",
};

const inputStyle = {
  padding: "10px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#fff",
};

const selectStyle = {
  padding: "10px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#fff",
  minWidth: "170px",
};

const primaryButton = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "15px",
};

const dangerButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: "bold",
};

const lineStyle = {
  margin: "4px 0",
  color: "#334155",
};