import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query too short" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    const url =
      `https://www.googleapis.com/books/v1/volumes` +
      `?q=intitle:${encodeURIComponent(q)}&printType=books&orderBy=relevance` +
      `&maxResults=12` +
      `&fields=items(id,volumeInfo(title,authors,imageLinks,publishedDate))` +
      `${apiKey ? `&key=${apiKey}` : ""}`;

    const resp = await fetch(url);

    if (!resp.ok) {
      console.error(await resp.text());
      throw new Error("Google Books failed");
    }
    const data = await resp.json();

    if (data.items) {
      const qLower = q.toLowerCase();
      data.items.sort((a: any, b: any) => {
        const aTitle = a.volumeInfo.title?.toLowerCase() || "";
        const bTitle = b.volumeInfo.title?.toLowerCase() || "";

        if (aTitle === qLower) return -1;
        if (bTitle === qLower) return 1;

        if (aTitle.startsWith(qLower)) return -1;
        if (bTitle.startsWith(qLower)) return 1;

        return 0;
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Books API error:", err);

    return NextResponse.json(
      {
        error: "Search failed",
        details: String(err),
      },
      { status: 500 }
    );
  }
}