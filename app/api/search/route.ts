import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    // Return featured items when query is empty
    const { data } = await supabase
      .from("search_items")
      .select("id, type, title, description, url")
      .in("type", ["page", "demo"])
      .order("type")
      .limit(8);

    return NextResponse.json(data ?? []);
  }

  if (q.length < 2) {
    // Prefix match on title for very short queries
    const { data } = await supabase
      .from("search_items")
      .select("id, type, title, description, url")
      .ilike("title", `${q}%`)
      .limit(8);

    return NextResponse.json(data ?? []);
  }

  // Full-text search for longer queries
  const { data: ftsData } = await supabase
    .from("search_items")
    .select("id, type, title, description, url")
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .limit(8);

  if (ftsData && ftsData.length > 0) {
    return NextResponse.json(ftsData);
  }

  // Fallback: fuzzy ilike if FTS returns nothing
  const { data: likeData } = await supabase
    .from("search_items")
    .select("id, type, title, description, url")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(8);

  return NextResponse.json(likeData ?? []);
}
