// src/App.jsx

import React, { useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";

export default function App() {
  const [reportData, setReportData] = useState(null);

  return reportData ? (
    <ReportPage
      reportData={reportData}
      onBack={() => setReportData(null)}
      onResetAll={() => setReportData(null)}
    />
  ) : (
    <UploadPage setReportData={setReportData} />
  );
}