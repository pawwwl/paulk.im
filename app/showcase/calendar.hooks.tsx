import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(isToday);

export type CalendarView = "month" | "week" | "day" | "year";

export type CalendarEvent = {
  id: number;
  name: string;
  time: string;
  datetime: string;
  location?: string;
};

export type CalendarDay = {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
};

// Sample events — replace with your data source
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    name: "CrankDat",
    time: "6PM",
    datetime: `${dayjs("2026-03-28").format("YYYY-MM-DD")}T18:00`,
    location: "Red Rocks",
  },
  {
    id: 2,
    name: "MindChatter",
    time: "8PM",
    datetime: `${dayjs("2026-04-04").format("YYYY-MM-DD")}T14:00`,
    location: "Mission Ballroom",
  },
  {
    id: 3,
    name: "Liquid Stranger",
    time: "7pm",
    datetime: `${dayjs("2026-04-11").add(1, "day").format("YYYY-MM-DD")}T09:00`,
    location: "Red Rocks",
  },
  {
    id: 4,
    name: "Alesso",
    time: "7pm",
    datetime: `${dayjs("2026-04-25").format("YYYY-MM-DD")}T15:00`,
    location: "Red Rocks",
  },
  {
    id: 5,
    name: "David Guetta",
    time: "7pm",
    datetime: `${dayjs("2026-05-05").add(5, "day").format("YYYY-MM-DD")}T11:00`,
    location: "Red Rocks",
  },
  {
    id: 6,
    name: "David Guetta",
    time: "7pm",
    datetime: `${dayjs("2026-05-05").add(5, "day").format("YYYY-MM-DD")}T11:00`,
    location: "Red Rocks",
  },
];

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [view, setView] = useState<CalendarView>("month");

  const goToPrev = () => {
    if (view === "week") setCurrentDate((d) => d.subtract(1, "week"));
    else setCurrentDate((d) => d.subtract(1, "month"));
  };

  const goToNext = () => {
    if (view === "week") setCurrentDate((d) => d.add(1, "week"));
    else setCurrentDate((d) => d.add(1, "month"));
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs());
  };

  const getEventsForDate = (dateStr: string): CalendarEvent[] =>
    SAMPLE_EVENTS.filter((e) => e.datetime.startsWith(dateStr));

  // Generate month grid (always 6 weeks, Mon-start)
  const getMonthDays = (): CalendarDay[] => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    // isoWeekday: 1=Mon, 7=Sun
    const startDay = startOfMonth.isoWeekday(); // 1–7
    const gridStart = startOfMonth.subtract(startDay - 1, "day");

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const day = gridStart.add(i, "day");
      const dateStr = day.format("YYYY-MM-DD");
      days.push({
        date: dateStr,
        isCurrentMonth: day.month() === currentDate.month(),
        isToday: day.isToday(),
        isSelected:
          day.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD"),
        events: getEventsForDate(dateStr),
      });
    }
    return days;
  };

  // Generate week days (Mon–Sun of current week)
  const getWeekDays = (): Dayjs[] => {
    const startOfWeek = currentDate.startOf("isoWeek");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  };

  const headerLabel =
    view === "week"
      ? `${currentDate.startOf("isoWeek").format("MMM D")} – ${currentDate.endOf("isoWeek").format("MMM D, YYYY")}`
      : currentDate.format("MMMM YYYY");

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    goToPrev,
    goToNext,
    goToToday,
    getMonthDays,
    getWeekDays,
    getEventsForDate,
    headerLabel,
    SAMPLE_EVENTS,
  };
}
