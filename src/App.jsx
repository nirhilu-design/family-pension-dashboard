import React from "react";

export default function App() {
  const [data, setData] = React.useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setData(json);
      } catch {
        alert("הקובץ שהועלה אינו JSON תקין");
      }
    };

    reader.readAsText(file);
  };

  const family = data?.family || {
    totalAssets: 3765834,
    monthlyDeposits: 23815,
    monthlyPensionWithDeposits: 64483,
    monthlyPensionWithoutDeposits: 30913,
    projectedLumpSumWithDeposits: 3555683,
    projectedLumpSumWithoutDeposits: 2137902,
    deathCoverageTotal: 3230027,
    lastUpdated: "פברואר 2026",
    retirementAgeLabel: "התחזית מבוססת על גיל הפרישה המוגדר בדוחות (67)",
  };

  const members = data?.members || [
    {
      name: "בן זוג",
      assets: 1507369,
      monthlyDeposits: 9081,
      shareOfFamilyAssets: 40,
      monthlyPensionWithDeposits: 21055,
      monthlyPensionWithoutDeposits: 11382,
      lumpSumWithDeposits: 1781626,
      lumpSumWithoutDeposits: 906430,
      deathCoverage: 522180,
      disabilityValue: 21398,
      disabilityPercent: 75,
    },
    {
      name: "בת זוג",
      assets: 2258465,
      monthlyDeposits: 14734,
      shareOfFamilyAssets: 60,
      monthlyPensionWithDeposits: 43428,
      monthlyPensionWithoutDeposits: 19531,
      lumpSumWithDeposits: 1774057,
      lumpSumWithoutDeposits: 1231472,
      deathCoverage: 2707847,
      disabilityValue: 83401,
      disabilityPercent: 138,
    },
  ];

  const products = data?.products || [
    { name: "פנסיה", value: 2535800 },
    { name: "קרנות השתלמות", value: 808415 },
    { name: "קופות גמל", value: 223417 },
    { name: "גמל להשקעה", value: 194202 },
  ];

  const managers = data?.managers || [
    { name: "מנורה", value: 2787167 },
    { name: "אנליסט", value: 978667 },
  ];

  const tracks = data?.tracks || [
    { name: "מנייתי / עוקב מדדים", value: 1009617, equityPercent: 100 },
    { name: "כללי / פנסיה", value: 2357368, equityPercent: 45 },
    { name: 'אג"ח / מסלול שמרני', value: 398849, equityPercent: 25 },
  ];

  const beneficiaries = data?.beneficiaries || {
    summary:
      "התקבלו סכומי כיסוי למקרה פטירה, אך לא התקבל מידע בדוגמת הנתונים לגבי סטטוס רישום המוטבים.",
    coverageAmount: 3230027,
  };

  const totalProducts = products.reduce((sum, item) => sum + item.value, 0);
  const totalManagers = managers.reduce((sum, item) => sum + item.value, 0);
  const totalTracks = tracks.reduce((sum, item) => sum + item.value, 0);

  const weightedEquityExposure = Math.round(
    (tracks.reduce(
      (sum, item) => sum + item.value * (item.equityPercent / 100),
      0
    ) /
      totalTracks) *
      100
  );

  const formatCurrency = (value) => `₪${Number(value).toLocaleString("en-US")}`;

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <input type="file" accept=".json" onChange={handleFileUpload} />
        </div>

        <div style={styles.container}>
          <section style={styles.section}>
            <div style={styles.topLine}>
              <ZviranLogo />
              <div style={styles.small}>מעודכן ל{family.lastUpdated}</div>
            </div>

            <div style={{ ...styles.small, textAlign: "center", marginBottom: "8px" }}>
              מסך ראשי · דוח משפחתי מאוחד
            </div>

            <h1 style={styles.h1}>דוח פנסיוני משפחתי מאוחד</h1>

            <p style={styles.subtitle}>
              ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים הפנסיוניים,
              הקצבה הצפויה, הסכומים ההוניים, הפיזור בין מוצרים וגופים מנהלים,
              והמידע הביטוחי המרכזי.
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
              <div style={styles.heroValue}>{formatCurrency(family.monthlyDeposits)}</div>
              <div style={styles.heroSub}>סך ההפקדות החודשיות</div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>תחזית פרישה משפחתית</h2>
            <div style={styles.explanation}>
              התחזית מציגה את הקצבה והסכום ההוני הצפויים לגיל הפרישה שמופיע בדוחות,
              עם השוואה בין תרחיש של המשך הפקדות לבין תרחיש ללא הפקדות.
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
                  <div style={styles.subDark}>סכום הוני צפוי</div>
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
                  <div style={styles.sub}>סכום הוני צפוי</div>
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
              כאן מוצגים הנתונים המרכזיים של כל אחד מבני הזוג בנפרד.
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
                    <div style={styles.centerValue}>{formatCurrency(member.assets)}</div>
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
                      <div style={styles.compareTitle}>סכום הוני צפוי</div>
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
                      <div style={styles.insuranceLabel}>🛡️ סך למקרה פטירה</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.deathCoverage)}
                      </div>
                    </div>

                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🧍 אכ"ע באחוזים</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.disabilityValue)} ({member.disabilityPercent}%)
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
            <div style={styles.titleWithIcon}>
              <span style={{ fontSize: "22px" }}>📊</span>
              <h2 style={styles.h2}>מדיניות סיכון משוקללת</h2>
            </div>

            <div style={styles.explanation}>
              כרגע זה מבוסס על נתוני דמו או JSON נטען. בשלב הבא אותו בלוק יקבל חישוב אוטומטי מתוך דוחות שיועלו.
            </div>

            <RiskBar value={weightedEquityExposure} styles={styles} />

            <div style={{ marginTop: "24px" }}>
              <div style={styles.titleWithIcon}>
                <span style={{ fontSize: "22px" }}>📈</span>
                <h2 style={styles.h2}>חלוקה לפי מסלולים / אפיקים</h2>
              </div>

              <div style={styles.explanation}>
                להלן חלוקה לפי מסלולים ואחוז מניות במסלול.
              </div>

              <div style={styles.trackList}>
                {tracks.map((track) => {
                  const portfolioWeight = Math.round((track.value / totalTracks) * 100);

                  return (
                    <div key={track.name} style={styles.trackItem}>
                      <div style={styles.trackTop}>
                        <div>
                          <div style={styles.trackName}>{track.name}</div>
                          <div style={styles.trackMeta}>{formatCurrency(track.value)}</div>
                        </div>

                        <div style={{ textAlign: "left" }}>
                          <div style={styles.trackName}>{portfolioWeight}% מהתיק</div>
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
              <div style={styles.titleWithIcon}>
                <span style={{ fontSize: "22px" }}>💳</span>
                <h2 style={styles.h2}>הלוואות על חשבון מוצרים פנסיוניים</h2>
              </div>

              <div style={styles.explanation}>
                כרגע לא זוהה מידע מפורט לגבי הלוואות פעילות.
              </div>

              <div style={styles.emptyState}>
                לא התקבל מידע על הלוואות במקור הנתונים הנוכחי.
              </div>
            </section>

            <section style={styles.section}>
              <div style={styles.titleWithIcon}>
                <span style={{ fontSize: "22px" }}>👨‍👩‍👧</span>
                <h2 style={styles.h2}>מוטבים רשומים</h2>
              </div>

              <div style={styles.explanation}>
                מצב המוטבים מאפשר להבין האם הכיסוי המשפחתי מעודכן במוצרים הרלוונטיים.
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
                  כיסוי למקרה פטירה: {formatCurrency(beneficiaries.coverageAmount)}
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
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
            left: `calc(${value}%)`,
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
  const segments = items.map((item, index) => {
    const percent = (item.value / total) * 100;
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
        <span style={{ fontSize: "22px" }}>🥧</span>
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
                    <div style={styles.legendValue}>{formatCurrency(seg.value)}</div>
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
    <div style={{ display: "flex", alignItems: "center", gap: "8px", direction: "ltr" }}>
      <svg width="34" height="34" viewBox="0 0 42 42" aria-label="zviran logo">
        <circle cx="21" cy="21" r="19" fill="#00215D" />
        <circle
          cx="21"
          cy="21"
          r="17"
          fill="#00215D"
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.95"
        />
        <path d="M12 14h18l-15 14h15v4H12l15-14H12z" fill="#ffffff" />
        <path d="M12 14h18l-7 6h-8z" fill="#FF2756" opacity="0.95" />
      </svg>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <div style={{ fontWeight: 700, color: "#00215D", fontSize: "22px" }}>zviran</div>
        <div style={{ fontSize: "10px", color: "#7B8794" }}>Total Rewards Experts</div>
      </div>
    </div>
  );
}

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
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 22px rgba(0,33,93,0.14)",
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
  },
  small: {
    fontSize: "13px",
    color: "#627D98",
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
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  lightCard: {
    background: "#ffffff",
    border: "1px solid #E2D1BF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 1px 4px rgba(0,33,93,0.03)",
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
  softCard: {
    background: "#F9F7F3",
    border: "1px solid #E2D1BF",
    borderRadius: "18px",
    padding: "16px",
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
    background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
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
};