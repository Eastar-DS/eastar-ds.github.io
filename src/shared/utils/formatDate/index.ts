type DateFormat =
  | "long"
  | "dot"
  | "monthDay"
  | "monthDayLong"
  | "year"
  | "iso";

interface FormatDateParams {
  date: Date;
  /**
   * - `long`: 2026년 11월 18일
   * - `dot`: 2026.11.18
   * - `monthDay`: 11.18
   * - `monthDayLong`: 11월 18일
   * - `year`: 2026
   * - `iso`: 2026-11-18 (`<time datetime>`용)
   */
  format: DateFormat;
}

// 빌드하는 곳(내 컴퓨터, GitHub Actions의 UTC)에 따라 날짜가 하루 밀리지 않게 한국 시간으로 고정합니다
const TIME_ZONE = "Asia/Seoul";

/** 날짜를 화면에 보일 문자열로 바꿉니다. 시간대는 늘 한국 시간입니다 */
const formatDate = ({ date, format }: FormatDateParams) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");

  switch (format) {
    case "long":
      return `${year}년 ${Number(month)}월 ${Number(day)}일`;
    case "dot":
      return `${year}.${month}.${day}`;
    case "monthDay":
      return `${month}.${day}`;
    case "monthDayLong":
      return `${Number(month)}월 ${Number(day)}일`;
    case "year":
      return year;
    case "iso":
      return `${year}-${month}-${day}`;
  }
};

export default formatDate;
