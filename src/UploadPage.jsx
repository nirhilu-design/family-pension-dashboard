// src/UploadPage.jsx

import React, { useState } from "react";
import {
  parseMultiplePensionXmlFiles,
  buildFamilyDashboardData,
} from "./utils/pensionXmlParser";

export default function UploadPage({ setDashboardData, setParsedFiles }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    setError("");

    if (!files.length) {
      setSelectedFiles([]);
      setError("לא נבחרו קבצי XML");
      return;
    }

    setSelectedFiles(files);
  };

  const handleAnalyzeFiles = async () => {
    try {
      setError("");

      if (!selectedFiles.length) {
        setError("יש לבחור לפחות קובץ XML אחד");
        return;
      }

      setLoading(true);

      const parsedMembers = await parseMultiplePensionXmlFiles(selectedFiles);
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
          בחר קובץ XML אחד או יותר, ואז לחץ על כפתור הניתוח כדי להפיק דוח אישי או
          משפחתי מאוחד.
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
            onChange={handleFileSelection}
            style={{
              fontSize: 16,
              padding: 12,
              width: "100%",
              marginBottom: 18,
            }}
          />

          {selectedFiles.length > 0 && (
            <div
              style={{
                textAlign: "right",
                background: "#fff",
                border: "1px solid #e3e8f5",
                borderRadius: 16,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "#0d2c6c",
                  marginBottom: 10,
                }}
              >
                קבצים שנבחרו:
              </div>

              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      index !== selectedFiles.length - 1
                        ? "1px solid #eef2fa"
                        : "none",
                    color: "#374151",
                    fontSize: 15,
                  }}
                >
                  {file.name}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAnalyzeFiles}
            disabled={loading || selectedFiles.length === 0}
            style={{
              background:
                loading || selectedFiles.length === 0 ? "#b9c3da" : "#0d2c6c",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "14px 22px",
              fontSize: 16,
              fontWeight: 700,
              cursor:
                loading || selectedFiles.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "מנתח קבצים..." : "הפק דוח"}
          </button>

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