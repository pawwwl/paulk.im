"use client";

import {
  Icon_ChevronDown,
  Icon_ChevronLeft,
  Icon_ChevronRight,
  Icon_Ellipsis,
} from "@/components/icons";
import {
  useCalendar,
  CalendarView,
  CalendarDay,
  CalendarEvent,
} from "./calendar.hooks";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import dayjs, { Dayjs } from "dayjs";

const VIEWS: CalendarView[] = ["day", "week", "month", "year"];

export const Calendar = () => {
  const {
    view,
    setView,
    headerLabel,
    goToPrev,
    goToNext,
    goToToday,
    getMonthDays,
    getWeekDays,
    getEventsForDate,
    selectedDate,
    setSelectedDate,
  } = useCalendar();

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dayjs(dateStr));
  };

  return (
    <div className="flex h-full flex-col dark:bg-gray-900">
      <CalendarHeader
        label={headerLabel}
        view={view}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onViewChange={setView}
      />
      {view === "month" && (
        <CalendarMonth days={getMonthDays()} onSelectDate={handleSelectDate} />
      )}
      {view === "week" && (
        <CalendarWeek
          weekDays={getWeekDays()}
          getEventsForDate={getEventsForDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      )}
      {(view === "day" || view === "year") && (
        <div className="flex flex-1 items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-mono">
          {view} view — coming soon
        </div>
      )}
    </div>
  );
};

