import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTIONS = `You are Persona AI, a capable, friendly, clear, and thoughtful general-purpose AI assistant. Answer the user's actual request across topics such as learning, writing, programming, technology, planning, brainstorming, and everyday questions. Be useful and direct, adapt the level of detail to the request, and use Markdown when it improves readability. If a request is unclear, ask one concise clarifying question; otherwise make reasonable assumptions and proceed. Do not pretend to know facts you are unsure of. Be transparent about uncertainty and correct mistakes openly. Follow appropriate safety boundaries; do not claim you can do actions outside this chat. The user may write in any language, so reply in the language they use unless asked otherwise.`;

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Persona AI needs a Gemini API key. Add GEMINI_API_KEY in your hosting provider's environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Send a message to start chatting." }, { status: 400 });
    }
    if (messages.length > 24) {
      return NextResponse.json({ error: "This conversation is too long. Start a new chat to continue." }, { status: 400 });
    }

    const contents = [];
    for (const message of messages) {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") continue;
      const content = message.content.trim();
      if (!content || content.length > 6000) {
        return NextResponse.json({ error: "Messages must be between 1 and 6,000 characters." }, { status: 400 });
      }
      contents.push({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: content }] });
    }
    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return NextResponse.json({ error: "Your latest message could not be read. Please try again." }, { status: 400 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          contents,
          generationConfig: { maxOutputTokens: 1400, temperature: 0.7 },
        }),
        cache: "no-store",
      }
    );

    const data = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const message = data?.error?.message || "The AI service could not complete that request.";
      return NextResponse.json({ error: message }, { status: apiResponse.status === 429 ? 429 : 502 });
    }

    const answer = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts.map((part) => typeof part.text === "string" ? part.text : "").join("\n").trim()
      : "";
    if (!answer) {
      return NextResponse.json({ error: "Persona AI returned an empty answer. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Persona AI chat error:", error?.message || error);
    return NextResponse.json({ error: "Something went wrong. Please try again in a moment." }, { status: 500 });
  }
}
