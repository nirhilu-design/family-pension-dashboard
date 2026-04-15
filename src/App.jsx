import React, { useMemo, useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";

export default function App() {
  const [currentStep, setCurrentStep] = useState("upload"); // upload | report
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("self");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const pdfOnly = files.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfOnly.length) {
      alert("ניתן להעלות רק קבצי PDF.");
      event.target.value = "";
      return;
    }

    const newFiles = pdfOnly.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      owner: selectedOwner, // self | spouse
      familyId: "family-1",
      fileName: file.name,
      fileType: file.type || "application/pdf",
      fileSize: file.size,
      status: "uploaded", // uploaded | processing | parsed | error
      rawFile: file,
      parsedData: null,
      uploadedAt: new Date().toLocaleString("he-IL"),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleResetAll = () => {
    setUploadedFiles([]);
    setReportData(null);
    setCurrentStep("upload");
    setIsAnalyzing(false);
  };

  const extractDemoNameFromFile = (fileName, owner) => {
    const cleanName = fileName.replace(".pdf", "").replace(/[_-]/g, " ").trim();

    if (cleanName.length > 2) {
      return cleanName;
    }

    return owner === "self" ? "מבוטח ראשי" : "בן/בת זוג";
  };

  const simulatePdfParsing = async (file) => {
    const fullName = extractDemoNameFromFile(file.fileName, file.owner);

    const baseData =
      file.owner === "self"
        ? {
            fullName,
            idNumber: "123456789",
            provider: "הראל",
            productType: "קרן פנסיה",
            balance: 284500,
            monthlyDeposit: 2650,
            managementFeeBalance: 0.48,
            managementFeeDeposit: 2.1,
            disabilityCoverage: 8500,
            lifeCoverage: 420000,
          }
        : {
            fullName,
            idNumber: "987654321",
            provider: "מנורה",
            productType: "ביטוח מנהלים",
            balance: 197300,
            monthlyDeposit: 2150,
            managementFeeBalance: 0.62,
            managementFeeDeposit: 2.6,
            disabilityCoverage: 7200,
            lifeCoverage: 350000,
          };

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(baseData);
      }, 1000);
    });
  };

  const buildFamilyReport = (files) => {
    const parsedFiles = files.filter((file) => file.parsedData);

    const selfFiles = parsedFiles.filter((file) => file.owner === "self");
    const spouseFiles = parsedFiles.filter((file) => file.owner === "spouse");

    const sum = (items, field) =>
      items.reduce((total, item) => total + (item.parsedData?.[field] || 0), 0);

    const selfName =
      selfFiles[0]?.parsedData?.fullName || "לא זוהה שם מבוטח ראשי";
    const spouseName =
      spouseFiles[0]?.parsedData?.fullName || "לא זוהה שם בן/בת זוג";

    const totalBalance = sum(parsedFiles, "balance");
    const totalMonthlyDeposit = sum(parsedFiles, "monthlyDeposit");
    const totalLifeCoverage = sum(parsedFiles, "lifeCoverage");
    const totalDisabilityCoverage = sum(parsedFiles, "disabilityCoverage");

    const assets = parsedFiles.map((file) => ({
      id: file.id,
      owner: file.owner,
      ownerLabel: file.owner === "self" ? "שלי" : "בן/בת זוג",
      fullName: file.parsedData.fullName,
      provider: file.parsedData.provider,
      productType: file.parsedData.productType,
      balance: file.parsedData.balance,
      monthlyDeposit: file.parsedData.monthlyDeposit,
      managementFeeBalance: file.parsedData.managementFeeBalance,
      managementFeeDeposit: file.parsedData.managementFeeDeposit,
      disabilityCoverage: file.parsedData.disabilityCoverage,
      lifeCoverage: file.parsedData.lifeCoverage,
      sourceFile: file.fileName,
    }));

    const insights = [];

    if (selfFiles.length > 0) {
      insights.push(`זוהה מבוטח ראשי: ${selfName}.`);
    }

    if (spouseFiles.length > 0) {
      insights.push(`זוהה בן/בת זוג: ${spouseName}.`);
    }

    if (selfFiles.length > 0 && spouseFiles.length > 0) {
      insights.push("קיימים נתונים לשני בני הזוג וניתן להציג תמונה משפחתית מאוחדת.");
    }

    if (totalBalance > 400000) {
      insights.push("נראית צבירה משפחתית משמעותית שמצדיקה דוח מאוחד והשוואת מוצרים.");
    }

    if (parsedFiles.length >= 2) {
      insights.push("מומלץ בשלב הבא לחבר parser אמיתי כדי לזהות שמות ושדות מתוך ה־PDF בזמן אמת.");
    }

    return {
      familyId: "family-1",
      members: {
        self: {
          fullName: selfName,
          filesCount: selfFiles.length,
          totalBalance: sum(selfFiles, "balance"),
          totalMonthlyDeposit: sum(selfFiles, "monthlyDeposit"),
        },
        spouse: {
          fullName: spouseName,
          filesCount: spouseFiles.length,
          totalBalance: sum(spouseFiles, "balance"),
          totalMonthlyDeposit: sum(spouseFiles, "monthlyDeposit"),
        },
      },
      totals: {
        totalFiles: files.length,
        parsedFiles: parsedFiles.length,
        totalBalance,
        totalMonthlyDeposit,
        totalLifeCoverage,
        totalDisabilityCoverage,
      },
      assets,
      insights,
    };
  };

  const handleAnalyzeFiles = async () => {
    if (!uploadedFiles.length) {
      alert("צריך להעלות לפחות קובץ PDF אחד.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const filesWithProcessing = uploadedFiles.map((file) => ({
        ...file,
        status: "processing",
      }));
      setUploadedFiles(filesWithProcessing);

      const parsedResults = [];

      for (const file of filesWithProcessing) {
        const parsedData = await simulatePdfParsing(file);
        parsedResults.push({
          ...file,
          status: "parsed",
          parsedData,
        });
      }

      setUploadedFiles(parsedResults);

      const familyReport = buildFamilyReport(parsedResults);
      setReportData(familyReport);
      setCurrentStep("report");
    } catch (error) {
      console.error(error);
      alert("אירעה שגיאה בניתוח הקבצים.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadSummary = useMemo(() => {
    return {
      totalFiles: uploadedFiles.length,
      selfFiles: uploadedFiles.filter((f) => f.owner === "self").length,
      spouseFiles: uploadedFiles.filter((f) => f.owner === "spouse").length,
      parsedFiles: uploadedFiles.filter((f) => f.status === "parsed").length,
    };
  }, [uploadedFiles]);

  if (currentStep === "report" && reportData) {
    return (
      <ReportPage
        reportData={reportData}
        onBack={() => setCurrentStep("upload")}
        onResetAll={handleResetAll}
      />
    );
  }

  return (
    <UploadPage
      selectedOwner={selectedOwner}
      setSelectedOwner={setSelectedOwner}
      uploadedFiles={uploadedFiles}
      uploadSummary={uploadSummary}
      onFileUpload={handleFileUpload}
      onDeleteFile={handleDeleteFile}
      onAnalyzeFiles={handleAnalyzeFiles}
      isAnalyzing={isAnalyzing}
    />
  );
}