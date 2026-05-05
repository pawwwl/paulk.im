import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Link,
  Svg,
  Path,
  StyleSheet,
} from "@react-pdf/renderer";
import { TIME_LINE } from "@/lib/data";

// ─── Design tokens ────────────────────────────────────────────────────────────
// ATS rules kept intact:
//   - High-contrast body text on white body
//   - Standard section names: "Skills", "Experience"
//   - Single column, reading order top-to-bottom
//   - No letter-spacing on body text
//   - No text inside images
//
// Dark header is ATS-safe — parsers read text content, not background color.

const DARK = "#0f172a"; // slate-900 header bg
const ACCENT = "#0369a1"; // sky-700
const ACCENT_ON_DARK = "#7dd3fc"; // sky-300 — readable on dark bg
const TEXT = "#0f172a";
const MUTED = "#475569"; // slate-600
const RULE = "#cbd5e1"; // slate-300
const CHIP_BG = "#f0f9ff"; // sky-50
const WHITE = "#ffffff";

const s = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
    color: TEXT,
    fontSize: 10,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: DARK,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 24,
  },
  name: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 3,
    letterSpacing: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  titleText: {
    fontSize: 11,
    color: ACCENT_ON_DARK,
    fontFamily: "Helvetica-Bold",
  },
  titleDot: {
    width: 3,
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  locationText: {
    fontSize: 9,
    color: "#94a3b8", // slate-400
  },
  contactRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  contactItem: {
    fontSize: 9,
    color: "#94a3b8",
  },
  contactLink: {
    fontSize: 9,
    color: "#94a3b8",
    textDecoration: "none",
  },
  contactSep: {
    fontSize: 9,
    color: "#334155", // slate-700
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // ── Section heading ───────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 18,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  summary: {
    fontSize: 9.5,
    color: TEXT,
    lineHeight: 1.7,
  },

  // ── Skills ────────────────────────────────────────────────────────────────
  // skillsGrid: {
  //   flexDirection: "row",
  //   gap: 8,
  // },
  // skillGroup: {
  //   flex: 1,
  //   backgroundColor: "#f8fafc",
  //   paddingHorizontal: 10,
  //   paddingVertical: 8,
  // },
  // skillGroupLabel: {
  //   fontSize: 7,
  //   fontFamily: "Helvetica-Bold",
  //   color: MUTED,
  //   textTransform: "uppercase",
  //   marginBottom: 6,
  // },
  // skillPills: {
  //   flexDirection: "row",
  //   flexWrap: "wrap",
  //   gap: 4,
  // },
  // skillPill: {
  //   fontSize: 8,
  //   color: TEXT,
  //   backgroundColor: WHITE,
  //   borderWidth: 1,
  //   borderColor: RULE,
  //   paddingHorizontal: 6,
  //   paddingVertical: 2,
  // },

  // ── Experience entry ──────────────────────────────────────────────────────
  expItem: {
    marginBottom: 16,
  },
  expTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
  },
  expCompany: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
  },
  expDateRange: {
    fontSize: 8,
    color: MUTED,
    fontFamily: "Helvetica-Oblique",
  },
  expRole: {
    fontSize: 9,
    color: ACCENT,
    marginBottom: 6,
  },
  expDesc: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.6,
  },
  expRule: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginTop: 12,
  },
  toolChip: {
    fontSize: 7.5,
    color: ACCENT,
    backgroundColor: CHIP_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});

// ─── Icons (Material Design, 24×24 viewBox) ──────────────────────────────────

const ICON_GLOBE =
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z";
const ICON_EMAIL =
  "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z";
const ICON_LINKEDIN =
  "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z";

function Icon({
  d,
  size = 9,
  fill = ACCENT,
}: {
  d: string;
  size?: number;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={fill} />
    </Svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BULLETS: Record<string, string[]> = {
  "Catalyst Healthcare": [
    "Built web interfaces for a client-side inventory management system used by pharmacies and healthcare providers.",
    "Developed production features in C#, .NET, and Blazor.",
  ],
  "Fluid Truck": [
    "Built real-time vehicle tracking features for a fleet management platform serving enterprise customers.",
    "Implemented geofencing, telematics, and interactive map visualizations using the Google Maps API.",
    "Developed event tracking and search infrastructure with ElasticSearch to support operational reporting.",
  ],
  "Audubon Companies": [
    "Serving as Tech Lead on cross-functional teams within a large enterprise engineering organization.",
    "Led v2 rewrite of inventory and report management application supporting pipeline field inspectors.",
    "Architected an in-house employee performance and talent assessment tracking platform with robust notification system.",
  ],
  "US Army": [
    "Received Army Achievement Medal for role in Key Resolve joint military operations in Daegu, South Korea.",
    "Awarded Meritorious Service Medal for contributions to unit mission objectives at Lyster Army Health Clinic, Fort Rucker.",
  ],
};

// Build "Mar 2020 – Sep 2022" date ranges from the timeline ordering.
function buildDateRanges() {
  const sorted = [...TIME_LINE].sort(
    (a, b) =>
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  );
  const ranges: Record<string, string> = {};
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].date;
    const end = i < sorted.length - 1 ? sorted[i + 1].date : "Present";
    ranges[sorted[i].name] = `${start} – ${end}`;
  }
  return ranges;
}

