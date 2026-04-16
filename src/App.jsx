// src/App.jsx

import React, { useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [parsedFiles, setParsedFiles] = useState([]);

  return (
    <>
      {!dashboardData ? (
        <UploadPage
          setDashboardData={setDashboardData}
          setParsedFiles={setParsedFiles}
        />
      ) : (
        <ReportPage
          dashboardData={dashboardData}
          parsedFiles={parsedFiles}
          onReset={() => {
            setDashboardData(null);
            setParsedFiles([]);
          }}
        />
      )}
    </>
  );
}