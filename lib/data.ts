export const SKILLS = [
  { label: "Web", type: "domain" },
  { label: "TypeScript", type: "language" },
  { label: "Next.js", type: "framework" },
  { label: "C#", type: "language" },
  { label: "NET", type: "framework" },
  { label: "Mobile", type: "domain" },
  { label: "React Native", type: "framework" },
  { label: "Data", type: "domain" },
  { label: "SQL", type: "language" },
  { label: "Mongo", type: "database" },
  { label: "ElasticSearch", type: "database" },
  { label: "Cloud", type: "domain" },
  { label: "Azure", type: "cloud" },
];

export const TIME_LINE = [
  {
    name: "US Army",
    role: "Combat Medic",
    description:
      "Dropped out of school to enlist and toughen up. Turned out to be some of the hardest and defining years of my life.",
    date: "Feb 2013",
    dateTime: "2013-02",
  },
  {
    name: "Catalyst Healthcare",
    role: "Frontend Developer",
    description:
      "Built inventory management web interface for healthcare providers. Primarily using Blazor and .NET.",
    date: "Mar 2018",
    dateTime: "2018-03",
    tools: ["C#", ".NET", "Blazor", "SQL"],
  },
  {
    name: "Fluid Truck",
    role: "Software Engineer",
    description:
      "Worked on the platform powering fleet managers to track vehicles real-time. Implemented a variety of client-side map features, such as geofencing, telematics, etc. Used tools such as ElasticSearch to build a real-time search engine with dynamic filtering for thousands of vehicles.",
    date: "Mar 2020",
    dateTime: "2020-05",
    tools: ["Next.js", "ElasticSearch", "Google Maps"],
  },
  {
    name: "Audubon Companies",
    role: "Software Engineer",
    description:
      "Tech Lead for inventory and report management project for pipeline inspections. Most difficult component being offline first mobile app with react native. A chance to own a product end-to-end and see the impact first-hand.",
    date: "Sep 2022",
    dateTime: "2022-09",
    tools: ["Next.js", "Mongo", "SQL Server", "Azure", "React Native"],
  },
];
