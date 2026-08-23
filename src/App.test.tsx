import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import { jobStorageKey } from "./storage";

type MockFile = File & { __dataUrl?: string; __text?: string };

class MockFileReader {
  onload: ((ev: { target: { result: string } }) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: MockFile) {
    this.result = file.__dataUrl || "data:image/jpeg;base64,stub";
    setTimeout(() => this.onload?.({ target: { result: this.result || "" } }), 0);
  }

  readAsText(file: MockFile) {
    this.result = file.__text || "";
    setTimeout(() => this.onload?.({ target: { result: this.result || "" } }), 0);
  }
}

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 2000;
  naturalHeight = 1500;
  width = 2000;
  height = 1500;
  private _src = "";

  set src(value: string) {
    this._src = value;
    setTimeout(() => this.onload?.(), 0);
  }

  get src() {
    return this._src;
  }
}

const originalUserAgent = navigator.userAgent;

beforeAll(() => {
  Object.defineProperty(window.navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
  (global as any).FileReader = MockFileReader;
  (global as any).Image = MockImage;
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    drawImage: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  })) as any;
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/jpeg;base64,compressed");
});

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

afterEach(() => {
  Object.defineProperty(window.navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
});

test("renders core sections", () => {
  render(<App />);
  expect(screen.getByText("Work Record Keeper")).toBeInTheDocument();
  expect(screen.getByText("Roster")).toBeInTheDocument();
  expect(screen.getAllByText("Upload Image").length).toBeGreaterThan(0);
  expect(screen.getByText("Item List")).toBeInTheDocument();
});

test("language toggle switches to zh-tw", () => {
  render(<App />);
  fireEvent.click(screen.getByText("中文"));
  expect(screen.getByText("工時記錄器")).toBeInTheDocument();
});

test("dark mode toggle updates body class", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Dark"));
  expect(document.body.classList.contains("dark")).toBe(true);
});

test("add and remove job", () => {
  const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Side Job");
  const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

  render(<App />);
  // scoped to the job tabs: the all-jobs summary lists job names too
  const jobTabs = () => within(document.querySelector(".job-tabs") as HTMLElement);
  fireEvent.click(screen.getByText("+ Job"));
  expect(jobTabs().getByText("Side Job")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Remove Job"));
  expect(jobTabs().queryByText("Side Job")).not.toBeInTheDocument();
  expect(jobTabs().getByText("Main Job")).toBeInTheDocument();

  promptSpy.mockRestore();
  confirmSpy.mockRestore();
});

test("add and remove item", () => {
  const { container } = render(<App />);
  const initialItems = container.querySelectorAll(".item-name");
  expect(initialItems.length).toBe(3);

  fireEvent.click(screen.getByText("+ Add Item"));
  const afterAdd = container.querySelectorAll(".item-name");
  expect(afterAdd.length).toBe(4);

  const removeButtons = screen.getAllByText("✕");
  fireEvent.click(removeButtons[removeButtons.length - 1]);
  const afterRemove = container.querySelectorAll(".item-name");
  expect(afterRemove.length).toBe(3);
});

test("auto-fill weekdays populates hours inputs", async () => {
  const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("8");
  render(<App />);

  fireEvent.click(screen.getByText("Auto-fill Weekdays"));

  await waitFor(() => {
    const hoursInputs = screen.getAllByPlaceholderText("Hours") as HTMLInputElement[];
    expect(hoursInputs.some(input => input.value === "8")).toBe(true);
  });

  promptSpy.mockRestore();
});

test("reset month hours requires confirmation and clears values", async () => {
  const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("8");
  render(<App />);

  fireEvent.click(screen.getByText("Auto-fill Weekdays"));
  await waitFor(() => {
    const hoursInputs = screen.getAllByPlaceholderText("Hours") as HTMLInputElement[];
    expect(hoursInputs.some(input => input.value === "8")).toBe(true);
  });

  fireEvent.click(screen.getByText("Reset Month Hours"));
  expect(screen.getByText("Reset this month's hours?")).toBeInTheDocument();
  fireEvent.click(screen.getByText("OK, Reset"));

  await waitFor(() => {
    const hoursInputs = screen.getAllByPlaceholderText("Hours") as HTMLInputElement[];
    expect(hoursInputs.every(input => input.value === "" || input.value === "0")).toBe(true);
  });

  promptSpy.mockRestore();
});

test("roster upload enables view and allows removal (mobile compression path)", async () => {
  Object.defineProperty(window.navigator, "userAgent", {
    value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    configurable: true,
  });

  const { container } = render(<App />);
  const uploadLabel = screen.getAllByText("Upload Image")[0].closest("label");
  expect(uploadLabel).toBeTruthy();

  const fileInput = uploadLabel!.querySelector("input[type=\"file\"]") as HTMLInputElement;
  const rosterItem = uploadLabel!.closest(".roster-item") as HTMLElement;
  const file = new File(["fake"], "roster.jpg", { type: "image/jpeg" }) as MockFile;
  file.__dataUrl = "data:image/jpeg;base64,original";

  fireEvent.change(fileInput, { target: { files: [file] } });

  await waitFor(() => {
    const viewButton = within(rosterItem).getByText("View Image") as HTMLButtonElement;
    expect(viewButton).toBeEnabled();
  });

  const removeButton = within(rosterItem).getByLabelText("Remove Photo");
  fireEvent.click(removeButton);
  fireEvent.click(screen.getByText("Yes, Remove"));

  await waitFor(() => {
    const viewButton = within(rosterItem).getByText("View Image") as HTMLButtonElement;
    expect(viewButton).toBeDisabled();
  });
});

test("export data triggers download", () => {
  if (!URL.createObjectURL) {
    (URL as any).createObjectURL = () => "blob:export";
  }
  if (!URL.revokeObjectURL) {
    (URL as any).revokeObjectURL = () => {};
  }
  const createObjectURLSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
  const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(<App />);
  fireEvent.click(screen.getByText("Export Data"));

  expect(createObjectURLSpy).toHaveBeenCalled();
  expect(clickSpy).toHaveBeenCalled();
  expect(revokeSpy).toHaveBeenCalled();
});

test("import data shows notification", async () => {
  render(<App />);
  const payload = {
    items: [{ id: 1, name: "Rent", price: 0, taxable: false, enabled: true }],
    hourlyRate: 20,
    startDate: "2025-01-01",
    dayHours: [],
    payCycle: "biweekly",
    roster: { weekly: {}, monthly: {} },
  };
  const file = new File([JSON.stringify(payload)], "import.json", { type: "application/json" }) as MockFile;
  file.__text = JSON.stringify(payload);

  const importLabel = screen.getByText("Import Data").closest("label");
  const importInput = importLabel!.querySelector("input[type=\"file\"]") as HTMLInputElement;
  fireEvent.change(importInput, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByText("Imported data")).toBeInTheDocument();
  });
});