export const CalendarHeader = ({
  label,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: {
  label: string;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
}) => (
  <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none dark:border-white/10 dark:bg-gray-800/50">
    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
      <time>{label}</time>
    </h1>
    <div className="flex items-center">
      <div className="relative flex items-center rounded-md bg-white shadow-xs outline -outline-offset-1 outline-gray-300 md:items-stretch dark:bg-white/10 dark:shadow-none dark:outline-white/5">
        <button
          onClick={onPrev}
          className="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10"
        >
          <span className="sr-only">Previous</span>
          <Icon_ChevronLeft />
        </button>
        <button
          onClick={onToday}
          className="hidden px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:text-white dark:hover:bg-white/10"
        >
          Today
        </button>
        <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-white/10" />
        <button
          onClick={onNext}
          className="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10"
        >
          <span className="sr-only">Next</span>
          <Icon_ChevronRight />
        </button>
      </div>

      {/* Desktop view switcher */}
      <div className="hidden md:ml-4 md:flex md:items-center">
        <div className="hidden md:ml-4 md:flex md:items-center">
          <div className="flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/5">
            <button
              onClick={() => onViewChange("month")}
              className={`px-3.5 py-2 text-sm font-semibold rounded-l-md transition-colors ${
                view === "month"
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewChange("week")}
              className={`px-3.5 py-2 text-sm font-semibold rounded-r-md border-l border-gray-300 transition-colors dark:border-white/5 ${
                view === "week"
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              }`}
            >
              Week
            </button>
          </div>
          <div className="ml-6 h-6 w-px bg-gray-300 dark:bg-white/10" />
          <button className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Add event
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <Menu as="div" className="relative ml-6 md:hidden">
        <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500 dark:hover:text-white">
          <span className="sr-only">Open menu</span>
          <Icon_Ellipsis />
        </MenuButton>
        <MenuItems className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:divide-white/10 dark:bg-gray-800 dark:ring-white/10">
          <div className="py-1">
            <MenuItem>
              <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
                Create event
              </button>
            </MenuItem>
          </div>
          <div className="py-1">
            <MenuItem>
              <button
                onClick={onToday}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Go to today
              </button>
            </MenuItem>
          </div>
          <div className="py-1">
            {VIEWS.map((v) => (
              <MenuItem key={v}>
                <button
                  onClick={() => onViewChange(v)}
                  className="block w-full px-4 py-2 text-left text-sm capitalize text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {v} view
                </button>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Menu>
    </div>
  </header>
);

type Props = {
  days: CalendarDay[];
  onSelectDate: (date: string) => void;
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CalendarMonth = ({ days, onSelectDate }: Props) => (
  <div className="shadow-sm ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col dark:ring-white/5">
    {/* Day of week headers */}
    <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none dark:border-white/5 dark:bg-white/15 dark:text-gray-300">
      {DOW.map((d) => (
        <div
          key={d}
          className="flex justify-center bg-white py-2 dark:bg-gray-900"
        >
          <span className="sr-only sm:not-sr-only">{d}</span>
          <span className="sm:hidden">{d[0]}</span>
        </div>
      ))}
    </div>

    <div className="flex bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto dark:bg-white/10 dark:text-gray-300">
      {/* Desktop grid */}
      <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
        {days.map((day) => (
          <div
            key={day.date}
            onClick={() => onSelectDate(day.date)}
            className={`group relative cursor-pointer px-3 py-2 ${
              day.isCurrentMonth
                ? "bg-white dark:bg-gray-900"
                : "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400"
            }`}
          >
            <time
              dateTime={day.date}
              className={`relative flex size-6 items-center justify-center rounded-full text-sm font-medium ${
                day.isToday
                  ? "bg-indigo-600 font-semibold text-white dark:bg-indigo-500"
                  : day.isSelected
                    ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-900 dark:text-white"
              } ${!day.isCurrentMonth ? "opacity-50" : ""}`}
            >
              {day.date.split("-").pop()?.replace(/^0/, "")}
            </time>
            {day.events.length > 0 && (
              <ol className="mt-2">
                {day.events.slice(0, 2).map((event) => (
                  <li key={event.id}>
                    <a href={"#"} className="group flex">
                      <p className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        {event.name}
                      </p>
                      <time
                        dateTime={event.datetime}
                        className="ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block dark:text-gray-400"
                      >
                        {event.time}
                      </time>
                    </a>
                  </li>
                ))}
                {day.events.length > 2 && (
                  <li className="text-gray-500 dark:text-gray-400">
                    + {day.events.length - 2} more
                  </li>
                )}
              </ol>
            )}
          </div>
        ))}
      </div>

      {/* Mobile grid */}
      <div className="isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={`group relative flex h-14 flex-col px-3 py-2 focus:z-10 ${
              day.isCurrentMonth
                ? "bg-white dark:bg-gray-900"
                : "bg-gray-50 dark:bg-gray-900/50"
            } ${day.isSelected ? "font-semibold" : ""}`}
          >
            <time
              dateTime={day.date}
              className={`ml-auto flex size-6 items-center justify-center rounded-full text-sm ${
                day.isToday && day.isSelected
                  ? "bg-indigo-600 font-semibold text-white dark:bg-indigo-500"
                  : day.isToday
                    ? "font-semibold text-indigo-600 dark:text-indigo-400"
                    : day.isSelected
                      ? "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900"
                      : day.isCurrentMonth
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400"
              }`}
            >
              {day.date.split("-").pop()?.replace(/^0/, "")}
            </time>
            <span className="sr-only">{day.events.length} events</span>
            {day.events.length > 0 && (
              <span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                {day.events.map((e) => (
                  <span
                    key={e.id}
                    className="mx-0.5 mb-1 size-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
                  />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Mobile selected day events */}
    <div className="px-4 py-6 lg:hidden">
      <ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow-sm ring-1 ring-black/5 dark:divide-white/10 dark:bg-gray-800/50 dark:ring-white/10">
        {days
          .find((d) => d.isSelected)
          ?.events.map((event) => (
            <li
              key={event.id}
              className="group flex p-4 pr-6 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <div className="flex-auto">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {event.name}
                </p>
                <time
                  dateTime={event.datetime}
                  className="mt-2 flex items-center text-gray-700 dark:text-gray-300"
                >
                  {event.time}
                </time>
              </div>
              <a
                href={""}
                className="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-xs ring-1 ring-inset ring-gray-300 group-hover:opacity-100 dark:bg-white/10 dark:text-white dark:ring-white/5"
              >
                Edit
              </a>
            </li>
          ))}
      </ol>
    </div>
  </div>
);

import isToday from "dayjs/plugin/isToday";

dayjs.extend(isToday);

const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12AM";
  if (i < 12) return `${i}AM`;
  if (i === 12) return "12PM";
  return `${i - 12}PM`;
});

// Convert "HH:MM" time to grid row (each hour = 12 rows, starting at row 2)
function timeToGridRow(datetime: string): number {
  const time = datetime.split("T")[1];
  if (!time) return 2;
  const [h, m] = time.split(":").map(Number);
  return 2 + h * 12 + Math.floor((m / 60) * 12);
}

const EVENT_COLORS = [
  "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-600/15 dark:text-blue-300",
  "bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-600/15 dark:text-pink-300",
  "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-600/15 dark:text-green-300",
  "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-600/15 dark:text-yellow-300",
  "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-600/15 dark:text-purple-300",
];

export const CalendarWeek = ({
  weekDays,
  getEventsForDate,
  selectedDate,
  onSelectDate,
}: {
  weekDays: Dayjs[];
  getEventsForDate: (date: string) => CalendarEvent[];
  selectedDate: Dayjs;
  onSelectDate: (date: string) => void;
}) => (
  <div className="flex h-full flex-col">
    <div className="isolate flex flex-auto flex-col overflow-auto bg-white dark:bg-gray-900">
      <div
        style={{ width: "165%" }}
        className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full"
      >
        {/* Week day headers */}
        <div className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5 sm:pr-8 dark:bg-gray-900 dark:ring-white/20">
          {/* Mobile headers */}
          <div className="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden dark:text-gray-400">
            {weekDays.map((day) => (
              <button
                key={day.format("YYYY-MM-DD")}
                onClick={() => onSelectDate(day.format("YYYY-MM-DD"))}
                className="flex flex-col items-center pt-2 pb-3"
              >
                {day.format("dd")[0]}
                <span
                  className={`mt-1 flex size-8 items-center justify-center font-semibold rounded-full ${
                    day.isToday()
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : day.format("YYYY-MM-DD") ===
                          selectedDate.format("YYYY-MM-DD")
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-900 dark:text-white"
                  }`}
                >
                  {day.date()}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop headers */}
          <div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 sm:grid dark:divide-white/10 dark:border-white/10 dark:text-gray-400">
            <div className="col-end-1 w-14" />
            {weekDays.map((day) => (
              <button
                key={day.format("YYYY-MM-DD")}
                onClick={() => onSelectDate(day.format("YYYY-MM-DD"))}
                className="flex items-center justify-center py-3 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <span className="flex items-baseline gap-1.5">
                  {day.format("ddd")}
                  <span
                    className={`flex size-8 items-center justify-center rounded-full font-semibold ${
                      day.isToday()
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : day.format("YYYY-MM-DD") ===
                            selectedDate.format("YYYY-MM-DD")
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {day.date()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-auto h-[calc(100vh-600px)] overflow-auto">
          <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-white/5" />
          <div className="grid flex-auto grid-cols-1 grid-rows-1">
            {/* Horizontal lines */}
            <div
              style={{ gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))" }}
              className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100 dark:divide-white/5"
            >
              <div className="row-end-1 h-7" />
              {HOURS.map((hour, i) => (
                <>
                  <div key={`${hour}-full`}>
                    <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400 dark:text-gray-500">
                      {hour}
                    </div>
                  </div>
                  <div key={`${hour}-half`} />
                </>
              ))}
            </div>

            {/* Vertical lines */}
            <div className="col-start-1 col-end-2 row-start-1 hidden grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7 dark:divide-white/5">
              {weekDays.map((_, i) => (
                <div key={i} className={`col-start-${i + 1} row-span-full`} />
              ))}
              <div className="col-start-8 row-span-full w-8" />
            </div>

            {/* Events */}
            <ol
              style={{
                gridTemplateRows: "1.75rem repeat(288, minmax(0, 1fr)) auto",
              }}
              className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
            >
              {weekDays.map((day, colIndex) => {
                const events = getEventsForDate(day.format("YYYY-MM-DD"));
                return events.map((event, eventIndex) => {
                  const row = timeToGridRow(event.datetime);
                  const color = EVENT_COLORS[eventIndex % EVENT_COLORS.length];
                  return (
                    <li
                      key={event.id}
                      style={{ gridRow: `${row} / span 12` }}
                      className={`relative mt-px flex sm:col-start-${colIndex + 1}`}
                    >
                      <a
                        href={""}
                        className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${color}`}
                      >
                        <p className="order-1 font-semibold">{event.name}</p>
                        <time dateTime={event.datetime}>{event.time}</time>
                      </a>
                    </li>
                  );
                });
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
);