// ─── Document ─────────────────────────────────────────────────────────────────

function ResumePDF() {
  const dateRanges = buildDateRanges();
  const experience = TIME_LINE.filter((item) => item.name !== "US Army")
    .slice()
    .sort(
      (a, b) =>
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );
  const past = TIME_LINE.filter((item) => item.name === "US Army");

  return (
    <Document
      title="Paul Kim — Resume"
      author="Paul Kim"
      subject="Software Engineer Resume"
      keywords="software engineer, typescript, react, next.js, remote"
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.name}>Paul Kim</Text>
          <View style={s.titleRow}>
            <Text style={s.titleText}>Software Engineer</Text>
            <View style={s.titleDot} />
            <Text style={s.locationText}>Denver, CO</Text>
          </View>
          <View style={s.contactRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon d={ICON_EMAIL} size={8} fill="#94a3b8" />
              <Link src="mailto:pawl.y.kim@gmail.com" style={s.contactLink}>
                Email
              </Link>
            </View>
            <Text style={s.contactSep}>·</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon d={ICON_LINKEDIN} size={8} fill="#94a3b8" />
              <Link
                src="https://www.linkedin.com/in/paulkim-sojurner/"
                style={s.contactLink}
              >
                LinkedIn
              </Link>
            </View>
            <Text style={s.contactSep}>·</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon d={ICON_GLOBE} size={8} fill="#94a3b8" />
              <Link src="https://pawl.kim" style={s.contactLink}>
                Website
              </Link>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* ── Summary ── */}
          <Text style={s.sectionHeading}>Summary</Text>
          <Text style={s.summary}>
            Software engineer with 8+ years of experience building web and
            mobile applications across healthcare, logistics, and enterprise
            domains. Focused on TypeScript, Next.js, and React on the frontend
            with backend experience in C#/.NET, Node.js, and cloud
            infrastructure on Azure. Seeking remote opportunities where I can
            have strong impact across the stack and collaborate with great
            people.
          </Text>

          {/* ── Skills ── */}
          {/* <Text style={s.sectionHeading}>Skills</Text>
          <View style={s.skillsGrid}>
            {SKILL_GROUPS.map((group) => (
              <View key={group.label} style={s.skillGroup}>
                <Text style={s.skillGroupLabel}>{group.label}</Text>
                <View style={s.skillPills}>
                  {group.items.map((item) => (
                    <Text key={item} style={s.skillPill}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View> */}

          {/* ── Experience ── */}
          <Text style={s.sectionHeading}>Experience +</Text>
          {experience.map((item, i) => (
            <View key={item.name} style={s.expItem}>
              <View style={s.expTopRow}>
                <Text style={s.expCompany}>{item.name}</Text>
                <Text style={s.expDateRange}>{dateRanges[item.name]}</Text>
              </View>
              <Text style={s.expRole}>{item.role}</Text>
              {(BULLETS[item.name] ?? [item.description]).map((bullet, bi) => (
                <View
                  key={bi}
                  style={{ flexDirection: "row", marginBottom: 3 }}
                >
                  <Text
                    style={[s.expDesc, { color: ACCENT, marginRight: 6 }]}
                  >
                    –
                  </Text>
                  <Text style={[s.expDesc, { flex: 1 }]}>{bullet}</Text>
                </View>
              ))}
              {item.tools && item.tools.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 7,
                  }}
                >
                  {item.tools.map((t) => (
                    <Text key={t} style={s.toolChip}>
                      {t}
                    </Text>
                  ))}
                </View>
              )}
              {i < experience.length - 1 && <View style={s.expRule} />}
            </View>
          ))}

          {/* ── Additional Experience ── */}
          <Text style={s.sectionHeading}>Experience ++</Text>
          {past.map((item) => (
            <View key={item.name} style={s.expItem}>
              <View style={s.expTopRow}>
                <Text style={s.expCompany}>{item.name}</Text>
                <Text style={s.expDateRange}>{dateRanges[item.name]}</Text>
              </View>
              <Text style={s.expRole}>{item.role}</Text>
              {BULLETS[item.name].map((bullet, bi) => (
                <View
                  key={bi}
                  style={{ flexDirection: "row", marginBottom: 3 }}
                >
                  <Text
                    style={[s.expDesc, { color: ACCENT, marginRight: 6 }]}
                  >
                    –
                  </Text>
                  <Text style={[s.expDesc, { flex: 1 }]}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const preview = new URL(req.url).searchParams.get("preview") === "1";
  const buffer = await renderToBuffer(<ResumePDF />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": preview
        ? "inline"
        : 'attachment; filename="paul-kim-resume.pdf"',
    },
  });
}
