import React from "react";
import "./report-page-v2.css";

export default function ReportPageV2({ reportData, onBack, onResetAll }) {
  if (!reportData || !reportData.family) {
    return <div style={{ padding: 40, direction: "rtl" }}>טוען נתונים...</div>;
  }

  const { family, tracks = [], members = [], products = [], managers = [], weightedEquityExposure = 0 } = reportData;

  const formatCurrency = (v) => `₪${Number(v || 0).toLocaleString()}`;
  const formatPercent = (v) => `${Math.round(v || 0)}%`;

  return (
    <div className="reportv2" dir="rtl">

      {/* HEADER */}
      <div className="header">
        <div>{family.lastUpdated}</div>
        <h1>דוח פנסיוני משפחתי מאוחד</h1>
      </div>

      {/* KPI */}
      <div className="grid-4">
        <Card title="סך נכסים" value={formatCurrency(family.totalAssets)} />
        <Card title="הפקדה חודשית" value={formatCurrency(family.monthlyDeposits)} />
        <Donut title="מוצרים" items={products} />
        <Donut title="גופים" items={managers} />
      </div>

      {/* תחזיות */}
      <div className="grid-3">
        <Compare
          title="קצבה"
          a={family.monthlyPensionWithDeposits}
          b={family.monthlyPensionWithoutDeposits}
        />

        <Compare
          title="צבירה"
          a={family.projectedLumpSumWithDeposits}
          b={family.projectedLumpSumWithoutDeposits}
        />

        <Equity value={weightedEquityExposure} />
      </div>

      {/* מסלולים */}
      <div className="card">
        <h2>מסלולי השקעה</h2>
        {tracks.map((t) => (
          <div key={t.name} className="track">
            <div>{t.name}</div>
            <div>{formatCurrency(t.value)}</div>
          </div>
        ))}
      </div>

      {/* בני משפחה */}
      <div className="grid-2">
        {members.map((m) => (
          <div key={m.name} className="card">
            <h3>{m.name}</h3>
            <div>{formatCurrency(m.assets)}</div>
          </div>
        ))}
      </div>

      {/* כפתורים */}
      <div className="no-print buttons">
        <button onClick={onBack}>חזרה</button>
        <button onClick={onResetAll}>איפוס</button>
        <button onClick={() => window.print()}>PDF</button>
      </div>
    </div>
  );
}

/* קומפוננטות */

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="title">{title}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function Compare({ title, a, b }) {
  const max = Math.max(a, b, 1);
  return (
    <div className="card">
      <h3>{title}</h3>
      <Bar label="עם הפקדות" val={a} max={max} />
      <Bar label="ללא הפקדות" val={b} max={max} />
    </div>
  );
}

function Bar({ label, val, max }) {
  return (
    <div>
      <div className="row">
        <span>{label}</span>
        <span>₪{val}</span>
      </div>
      <div className="track">
        <div style={{ width: `${(val / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Donut({ title, items }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;

  let start = 0;
  const grad = items.map((i) => {
    const p = (i.value / total) * 100;
    const s = start;
    const e = start + p;
    start = e;
    return `${randomColor()} ${s}% ${e}%`;
  });

  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="donut" style={{ background: `conic-gradient(${grad.join(",")})` }} />
    </div>
  );
}

function Equity({ value }) {
  return (
    <div className="card">
      <h3>חשיפה מנייתית</h3>
      <div className="value">{value}%</div>
      <div className="track">
        <div style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function randomColor() {
  const colors = ["#2563eb", "#06b6d4", "#9333ea", "#f59e0b"];
  return colors[Math.floor(Math.random() * colors.length)];
}