"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ── IndexedDB ─────────────────────────────────────────────────────────────────

const CSV_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

const DB_NAME = "form-builder-db";
const DB_VERSION = 2;
const STORE = "templates";
const SUB_STORE = "submissions";

let _db: IDBDatabase | null = null;
let _dbOpening: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  if (_dbOpening) return _dbOpening;
  _dbOpening = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE))
        db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(SUB_STORE)) {
        const ss = db.createObjectStore(SUB_STORE, { keyPath: "id" });
        ss.createIndex("templateId", "templateId", { unique: false });
      }
    };
    req.onsuccess = () => { _db = req.result; _dbOpening = null; resolve(_db); };
    req.onerror  = () => { _dbOpening = null; reject(req.error); };
  });
  return _dbOpening;
}

async function dbGetAll(): Promise<FormTemplate[]> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () =>
      res(
        ((req.result ?? []) as FormTemplate[]).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      );
    req.onerror = () => rej(req.error);
  });
}

async function dbPut(t: FormTemplate): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(t);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ── Submissions DB ────────────────────────────────────────────────────────────

async function dbPutSubmission(s: FormSubmission): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(SUB_STORE, "readwrite");
    tx.objectStore(SUB_STORE).put(s);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbPutManySubmissions(subs: FormSubmission[]): Promise<void> {
  if (subs.length === 0) return;
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(SUB_STORE, "readwrite");
    const store = tx.objectStore(SUB_STORE);
    for (const s of subs) store.put(s);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbGetSubmissions(templateId: string): Promise<FormSubmission[]> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db
      .transaction(SUB_STORE, "readonly")
      .objectStore(SUB_STORE)
      .index("templateId")
      .getAll(templateId);
    req.onsuccess = () =>
      res(
        ((req.result ?? []) as FormSubmission[]).sort(
          (a, b) => b.submittedAt - a.submittedAt,
        ),
      );
    req.onerror = () => rej(req.error);
  });
}

