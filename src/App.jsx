import React from "react";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9F7F3",
        direction: "rtl",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #E2D1BF",
          borderRadius: "18px",
          padding: "24px",
        }}
      >
        <h1 style={{ color: "#00215D", marginTop: 0 }}>
          דוח פנסיוני משפחתי מאוחד
        </h1>
        <p style={{ color: "#486581" }}>
          אם אתה רואה את המסך הזה, הבעיה היא בקוד הדשבורד שבתוך App.jsx ולא בהגדרות הפרויקט.
        </p>
      </div>
    </div>
  );
}
