import {
  PROVINCE_ORDER,
  Province,
  getHolidayName,
  getHolidaysForYear,
  isProvinceConfigured,
  resolveHolidayDate,
} from "./holidays";

describe("resolveHolidayDate", () => {
  test("a fixed-date rule ignores the weekday", () => {
    expect(resolveHolidayDate(2026, { kind: "fixed", month: 7, day: 1 })).toEqual(new Date(2026, 6, 1));
  });

  test("nthWeekday finds the 3rd Monday of February", () => {
    // 2026-02-01 is a Sunday, so the Mondays are the 2nd, 9th, 16th, 23rd
    expect(resolveHolidayDate(2026, { kind: "nthWeekday", month: 2, weekday: 1, n: 3 })).toEqual(new Date(2026, 1, 16));
  });

  test("nthWeekday finds the 1st Monday of September across a year where the 1st is that weekday", () => {
    // 2026-09-01 is a Tuesday, so the first Monday is the 7th
    expect(resolveHolidayDate(2026, { kind: "nthWeekday", month: 9, weekday: 1, n: 1 })).toEqual(new Date(2026, 8, 7));
  });

  test("weekdayOnOrBefore steps back to the most recent Monday", () => {
    // 2026-05-24 is a Sunday, so the on-or-before Monday is the 18th
    expect(resolveHolidayDate(2026, { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: 1 })).toEqual(new Date(2026, 4, 18));
  });

  test("weekdayOnOrBefore is a no-op when the date itself is already that weekday", () => {
    // 2027-05-24 is a Monday
    expect(resolveHolidayDate(2027, { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: 1 })).toEqual(new Date(2027, 4, 24));
  });

  test("easterOffset matches a hand-traced computus result", () => {
    // Easter Sunday 2026 is April 5 and 2027 is March 28, both hand-traced
    // against the Anonymous/Meeus-Jones-Butcher algorithm this implements --
    // not taken from a lookup table, so this checks the arithmetic itself.
    expect(resolveHolidayDate(2026, { kind: "easterOffset", offsetDays: 0 })).toEqual(new Date(2026, 3, 5));
    expect(resolveHolidayDate(2027, { kind: "easterOffset", offsetDays: 0 })).toEqual(new Date(2027, 2, 28));
    // Good Friday is 2 days before
    expect(resolveHolidayDate(2026, { kind: "easterOffset", offsetDays: -2 })).toEqual(new Date(2026, 3, 3));
    expect(resolveHolidayDate(2027, { kind: "easterOffset", offsetDays: -2 })).toEqual(new Date(2027, 2, 26));
  });
});

describe("Ontario's nine ESA public holidays", () => {
  test("resolves all nine for 2026, sourced from ontario.ca", () => {
    expect(getHolidaysForYear("ON", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Family Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-12-25", name: "Christmas Day" },
      { date: "2026-12-26", name: "Boxing Day" },
    ]);
  });

  test("resolves all nine for 2027, a different Easter and weekday alignment", () => {
    expect(getHolidaysForYear("ON", 2027)).toEqual([
      { date: "2027-01-01", name: "New Year's Day" },
      { date: "2027-02-15", name: "Family Day" },
      { date: "2027-03-26", name: "Good Friday" },
      { date: "2027-05-24", name: "Victoria Day" },
      { date: "2027-07-01", name: "Canada Day" },
      { date: "2027-09-06", name: "Labour Day" },
      { date: "2027-10-11", name: "Thanksgiving Day" },
      { date: "2027-12-25", name: "Christmas Day" },
      { date: "2027-12-26", name: "Boxing Day" },
    ]);
  });

  test("getHolidayName finds a match and returns null for an ordinary day", () => {
    expect(getHolidayName("2026-07-01", "ON")).toBe("Canada Day");
    expect(getHolidayName("2026-07-02", "ON")).toBeNull();
  });

  test("isProvinceConfigured reflects whether a jurisdiction has a sourced list", () => {
    // A province with no entries would resolve to no holidays at all, not a
    // guess -- there is no such province left today (see "every jurisdiction
    // is now configured" below), so this checks the mechanism itself.
    expect(isProvinceConfigured("ON")).toBe(true);
    expect(getHolidaysForYear("ON", 2026).length).toBeGreaterThan(0);
  });
});

describe("fixedShiftSundayToMonday", () => {
  test("shifts to Monday only when the fixed date is a Sunday", () => {
    // 2023-01-01 is a Sunday
    expect(resolveHolidayDate(2023, { kind: "fixedShiftSundayToMonday", month: 1, day: 1 })).toEqual(new Date(2023, 0, 2));
    // 2026-01-01 is a Thursday: no shift
    expect(resolveHolidayDate(2026, { kind: "fixedShiftSundayToMonday", month: 1, day: 1 })).toEqual(new Date(2026, 0, 1));
  });

  test("shifts Canada Day off a Sunday", () => {
    // 2029-07-01 is a Sunday
    expect(resolveHolidayDate(2029, { kind: "fixedShiftSundayToMonday", month: 7, day: 1 })).toEqual(new Date(2029, 6, 2));
  });
});

