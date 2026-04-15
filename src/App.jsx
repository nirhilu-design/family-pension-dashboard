import React, { useState } from "react";

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("self");

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    const newFiles = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      owner: selectedOwner, // self | spouse
      fileName: file.name,
      fileType: file.type || "unknown",
      fileSize: file.size,
      status: "uploaded", // uploaded | processing | parsed | error
      rawFile: file,
      parsedData: null,
      uploadedAt: new Date().toLocaleString("he-IL"),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // מאפשר לבחור שוב את אותו קובץ
    event.target.value = "";
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleSimulateAnalysis = (id) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, status: "processing" } : file
      )
    );

    setTimeout(() => {
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === id
            ? {
                ...file,
                status: "parsed",
                parsedData: {
                  provider: "הראל",
                  productType: "קרן פנסיה",
                  balance: 125000,
                  monthlyDeposit: 2400,
                },
              }
            : file
        )
      );
    }, 1500);
  };

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

  const totalFiles = uploadedFiles.length;
  const selfFiles = uploadedFiles.filter((file) => file.owner === "self").length;
  const spouseFiles = uploadedFiles.filter((file) => file.owner === "spouse").length;
  const parsedFiles = uploadedFiles.filter((file) => file.status === "parsed").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#1f2937" }}>
          דשבורד פנסיוני משפחתי
        </h1>

        <p style={{ marginBottom: "30px", color: "#6b7280" }}>
          העלאת מסמכים פנסיוניים, שיוך לבני המשפחה והכנה לניתוח אוטומטי
        </p>

        {/* אזור תקציר */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>סה״כ קבצים</h3>
            <p style={cardValueStyle}>{totalFiles}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>קבצים שלי</h3>
            <p style={cardValueStyle}>{selfFiles}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>קבצי בן/בת זוג</h3>
            <p style={cardValueStyle}>{spouseFiles}</p>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>קבצים שנותחו</h3>
            <p style={cardValueStyle}>{parsedFiles}</p>
          </div>
        </div>

        {/* אזור העלאה */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#111827" }}>העלאת קבצים</h2>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <label style={{ fontWeight: "bold", color: "#374151" }}>
              הקבצים שייכים ל:
            </label>

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#fff",
                minWidth: "180px",
              }}
            >
              <option value="self">שלי</option>
              <option value="spouse">בן/בת זוג</option>
            </select>

            <input
              type="file"
              multiple
              accept=".json,.pdf,.xls,.xlsx"
              onChange={handleFileUpload}
              style={{
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
              }}
            />
          </div>

          <p style={{ color: "#6b7280", marginBottom: 0 }}>
            כרגע המערכת שומרת את הקבצים ומדמה ניתוח. בשלב הבא נחבר backend
            לניתוח אמיתי של PDF / Excel.
          </p>
        </div>

        {/* רשימת קבצים */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#111827" }}>רשימת קבצים</h2>

          {uploadedFiles.length === 0 ? (
            <p style={{ color: "#6b7280" }}>עדיין לא הועלו קבצים.</p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "18px",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          color: "#111827",
                          fontSize: "18px",
                        }}
                      >
                        {file.fileName}
                      </h3>

                      <p style={infoLineStyle}>
                        <strong>שייך ל:</strong> {getOwnerLabel(file.owner)}
                      </p>
                      <p style={infoLineStyle}>
                        <strong>סוג קובץ:</strong> {file.fileType}
                      </p>
                      <p style={infoLineStyle}>
                        <strong>גודל:</strong>{" "}
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <p style={infoLineStyle}>
                        <strong>הועלה ב:</strong> {file.uploadedAt}
                      </p>
                      <p style={infoLineStyle}>
                        <strong>סטטוס:</strong> {getStatusLabel(file.status)}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        minWidth: "160px",
                      }}
                    >
                      <button
                        onClick={() => handleSimulateAnalysis(file.id)}
                        disabled={file.status === "processing"}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background:
                            file.status === "processing" ? "#9ca3af" : "#2563eb",
                          color: "#fff",
                          cursor:
                            file.status === "processing" ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {file.status === "processing"
                          ? "מעבד..."
                          : "ניתוח לדוגמה"}
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #ef4444",
                          background: "#fff",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        מחק קובץ
                      </button>
                    </div>
                  </div>

                  {file.parsedData && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "14px",
                        background: "#eef6ff",
                        borderRadius: "12px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <h4 style={{ marginTop: 0, color: "#1d4ed8" }}>
                        נתונים שנותחו (דמו)
                      </h4>

                      <p style={infoLineStyle}>
                        <strong>גוף מנהל:</strong> {file.parsedData.provider}
                      </p>
                      <p style={infoLineStyle}>
                        <strong>סוג מוצר:</strong> {file.parsedData.productType}
                      </p>
                      <p style={infoLineStyle}>
                        <strong>צבירה:</strong>{" "}
                        {file.parsedData.balance.toLocaleString("he-IL")} ₪
                      </p>
                      <p style={infoLineStyle}>
                        <strong>הפקדה חודשית:</strong>{" "}
                        {file.parsedData.monthlyDeposit.toLocaleString("he-IL")} ₪
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const cardTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "15px",
  color: "#6b7280",
};

const cardValueStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "bold",
  color: "#111827",
};

const infoLineStyle = {
  margin: "4px 0",
  color: "#374151",
};