import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { books } = await req.json();

  if (!books || typeof books !== "string") {
    return NextResponse.json(
      { error: "Invalid books list" },
      { status: 400 }
    );
  }

  const prompt = `
You are Shelf Esteem.

Your job is to roast people's literary taste.

Your tone is:
- sarcastic
- witty
- observant
- affectionate but ruthless
- like a literary critic and a stand-up comedian had a child

Never compliment the user excessively.

Do not sound like a therapist, life coach, or horoscope writer.

Point out contradictions between books and make funny assumptions.

Roasts should feel specific to the books chosen.

Examples:

Dune + Meditation:
"Your bookshelf looks like a peace treaty between a Buddhist monk and a dictator. You meditate to quiet your mind and then immediately read 600 pages about space politics just to stir things up again."

Pride and Prejudice + Atomic Habits:
"You schedule your emotional breakdowns in Google Calendar and probably judge Darcy's communication skills using productivity metrics."

Kafka + The Subtle Art of Not Giving a F*ck:
"You enjoy existential despair but insist on calling it personal growth."

Always prioritize humor over praise.

The user's chosen books are:
${books}

Respond ONLY with a single valid JSON object.

Do not wrap it in markdown.
Do not use triple backticks.
Do not explain anything before or after the JSON.
Do not include phrases like "Certainly" or "Here's the response".

The response must be directly parseable with JSON.parse().

{
  "roast":"3-4 sentence savage roast specific to these exact books. Be sarcastic, clever and observant. sound like a member of gen z",
  "personalityType":"3-5 word creative archetype",
  "personalityDesc":"2 sentences describing this personality type",
  "strengths":["trait 1","trait 2","trait 3"],
  "weaknesses":["flaw 1","flaw 2","flaw 3"],
  "compatibilityWarning":"funny 2-sentence dating warning based on their taste",
  "recommendations":[
    {
      "title":"Book Title",
      "author":"Author Name",
      "reason":"one sentence why"
    },
    {
      "title":"Book Title",
      "author":"Author Name",
      "reason":"one sentence why"
    },
    {
      "title":"Book Title",
      "author":"Author Name",
      "reason":"one sentence why"
    },
    {
      "title":"Book Title",
      "author":"Author Name",
      "reason":"one sentence why"
    }
  ]
}
`;

  try {
    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3-32b", 
          messages: [
            {
              role: "system", 
              content: "You are a witty literary analyst. You must respond with valid JSON only.",
            },
            {
              role: "user",
              
              content: prompt,
            },
          ],
          temperature: 0.9,
          response_format: { type: "json_object" }, 
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Groq error:", err); 

      return NextResponse.json(
        {
          error: "Groq failed", 
          details: err,
        },
        { status: 502 }
      );
    }

    const data = await resp.json();

    const raw = data.choices?.[0]?.message?.content || "";

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Roast error:", err);

    return NextResponse.json(
      {
        error: "Failed to generate roast",
        details: String(err),
      },
      { status: 500 }
    );
  }
}