async function dbDeleteSubmission(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(SUB_STORE, "readwrite");
    tx.objectStore(SUB_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType =
  | "text"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "password"
  | "textarea"
  | "select"
  | "radio"
  | "checkboxes"
  | "date"
  | "range"
  | "relation"
  | "heading"
  | "paragraph"
  | "divider";

type FieldWidth = "full" | "half" | "third";

interface SelectOption {
  id: string;
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  width: FieldWidth;
  options: SelectOption[];
  rows: number;
  level: 1 | 2 | 3;
  content: string;
  min: number;
  max: number;
  step: number;
  minLength: number;
  maxLength: number;
  pattern: string;
  relatedTemplateId: string;
  relatedDisplayField: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  fields: FormField[];
}

interface FormSubmission {
  id: string;
  templateId: string;
  submittedAt: number;
  data: Record<string, string | string[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

function makeField(type: FieldType): FormField {
  const isChoice = ["select", "radio", "checkboxes"].includes(type);
  return {
    id: uid(),
    type,
    label:
      type === "heading"
        ? "Section Heading"
        : type === "paragraph"
          ? "Description"
          : type === "divider"
            ? ""
            : `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
    placeholder: "",
    helpText: "",
    required: false,
    width: "full",
    options: isChoice
      ? [
          { id: uid(), label: "Option 1", value: "option_1" },
          { id: uid(), label: "Option 2", value: "option_2" },
          { id: uid(), label: "Option 3", value: "option_3" },
        ]
      : [],
    rows: 4,
    level: 2,
    content:
      type === "heading"
        ? "Section Heading"
        : type === "paragraph"
          ? "Add a description here."
          : "",
    min: 0,
    max: 100,
    step: 1,
    minLength: 0,
    maxLength: 0,
    pattern: "",
    relatedTemplateId: "",
    relatedDisplayField: "",
  };
}

function makeSampleTemplate(): FormTemplate {
  const now = Date.now();
  return {
    id: uid(),
    name: "Contact Form",
    description: "A sample contact form to get you started.",
    createdAt: now,
    updatedAt: now,
    fields: [
      { ...makeField("heading"), content: "Get in touch", label: "Get in touch", level: 1 },
      { ...makeField("text"), label: "Full Name", placeholder: "Jane Doe", required: true, width: "half" },
      { ...makeField("email"), label: "Email", placeholder: "jane@example.com", required: true, width: "half" },
      { ...makeField("tel"), label: "Phone", placeholder: "+1 555 000 0000", width: "half" },
      { ...makeField("select"), label: "Subject", width: "half", options: [
        { id: uid(), label: "General Inquiry", value: "general" },
        { id: uid(), label: "Support", value: "support" },
        { id: uid(), label: "Partnership", value: "partnership" },
      ]},
      { ...makeField("textarea"), label: "Message", placeholder: "Tell me more…", required: true, rows: 5 },
    ],
  };
}

// ── CSV import helpers ────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/);
  const nonEmpty: string[] = [];
  for (const l of lines) if (l.trim() !== "") nonEmpty.push(l);
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let i = 0;
    while (i <= line.length) {
      if (i === line.length) { result.push(""); break; }
      if (line[i] === '"') {
        let val = ""; i++;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else val += line[i++];
        }
        result.push(val);
        if (line[i] === ',') i++;
      } else {
        const start = i;
        while (i < line.length && line[i] !== ',') i++;
        result.push(line.slice(start, i));
        if (i < line.length) i++;
      }
    }
    return result;
  };

  const headers = parseLine(nonEmpty[0]).map((h) => h.trim()).filter(Boolean);
  const rows = nonEmpty.slice(1).map(parseLine);
  return { headers, rows };
}

// Explicit date format patterns — ordered from most to least common in CSVs.
// Each must match the whole value (anchored) to avoid false positives.
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                                                                     // 2024-01-15
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,                                                               // 01/15/2024
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,                                                               // 2024/01/15
  /^\d{1,2}-\d{1,2}-\d{4}$/,                                                                 // 01-15-2024
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}$/i,     // Jan 15, 2024
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}$/i,        // 15 Jan 2024
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,                                                         // ISO 8601 datetime
];

function looksLikeDate(s: string): boolean {
  const t = s.trim();
  return DATE_PATTERNS.some((re) => re.test(t)) && !isNaN(Date.parse(t));
}

function inferFieldType(header: string, samples: string[]): FieldType {
  const h = header.toLowerCase();
  if (/email/.test(h)) return "email";
  if (/phone|tel|mobile/.test(h)) return "tel";
  if (/url|website|link|href/.test(h)) return "url";
  if (/date|birthday|dob\b|born/.test(h)) return "date";
  if (/password|passwd|secret/.test(h)) return "password";
  if (/message|description|notes?|comments?|bio|about|summary|body|details?/.test(h))
    return "textarea";

  const nonEmpty = samples.filter((s) => s.trim() !== "");
  if (nonEmpty.length === 0) return "text";
  if (nonEmpty.some((s) => s.length > 80)) return "textarea";
  if (nonEmpty.every((s) => /^-?\d+(\.\d+)?$/.test(s.trim()))) return "number";
  if (nonEmpty.every((s) => looksLikeDate(s))) return "date";
  if (nonEmpty.every((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) return "email";
  return "text";
}

function csvToTemplate(filename: string, headers: string[], rows: string[][]): FormTemplate {
  const now = Date.now();
  const rawName = filename.replace(/\.csv$/i, "").replace(/[-_]+/g, " ").trim();
  const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "Imported Form";

  const fields: FormField[] = headers.map((header, colIdx) => {
    const samples = rows.map((r) => r[colIdx] ?? "").slice(0, 30);
    const type = inferFieldType(header, samples);
    return { ...makeField(type), label: header, placeholder: "" };
  });

  return { id: uid(), name, description: `Imported from ${filename}`, createdAt: now, updatedAt: now, fields };
}

// ── Field metadata ────────────────────────────────────────────────────────────

const FIELD_META: Record<
  FieldType,
  { label: string; icon: string; category: string; color: string }
> = {
  text:       { label: "Text",       icon: "Aa",  category: "Input",  color: "#4D96D9" },
  email:      { label: "Email",      icon: "@",   category: "Input",  color: "#4D96D9" },
  number:     { label: "Number",     icon: "123", category: "Input",  color: "#4D96D9" },
  tel:        { label: "Phone",      icon: "☎",   category: "Input",  color: "#4D96D9" },
  url:        { label: "URL",        icon: "↗",   category: "Input",  color: "#4D96D9" },
  password:   { label: "Password",   icon: "••",  category: "Input",  color: "#4D96D9" },
  textarea:   { label: "Textarea",   icon: "¶",   category: "Text",   color: "#5AAD6B" },
  select:     { label: "Dropdown",   icon: "▾",   category: "Choice", color: "#F4A020" },
  radio:      { label: "Radio",      icon: "◉",   category: "Choice", color: "#F4A020" },
  checkboxes: { label: "Checkboxes", icon: "☑",   category: "Choice", color: "#F4A020" },
  date:       { label: "Date",       icon: "▦",   category: "Picker",   color: "#E85D7A" },
  range:      { label: "Slider",     icon: "⟺",  category: "Picker",   color: "#E85D7A" },
  relation:   { label: "Relation",   icon: "⇢",   category: "Relation", color: "#A78BFA" },
  heading:    { label: "Heading",    icon: "H",   category: "Layout",   color: "#777" },
  paragraph:  { label: "Paragraph",  icon: "P",   category: "Layout", color: "#777" },
  divider:    { label: "Divider",    icon: "—",   category: "Layout", color: "#777" },
};

const CATEGORIES = ["Input", "Text", "Choice", "Picker", "Relation", "Layout"];

// ── Table styles ──────────────────────────────────────────────────────────────

const thStyle = "px-3 py-2 text-left text-[rgba(255,255,255,0.3)] font-mono text-[10px] font-bold tracking-[0.1em] border-b border-[rgba(255,255,255,0.07)] whitespace-nowrap";

const tdStyle = "px-3 py-[9px] border-b border-[rgba(255,255,255,0.04)] max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrip() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="5" cy="3" r="1.2" /><circle cx="9" cy="3" r="1.2" />
      <circle cx="5" cy="7" r="1.2" /><circle cx="9" cy="7" r="1.2" />
      <circle cx="5" cy="11" r="1.2" /><circle cx="9" cy="11" r="1.2" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <polyline points="1,3 12,3" /><path d="M5,3V2h3v1" /><path d="M2,3l1,9h7l1-9" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M1,9V2a1,1,0,0,1,1-1H9" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1,7 C3,3 11,3 13,7 C11,11 3,11 1,7Z" />
      <circle cx="7" cy="7" r="2" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1,7 C3,3 11,3 13,7" />
      <line x1="2" y1="12" x2="12" y2="2" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <rect width="16" height="1.5" rx="0.75" />
      <rect width="10" height="1.5" rx="0.75" y="5.25" />
      <rect width="16" height="1.5" rx="0.75" y="10.5" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8V2M3 5l3-3 3 3" />
      <path d="M1 9v1.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V9" />
    </svg>
  );
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Field Type Picker Modal ───────────────────────────────────────────────────

function FieldTypePicker({
  onPick,
  onClose,
}: {
  onPick: (t: FieldType) => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-100 flex justify-center bg-[rgba(0,0,0,0.75)] backdrop-blur-[6px]",
        isMobile ? "items-end" : "items-center",
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-[#111] border border-[rgba(255,255,255,0.1)] max-h-[82vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.8)]",
          isMobile ? "rounded-[14px_14px_0_0] px-4 pt-5 pb-8 w-full" : "rounded-[14px] p-7 w-130",
        )}
      >
        <div className="flex items-center justify-between mb-5.5">
          <p className="text-white font-mono text-[13px] font-bold tracking-widest">
            ADD FIELD
          </p>
          <button
            onClick={onClose}
            className="text-[rgba(255,255,255,0.4)] bg-none border-0 cursor-pointer text-[20px] leading-none px-1"
          >
            ×
          </button>
        </div>

        {CATEGORIES.map((cat) => {
          const entries = Object.entries(FIELD_META).filter(
            ([, m]) => m.category === cat,
          );
          return (
            <div key={cat} className="mb-5.5">
              <p className="text-[rgba(255,255,255,0.25)] font-mono text-[10px] tracking-[0.14em] mb-2.5">
                {cat.toUpperCase()}
              </p>
              <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-3")}>
                {entries.map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => {
                      onPick(type as FieldType);
                      onClose();
                    }}
                    className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[9px] px-3 py-2.75 cursor-pointer flex items-center gap-2.5 text-left transition-all duration-130"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.borderColor = meta.color + "55";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    }}
                  >
                    <span
                      className="w-8.5 h-8.5 rounded-[7px] flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: meta.color + "1a", color: meta.color }}
                    >
                      {meta.icon}
                    </span>
                    <span className="text-[#d8d8d8] font-mono text-[12px]">
                      {meta.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Properties Panel sub-components (module-level to keep identity stable) ────

const panelLabelStyle = "block text-[rgba(255,255,255,0.35)] font-mono text-[10px] tracking-[0.1em] mb-[5px]";

const panelInputStyle = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] rounded-[7px] px-[10px] py-[7px] text-[#e0e0e0] font-mono text-xs outline-none box-border transition-colors duration-150";

function PanelSectionLabel({ title }: { title: string }) {
  return (
    <p className="text-[rgba(255,255,255,0.2)] font-mono text-[10px] tracking-[0.12em] mt-5 mb-2.5">
      {title}
    </p>
  );
}

function PanelField({
  label,
  value,
  onCh,
  type = "text",
  placeholder = "",
  accentColor,
}: {
  label: string;
  value: string | number;
  onCh: (v: string) => void;
  type?: string;
  placeholder?: string;
  accentColor: string;
}) {
  return (
    <div className="mb-3">
      <label className={panelLabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onCh(e.target.value)}
        className={panelInputStyle}
        onFocus={(e) => (e.target.style.borderColor = accentColor + "88")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}

function PanelToggle({
  label,
  value,
  onCh,
}: {
  label: string;
  value: boolean;
  onCh: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[rgba(255,255,255,0.55)] font-mono text-[12px]">{label}</span>
      <button
        onClick={() => onCh(!value)}
        className={cn(
          "w-9.5 h-5.5 rounded-[11px] border-none cursor-pointer relative transition-[background] duration-200 shrink-0",
          value ? "bg-[#4D96D9]" : "bg-[rgba(255,255,255,0.1)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.75 w-4 h-4 rounded-full bg-white transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
            value ? "left-4.75" : "left-0.75",
          )}
        />
      </button>
    </div>
  );
}

// ── Properties Panel ──────────────────────────────────────────────────────────

function PropertiesPanel({
  field,
  onChange,
  onClose,
  templates,
  currentTemplateId,
  isMobile = false,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onClose: () => void;
  templates: FormTemplate[];
  currentTemplateId: string;
  isMobile?: boolean;
}) {
  const meta = FIELD_META[field.type];
  const isLayout = meta.category === "Layout";
  const isChoice = ["select", "radio", "checkboxes"].includes(field.type);
  const hasPlaceholder = [
    "text", "email", "number", "tel", "url", "password", "textarea",
  ].includes(field.type);

  const upd = (patch: Partial<FormField>) => onChange({ ...field, ...patch });

  const addOption = () => {
    const n = field.options.length + 1;
    upd({
      options: [
        ...field.options,
        { id: uid(), label: `Option ${n}`, value: `option_${n}` },
      ],
    });
  };
  const removeOption = (id: string) =>
    upd({ options: field.options.filter((o) => o.id !== id) });
  const updateOption = (id: string, label: string) =>
    upd({
      options: field.options.map((o) =>
        o.id === id
          ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, "_") }
          : o,
      ),
    });

  return (
    <div
      className={cn(
        "bg-[#0c0c0c] flex flex-col overflow-y-auto",
        isMobile
          ? "fixed inset-[auto_0_0_0] z-150 max-h-[70vh] border-t border-[rgba(255,255,255,0.1)] rounded-[14px_14px_0_0] shadow-[0_-16px_48px_rgba(0,0,0,0.6)]"
          : "w-68 shrink-0 border-l border-[rgba(255,255,255,0.07)]",
      )}
    >
      {/* Header */}
      <div className="px-4.5 py-3.75 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0 sticky top-0 bg-[#0c0c0c] z-1">
        <div className="flex items-center gap-2.25">
          <span
            className="w-7.5 h-7.5 rounded-[7px] flex items-center justify-center font-mono text-[10px] font-bold shrink-0"
            style={{ backgroundColor: meta.color + "1a", color: meta.color }}
          >
            {meta.icon}
          </span>
          <div>
            <p className="text-[#e0e0e0] font-mono text-[11px] font-bold">
              {meta.label}
            </p>
            <p className="text-[rgba(255,255,255,0.25)] font-mono text-[9px] tracking-[0.08em]">
              PROPERTIES
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[rgba(255,255,255,0.3)] bg-transparent border-none cursor-pointer text-[18px] leading-none px-1 py-0.5"
        >
          ×
        </button>
      </div>

      <div className="px-4.5 pt-1 pb-6 flex-1">
        {/* Layout: heading */}
        {field.type === "heading" && (
          <>
            <PanelSectionLabel title="CONTENT" />
            <PanelField accentColor={meta.color} label="TEXT" value={field.content} onCh={(v) => upd({ content: v, label: v })} />
            <div className="mb-3">
              <label className={panelLabelStyle}>LEVEL</label>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => upd({ level: l })}
                    className={cn(
                      "flex-1 py-1.75 rounded-[7px] font-mono text-[11px] cursor-pointer font-bold border",
                      field.level === l
                        ? "bg-[#4D96D9] border-[#4D96D9] text-white"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.4)]",
                    )}
                  >
                    H{l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Layout: paragraph */}
        {field.type === "paragraph" && (
          <>
            <PanelSectionLabel title="CONTENT" />
            <div className="mb-3">
              <label className={panelLabelStyle}>TEXT</label>
              <textarea
                value={field.content}
                rows={4}
                onChange={(e) => upd({ content: e.target.value, label: e.target.value })}
                className={cn(panelInputStyle, "resize-y")}
                onFocus={(e) => (e.target.style.borderColor = "#77777788")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
              />
            </div>
          </>
        )}

        {/* Regular fields */}
        {!isLayout && (
          <>
            <PanelSectionLabel title="FIELD" />
            <PanelField accentColor={meta.color} label="LABEL" value={field.label} onCh={(v) => upd({ label: v })} />
            {hasPlaceholder && (
              <PanelField accentColor={meta.color} label="PLACEHOLDER" value={field.placeholder} onCh={(v) => upd({ placeholder: v })} />
            )}
            <PanelField accentColor={meta.color} label="HELP TEXT" value={field.helpText} onCh={(v) => upd({ helpText: v })} placeholder="Optional hint…" />
            <PanelToggle label="Required" value={field.required} onCh={(v) => upd({ required: v })} />
          </>
        )}

        {/* Width */}
        {field.type !== "divider" && (
          <>
            <PanelSectionLabel title="WIDTH" />
            <div className="flex gap-1.5 mb-3">
              {(["full", "half", "third"] as FieldWidth[]).map((w) => (
                <button
                  key={w}
                  onClick={() => upd({ width: w })}
                  className={cn(
                    "flex-1 py-1.75 px-1 rounded-[7px] font-mono text-[10px] cursor-pointer border",
                    field.width === w
                      ? "font-bold"
                      : "font-normal bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.4)]",
                  )}
                  style={
                    field.width === w
                      ? { background: meta.color + "22", borderColor: meta.color + "66", color: meta.color }
                      : undefined
                  }
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Choice options */}
        {isChoice && (
          <>
            <PanelSectionLabel title="OPTIONS" />
            <div className="flex flex-col gap-1.5 mb-2.5">
              {field.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-1.5">
                  <input
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    className={cn(panelInputStyle, "flex-1")}
                    onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                  <button
                    onClick={() => removeOption(opt.id)}
                    disabled={field.options.length <= 1}
                    className={cn(
                      "bg-transparent border-none p-1 flex",
                      field.options.length <= 1
                        ? "text-[rgba(255,255,255,0.1)] cursor-not-allowed"
                        : "text-[rgba(255,255,255,0.3)] cursor-pointer",
                    )}
                    onMouseEnter={(e) => {
                      if (field.options.length > 1) e.currentTarget.style.color = "#E85D7A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="flex items-center gap-1.5 bg-transparent rounded-[7px] py-1.75 px-2.5 font-mono text-[11px] cursor-pointer w-full transition-colors duration-150 border border-dashed"
              style={{ color: meta.color, borderColor: meta.color + "44" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color + "aa")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = meta.color + "44")}
            >
              <IconPlus />
              Add option
            </button>
          </>
        )}

        {/* Textarea rows */}
        {field.type === "textarea" && (
          <>
            <PanelSectionLabel title="SETTINGS" />
            <PanelField accentColor={meta.color} label="ROWS" value={field.rows} type="number" onCh={(v) => upd({ rows: Number(v) })} />
          </>
        )}

        {/* Range config */}
        {field.type === "range" && (
          <>
            <PanelSectionLabel title="RANGE" />
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["min", "max", "step"] as const).map((k) => (
                <div key={k}>
                  <label className={panelLabelStyle}>{k.toUpperCase()}</label>
                  <input
                    type="number"
                    value={field[k]}
                    onChange={(e) => upd({ [k]: Number(e.target.value) })}
                    className={panelInputStyle}
                    onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Number constraints */}
        {field.type === "number" && (
          <>
            <PanelSectionLabel title="CONSTRAINTS" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(["min", "max"] as const).map((k) => (
                <div key={k}>
                  <label className={panelLabelStyle}>{k.toUpperCase()}</label>
                  <input
                    type="number"
                    value={field[k]}
                    onChange={(e) => upd({ [k]: Number(e.target.value) })}
                    className={panelInputStyle}
                    onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Text validation */}
        {["text", "email", "tel", "url", "password", "textarea"].includes(field.type) && (
          <>
            <PanelSectionLabel title="VALIDATION" />
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(["minLength", "maxLength"] as const).map((k) => (
                <div key={k}>
                  <label className={panelLabelStyle}>{k === "minLength" ? "MIN LEN" : "MAX LEN"}</label>
                  <input
                    type="number"
                    value={field[k]}
                    onChange={(e) => upd({ [k]: Number(e.target.value) })}
                    className={panelInputStyle}
                    onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                </div>
              ))}
            </div>
            <PanelField
              accentColor={meta.color}
              label="PATTERN (REGEX)"
              value={field.pattern}
              onCh={(v) => upd({ pattern: v })}
              placeholder="e.g. [A-Z]+"
            />
          </>
        )}

        {/* Relation config */}
        {field.type === "relation" && (
          <>
            <PanelSectionLabel title="LINKED FORM" />
            <div className="mb-3">
              <label className={panelLabelStyle}>TARGET FORM</label>
              <select
                value={field.relatedTemplateId}
                onChange={(e) => upd({ relatedTemplateId: e.target.value, relatedDisplayField: "" })}
                className={cn(panelInputStyle, "appearance-none cursor-pointer")}
                onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
              >
                <option value="">— select a form —</option>
                {templates
                  .filter((t) => t.id !== currentTemplateId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
            </div>

            {field.relatedTemplateId && (() => {
              const related = templates.find((t) => t.id === field.relatedTemplateId);
              const displayableFields = related?.fields.filter(
                (f) => !["heading", "paragraph", "divider", "relation"].includes(f.type)
              ) ?? [];
              return (
                <div className="mb-3">
                  <label className={panelLabelStyle}>DISPLAY FIELD</label>
                  <select
                    value={field.relatedDisplayField}
                    onChange={(e) => upd({ relatedDisplayField: e.target.value })}
                    className={cn(panelInputStyle, "appearance-none cursor-pointer")}
                    onFocus={(e) => (e.target.style.borderColor = meta.color + "88")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  >
                    <option value="">— pick a label field —</option>
                    {displayableFields.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <p className="text-[rgba(255,255,255,0.25)] font-mono text-[10px] mt-1.5 leading-[1.55]">
                    This field will be shown as the record label in dropdowns.
                  </p>
                </div>
              );
            })()}

            {field.relatedTemplateId && (
              <div className="bg-[rgba(167,139,250,0.05)] border border-[rgba(167,139,250,0.15)] rounded-lg p-[10px_12px] mb-3">
                <p className="text-[rgba(167,139,250,0.8)] font-mono text-[10px] leading-[1.6]">
                  FK: <span className="text-[#A78BFA]">{templates.find(t => t.id === currentTemplateId)?.name ?? "this form"}</span>
                  {" → "}
                  <span className="text-[#A78BFA]">{templates.find(t => t.id === field.relatedTemplateId)?.name ?? "…"}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Field Card (builder) ──────────────────────────────────────────────────────

function FieldCard({
  field,
  selected,
  isDragOver,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  templates = [],
}: {
  field: FormField;
  selected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  templates?: FormTemplate[];
}) {
  const meta = FIELD_META[field.type];
  const isLayout = meta.category === "Layout";
  const linkedForm = field.type === "relation" && field.relatedTemplateId
    ? templates.find((t) => t.id === field.relatedTemplateId)
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={cn(
        "relative rounded-[10px] transition-all duration-130 cursor-pointer border",
        isDragOver && "opacity-60 outline-2 outline-dashed outline-[rgba(77,150,217,0.3)] outline-offset-2",
        !selected && !isDragOver && "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]",
        !selected && isDragOver && "border-[rgba(77,150,217,0.4)] bg-[rgba(77,150,217,0.05)]",
      )}
      style={selected ? { borderColor: meta.color + "55", backgroundColor: meta.color + "09" } : undefined}
    >
      <div className="flex items-center gap-2.25 px-3 py-2.5">
        {/* Drag grip */}
        <div
          className="text-[rgba(255,255,255,0.18)] cursor-grab flex items-center shrink-0"
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
        >
          <IconGrip />
        </div>

        {/* Type badge */}
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center font-mono text-[9px] font-bold shrink-0"
          style={{ backgroundColor: meta.color + "1a", color: meta.color }}
        >
          {meta.icon}
        </span>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-mono text-[12px] overflow-hidden text-ellipsis whitespace-nowrap",
              isLayout ? "text-[rgba(255,255,255,0.4)]" : "text-[#e0e0e0]",
              selected ? "font-semibold" : "font-normal",
              isLayout && field.type !== "divider" ? "italic" : "not-italic",
            )}
          >
            {field.type === "divider"
              ? "──────────────────────"
              : field.content || field.label}
          </p>
          {!isLayout && (
            <p className="text-[rgba(255,255,255,0.25)] font-mono text-[10px] mt-0.5">
              {meta.label}
              {linkedForm ? ` → ${linkedForm.name}` : ""}
              {field.required ? " · required" : ""}
              {field.width !== "full" ? ` · ${field.width}` : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="p-1.25 text-[rgba(255,255,255,0.25)] bg-transparent border-none cursor-pointer rounded-[5px] flex"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            <IconCopy />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.25 text-[rgba(255,255,255,0.25)] bg-transparent border-none cursor-pointer rounded-[5px] flex"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E85D7A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Width bar */}
      {field.width !== "full" && !isLayout && (
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(to right, ${meta.color}55 ${field.width === "half" ? "50%" : "33.3%"}, rgba(255,255,255,0.04) 0%)` }}
        />
      )}
    </div>
  );
}

