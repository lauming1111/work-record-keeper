/**
 * Canadian statutory/general holidays, by province or territory.
 *
 * Holiday RULES (which weekday of which month) don't change from year to
 * year, so each is stored as a rule and resolved to a concrete date on
 * request, the same way a birthday recurs on a calendar. Only Ontario's list
 * is populated today; every other jurisdiction is scoped for a follow-up once
 * its own list has been sourced and verified the same way — see AGENTS.md.
 * Do not add a jurisdiction from memory. Each one needs its own citation to
 * that jurisdiction's employment/labour standards authority, because the
 * holidays that carry statutory pay entitlements differ by province in ways
 * that are easy to get wrong (Boxing Day, Easter Monday, National Day for
 * Truth and Reconciliation, and the Family-Day family of holidays are
 * NOT observed uniformly across Canada).
 */

export type Province = "ON" | "QC" | "BC" | "AB" | "SK" | "MB" | "NB" | "NS" | "PE" | "NL" | "YT" | "NT" | "NU";

export const DEFAULT_PROVINCE: Province = "ON";

export const PROVINCE_LABELS: Record<Province, string> = {
  ON: "Ontario (Toronto)",
  QC: "Quebec",
  BC: "British Columbia",
  AB: "Alberta",
  SK: "Saskatchewan",
  MB: "Manitoba",
  NB: "New Brunswick",
  NS: "Nova Scotia",
  PE: "Prince Edward Island",
  NL: "Newfoundland and Labrador",
  YT: "Yukon",
  NT: "Northwest Territories",
  NU: "Nunavut",
};

export const PROVINCE_ORDER: Province[] = [
  "ON", "QC", "BC", "AB", "SK", "MB", "NB", "NS", "PE", "NL", "YT", "NT", "NU",
];

/** True only for jurisdictions with a sourced, verified holiday list. */
export const isProvinceConfigured = (province: Province): boolean =>
  (PROVINCE_HOLIDAYS[province]?.length ?? 0) > 0;

export type HolidayRule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "nthWeekday"; month: number; weekday: number; n: number }
  | { kind: "weekdayOnOrBefore"; month: number; day: number; weekday: number }
  | { kind: "easterOffset"; offsetDays: number }
  /** A fixed date, observed the next day when it falls on a Sunday. Only use
   *  this where a jurisdiction's own source states the shift -- several
   *  provinces do NOT shift their fixed holidays off a Sunday at all. */
  | { kind: "fixedShiftSundayToMonday"; month: number; day: number };

export type HolidayDef = { name: string; rule: HolidayRule };

const MON = 1;

/**
 * Ontario's nine ESA public holidays, in the order ontario.ca lists them.
 * https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays
 */
const ONTARIO_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Family Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
  { name: "Boxing Day", rule: { kind: "fixed", month: 12, day: 26 } },
];

/**
 * British Columbia's 11 statutory holidays. Employment Standards Act,
 * R.S.B.C. 1996, c. 113, s. 1(1) (definition of "statutory holiday");
 * National Day for Truth and Reconciliation Act, S.B.C. 2023, c. 4, effective
 * 2023. https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96113_01
 * https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays
 *
 * Confirmed NOT statutory in BC: Easter Monday, Boxing Day, National
 * Indigenous Peoples Day -- gov.bc.ca states plainly that Easter Sunday,
 * Easter Monday and Boxing Day "are not statutory holidays in B.C."
 */
const BC_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Family Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "British Columbia Day", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "National Day for Truth and Reconciliation", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Alberta's 9 mandatory general holidays. Employment Standards Code,
 * R.S.A. 2000, c. E-9, Part 2, Division 5; alberta.ca "Alberta general
 * holidays". https://www.alberta.ca/alberta-general-holidays
 *
 * Alberta.ca separately lists Easter Monday, Boxing Day, Heritage Day (the
 * August civic holiday) and the National Day for Truth and Reconciliation as
 * "optional general holidays" -- employer's discretion, no default statutory
 * pay entitlement -- so none of those four are included here.
 */
