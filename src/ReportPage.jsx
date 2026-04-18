// src/ReportPage.jsx

import React, { useMemo, useState } from "react";

export default function ReportPage({ reportData, onBack, onResetAll }) {
  const [recommendations, setRecommendations] = useState(
    `1. מומלץ לבחון את הפער בין הקצבה הצפויה עם המשך הפקדות לבין ללא המשך הפקדות.
2. מומלץ לבדוק האם יש ריכוז יתר במוצרים או בגופים מנהלים מסוימים.
3. מומלץ לעבור על הכיסויים הביטוחיים ולוודא שהם מתאימים לצרכים המשפחתיים.
4. מומלץ לבחון את מדיניות ההשקעה ורמת החשיפה למניות בהתאם לפרופיל הסיכון הרצוי.`
  );

  if (!reportData || !reportData.family) {
    return <div style={{ padding: "40px", direction: "rtl" }}>טוען נתונים...</div>;
  }

  const handleExportPdf = () => {
    window.print();
  };

  const {
    family,
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
  } = reportData;

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
    family.totalAssets > 0 ? (totalLoansAmount / family.totalAssets) * 100 : 0;

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

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#F9F7F3",
      padding: "24px",
      direction: "rtl",
      fontFamily: "Arial, sans-serif",
      color: "#102A43",
      boxSizing: "border-box",
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "22px",
    },
    section: {
      background: "#FFFFFF",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0, 33, 93, 0.04)",
    },
    h1: {
      margin: 0,
      fontSize: "30px",
      fontWeight: 700,
      color: "#00215D",
      textAlign: "center",
    },
    h2: {
      margin: 0,
      fontSize: "24px",
      fontWeight: 700,
      color: "#00215D",
    },
    topLine: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
      gap: "12px",
      flexWrap: "wrap",
    },
    small: {
      fontSize: "13px",
      color: "#627D98",
    },
    centerText: {
      textAlign: "center",
    },
    subtitle: {
      fontSize: "14px",
      color: "#486581",
      textAlign: "center",
      maxWidth: "760px",
      margin: "10px auto 0",
      lineHeight: 1.8,
    },
    explanation: {
      fontSize: "13px",
      color: "#627D98",
      marginTop: "8px",
      marginBottom: "16px",
      lineHeight: 1.7,
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    },
    titleWithIcon: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "24px",
    },
    kpiCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "20px",
      display: "grid",
      gridTemplateColumns: "64px 1fr",
      alignItems: "center",
      gap: "16px",
      boxShadow: "0 2px 10px rgba(0,33,93,0.04)",
    },
    kpiIconWrap: {
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: "#F3F5F9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    kpiTitle: {
      fontSize: "14px",
      color: "#6B7A99",
      marginBottom: "10px",
      fontWeight: 700,
    },
    kpiValue: {
      fontSize: "30px",
      fontWeight: 700,
      color: "#00215D",
      lineHeight: 1.1,
      marginBottom: "8px",
    },
    kpiSub: {
      fontSize: "13px",
      color: "#7A8CA8",
    },
    compareCard: {
      background: "#FFFFFF",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0,33,93,0.04)",
    },
    compareTitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#00215D",
      marginBottom: "8px",
    },
    compareDesc: {
      fontSize: "13px",
      color: "#627D98",
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
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    compareBarLabel: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#4A5D7A",
    },
    compareBarValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
    },
    compareTrack: {
      width: "100%",
      height: "18px",
      background: "#EEF2F7",
      borderRadius: "999px",
      overflow: "hidden",
    },
    compareFillPrimary: {
      height: "100%",
      background: "#00215D",
      borderRadius: "999px",
    },
    compareFillMuted: {
      height: "100%",
      background: "#B9C3D8",
      borderRadius: "999px",
    },
    chartSectionGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "24px",
    },
    equityCard: {
      background: "#FFFFFF",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "24px 20px 20px",
      boxShadow: "0 2px 10px rgba(0,33,93,0.04)",
    },
    equityValueWrap: {
      display: "flex",
      alignItems: "baseline",
      gap: "12px",
      marginBottom: "18px",
      flexWrap: "wrap",
    },
    equityValue: {
      fontSize: "34px",
      fontWeight: 700,
      color: "#00215D",
      lineHeight: 1.1,
    },
    equityLabel: {
      fontSize: "14px",
      color: "#627D98",
      fontWeight: 700,
    },
    tracksList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginTop: "18px",
    },
    trackItem: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "14px",
      padding: "14px",
    },
    trackTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
      marginBottom: "8px",
    },
    trackName: {
      fontWeight: 700,
      color: "#00215D",
      fontSize: "14px",
    },
    trackMeta: {
      fontSize: "12px",
      color: "#627D98",
    },
    trackProgressWrap: {
      width: "100%",
      height: "8px",
      background: "#E9EEF5",
      borderRadius: "999px",
      overflow: "hidden",
      marginTop: "8px",
    },
    trackProgress: {
      height: "100%",
      background: "#4B5FA3",
      borderRadius: "999px",
    },
    membersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "24px",
    },
    memberCard: {
      background: "#FFFFFF",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 2px 10px rgba(0,33,93,0.04)",
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
      color: "#00215D",
      marginBottom: "4px",
    },
    chip: {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid #E2D1BF",
      borderRadius: "999px",
      background: "#fff",
      fontSize: "12px",
      color: "#486581",
      fontWeight: 700,
    },
    centerCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      marginBottom: "12px",
    },
    centerLabel: {
      fontSize: "13px",
      color: "#627D98",
      marginBottom: "8px",
    },
    centerValue: {
      fontSize: "26px",
      fontWeight: 700,
      color: "#00215D",
    },
    compareMiniGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    compareMiniCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "16px",
      padding: "14px",
    },
    compareMiniTitle: {
      fontSize: "12px",
      color: "#627D98",
      marginBottom: "10px",
    },
    compareMiniInner: {
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "10px",
      alignItems: "stretch",
    },
    divider: {
      background: "#E2D1BF",
      width: "1px",
    },
    compareMiniSide: {
      textAlign: "center",
    },
    compareMiniSideLabel: {
      fontSize: "11px",
      color: "#627D98",
      marginBottom: "6px",
    },
    compareMiniSideValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
      lineHeight: 1.2,
    },
    insuranceGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    },
    insuranceCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "14px",
      padding: "12px",
    },
    insuranceLabel: {
      fontSize: "12px",
      color: "#627D98",
      marginBottom: "6px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    insuranceValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
      lineHeight: 1.2,
    },
    loansBenefitsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "24px",
      alignItems: "start",
    },
    emptyState: {
      background: "#F9F7F3",
      border: "1px dashed #C9B8A5",
      borderRadius: "14px",
      padding: "18px",
      fontSize: "13px",
      color: "#627D98",
      lineHeight: 1.7,
    },
    loanGroup: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "16px",
      padding: "14px",
      marginTop: "12px",
    },
    loanPersonName: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
      marginBottom: "12px",
    },
    loanSummaryRow: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    loanSummaryCard: {
      background: "#F9F7F3",
      border: "1px solid #E2D1BF",
      borderRadius: "14px",
      padding: "12px",
    },
    loanSummaryLabel: {
      fontSize: "12px",
      color: "#627D98",
      marginBottom: "6px",
    },
    loanSummaryValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
    },
    loanTableWrap: {
      overflowX: "auto",
      marginTop: "8px",
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
      color: "#627D98",
      borderBottom: "1px solid #E2D1BF",
      padding: "10px 8px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    loanTd: {
      textAlign: "right",
      fontSize: "14px",
      color: "#102A43",
      borderBottom: "1px solid #F0E6DA",
      padding: "12px 8px",
      whiteSpace: "nowrap",
    },
    beneficiariesCard: {
      background: "#FFFFFF",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0,33,93,0.04)",
      minHeight: "200px",
    },
    recommendationsWrap: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "18px",
    },
    recommendationsText: {
      width: "100%",
      minHeight: "180px",
      resize: "vertical",
      border: "1px solid #D9C8B5",
      borderRadius: "14px",
      padding: "16px",
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#102A43",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
      background: "#fffdfb",
    },
    recommendationsPrintText: {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "15px",
      lineHeight: 1.9,
      color: "#102A43",
      background: "#fffdfb",
      border: "1px solid #D9C8B5",
      borderRadius: "14px",
      padding: "16px",
      minHeight: "120px",
    },
  };

  return (
    <>
      <style>
        {`
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
            }

            @page {
              size: A4 landscape;
              margin: 12mm;
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
          }

          @media screen {
            .print-only {
              display: none !important;
            }

            .screen-only {
              display: block !important;
            }
          }
        `}
      </style>

      <div style={styles.page}>
        <div
          className="no-print"
          style={{
            maxWidth: "1200px",
            margin: "0 auto 16px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
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
          <section className="print-section" style={styles.section}>
            <div style={styles.topLine}>
              <div style={styles.small}>מעודכן ל{family.lastUpdated}</div>
              <ZviranLogo />
            </div>

            <div style={{ ...styles.small, ...styles.centerText }}>
              מסך ראשי · דוח משפחתי מאוחד
            </div>

            <h1 style={styles.h1}>דוח פנסיוני משפחתי מאוחד</h1>

            <p style={styles.subtitle}>
              ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים
              הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים, חשיפה
              מנייתית, הלוואות, ומידע מרכזי לכל אחד מבני המשפחה.
            </p>
          </section>

          <section
            className="print-section"
            style={{ background: "transparent", padding: 0, boxShadow: "none", border: "none" }}
          >
            <div style={styles.grid2}>
              <KpiCard
                styles={styles}
                icon={<GiftIcon />}
                title="סך נכסים"
                value={formatCurrency(family.totalAssets)}
                subtext="סך הצבירה הכולל"
              />

              <KpiCard
                styles={styles}
                icon={<WalletIcon />}
                title="הפקדה חודשית"
                value={formatCurrency(family.monthlyDeposits)}
                subtext="סך הפקדות חודשיות"
              />
            </div>
          </section>

          <section
            className="print-section"
            style={{ background: "transparent", padding: 0, boxShadow: "none", border: "none" }}
          >
            <div style={styles.grid2}>
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
            </div>
          </section>

          <section className="print-section" style={styles.chartSectionGrid}>
            <PieCard
              title="חלוקה לפי מוצרים"
              explanation="החלוקה לפי מוצרים מסייעת להבין באילו סוגי חיסכון מנוהל עיקר הכסף המשפחתי."
              items={products}
              total={totalProducts}
              styles={styles}
              formatCurrency={formatCurrency}
            />

            <PieCard
              title="חלוקה לפי גופים מנהלים"
              explanation="החלוקה לפי גופים מנהלים מציגה היכן מרוכז הניהול של הנכסים המשפחתיים."
              items={managers}
              total={totalManagers}
              styles={styles}
              formatCurrency={formatCurrency}
            />
          </section>

          <section className="print-section" style={styles.equityCard}>
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
              <div style={styles.equityValue}>{formatPercentLabel(weightedEquityExposure)}</div>
              <div style={styles.equityLabel}>{exposureLabel}</div>
            </div>

            <EquityBar3D value={weightedEquityExposure} />
          </section>

          <section className="print-section" style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>📈</span>
                <h2 style={styles.h2}>פירוט מסלולי השקעה</h2>
              </div>
            </div>

            <div style={styles.explanation}>
              מוצגת חלוקה לפי מסלולים / אפיקים בדומה לדוח הקיים, בעיצוב מודרני יותר.
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
            </div>
          </section>

          <section className="print-section" style={styles.section}>
            <h2 style={styles.h2}>פירוט לפי בני משפחה</h2>
            <div style={styles.explanation}>
              מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל קצבה, סכום חד פעמי,
              ביטוח חיים ואובדן כושר עבודה.
            </div>

            <div style={styles.membersGrid}>
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

                  <div style={styles.compareMiniGrid}>
                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>קצבה חודשית צפויה</div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>עם הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.monthlyPensionWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.monthlyPensionWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>סכום חד הוני לפרישה</div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>עם הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.insuranceGrid}>
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
            </div>
          </section>

          <section
            className="print-section"
            style={{ background: "transparent", padding: 0, boxShadow: "none", border: "none" }}
          >
            <div style={styles.loansBenefitsGrid}>
              <section className="print-section" style={styles.section}>
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
                        <div className="print-table-block" key={personName} style={styles.loanGroup}>
                          <div style={styles.loanPersonName}>{personName}</div>

                          <div style={styles.loanSummaryRow}>
                            <div style={styles.loanSummaryCard}>
                              <div style={styles.loanSummaryLabel}>סך סכום הלוואות</div>
                              <div style={styles.loanSummaryValue}>
                                {formatCurrency(totalAmount)}
                              </div>
                            </div>

                            <div style={styles.loanSummaryCard}>
                              <div style={styles.loanSummaryLabel}>יתרת הלוואות</div>
                              <div style={styles.loanSummaryValue}>
                                {formatCurrency(totalBalance)}
                              </div>
                            </div>
                          </div>

                          <div className="print-table-block" style={styles.loanTableWrap}>
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

                    <div className="print-table-block" style={{ ...styles.loanGroup, marginTop: "16px" }}>
                      <div style={styles.loanSummaryRow}>
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

              <section className="print-section" style={styles.beneficiariesCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.titleWithIcon}>
                    <span>👨‍👩‍👧</span>
                    <h2 style={styles.h2}>מוטבים</h2>
                  </div>
                </div>

                <div style={styles.explanation}>
                  נכון לעכשיו מוצג רק סטטוס המוטבים, ללא מידע ביטוחי נוסף.
                </div>

                <div
                  style={{
                    background: "#F9F7F3",
                    border: "1px solid #E2D1BF",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={styles.small}>סטטוס כללי</div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#00215D",
                      marginTop: "8px",
                      lineHeight: 1.5,
                    }}
                  >
                    {beneficiaries.summary}
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section className="print-section" style={styles.section}>
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
        </div>
      </div>
    </>
  );
}

