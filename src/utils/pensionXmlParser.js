// src/utils/pensionXmlParser.js

export async function parseMultiplePensionXmlFiles(files) {
  const parsed = [];

  for (const file of files) {
    const text = await file.text();
    const json = parseXmlToJson(text);

    parsed.push({
      fileName: file.name,
      rawXml: text,
      json,
    });
  }

  return parsed;
}

export function buildLegacyReportData(parsedFiles = []) {
  const perFileData = parsedFiles.map((file) => extractFileData(file));

  const membersMap = new Map();
  const allProducts = [];
  const allLoans = [];
  const allBeneficiaries = [];

  for (const fileData of perFileData) {
    for (const member of fileData.members) {
      const key = normalizeNameKey(member.firstName, member.familyName);

      if (!membersMap.has(key)) {
        membersMap.set(key, {
          name: [member.firstName, member.familyName].filter(Boolean).join(" ").trim(),
          firstName: member.firstName || "",
          familyName: member.familyName || "",
          assets: 0,
          monthlyDeposits: 0,
          monthlyPensionWithDeposits: 0,
          monthlyPensionWithoutDeposits: 0,
          lumpSumWithDeposits: 0,
          lumpSumWithoutDeposits: 0,
          deathCoverage: 0,
          disabilityValue: 0,
          disabilityPercent: 0,
        });
      }

      const target = membersMap.get(key);

      target.assets += member.assets || 0;
      target.monthlyDeposits += member.monthlyDeposits || 0;
      target.monthlyPensionWithDeposits += member.monthlyPensionWithDeposits || 0;
      target.monthlyPensionWithoutDeposits += member.monthlyPensionWithoutDeposits || 0;
      target.lumpSumWithDeposits += member.lumpSumWithDeposits || 0;
      target.lumpSumWithoutDeposits += member.lumpSumWithoutDeposits || 0;
      target.deathCoverage += member.deathCoverage || 0;
      target.disabilityValue += member.disabilityValue || 0;
      target.disabilityPercent = Math.max(
        target.disabilityPercent || 0,
        member.disabilityPercent || 0
      );
    }

    allProducts.push(...fileData.products);
    allLoans.push(...fileData.loans);
    allBeneficiaries.push(...fileData.beneficiaries);
  }

  const members = Array.from(membersMap.values());

  const familyTotalAssets = sumBy(members, (m) => m.assets);
  const familyMonthlyDeposits = sumBy(members, (m) => m.monthlyDeposits);
  const familyMonthlyPensionWithDeposits = sumBy(
    members,
    (m) => m.monthlyPensionWithDeposits
  );
  const familyMonthlyPensionWithoutDeposits = sumBy(
    members,
    (m) => m.monthlyPensionWithoutDeposits
  );
  const familyLumpSumWithDeposits = sumBy(members, (m) => m.lumpSumWithDeposits);
  const familyLumpSumWithoutDeposits = sumBy(
    members,
    (m) => m.lumpSumWithoutDeposits
  );

  const membersWithShare = members.map((member) => ({
    ...member,
    shareOfFamilyAssets:
      familyTotalAssets > 0
        ? round2((member.assets / familyTotalAssets) * 100)
        : 0,
  }));

  const products = aggregateItemsByName(allProducts);
  const managers = aggregateItemsByName(
    allProducts.map((p) => ({
      name: p.managerName || "לא ידוע",
      value: p.balance || 0,
    }))
  );

  const tracks = aggregateTracks(allProducts);

  const totalProducts = sumBy(products, (x) => x.value);
  const totalManagers = sumBy(managers, (x) => x.value);
  const totalTracks = sumBy(tracks, (x) => x.value);

  const weightedEquityExposure =
    totalTracks > 0
      ? round2(
          (tracks.reduce(
            (sum, track) =>
              sum + (track.value || 0) * ((track.equityPercent || 0) / 100),
            0
          ) /
            totalTracks) *
            100
        )
      : 0;

  const loansDetails = allLoans.map((loan, index) => ({
    id:
      loan.id ||
      `${loan.firstName || ""}_${loan.familyName || ""}_${loan.endDate || ""}_${index}`,
    firstName: loan.firstName || "",
    familyName: loan.familyName || "",
    amount: loan.amount || 0,
    repaymentFrequency: loan.repaymentFrequency || "",
    balance: loan.balance || 0,
    endDate: loan.endDate || "",
  }));

  const beneficiariesCoverageAmount = allBeneficiaries.reduce(
    (sum, item) => sum + (item.coverageAmount || 0),
    0
  );

  const beneficiariesSummary =
    allBeneficiaries.length > 0
      ? "נמצא מידע חלקי על מוטבים / כיסויים"
      : "לא התקבל מידע";

  return {
    family: {
      lastUpdated: formatToday(),
      totalAssets: familyTotalAssets,
      monthlyDeposits: familyMonthlyDeposits,
      monthlyPensionWithDeposits: familyMonthlyPensionWithDeposits,
      monthlyPensionWithoutDeposits: familyMonthlyPensionWithoutDeposits,
      projectedLumpSumWithDeposits: familyLumpSumWithDeposits,
      projectedLumpSumWithoutDeposits: familyLumpSumWithoutDeposits,
      retirementAgeLabel: "התחזית מבוססת על נתוני ה־XML שנקלטו במערכת",
    },

    members: membersWithShare,

    products: products.map((x) => ({
      name: x.name,
      value: x.value,
    })),

    managers: managers.map((x) => ({
      name: x.name,
      value: x.value,
    })),

    tracks: tracks.map((x) => ({
      name: x.name,
      value: x.value,
      equityPercent: x.equityPercent,
    })),

    loans: {
      hasData: loansDetails.length > 0,
      details: loansDetails,
    },

    beneficiaries: {
      hasData: allBeneficiaries.length > 0,
      coverageAmount: beneficiariesCoverageAmount,
      summary: beneficiariesSummary,
    },

    weightedEquityExposure,
    totalProducts,
    totalManagers,
    totalTracks,
  };
}

