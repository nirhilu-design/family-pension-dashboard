// src/ReportPage.jsx

import React, { useState } from "react";

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
    loans = { hasData: false },
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
    const personName = [loan.firstName, loan.familyName].filter(Boolean).join(" ").trim() || "ללא שיוך";
    if (!acc[personName]) {
      acc[personName] = [];
    }
    acc[personName].push(loan);
    return acc;
  }, {});

  const hasDetailedLoans = normalizedLoanDetails.length > 0;

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
      maxWidth: "1120px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "22px",
    },
    section: {
      background: "#ffffff",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0, 33, 93, 0.04)",
    },
    hero: {
      background: "linear-gradient(180deg, #0A2668 0%, #00215D 100%)",
      color: "#fff",
      borderRadius: "18px",
      padding: "28px 24px",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 22px rgba(0,33,93,0.14)",
    },
    lightCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0,33,93,0.03)",
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
    heroLabel: {
      fontSize: "14px",
      color: "#D9E2EC",
      marginBottom: "10px",
      textAlign: "center",
    },
    heroValue: {
      fontSize: "40px",
      fontWeight: 700,
      textAlign: "center",
      lineHeight: 1.1,
      marginBottom: "8px",
    },
    heroSub: {
      fontSize: "13px",
      color: "#D9E2EC",
      textAlign: "center",
    },
    explanation: {
      fontSize: "13px",
      color: "#627D98",
      marginTop: "8px",
      marginBottom: "16px",
      lineHeight: 1.7,
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "18px",
    },
    softCard: {
      background: "#F9F7F3",
      border: "1px solid #E2D1BF",
      borderRadius: "18px",
      padding: "16px",
    },
    label: {
      fontSize: "13px",
      color: "#627D98",
      marginBottom: "10px",
    },
    value: {
      fontSize: "28px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#00215D",
    },
    valueDark: {
      fontSize: "28px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#fff",
    },
    sub: {
      fontSize: "13px",
      color: "#627D98",
      marginTop: "6px",
    },
    subDark: {
      fontSize: "13px",
      color: "#D9E2EC",
      marginTop: "6px",
    },
    splitTop: {
      borderTop: "1px solid #E2D1BF",
      marginTop: "18px",
      paddingTop: "18px",
    },
    splitTopDark: {
      borderTop: "1px solid rgba(255,255,255,0.18)",
      marginTop: "18px",
      paddingTop: "18px",
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
      fontSize: "22px",
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
    compareGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    compareCard: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "16px",
      padding: "14px",
    },
    compareTitle: {
      fontSize: "12px",
      color: "#627D98",
      marginBottom: "10px",
    },
    compareInner: {
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "10px",
      alignItems: "stretch",
    },
    divider: {
      background: "#E2D1BF",
      width: "1px",
    },
    compareSide: {
      textAlign: "center",
    },
    compareSideLabel: {
      fontSize: "11px",
      color: "#627D98",
      marginBottom: "6px",
    },
    compareSideValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#00215D",
      lineHeight: 1.2,
    },
    insuranceTitle: {
      fontSize: "13px",
      color: "#627D98",
      marginBottom: "8px",
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
    legendBox: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    legendItem: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "14px",
      padding: "12px",
    },
    legendRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
    },
    legendLeft: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    legendDot: {
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      display: "inline-block",
      flexShrink: 0,
    },
    legendName: {
      fontWeight: 700,
      color: "#00215D",
      fontSize: "14px",
    },
    legendValue: {
      fontSize: "12px",
      color: "#627D98",
      marginTop: "2px",
    },
    legendPercent: {
      fontWeight: 700,
      color: "#00215D",
      fontSize: "14px",
    },
    riskBarWrap: {
      position: "relative",
      height: "22px",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, #22c55e 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)",
      boxShadow:
        "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 -1px 2px rgba(255,255,255,0.25), 0 2px 6px rgba(0,33,93,0.08)",
      overflow: "hidden",
    },
    riskBarHighlight: {
      position: "absolute",
      inset: "0 0 auto 0",
      height: "50%",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
    },
    riskScale: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "8px",
      fontSize: "12px",
      color: "#627D98",
      direction: "ltr",
    },
    riskValue: {
      marginTop: "12px",
      fontWeight: 700,
      fontSize: "16px",
      color: "#00215D",
    },
    markerLabel: {
      position: "absolute",
      top: "-34px",
      transform: "translateX(-50%)",
      background: "#00215D",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 700,
      padding: "4px 8px",
      borderRadius: "999px",
      boxShadow: "0 4px 10px rgba(0,33,93,0.18)",
      whiteSpace: "nowrap",
    },
    trackList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginTop: "18px",
    },
    trackItem: {
      background: "#fff",
      border: "1px solid #E2D1BF",
      borderRadius: "14px",
      padding: "12px",
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
      marginTop: "6px",
    },
    trackProgress: {
      height: "100%",
      background: "#355C9A",
      borderRadius: "999px",
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
  };

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
            }
          }
        `}
      </style>

      <div style={styles.page}>
        <div
          className="no-print"
          style={{
            maxWidth: "1120px",
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
          <section style={styles.section}>
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
              הפנסיוניים, הקצבה הצפויה, הסכומים ההוניים, הפיזור בין מוצרים
              וגופים מנהלים, והמידע הביטוחי המרכזי מתוך שני הדוחות.
            </p>
          </section>

          <section style={styles.section}>
            <div style={styles.hero}>
              <div style={styles.heroLabel}>💰 סך צבירה משפחתית</div>
              <div style={styles.heroValue}>{formatCurrency(family.totalAssets)}</div>
              <div style={styles.heroSub}>סך הצבירה הכולל של כלל הנכסים</div>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.hero}>
              <div style={styles.heroLabel}>💸 הפקדה חודשית משפחתית</div>
              <div style={styles.heroValue}>
                {formatCurrency(family.monthlyDeposits)}
              </div>
              <div style={styles.heroSub}>
                סך ההפקדות החודשיות שנקלטו משני הדוחות
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>תחזית פרישה משפחתית</h2>
            <div style={styles.explanation}>
              התחזית מציגה את הקצבה והסכום ההוני הצפויים לגיל הפרישה, עם השוואה
              בין תרחיש של המשך הפקדות לבין תרחיש ללא המשך הפקדות.
            </div>

            <div style={styles.grid2}>
              <div style={styles.hero}>
                <div style={styles.heroLabel}>עם המשך הפקדות</div>
                <div style={styles.valueDark}>
                  {formatCurrency(family.monthlyPensionWithDeposits)}
                </div>
                <div style={styles.subDark}>קצבה חודשית צפויה</div>

                <div style={styles.splitTopDark}>
                  <div style={{ ...styles.valueDark, fontSize: "22px" }}>
                    {formatCurrency(family.projectedLumpSumWithDeposits)}
                  </div>
                  <div style={styles.subDark}>סכום חד הוני לפרישה</div>
                </div>
              </div>

              <div style={styles.lightCard}>
                <div style={styles.label}>ללא המשך הפקדות</div>
                <div style={styles.value}>
                  {formatCurrency(family.monthlyPensionWithoutDeposits)}
                </div>
                <div style={styles.sub}>קצבה חודשית צפויה</div>

                <div style={styles.splitTop}>
                  <div style={{ ...styles.value, fontSize: "22px" }}>
                    {formatCurrency(family.projectedLumpSumWithoutDeposits)}
                  </div>
                  <div style={styles.sub}>סכום חד הוני לפרישה</div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.small, marginTop: "12px" }}>
              {family.retirementAgeLabel}
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>פירוט לפי בני זוג</h2>
            <div style={styles.explanation}>
              להלן הנתונים המרכזיים של כל אחד מבני הזוג בנפרד, כדי לאפשר מבט
              ברור גם ברמה האישית ולא רק ברמה המשפחתית.
            </div>

            <div style={styles.grid2}>
              {members.map((member) => (
                <div key={member.name} style={styles.softCard}>
                  <div style={styles.memberTop}>
                    <div>
                      <div style={styles.memberName}>{member.name}</div>
                      <div style={styles.small}>
                        חלק יחסי מהצבירה המשפחתית: {member.shareOfFamilyAssets}%
                      </div>
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

                  <div style={styles.compareGrid}>
                    <div style={styles.compareCard}>
                      <div style={styles.compareTitle}>קצבה חודשית צפויה</div>
                      <div style={styles.compareInner}>
                        <div style={styles.compareSide}>
                          <div style={styles.compareSideLabel}>עם הפקדות</div>
                          <div style={styles.compareSideValue}>
                            {formatCurrency(member.monthlyPensionWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.compareSide}>
                          <div style={styles.compareSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareSideValue}>
                            {formatCurrency(member.monthlyPensionWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.compareCard}>
                      <div style={styles.compareTitle}>סכום חד הוני לפרישה</div>
                      <div style={styles.compareInner}>
                        <div style={styles.compareSide}>
                          <div style={styles.compareSideLabel}>עם הפקדות</div>
                          <div style={styles.compareSideValue}>
                            {formatCurrency(member.lumpSumWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.compareSide}>
                          <div style={styles.compareSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareSideValue}>
                            {formatCurrency(member.lumpSumWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.insuranceTitle}>כיסוי ביטוחי</div>

                  <div style={styles.insuranceGrid}>
                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🛡️ סכום ביטוח</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.deathCoverage)}
                      </div>
                    </div>

                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🧍 אכ"ע באחוזים</div>
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

          <section style={styles.grid2}>
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

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>📊</span>
                <h2 style={styles.h2}>מדיניות סיכון משוקללת</h2>
              </div>
            </div>

            <div style={styles.explanation}>
              זהו חישוב ביניים המבוסס על מיפוי משוער של המסלולים הידועים מתוך
              הדוחות.
            </div>

            <RiskBar value={weightedEquityExposure} styles={styles} />

            <div style={{ marginTop: "24px" }}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>📈</span>
                  <h2 style={styles.h2}>חלוקה לפי מסלולים / אפיקים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                מוצגת חלוקה משוערת לפי סוגי מסלולים דומיננטיים שניתן היה להסיק
                מתוך שמות המוצרים והמסלולים בדוחות.
              </div>

              <div style={styles.trackList}>
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
            </div>
          </section>

          <section style={styles.grid2}>
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>💳</span>
                  <h2 style={styles.h2}>הלוואות על חשבון מוצרים פנסיוניים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                הנתונים מוצגים מתוך ה־XML אם ה־parser הזין אותם ל־reportData.loans.details,
                עם שיוך לפי שם פרטי ושם משפחה.
              </div>

              {hasDetailedLoans ? (
                Object.entries(groupedLoans).map(([personName, personLoans]) => {
                  const totalAmount = personLoans.reduce(
                    (sum, loan) => sum + (loan.amount || 0),
                    0
                  );
                  const totalBalance = personLoans.reduce(
                    (sum, loan) => sum + (loan.balance || 0),
                    0
                  );

                  return (
                    <div key={personName} style={styles.loanGroup}>
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

                      <div style={styles.loanTableWrap}>
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
                })
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

            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>👨‍👩‍👧</span>
                  <h2 style={styles.h2}>מוטבים רשומים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                מצב המוטבים מאפשר להבין האם הכיסוי המשפחתי מעודכן במוצרים
                הרלוונטיים.
              </div>

              <div style={styles.softCard}>
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
                <div style={{ ...styles.small, marginTop: "8px" }}>
                  סכום ביטוח: {formatCurrency(beneficiaries.coverageAmount)}
                </div>
              </div>
            </section>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>📝</span>
                <h2 style={styles.h2}>המלצות אישיות</h2>
              </div>
            </div>

            <div style={styles.explanation}>
              כאן אפשר להוסיף תובנות, מסקנות, פעולות מומלצות, נקודות לשיחה עם
              הלקוח, או כל מלל חופשי שתרצה להציג כחלק מהדוח.
            </div>

            <div style={styles.recommendationsWrap}>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                style={styles.recommendationsText}
                placeholder="כתוב כאן המלצות אישיות..."
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function RiskBar({ value, styles }) {
  return (
    <div style={{ paddingTop: "28px" }}>
      <div style={styles.riskBarWrap}>
        <div style={styles.riskBarHighlight} />

        <div
          style={{
            ...styles.markerLabel,
            left: `calc(${value}% )`,
          }}
        >
          {value}%
        </div>

        <div
          style={{
            position: "absolute",
            left: `calc(${value}% - 10px)`,
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
            left: `calc(${value}% - 2px)`,
            top: "20px",
            width: "4px",
            height: "12px",
            background: "#00215D",
            borderRadius: "2px",
            opacity: 0.9,
          }}
        />
      </div>

      <div style={styles.riskScale}>
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      <div style={styles.riskValue}>{value}% מניות בתיק הכולל</div>
    </div>
  );
}

function PieCard({ title, explanation, items, total, styles, formatCurrency }) {
  const colors = ["#00215D", "#355C9A", "#7A92B8", "#E2D1BF", "#FF2756", "#A8B8D8"];

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

        <div style={styles.legendBox}>
          {segments.map((seg) => (
            <div key={seg.name} style={styles.legendItem}>
              <div style={styles.legendRow}>
                <div style={styles.legendLeft}>
                  <span style={{ ...styles.legendDot, background: seg.color }} />
                  <div>
                    <div style={styles.legendName}>{seg.name}</div>
                    <div style={styles.legendValue}>
                      {formatCurrency(seg.value)}
                    </div>
                  </div>
                </div>

                <div style={styles.legendPercent}>{seg.percent}%</div>
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