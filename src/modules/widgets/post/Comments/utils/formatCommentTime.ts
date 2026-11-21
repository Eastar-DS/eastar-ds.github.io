// 글 날짜(shared/utils/formatDate)처럼 한국 시간으로 보입니다
const TIME_ZONE = "Asia/Seoul";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 댓글을 쓴 시각을 「2026.11.20 18:12」 꼴(한국 시간)로 바꿉니다. 읽을 수 없는 값이면 빈 글입니다 */
const formatCommentTime = (isoTime: string) => {
  const date = new Date(isoTime);

  if (Number.isNaN(date.getTime())) return "";

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return `${pick("year")}.${pick("month")}.${pick("day")} ${pick("hour")}:${pick("minute")}`;
};

export default formatCommentTime;