describe("British Columbia's 11 statutory holidays", () => {
  test("resolves all eleven for 2026, including the two ON does not have", () => {
    expect(getHolidaysForYear("BC", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Family Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-08-03", name: "British Columbia Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "National Day for Truth and Reconciliation" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("does not include Boxing Day or Easter Monday -- confirmed not statutory in BC", () => {
    expect(getHolidayName("2026-12-26", "BC")).toBeNull();
    expect(getHolidayName("2026-04-06", "BC")).toBeNull(); // Easter Monday 2026
  });
});

describe("Alberta's 9 mandatory general holidays", () => {
  test("resolves all nine for 2026", () => {
    expect(getHolidaysForYear("AB", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Family Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Canada Day shifts off a Sunday, unlike Alberta's other fixed holidays", () => {
    expect(getHolidayName("2029-07-02", "AB")).toBe("Canada Day");
    expect(getHolidayName("2029-07-01", "AB")).toBeNull();
  });

  test("excludes the four Alberta names as merely optional: Truth and Reconciliation, Boxing Day, Easter Monday, Heritage Day", () => {
    expect(getHolidayName("2026-09-30", "AB")).toBeNull();
    expect(getHolidayName("2026-12-26", "AB")).toBeNull();
    expect(getHolidayName("2026-04-06", "AB")).toBeNull();
    expect(getHolidayName("2026-08-03", "AB")).toBeNull(); // 1st Monday of August
  });
});

describe("Saskatchewan's 10 public holidays", () => {
  test("resolves all ten for 2026", () => {
    expect(getHolidaysForYear("SK", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Family Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-08-03", name: "Saskatchewan Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Saskatchewan Day is a mandatory entitlement, unlike most provinces' August holiday", () => {
    expect(getHolidayName("2026-08-03", "SK")).toBe("Saskatchewan Day");
  });

  test("fixed-date holidays shift off a Sunday: New Year's, Canada Day, Remembrance Day, Christmas", () => {
    expect(getHolidayName("2023-01-02", "SK")).toBe("New Year's Day"); // 2023-01-01 is a Sunday
    expect(getHolidayName("2029-07-02", "SK")).toBe("Canada Day"); // 2029-07-01 is a Sunday
    expect(getHolidayName("2029-11-12", "SK")).toBe("Remembrance Day"); // 2029-11-11 is a Sunday
    expect(getHolidayName("2033-12-26", "SK")).toBe("Christmas Day"); // 2033-12-25 is a Sunday
  });

  test("explicitly confirmed not statutory in Saskatchewan: Truth and Reconciliation, Boxing Day, Easter Monday", () => {
    expect(getHolidayName("2026-09-30", "SK")).toBeNull();
    expect(getHolidayName("2026-12-26", "SK")).toBeNull();
    expect(getHolidayName("2026-04-06", "SK")).toBeNull();
  });
});

describe("Manitoba's 9 general holidays", () => {
  test("resolves all nine for 2026, with Louis Riel Day instead of Family Day", () => {
    expect(getHolidaysForYear("MB", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Louis Riel Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "Orange Shirt Day (National Day for Truth and Reconciliation)" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Manitoba has no August civic holiday and Remembrance Day runs under a separate Act, not this list", () => {
    expect(getHolidayName("2026-08-03", "MB")).toBeNull();
    expect(getHolidayName("2026-11-11", "MB")).toBeNull();
  });
});

describe("New Brunswick's 8 public holidays", () => {
  test("resolves all eight for 2026 -- no Victoria Day, unlike most other provinces", () => {
    expect(getHolidaysForYear("NB", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Family Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-08-03", name: "New Brunswick Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });
});

describe("Nova Scotia's 6 general holidays", () => {
  test("resolves all six for 2026 -- no Victoria Day, no Thanksgiving, no separate Remembrance Day", () => {
    expect(getHolidaysForYear("NS", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Nova Scotia Heritage Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Remembrance Day, Boxing Day and Natal Day are confirmed absent from the Code list", () => {
    expect(getHolidayName("2026-11-11", "NS")).toBeNull();
    expect(getHolidayName("2026-12-26", "NS")).toBeNull();
    expect(getHolidayName("2026-08-03", "NS")).toBeNull();
  });
});

describe("Prince Edward Island's 8 paid holidays", () => {
  test("resolves all eight for 2026 -- Islander Day, no Victoria Day, no Thanksgiving, no August holiday", () => {
    expect(getHolidaysForYear("PE", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-02-16", name: "Islander Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "National Day for Truth and Reconciliation" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });
});

describe("Newfoundland and Labrador's 6 public holidays", () => {
  test("resolves all six for 2026 -- the shortest list, with Memorial Day instead of Canada Day", () => {
    expect(getHolidaysForYear("NL", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-07-01", name: "Memorial Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("has no Family Day equivalent and no Thanksgiving Day entitlement", () => {
    expect(getHolidayName("2026-02-16", "NL")).toBeNull();
    expect(getHolidayName("2026-10-12", "NL")).toBeNull();
  });
});

describe("the Family-Day family is not uniform across provinces", () => {
  test("the same 3rd-Monday-of-February date carries a different name (or none) in each jurisdiction", () => {
    const day = "2026-02-16";
    expect(getHolidayName(day, "ON")).toBe("Family Day");
    expect(getHolidayName(day, "MB")).toBe("Louis Riel Day");
    expect(getHolidayName(day, "PE")).toBe("Islander Day");
    expect(getHolidayName(day, "NS")).toBe("Nova Scotia Heritage Day");
    expect(getHolidayName(day, "NL")).toBeNull(); // NL has none at all
  });
});

describe("the National Day for Truth and Reconciliation is not uniform across provinces", () => {
  test("statutory in BC, Manitoba and PEI; not statutory in ON, AB, SK, NB or NS", () => {
    const day = "2026-09-30";
    expect(getHolidayName(day, "BC")).toBe("National Day for Truth and Reconciliation");
    expect(getHolidayName(day, "MB")).toBe("Orange Shirt Day (National Day for Truth and Reconciliation)");
    expect(getHolidayName(day, "PE")).toBe("National Day for Truth and Reconciliation");
    expect(getHolidayName(day, "ON")).toBeNull();
    expect(getHolidayName(day, "AB")).toBeNull();
    expect(getHolidayName(day, "SK")).toBeNull();
    expect(getHolidayName(day, "NB")).toBeNull();
    expect(getHolidayName(day, "NS")).toBeNull();
  });
});

describe("Quebec's 8 statutory holidays", () => {
  test("resolves all eight for 2026", () => {
    expect(getHolidaysForYear("QC", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday (or Easter Monday, employer's choice)" },
      { date: "2026-05-18", name: "National Patriots' Day" },
      { date: "2026-06-24", name: "Fete nationale du Quebec" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Canada Day shifts off a Sunday in Quebec too", () => {
    expect(getHolidayName("2029-07-02", "QC")).toBe("Canada Day");
  });

  test("no Victoria Day, no Boxing Day, no Family Day, no August holiday", () => {
    expect(getHolidayName("2026-05-18", "QC")).not.toBe("Victoria Day"); // it's Patriots' Day
    expect(getHolidayName("2026-12-26", "QC")).toBeNull();
    expect(getHolidayName("2026-02-16", "QC")).toBeNull();
    expect(getHolidayName("2026-08-03", "QC")).toBeNull();
  });
});

describe("Yukon's 11 statutory holidays", () => {
  test("resolves all eleven for 2026, with Discovery Day and National Indigenous Peoples Day", () => {
    expect(getHolidaysForYear("YT", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-06-21", name: "National Indigenous Peoples Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-08-17", name: "Discovery Day" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "National Day for Truth and Reconciliation" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("Yukon's Heritage Day is not statutory despite the name existing", () => {
    expect(getHolidayName("2026-02-16", "YT")).toBeNull();
  });
});

describe("Northwest Territories' 11 statutory holidays", () => {
  test("resolves all eleven for 2026", () => {
    expect(getHolidaysForYear("NT", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-06-21", name: "National Indigenous Peoples Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-08-03", name: "Civic Holiday" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "National Day for Truth and Reconciliation" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("NWT does have a mandatory August civic holiday, unlike Alberta or Manitoba", () => {
    expect(getHolidayName("2026-08-03", "NT")).toBe("Civic Holiday");
  });
});

describe("Nunavut's 11 statutory general holidays", () => {
  test("resolves all eleven for 2026, with Nunavut Day and no National Indigenous Peoples Day", () => {
    expect(getHolidaysForYear("NU", 2026)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-05-18", name: "Victoria Day" },
      { date: "2026-07-01", name: "Canada Day" },
      { date: "2026-07-09", name: "Nunavut Day" },
      { date: "2026-08-03", name: "August Civic Holiday" },
      { date: "2026-09-07", name: "Labour Day" },
      { date: "2026-09-30", name: "National Day for Truth and Reconciliation" },
      { date: "2026-10-12", name: "Thanksgiving Day" },
      { date: "2026-11-11", name: "Remembrance Day" },
      { date: "2026-12-25", name: "Christmas Day" },
    ]);
  });

  test("confirmed absent despite a conflicting web search claim: National Indigenous Peoples Day", () => {
    expect(getHolidayName("2026-06-21", "NU")).toBeNull();
  });
});

describe("every jurisdiction is now configured", () => {
  test("all 13 provinces and territories have a sourced holiday list", () => {
    for (const province of PROVINCE_ORDER) {
      expect(isProvinceConfigured(province)).toBe(true);
      expect(getHolidaysForYear(province, 2026).length).toBeGreaterThan(0);
    }
  });
});