function extractFileData(file) {
  const root = file?.json || {};

  const persons = extractPersons(root);
  const products = extractProducts(root, persons);
  const loans = extractLoans(root, persons);
  const beneficiaries = extractBeneficiaries(root);

  const membersMap = new Map();

  for (const person of persons) {
    const key = normalizeNameKey(person.firstName, person.familyName);

    if (!membersMap.has(key)) {
      membersMap.set(key, {
        firstName: person.firstName || "",
        familyName: person.familyName || "",
        assets: 0,
        monthlyDeposits: 0,
        monthlyPensionWithDeposits: 0,
        monthlyPensionWithoutDeposits: 0,
        lumpSumWithDeposits: 0,
        lumpSumWithoutDeposits: 0,
        deathCoverage: 0,
        disabilityValue: 0,
        disabilityPercent: 0,
      });
    }
  }

  for (const product of products) {
    const key = normalizeNameKey(product.firstName, product.familyName);

    if (!membersMap.has(key)) {
      membersMap.set(key, {
        firstName: product.firstName || "",
        familyName: product.familyName || "",
        assets: 0,
        monthlyDeposits: 0,
        monthlyPensionWithDeposits: 0,
        monthlyPensionWithoutDeposits: 0,
        lumpSumWithDeposits: 0,
        lumpSumWithoutDeposits: 0,
        deathCoverage: 0,
        disabilityValue: 0,
        disabilityPercent: 0,
      });
    }

    const member = membersMap.get(key);

    member.assets += product.balance || 0;
    member.monthlyDeposits += product.monthlyDeposit || 0;
    member.monthlyPensionWithDeposits += product.monthlyPensionWithDeposits || 0;
    member.monthlyPensionWithoutDeposits += product.monthlyPensionWithoutDeposits || 0;
    member.lumpSumWithDeposits += product.lumpSumWithDeposits || 0;
    member.lumpSumWithoutDeposits += product.lumpSumWithoutDeposits || 0;
    member.deathCoverage += product.deathCoverage || 0;
    member.disabilityValue += product.disabilityValue || 0;
    member.disabilityPercent = Math.max(
      member.disabilityPercent || 0,
      product.disabilityPercent || 0
    );
  }

  return {
    members: Array.from(membersMap.values()),
    products,
    loans,
    beneficiaries,
  };
}