test("app does not crash if localStorage is full", () => {
  const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("QuotaExceededError", "QuotaExceededError");
  });

  render(<App />);
  expect(screen.getByText("Work Record Keeper")).toBeInTheDocument();

  setItemSpy.mockRestore();
});

/* ---------------- multiple jobs, each on its own salary rate ---------------- */

const seedJob = (id: string, rate: string, hours: number) => {
  localStorage.setItem(jobStorageKey(id, "hourlyRate"), rate);
  localStorage.setItem(jobStorageKey(id, "startDate"), "2026-01-01");
  localStorage.setItem(jobStorageKey(id, "currentDate"), new Date("2026-01-15T00:00:00Z").toISOString());
  localStorage.setItem(jobStorageKey(id, "dayHours"), JSON.stringify([{ date: "2026-01-02", hours }]));
};

const seedTwoJobs = () => {
  localStorage.setItem("w2b_jobs", JSON.stringify([
    { id: "cafe", name: "Cafe" },
    { id: "studio", name: "Studio" },
  ]));
  localStorage.setItem("w2b_activeJob", "cafe");
  seedJob("cafe", "20", 8);   // 8h at $20 -> $161.80 after tax
  seedJob("studio", "30", 8); // 8h at $30 -> $238.69 after tax
  localStorage.setItem(jobStorageKey("cafe", "items"), JSON.stringify([
    { id: 1, name: "Laptop", price: 500, taxable: false, enabled: true },
  ]));
};

const allJobsTable = () => document.querySelector(".all-jobs-table") as HTMLElement;
const rateInput = () => document.querySelector(".controls input[type=\"number\"]") as HTMLInputElement;

test("hides the all-jobs summary when there is only one job", () => {
  render(<App />);
  expect(screen.queryByText("All Jobs")).not.toBeInTheDocument();
});

