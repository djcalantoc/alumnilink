import type {
  LandingBatch,
  LandingMemoryPreview,
  LandingSchool,
} from "@/features/landing/lib/queries";

/** Placeholder campuses when DB has no public schools or fetch fails — links go to register. */
export const MOCK_LANDING_SCHOOLS: LandingSchool[] = [
  {
    id: "mock-school-1",
    name: "River Valley High",
    slug: "",
    primary_color: "#4f46e5",
    cover_photo_url:
      "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=800&q=70",
    visibility: "public",
  },
  {
    id: "mock-school-2",
    name: "St. Mark’s Academy",
    slug: "",
    primary_color: "#0d9488",
    cover_photo_url:
      "https://images.unsplash.com/photo-1580582932707-520aed937d7f?auto=format&fit=crop&w=800&q=70",
    visibility: "public",
  },
  {
    id: "mock-school-3",
    name: "Metro Science HS",
    slug: "",
    primary_color: "#c026d3",
    cover_photo_url:
      "https://images.unsplash.com/photo-1498243691581-b145c3f16c76?auto=format&fit=crop&w=800&q=70",
    visibility: "public",
  },
];

const MOCK_IMG_PROM =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=70";
const MOCK_IMG_FOUNDATION =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=70";
const MOCK_IMG_GRAD =
  "https://images.unsplash.com/photo-1627556704290-2b1e5857a1e1?auto=format&fit=crop&w=600&q=70";

/** Sample wall tiles when no public memories yet. */
export const MOCK_LANDING_MEMORIES: LandingMemoryPreview[] = [
  {
    id: "mock-mem-1",
    body: "JS Prom 2016 😂",
    media_urls: [MOCK_IMG_PROM],
    schools: { name: "River Valley High", slug: "" },
  },
  {
    id: "mock-mem-2",
    body: "Foundation Day throwback",
    media_urls: [MOCK_IMG_FOUNDATION],
    schools: { name: "St. Mark’s Academy", slug: "" },
  },
  {
    id: "mock-mem-3",
    body: "Graduation Day 🎓",
    media_urls: [MOCK_IMG_GRAD],
    schools: { name: "Metro Science HS", slug: "" },
  },
  {
    id: "mock-mem-4",
    body: "Basketball intrams — we still talk about this game",
    media_urls: [MOCK_IMG_PROM],
    schools: null,
  },
  {
    id: "mock-mem-5",
    body: "Choir practice in the old music room",
    media_urls: [MOCK_IMG_FOUNDATION],
    schools: { name: "River Valley High", slug: "" },
  },
  {
    id: "mock-mem-6",
    body: "Last day of senior year ☀️",
    media_urls: [MOCK_IMG_GRAD],
    schools: { name: "St. Mark’s Academy", slug: "" },
  },
];

/** Demo batches for mock campuses (landing picker). */
export const MOCK_LANDING_BATCHES: LandingBatch[] = [
  {
    id: "mock-batch-rv-2016",
    name: "STEM",
    graduation_year: 2016,
    school_id: "mock-school-1",
  },
  {
    id: "mock-batch-rv-2015",
    name: "General",
    graduation_year: 2015,
    school_id: "mock-school-1",
  },
  {
    id: "mock-batch-sm-2014",
    name: "Class of 2014",
    graduation_year: 2014,
    school_id: "mock-school-2",
  },
  {
    id: "mock-batch-ms-2017",
    name: "Class of 2017",
    graduation_year: 2017,
    school_id: "mock-school-3",
  },
];

export function isMockSchool(s: LandingSchool): boolean {
  return s.id.startsWith("mock-school-");
}

export function isMockMemory(m: LandingMemoryPreview): boolean {
  return m.id.startsWith("mock-mem-");
}