function KpiCard({ styles, icon, title, value, subtext }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiIconWrap}>{icon}</div>

      <div style={{ textAlign: "right" }}>
        <div style={styles.kpiTitle}>{title}</div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={styles.kpiSub}>{subtext}</div>
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

function EquityBar3D({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div style={{ paddingTop: "8px" }}>
      <div
        style={{
          position: "relative",
          height: "24px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, #12B76A 0%, #F59E0B 50%, #EF2756 100%)",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 -1px 2px rgba(255,255,255,0.25), 0 2px 6px rgba(0,33,93,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `calc(${safeValue}% - 10px)`,
            top: "-10px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#00215D",
            boxShadow:
              "0 4px 10px rgba(0,33,93,0.22), inset 0 1px 1px rgba(255,255,255,0.22)",
            border: "2px solid #fff",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `calc(${safeValue}% - 2px)`,
            top: "20px",
            width: "4px",
            height: "12px",
            background: "#00215D",
            borderRadius: "2px",
            opacity: 0.9,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
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

function PieCard({ title, explanation, items, total, styles, formatCurrency }) {
  const colors = ["#00215D", "#355C9A", "#7A92B8", "#E2D1BF", "#EF2756", "#A8B8D8"];

  let current = 0;
  const safeTotal = total || 1;

  const segments = items.map((item, index) => {
    const percent = (item.value / safeTotal) * 100;
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

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(", ");

  return (
    <section style={styles.section}>
      <div style={styles.titleWithIcon}>
        <span>🥧</span>
        <h2 style={styles.h2}>{title}</h2>
      </div>

      <div style={styles.explanation}>{explanation}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "190px 1fr",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: `conic-gradient(${gradient})`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "34px",
                background: "#fff",
                borderRadius: "50%",
                border: "1px solid #E2D1BF",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {segments.map((seg) => (
            <div
              key={seg.name}
              style={{
                background: "#fff",
                border: "1px solid #E2D1BF",
                borderRadius: "14px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "999px",
                      display: "inline-block",
                      flexShrink: 0,
                      background: seg.color,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#00215D",
                        fontSize: "14px",
                      }}
                    >
                      {seg.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#627D98",
                        marginTop: "2px",
                      }}
                    >
                      {formatCurrency(seg.value)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: "#00215D",
                    fontSize: "14px",
                  }}
                >
                  {seg.percent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ZviranLogo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        direction: "ltr",
      }}
    >
      <div
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "#0A2668",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "26px",
            height: "8px",
            background: "#ff4b78",
            borderRadius: "999px",
            top: "16px",
            left: "17px",
            transform: "rotate(-35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "26px",
            height: "8px",
            background: "#ffffff",
            borderRadius: "999px",
            top: "25px",
            left: "12px",
            transform: "rotate(-35deg)",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div
          style={{
            fontSize: "44px",
            fontWeight: 300,
            letterSpacing: "-1px",
            color: "#0A2668",
          }}
        >
          zviran
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "14px",
            color: "#6B7A99",
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