function parseXmlToJson(xmlString) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");

  const parserError = xml.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    throw new Error("קובץ XML לא תקין");
  }

  return {
    [xml.documentElement.nodeName]: xmlNodeToJson(xml.documentElement),
  };
}

function xmlNodeToJson(node) {
  if (node.nodeType === 3) {
    const text = node.nodeValue?.trim();
    return text ? text : null;
  }

  if (node.nodeType !== 1) return null;

  const obj = {};

  if (node.attributes && node.attributes.length > 0) {
    for (const attr of node.attributes) {
      obj[`@${attr.nodeName}`] = attr.nodeValue;
    }
  }

  const children = Array.from(node.childNodes).filter((child) => {
    if (child.nodeType === 3) {
      return child.nodeValue?.trim();
    }
    return child.nodeType === 1;
  });

  if (children.length === 0) {
    return node.textContent?.trim() || "";
  }

  for (const child of children) {
    if (child.nodeType === 3) {
      const text = child.nodeValue?.trim();
      if (text) obj["#text"] = text;
      continue;
    }

    const childName = child.nodeName;
    const childJson = xmlNodeToJson(child);

    if (obj[childName] === undefined) {
      obj[childName] = childJson;
    } else {
      if (!Array.isArray(obj[childName])) {
        obj[childName] = [obj[childName]];
      }
      obj[childName].push(childJson);
    }
  }

  return obj;
}

function extractPersons(root) {
  const found = [];

  deepWalk(root, (node) => {
    const firstName = getText(
      findFirstExisting(node, [
        "FirstName",
        "FIRST-NAME",
        "FIRSTNAME",
        "firstName",
        "SHEM-PRATI",
      ])
    );

    const familyName = getText(
      findFirstExisting(node, [
        "FamilyName",
        "FAMILY-NAME",
        "FAMILYNAME",
        "familyName",
        "SHEM-MISHPACHA",
      ])
    );

    if (normalizeString(firstName) || normalizeString(familyName)) {
      found.push({
        firstName,
        familyName,
      });
    }
  });

  return uniqueBy(found, (p) => normalizeNameKey(p.firstName, p.familyName));
}