test("lists every job with its own hourly rate", () => {
  seedTwoJobs();
  render(<App />);

  const table = within(allJobsTable());
  expect(table.getByText("Cafe")).toBeInTheDocument();
  expect(table.getByText("Studio")).toBeInTheDocument();
  expect(table.getByText("$20.00")).toBeInTheDocument();
  expect(table.getByText("$30.00")).toBeInTheDocument();
  expect(table.getByText("$161.80")).toBeInTheDocument();
  expect(table.getByText("$238.69")).toBeInTheDocument();
});

test("shows the combined after-tax total across jobs", () => {
  seedTwoJobs();
  render(<App />);

  const table = within(allJobsTable());
  expect(table.getByText("$400.49")).toBeInTheDocument(); // 161.80 + 238.69
  expect(table.getByText("16.00")).toBeInTheDocument();   // 8h + 8h
});

test("combining jobs counts every job toward the buy-list progress", () => {
  seedTwoJobs();
  render(<App />);

  // active job only: 161.80 / 500
  expect(screen.getByText("32.36%")).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Count all jobs toward progress"));

  // all jobs: 400.49 / 500
  expect(screen.getByText("80.10%")).toBeInTheDocument();
  expect(localStorage.getItem("w2b_combineJobs")).toBe("1");
});

test("the combine setting is restored from storage", () => {
  seedTwoJobs();
  localStorage.setItem("w2b_combineJobs", "1");
  render(<App />);

  expect((screen.getByLabelText("Count all jobs toward progress") as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText("80.10%")).toBeInTheDocument();
});

test("switching jobs loads that job's own hourly rate", () => {
  seedTwoJobs();
  render(<App />);
  expect(rateInput().value).toBe("20");

  fireEvent.click(screen.getByRole("button", { name: "Studio" }));

  expect(rateInput().value).toBe("30");
  // the combined total does not change with the active job
  expect(within(allJobsTable()).getByText("$400.49")).toBeInTheDocument();
});

test("editing the rate of one job leaves the other job's earnings alone", () => {
  seedTwoJobs();
  render(<App />);

  fireEvent.change(rateInput(), { target: { value: "40" } });

  const table = within(allJobsTable());
  expect(table.getByText("$40.00")).toBeInTheDocument();
  expect(table.getByText("$315.59")).toBeInTheDocument(); // Cafe, 8h at $40
  expect(table.getByText("$238.69")).toBeInTheDocument(); // Studio, untouched
});

test("the all-jobs table keeps the columns its responsive styles target", () => {
  seedTwoJobs();
  render(<App />);

  const table = allJobsTable();
  // the job column is the one that wraps; the rest stay on one line
  const header = table.querySelectorAll("thead th");
  expect(header).toHaveLength(4);
  expect(header[0]).toHaveClass("aj-name");
  expect(header[1]).not.toHaveClass("aj-name");

  // no inline widths: the mobile rules size the columns
  header.forEach(th => expect(th.getAttribute("style")).toBeNull());

  table.querySelectorAll("tbody tr").forEach(row => {
    expect(row.querySelectorAll("td")).toHaveLength(4);
    expect(row.querySelectorAll("td")[0]).toHaveClass("aj-name");
  });
});

test("number inputs in the calendar hide their spinners, which would offset the centred value", () => {
  // jsdom has no layout and no ::-webkit-* pseudo-elements, so this guards the
  // rule itself: without it Chrome reserves space for the spinner inside the
  // field and the centred number sits left of centre.
  const css = require("fs").readFileSync(require("path").join(__dirname, "App.css"), "utf8");
  expect(css).toMatch(/\.cal-input\[type="number"\]\s*\{[^}]*appearance:\s*textfield/);
  expect(css).toMatch(/\.cal-input\[type="number"\]::-webkit-inner-spin-button/);
});

/* ---------------- shopping list is charged sales tax, not income tax ---------------- */

test("taxable items are charged 13% HST on top of their price", () => {
  localStorage.setItem("w2b_jobs", JSON.stringify([{ id: "cafe", name: "Cafe" }]));
  localStorage.setItem("w2b_activeJob", "cafe");
  seedJob("cafe", "20", 8);
  localStorage.setItem(jobStorageKey("cafe", "items"), JSON.stringify([
    { id: 1, name: "Laptop", price: 1000, taxable: true, enabled: true },
  ]));
  render(<App />);

  // $1,000 + 13% HST = $1,130, so $161.80 earned is 14.32% of the goal
  expect(screen.getByText("14.32%")).toBeInTheDocument();
});

test("items marked non-taxable carry no sales tax", () => {
  localStorage.setItem("w2b_jobs", JSON.stringify([{ id: "cafe", name: "Cafe" }]));
  localStorage.setItem("w2b_activeJob", "cafe");
  seedJob("cafe", "20", 8);
  localStorage.setItem(jobStorageKey("cafe", "items"), JSON.stringify([
    { id: 1, name: "Rent", price: 1000, taxable: false, enabled: true },
  ]));
  render(<App />);

  // no HST, so $161.80 of a flat $1,000 goal
  expect(screen.getByText("16.18%")).toBeInTheDocument();
});

/* ---------------- mobile layout ---------------- */

/** Make the narrow-viewport media query report a phone until restored. */
const setNarrowViewport = (narrow: boolean) => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: narrow && query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => { window.matchMedia = original; };
};

