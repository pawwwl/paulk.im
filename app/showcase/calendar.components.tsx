"use client";

import {
  Icon_Calendar,
  Icon_ChevronDown,
  Icon_ChevronLeft,
  Icon_ChevronRight,
  Icon_Location,
} from "@/components/icons";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
      : score >= 7
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400"
        : "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${color}`}
    >
      ★ {score}/10
    </span>
  );
}

function TicketBadge({
  status,
  price_range,
}: {
  status: string;
  price_range?: string;
}) {
  if (status === "past") return null;
  const styles: Record<string, string> = {
    sold_out: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    nearly_sold_out:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    available:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  };
  const labels: Record<string, string> = {
    sold_out: "Sold Out",
    nearly_sold_out: "Almost Gone",
    available: "Available",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.available}`}
    >
      🎟 {labels[status] ?? status}
      {price_range ? ` · ${price_range}` : ""}
    </span>
  );
}
import {
  useCalendar,
  CalendarView,
  CalendarDay,
  CalendarEvent,
} from "./calendar.hooks";
import { Fragment, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import dayjs, { Dayjs } from "dayjs";

export const Calendar = () => {
  const {
    currentDate,
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

  const SLIDES = [-2, -1, 0, 1, 2] as const;
  const CENTER = 2;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    startIndex: CENTER,
  });

  // Use refs so the settle handler never goes stale
  const goToPrevRef = useRef(goToPrev);
  const goToNextRef = useRef(goToNext);
  useEffect(() => {
    goToPrevRef.current = goToPrev;
  });
  useEffect(() => {
    goToNextRef.current = goToNext;
  });

  // On settle: step the month by the diff from center, then snap back
  useEffect(() => {
    if (!emblaApi) return;
    const onSettle = () => {
      const diff = emblaApi.selectedScrollSnap() - CENTER;
      if (diff !== 0) {
        const scrollY = window.scrollY;
        flushSync(() => {
          if (diff < 0) for (let i = 0; i < -diff; i++) goToPrevRef.current();
          else for (let i = 0; i < diff; i++) goToNextRef.current();
        });
        window.scrollTo(0, scrollY);
        emblaApi.scrollTo(CENTER, true);
      }
    };
    emblaApi.on("settle", onSettle);
    return () => {
      emblaApi.off("settle", onSettle);
    };
  }, [emblaApi]);

  // Return to center when date or view changes (Today button, view switch)
  useEffect(() => {
    if (!emblaApi) return;
    const scrollY = window.scrollY;
    emblaApi.reInit();
    emblaApi.scrollTo(CENTER, true);
    window.scrollTo(0, scrollY);
  }, [emblaApi, currentDate, view]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate((prev) =>
      prev?.format("YYYY-MM-DD") === dateStr ? null : dayjs(dateStr),
    );
  };

  const usesCarousel = view === "month" || view === "week";

  return (
    <div className="flex h-full flex-col dark:bg-background">
      <div className="flex mb-2">
        <button
          onClick={() => setView("month")}
          className={`px-3.5 py-2 text-sm font-semibold rounded-l-md transition-colors ${
            view === "month"
              ? "bg-primary text-black"
              : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-on-surface dark:hover:bg-white/20"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setView("week")}
          className={`px-3.5 py-2 text-sm font-semibold rounded-r-md border-l border-gray-300 transition-colors dark:border-white/5 ${
            view === "week"
              ? "bg-primary text-black"
              : "bg-white text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-on-surface dark:hover:bg-white/20"
          }`}
        >
          Weekly
        </button>
      </div>
      <CalendarHeader
        label={headerLabel}
        view={view}
        onPrev={usesCarousel ? () => emblaApi?.scrollPrev() : goToPrev}
        onNext={usesCarousel ? () => emblaApi?.scrollNext() : goToNext}
        onToday={goToToday}
        onViewChange={setView}
      />
      {usesCarousel && (
        <div ref={emblaRef} className="overflow-hidden flex-1">
          <div className="flex h-full">
            {SLIDES.map((offset) => (
              <div key={offset} style={{ flex: "0 0 100%", minWidth: 0 }}>
                {view === "month" && (
                  <CalendarMonth
                    days={getMonthDays(currentDate.add(offset, "month"))}
                    onSelectDate={handleSelectDate}
                    selectedDate={selectedDate}
                  />
                )}
                {view === "week" && (
                  <CalendarWeek
                    weekDays={getWeekDays(currentDate.add(offset, "week"))}
                    getEventsForDate={getEventsForDate}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
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
  <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none dark:border-white/10 dark:bg-surface-container/80">
    <h1 className="text-base font-semibold text-gray-900 dark:text-primary">
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
          className="hidden px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:text-on-surface dark:hover:bg-white/10"
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
    </div>
  </header>
);

type Props = {
  days: CalendarDay[];
  onSelectDate: (date: string) => void;
  selectedDate: Dayjs | null;
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function EventListItem({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore =
    (event._.support_acts && event._.support_acts.length > 0) ||
    !!event._.weather ||
    !!event._.should_go_notes ||
    !!(event._.social && Object.values(event._.social).some(Boolean));

  return (
    <li
      className="flex flex-col p-4 gap-2 hover:bg-gray-50 dark:hover:bg-white/5"
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Date/time */}
      <div className="flex items-center gap-2">
        <Icon_Calendar className="size-4 text-gray-400" />
        <time
          dateTime={event._.start_time}
          className="text-sm text-gray-400 font-bold"
        >
          {dayjs(event._.start_time).tz("America/Denver").format("MMM D")}
          {" · "}
          {dayjs(event._.start_time).tz("America/Denver").format("h:mm A")}
          {" – "}
          {dayjs(event._.end_time).tz("America/Denver").format("h:mm A")}
        </time>
      </div>

      {/* Name + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-semibold text-gray-900 dark:text-on-surface">
          {event._.name}
        </p>
        {event._.should_go_score != null && (
          <ScoreBadge score={event._.should_go_score} />
        )}
        {event._.tickets && (
          <TicketBadge
            status={event._.tickets.status}
            price_range={event._.tickets.price_range}
          />
        )}
        {event._.phone_free && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
            📵 Phone-Free
          </span>
        )}
        {event._.past_event && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
            Past
          </span>
        )}
      </div>

      {/* Genre */}
      {event._.genre && (
        <p className="text-xs text-gray-500 dark:text-on-surface-variant">
          {event._.genre}
        </p>
      )}

      {/* Location */}
      {event._.location && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event._.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400 w-fit"
        >
          <Icon_Location className="size-4" />
          {event._.location}
          {event._.venue_details && (
            <span className="text-gray-400 dark:text-on-surface-variant">
              · {event._.venue_details.type} ·{" "}
              {event._.venue_details.capacity.toLocaleString()} cap
            </span>
          )}
        </a>
      )}

      {/* Accordion — grid-rows trick animates height without JS measurement */}
      {hasMore && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2 pt-1">
              {event._.support_acts && event._.support_acts.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-on-surface-variant">
                  <span className="font-medium">Support:</span>{" "}
                  {event._.support_acts.join(", ")}
                </p>
              )}
              {event._.weather && (
                <p className="text-xs text-gray-500 dark:text-on-surface-variant">
                  🌤 {event._.weather.forecast}
                </p>
              )}
              {event._.should_go_notes && (
                <p className="text-xs text-gray-600 dark:text-on-surface-variant italic">
                  {event._.should_go_notes}
                </p>
              )}
              {event._.social && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {event._.social.instagram && (
                    <a href={event._.social.instagram} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400">Instagram</a>
                  )}
                  {event._.social.spotify && (
                    <a href={event._.social.spotify} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400">Spotify</a>
                  )}
                  {event._.social.twitter && (
                    <a href={event._.social.twitter} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400">X / Twitter</a>
                  )}
                  {event._.social.website && (
                    <a href={event._.social.website} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400">Website</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle chevron */}
      {hasMore && (
        <Icon_ChevronDown
          className={`size-4 self-center text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      )}
    </li>
  );
}

export const CalendarMonth = ({ days, onSelectDate, selectedDate }: Props) => (
  <div className="shadow-sm ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col dark:ring-white/5">
    {/* Day of week headers */}
    <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none dark:border-white/5 dark:bg-white/15 dark:text-primary">
      {DOW.map((d) => (
        <div
          key={d}
          className="flex justify-center bg-white py-2 dark:bg-surface"
        >
          <span className="sr-only sm:not-sr-only">{d}</span>
          <span className="sm:hidden">{d[0]}</span>
        </div>
      ))}
    </div>

    {/* Month grid */}
    <div className="bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto dark:bg-white/10 dark:text-on-surface-variant">
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={`group relative flex flex-col px-3 py-2 focus:z-10 min-h-14 lg:min-h-28 hover:bg-gray-50 dark:hover:bg-white/5 ${
              day.isCurrentMonth
                ? "bg-white dark:bg-surface"
                : "bg-gray-50 text-gray-500 dark:bg-surface/50 dark:text-on-surface-variant"
            } ${day.isSelected ? "font-semibold" : ""}`}
          >
            <time
              dateTime={day.date}
              className={`ml-auto flex size-6 items-center justify-center rounded-full text-sm ${(() => {
                if (day.isToday && day.isSelected)
                  return "bg-indigo-600 font-semibold text-white dark:bg-indigo-500";
                if (day.isToday)
                  return "font-semibold text-indigo-600 dark:text-indigo-400";
                if (day.isSelected)
                  return "bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-900";
                if (day.isCurrentMonth)
                  return "text-gray-900 dark:text-primary";
                return "text-gray-400 dark:text-primary/40";
              })()}`}
            >
              {day.date.split("-").pop()?.replace(/^0/, "")}
            </time>
            <span className="sr-only">{day.events.length} events</span>
            {/* Desktop: inline event names */}
            {day.events.length > 0 && (
              <ol className="mt-2 hidden lg:block w-full text-left">
                {day.events.slice(0, 2).map((event) => (
                  <li key={event.id}>
                    <a href={"#"} className="group flex items-center gap-1">
                      <p className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600 dark:text-on-surface dark:group-hover:text-indigo-400">
                        {event._.name}
                      </p>
                      {event._.should_go_score != null && (
                        <span
                          className={`flex-none text-[10px] font-bold ${
                            event._.should_go_score >= 9
                              ? "text-green-600 dark:text-green-400"
                              : event._.should_go_score >= 7
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-orange-600 dark:text-orange-400"
                          }`}
                        >
                          ★{event._.should_go_score}
                        </span>
                      )}
                      <time
                        dateTime={event._.start_time}
                        className="ml-1 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block dark:text-on-surface-variant"
                      >
                        {dayjs(event._.start_time)
                          .tz("America/Denver")
                          .format("h:mm")}
                      </time>
                    </a>
                  </li>
                ))}
                {day.events.length > 2 && (
                  <li className="text-gray-500 dark:text-on-surface-variant">
                    + {day.events.length - 2} more
                  </li>
                )}
              </ol>
            )}
            {/* Mobile: event dot indicators */}
            {day.events.length > 0 && (
              <span className="-mx-0.5 mt-auto flex flex-wrap-reverse lg:hidden">
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

    {/* Mobile: selected day events list */}
    <div className="lg:hidden">
      <ol className="divide-y divide-gray-100 text-sm dark:divide-white/10">
        {(() => {
          const events =
            selectedDate === null
              ? days.filter((d) => d.isCurrentMonth).flatMap((d) => d.events)
              : (days.find((d) => d.isSelected)?.events ?? []);
          if (events.length === 0)
            return (
              <li className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-on-surface-variant">
                <p className="font-medium">No events</p>
              </li>
            );
          return events.map((event) => (
            <EventListItem key={event.id} event={event} />
          ));
        })()}
      </ol>
    </div>
  </div>
);

import isToday from "dayjs/plugin/isToday";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(isToday);
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Denver";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12AM";
  if (i < 12) return `${i}AM`;
  if (i === 12) return "12PM";
  return `${i - 12}PM`;
});

// Convert datetime to grid row in MST (each hour = 12 rows, starting at row 2)
function timeToGridRow(datetime: string): number {
  const local = dayjs(datetime).tz(TZ);
  return 2 + local.hour() * 12 + Math.floor((local.minute() / 60) * 12);
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
  selectedDate: Dayjs | null;
  onSelectDate: (date: string) => void;
}) => (
  <div className="flex h-full flex-col">
    <div className="isolate flex flex-auto flex-col overflow-auto bg-white dark:bg-surface">
      <div
        style={{ width: "165%" }}
        className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full"
      >
        {/* Week day headers */}
        <div className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5 sm:pr-8 dark:bg-surface dark:ring-white/20">
          {/* Mobile headers */}
          <div className="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden dark:text-on-surface-variant">
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
                          selectedDate?.format("YYYY-MM-DD")
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-900 dark:text-on-surface"
                  }`}
                >
                  {day.date()}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop headers */}
          <div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 sm:grid dark:divide-white/10 dark:border-white/10 dark:text-on-surface-variant">
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
                            selectedDate?.format("YYYY-MM-DD")
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-900 dark:text-on-surface"
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
          <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100 dark:bg-surface dark:ring-white/5" />
          <div className="grid flex-auto grid-cols-1 grid-rows-1">
            {/* Horizontal lines */}
            <div
              style={{ gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))" }}
              className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100 dark:divide-white/5"
            >
              <div className="row-end-1 h-7" />
              {HOURS.map((hour, i) => (
                <Fragment key={`hour-${hour}-${i}-full`}>
                  <div>
                    <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400 dark:text-on-surface-variant">
                      {hour}
                    </div>
                  </div>
                  <div key={`${hour}-half`} />
                </Fragment>
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
                  const row = timeToGridRow(event._.start_time);
                  const endRow = timeToGridRow(event._.end_time);
                  const span = Math.max(endRow - row, 6);
                  const color = EVENT_COLORS[eventIndex % EVENT_COLORS.length];
                  return (
                    <li
                      key={event.id}
                      style={{ gridRow: `${row} / span ${span}` }}
                      className={`relative mt-px flex sm:col-start-${colIndex + 1}`}
                    >
                      <a
                        href={""}
                        className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${color}`}
                      >
                        <p className="order-1 font-semibold leading-tight">
                          {event._.name}
                        </p>
                        <time dateTime={event._.start_time}>
                          {dayjs(event._.start_time).tz(TZ).format("h:mm A")}
                        </time>
                        {event._.location && (
                          <p className="truncate opacity-75">
                            {event._.location}
                          </p>
                        )}
                        {event._.should_go_score != null && (
                          <p className="font-bold">
                            ★ {event._.should_go_score}/10
                          </p>
                        )}
                        {event._.tickets?.status === "sold_out" && (
                          <p className="font-semibold opacity-90">Sold Out</p>
                        )}
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