function extractProducts(root, persons = []) {
  const products = [];
  const personFallback = persons[0] || { firstName: "", familyName: "" };

  deepWalk(root, (node, path) => {
    const productName = getText(
      findFirstExisting(node, [
        "ProductName",
        "PRODUCT-NAME",
        "SHEM-MOTSAR",
        "SHEM-KUPA",
        "KUPA-NAME",
        "Description",
        "DESCRIPTION",
      ])
    );

    const managerName = getText(
      findFirstExisting(node, [
        "ManagerName",
        "MANAGER-NAME",
        "SHEM-MENAHEL",
        "COMPANY-NAME",
        "YEVRA-MENAHELET",
      ])
    );

    const trackName = getText(
      findFirstExisting(node, [
        "TrackName",
        "TRACK-NAME",
        "MASLUL",
        "SHEM-MASLUL",
        "INVESTMENT-TRACK",
      ])
    );

    const balance = normalizeNumber(
      findFirstExisting(node, [
        "CurrentBalance",
        "CURRENT-BALANCE",
        "TZVIRA",
        "צבירה",
        "YITRA",
        "YITRAT-CHESHBON",
        "TotalBalance",
      ])
    );

    const monthlyDeposit = normalizeNumber(
      findFirstExisting(node, [
        "MonthlyDeposit",
        "MONTHLY-DEPOSIT",
        "HAFKADA-CHODSHIT",
        "HAFKADA-HODSHIT",
        "TOTAL-MONTHLY-DEPOSIT",
      ])
    );

    const monthlyPensionWithDeposits = normalizeNumber(
      findFirstExisting(node, [
        "MonthlyPensionWithDeposits",
        "MONTHLY-PENSION-WITH-DEPOSITS",
        "KITZBA-IM-HAFKADOT",
        "EXPECTED-PENSION-WITH-DEPOSITS",
        "PENSION-WITH-DEPOSITS",
      ])
    );

    const monthlyPensionWithoutDeposits = normalizeNumber(
      findFirstExisting(node, [
        "MonthlyPensionWithoutDeposits",
        "MONTHLY-PENSION-WITHOUT-DEPOSITS",
        "KITZBA-BLI-HAFKADOT",
        "EXPECTED-PENSION-WITHOUT-DEPOSITS",
        "PENSION-WITHOUT-DEPOSITS",
      ])
    );

    const hCoeff = normalizeNumber(
      findFirstExisting(node, [
        "HCoff",
        "HCOFF",
        "H-COFF",
        "HEKDEM-HONI",
        "COEFFICIENT-H",
      ])
    );

    const deathCoverageBase = normalizeNumber(
      findFirstExisting(node, [
        "DeathCoverage",
        "RISK-COVERAGE",
        "BITUACH-CHAIM",
        "SACH-BITUACH",
        "LIFE-INSURANCE",
      ])
    );

    const noFactorInsurance = normalizeNumber(
      findFirstExisting(node, [
        "InsuranceWithoutFactor",
        "NO-FACTOR-INSURANCE",
        "WITHOUT-COEFFICIENT-INSURANCE",
        "BITUACH-LELO-MIKDAM",
      ])
    );

    const disabilityValue = normalizeNumber(
      findFirstExisting(node, [
        "DisabilityValue",
        "DISABILITY-VALUE",
        "ACHUZ-NECHUT",
        "A-CA",
        "OCCUPATIONAL-DISABILITY-AMOUNT",
      ])
    );

    const disabilityPercent = normalizeNumber(
      findFirstExisting(node, [
        "DisabilityPercent",
        "DISABILITY-PERCENT",
        "ACHUZ-NECHUT-PERCENT",
        "OCCUPATIONAL-DISABILITY-PERCENT",
      ])
    );

    if (
      !productName &&
      !managerName &&
      !trackName &&
      balance === 0 &&
      monthlyDeposit === 0 &&
      monthlyPensionWithDeposits === 0 &&
      monthlyPensionWithoutDeposits === 0 &&
      hCoeff === 0 &&
      deathCoverageBase === 0 &&
      noFactorInsurance === 0 &&
      disabilityValue === 0 &&
      disabilityPercent === 0
    ) {
      return;
    }

    const ownerFirstName =
      getText(
        findFirstExisting(node, [
          "FirstName",
          "FIRST-NAME",
          "FIRSTNAME",
          "firstName",
        ])
      ) || personFallback.firstName;

    const ownerFamilyName =
      getText(
        findFirstExisting(node, [
          "FamilyName",
          "FAMILY-NAME",
          "FAMILYNAME",
          "familyName",
        ])
      ) || personFallback.familyName;

    const lumpSumWithDeposits =
      hCoeff > 0 && monthlyPensionWithDeposits > 0
        ? monthlyPensionWithDeposits * hCoeff
        : 0;

    const lumpSumWithoutDeposits =
      hCoeff > 0 && monthlyPensionWithoutDeposits > 0
        ? monthlyPensionWithoutDeposits * hCoeff
        : 0;

    const deathCoverage = deathCoverageBase + noFactorInsurance;

    products.push({
      firstName: ownerFirstName,
      familyName: ownerFamilyName,
      productName: productName || "מוצר לא מזוהה",
      managerName: managerName || "לא ידוע",
      trackName: trackName || "מסלול לא ידוע",
      balance,
      monthlyDeposit,
      monthlyPensionWithDeposits,
      monthlyPensionWithoutDeposits,
      lumpSumWithDeposits,
      lumpSumWithoutDeposits,
      deathCoverage,
      disabilityValue,
      disabilityPercent,
      _path: path.join(" > "),
    });
  });

  return products.filter((p) => {
    const meaningful =
      p.balance ||
      p.monthlyDeposit ||
      p.monthlyPensionWithDeposits ||
      p.monthlyPensionWithoutDeposits ||
      p.lumpSumWithDeposits ||
      p.lumpSumWithoutDeposits ||
      p.deathCoverage ||
      p.disabilityValue ||
      p.disabilityPercent;

    return !!meaningful;
  });
}

