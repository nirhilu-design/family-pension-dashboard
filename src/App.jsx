import React, { useMemo, useState } from "react";

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("self");

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newFiles = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      owner: selectedOwner,
      fileName: file.name,
      fileType: file.type || "unknown",
      fileSize: file.size,
      status: "uploaded",
      parsedData: null,
      uploadedAt: new Date().toLocaleString("he-IL"),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const buildDemoData = (owner, fileName) => {
    if (owner === "self") {
      return {
        personName: "מבוטח ראשי",
        provider: "הפניקס",
        productType: fileName.toLowerCase().includes("excel")
          ? "קרן השתלמות"
          : "קרן פנסיה",
        balance: 228400,
        monthlyDeposit: 2650,
        riskLevel: "בינוני",
      };
    }

    return {
      personName: "בן/בת זוג",
      provider: "מגדל",
      productType: fileName.toLowerCase().includes("excel")
        ? "קופת גמל"
        : "ביטוח מנהלים",
      balance: 171900,
      monthlyDeposit: 1980,
      riskLevel: "בינוני-גבוה",
    };
  };

  const handleSimulateAnalysis = (id) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, status: "processing" } : file
      )
    );

    setTimeout(() => {
      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.id !== id) return file;

          return {
            ...file,
            status: "parsed",
            parsedData: buildDemoData(file.owner, file.fileName),
          };
        })
      );
    }, 1200);
  };

  const familyReport = useMemo(() => {
    const parsed = uploadedFiles.filter((f) => f.parsedData);

    const selfItems = parsed.filter((f) => f.owner === "self");
    const spouseItems = parsed.filter((f) => f.owner === "spouse");

    const sumBalance = (items) =>
      items.reduce((sum, item) => sum + (item.parsedData?.balance || 0), 0);

    const sumDeposit = (items) =>
      items.reduce((sum, item) => sum + (item.parsedData?.monthlyDeposit || 0), 0);

    const totalBalance = sumBalance(parsed);
    const totalMonthlyDeposit = sumDeposit(parsed);

    const insights = [];
    if (totalBalance > 0) {
      insights.push("נבנה בסיס ראשוני של תמונה פנסיונית משפחתית.");
    }
    if (selfItems.length > 0 && spouseItems.length === 0) {
      insights.push("כרגע קיימים נתונים רק עבור המבוטח הראשי.");
    }
    if (spouseItems.length > 0 && selfItems.length === 0) {
      insights.push("כרגע קיימים נתונים רק עבור בן/בת הזוג.");
    }
    if (selfItems.length > 0 && spouseItems.length > 0) {
      insights.push("קיימים נתונים לשני בני הזוג ואפשר להתקדם לדוח מאוחד.");
    }
    if (parsed.length >= 2) {
      insights.push("השלב הבא המומלץ: חיבור parsing אמיתי ל־Excel לפני PDF.");
    }

    return {
      totalFiles: uploadedFiles.length,
      parsedFiles: parsed.length,
      totalBalance,
      totalMonthlyDeposit,
      selfBalance: sumBalance(selfItems),
      spouseBalance: sumBalance(spouseItems),
      selfDeposit: sumDeposit(selfItems),
      spouseDeposit: sumDeposit(spouseItems),
      parsed,
      insights,
    };
  }, [uploadedFiles]);

  const getOwnerLabel = (owner) => (owner === "self" ? "שלי" : "בן/בת זוג");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "8px", color: "#0f172a" }}>
          דוח פנסיוני משפחתי מאוחד
        </h1>
        <p style={{ marginBottom: "28px", color: "#64748b" }}>
          העלאת מסמכים, שיוך לבני המשפחה, ניתוח דמה ותצוגת דוח מאוחד
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <Card title='סה"כ קבצים' value={familyReport.totalFiles} />
          <Card title="קבצים שנותחו" value={familyReport.parsedFiles} />
          <Card
            title="צבירה משפחתית"
            value={`${familyReport.totalBalance.toLocaleString("he-IL")} ₪`}
          />
          <Card
            title="הפקדה חודשית משפחתית"
            value={`${familyReport.totalMonthlyDeposit.toLocaleString("he-IL")} ₪`}
          />
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitle}>העלאת קבצים</h2>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "16px",
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
              accept=".json,.pdf,.xls,.xlsx"
              onChange={handleFileUpload}
              style={inputStyle}
            />
          </div>

          <p style={{ color: "#64748b", margin: 0 }}>
            זה דמו מוצרי: אחרי “ניתוח דמו” יוצג דוח משפחתי ראשוני.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div style={panelStyle}>
            <h2 style={panelTitle}>רשימת קבצים</h2>

            {uploadedFiles.length === 0 ? (
              <p style={{ color: "#64748b" }}>עדיין לא הועלו קבצים.</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
                          {file.fileName}
                        </h3>
                        <p style={lineStyle}>
                          <strong>שייך ל:</strong> {getOwnerLabel(file.owner)}
                        </p>
                        <p style={lineStyle}>
                          <strong>סטטוס:</strong>{" "}
                          {file.status === "uploaded"
                            ? "הועלה"
                            : file.status === "processing"
                            ? "בעיבוד"
                            : "נותח"}
                        </p>
                        <p style={lineStyle}>
                          <strong>הועלה ב:</strong> {file.uploadedAt}
                        </p>

                        {file.parsedData && (
                          <div
                            style={{
                              marginTop: "12px",
                              background: "#eef6ff",
                              border: "1px solid #bfdbfe",
                              padding: "12px",
                              borderRadius: "10px",
                            }}
                          >
                            <p style={lineStyle}>
                              <strong>מוצר:</strong> {file.parsedData.productType}
                            </p>
                            <p style={lineStyle}>
                              <strong>גוף מנהל:</strong> {file.parsedData.provider}
                            </p>
                            <p style={lineStyle}>
                              <strong>צבירה:</strong>{" "}
                              {file.parsedData.balance.toLocaleString("he-IL")} ₪
                            </p>
                            <p style={lineStyle}>
                              <strong>הפקדה חודשית:</strong>{" "}
                              {file.parsedData.monthlyDeposit.toLocaleString("he-IL")} ₪
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <button
                          onClick={() => handleSimulateAnalysis(file.id)}
                          disabled={file.status === "processing"}
                          style={{
                            ...primaryBtn,
                            opacity: file.status === "processing" ? 0.7 : 1,
                            cursor: file.status === "processing" ? "not-allowed" : "pointer",
                          }}
                        >
                          {file.status === "processing" ? "מעבד..." : "ניתוח דמו"}
                        </button>

                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          style={dangerBtn}
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <h2 style={panelTitle}>דוח משפחתי ראשוני</h2>

            {familyReport.parsedFiles === 0 ? (
              <p style={{ color: "#64748b" }}>
                עדיין אין נתונים מנותחים. העלה קבצים ולחץ על "ניתוח דמו".
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <MiniCard
                    title="צבירה שלי"
                    value={`${familyReport.selfBalance.toLocaleString("he-IL")} ₪`}
                  />
                  <MiniCard
                    title="צבירה בן/בת זוג"
                    value={`${familyReport.spouseBalance.toLocaleString("he-IL")} ₪`}
                  />
                  <MiniCard
                    title="הפקדה שלי"
                    value={`${familyReport.selfDeposit.toLocaleString("he-IL")} ₪`}
                  />
                  <MiniCard
                    title="הפקדה בן/בת זוג"
                    value={`${familyReport.spouseDeposit.toLocaleString("he-IL")} ₪`}
                  />
                </div>

                <h3 style={{ color: "#0f172a", marginBottom: "10px" }}>תובנות ראשוניות</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {familyReport.insights.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ color: "#64748b", fontWeight: "bold", marginBottom: "12px" }}>
        {title}
      </div>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function MiniCard({ title, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <div style={{ color: "#64748b", marginBottom: "8px", fontWeight: "bold" }}>
        {title}
      </div>
      <div style={{ color: "#0f172a", fontSize: "22px", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
  marginBottom: "28px",
};

const panelTitle = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#0f172a",
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

const lineStyle = {
  margin: "4px 0",
  color: "#334155",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "bold",
};

const dangerBtn = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: "bold",
  cursor: "pointer",
};