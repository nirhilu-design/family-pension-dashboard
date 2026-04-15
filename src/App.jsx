import React, { useMemo, useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";

export default function App() {
  const [currentStep, setCurrentStep] = useState("upload");
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
      owner: selectedOwner,
      familyId: "family-1",
      fileName: file.name,
      fileType: file.type || "application/pdf",
      fileSize: file.size,
      status: "uploaded",
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
    const cleanName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[_-]/g, " ")
      .trim();

    if (cleanName.length > 2) return cleanName;

    return owner === "self" ? "בן זוג" : "בת זוג";
  };

  const simulatePdfParsing = async (file) => {
    const fullName = extractDemoNameFromFile(file.fileName, file.owner);

    const baseData =
      file.owner === "self"
        ? {
            fullName,
            idNumber: "123456789",
            provider: "מנורה",
            productType: "פנסיה",
            balance: 1507369,
            monthlyDeposit: 9081,
            monthlyPensionWithDeposits: 21055,
            monthlyPensionWithoutDeposits: 11382,
            lumpSumWithDeposits: 1781626,
            lumpSumWithoutDeposits: 906430,
            managementFeeBalance: 0.48,
            managementFeeDeposit: 2.1,
            disabilityValue: 21398,
            disabilityPercent: 75,
            lifeCoverage: 522180,
            deathCoverage: 522180,
            trackName: "כללי / פנסיה",
            equityPercent: 45,
          }
        : {
            fullName,
            idNumber: "987654321",
            provider: "אנליסט",
            productType: "קרנות השתלמות",
            balance: 2258465,
            monthlyDeposit: 14734,
            monthlyPensionWithDeposits: 43428,
            monthlyPensionWithoutDeposits: 19531,
            lumpSumWithDeposits: 1774057,
            lumpSumWithoutDeposits: 1231472,
            managementFeeBalance: 0.62,
            managementFeeDeposit: 2.6,
            disabilityValue: 83401,
            disabilityPercent: 138,
            lifeCoverage: 2707847,
            deathCoverage: 2707847,
            trackName: "מנייתי / עוקב מדדים",
            equityPercent: 100,
          };

    return new Promise((resolve) => {
      setTimeout(() => resolve(baseData), 900);
    });
  };

  const buildFamilyReport = (files) => {
    const parsedFiles = files.filter((file) => file.parsedData);

    const selfFiles = parsedFiles.filter((file) => file.owner === "self");
    const spouseFiles = parsedFiles.filter((file) => file.owner === "spouse");

    const sumParsed = (items, field) =>
      items.reduce((total, item) => total + (item.parsedData?.[field] || 0), 0);

    const totalAssets = sumParsed(parsedFiles, "balance");
    const monthlyDeposits = sumParsed(parsedFiles, "monthlyDeposit");
    const monthlyPensionWithDeposits = sumParsed(
      parsedFiles,
      "monthlyPensionWithDeposits"
    );
    const monthlyPensionWithoutDeposits = sumParsed(
      parsedFiles,
      "monthlyPensionWithoutDeposits"
    );
    const projectedLumpSumWithDeposits = sumParsed(
      parsedFiles,
      "lumpSumWithDeposits"
    );
    const projectedLumpSumWithoutDeposits = sumParsed(
      parsedFiles,
      "lumpSumWithoutDeposits"
    );
    const deathCoverageTotal = sumParsed(parsedFiles, "deathCoverage");

    const selfAssets = sumParsed(selfFiles, "balance");
    const spouseAssets = sumParsed(spouseFiles, "balance");

    const selfName = selfFiles[0]?.parsedData?.fullName || "בן זוג";
    const spouseName = spouseFiles[0]?.parsedData?.fullName || "בת זוג";

    const members = [
      {
        name: selfName,
        assets: selfAssets,
        monthlyDeposits: sumParsed(selfFiles, "monthlyDeposit"),
        shareOfFamilyAssets:
          totalAssets > 0 ? Math.round((selfAssets / totalAssets) * 100) : 0,
        monthlyPensionWithDeposits: sumParsed(
          selfFiles,
          "monthlyPensionWithDeposits"
        ),
        monthlyPensionWithoutDeposits: sumParsed(
          selfFiles,
          "monthlyPensionWithoutDeposits"
        ),
        lumpSumWithDeposits: sumParsed(selfFiles, "lumpSumWithDeposits"),
        lumpSumWithoutDeposits: sumParsed(selfFiles, "lumpSumWithoutDeposits"),
        deathCoverage: sumParsed(selfFiles, "deathCoverage"),
        disabilityValue: sumParsed(selfFiles, "disabilityValue"),
        disabilityPercent:
          selfFiles.length > 0
            ? Math.round(
                selfFiles.reduce(
                  (sum, item) => sum + (item.parsedData?.disabilityPercent || 0),
                  0
                ) / selfFiles.length
              )
            : 0,
      },
      {
        name: spouseName,
        assets: spouseAssets,
        monthlyDeposits: sumParsed(spouseFiles, "monthlyDeposit"),
        shareOfFamilyAssets:
          totalAssets > 0 ? Math.round((spouseAssets / totalAssets) * 100) : 0,
        monthlyPensionWithDeposits: sumParsed(
          spouseFiles,
          "monthlyPensionWithDeposits"
        ),
        monthlyPensionWithoutDeposits: sumParsed(
          spouseFiles,
          "monthlyPensionWithoutDeposits"
        ),
        lumpSumWithDeposits: sumParsed(spouseFiles, "lumpSumWithDeposits"),
        lumpSumWithoutDeposits: sumParsed(
          spouseFiles,
          "lumpSumWithoutDeposits"
        ),
        deathCoverage: sumParsed(spouseFiles, "deathCoverage"),
        disabilityValue: sumParsed(spouseFiles, "disabilityValue"),
        disabilityPercent:
          spouseFiles.length > 0
            ? Math.round(
                spouseFiles.reduce(
                  (sum, item) => sum + (item.parsedData?.disabilityPercent || 0),
                  0
                ) / spouseFiles.length
              )
            : 0,
      },
    ];

    const groupedProductsMap = {};
    parsedFiles.forEach((file) => {
      const key = file.parsedData.productType || "לא ידוע";
      groupedProductsMap[key] =
        (groupedProductsMap[key] || 0) + (file.parsedData.balance || 0);
    });

    let products = Object.entries(groupedProductsMap).map(([name, value]) => ({
      name,
      value,
    }));

    if (products.length === 1) {
      products = [
        ...products,
        { name: "קופות גמל", value: 223417 },
        { name: "גמל להשקעה", value: 194202 },
      ];
    }

    const groupedManagersMap = {};
    parsedFiles.forEach((file) => {
      const key = file.parsedData.provider || "לא ידוע";
      groupedManagersMap[key] =
        (groupedManagersMap[key] || 0) + (file.parsedData.balance || 0);
    });

    const managers = Object.entries(groupedManagersMap).map(([name, value]) => ({
      name,
      value,
    }));

    const groupedTracksMap = {};
    parsedFiles.forEach((file) => {
      const key = file.parsedData.trackName || "כללי / פנסיה";

      if (!groupedTracksMap[key]) {
        groupedTracksMap[key] = {
          name: key,
          value: 0,
          equityPercent: file.parsedData.equityPercent || 0,
        };
      }

      groupedTracksMap[key].value += file.parsedData.balance || 0;
    });

    let tracks = Object.values(groupedTracksMap);

    if (tracks.length === 1) {
      tracks = [
        ...tracks,
        { name: 'אג"ח / מסלול שמרני', value: 398849, equityPercent: 25 },
      ];
    }

    const totalTracks = tracks.reduce((sum, item) => sum + item.value, 0);

    const weightedEquityExposure =
      totalTracks > 0
        ? Math.round(
            (tracks.reduce(
              (sum, item) => sum + item.value * (item.equityPercent / 100),
              0
            ) /
              totalTracks) *
              100
          )
        : 0;

    return {
      family: {
        totalAssets,
        monthlyDeposits,
        monthlyPensionWithDeposits,
        monthlyPensionWithoutDeposits,
        projectedLumpSumWithDeposits,
        projectedLumpSumWithoutDeposits,
        deathCoverageTotal,
        lastUpdated: new Date().toLocaleDateString("he-IL", {
          year: "numeric",
          month: "long",
        }),
        retirementAgeLabel:
          "התחזית מבוססת על גיל הפרישה המוגדר בדוחות (67)",
      },
      members,
      products,
      managers,
      tracks,
      loans: {
        hasData: false,
      },
      beneficiaries: {
        hasData: false,
        coverageAmount: deathCoverageTotal,
        summary:
          "התקבלו סכומי כיסוי למקרה פטירה, אך לא התקבל מידע בדוחות לגבי סטטוס רישום המוטבים.",
      },
      weightedEquityExposure,
      totalProducts: products.reduce((sum, item) => sum + item.value, 0),
      totalManagers: managers.reduce((sum, item) => sum + item.value, 0),
      totalTracks,
      rawParsedFiles: parsedFiles,
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