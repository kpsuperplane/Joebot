import * as chrono from "chrono-node";

const parser = chrono.casual.clone();
parser.refiners.push({
  refine: (_, results) => {
    // If there is no AM/PM (meridiem) specified,
    //  let all time between 1:00 - 4:00 be PM (13.00 - 16.00)
    results.forEach((result) => {
      const hour = result.start.get("hour");
      if (!result.start.isCertain("meridiem") && hour != null && hour < 9) {
        result.start.assign("meridiem", 1);
        result.start.assign("hour", hour + 12);
      }
    });
    return results;
  },
});

export function parseDate(dateString: string | null | undefined): Date | null {
  if (typeof dateString === "string") {
    return parser.parseDate(
      dateString,
      { instant: new Date(), timezone: "America/Los_Angeles" },
      { forwardDate: true }
    );
  }
  return null;
}

export function formatDate(date: Date | null): string {
  return (
    date?.toLocaleString("en-us", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric",
      timeZone: "America/Los_Angeles",
    }) ?? ""
  );
}
