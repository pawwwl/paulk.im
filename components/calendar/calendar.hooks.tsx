import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isToday from "dayjs/plugin/isToday";
import weekday from "dayjs/plugin/weekday";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useSWR from "swr";

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(isToday);
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Denver";

export type CalendarView = "month" | "week" | "day" | "year";

export type CalendarEvent = {
  id: number;
  author_id: string;
  created_at: string;
  _: {
    name: string;
    start_time: string;
    end_time: string;
    location?: string;
    genre?: string;
    style?: string;
    highlights?: string;
    past_event?: boolean;
    phone_free?: boolean;
    event_series?: string;
    support_acts?: string[];
    social?: {
      instagram?: string;
      spotify?: string;
      twitter?: string;
      website?: string;
      ra?: string;
    };
    venue_details?: {
      capacity: number;
      type: string;
      reputation: string;
    };
    weather?: {
      forecast: string;
    };
    tickets?: {
      status: "available" | "nearly_sold_out" | "sold_out" | "past";
      price_range?: string;
      notes?: string;
    };
    should_go_score?: number | null;
    should_go_notes?: string;
  };
};

export type CalendarDay = {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
};

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const SWR = useSWR("events", async (key) => {
    const { data, error } = await supabase.from(key).select("*");
    if (error) {
      console.error("Error fetching events:", error);
      return [];
    }
    return data as CalendarEvent[];
  });

  const goToPrev = () => {
    if (view === "week") setCurrentDate((d) => d.subtract(1, "week"));
    else {
      setCurrentDate((d) => d.subtract(1, "month"));
      setSelectedDate(null);
    }
  };

  const goToNext = () => {
    if (view === "week") setCurrentDate((d) => d.add(1, "week"));
    else {
      setCurrentDate((d) => d.add(1, "month"));
      setSelectedDate(null);
    }
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs());
  };

  const getEventsForDate = (dateStr: string): CalendarEvent[] => {
    return (SWR.data || [])?.filter(
      (E) => dayjs(E._.start_time).tz(TZ).format("YYYY-MM-DD") === dateStr,
    );
  };

  // Generate month grid (only weeks with at least one current-month day, Sun-start)
  const getMonthDays = (overrideDate?: Dayjs): CalendarDay[] => {
    const date = overrideDate ?? currentDate;
    const startOfMonth = date.startOf("month");
    // day(): 0=Sun, 6=Sat
    const startDay = startOfMonth.day();
    const gridStart = startOfMonth.subtract(startDay, "day");

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const day = gridStart.add(i, "day");
      const dateStr = day.format("YYYY-MM-DD");
      // Stop once we've passed the month and completed the current week
      if (i >= 7 && i % 7 === 0 && day.month() !== date.month()) break;
      days.push({
        date: dateStr,
        isCurrentMonth: day.month() === date.month(),
        isToday: day.isToday(),
        isSelected:
          selectedDate !== null &&
          day.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD"),
        events: getEventsForDate(dateStr),
      });
    }
    return days;
  };

  // Generate week days (Sun–Sat of current week)
  const getWeekDays = (overrideDate?: Dayjs): Dayjs[] => {
    const startOfWeek = (overrideDate ?? currentDate).startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  };

  const headerLabel =
    view === "week"
      ? `${currentDate.startOf("week").format("MMM D")} – ${currentDate.endOf("week").format("MMM D, YYYY")}`
      : currentDate.format("MMMM YYYY");

  const goToDate = (date: Dayjs) => {
    setCurrentDate(date);
    setSelectedDate(null);
  };

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    goToPrev,
    goToNext,
    goToToday,
    goToDate,
    getMonthDays,
    getWeekDays,
    getEventsForDate,
    headerLabel,
    SAMPLE_EVENTS: [],
  };
}
