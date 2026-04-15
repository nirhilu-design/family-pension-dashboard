const analyzePdfViaApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file.rawFile);
  formData.append("owner", file.owner);

  const response = await fetch("/api/analyze-pension-pdf", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "שגיאה בניתוח הקובץ");
  }

  return data.parsedData;
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
      const parsedData = await analyzePdfViaApi(file);

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
    alert(error.message || "אירעה שגיאה בניתוח הקבצים.");
  } finally {
    setIsAnalyzing(false);
  }
};