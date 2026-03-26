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

// Sample events — replace with your data source
// const SAMPLE_EVENTS: CalendarEvent[] = [
//   {
//     id: 'uid',
//     created_at: Date,
//     author_id: 'user1',
//     _: JSONB({
//       name: "CrankDat",
//     timezone: 'America/Denver',
//     datetime: Date,
//     location: "Red Rocks",
//     })
//     name: "CrankDat",
//     time: "6PM",
//     datetime: `${dayjs("2026-03-28").format("YYYY-MM-DD")}T18:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 2,
//     name: "MindChatter",
//     time: "8PM",
//     datetime: `${dayjs("2026-04-04").format("YYYY-MM-DD")}T14:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 3,
//     name: "Liquid Stranger",
//     time: "7pm",
//     datetime: `${dayjs("2026-04-11").format("YYYY-MM-DD")}T09:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 4,
//     name: "Alesso",
//     time: "7pm",
//     datetime: `${dayjs("2026-04-25").format("YYYY-MM-DD")}T15:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 5,
//     name: "David Guetta",
//     time: "7pm",
//     datetime: `${dayjs("2026-05-05").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 6,
//     name: "Disclosure",
//     time: "8pm",
//     datetime: `${dayjs("2026-04-23").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 7,
//     name: "Chet Faker",
//     time: "7pm",
//     datetime: `${dayjs("2026-05-13").format("YYYY-MM-DD")}T11:00`,
//     location: "Summit Music Hall",
//   },
//   {
//     id: 8,
//     name: "Seven Lions",
//     time: "6pm",
//     datetime: `${dayjs("2026-05-22").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 9,
//     name: "Alan Walker",
//     time: "7pm",
//     datetime: `${dayjs("2026-05-30").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 10,
//     name: "Lane 8",
//     time: "4pm",
//     datetime: `${dayjs("2026-06-06").format("YYYY-MM-DD")}T11:00`,
//     location: "Dillon Amphitheater",
//   },
//   {
//     id: 11,
//     name: "Lane 8",
//     time: "7pm",
//     datetime: `${dayjs("2026-06-13").format("YYYY-MM-DD")}T11:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 12,
//     name: "Elderbrook",
//     time: "7pm",
//     datetime: `${dayjs("2026-06-27").format("YYYY-MM-DD")}T11:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 12,
//     name: "Zeds Dead",
//     time: "5pm",
//     datetime: `${dayjs("2026-07-03").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 13,
//     name: "Sammy Virji",
//     time: "6pm",
//     datetime: `${dayjs("2026-10-16").format("YYYY-MM-DD")}T11:00`,
//     location: "Red Rocks",
//   },
//   {
//     id: 14,
//     name: "Adventure Club",
//     time: "8pm",
//     datetime: `${dayjs("2026-02-06").format("YYYY-MM-DD")}T11:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 15,
//     name: "Sidepiece",
//     time: "8pm",
//     datetime: `${dayjs("2026-02-21").format("YYYY-MM-DD")}T11:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 16,
//     name: "DRAMA",
//     time: "8pm",
//     datetime: `${dayjs("2026-02-27").format("YYYY-MM-DD")}T11:00`,
//     location: "Mission Ballroom",
//   },
//   {
//     id: 17,
//     name: "Christian Loffler",
//     time: "8pm",
//     datetime: `${dayjs("2026-03-08").format("YYYY-MM-DD")}T11:00`,
//     location: "Bluebird Theater",
//   },
//   {
//     id: 18,
//     name: "Worakls",
//     time: "8pm",
//     datetime: `${dayjs("2026-01-02").format("YYYY-MM-DD")}T11:00`,
//     location: "Bluebird Theater",
//   },
//   {
//     id: 19,
//     name: "Decadence",
//     time: "6pm",
//     datetime: `${dayjs("2025-12-30").format("YYYY-MM-DD")}T11:00`,
//     location: "Colorado Convention Center",
//   },
// ];

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
    SAMPLE_EVENTS: [],
  };
}