function extractLoans(root, persons = []) {
  const loansResult = [];
  const defaultPerson = persons[0] || { firstName: "", familyName: "" };

  const walk = (node, inheritedOwner = null) => {
    if (!node || typeof node !== "object") return;

    const owner = inheritedOwner || {
      firstName:
        getText(
          findFirstExisting(node, [
            "FirstName",
            "FIRST-NAME",
            "FIRSTNAME",
            "firstName",
          ])
        ) || defaultPerson.firstName,

      familyName:
        getText(
          findFirstExisting(node, [
            "FamilyName",
            "FAMILY-NAME",
            "FAMILYNAME",
            "familyName",
          ])
        ) || defaultPerson.familyName,
    };

    // התמיכה הקריטית למבנה האמיתי: Loans > Loan
    if (node.Loans && node.Loans.Loan) {
      const loanItems = toArray(node.Loans.Loan);

      loanItems.forEach((loan, index) => {
        const amount = normalizeNumber(loan["SCHUM-HALVAA"]);
        const repaymentFrequency = getText(loan["TADIRUT-HECHZER-HALVAA"]);
        const balance = normalizeNumber(loan["YITRAT-HALVAA"]);
        const endDate = getText(loan["TAARICH-SIYUM-HALVAA"]);

        if (amount || balance || repaymentFrequency || endDate) {
          loansResult.push({
            id: `${normalizeNameKey(owner.firstName, owner.familyName)}_${amount}_${balance}_${endDate}_${index}`,
            firstName: owner.firstName || "",
            familyName: owner.familyName || "",
            amount,
            repaymentFrequency,
            balance,
            endDate,
          });
        }
      });
    }

    // תמיכה נוספת אם Loan מופיע ישירות בלי עטיפה
    if (node.Loan) {
      const loanItems = toArray(node.Loan);

      loanItems.forEach((loan, index) => {
        const amount = normalizeNumber(loan["SCHUM-HALVAA"]);
        const repaymentFrequency = getText(loan["TADIRUT-HECHZER-HALVAA"]);
        const balance = normalizeNumber(loan["YITRAT-HALVAA"]);
        const endDate = getText(loan["TAARICH-SIYUM-HALVAA"]);

        if (amount || balance || repaymentFrequency || endDate) {
          loansResult.push({
            id: `${normalizeNameKey(owner.firstName, owner.familyName)}_${amount}_${balance}_${endDate}_direct_${index}`,
            firstName: owner.firstName || "",
            familyName: owner.familyName || "",
            amount,
            repaymentFrequency,
            balance,
            endDate,
          });
        }
      });
    }

    Object.keys(node).forEach((key) => {
      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach((item) => walk(item, owner));
      } else if (child && typeof child === "object") {
        walk(child, owner);
      }
    });
  };

  walk(root);

  return uniqueBy(
    loansResult,
    (loan) =>
      [
        normalizeString(loan.firstName),
        normalizeString(loan.familyName),
        loan.amount || 0,
        normalizeString(loan.repaymentFrequency),
        loan.balance || 0,
        normalizeString(loan.endDate),
      ].join("|")
  );
}