// ── Add Field Button ──────────────────────────────────────────────────────────

function AddFieldBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={cn(
        "flex items-center justify-center gap-1.5 w-full p-1.75 border border-dashed rounded-lg font-mono text-[11px] cursor-pointer transition-all duration-130",
        hov
          ? "bg-[rgba(77,150,217,0.05)] border-[rgba(77,150,217,0.35)] text-[#4D96D9]"
          : "bg-transparent border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.2)]",
      )}
    >
      <IconPlus />
      Add field
    </button>
  );
}

// ── Preview Field ─────────────────────────────────────────────────────────────

function PreviewField({
  field,
  value,
  onChange,
  templates = [],
}: {
  field: FormField;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  templates?: FormTemplate[];
}) {
  const meta = FIELD_META[field.type];

  const inputBase = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-[9px] text-[#e0e0e0] font-mono text-[13px] outline-none box-border transition-colors duration-150";

  const onFocus = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = meta.color + "88";
  };
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
  };

  if (field.type === "divider") {
    return (
      <hr className="border-0 border-t border-t-[rgba(255,255,255,0.08)] my-1" />
    );
  }

  if (field.type === "relation") {
    const related = templates.find((t) => t.id === field.relatedTemplateId);
    const displayFields = related?.fields.filter(
      (f) => !["heading", "paragraph", "divider", "relation"].includes(f.type),
    ) ?? [];
    const displayField = displayFields.find((f) => f.id === field.relatedDisplayField);
    const selected = value as string;

    // Simulate records from the related form's field labels as placeholder rows
    const mockRecords = related
      ? [1, 2, 3].map((n) => ({ id: `mock-${n}`, label: `${related.name} record ${n}` }))
      : [];

    return (
      <div>
        <label className="block text-[#c8c8c8] font-mono text-[12px] font-semibold mb-1.75">
          {field.label}
          {field.required && <span className="text-[#E85D7A] ml-0.75">*</span>}
        </label>
        {!related ? (
          <div className={cn(inputBase, "text-[rgba(255,255,255,0.2)] italic")}>
            No linked form configured
          </div>
        ) : (
          <>
            <select
              value={selected}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              className={cn(inputBase, "appearance-none cursor-pointer")}
            >
              <option value="">— select a {related.name} record —</option>
              {mockRecords.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[rgba(167,139,250,0.5)] font-mono text-[9px] tracking-widest">
                FK →
              </span>
              <span className="text-[rgba(167,139,250,0.7)] font-mono text-[10px]">
                {related.name}
                {displayField ? ` · display: ${displayField.label}` : ""}
              </span>
            </div>
          </>
        )}
        {field.helpText && (
          <p className="text-[rgba(255,255,255,0.3)] font-mono text-[10px] mt-1.5 leading-[1.55]">
            {field.helpText}
          </p>
        )}
      </div>
    );
  }

  if (field.type === "heading") {
    const sz = { 1: 22, 2: 17, 3: 14 }[field.level] ?? 17;
    return (
      <p
        className={cn(
          "text-white font-mono font-bold m-0",
          field.level === 1 && "tracking-[-0.02em]",
          sz === 22 && "text-[22px]",
          sz === 17 && "text-[17px]",
          sz === 14 && "text-[14px]",
        )}
      >
        {field.content}
      </p>
    );
  }

  if (field.type === "paragraph") {
    return (
      <p className="text-[rgba(255,255,255,0.45)] font-mono text-[12px] leading-[1.65] m-0">
        {field.content}
      </p>
    );
  }

  return (
    <div>
      <label className="block text-[#c8c8c8] font-mono text-[12px] font-semibold mb-1.75">
        {field.label}
        {field.required && (
          <span className="text-[#E85D7A] ml-0.75">*</span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          rows={field.rows}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(inputBase, "resize-y")}
        />
      ) : field.type === "select" ? (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(inputBase, "appearance-none cursor-pointer")}
        >
          <option value="">— select —</option>
          {field.options.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "radio" ? (
        <div className="flex flex-col gap-2.5">
          {field.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="w-[15px] h-[15px]"
                style={{ accentColor: meta.color }}
              />
              <span className="text-[#d0d0d0] font-mono text-[12px]">{o.label}</span>
            </label>
          ))}
        </div>
      ) : field.type === "checkboxes" ? (
        <div className="flex flex-col gap-2.5">
          {field.options.map((o) => {
            const arr = value as string[];
            const checked = arr.includes(o.value);
            return (
              <label key={o.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? arr.filter((v) => v !== o.value)
                        : [...arr, o.value],
                    )
                  }
                  className="w-3.75 h-3.75"
                  style={{ accentColor: meta.color }}
                />
                <span className="text-[#d0d0d0] font-mono text-[12px]">{o.label}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === "range" ? (
        <div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={(value as string) || String(field.min)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full cursor-pointer"
            style={{ accentColor: meta.color }}
          />
          <div className="flex justify-between mt-1.25">
            <span className="text-[rgba(255,255,255,0.25)] font-mono text-[10px]">{field.min}</span>
            <span className="font-mono text-[12px] font-bold" style={{ color: meta.color }}>{value || field.min}</span>
            <span className="text-[rgba(255,255,255,0.25)] font-mono text-[10px]">{field.max}</span>
          </div>
        </div>
      ) : (
        <input
          type={field.type}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          min={field.type === "number" ? field.min : undefined}
          max={field.type === "number" ? field.max : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          className={inputBase}
        />
      )}

      {field.helpText && (
        <p className="text-[rgba(255,255,255,0.3)] font-mono text-[10px] mt-1.5 leading-[1.55]">
          {field.helpText}
        </p>
      )}
    </div>
  );
}

// ── CSV Dropzone Overlay ──────────────────────────────────────────────────────

function CsvDropzone({
  onFile,
  onClose,
  loading,
}: {
  onFile: (file: File) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={!loading ? onClose : undefined}
      className="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(0,0,0,0.75)] backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-[14px] p-7 w-105 max-w-[calc(100vw-2rem)] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-white font-mono text-[13px] font-bold tracking-widest">IMPORT CSV</p>
          {!loading && (
            <button
              onClick={onClose}
              className="text-[rgba(255,255,255,0.4)] bg-transparent border-none cursor-pointer text-[20px] leading-none px-1"
            >
              ×
            </button>
          )}
        </div>

        {/* Drop zone */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
          onClick={() => !loading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl py-11 px-8 text-center transition-all duration-150",
            loading ? "cursor-default" : "cursor-pointer",
            dragging
              ? "border-[#5AAD6B] bg-[rgba(90,173,107,0.07)]"
              : loading
                ? "border-[rgba(90,173,107,0.25)] bg-[rgba(90,173,107,0.03)]"
                : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]",
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-[rgba(90,173,107,0.25)] border-t-[#5AAD6B] rounded-full animate-spin" />
              <p className="text-[rgba(255,255,255,0.35)] font-mono text-[12px]">Processing…</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-150",
                  dragging ? "bg-[rgba(90,173,107,0.15)] text-[#5AAD6B]" : "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.35)]",
                )}
              >
                <IconUpload />
              </div>
              <p className="text-[rgba(255,255,255,0.6)] font-mono text-[13px] mb-1">
                {dragging ? "Drop to import" : "Drop a file here or click to browse"}
              </p>
              <p className="text-[rgba(255,255,255,0.25)] font-mono text-[11px] mb-4">
                First row is used as column headers
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-0.75 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded text-[rgba(255,255,255,0.3)] font-mono text-[9px] tracking-[0.12em]">
                  .CSV
                </span>
                <span className="text-[rgba(255,255,255,0.15)]">·</span>
                <span className="text-[rgba(255,255,255,0.3)] font-mono text-[10px]">max 5 MB</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Overlay ────────────────────────────────────────────────────

function ConfirmDeleteOverlay({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-6 w-80 shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
      >
        <p className="text-[#e0e0e0] font-mono text-[13px] font-bold mb-1.5">Confirm delete</p>
        <p className="text-[rgba(255,255,255,0.4)] font-mono text-[11px] leading-[1.6] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.75 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[7px] text-[rgba(255,255,255,0.55)] font-mono text-[11px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            className="px-3.5 py-1.75 bg-[#E85D7A] border-none rounded-[7px] text-white font-mono text-[11px] font-bold cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DynamicFormBuilder() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mode, setMode] = useState<"build" | "preview" | "submissions">("build");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertAfterIdx, setInsertAfterIdx] = useState(-1);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, string | string[]>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [subLayout, setSubLayout] = useState<"table" | "card">("table");
  const [confirmDelete, setConfirmDelete] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ subId: string; fieldId: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [cardPage, setCardPage] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const dragIdx = useRef<number | null>(null);

  const CARDS_PER_PAGE = 24;
  const ROW_HEIGHT = 38; // px — approximate row height for virtualization
  const TABLE_VIEWPORT_HEIGHT = 520; // px — fixed height of the scrollable table container

  // ── Load from IndexedDB ──────────────────────────────────────────────────
  useEffect(() => {
    dbGetAll().then((list) => {
      if (list.length > 0) {
        setTemplates(list);
        setActiveId(list[0].id);
        setTemplate(structuredClone(list[0]));
        dbGetSubmissions(list[0].id).then(setSubmissions);
      } else {
        const sample = makeSampleTemplate();
        dbPut(sample).catch(() => {});
        setTemplates([sample]);
        setActiveId(sample.id);
        setTemplate(structuredClone(sample));
        setSubmissions([]);
      }
    });
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const saveTemplate = useCallback(async () => {
    if (!template) return;
    setSaving(true);
    const updated = { ...template, updatedAt: Date.now() };
    await dbPut(updated);
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      return idx >= 0
        ? prev.map((t) => (t.id === updated.id ? updated : t))
        : [updated, ...prev];
    });
    setTemplate(updated);
    setDirty(false);
    setSaving(false);
  }, [template]);

  // Cmd/Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) saveTemplate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saveTemplate]);

  // ── Template operations ───────────────────────────────────────────────────
  const newTemplate = () => {
    const t: FormTemplate = {
      id: uid(),
      name: "Untitled Form",
      description: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fields: [],
    };
    setTemplate(t);
    setActiveId(t.id);
    setSelectedFieldId(null);
    setDirty(true);
    setMode("build");
    setPreviewSubmitted(false);
    setPreviewValues({});
    setSubmissions([]);
  };

  const loadTemplate = (id: string) => {
    const t = templates.find((t) => t.id === id);
    if (!t) return;
    setTemplate(structuredClone(t));
    setActiveId(id);
    setSelectedFieldId(null);
    setDirty(false);
    setMode("build");
    setPreviewSubmitted(false);
    setPreviewValues({});
    setCardPage(0);
    setTableScrollTop(0);
    dbGetSubmissions(id).then(setSubmissions);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteTemplate = async (id: string) => {
    await dbDelete(id);
    const remaining = templates.filter((t) => t.id !== id);
    setTemplates(remaining);
    if (activeId === id) {
      if (remaining.length > 0) {
        loadTemplate(remaining[0].id);
      } else {
        setTemplate(null);
        setActiveId(null);
      }
    }
  };

  const updateTemplate = (patch: Partial<FormTemplate>) => {
    if (!template) return;
    setTemplate({ ...template, ...patch });
    setDirty(true);
  };

  // ── Field operations ──────────────────────────────────────────────────────
  const addField = (type: FieldType) => {
    if (!template) return;
    const field = makeField(type);
    const fields = [...template.fields];
    fields.splice(insertAfterIdx + 1, 0, field);
    updateTemplate({ fields });
    setSelectedFieldId(field.id);
  };

  const deleteField = (id: string) => {
    if (!template) return;
    updateTemplate({ fields: template.fields.filter((f) => f.id !== id) });
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const duplicateField = (id: string) => {
    if (!template) return;
    const idx = template.fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const clone = { ...structuredClone(template.fields[idx]), id: uid() };
    const fields = [...template.fields];
    fields.splice(idx + 1, 0, clone);
    updateTemplate({ fields });
    setSelectedFieldId(clone.id);
  };

  const updateField = (field: FormField) => {
    if (!template) return;
    updateTemplate({ fields: template.fields.map((f) => (f.id === field.id ? field : f)) });
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx.current === null || !template) return;
    const from = dragIdx.current;
    if (from !== idx) {
      const fields = [...template.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(idx, 0, moved);
      updateTemplate({ fields });
    }
    dragIdx.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const saveEdit = useCallback((subId: string, fieldId: string, value: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        const updated = { ...s, data: { ...s.data, [fieldId]: value } };
        dbPutSubmission(updated).catch(() => {});
        return updated;
      }),
    );
    setEditingCell(null);
  }, []);

  const handleCSVFile = useCallback(
    (file: File) => {
      if (file.size > CSV_SIZE_LIMIT) {
        setCsvError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`);
        return;
      }
      setCsvLoading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target?.result as string;
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0) {
          setCsvLoading(false);
          setCsvError("No columns found — make sure the first row contains headers.");
          return;
        }
        const t = csvToTemplate(file.name, headers, rows);

        const now = Date.now();
        const dataRows = rows.filter((row) => row.some((cell) => cell.trim() !== ""));
        const subs: FormSubmission[] = dataRows.map((row, i) => ({
          id: uid(),
          templateId: t.id,
          submittedAt: now - i,
          data: Object.fromEntries(
            t.fields.map((field, colIdx) => [field.id, row[colIdx]?.trim() ?? ""]),
          ),
        }));

        try {
          await dbPut(t);
          await dbPutManySubmissions(subs);
        } catch {
          setCsvLoading(false);
          setCsvError("Failed to save data. Please try again.");
          return;
        }

        setTemplates((prev) => [t, ...prev]);
        setActiveId(t.id);
        setTemplate(structuredClone(t));
        setSelectedFieldId(null);
        setDirty(false);
        setMode("submissions");
        setPreviewSubmitted(false);
        setPreviewValues({});
        setCardPage(0);
        setTableScrollTop(0);
        setSubmissions(subs);
        setCsvLoading(false);
        setDropzoneOpen(false);
        if (isMobile) setSidebarOpen(false);
      };
      reader.readAsText(file);
    },
    [isMobile],
  );

  const selectedField =
    template?.fields.find((f) => f.id === selectedFieldId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh bg-[#0a0a0a] text-[#e0e0e0] font-mono overflow-hidden">
      {/* ── Mobile sidebar backdrop ────────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-199 bg-[rgba(0,0,0,0.6)]"
        />
      )}

      {/* ── Left sidebar: Templates ────────────────────────────────────────── */}
      <div
        className={cn(
          "bg-[#0d0d0d] flex flex-col overflow-hidden transition-[width] duration-220 ease-[ease]",
          isMobile
            ? "fixed inset-y-0 left-0 z-200 border-r border-[rgba(255,255,255,0.1)]"
            : "shrink-0 border-r border-[rgba(255,255,255,0.06)]",
        )}
        style={isMobile
          ? { width: sidebarOpen ? "min(228px, 85vw)" : 0, boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.5)" : "none" }
          : { width: sidebarOpen ? 228 : 0 }
        }
      >
        <div className="px-3.5 pt-3.5 pb-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
          <p className="text-[10px] tracking-[0.13em] text-[rgba(255,255,255,0.25)]">
            TEMPLATES
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => !csvLoading && setDropzoneOpen(true)}
              title="Import CSV"
              className={cn(
                "p-1.25 border rounded-md flex items-center transition-all duration-150",
                csvLoading
                  ? "bg-[rgba(90,173,107,0.15)] border-[rgba(90,173,107,0.3)] text-[#5AAD6B] cursor-wait"
                  : "bg-[rgba(90,173,107,0.1)] border-[rgba(90,173,107,0.18)] text-[#5AAD6B] cursor-pointer",
              )}
            >
              {csvLoading
                ? <div className="w-3 h-3 border border-[rgba(90,173,107,0.4)] border-t-[#5AAD6B] rounded-full animate-spin" />
                : <IconUpload />}
            </button>
            <button
              onClick={newTemplate}
              className="px-2 py-1 bg-[rgba(77,150,217,0.1)] border border-[rgba(77,150,217,0.18)] rounded-md text-[#4D96D9] cursor-pointer text-[10px] font-mono font-bold"
            >
              + NEW
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {templates.length === 0 && (
            <p className="text-[rgba(255,255,255,0.15)] text-[11px] px-2 py-4 text-center">
              No templates
            </p>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => loadTemplate(t.id)}
              className={cn(
                "flex items-start justify-between gap-1.5 px-2.5 py-2.25 rounded-lg cursor-pointer mb-0.5 border transition-all duration-120",
                activeId === t.id
                  ? "bg-[rgba(77,150,217,0.08)] border-[rgba(77,150,217,0.18)]"
                  : "bg-transparent border-transparent",
              )}
              onMouseEnter={(e) => {
                if (activeId !== t.id)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (activeId !== t.id)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[12px] overflow-hidden text-ellipsis whitespace-nowrap",
                    activeId === t.id ? "text-[#4D96D9] font-bold" : "text-[#d0d0d0] font-normal",
                  )}
                >
                  {t.name}
                </p>
                <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-0.5">
                  {t.fields.length} field{t.fields.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete({ message: `Delete "${t.name}"? This cannot be undone.`, onConfirm: () => deleteTemplate(t.id) });
                }}
                className="text-[rgba(255,255,255,0.18)] bg-transparent border-none cursor-pointer p-0.75 shrink-0 flex"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E85D7A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-13 border-b border-[rgba(255,255,255,0.06)] flex items-center px-3.5 gap-2.5 shrink-0 bg-[#0d0d0d]">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-[rgba(255,255,255,0.35)] bg-transparent border-none cursor-pointer flex items-center p-1.25 rounded-md shrink-0"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <IconMenu />
          </button>

          {template ? (
            <input
              value={template.name}
              onChange={(e) => updateTemplate({ name: e.target.value })}
              className="bg-transparent border-none text-[#e0e0e0] font-mono text-[13px] font-bold outline-none flex-1 min-w-0"
              placeholder="Form name"
            />
          ) : (
            <span className="flex-1 text-[rgba(255,255,255,0.2)] text-[13px]">
              No template
            </span>
          )}

          {template && (
            <>
              {dirty && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#F4A020] shrink-0"
                  title="Unsaved changes"
                />
              )}

              {/* Mode toggle */}
              <div className="flex bg-[rgba(255,255,255,0.05)] rounded-[9px] p-0.75 gap-0.5">
                {(["build", "preview", "submissions"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setPreviewSubmitted(false);
                    }}
                    className={cn(
                      "rounded-md border-none font-mono text-[11px] cursor-pointer flex items-center transition-all duration-120",
                      isMobile ? "px-2.5 py-1.5 gap-0" : "px-2.75 py-1.25 gap-1.25",
                      mode === m ? "bg-[rgba(255,255,255,0.09)] text-[#e0e0e0] font-semibold" : "bg-transparent text-[rgba(255,255,255,0.35)] font-normal",
                    )}
                  >
                    {m === "build" && <IconEye open={false} />}
                    {m === "preview" && <IconEye open={true} />}
                    {m === "submissions" && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <rect x="1" y="1" width="10" height="10" rx="1.5" />
                        <line x1="3" y1="4" x2="9" y2="4" />
                        <line x1="3" y1="6.5" x2="9" y2="6.5" />
                        <line x1="3" y1="9" x2="6" y2="9" />
                      </svg>
                    )}
                    {!isMobile && (m === "submissions"
                      ? `Data${submissions.length > 0 ? ` (${submissions.length})` : ""}`
                      : m.charAt(0).toUpperCase() + m.slice(1))}
                    {isMobile && m === "submissions" && submissions.length > 0 && (
                      <span className="ml-1 text-[9px]">{submissions.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Save */}
              <button
                onClick={saveTemplate}
                disabled={!dirty || saving}
                className={cn(
                  "py-1.5 px-3.5 rounded-lg font-mono text-[11px] font-bold transition-all duration-150 shrink-0 border",
                  dirty
                    ? "bg-[#4D96D9] border-[#4D96D9] text-white cursor-pointer"
                    : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.25)] cursor-not-allowed",
                )}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className={cn("flex-1 overflow-y-auto", isMobile ? "px-3.5 py-4" : "px-9 py-7")}>
            {!template ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-[rgba(255,255,255,0.2)] text-[13px]">
                  No template selected
                </p>
                <button
                  onClick={newTemplate}
                  className="py-2.5 px-5 bg-[rgba(77,150,217,0.1)] border border-[rgba(77,150,217,0.25)] rounded-[9px] text-[#4D96D9] font-mono text-[12px] cursor-pointer"
                >
                  + Create new template
                </button>
              </div>
            ) : mode === "build" ? (
              <div className="max-w-170 mx-auto">
                {/* Description */}
                <div className="mb-5.5">
                  <input
                    value={template.description}
                    onChange={(e) => updateTemplate({ description: e.target.value })}
                    placeholder="Form description (optional)"
                    className="w-full bg-transparent border-0 border-b border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.35)] font-mono text-[12px] py-1 px-0 outline-none box-border"
                  />
                </div>

                {/* Fields list */}
                <div className="flex flex-col gap-1.25">
                  <AddFieldBtn
                    onClick={() => {
                      setInsertAfterIdx(-1);
                      setPickerOpen(true);
                    }}
                  />

                  {template.fields.map((field, idx) => (
                    <div key={field.id}>
                      <FieldCard
                        field={field}
                        selected={selectedFieldId === field.id}
                        isDragOver={dragOverIdx === idx && dragIdx.current !== idx}
                        onSelect={() =>
                          setSelectedFieldId(
                            selectedFieldId === field.id ? null : field.id,
                          )
                        }
                        onDelete={() => setConfirmDelete({ message: `Delete the "${field.label || field.type}" field?`, onConfirm: () => deleteField(field.id) })}
                        onDuplicate={() => duplicateField(field.id)}
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={handleDragEnd}
                        templates={templates}
                      />
                      <div className="mt-1.25">
                        <AddFieldBtn
                          onClick={() => {
                            setInsertAfterIdx(idx);
                            setPickerOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {template.fields.length === 0 && (
                    <div className="text-center py-14 text-[rgba(255,255,255,0.12)] text-[13px] border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl mt-1">
                      Click <strong className="text-[rgba(255,255,255,0.25)]">Add field</strong> above to start building
                    </div>
                  )}
                </div>

                {/* Field count */}
                {template.fields.length > 0 && (
                  <p className="text-center text-[rgba(255,255,255,0.15)] text-[10px] mt-5 tracking-[0.08em]">
                    {template.fields.length} FIELD{template.fields.length !== 1 ? "S" : ""}
                  </p>
                )}
              </div>
            ) : mode === "submissions" ? (
              /* Submissions */
              (() => {
                const dataFields = template.fields.filter(
                  (f) => !["heading", "paragraph", "divider", "relation"].includes(f.type),
                );

                const deleteSubmission = (id: string) => {
                  dbDeleteSubmission(id).then(() =>
                    setSubmissions((prev) => prev.filter((s) => s.id !== id)),
                  );
                };

                const formatVal = (val: string | string[] | undefined) => {
                  if (!val || val === "" || (Array.isArray(val) && val.length === 0))
                    return <span className="text-[rgba(255,255,255,0.2)] italic">—</span>;
                  if (Array.isArray(val)) return val.join(", ");
                  return val;
                };

                const formatDate = (ts: number) =>
                  new Date(ts).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  });

                return (
                  <div className="max-w-275 mx-auto">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[#e0e0e0] font-mono text-[13px] font-bold">
                          {template.name}
                        </p>
                        <p className="text-[rgba(255,255,255,0.25)] font-mono text-[10px] mt-0.75">
                          {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {/* Layout toggle */}
                      <div className="flex bg-[rgba(255,255,255,0.05)] rounded-lg p-0.75 gap-0.5">
                        {(["table", "card"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setSubLayout(v)}
                            className={cn(
                              "py-1.25 px-3 rounded-[5px] border-none font-mono text-[10px] cursor-pointer flex items-center gap-1.25 transition-all duration-120",
                              subLayout === v ? "bg-[rgba(255,255,255,0.1)] text-[#e0e0e0] font-bold" : "bg-transparent text-[rgba(255,255,255,0.3)] font-normal",
                            )}
                          >
                            {v === "table" ? (
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <rect x="0.5" y="0.5" width="10" height="10" rx="1" />
                                <line x1="0.5" y1="3.5" x2="10.5" y2="3.5" />
                                <line x1="0.5" y1="6.5" x2="10.5" y2="6.5" />
                                <line x1="3.5" y1="0.5" x2="3.5" y2="10.5" />
                              </svg>
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <rect x="0.5" y="0.5" width="4.5" height="4.5" rx="1" />
                                <rect x="6" y="0.5" width="4.5" height="4.5" rx="1" />
                                <rect x="0.5" y="6" width="4.5" height="4.5" rx="1" />
                                <rect x="6" y="6" width="4.5" height="4.5" rx="1" />
                              </svg>
                            )}
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {submissions.length === 0 ? (
                      <div className="text-center py-15 text-[rgba(255,255,255,0.12)] font-mono text-[13px] border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl">
                        No submissions yet — switch to <strong className="text-[rgba(255,255,255,0.25)]">Preview</strong> to fill the form
                      </div>
                    ) : subLayout === "table" ? (
                      /* ── Table (virtualized) ── */
                      (() => {
                        const overscan = 5;
                        const visibleStart = Math.max(0, Math.floor(tableScrollTop / ROW_HEIGHT) - overscan);
                        const visibleEnd = Math.min(
                          submissions.length,
                          Math.ceil((tableScrollTop + TABLE_VIEWPORT_HEIGHT) / ROW_HEIGHT) + overscan,
                        );
                        const visibleRows = submissions.slice(visibleStart, visibleEnd);
                        const topSpacer = visibleStart * ROW_HEIGHT;
                        const bottomSpacer = (submissions.length - visibleEnd) * ROW_HEIGHT;
                        return (
                          <div
                            ref={tableScrollRef}
                            className="overflow-auto"
                            style={{ height: TABLE_VIEWPORT_HEIGHT, overflowX: "auto" }}
                            onScroll={(e) => setTableScrollTop((e.currentTarget as HTMLElement).scrollTop)}
                          >
                            <table className="w-full border-collapse font-mono">
                              <thead className="sticky top-0 z-10 bg-[#0f0f0f]">
                                <tr>
                                  <th className={cn(thStyle, "w-32.5")}>Submitted</th>
                                  {dataFields.map((f) => (
                                    <th key={f.id} className={thStyle}>{f.label}</th>
                                  ))}
                                  <th className={cn(thStyle, "w-10")} />
                                </tr>
                              </thead>
                              <tbody>
                                {topSpacer > 0 && (
                                  <tr style={{ height: topSpacer }}><td colSpan={dataFields.length + 2} /></tr>
                                )}
                                {visibleRows.map((sub, idx) => {
                                  const si = visibleStart + idx;
                                  return (
                                    <tr
                                      key={sub.id}
                                      style={{ height: ROW_HEIGHT }}
                                      className={si % 2 === 0 ? "bg-[rgba(255,255,255,0.01)]" : "bg-transparent"}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = si % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent")}
                                    >
                                      <td className={tdStyle}>
                                        <span className="text-[rgba(255,255,255,0.3)] text-[10px]">{formatDate(sub.submittedAt)}</span>
                                      </td>
                                      {dataFields.map((f) => {
                                        const isEditing = editingCell?.subId === sub.id && editingCell?.fieldId === f.id;
                                        return (
                                          <td
                                            key={f.id}
                                            className={cn(
                                              tdStyle,
                                              "cursor-text",
                                              isEditing && "bg-[rgba(77,150,217,0.07)]! overflow-visible! whitespace-normal",
                                            )}
                                            onClick={() => {
                                              if (!isEditing) {
                                                setEditingCell({ subId: sub.id, fieldId: f.id });
                                                setEditingValue(String(sub.data[f.id] ?? ""));
                                              }
                                            }}
                                          >
                                            {isEditing ? (
                                              <div className="flex flex-col gap-1.5">
                                                <input
                                                  autoFocus
                                                  value={editingValue}
                                                  onChange={(e) => setEditingValue(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveEdit(sub.id, f.id, editingValue);
                                                    if (e.key === "Escape") setEditingCell(null);
                                                  }}
                                                  className="w-full min-w-30 bg-transparent border-none outline-none text-[#e0e0e0] text-[11px] font-mono"
                                                />
                                                <div className="flex gap-1">
                                                  <button
                                                    onMouseDown={(e) => { e.preventDefault(); saveEdit(sub.id, f.id, editingValue); }}
                                                    className="px-1.5 py-0.5 bg-[#4D96D9] border-none rounded text-white font-mono text-[10px] cursor-pointer leading-none"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onMouseDown={(e) => { e.preventDefault(); setEditingCell(null); }}
                                                    className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.07)] border-none rounded text-[rgba(255,255,255,0.45)] font-mono text-[10px] cursor-pointer leading-none"
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <span className="text-[#c8c8c8] text-[11px]">{formatVal(sub.data[f.id])}</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                      <td className={cn(tdStyle, "text-right")}>
                                        <button
                                          onClick={() => setConfirmDelete({ message: "Delete this submission?", onConfirm: () => deleteSubmission(sub.id) })}
                                          className="bg-transparent border-none cursor-pointer text-[rgba(255,255,255,0.2)] inline-flex p-1"
                                          onMouseEnter={(e) => (e.currentTarget.style.color = "#E85D7A")}
                                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                                          title="Delete"
                                        >
                                          <IconTrash />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {bottomSpacer > 0 && (
                                  <tr style={{ height: bottomSpacer }}><td colSpan={dataFields.length + 2} /></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    ) : (
                      /* ── Card grid (paginated) ── */
                      (() => {
                        const totalPages = Math.ceil(submissions.length / CARDS_PER_PAGE);
                        const pageStart = cardPage * CARDS_PER_PAGE;
                        const pageSubmissions = submissions.slice(pageStart, pageStart + CARDS_PER_PAGE);
                        return (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                              {pageSubmissions.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 flex flex-col gap-2.5 transition-colors duration-130"
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)")}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)")}
                                >
                                  {/* Card header */}
                                  <div className="flex justify-between items-start">
                                    <span className="text-[rgba(255,255,255,0.25)] font-mono text-[9px] tracking-[0.08em]">
                                      {formatDate(sub.submittedAt)}
                                    </span>
                                    <button
                                      onClick={() => setConfirmDelete({ message: "Delete this submission?", onConfirm: () => deleteSubmission(sub.id) })}
                                      className="bg-transparent border-none cursor-pointer text-[rgba(255,255,255,0.18)] flex p-0.5"
                                      onMouseEnter={(e) => (e.currentTarget.style.color = "#E85D7A")}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
                                      title="Delete"
                                    >
                                      <IconTrash />
                                    </button>
                                  </div>
                                  {/* Fields */}
                                  <div className="flex flex-col gap-2">
                                    {dataFields.map((f) => (
                                      <div key={f.id}>
                                        <p className="text-[rgba(255,255,255,0.3)] font-mono text-[9px] tracking-[0.08em] mb-0.5">
                                          {f.label.toUpperCase()}
                                        </p>
                                        <p className="text-[#d0d0d0] font-mono text-[12px] leading-normal">
                                          {formatVal(sub.data[f.id])}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  onClick={() => setCardPage((p) => Math.max(0, p - 1))}
                                  disabled={cardPage === 0}
                                  className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[rgba(255,255,255,0.4)] font-mono text-[11px] cursor-pointer disabled:opacity-30 disabled:cursor-default"
                                >
                                  ←
                                </button>
                                <span className="text-[rgba(255,255,255,0.3)] font-mono text-[11px]">
                                  {cardPage + 1} / {totalPages}
                                </span>
                                <button
                                  onClick={() => setCardPage((p) => Math.min(totalPages - 1, p + 1))}
                                  disabled={cardPage >= totalPages - 1}
                                  className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[rgba(255,255,255,0.4)] font-mono text-[11px] cursor-pointer disabled:opacity-30 disabled:cursor-default"
                                >
                                  →
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })()
            ) : (
              /* Preview */
              <div className="max-w-150 mx-auto">
                {previewSubmitted ? (
                  <div className="bg-[rgba(90,173,107,0.06)] border border-[rgba(90,173,107,0.18)] rounded-[14px] p-10 text-center">
                    <p className="text-[36px] mb-3">✓</p>
                    <p className="text-[#5AAD6B] font-mono text-[14px] font-bold mb-1.5">
                      Submitted
                    </p>
                    <p className="text-[rgba(255,255,255,0.3)] font-mono text-[11px] mb-6">
                      Response data:
                    </p>
                    <pre
                      className="bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)] rounded-[9px] p-4.5 text-left text-[#c0c0c0] font-mono text-[11px] overflow-x-auto leading-[1.6]"
                    >
                      {JSON.stringify(
                        Object.fromEntries(
                          template.fields
                            .filter(
                              (f) => !["heading", "paragraph", "divider", "relation"].includes(f.type),
                            )
                            .map((f) => [f.label || f.id, previewValues[f.id] ?? ""]),
                        ),
                        null,
                        2,
                      )}
                    </pre>
                    <button
                      onClick={() => {
                        setPreviewSubmitted(false);
                        setPreviewValues({});
                      }}
                      className="mt-5 py-2 px-4.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#c0c0c0] font-mono text-[11px] cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!template || !activeId) return;
                      const sub: FormSubmission = {
                        id: uid(),
                        templateId: activeId,
                        submittedAt: Date.now(),
                        data: Object.fromEntries(
                          template.fields
                            .filter((f) => !["heading", "paragraph", "divider", "relation"].includes(f.type))
                            .map((f) => [f.id, previewValues[f.id] ?? (f.type === "checkboxes" ? [] : "")]),
                        ),
                      };
                      dbPutSubmission(sub).then(() =>
                        dbGetSubmissions(activeId).then(setSubmissions),
                      );
                      setPreviewSubmitted(true);
                    }}
                  >
                    <div className="mb-7">
                      <h1 className="text-white font-mono text-[22px] font-bold m-0 tracking-[-0.02em]">
                        {template.name}
                      </h1>
                      {template.description && (
                        <p className="text-[rgba(255,255,255,0.4)] font-mono text-[12px] mt-1.5 leading-[1.6]">
                          {template.description}
                        </p>
                      )}
                    </div>

                    {/* Flex-wrap layout respecting widths */}
                    <div className="flex flex-wrap gap-4.5">
                      {template.fields.map((field) => {
                        const isLayout = FIELD_META[field.type].category === "Layout";
                        const flexBasis = isMobile
                          ? "100%"
                          : field.width === "half" && !isLayout
                            ? "calc(50% - 9px)"
                            : field.width === "third" && !isLayout
                              ? "calc(33.3% - 12px)"
                              : "100%";
                        return (
                          <div key={field.id} style={{ flex: `1 0 ${flexBasis}`, minWidth: 0 }}>
                            <PreviewField
                              field={field}
                              value={
                                previewValues[field.id] ??
                                (field.type === "checkboxes" ? [] : "")
                              }
                              onChange={(v) =>
                                setPreviewValues((prev) => ({
                                  ...prev,
                                  [field.id]: v,
                                }))
                              }
                              templates={templates}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {template.fields.filter(
                      (f) => !["heading", "paragraph", "divider", "relation"].includes(f.type),
                    ).length > 0 && (
                      <button
                        type="submit"
                        className="mt-7 py-2.75 px-6.5 bg-[#4D96D9] border-none rounded-[9px] text-white font-mono text-[12px] font-bold cursor-pointer transition-opacity duration-150"
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Submit
                      </button>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Properties panel */}
          {mode === "build" && selectedField && (
            <>
              {isMobile && (
                <div
                  onClick={() => setSelectedFieldId(null)}
                  className="fixed inset-0 z-149 bg-[rgba(0,0,0,0.5)]"
                />
              )}
              <PropertiesPanel
                field={selectedField}
                onChange={updateField}
                onClose={() => setSelectedFieldId(null)}
                templates={templates}
                currentTemplateId={activeId ?? ""}
                isMobile={isMobile}
              />
            </>
          )}
        </div>
      </div>

      {/* Field picker modal */}
      {pickerOpen && (
        <FieldTypePicker onPick={addField} onClose={() => setPickerOpen(false)} />
      )}

      {/* CSV dropzone overlay */}
      {dropzoneOpen && (
        <CsvDropzone
          onFile={handleCSVFile}
          onClose={() => setDropzoneOpen(false)}
          loading={csvLoading}
        />
      )}

      {/* CSV error overlay */}
      {csvError && (
        <div
          onClick={() => setCsvError(null)}
          className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-6 w-80 shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
          >
            <p className="text-[#E85D7A] font-mono text-[13px] font-bold mb-1.5">Upload failed</p>
            <p className="text-[rgba(255,255,255,0.4)] font-mono text-[11px] leading-[1.6] mb-5">{csvError}</p>
            <div className="flex justify-end">
              <button
                autoFocus
                onClick={() => setCsvError(null)}
                className="px-3.5 py-1.75 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[7px] text-[rgba(255,255,255,0.55)] font-mono text-[11px] cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <ConfirmDeleteOverlay
          message={confirmDelete.message}
          onConfirm={() => { confirmDelete.onConfirm(); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