const seedSingleJob = () => {
  localStorage.setItem("w2b_jobs", JSON.stringify([{ id: "cafe", name: "Cafe" }]));
  localStorage.setItem("w2b_activeJob", "cafe");
  seedJob("cafe", "20", 8);
};

test("on a phone the calendar is a compact grid with no inline inputs", () => {
  const restore = setNarrowViewport(true);
  try {
    seedSingleJob();
    render(<App />);

    // every day is a tap target, and the per-day inputs are gone from the grid
    expect(document.querySelectorAll(".cal-cell-compact").length).toBeGreaterThan(27);
    expect(document.querySelectorAll(".cal-cell .cal-hours-input")).toHaveLength(0);
    expect(screen.getByText("Tap a day to enter hours")).toBeInTheDocument();
  } finally {
    restore();
  }
});

test("on a desktop the calendar keeps its inline day inputs", () => {
  const restore = setNarrowViewport(false);
  try {
    seedSingleJob();
    render(<App />);

    expect(document.querySelectorAll(".cal-cell-compact")).toHaveLength(0);
    expect(document.querySelectorAll(".cal-cell .cal-hours-input").length).toBeGreaterThan(27);
  } finally {
    restore();
  }
});

test("tapping a day on a phone opens the editor for that date", () => {
  const restore = setNarrowViewport(true);
  try {
    seedSingleJob();
    render(<App />);

    expect(document.querySelector(".day-sheet")).toBeNull();
    fireEvent.click(document.querySelector('.cal-cell-compact[aria-label^="2026-01-02"]')!);

    const sheet = document.querySelector(".day-sheet") as HTMLElement;
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByText("2026-01-02")).toBeInTheDocument();
    // the seeded 8h day shows its after-tax pay
    expect(within(sheet).getByText("$161.80")).toBeInTheDocument();
  } finally {
    restore();
  }
});

test("editing hours in the day editor updates the day, and Done closes it", () => {
  const restore = setNarrowViewport(true);
  try {
    seedSingleJob();
    render(<App />);
    fireEvent.click(document.querySelector('.cal-cell-compact[aria-label^="2026-01-02"]')!);

    const sheet = () => document.querySelector(".day-sheet") as HTMLElement;
    fireEvent.change(sheet().querySelector(".cal-hours-input")!, { target: { value: "4" } });

    // 4h entered, half an hour of lunch comes off, so 3.5h is recorded
    expect(document.querySelector('.cal-cell-compact[aria-label^="2026-01-02"]')!.textContent).toContain("3.50h");

    fireEvent.click(within(sheet()).getByText("Done"));
    expect(document.querySelector(".day-sheet")).toBeNull();
  } finally {
    restore();
  }
});

test("wide tables label every cell so they can stack into cards on a phone", () => {
  seedSingleJob();
  render(<App />);

  const period = document.querySelector(".biweekly-card .stack-table tbody tr") as HTMLElement;
  expect(Array.from(period.querySelectorAll("td")).map(td => td.getAttribute("data-label")))
    .toEqual(["Period", "Hrs", "Period Date", "Earnings", "Overtime", "Income Tax", "EI", "CPP", "Net", "Take-Home"]);

  const detail = document.querySelector(".details-table.stack-table tbody tr") as HTMLElement;
  expect(Array.from(detail.querySelectorAll("td")).map(td => td.getAttribute("data-label")))
    .toEqual(["Date", "Hours", "Earnings", "Income Tax", "EI", "CPP", "After Tax"]);
});

/* ---------------- one-tap check in / check out ---------------- */

