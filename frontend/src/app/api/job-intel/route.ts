import { NextResponse } from "next/server";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type JobIntelRequest = {
  jobDescription?: string;
  resumeText?: string;
};

type ParsedIntel = {
  summary?: string;
  jobData?: Record<string, string>;
  requirements?: string[];
  techStack?: string[];
  exampleResume?: string;
  resumeSuggestions?: string[];
  tailoredBullets?: string[];
  gaps?: string[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing Gemini API key." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as JobIntelRequest;
  const jobDescription = body.jobDescription?.trim();
  const resumeText = body.resumeText?.trim();

  if (!jobDescription) {
    return NextResponse.json(
      { error: "Job description is required." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(jobDescription, resumeText);

  try {
    const response = await fetch(`${MODEL_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          topK: 32,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: "Gemini request failed", detail },
        { status: 500 }
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text =
      data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "")?.join("\n") ||
      "";

    const parsed = parseJsonSafe(text);

    return NextResponse.json(parsed as ParsedIntel, { status: 200 });
  } catch (error) {
    console.error("Gemini error", error);
    return NextResponse.json(
      { error: "Failed to reach Gemini" },
      { status: 500 }
    );
  }
}

function buildPrompt(jobDescription: string, resumeText?: string) {
  return `You are an interview and ATS expert. Given a job description and optionally a candidate resume, return concise JSON only.

Job Description:
"""
${jobDescription}
"""
${resumeText ? `Candidate Resume:\n"""\n${resumeText}\n"""` : ""}

Return JSON with keys:
- summary: one-sentence overview of the role.
- jobData: object with title, company, location, level, employmentType, compensation, team/stack if present.
- requirements: array of the 5-8 most critical requirements.
- techStack: array of tools, languages, frameworks, clouds.
- exampleResume: a tailored resume snippet (concise sections with bullets) that fits this role.
- resumeSuggestions: (only if resume provided) 5-8 targeted changes the candidate should make for this job.
- tailoredBullets: (only if resume provided) 3-6 bullet rewrites aligned to the JD.
- gaps: (only if resume provided) 3-6 gaps or missing proof points.

Respond with JSON only, no markdown, no extra commentary.`;
}

function parseJsonSafe(text: string): ParsedIntel {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const sliced = text.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(sliced);
    }
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini JSON", err, text);
    return {};
  }
}
