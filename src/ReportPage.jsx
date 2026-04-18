// src/ReportPage.jsx

import React, { useMemo, useState } from "react";

export default function ReportPage({ reportData, onBack, onResetAll }) {
  const [recommendations, setRecommendations] = useState(
    `1. מומלץ לבחון את הפער בין הקצבה הצפויה עם המשך הפקדות לבין ללא המשך הפקדות.
2. מומלץ לבדוק האם יש ריכוז יתר במוצרים או בגופים מנהלים מסוימים.
3. מומלץ לעבור על הכיסויים הביטוחיים ולוודא שהם מתאימים לצרכים המשפחתיים.
4. מומלץ לבחון את מדיניות ההשקעה ורמת החשיפה למניות בהתאם לפרופיל הסיכון הרצוי.`
  );

  const safeReportData = reportData || {};

  const {
    family = {},
    members = [],
    products = [],
    managers = [],
    tracks = [],
    loans = { hasData: false, details: [] },
    beneficiaries = {
      hasData: false,
      coverageAmount: 0,
      summary: "לא התקבל מידע",
    },
    weightedEquityExposure = 0,
    totalProducts = 0,
    totalManagers = 0,
    totalTracks = 0,
  } = safeReportData;

  const handleExportPdf = () => {
    window.print();
  };

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercentLabel = (value) => `${Math.round(Number(value || 0))}%`;

  const formatDate = (value) => {
    if (!value) return "—";
    const str = String(value).trim();

    if (/^\d{8}$/.test(str)) {
      const y = str.slice(0, 4);
      const m = str.slice(4, 6);
      const d = str.slice(6, 8);
      return `${d}/${m}/${y}`;
    }

    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("he-IL").format(date);
    }

    return str;
  };

  const normalizedLoanDetails = Array.isArray(loans?.details)
    ? loans.details
        .map((loan, index) => ({
          id:
            loan.id ||
            `${loan.firstName || ""}_${loan.familyName || ""}_${loan.endDate || ""}_${index}`,
          firstName: loan.firstName || "",
          familyName: loan.familyName || "",
          amount: Number(loan.amount || 0),
          repaymentFrequency: loan.repaymentFrequency || "",
          balance: Number(loan.balance || 0),
          endDate: loan.endDate || "",
        }))
        .filter(
          (loan) =>
            loan.firstName ||
            loan.familyName ||
            loan.amount ||
            loan.balance ||
            loan.repaymentFrequency ||
            loan.endDate
        )
    : [];

  const groupedLoans = normalizedLoanDetails.reduce((acc, loan) => {
    const personName =
      [loan.firstName, loan.familyName].filter(Boolean).join(" ").trim() ||
      "ללא שיוך";
    if (!acc[personName]) {
      acc[personName] = [];
    }
    acc[personName].push(loan);
    return acc;
  }, {});

  const hasDetailedLoans = normalizedLoanDetails.length > 0;

  const totalLoansAmount = normalizedLoanDetails.reduce(
    (sum, loan) => sum + (loan.amount || 0),
    0
  );

  const loanRatioToAssets =
    Number(family.totalAssets || 0) > 0
      ? (totalLoansAmount / Number(family.totalAssets || 0)) * 100
      : 0;

  const retirementLumpBars = useMemo(() => {
    const withDeposits = Number(family.projectedLumpSumWithDeposits || 0);
    const withoutDeposits = Number(family.projectedLumpSumWithoutDeposits || 0);
    const maxValue = Math.max(withDeposits, withoutDeposits, 1);

    return [
      {
        label: "עם הפקדות",
        value: withDeposits,
        display: formatCurrency(withDeposits),
        ratio: (withDeposits / maxValue) * 100,
        tone: "primary",
      },
      {
        label: "ללא הפקדות",
        value: withoutDeposits,
        display: formatCurrency(withoutDeposits),
        ratio: (withoutDeposits / maxValue) * 100,
        tone: "muted",
      },
    ];
  }, [
    family.projectedLumpSumWithDeposits,
    family.projectedLumpSumWithoutDeposits,
  ]);

  const retirementPensionBars = useMemo(() => {
    const withDeposits = Number(family.monthlyPensionWithDeposits || 0);
    const withoutDeposits = Number(family.monthlyPensionWithoutDeposits || 0);
    const maxValue = Math.max(withDeposits, withoutDeposits, 1);

    return [
      {
        label: "עם הפקדות",
        value: withDeposits,
        display: formatCurrency(withDeposits),
        ratio: (withDeposits / maxValue) * 100,
        tone: "primary",
      },
      {
        label: "ללא הפקדות",
        value: withoutDeposits,
        display: formatCurrency(withoutDeposits),
        ratio: (withoutDeposits / maxValue) * 100,
        tone: "muted",
      },
    ];
  }, [
    family.monthlyPensionWithDeposits,
    family.monthlyPensionWithoutDeposits,
  ]);

  const exposureLabel =
    weightedEquityExposure <= 30
      ? "חשיפה נמוכה"
      : weightedEquityExposure <= 60
      ? "חשיפה בינונית"
      : "חשיפה גבוהה";

  const pageBg = "#F7F5F1";
  const surface = "#FFFFFF";
  const surfaceAlt = "#FCFBF8";
  const border = "#DCCDBA";
  const divider = "#EEE4D8";
  const text = "#102A43";
  const textSoft = "#627D98";
  const title = "#0D347A";
  const blue = "#1F77B4";
  const cyan = "#43B5D9";
  const purple = "#8F63C9";
  const pink = "#F07C8A";
  const gold = "#F0B43C";
  const navy = "#00215D";
  const mutedBar = "#B7C4D8";
  const softBlue = "#EAF1FB";

  const styles = {
    page: {
      minHeight: "100vh",
      background: pageBg,
      padding: "24px",
      direction: "rtl",
      fontFamily: "Arial, sans-serif",
      color: text,
      boxSizing: "border-box",
    },
    actionsBar: {
      maxWidth: "1280px",
      margin: "0 auto 18px",
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      justifyContent: "flex-start",
    },
    container: {
      maxWidth: "1280px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    sectionCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    heroHeader: {
      background: `linear-gradient(135deg, ${title}, ${navy})`,
      color: "#fff",
      borderRadius: "24px",
      padding: "24px 26px",
      boxShadow: "0 8px 28px rgba(0,33,93,0.12)",
      display: "grid",
      gridTemplateColumns: "1fr 2fr 1fr",
      alignItems: "center",
      gap: "16px",
    },
    heroMeta: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      alignItems: "flex-start",
      justifySelf: "start",
    },
    heroMetaLabel: {
      fontSize: "12px",
      color: "rgba(255,255,255,0.75)",
    },
    heroMetaValue: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
    },
    heroCenter: {
      textAlign: "center",
    },
    heroEyebrow: {
      fontSize: "13px",
      color: "rgba(255,255,255,0.78)",
      marginBottom: "8px",
    },
    heroTitle: {
      margin: 0,
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#fff",
    },
    heroSubtitle: {
      margin: "12px auto 0",
      maxWidth: "760px",
      fontSize: "14px",
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.9)",
    },
    heroLogoWrap: {
      justifySelf: "end",
    },
    topGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "18px",
    },
    kpiCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "20px",
      minHeight: "188px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    kpiIconWrap: {
      width: "54px",
      height: "54px",
      borderRadius: "16px",
      background: "#F3F5F9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    kpiTitle: {
      fontSize: "14px",
      color: textSoft,
      fontWeight: 700,
      marginBottom: "12px",
    },
    kpiValue: {
      fontSize: "34px",
      lineHeight: 1.1,
      fontWeight: 700,
      color: navy,
      marginBottom: "10px",
    },
    kpiSub: {
      fontSize: "13px",
      color: "#7A8CA8",
      lineHeight: 1.6,
    },
    donutCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "18px",
      minHeight: "188px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    donutTitle: {
      margin: 0,
      color: navy,
      fontSize: "18px",
      fontWeight: 700,
    },
    smallText: {
      fontSize: "12px",
      color: textSoft,
      lineHeight: 1.6,
    },
    donutLayout: {
      display: "grid",
      gridTemplateColumns: "110px 1fr",
      gap: "14px",
      alignItems: "center",
      marginTop: "12px",
    },
    compareGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "18px",
    },
    compareCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "20px",
      minHeight: "210px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    compareTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: navy,
      marginBottom: "8px",
    },
    compareDesc: {
      fontSize: "13px",
      color: textSoft,
      lineHeight: 1.7,
      marginBottom: "18px",
    },
    compareBarList: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    compareBarItem: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    compareBarTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    },
    compareBarLabel: {
      fontSize: "13px",
      color: "#4A5D7A",
      fontWeight: 700,
    },
    compareBarValue: {
      fontSize: "18px",
      color: navy,
      fontWeight: 700,
    },
    compareTrack: {
      width: "100%",
      height: "18px",
      borderRadius: "999px",
      background: softBlue,
      overflow: "hidden",
    },
    compareFillPrimary: {
      height: "100%",
      borderRadius: "999px",
      background: `linear-gradient(90deg, ${cyan}, ${blue})`,
    },
    compareFillMuted: {
      height: "100%",
      borderRadius: "999px",
      background: mutedBar,
    },
    equityCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "20px",
      minHeight: "210px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    },
    equityValueWrap: {
      display: "flex",
      alignItems: "baseline",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    equityValue: {
      fontSize: "34px",
      lineHeight: 1.1,
      fontWeight: 700,
      color: navy,
    },
    equityLabel: {
      fontSize: "14px",
      fontWeight: 700,
      color: textSoft,
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "10px",
    },
    titleWithIcon: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    h2: {
      margin: 0,
      fontSize: "22px",
      color: navy,
      fontWeight: 700,
    },
    explanation: {
      fontSize: "13px",
      color: textSoft,
      lineHeight: 1.7,
      marginBottom: "16px",
    },
    tracksList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    trackItem: {
      border: `1px solid ${divider}`,
      background: surfaceAlt,
      borderRadius: "14px",
      padding: "14px",
    },
    trackTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
      marginBottom: "8px",
      flexWrap: "wrap",
    },
    trackName: {
      fontWeight: 700,
      color: navy,
      fontSize: "14px",
    },
    trackMeta: {
      fontSize: "12px",
      color: textSoft,
      marginTop: "3px",
    },
    trackProgressWrap: {
      width: "100%",
      height: "10px",
      background: "#E6ECF5",
      borderRadius: "999px",
      overflow: "hidden",
      marginTop: "10px",
    },
    trackProgress: {
      height: "100%",
      background: `linear-gradient(90deg, ${purple}, ${blue})`,
      borderRadius: "999px",
    },
    midGrid: {
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr",
      gap: "18px",
      alignItems: "stretch",
    },
    sideStack: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    beneficiariesCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    simpleInfoBox: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "16px",
    },
    infoLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "8px",
    },
    infoValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.5,
    },
    summaryStatsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "14px",
    },
    statCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "14px",
    },
    statLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "20px",
      fontWeight: 700,
      color: navy,
    },
    membersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "18px",
    },
    memberCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
    },
    memberTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "14px",
    },
    memberName: {
      fontSize: "24px",
      fontWeight: 700,
      color: navy,
      marginBottom: "4px",
    },
    chip: {
      display: "inline-block",
      padding: "8px 12px",
      border: `1px solid ${divider}`,
      borderRadius: "999px",
      background: surfaceAlt,
      fontSize: "12px",
      color: "#486581",
      fontWeight: 700,
    },
    centerCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      marginBottom: "12px",
    },
    centerLabel: {
      fontSize: "13px",
      color: textSoft,
      marginBottom: "8px",
    },
    centerValue: {
      fontSize: "28px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.15,
    },
    compareMiniGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    compareMiniCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "14px",
    },
    compareMiniTitle: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "10px",
      fontWeight: 700,
    },
    compareMiniInner: {
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "10px",
      alignItems: "stretch",
    },
    dividerLine: {
      background: divider,
      width: "1px",
    },
    compareMiniSide: {
      textAlign: "center",
    },
    compareMiniSideLabel: {
      fontSize: "11px",
      color: textSoft,
      marginBottom: "6px",
    },
    compareMiniSideValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.2,
    },
    insuranceGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    },
    insuranceCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "12px",
    },
    insuranceLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "6px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    insuranceValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.2,
    },
    loansBenefitsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "18px",
      alignItems: "start",
    },
    emptyState: {
      background: surfaceAlt,
      border: `1px dashed ${border}`,
      borderRadius: "14px",
      padding: "18px",
      fontSize: "13px",
      color: textSoft,
      lineHeight: 1.7,
    },
    loanGroup: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "14px",
      marginTop: "12px",
    },
    loanPersonName: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
      marginBottom: "12px",
    },
    loanSummaryRow: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    loanSummaryCard: {
      background: "#fff",
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "12px",
    },
    loanSummaryLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "6px",
    },
    loanSummaryValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
    },
    loanTableWrap: {
      overflowX: "auto",
      marginTop: "8px",
      borderRadius: "14px",
      border: `1px solid ${divider}`,
      background: "#fff",
    },
    loanTable: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "620px",
      background: "#fff",
    },
    loanTh: {
      textAlign: "right",
      fontSize: "12px",
      color: textSoft,
      borderBottom: `1px solid ${divider}`,
      padding: "12px 10px",
      fontWeight: 700,
      whiteSpace: "nowrap",
      background: "#FAF8F4",
    },
    loanTd: {
      textAlign: "right",
      fontSize: "14px",
      color: text,
      borderBottom: "1px solid #F0E6DA",
      padding: "12px 10px",
      whiteSpace: "nowrap",
    },
    recommendationsWrap: {
      background: "#fff",
      border: `1px solid ${divider}`,
      borderRadius: "18px",
      padding: "18px",
    },
    recommendationsText: {
      width: "100%",
      minHeight: "180px",
      resize: "vertical",
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "16px",
      fontSize: "15px",
      lineHeight: 1.8,
      color: text,
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
      background: "#FFFDFB",
    },
    recommendationsPrintText: {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "15px",
      lineHeight: 1.9,
      color: text,
      background: "#FFFDFB",
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "16px",
      minHeight: "120px",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      fontSize: "11px",
      color: textSoft,
      padding: "0 4px 6px",
      flexWrap: "wrap",
    },
  };

  if (!reportData || !reportData.family) {
    return <div style={{ padding: "40px", direction: "rtl" }}>טוען נתונים...</div>;
  }

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          @media print {
            .no-print {
              display: none !important;
            }

            .print-only {
              display: block !important;
            }

            .screen-only {
              display: none !important;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            .print-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-table-block {
              break-inside: avoid;
              page-break-inside: avoid;
              break-before: auto;
              page-break-before: auto;
            }

            table {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }

            tr,
            td,
            th {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-force-new-page {
              break-before: page;
              page-break-before: always;
            }

            .responsive-grid-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }

            .responsive-grid-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .responsive-grid-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media screen {
            .print-only {
              display: none !important;
            }

            .screen-only {
              display: block !important;
            }
          }

          @media (max-width: 1180px) {
            .responsive-grid-4 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .responsive-grid-3,
            .responsive-grid-2,
            .responsive-mid-grid,
            .responsive-loans-grid,
            .responsive-members-grid {
              grid-template-columns: 1fr !important;
            }

            .responsive-hero {
              grid-template-columns: 1fr !important;
              text-align: center !important;
            }

            .responsive-hero-meta,
            .responsive-hero-logo {
              justify-self: center !important;
              align-items: center !important;
            }
          }

          @media (max-width: 760px) {
            .responsive-mini-grid,
            .responsive-insurance-grid,
            .responsive-loan-summary,
            .responsive-kpi-inner {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div style={styles.page}>
        <div className="no-print" style={styles.actionsBar}>
          <button onClick={onBack} style={buttonSecondary}>
            חזרה למסך העלאה
          </button>
          <button onClick={onResetAll} style={buttonDanger}>
            איפוס מלא
          </button>
          <button onClick={handleExportPdf} style={buttonPrimary}>
            ייצוא ל־PDF
          </button>
        </div>

        <div style={styles.container}>
          <section className="print-section responsive-hero" style={styles.heroHeader}>
            <div className="responsive-hero-meta" style={styles.heroMeta}>
              <div style={styles.heroMetaLabel}>תאריך עדכון</div>
              <div style={styles.heroMetaValue}>{family.lastUpdated || "—"}</div>
            </div>

            <div style={styles.heroCenter}>
              <div style={styles.heroEyebrow}>מסך ראשי · דוח משפחתי מאוחד</div>
              <h1 style={styles.heroTitle}>דוח פנסיוני משפחתי מאוחד</h1>
              <div style={styles.heroSubtitle}>
                ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים
                הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים,
                חשיפה מנייתית, הלוואות, כיסויים ומידע מרכזי לכל אחד מבני
                המשפחה.
              </div>
            </div>

            <div className="responsive-hero-logo" style={styles.heroLogoWrap}>
              <ZviranLogo light />
            </div>
          </section>

          <section
            className="print-section responsive-grid-4"
            style={styles.topGrid}
          >
            <KpiCard
              styles={styles}
              icon={<GiftIcon />}
              title="סך נכסים"
              value={formatCurrency(family.totalAssets)}
              subtext="סך הצבירה הכולל של התא המשפחתי"
            />

            <KpiCard
              styles={styles}
              icon={<WalletIcon />}
              title="הפקדה חודשית"
              value={formatCurrency(family.monthlyDeposits)}
              subtext="סך ההפקדות החודשיות של בני המשפחה"
            />

            <DonutSummaryCard
              title="חלוקה לפי מוצרים"
              subtitle="התפלגות הנכסים בין סוגי החיסכון הקיימים בתיק."
              items={products}
              total={totalProducts}
              colors={[blue, cyan, purple, pink, gold, "#9FD0E6"]}
              styles={styles}
              formatCurrency={formatCurrency}
            />

            <DonutSummaryCard
              title="חלוקה לפי גופים מנהלים"
              subtitle="התפלגות הניהול בין החברות והגופים המנהלים."
              items={managers}
              total={totalManagers}
              colors={[navy, blue, purple, gold, pink, "#9FD0E6"]}
              styles={styles}
              formatCurrency={formatCurrency}
            />
          </section>

          <section
            className="print-section responsive-grid-3"
            style={styles.compareGrid}
          >
            <ComparisonChartCard
              styles={styles}
              title="צבירה צפויה בגיל פרישה"
              explanation="השוואה בין סכום חד פעמי צפוי עם המשך הפקדות לבין ללא המשך הפקדות."
              bars={retirementLumpBars}
            />

            <ComparisonChartCard
              styles={styles}
              title="קצבה חודשית בגיל פרישה"
              explanation="השוואה בין קצבה צפויה עם המשך הפקדות לבין ללא המשך הפקדות."
              bars={retirementPensionBars}
            />

            <section style={styles.equityCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>📊</span>
                  <h2 style={styles.h2}>חשיפה מנייתית משוקללת</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                המדד מחושב על בסיס משקל המסלולים בתיק ואחוז המניות המשוער בכל מסלול.
              </div>

              <div style={styles.equityValueWrap}>
                <div style={styles.equityValue}>
                  {formatPercentLabel(weightedEquityExposure)}
                </div>
                <div style={styles.equityLabel}>{exposureLabel}</div>
              </div>

              <EquityBarModern value={weightedEquityExposure} />
            </section>
          </section>

          <section
            className="print-section responsive-mid-grid"
            style={styles.midGrid}
          >
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>📈</span>
                  <h2 style={styles.h2}>פירוט מסלולי השקעה</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                מוצגת חלוקה לפי מסלולים / אפיקים בדומה לדוח הקיים, בעיצוב
                ברור יותר שמדגיש את גודל המסלול ואת מקומו היחסי בתיק.
              </div>

              <div style={styles.tracksList}>
                {tracks.map((track) => {
                  const portfolioWeight =
                    totalTracks > 0
                      ? Math.round((track.value / totalTracks) * 100)
                      : 0;

                  return (
                    <div key={track.name} style={styles.trackItem}>
                      <div style={styles.trackTop}>
                        <div>
                          <div style={styles.trackName}>{track.name}</div>
                          <div style={styles.trackMeta}>
                            {formatCurrency(track.value)}
                          </div>
                        </div>

                        <div style={{ textAlign: "left" }}>
                          <div style={styles.trackName}>
                            {portfolioWeight}% מהתיק
                          </div>
                          <div style={styles.trackMeta}>
                            {track.equityPercent}% מניות במסלול
                          </div>
                        </div>
                      </div>

                      <div style={styles.trackProgressWrap}>
                        <div
                          style={{
                            ...styles.trackProgress,
                            width: `${portfolioWeight}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {!tracks.length ? (
                  <div style={styles.emptyState}>
                    לא התקבלו מסלולי השקעה להצגה.
                  </div>
                ) : null}
              </div>
            </section>

            <div style={styles.sideStack}>
              <section style={styles.beneficiariesCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.titleWithIcon}>
                    <span>👨‍👩‍👧</span>
                    <h2 style={styles.h2}>מוטבים</h2>
                  </div>
                </div>

                <div style={styles.explanation}>
                  נכון לעכשיו מוצג סטטוס כללי כפי שהתקבל בנתונים, ללא שינוי בלוגיקה.
                </div>

                <div style={styles.simpleInfoBox}>
                  <div style={styles.infoLabel}>סטטוס כללי</div>
                  <div style={styles.infoValue}>{beneficiaries.summary}</div>
                </div>
              </section>

              <section style={styles.beneficiariesCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.titleWithIcon}>
                    <span>🧾</span>
                    <h2 style={styles.h2}>סיכום מהיר</h2>
                  </div>
                </div>

                <div style={styles.summaryStatsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>מוצרים</div>
                    <div style={styles.statValue}>{products.length}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>גופים מנהלים</div>
                    <div style={styles.statValue}>{managers.length}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>מסלולי השקעה</div>
                    <div style={styles.statValue}>{tracks.length}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>בני משפחה</div>
                    <div style={styles.statValue}>{members.length}</div>
                  </div>
                </div>

                <div style={styles.simpleInfoBox}>
                  <div style={styles.infoLabel}>יחס הלוואות לנכסים</div>
                  <div style={styles.infoValue}>{loanRatioToAssets.toFixed(1)}%</div>
                </div>
              </section>
            </div>
          </section>

          <section className="print-section" style={styles.sectionCard}>
            <h2 style={styles.h2}>פירוט לפי בני משפחה</h2>
            <div style={styles.explanation}>
              מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל קצבה, סכום חד
              פעמי, ביטוח חיים ואובדן כושר עבודה.
            </div>

            <div
              className="responsive-members-grid"
              style={styles.membersGrid}
            >
              {members.map((member) => (
                <div key={member.name} style={styles.memberCard}>
                  <div style={styles.memberTop}>
                    <div>
                      <div style={styles.memberName}>{member.name}</div>
                    </div>

                    <div style={styles.chip}>
                      הפקדה חודשית: {formatCurrency(member.monthlyDeposits)}
                    </div>
                  </div>

                  <div style={styles.centerCard}>
                    <div style={styles.centerLabel}>סך צבירה</div>
                    <div style={styles.centerValue}>
                      {formatCurrency(member.assets)}
                    </div>
                  </div>

                  <div
                    className="responsive-mini-grid"
                    style={styles.compareMiniGrid}
                  >
                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>
                        קצבה חודשית צפויה
                      </div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>
                            עם הפקדות
                          </div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.monthlyPensionWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.dividerLine} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>
                            ללא הפקדות
                          </div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(
                              member.monthlyPensionWithoutDeposits
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>
                        סכום חד הוני לפרישה
                      </div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>
                            עם הפקדות
                          </div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.dividerLine} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>
                            ללא הפקדות
                          </div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="responsive-insurance-grid"
                    style={styles.insuranceGrid}
                  >
                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🛡️ ביטוח חיים</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.deathCoverage)}
                      </div>
                    </div>

                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🧍 אובדן כושר עבודה</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.disabilityValue)} (
                        {member.disabilityPercent}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!members.length ? (
                <div style={styles.emptyState}>לא התקבל פירוט בני משפחה להצגה.</div>
              ) : null}
            </div>
          </section>

          <section
            className="print-section responsive-loans-grid"
            style={styles.loansBenefitsGrid}
          >
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>💳</span>
                  <h2 style={styles.h2}>הלוואות על חשבון מוצרים פנסיוניים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                פירוט הלוואות לפי אדם עם סיכום כולל ויחס לנכסים.
              </div>

              {hasDetailedLoans ? (
                <>
                  {Object.entries(groupedLoans).map(([personName, personLoans]) => {
                    const totalAmount = personLoans.reduce(
                      (sum, loan) => sum + (loan.amount || 0),
                      0
                    );
                    const totalBalance = personLoans.reduce(
                      (sum, loan) => sum + (loan.balance || 0),
                      0
                    );

                    return (
                      <div
                        className="print-table-block"
                        key={personName}
                        style={styles.loanGroup}
                      >
                        <div style={styles.loanPersonName}>{personName}</div>

                        <div
                          className="responsive-loan-summary"
                          style={styles.loanSummaryRow}
                        >
                          <div style={styles.loanSummaryCard}>
                            <div style={styles.loanSummaryLabel}>
                              סך סכום הלוואות
                            </div>
                            <div style={styles.loanSummaryValue}>
                              {formatCurrency(totalAmount)}
                            </div>
                          </div>

                          <div style={styles.loanSummaryCard}>
                            <div style={styles.loanSummaryLabel}>
                              יתרת הלוואות
                            </div>
                            <div style={styles.loanSummaryValue}>
                              {formatCurrency(totalBalance)}
                            </div>
                          </div>
                        </div>

                        <div
                          className="print-table-block"
                          style={styles.loanTableWrap}
                        >
                          <table style={styles.loanTable}>
                            <thead>
                              <tr>
                                <th style={styles.loanTh}>סכום הלוואה</th>
                                <th style={styles.loanTh}>תדירות החזר</th>
                                <th style={styles.loanTh}>יתרת הלוואה</th>
                                <th style={styles.loanTh}>תאריך סיום</th>
                              </tr>
                            </thead>
                            <tbody>
                              {personLoans.map((loan) => (
                                <tr key={loan.id}>
                                  <td style={styles.loanTd}>
                                    {formatCurrency(loan.amount)}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {loan.repaymentFrequency || "—"}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {formatCurrency(loan.balance)}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {formatDate(loan.endDate)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className="print-table-block"
                    style={{ ...styles.loanGroup, marginTop: "16px" }}
                  >
                    <div
                      className="responsive-loan-summary"
                      style={styles.loanSummaryRow}
                    >
                      <div style={styles.loanSummaryCard}>
                        <div style={styles.loanSummaryLabel}>סה"כ הלוואות</div>
                        <div style={styles.loanSummaryValue}>
                          {formatCurrency(totalLoansAmount)}
                        </div>
                      </div>

                      <div style={styles.loanSummaryCard}>
                        <div style={styles.loanSummaryLabel}>יחס לנכסים</div>
                        <div style={styles.loanSummaryValue}>
                          {loanRatioToAssets.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : !loans.hasData ? (
                <div style={styles.emptyState}>
                  לא התקבל מידע על הלוואות בשני הקבצים שהועלו.
                </div>
              ) : (
                <div style={styles.emptyState}>
                  התקבל סטטוס הלוואות, אבל לא הגיע פירוט מלא להצגה.
                </div>
              )}
            </section>
          </section>

          <section className="print-section" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>📝</span>
                <h2 style={styles.h2}>המלצות</h2>
              </div>
            </div>

            <div style={styles.explanation}>
              כאן אפשר להוסיף תובנות, מסקנות, פעולות מומלצות, נקודות לשיחה עם
              הלקוח, או כל מלל חופשי שתרצה להציג כחלק מהדוח.
            </div>

            <div style={styles.recommendationsWrap}>
              <div className="screen-only">
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  style={styles.recommendationsText}
                  placeholder="כתוב כאן המלצות אישיות..."
                />
              </div>

              <div className="print-only" style={styles.recommendationsPrintText}>
                {recommendations}
              </div>
            </div>
          </section>

          <div style={styles.footer}>
            <div>Zviran · Total Rewards Experts</div>
            <div>דוח זה הופק לצורך הצגה והדפסה מתוך המערכת</div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({ styles, icon, title, value, subtext }) {
  return (
    <div style={styles.kpiCard}>
      <div
        className="responsive-kpi-inner"
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div style={styles.kpiIconWrap}>{icon}</div>

        <div style={{ textAlign: "right" }}>
          <div style={styles.kpiTitle}>{title}</div>
          <div style={styles.kpiValue}>{value}</div>
          <div style={styles.kpiSub}>{subtext}</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonChartCard({ styles, title, explanation, bars }) {
  return (
    <div style={styles.compareCard}>
      <div style={styles.compareTitle}>{title}</div>
      <div style={styles.compareDesc}>{explanation}</div>

      <div style={styles.compareBarList}>
        {bars.map((bar) => (
          <div key={bar.label} style={styles.compareBarItem}>
            <div style={styles.compareBarTop}>
              <div style={styles.compareBarLabel}>{bar.label}</div>
              <div style={styles.compareBarValue}>{bar.display}</div>
            </div>

            <div style={styles.compareTrack}>
              <div
                style={{
                  ...(bar.tone === "primary"
                    ? styles.compareFillPrimary
                    : styles.compareFillMuted),
                  width: `${Math.max(bar.ratio, 6)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquityBarModern({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div style={{ paddingTop: "6px" }}>
      <div
        style={{
          position: "relative",
          height: "16px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, #E6F7EF 0%, #EAF1FB 40%, #D8E8F8 75%, #B9D5EF 100%)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #43B5D9 0%, #1F77B4 100%)",
            boxShadow: "0 1px 3px rgba(31,119,180,0.25)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: `calc(${safeValue}% - 10px)`,
            top: "-4px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#0D347A",
            border: "3px solid #fff",
            boxShadow: "0 4px 12px rgba(13,52,122,0.18)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "12px",
          color: "#627D98",
          direction: "ltr",
        }}
      >
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function DonutSummaryCard({
  title,
  subtitle,
  items,
  total,
  colors,
  styles,
  formatCurrency,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotal =
    total || safeItems.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  let current = 0;
  const segments = safeItems.map((item, index) => {
    const percent = ((item.value || 0) / safeTotal) * 100;
    const start = current;
    const end = current + percent;
    current = end;

    return {
      ...item,
      percent: Math.round(percent),
      start,
      end,
      color: colors[index % colors.length],
    };
  });

  const gradient =
    segments.length > 0
      ? segments
          .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
          .join(", ")
      : "#D7DEE7 0% 100%";

  return (
    <section style={styles.donutCard}>
      <h3 style={styles.donutTitle}>{title}</h3>
      <div style={{ ...styles.smallText, marginTop: "6px" }}>{subtitle}</div>

      <div style={styles.donutLayout}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              background: `conic-gradient(${gradient})`,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "15px",
                background: "#fff",
                borderRadius: "50%",
                border: "1px solid #E5D9CB",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {segments.length ? (
            segments.slice(0, 5).map((seg, index) => (
              <div
                key={`${seg.name || "item"}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "10px 1fr auto",
                  gap: "8px",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: seg.color,
                    display: "inline-block",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#102A43",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {seg.name}
                  </div>
                  <div
                    style={{
                      color: "#627D98",
                      fontSize: "11px",
                      marginTop: "2px",
                    }}
                  >
                    {formatCurrency(seg.value)}
                  </div>
                </div>
                <div style={{ color: "#102A43", fontWeight: 700 }}>
                  {seg.percent}%
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...styles.smallText, marginTop: "4px" }}>
              אין נתונים להצגה
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ZviranLogo({ light = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        direction: "ltr",
        justifyContent: light ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: light ? "rgba(255,255,255,0.14)" : "#0A2668",
          border: light ? "1px solid rgba(255,255,255,0.25)" : "none",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "24px",
            height: "8px",
            background: "#ff4b78",
            borderRadius: "999px",
            top: "15px",
            left: "16px",
            transform: "rotate(-35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "24px",
            height: "8px",
            background: "#ffffff",
            borderRadius: "999px",
            top: "24px",
            left: "12px",
            transform: "rotate(-35deg)",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 300,
            letterSpacing: "-1px",
            color: light ? "#fff" : "#0A2668",
          }}
        >
          zviran
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: light ? "rgba(255,255,255,0.8)" : "#6B7A99",
            letterSpacing: "0.4px",
          }}
        >
          Total Rewards Experts
        </div>
      </div>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="16" height="12" rx="2" stroke="#12B76A" strokeWidth="2" />
      <path d="M19 9H21V15H19" stroke="#12B76A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="13" rx="2" stroke="#00215D" strokeWidth="2" />
      <path d="M12 7V20" stroke="#00215D" strokeWidth="2" />
      <path d="M4 11H20" stroke="#00215D" strokeWidth="2" />
      <path d="M9 7C7.8 7 7 6.2 7 5C7 3.8 7.8 3 9 3C10.8 3 12 5 12 7" stroke="#00215D" strokeWidth="2" />
      <path d="M15 7C16.2 7 17 6.2 17 5C17 3.8 16.2 3 15 3C13.2 3 12 5 12 7" stroke="#00215D" strokeWidth="2" />
    </svg>
  );
}

const buttonPrimary = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonSecondary = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonDanger = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #ef4444",
  background: "#fff",
  color: "#ef4444",
  fontWeight: "bold",
  cursor: "pointer",
};