/**
 * Freeze the clock for one test. Both `getTorontoNowTime` and `getTorontoToday`
 * read `new Date()`, so this pins the stamp and the date it is filed under
 * together. Constructor arguments still pass through, which dayjs relies on.
 */
const withFrozenClock = (iso: string, run: () => void) => {
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) super(iso);
      else super(...(args as [any]));
    }
    static now() { return new RealDate(iso).getTime(); }
  }
  (global as any).Date = FrozenDate;
  try { run(); } finally { (global as any).Date = RealDate; }
};

/** 17:00 in Toronto, safely inside a normal working day. */
const AFTERNOON = "2026-08-22T21:00:00Z";

/** The date the app files "today" under, which is Toronto's, not the runner's. */
const torontoToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const seedForCheckIn = (today?: Partial<{ start: string; end: string; hours: number; lunchMinutes: number }>) => {
  localStorage.setItem("w2b_jobs", JSON.stringify([{ id: "cafe", name: "Cafe" }]));
  localStorage.setItem("w2b_activeJob", "cafe");
  localStorage.setItem(jobStorageKey("cafe", "hourlyRate"), "20");
  localStorage.setItem(jobStorageKey("cafe", "startDate"), "2026-01-01");
  localStorage.setItem(jobStorageKey("cafe", "dayHours"), JSON.stringify(
    today ? [{ date: torontoToday(), lunchMinutes: 30, ...today }] : []
  ));
};

const checkButton = () => document.querySelector(".check-btn") as HTMLButtonElement | null;
const undoButton = () => document.querySelector(".check-undo") as HTMLButtonElement | null;
const checkStatus = () => (document.querySelector(".check-status") as HTMLElement).textContent;
const storedToday = () =>
  JSON.parse(localStorage.getItem(jobStorageKey("cafe", "dayHours")) || "[]")
    .find((d: { date: string }) => d.date === torontoToday());

test("a day with no hours yet offers a check in", () => {
  seedForCheckIn();
  render(<App />);

  expect(checkButton()).toHaveTextContent("Check In");
  expect(checkButton()).not.toBeDisabled();
  expect(checkStatus()).toBe("Not started");
});

test("checking in stamps a start time and offers the check out", () => {
  seedForCheckIn();
  render(<App />);

  fireEvent.click(checkButton()!);

  expect(storedToday().start).toMatch(/^\d{2}:\d{2}$/);
  expect(storedToday().end).toBe("");
  expect(checkButton()).toHaveTextContent("Check Out");
  expect(checkStatus()).toContain("Checked in at");
});

test("checking out stamps the end time and works out the hours", () => {
  withFrozenClock(AFTERNOON, () => {
    // checked in at 09:00 with the default half hour of lunch
    seedForCheckIn({ start: "09:00", end: "" });
    render(<App />);
    expect(checkButton()).toHaveTextContent("Check Out");

    fireEvent.click(checkButton()!);

    // 09:00 to 17:00 less the half hour
    expect(storedToday()).toMatchObject({ end: "17:00", hours: 7.5 });
  });
});

test("a finished day offers no stamp button, so nothing can be overwritten", () => {
  seedForCheckIn({ start: "09:00", end: "17:00", hours: 7.5 });
  render(<App />);

  expect(checkButton()).toBeNull();
  expect(checkStatus()).toBe("09:00 – 17:00 · 7.50h");
  expect(document.querySelector(".check-card")).toHaveClass("done");
});

test("the card shrinks once the day is under way", () => {
  seedForCheckIn();
  render(<App />);
  expect(document.querySelector(".check-card")).not.toHaveClass("compact");

  fireEvent.click(checkButton()!);

  expect(document.querySelector(".check-card")).toHaveClass("compact");
});

test("undo steps a finished day back to its check out", () => {
  seedForCheckIn({ start: "09:00", end: "17:00", hours: 7.5 });
  render(<App />);

  fireEvent.click(undoButton()!);

  expect(storedToday()).toMatchObject({ start: "09:00", end: "" });
  expect(storedToday().hours).toBeNull();
  expect(checkButton()).toHaveTextContent("Check Out");
});

test("undo again clears the check in and the day goes back to untouched", () => {
  seedForCheckIn({ start: "09:00", end: "" });
  render(<App />);

  fireEvent.click(undoButton()!);

  expect(storedToday()).toBeUndefined();
  expect(checkButton()).toHaveTextContent("Check In");
  expect(checkStatus()).toBe("Not started");
  // nothing to undo from here
  expect(undoButton()).toBeNull();
});

