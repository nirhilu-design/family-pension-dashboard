// src/UploadPage.jsx

import React, { useState } from "react";
import {
  parseMultiplePensionXmlFiles,
  buildFamilyDashboardData,
} from "./utils/pensionXmlParser";

export default function UploadPage({ setDashboardData, setParsedFiles }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    try {
      setError("");
      setLoading(true);

      const files = Array.from(event.target.files || []).filter((file) =>
        file.name.toLowerCase().endsWith(".xml")
      );

      if (!files.length) {
        setError("לא נבחרו קבצי XML");
        setLoading(false);
        return;
      }

      const parsedMembers = await parseMultiplePensionXmlFiles(files);
      const familyData = buildFamilyDashboardData(parsedMembers);

      console.log("parsedMembers", parsedMembers);
      console.log("familyData", familyData);

      setParsedFiles(parsedMembers);
      setDashboardData(familyData);
    } catch (err) {
      console.error(err);
      setError("שגיאה בקריאת קבצי XML");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        direction: "rtl",
        background: "#f7f8fc",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 24,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #e6e8f0",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 34,
            color: "#0d2c6c",
          }}
        >
          דוח פנסיוני משפחתי
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "#5b6480",
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          העלה קובץ XML אחד או יותר, והמערכת תבנה עבורך סיכום משפחתי מאוחד:
          צבירה, קצבה צפויה, כיסויים ביטוחיים, הפקדות חודשיות ופירוט לפי כל
          בן משפחה.
        </p>

        <div
          style={{
            border: "2px dashed #c8d0e6",
            borderRadius: 20,
            padding: 30,
            textAlign: "center",
            background: "#f9fbff",
          }}
        >
          <input
            type="file"
            multiple
            accept=".xml"
            onChange={handleFileUpload}
            style={{
              fontSize: 16,
              padding: 12,
              width: "100%",
            }}
          />

          {loading && (
            <p style={{ marginTop: 18, color: "#0d2c6c", fontWeight: 700 }}>
              טוען ומנתח קבצים...
            </p>
          )}

          {error && (
            <p style={{ marginTop: 18, color: "#c62828", fontWeight: 700 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}