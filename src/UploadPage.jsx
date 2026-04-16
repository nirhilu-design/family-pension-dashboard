// src/UploadPage.jsx

import React, { useRef, useState } from "react";
import {
  parseMultiplePensionXmlFiles,
  buildFamilyDashboardData,
} from "./utils/pensionXmlParser";

export default function UploadPage({ setDashboardData, setParsedFiles }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const addFiles = (files) => {
    const xmlFiles = Array.from(files || []).filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (!xmlFiles.length) {
      setError("יש לבחור קבצי XML בלבד");
      return;
    }

    setError("");

    setSelectedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}_${file.size}_${file.lastModified}`)
      );

      const newFiles = xmlFiles.filter((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prev, ...newFiles];
    });
  };

  const handleFileSelection = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const related = event.relatedTarget;
    if (!event.currentTarget.contains(related)) {
      setIsDragging(false);
    }
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError("");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
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
          maxWidth: 980,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 28,
          padding: 32,
          boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
          border: "1px solid #e7ebf3",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              color: "#0d2c6c",
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            העלאת קבצי XML
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              color: "#5f6b85",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            אפשר להעלות קבצים אחד-אחד, לבחור כמה יחד, או פשוט לגרור לכאן.
            המערכת תשמור את כל הקבצים שנבחרו עד שתלחץ על “הפק דוח”.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: isDragging ? "2px solid #0d2c6c" : "2px dashed #cbd4e6",
            background: isDragging ? "#eef4ff" : "#f9fbff",
            borderRadius: 24,
            padding: "34px 24px",
            textAlign: "center",
            transition: "all 0.2s ease",
            marginBottom: 20,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xml"
            onChange={handleFileSelection}
            style={{ display: "none" }}
          />

          <div
            style={{
              fontSize: 42,
              marginBottom: 10,
            }}
          >
            📂
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0d2c6c",
              marginBottom: 10,
            }}
          >
            גרור קבצי XML לכאן
          </div>

          <div
            style={{
              color: "#69758e",
              fontSize: 15,
              marginBottom: 18,
            }}
          >
            או בחר קבצים ידנית מהמחשב
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            style={{
              background: "#0d2c6c",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            בחירת קבצים
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              color: "#0d2c6c",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {selectedFiles.length
              ? `נבחרו ${selectedFiles.length} קבצים`
              : "עדיין לא נבחרו קבצים"}
          </div>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={clearAllFiles}
              style={{
                background: "#fff",
                color: "#b42318",
                border: "1px solid #f0c7c2",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              נקה הכל
            </button>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e4e9f5",
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}_${file.size}_${file.lastModified}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom:
                    index !== selectedFiles.length - 1
                      ? "1px solid #eef2fa"
                      : "none",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0d2c6c",
                      marginBottom: 4,
                      wordBreak: "break-word",
                    }}
                  >
                    {file.name}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  style={{
                    background: "#fff5f5",
                    color: "#c81e1e",
                    border: "1px solid #f3c2c2",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  הסר
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyzeFiles}
          disabled={loading || selectedFiles.length === 0}
          style={{
            width: "100%",
            padding: "16px 20px",
            background:
              loading || selectedFiles.length === 0 ? "#c3cbdd" : "#0d2c6c",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 800,
            cursor:
              loading || selectedFiles.length === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "מנתח קבצים..." : "הפק דוח"}
        </button>

        {loading && (
          <div
            style={{
              marginTop: 16,
              background: "#eef4ff",
              border: "1px solid #d7e3ff",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 10,
                width: "100%",
                background:
                  "linear-gradient(90deg, #0d2c6c 0%, #3f67c6 50%, #0d2c6c 100%)",
                backgroundSize: "200% 100%",
                animation: "loadingBar 1.4s linear infinite",
              }}
            />
            <div
              style={{
                padding: 12,
                color: "#0d2c6c",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              הקבצים נטענים ומנותחים...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              background: "#fff5f5",
              color: "#b42318",
              border: "1px solid #f3c2c2",
              borderRadius: 14,
              padding: 14,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes loadingBar {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}