test("a day that was never started has nothing to undo", () => {
  seedForCheckIn();
  render(<App />);
  expect(undoButton()).toBeNull();
});

test("the check in button tracks the active job, not the app as a whole", () => {
  localStorage.setItem("w2b_jobs", JSON.stringify([{ id: "cafe", name: "Cafe" }, { id: "studio", name: "Studio" }]));
  localStorage.setItem("w2b_activeJob", "cafe");
  for (const id of ["cafe", "studio"]) {
    localStorage.setItem(jobStorageKey(id, "hourlyRate"), "20");
    localStorage.setItem(jobStorageKey(id, "startDate"), "2026-01-01");
  }
  // only the cafe shift has been started
  localStorage.setItem(jobStorageKey("cafe", "dayHours"), JSON.stringify([{ date: torontoToday(), start: "09:00", end: "", lunchMinutes: 30 }]));
  localStorage.setItem(jobStorageKey("studio", "dayHours"), JSON.stringify([]));
  render(<App />);

  expect(checkButton()).toHaveTextContent("Check Out");

  fireEvent.click(screen.getByRole("button", { name: "Studio" }));

  expect(checkButton()).toHaveTextContent("Check In");
});

/* ---------------- stamping from a URL, for OS automations ---------------- */

/** Put a query string on the current URL the way a Shortcuts automation would. */
const visitWith = (query: string) => window.history.replaceState({}, "", query);

afterEach(() => window.history.replaceState({}, "", "/"));

test("?action=checkin stamps the start time on arrival", () => {
  withFrozenClock(AFTERNOON, () => {
    seedForCheckIn();
    visitWith("/?action=checkin");
    render(<App />);

    expect(storedToday().start).toBe("17:00");
    expect(checkStatus()).toBe("Checked in at 17:00");
  });
});

test("?action=checkout stamps the end time and works out the hours", () => {
  withFrozenClock(AFTERNOON, () => {
    seedForCheckIn({ start: "09:00", end: "" });
    visitWith("/?action=checkout");
    render(<App />);

    expect(storedToday()).toMatchObject({ end: "17:00", hours: 7.5 });
  });
});

test("arriving again never overwrites the start time already recorded", () => {
  seedForCheckIn({ start: "09:00", end: "" });
  visitWith("/?action=checkin");
  render(<App />);

  expect(storedToday().start).toBe("09:00");
  expect(screen.getByText("Already checked in at 09:00")).toBeInTheDocument();
});

test("leaving without having arrived records nothing", () => {
  seedForCheckIn();
  visitWith("/?action=checkout");
  render(<App />);

  expect(storedToday()).toBeUndefined();
  expect(screen.getByText("Not checked in yet")).toBeInTheDocument();
});

test("leaving again does not move the end time on a finished day", () => {
  seedForCheckIn({ start: "09:00", end: "17:00", hours: 7.5 });
  visitWith("/?action=checkout");
  render(<App />);

  expect(storedToday()).toMatchObject({ start: "09:00", end: "17:00" });
  expect(screen.getByText("Already checked out today")).toBeInTheDocument();
});

test("the action is stripped from the URL so a refresh cannot stamp twice", () => {
  seedForCheckIn();
  visitWith("/?action=checkin&lang=en");
  render(<App />);

  expect(window.location.search).toBe("?lang=en");
  expect(window.location.search).not.toContain("action");
});

test("an unrecognised action is ignored and left in the URL alone", () => {
  seedForCheckIn();
  visitWith("/?action=explode");
  render(<App />);

  expect(storedToday()).toBeUndefined();
  expect(checkStatus()).toBe("Not started");
  expect(window.location.search).toBe("?action=explode");
});

/* ---------------- legal pages and the privacy claims ---------------- */

test("the footer links to the privacy and terms pages", () => {
  seedSingleJob();
  render(<App />);

  const privacy = screen.getByText("Privacy & Storage") as HTMLAnchorElement;
  const terms = screen.getByText("Terms & Disclaimer") as HTMLAnchorElement;
  expect(privacy.getAttribute("href")).toMatch(/\/privacy\.html$/);
  expect(terms.getAttribute("href")).toMatch(/\/terms\.html$/);
});

test("using the app sets no cookies, which is what the privacy page claims", () => {
  seedForCheckIn();
  render(<App />);
  fireEvent.click(checkButton()!);

  expect(document.cookie).toBe("");
});
