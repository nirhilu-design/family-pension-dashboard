// src/ReportPage.jsx

import React from "react";

function formatMoney(value) {
  return `₪${Number(value || 0).toLocaleString("he-IL")}`;
}

function cardStyle(background = "#ffffff", color = "#0d2c6c") {
  return {
    background,
    color,
    borderRadius: 24,
    padding: 24,
    border: background === "#ffffff" ? "1px solid #e6e8f0" : "none",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  };
}

function StatCard({ title, value, dark }) {
  return (
    <div
      style={cardStyle(dark ? "#0d2c6c" : "#ffffff", dark ? "#ffffff" : "#0d2c6c")}
    >
      <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800 }}>{formatMoney(value)}</div>
    </div>
  );
}

function MemberCard({ file }) {
  return (
    <div style={cardStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {file.member.fullName || "ללא שם"}
          </div>
          <div style={{ color: "#6b7280", marginTop: 6 }}>ת.ז: {file.member.id || "-"}</div>
        </div>

        <div
          style={{
            background: "#f3f6ff",
            color: "#0d2c6c",
            borderRadius: 999,
            padding: "10px 18px",
            fontWeight: 700,
            border: "1px solid #d8e0f6",
          }}
        >
          {file.policies.length} מוצרים
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: 8 }}>סך צבירה</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {formatMoney(file.summary.save.totalAccumulated)}
          </div>
        </div>

        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: 8 }}>קצבה חודשית צפויה</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {formatMoney(file.summary.save.projectedMonthlyPension)}
          </div>
        </div>

        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: 8 }}>סכום הוני צפוי</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {formatMoney(file.summary.save.projectedRetirementBalance)}
          </div>
        </div>

        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: 8 }}>כיסוי ביטוחי</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {formatMoney(file.summary.cover.totalInsurance)}
          </div>
        </div>

        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: 8 }}>הפקדה / עלות חודשית</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0d2c6c" }}>
            {formatMoney(file.summary.budget.sumCost)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyTable({ policies }) {
  return (
    <div style={cardStyle()}>
      <h2 style={{ marginTop: 0, marginBottom: 18, color: "#0d2c6c" }}>פירוט מוצרים</h2>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 900,
          }}
        >
          <thead>
            <tr style={{ background: "#f4f7ff" }}>
              <th style={thStyle}>בעלים</th>
              <th style={thStyle}>סוג מוצר</th>
              <th style={thStyle}>שם תכנית</th>
              <th style={thStyle}>מספר פוליסה</th>
              <th style={thStyle}>צבירה</th>
              <th style={thStyle}>קצבה צפויה</th>
              <th style={thStyle}>הפקדה חודשית</th>
              <th style={thStyle}>כיסוי ביטוחי</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={index}>
                <td style={tdStyle}>{policy.ownerName || "-"}</td>
                <td style={tdStyle}>{policy.productType || "-"}</td>
                <td style={tdStyle}>{policy.planName || "-"}</td>
                <td style={tdStyle}>{policy.policyNo || "-"}</td>
                <td style={tdStyle}>{formatMoney(policy.savings.totalAccumulated)}</td>
                <td style={tdStyle}>{formatMoney(policy.savings.projectedMonthlyPension)}</td>
                <td style={tdStyle}>{formatMoney(policy.monthlyDeposits.sumCost)}</td>
                <td style={tdStyle}>{formatMoney(policy.coverage.totalInsurance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "right",
  padding: "14px 12px",
  borderBottom: "1px solid #dbe2f2",
  color: "#0d2c6c",
  fontSize: 14,
};

const tdStyle = {
  textAlign: "right",
  padding: "14px 12px",
  borderBottom: "1px solid #edf1f7",
  fontSize: 14,
  color: "#374151",
};

export default function ReportPage({ dashboardData, parsedFiles, onReset }) {
  if (!dashboardData) {
    return <div style={{ padding: 24 }}>אין נתונים</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        direction: "rtl",
        background: "#f7f8fc",
        padding: "30px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0d2c6c",
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              דוח פנסיוני משפחתי מאוחד
            </h1>
            <p style={{ margin: "10px 0 0", color: "#6b7280", fontSize: 16 }}>
              תצוגה מרכזת של כל בני המשפחה, עם סיכום כולל ופירוט לפי אדם ולפי מוצר.
            </p>
          </div>

          <button
            onClick={onReset}
            style={{
              background: "#0d2c6c",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "12px 18px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            העלאת קבצים מחדש
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatCard title="סך צבירה משפחתית" value={dashboardData.totals.totalAccumulated} dark />
          <StatCard
            title="יתרה חזויה לפרישה"
            value={dashboardData.totals.totalProjectedRetirementBalance}
          />
          <StatCard
            title="קצבה חודשית צפויה"
            value={dashboardData.totals.totalProjectedMonthlyPension}
          />
          <StatCard title="כיסוי ביטוחי כולל" value={dashboardData.totals.totalInsurance} />
          <StatCard title="הפקדה / עלות חודשית" value={dashboardData.totals.totalMonthlyDeposits} />
        </div>

        <div style={{ display: "grid", gap: 20, marginBottom: 28 }}>
          {parsedFiles.map((file, index) => (
            <MemberCard key={index} file={file} />
          ))}
        </div>

        <PolicyTable policies={dashboardData.policies} />
      </div>
    </div>
  );
}