function extractBeneficiaries(root) {
  const found = [];

  deepWalk(root, (node) => {
    const summaryText = getText(
      findFirstExisting(node, [
        "BeneficiariesSummary",
        "MOTAVIM",
        "MOTAVIM-SUMMARY",
        "BENEFICIARIES",
      ])
    );

    const coverageAmount = normalizeNumber(
      findFirstExisting(node, [
        "CoverageAmount",
        "BENEFICIARIES-COVERAGE-AMOUNT",
        "SACH-BITUACH",
        "BITUACH-CHAIM",
      ])
    );

    if (summaryText || coverageAmount) {
      found.push({
        summary: summaryText,
        coverageAmount,
      });
    }
  });

  return found;
}

function aggregateItemsByName(items) {
  const map = new Map();

  for (const item of items) {
    const name = (item.name || item.productName || "לא ידוע").trim();
    const value = Number(item.value ?? item.balance ?? 0);

    if (!map.has(name)) {
      map.set(name, { name, value: 0 });
    }

    map.get(name).value += value;
  }

  return Array.from(map.values())
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function aggregateTracks(products) {
  const map = new Map();

  for (const product of products) {
    const name = product.trackName || "מסלול לא ידוע";
    const value = product.balance || 0;
    const equityPercent = inferEquityPercentFromTrackName(name);

    if (!map.has(name)) {
      map.set(name, {
        name,
        value: 0,
        equityPercent,
      });
    }

    map.get(name).value += value;
  }

  return Array.from(map.values())
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function inferEquityPercentFromTrackName(trackName = "") {
  const s = normalizeString(trackName);

  if (s.includes("מניית") || s.includes("מניות") || s.includes("stocks")) return 100;
  if (s.includes('אג"ח') || s.includes("אגח") || s.includes("bond")) return 10;
  if (s.includes("כללי") || s.includes("general")) return 35;
  if (s.includes("הלכה")) return 25;
  if (s.includes("סולידי") || s.includes("solid")) return 5;
  if (s.includes("עוקב מדד") || s.includes("מדד") || s.includes("index")) return 60;
  return 30;
}

function deepWalk(node, callback, path = []) {
  if (!node || typeof node !== "object") return;

  callback(node, path);

  Object.keys(node).forEach((key) => {
    const child = node[key];
    const nextPath = [...path, key];

    if (Array.isArray(child)) {
      child.forEach((item, index) => deepWalk(item, callback, [...nextPath, String(index)]));
    } else if (child && typeof child === "object") {
      deepWalk(child, callback, nextPath);
    }
  });
}

function findFirstExisting(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      const val = obj[key];
      if (typeof val === "object") {
        if (getText(val) !== "") return val;
      } else if (String(val).trim() !== "") {
        return val;
      }
    }
  }
  return "";
}

function getText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();

  if (typeof value === "object") {
    if ("#text" in value) return String(value["#text"] || "").trim();
    if ("_" in value) return String(value["_"] || "").trim();
  }

  return "";
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeString(value) {
  return getText(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeNumber(value) {
  const raw = getText(value);
  if (!raw) return 0;

  const cleaned = raw
    .replace(/₪/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function normalizeNameKey(firstName, familyName) {
  return `${normalizeString(firstName)}|${normalizeString(familyName)}`;
}

function uniqueBy(array, keyFn) {
  const map = new Map();

  for (const item of array) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function sumBy(array, selector) {
  return (array || []).reduce((sum, item) => sum + (selector(item) || 0), 0);
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatToday() {
  return new Intl.DateTimeFormat("he-IL").format(new Date());
}