const ALBERTA_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Family Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  // alberta.ca: "July 1, except when July 1 falls on a Sunday, in which case
  // it is July 2" -- a shift stated for Canada Day specifically, not for
  // Alberta's other fixed-date holidays.
  { name: "Canada Day", rule: { kind: "fixedShiftSundayToMonday", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Saskatchewan's 10 public (statutory) holidays. saskatchewan.ca,
 * "Public (Statutory) Holidays" and "List of Saskatchewan Public Holidays".
 * https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays
 *
 * "If a holiday falls on Sunday, the following Monday is observed; Saturday
 * holidays are not moved" -- applied here to the fixed-date holidays only;
 * the weekday-rule holidays (Family Day, Victoria Day, Labour Day,
 * Thanksgiving) and Saskatchewan Day are Mondays by construction and Good
 * Friday is a Friday by construction, so the shift cannot apply to them.
 * Confirmed NOT statutory: Easter Monday, Boxing Day, National Day for
 * Truth and Reconciliation (saskatchewan.ca states it directly: NDTR "is not
 * a public holiday under The Saskatchewan Employment Act").
 */
const SASKATCHEWAN_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixedShiftSundayToMonday", month: 1, day: 1 } },
  { name: "Family Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Canada Day", rule: { kind: "fixedShiftSundayToMonday", month: 7, day: 1 } },
  { name: "Saskatchewan Day", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixedShiftSundayToMonday", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixedShiftSundayToMonday", month: 12, day: 25 } },
];

/**
 * Manitoba's 9 general holidays. The Employment Standards Code, C.C.S.M.
 * c. E110, Part 2, Division 4; gov.mb.ca "General Holidays" factsheet; Bill 4
 * (Orange Shirt Day), Royal Assent 2023-12-07, effective immediately, first
 * observed 2024.
 * https://www.gov.mb.ca/labour/standards/doc,gen-holidays-after-april-30-07,factsheet.html
 *
 * Manitoba's February holiday is legislated as "Louis Riel Day", not "Family
 * Day" -- same 3rd-Monday-of-February rule, different name. Confirmed NOT a
 * general holiday: Easter Monday, Boxing Day, the August Civic Holiday
 * (gov.mb.ca lists it explicitly among days that "are not general
 * holidays"). Canada Day is coded as a plain fixed date: a secondary source
 * suggested a Sunday shift, but our source could not confirm it against
 * Manitoba's own primary text, so it is left unshifted rather than guessed.
 *
 * Remembrance Day is deliberately NOT included here: it is not one of
 * Manitoba's 9 general holidays and instead runs under the separate
 * Remembrance Day Act, C.C.S.M. c. R80, with a different pay formula (at
 * least a half day at 1.5x, or an averaging rule) and a right for an
 * employee to refuse the shift with 14 days' notice -- a different
 * mechanism this app does not model, so it is left off the list rather than
 * be marked with the wrong rule.
 */
const MANITOBA_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Louis Riel Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Orange Shirt Day (National Day for Truth and Reconciliation)", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * New Brunswick's 8 public holidays. Employment Standards Act, SNB 1982,
 * c E-7.2, s.1 "public holiday" definition. Family Day added effective the
 * 2018 holiday. https://laws.gnb.ca/en/showdoc/cs/E-7.2
 * https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards/holiday-vacation.html
 *
 * Confirmed NOT statutory: Easter Monday, Boxing Day, National Day for Truth
 * and Reconciliation (a general provincial observance and a public-sector
 * holiday, but not in the Act's 8-item private-sector list).
 *
 * gnb.ca's own guide names roughly 14 occupational categories (e.g. licensed
 * professionals, real estate and vehicle salespeople) as not qualifying for
 * public-holiday pay -- an occupation-level carve-out this app has no way to
 * know about, so it is not modeled; every date below is still a genuine
 * public holiday under the Act.
 */
const NEW_BRUNSWICK_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Family Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "New Brunswick Day", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Nova Scotia's 6 general holidays under the Labour Standards Code, RSNS
 * 1989, c 246, s.2(ga). https://novascotia.ca/lae/employmentrights/holidaypay.asp
 *
 * The Code's own text defines the February holiday only as "the third Monday
 * in February" -- it does not use the name "Heritage Day" -- but that is the
 * universal public and government name for the same day, used here for
 * readability. Confirmed NOT a Code general holiday: Easter Monday, Victoria
 * Day, Natal Day (NS's August civic holiday), and Boxing Day -- novascotia.ca
 * states directly that Easter Monday, Victoria Day and Natal Day "are
 * commonly recognized as holidays but are not paid general holidays," and
 * Boxing Day appears only on the separate retail-closing-day list.
 *
 * Remembrance Day is deliberately NOT included: it runs under the separate
 * Remembrance Day Act, RSNS 1989, c 396, with most businesses required to
 * close rather than the usual pay-premium/substitute-day mechanism -- a
 * different regime this app does not model, matching the same choice made
 * for Manitoba's Remembrance Day above.
 */
const NOVA_SCOTIA_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Nova Scotia Heritage Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Prince Edward Island's 8 paid holidays. Employment Standards Act (new,
 * in force since 2026-06-30) s.1(1)(n); carried forward unchanged from the
 * predecessor Act as amended by Bill 22 (2021), which added the National Day
 * for Truth and Reconciliation for all employees from the outset.
 * https://docs.assembly.pe.ca (Bill No. 76, 2024)
 *
 * Confirmed NOT a paid holiday: Easter Monday, Boxing Day. PEI has no August
 * civic holiday under the Act at all, in either version.
 */
const PEI_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Islander Day", rule: { kind: "nthWeekday", month: 2, weekday: MON, n: 3 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "National Day for Truth and Reconciliation", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Newfoundland and Labrador's 6 public holidays under the Labour Standards
 * Act, RSNL 1990, c L-2, s.14(1) -- quoted directly: "'public holiday' means
 * (a) New Year's Day; (b) Good Friday; (b.1) Remembrance Day; (c) Memorial
 * Day; (d) Labour Day; (e) Christmas Day". https://assembly.nl.ca/legislation/sr/statutes/l02.htm
 *
 * NL is deliberately the shortest list of the jurisdictions sourced so far --
 * this is a real feature of the Act, not a gap in sourcing. Confirmed
 * directly from the Act text: NL has no Family Day equivalent and no
 * Thanksgiving Day entitlement (the word "Thanksgiving" does not appear in
 * the Act at all; it is only a retail closing day under a different statute).
 * "Memorial Day" is NL's own name for July 1, commemorating the WWI losses at
 * Beaumont-Hamel, observed concurrently with Canada Day but legislated under
 * its own name.
 *
 * Excluded on purpose, all confirmed to be government-employee-only Treasury
 * Board policy rather than Labour Standards Act entitlements binding on
 * private employers generally: St. Patrick's Day, St. George's Day, the June
 * Holiday, Orangemen's Day (each observed on the nearest Monday to a fixed
 * date), Boxing Day, and the National Day for Truth and Reconciliation
 * (whose inclusion even for government employees was still marked
 * "consultations ongoing" in the government's own 2026 schedule).
 */
const NL_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Memorial Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Quebec's 8 statutory holidays. Act respecting labour standards, CQLR c
 * N-1.1, s.60 (7 days) plus the separately-legislated National Holiday Act,
 * CQLR c F-1.1 (Fete nationale / St-Jean-Baptiste). https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays
 *
 * s.60 names a single holiday slot as "Good Friday or Easter Monday, at the
 * option of the employer" -- a real choice this app cannot know, not a
 * missing fact. Rather than assert one or the other, it is named to disclose
 * the ambiguity, defaulting to Good Friday (the more common choice, and the
 * one every other jurisdiction sourced so far uses in this slot).
 *
 * Fete nationale (June 24) shifts to June 25 only when June 24 falls on a
 * Sunday AND the employee doesn't normally work Sundays -- a condition this
 * app has no data for, so it is coded as a plain fixed date, not shifted.
 *
 * Confirmed NOT statutory: Boxing Day, National Day for Truth and
 * Reconciliation, National Indigenous Peoples Day, a Family Day equivalent,
 * a civic (August) holiday -- CNESST's own list is exhaustive at 8 days.
 */
const QUEBEC_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Good Friday (or Easter Monday, employer's choice)", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "National Patriots' Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Fete nationale du Quebec", rule: { kind: "fixed", month: 6, day: 24 } },
  { name: "Canada Day", rule: { kind: "fixedShiftSundayToMonday", month: 7, day: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Yukon's 11 statutory holidays under the Employment Standards Act, RSY
 * 2002, c.72. https://yukon.ca/en/employment/employment-standards/find-out-about-general-holiday-pay-under-employment-standards-act
 *
 * Discovery Day (3rd Monday of August, commemorating the 1896 Klondike gold
 * discovery) fills the civic-holiday slot and is a genuine statutory
 * entitlement, not a local custom. Confirmed NOT statutory: Easter Monday,
 * Boxing Day, and -- despite the name existing -- Yukon's "Heritage Day" in
 * February, which yukon.ca explicitly lists as not a statutory holiday.
 */
const YUKON_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "National Indigenous Peoples Day", rule: { kind: "fixed", month: 6, day: 21 } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Discovery Day", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 3 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "National Day for Truth and Reconciliation", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Northwest Territories' 11 statutory holidays. Employment Standards Act,
 * SNWT 2007, c.13, s.22(1), fetched directly from the official consolidated
 * text. https://www.justice.gov.nt.ca/en/files/legislation/employment-standards/employment-standards.a.pdf
 *
 * s.22(1)(f) legislates "the first Monday in August" without naming it;
 * "Civic Holiday" here is the common payroll name, not the Act's own text.
 * Confirmed NOT statutory: Easter Monday, Boxing Day, a Family Day
 * equivalent -- the ECE's own FAQ states Easter Monday and Boxing Day
 * directly: "they are not addressed as statutory holidays."
 */
const NWT_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "National Indigenous Peoples Day", rule: { kind: "fixed", month: 6, day: 21 } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Civic Holiday", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "National Day for Truth and Reconciliation", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

/**
 * Nunavut's 11 statutory "general holidays". Labour Standards Act, C.S.Nu.
 * c.L-10, s.1 (definitions), quoted directly: "'general holiday' means New
 * Year's Day, Good Friday, Canada Day, Nunavut Day, the first Monday in
 * August, Labour Day, National Day for Truth and Reconciliation... ,
 * Thanksgiving Day, Remembrance Day, Christmas Day, and the day fixed... for
 * observance of the birthday of the reigning sovereign".
 * https://www.gov.nu.ca/en/employment-training-and-career-development/labour-and-employment-standards-nunavut
 *
 * Nunavut Day (July 9) is Nunavut-specific, commemorating the Nunavut Land
 * Claims Agreement Act, extended to all territorially-regulated employees
 * in 2020. The Act names the May holiday only as "the birthday of the
 * reigning sovereign"; "Victoria Day" is used here as the common name for
 * the same date rule, matching every other jurisdiction sourced.
 *
 * Confirmed NOT statutory: Easter Monday, Boxing Day, a Family Day
 * equivalent. National Indigenous Peoples Day is confirmed absent too, on a
 * direct full-text search of the Act -- despite a web search result
 * incorrectly claiming otherwise, which is disregarded here.
 */
const NUNAVUT_HOLIDAYS: HolidayDef[] = [
  { name: "New Year's Day", rule: { kind: "fixed", month: 1, day: 1 } },
  { name: "Good Friday", rule: { kind: "easterOffset", offsetDays: -2 } },
  { name: "Victoria Day", rule: { kind: "weekdayOnOrBefore", month: 5, day: 24, weekday: MON } },
  { name: "Canada Day", rule: { kind: "fixed", month: 7, day: 1 } },
  { name: "Nunavut Day", rule: { kind: "fixed", month: 7, day: 9 } },
  { name: "August Civic Holiday", rule: { kind: "nthWeekday", month: 8, weekday: MON, n: 1 } },
  { name: "Labour Day", rule: { kind: "nthWeekday", month: 9, weekday: MON, n: 1 } },
  { name: "National Day for Truth and Reconciliation", rule: { kind: "fixed", month: 9, day: 30 } },
  { name: "Thanksgiving Day", rule: { kind: "nthWeekday", month: 10, weekday: MON, n: 2 } },
  { name: "Remembrance Day", rule: { kind: "fixed", month: 11, day: 11 } },
  { name: "Christmas Day", rule: { kind: "fixed", month: 12, day: 25 } },
];

export const PROVINCE_HOLIDAYS: Record<Province, HolidayDef[]> = {
  ON: ONTARIO_HOLIDAYS,
  QC: QUEBEC_HOLIDAYS,
  BC: BC_HOLIDAYS,
  AB: ALBERTA_HOLIDAYS,
  SK: SASKATCHEWAN_HOLIDAYS,
  MB: MANITOBA_HOLIDAYS,
  NB: NEW_BRUNSWICK_HOLIDAYS,
  NS: NOVA_SCOTIA_HOLIDAYS,
  PE: PEI_HOLIDAYS,
  NL: NL_HOLIDAYS,
  YT: YUKON_HOLIDAYS,
  NT: NWT_HOLIDAYS,
  NU: NUNAVUT_HOLIDAYS,
};

/**
 * Easter Sunday (Gregorian), via the Anonymous/Meeus-Jones-Butcher computus.
 * Pure arithmetic, not a jurisdictional fact -- no citation needed, only a
 * hand trace against known dates (see calc.test.ts: 2026-04-05, 2027-03-28).
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The nth given weekday of a month (n is 1-based: 1st, 2nd, 3rd...). */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month - 1, 1);
  const firstOffset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + firstOffset + (n - 1) * 7);
}

/** The most recent instance of `weekday` on or before the given calendar date. */
function weekdayOnOrBefore(year: number, month: number, day: number, weekday: number): Date {
  const target = new Date(year, month - 1, day);
  const back = (target.getDay() - weekday + 7) % 7;
  return addDays(target, -back);
}

export function resolveHolidayDate(year: number, rule: HolidayRule): Date {
  switch (rule.kind) {
    case "fixed":
      return new Date(year, rule.month - 1, rule.day);
    case "nthWeekday":
      return nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.n);
    case "weekdayOnOrBefore":
      return weekdayOnOrBefore(year, rule.month, rule.day, rule.weekday);
    case "easterOffset":
      return addDays(easterSunday(year), rule.offsetDays);
    case "fixedShiftSundayToMonday": {
      const fixed = new Date(year, rule.month - 1, rule.day);
      return fixed.getDay() === 0 ? addDays(fixed, 1) : fixed;
    }
  }
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export type ResolvedHoliday = { date: string; name: string };

/** Every holiday for one jurisdiction and year, sorted by date. */
export function getHolidaysForYear(province: Province, year: number): ResolvedHoliday[] {
  return PROVINCE_HOLIDAYS[province]
    .map(h => ({ date: toYmd(resolveHolidayDate(year, h.rule)), name: h.name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** The holiday name on this date for this jurisdiction, or null if it isn't one. */
export function getHolidayName(dateStr: string, province: Province): string | null {
  const year = Number(dateStr.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const found = getHolidaysForYear(province, year).find(h => h.date === dateStr);
  return found ? found.name : null;
}
