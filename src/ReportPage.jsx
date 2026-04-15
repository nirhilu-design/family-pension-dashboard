import React from "react";

export default function ReportPage({ reportData, onBack, onResetAll }) {
  const handleExportPdf = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .print-panel {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}
      </style>

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
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button onClick={onBack} style={secondaryButton}>
              חזרה למסך העלאה
            </button>

            <button onClick={onResetAll} style={dangerButton}>
              איפוס מלא
            </button>

            <button onClick={handleExportPdf} style={primaryButton}>
              ייצוא דוח ל־PDF
            </button>
          </div>

          <div className="print-panel" style={panelStyle}>
            <h1 style={{ marginTop: 0, color: "#0f172a", marginBottom: "10px" }}>
              דוח פנסיוני משפחתי מסכם
            </h1>

            <p style={{ color: "#64748b", marginBottom: "28px" }}>
              דוח משפחתי מאוחד על בסיס המסמכים שהועלו ונותחו
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <Card
                title="סה״כ קבצים"
                value={reportData.totals.totalFiles}
              />
              <Card
                title="קבצים שנותחו"
                value={reportData.totals.parsedFiles}
              />
              <Card
                title="צבירה משפחתית"
                value={`${reportData.totals.totalBalance.toLocaleString("he-IL")} ₪`}
              />
              <Card
                title="הפקדה חודשית"
                value={`${reportData.totals.totalMonthlyDeposit.toLocaleString("he-IL")} ₪`}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <MiniPanel>
                <h3 style={sectionHeading}>מבוטח ראשי</h3>
                <p style={lineStyle}>
                  <strong>שם:</strong> {reportData.members.self.fullName}
                </p>
                <p style={lineStyle}>
                  <strong>מספר מסמכים:</strong> {reportData.members.self.filesCount}
                </p>
                <p style={lineStyle}>
                  <strong>סה״כ צבירה:</strong>{" "}
                  {reportData.members.self.totalBalance.toLocaleString("he-IL")} ₪
                </p>
                <p style={lineStyle}>
                  <strong>הפקדה חודשית:</strong>{" "}
                  {reportData.members.self.totalMonthlyDeposit.toLocaleString("he-IL")} ₪
                </p>
              </MiniPanel>

              <MiniPanel>
                <h3 style={sectionHeading}>בן/בת זוג</h3>
                <p style={lineStyle}>
                  <strong>שם:</strong> {reportData.members.spouse.fullName}
                </p>
                <p style={lineStyle}>
                  <strong>מספר מסמכים:</strong> {reportData.members.spouse.filesCount}
                </p>
                <p style={lineStyle}>
                  <strong>סה״כ צבירה:</strong>{" "}
                  {reportData.members.spouse.totalBalance.toLocaleString("he-IL")} ₪
                </p>
                <p style={lineStyle}>
                  <strong>הפקדה חודשית:</strong>{" "}
                  {reportData.members.spouse.totalMonthlyDeposit.toLocaleString("he-IL")} ₪
                </p>
              </MiniPanel>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <Card
                title="כיסוי חיים כולל"
                value={`${reportData.totals.totalLifeCoverage.toLocaleString("he-IL")} ₪`}
              />
              <Card
                title="כיסוי אובדן כושר"
                value={`${reportData.totals.totalDisabilityCoverage.toLocaleString("he-IL")} ₪`}
              />
            </div>

            <div style={subPanelStyle}>
              <h2 style={sectionHeading}>נכסים ומוצרים שזוהו</h2>

              {reportData.assets.length === 0 ? (
                <p style={{ color: "#64748b" }}>לא זוהו נכסים.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: "#fff",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#eef4ff" }}>
                        <th style={thStyle}>שייך ל</th>
                        <th style={thStyle}>שם</th>
                        <th style={thStyle}>גוף מנהל</th>
                        <th style={thStyle}>מוצר</th>
                        <th style={thStyle}>צבירה</th>
                        <th style={thStyle}>הפקדה חודשית</th>
                        <th style={thStyle}>דמי ניהול מצבירה</th>
                        <th style={thStyle}>דמי ניהול מהפקדה</th>
                        <th style={thStyle}>קובץ מקור</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.assets.map((asset) => (
                        <tr key={asset.id}>
                          <td style={tdStyle}>{asset.ownerLabel}</td>
                          <td style={tdStyle}>{asset.fullName}</td>
                          <td style={tdStyle}>{asset.provider}</td>
                          <td style={tdStyle}>{asset.productType}</td>
                          <td style={tdStyle}>
                            {asset.balance.toLocaleString("he-IL")} ₪
                          </td>
                          <td style={tdStyle}>
                            {asset.monthlyDeposit.toLocaleString("he-IL")} ₪
                          </td>
                          <td style={tdStyle}>{asset.managementFeeBalance}%</td>
                          <td style={tdStyle}>{asset.managementFeeDeposit}%</td>
                          <td style={tdStyle}>{asset.sourceFile}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={subPanelStyle}>
              <h2 style={sectionHeading}>תובנות ראשוניות</h2>

              <div style={{ display: "grid", gap: "10px" }}>
                {reportData.insights.map((item, index) => (
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
            </div>
          </div>
        </div>
      </div>
    </>
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
      <div style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function MiniPanel({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </div>
  );
}

const panelStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
};

const subPanelStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
  marginBottom: "24px",
};

const sectionHeading = {
  marginTop: 0,
  marginBottom: "16px",
  color: "#0f172a",
};

const lineStyle = {
  margin: "6px 0",
  color: "#334155",
};

const thStyle = {
  textAlign: "right",
  padding: "12px",
  borderBottom: "1px solid #dbe4f0",
  color: "#0f172a",
  fontSize: "14px",
};

const tdStyle = {
  textAlign: "right",
  padding: "12px",
  borderBottom: "1px solid #eef2f7",
  color: "#334155",
  fontSize: "14px",
};

const primaryButton = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: "bold",
  cursor: "pointer",
};

const dangerButton = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: "bold",
  cursor: "pointer",
};