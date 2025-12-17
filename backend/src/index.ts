import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";

const app = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
});

app.use(cors());
app.use(express.json());

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resume", href: "/resume" },
  { label: "Interview", href: "/interview" },
  { label: "Profile", href: "/profile" },
];

const highlights = {
  atsScore: 82,
  mockSessions: 128,
  successRate: 96,
  offersTracked: 47,
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

type ResumeAnalysis = {
  atsScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  keywords?: string[];
  skills?: string[]; // Legacy
  techSkills?: string[]; // New
  softSkills?: string[]; // New
  projects?: { name: string; tech: string; description: string; impact: string }[];
  workExperience?: { role: string; company: string; duration: string; description: string }[]; // New
  leadership?: { role: string; organization: string; duration: string; description: string }[]; // New
  education?: { degree: string; school: string; year: string }[]; // New
  impactMetrics?: string[];
  domain?: string;
  bulletPoints?: string[];
  rewritten?: string;
  comparisonNote?: string;
  rawText?: string;
};

type JobDescriptionAnalysis = {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  roleFocus: string;
  seniorityLevel: string;
  hiddenSignals: string[];
};

type MatchAnalysis = {
  score: number; // 0-100
  missingSkills: string[];
  strongMatches: string[];
  gapAnalysis: string; // Detailed explanation of gaps
  recommendation: string; // "Apply", "Tailor First", "Skip"
  reasoning: string; // Why this score?
};

type InterviewQuestion = {
  type: string; // "Behavioral", "Technical", "System Design", "Curveball"
  question: string;
  expectedAnswer: string; // Key points to look for
  hints: string;
};

type ResumeRewrite = {
  rewritten?: string;
  bulletPoints?: string[];
  keywords?: string[];
  skills?: string[];
  rewrittenFull?: string;
};

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const mime = file.mimetype.toLowerCase();
  const name = file.originalname.toLowerCase();

  try {
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      const parsed = await pdfParse(file.buffer);
      if (parsed.text?.trim()) return parsed.text;
    }
    if (mime.includes("word") || name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      if (result.value?.trim()) return result.value;
    }
    const asText = file.buffer.toString("utf8");
    return asText || "No readable text extracted. Please provide a text-friendly file.";
  } catch (err) {
    console.error("Extraction failed", err);
    return "Extraction failed; content may be unreadable. Please provide a text-friendly file.";
  }
}

async function analyzeWithGemini(file: Express.Multer.File, rawText: string): Promise<ResumeAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = `
You are a FAANG hiring manager and expert resume strategist. Analyze this resume (file attached; text provided) and respond in strict JSON.
Focus on extracting quantifiable impact, separating hard/soft skills, and structuring project data.
JSON Schema:
{
  "atsScore": number 0-100,
  "strengths": [string],
  "weaknesses": [string],
  "techSkills": [string], // Languages, Frameworks, Tools
  "softSkills": [string], // Leadership, Communication, etc.
  "keywords": [string], // High-value keywords found
  "projects": [{ "name": string, "tech": string, "description": string, "impact": string }],
  "workExperience": [{ "role": string, "company": string, "duration": string, "description": string }],
  "leadership": [{ "role": string, "organization": string, "duration": string, "description": string }],
  "education": [{ "degree": string, "school": string, "year": string }],
  "impactMetrics": [string], // "Reduced latency by 50%", "Managed $2M budget"
  "domain": string, // "Backend", "Frontend", "Full Stack", "ML", "DevOps", etc.
  "bulletPoints": [string], // Top 3 strongest bullet points found
  "rewritten": string, // A short, powerful professional summary (3-4 lines)
  "comparisonNote": string // 1-sentence assessment of candidate level (Entry/Senior/Staff)
}
Be precise. Identify metrics even if hidden in text.`;

  const base64 = file.buffer.toString("base64");
  const trimmed = rawText.length > 8000 ? rawText.slice(0, 8000) : rawText;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: file.mimetype || "application/octet-stream",
              data: base64,
            },
          },
          { text: `RESUME_TEXT:\n${trimmed}` },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error("No Gemini response content");
  }

  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini response", err, cleaned);
    const maybeJson = extractJson(cleaned);
    if (maybeJson) {
      return JSON.parse(maybeJson);
    }
    throw new Error("Gemini response was not valid JSON");
  }
}

async function analyzeJobDescription(text: string): Promise<JobDescriptionAnalysis> {
  const prompt = `
  You are an expert technical recruiter. Analyze this Job Description and extract critical hiring signals.
  Respond in strict JSON:
  {
    "title": string, // Job Title
    "company": string, // Company Name (if inferred, else "Unknown")
    "requiredSkills": [string], // Must-have technical skills
    "preferredSkills": [string], // Nice-to-have skills
    "roleFocus": string, // Primary focus: "Backend", "AI/ML", "Frontend", "System Design", "Product"
    "seniorityLevel": string, // "Junior", "Senior", "Staff", "Principal"
    "hiddenSignals": [string] // Cultural/Operational signals e.g. "Fast-paced", "Ownership", "On-call", "Legacy code"
  }
  Avoid markdown.`;

  const body = {
    contents: [{ parts: [{ text: prompt }, { text: `JOB_DESCRIPTION:\n${text}` }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini JD analysis failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error("No Gemini response content");

  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JD analysis", err);
    throw new Error("Invalid JSON from Gemini for JD");
  }
}

async function analyzeMatchWithGemini(resume: any, jd: any): Promise<MatchAnalysis> {
  const prompt = `
  You are a FAANG Hiring Manager. Evaluate this candidate against the job description.
  Perform a deep semantic match (not just keywords).
  
  Resume: ${JSON.stringify(resume)}
  Job Description: ${JSON.stringify(jd)}
  
  Respond in strict JSON:
  {
    "score": number, // 0-100 (Be strict. 80+ is a strong hire signal)
    "missingSkills": [string], // Critical missing hard/soft skills
    "strongMatches": [string], // Skills the candidate clearly has
    "gapAnalysis": string, // Explanation of 2-3 sentences on what is missing
    "recommendation": string, // "Apply Now", "Tailor Resume", "Not a Fit"
    "reasoning": string // Summary of why this score was given
  }
  Avoid markdown.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini match analysis failed: ${res.status}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error("No Gemini response content for match");

  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse match analysis", err);
    throw new Error("Invalid JSON from Gemini for Match");
  }
}


async function generateNextQuestionWithGemini(
  resumeContext: any,
  jdContext: any,
  history: any[],
  currentType: string,
  suggestedDifficulty?: string
): Promise<{ question: string; type: string; difficulty: string; hints: string; isDeepDive: boolean }> {

  const prompt = `
  You are a FAANG Interview Bar Raiser. Conduct an adaptive interview.
  
  CRITICAL INSTRUCTION: If the candidate's resume mentions specific metrics, achievements, or impact:
  - Ask DEEP-DIVE follow-up questions that probe the details
  - Examples: "You mentioned improving performance by 40% — how exactly did you measure that?"
  - "What was the baseline before your optimization?"
  - "Walk me through the technical approach that led to that result."
  
  Step 1: Analyze the Conversation History.
  ${history.length === 0 ? "This is the START of the interview. Start with a strong behavioral or resume-based deep dive question." : `History: ${JSON.stringify(history)}`}

  Step 2: Generate the NEXT Question.
  Current Focus: ${currentType}
  Suggested Difficulty: ${suggestedDifficulty || "MEDIUM"}
  
  Candidate Resume Projects: ${JSON.stringify(resumeContext.projects || [])}
  Candidate Resume Metrics: ${JSON.stringify(resumeContext.impactMetrics || [])}
  Candidate Work Experience: ${JSON.stringify(resumeContext.workExperience || [])}
  Target Job: ${JSON.stringify(jdContext)}

  Goal:
  - If previous answers were weak or vague, drill down with follow-ups or simplify.
  - If previous answers were strong, increase difficulty or move to next topic.
  - If the resume has quantifiable achievements, probe them with "how" and "why" questions.
  - Adjust difficulty based on suggested level: ${suggestedDifficulty || "MEDIUM"}
  
  Respond in strict JSON:
  {
    "question": string,
    "type": string, // "Behavioral", "Technical", "System Design", "Resume Deep-Dive"
    "difficulty": string, // "Easy", "Medium", "Hard"
    "hints": string,
    "isDeepDive": boolean // true if this question probes a specific resume claim
  }
  Avoid markdown.
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini question generation failed: ${res.status}`);

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No Gemini response for question");

  const cleaned = stripCodeFences(text);
  return JSON.parse(cleaned);
}

async function evaluateAnswerWithGemini(
  question: string,
  answer: string,
  type: string
): Promise<{ score: number; feedback: string; improvements: string; redFlags: string[] }> {

  const prompt = `
  You are a FAANG Interview Bar Raiser. Evaluate this answer.
  
  Question (${type}): "${question}"
  Candidate Answer: "${answer}"
  
  Criteria:
  1. Clarity & Structure (STAR method for behavioral?)
  2. Technical Accuracy
  3. Depth of Knowledge
  
  Respond in strict JSON:
  {
    "score": number, // 0-100
    "feedback": string, // Constructive feedback (2-3 sentences)
    "improvements": string, // "Better way to say this: ..."
    "redFlags": [string] // Any warning signs (e.g. "Blame", "Vague")
  }
  Avoid markdown.
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini evaluation failed: ${res.status}`);

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No Gemini response for evaluation");

  const cleaned = stripCodeFences(text);
  return JSON.parse(cleaned);
}

async function analyzeSTARCompleteness(
  question: string,
  answer: string
): Promise<{
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  missingComponents: string[];
  starScore: number;
  rewriteSuggestion: string;
}> {

  const prompt = `
  You are a FAANG behavioral interview coach. Analyze this answer using the STAR framework.
  
  Question: "${question}"
  Answer: "${answer}"
  
  Evaluate whether the answer contains each STAR component:
  
  1. SITUATION: Does it describe the context/background? (Who, what, when, where)
  2. TASK: Does it explain the challenge/goal/responsibility?
  3. ACTION: Does it detail the specific actions the candidate took? (Use of "I" not "we")
  4. RESULT: Does it quantify the outcome/impact? (Metrics, numbers, improvements)
  
  Respond in strict JSON:
  {
    "hasSituation": boolean,
    "hasTask": boolean,
    "hasAction": boolean,
    "hasResult": boolean,
    "missingComponents": [string], // e.g. ["Result", "Situation"]
    "starScore": number, // 0-100 based on completeness (25 points per component)
    "rewriteSuggestion": string // A STAR-compliant version of the answer (2-3 sentences)
  }
  
  Be strict. If a component is vague or implied but not explicit, mark it as missing.
  Avoid markdown.
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini STAR analysis failed: ${res.status}`);

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No Gemini response for STAR analysis");

  const cleaned = stripCodeFences(text);
  return JSON.parse(cleaned);
}



function stripCodeFences(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function rewriteWithGemini(resumeData: any, jdContext?: any): Promise<ResumeRewrite> {
  const isStructured = resumeData.workExperience || resumeData.projects;

  let prompt = `
  You are a resume rewriting assistant. Rewrite the resume content to be concise, ATS-friendly, and quantified where possible.
  Respond in strict JSON with:
  {
    "rewritten": string,        // A concise top summary/profile rewrite
    "bulletPoints": [string],   // Optimized bullet points (general)
    "keywords": [string],       // High-impact keywords
    "skills": [string],         // Extracted skills
    "rewrittenFull": string     // Full text rewrite
  }
  Avoid markdown.`;

  if (isStructured) {
    prompt = `
    You are a FAANG Resume Strategist. Rewrite each section of the candidate's resume to handle a "Same-Line Side-by-Side" comparison.
    
    CRITICAL INSTRUCTION:
    1. Maintain the EXACT SAME number of items (projects/jobs) as the input.
    2. Maintain the EXACT SAME number of bullet points per item if possible, but make them stronger (Action + Impact + Metric).
    3. If there is a Job Description, tailor evrey single bullet to that JD.

    Input Data:
    ${JSON.stringify({
      workExperience: resumeData.workExperience,
      projects: resumeData.projects,
      leadership: resumeData.leadership
    })}

    Respond in strict JSON:
    {
      "rewritten": string, // Professional Summary
      "workExperience": [{ "role": string, "company": string, "duration": string, "description": "Keep mostly same", "bullets": [string] }],
      "projects": [{ "name": string, "tech": string, "description": string, "bullets": [string] }],
      "leadership": [{ "role": string, "organization": string, "bullets": [string] }]
    }
    Avoid markdown.
    `;
  }

  if (jdContext) {
    prompt += `
    
    TARGET JOB DESCRIPTION:
    ${JSON.stringify(jdContext)}
    
    Tailoring Instructions:
    1. Inject keywords from the JD into the bullet points.
    2. Rephrase "weak" verbs to "strong" verbs matching the JD's level (e.g. "Helped" -> "Architected").
    `;
  }

  const parts = [
    { text: prompt },
    { text: `RESUME_CONTENT:\n${JSON.stringify(resumeData)}` },
  ];

  const body = {
    contents: [{ parts }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini rewrite failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error("No Gemini rewrite response content");
  }

  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini rewrite response", err, cleaned);
    const maybeJson = extractJson(cleaned);
    if (maybeJson) {
      return JSON.parse(maybeJson);
    }
    throw new Error("Gemini rewrite response was not valid JSON");
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Retry on 503 (Service Unavailable) or 429 (Too Many Requests)
      if (res.status === 503 || res.status === 429) {
        if (i < retries - 1) {
          const waitTime = backoff * Math.pow(2, i);
          console.log(`Gemini API ${res.status}. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }
      return res;
    } catch (error) {
      if (i < retries - 1) {
        const waitTime = backoff * Math.pow(2, i);
        console.log(`Fetch failed. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`, error);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({ message: "API running" });
});

app.get("/api/navigation", (_req, res) => {
  res.json({ links: navigation });
});

app.get("/api/highlights", (_req, res) => {
  res.json(highlights);
});

app.post("/api/resume/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const rawText = await extractTextFromFile(req.file);
    const analysis = await analyzeWithGemini(req.file, rawText);

    const saved = await prisma.resume.create({
      data: {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        rawText,
        atsScore: analysis.atsScore ?? null,
        strengths: analysis.strengths ?? [],
        weaknesses: analysis.weaknesses ?? [],
        keywords: analysis.keywords ?? [],
        skills: analysis.techSkills ?? analysis.skills ?? [], // Fallback
        techSkills: analysis.techSkills ?? [],
        softSkills: analysis.softSkills ?? [],
        projects: analysis.projects ?? [],
        workExperience: analysis.workExperience ?? [],
        leadership: analysis.leadership ?? [],
        education: analysis.education ?? [],
        impactMetrics: analysis.impactMetrics ?? [],
        domain: analysis.domain ?? null,
        bulletPoints: analysis.bulletPoints ?? [],
        rewritten: analysis.rewritten ?? null,
        comparisonNote: analysis.comparisonNote ?? null,
      },
    });

    res.json(saved);
  } catch (error: any) {
    console.error("Resume analysis failed", error);
    res.status(500).json({
      error: "Failed to analyze resume",
      detail: error?.message ?? "Unknown error",
    });
  }
});

app.post("/api/resume/rewrite", async (req, res) => {
  try {
    const { resumeId, text, jobDescriptionId } = req.body ?? {};
    let rawText = text as string | undefined;

    if (!rawText && resumeId) {
      const found = await prisma.resume.findUnique({
        where: { id: resumeId },
      });
      // Pass the whole found object if available, otherwise just text
      if (found) {
        // @ts-ignore
        rawText = found;
      }
    }

    if (!rawText) {
      return res.status(400).json({ error: "No text available for rewrite" });
    }

    let jdContext = undefined;
    if (jobDescriptionId) {
      const jd = await prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });
      if (jd) {
        jdContext = {
          title: jd.title,
          required: jd.requiredSkills,
          roleFocus: jd.roleFocus,
          text: jd.rawText.slice(0, 3000),
        };
      }
    }

    // @ts-ignore
    const rewrite = await rewriteWithGemini(rawText, jdContext);

    if (resumeId) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          rewritten: rewrite.rewrittenFull ?? rewrite.rewritten ?? null,
          bulletPoints: rewrite.bulletPoints ?? [],
          keywords: rewrite.keywords ?? [],
          skills: rewrite.skills ?? [],
          // We can optionally store the structured rewrite here if we added fields for it, 
          // but for now we just return it to frontend. 
          // Ideally we should add 'rewrittenWorkExperience' etc to valid schema to save it.
        },
      });
    }

    res.json({ ...rewrite, targeted: !!jdContext });
  } catch (error: any) {
    console.error("Resume rewrite failed", error);
    res.status(500).json({
      error: "Failed to rewrite resume",
      detail: error?.message ?? "Unknown error",
    });
  }
});

app.get("/api/db/health", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ status: "ok", provider: "mongodb" });
  } catch (error) {
    console.error("Database healthcheck failed:", error);
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

app.post("/api/users/sync", async (req, res) => {
  const { email, name, image } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name ?? existing?.name,
        image: image ?? existing?.image,
      },
      create: {
        email,
        name: name ?? null,
        image: image ?? null,
      },
    });
    res.json({
      status: existing ? "updated" : "created",
      user: { id: user.id, email: user.email, name: user.name, image: user.image },
    });
  } catch (error) {
    console.error("Failed to sync user", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

app.post("/api/job/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Job description text is required" });

    const analysis = await analyzeJobDescription(text);

    const saved = await prisma.jobDescription.create({
      data: {
        title: analysis.title,
        company: analysis.company,
        rawText: text,
        requiredSkills: analysis.requiredSkills,
        preferredSkills: analysis.preferredSkills,
        roleFocus: analysis.roleFocus,
        seniorityLevel: analysis.seniorityLevel,
        hiddenSignals: analysis.hiddenSignals,
      },
    });

    res.json(saved);
  } catch (error: any) {
    console.error("JD Analysis failed", error);
    res.status(500).json({ error: "Failed to analyze job description", detail: error.message });
  }
});

app.post("/api/job/match", async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body;
    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({ error: "resumeId and jobDescriptionId are required" });
    }

    // Check availability
    const existingMatch = await prisma.match.findFirst({
      where: { resumeId, jobDescriptionId },
    });
    if (existingMatch) {
      return res.json(existingMatch);
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    const jd = await prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });

    if (!resume || !jd) {
      return res.status(404).json({ error: "Resume or Job Description not found" });
    }

    // Prepare context for AI (Lightweight version to save tokens if needed, but passing full for now)
    const resumeContext = {
      skills: resume.techSkills.concat(resume.softSkills),
      projects: resume.projects,
      experience: resume.bulletPoints,
    };

    const jdContext = {
      title: jd.title,
      required: jd.requiredSkills,
      roleFocus: jd.roleFocus,
      signals: jd.hiddenSignals,
      text: jd.rawText.slice(0, 5000), // Truncate huge JDs
    };

    const analysis = await analyzeMatchWithGemini(resumeContext, jdContext);

    const saved = await prisma.match.create({
      data: {
        resumeId,
        jobDescriptionId,
        score: analysis.score,
        analysis: analysis as any, // Json type
      },
    });

    res.json(saved);
  } catch (error: any) {
    console.error("Match Analysis failed", error);
    res.status(500).json({ error: "Failed to calculate match", detail: error.message });
  }
});


app.post("/api/interview/init", async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, type = "SCREENING", difficulty = "MEDIUM" } = req.body;

    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({ error: "resumeId and jobDescriptionId are required" });
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    const jd = await prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });

    if (!resume || !jd) {
      return res.status(404).json({ error: "Resume or Job Description not found" });
    }

    // Create the session
    const session = await prisma.interviewSession.create({
      data: {
        resumeId,
        jobDescriptionId,
        company: jd.company,
        role: jd.title,
        type,
        difficulty,
        status: "IN_PROGRESS",
        startTime: new Date(),
        exchanges: [] // Start empty
      }
    });

    res.json(session);
  } catch (error: any) {
    console.error("Interview Init failed", error);
    res.status(500).json({ error: "Failed to initialize interview", detail: error.message });
  }
});

app.post("/api/interview/next", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Optimize Context Loading
    const resume = await prisma.resume.findUnique({ where: { id: session.resumeId } });
    const jd = await prisma.jobDescription.findUnique({ where: { id: session.jobDescriptionId } });

    if (!resume || !jd) return res.status(404).json({ error: "Context data missing" });

    // Check for completion (e.g., 5 rounds)
    const MAX_ROUNDS = 5;
    const currentRound = (session.exchanges as any[]).length;

    if (currentRound >= MAX_ROUNDS) {
      return res.json({ isComplete: true, message: "Interview Concluded" });
    }

    // NEW: Calculate difficulty based on performance
    const scores = (session.exchanges as any[]).map((ex: any) => ex.score || 0);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b) / scores.length : 50;

    let suggestedDifficulty = "MEDIUM";
    if (avgScore >= 80) suggestedDifficulty = "HARD";
    else if (avgScore < 50) suggestedDifficulty = "EASY";

    // Enhanced resume context with more details
    const resumeContext = {
      skills: resume.techSkills,
      projects: resume.projects,
      experience: resume.workExperience,
      impactMetrics: resume.impactMetrics,
      workExperience: resume.workExperience
    };

    const jdContext = {
      role: jd.title,
      focus: jd.roleFocus,
      level: jd.seniorityLevel,
      required: jd.requiredSkills
    };

    const nextQ = await generateNextQuestionWithGemini(
      resumeContext,
      jdContext,
      session.exchanges as any[], // Past history
      session.type, // SCREENING, etc.
      suggestedDifficulty // NEW: Pass calculated difficulty
    );

    res.json({ ...nextQ, currentRound: currentRound + 1, totalRounds: MAX_ROUNDS });


  } catch (error: any) {
    console.error("Next Question failed", error);
    res.status(500).json({ error: "Failed to generate next question", detail: error.message });
  }
});

app.post("/api/interview/submit", async (req, res) => {
  try {
    const { sessionId, question, answer, type } = req.body;
    if (!sessionId || !question || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Evaluate with AI
    const evaluation = await evaluateAnswerWithGemini(question, answer, type || "General");

    // 2. NEW: STAR Analysis for Behavioral Questions
    let starAnalysis = null;
    if (type === "Behavioral" || type === "Resume Deep-Dive") {
      try {
        starAnalysis = await analyzeSTARCompleteness(question, answer);
      } catch (err) {
        console.error("STAR analysis failed", err);
        // Continue without STAR analysis if it fails
      }
    }

    // 3. Update Session History
    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const newExchange = {
      question,
      answer,
      type,
      feedback: evaluation.feedback,
      score: evaluation.score,
      improvements: evaluation.improvements,
      redFlags: evaluation.redFlags,
      starAnalysis, // NEW: Include STAR analysis
      timestamp: new Date().toISOString()
    };

    const updatedExchanges = [...(session.exchanges as any[]), newExchange];

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        exchanges: updatedExchanges
      }
    });

    res.json({ ...evaluation, starAnalysis }); // Return STAR analysis to frontend

  } catch (error: any) {
    console.error("Answer Submission failed", error);
    res.status(500).json({ error: "Failed to submit answer", detail: error.message });
  }
});

app.post("/api/interview/results", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Generate Report
    const report = await generateInterviewReportWithGemini(session.exchanges as any[], session.type);

    // Save Results
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        overallScore: report.overallScore,
        feedbackSummary: report.summary,
        endTime: new Date()
      }
    });

    // Optionally update InterviewProfile stats here (Steps 1, 9 of Blueprint)
    // For now, just return the report
    res.json(report);

  } catch (error: any) {
    console.error("Result Generation failed", error);
    res.status(500).json({ error: "Failed to generate results", detail: error.message });
  }
});


async function generateCoverLetterWithGemini(resumeContext: any, jdContext: any): Promise<{ coverLetter: string }> {
  const prompt = `
  You are an expert career coach. Write a compelling, FAANG-level cover letter for this candidate targeting this specific job.
  
  Candidate Profile:
  ${JSON.stringify(resumeContext)}

  Target Job:
  ${JSON.stringify(jdContext)}

  Tone: Professional, confident, and enthusiastic.
  Format: Markdown.
  Structure:
  1. Header (Placeholder info)
  2. Hook (Aligning passion/domain with company mission)
  3. The "Why Me" (Connecting 2-3 specific resume achievements to job requirements)
  4. The "Why You" (Showing understanding of company culture/product)
  5. Call to Action.

  Respond in strict JSON:
  {
    "coverLetter": string // The full markdown content
  }
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini cover letter failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error("No Gemini response content for cover letter");

  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse cover letter", err);
    throw new Error("Invalid JSON from Gemini for Cover Letter");
  }
}

app.post("/api/cover-letter/generate", async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: "resumeId is required" });
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    let jdContext = null;
    if (jobDescriptionId) {
      const jd = await prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });
      if (jd) jdContext = { title: jd.title, company: jd.company, text: jd.rawText.slice(0, 3000) };
    }

    const resumeContext = {
      name: resume.filename, // Using filename as proxy for name if not parsed
      skills: resume.techSkills.concat(resume.softSkills),
      highlights: resume.impactMetrics,
      experience: resume.bulletPoints.slice(0, 5),
    };

    const result = await generateCoverLetterWithGemini(resumeContext, jdContext || { title: "Software Engineer", company: "Hiring Team" });

    // We don't necessarily need to store cover letters in DB yet, returning directly.
    res.json(result);

  } catch (error: any) {
    console.error("Cover Letter Generation failed", error);
    res.status(500).json({ error: "Failed to generate cover letter", detail: error.message });
  }
});

const shutDown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

app.listen(port, () => {
  // Log to help local debugging
  console.log(`Server listening on port ${port}`);
});

app.get("/api/profile", async (req, res) => {
  try {
    // Demo/MVP Mode: Get the first user or default one
    let user = await prisma.user.findFirst();

    // If no user exists, create a demo one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@interviewexpert.ai",
          name: "Demo Candidate",
          image: "https://github.com/shadcn.png"
        }
      });
    }

    // Get or Create InterviewProfile
    let profile = await prisma.interviewProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      profile = await prisma.interviewProfile.create({
        data: { userId: user.id }
      });
    }

    res.json({ user, profile });
  } catch (error: any) {
    console.error("Get Profile failed", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const { targetRole, targetCompany } = req.body;

    // Demo/MVP Mode: Get the first user
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: "No user found" });

    const updated = await prisma.interviewProfile.update({
      where: { userId: user.id },
      data: {
        targetRole,
        targetCompany
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Update Profile failed", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

async function generateInterviewReportWithGemini(
  history: any[],
  type: string
): Promise<{
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  readinessLevel: string; // "Ready", "Needs Practice", "Not Ready"
  heatmap: { topic: string; score: number }[]
}> {

  const prompt = `
  You are a FAANG Hiring Committee. Generate a Final Interview Report.
  
  Interview Type: ${type}
  Conversation History:
  ${JSON.stringify(history)}
  
  Goal: Assess if this candidate is ready for a real FAANG interview.
  
  Respond in strict JSON:
  {
    "overallScore": number, // 0-100
    "summary": string, // Executive summary of performance
    "strengths": [string],
    "weaknesses": [string],
    "readinessLevel": string, // "High", "Medium", "Low"
    "heatmap": [ // Breakdown by topic
        { "topic": "Communication", "score": number },
        { "topic": "Technical Depth", "score": number },
        { "topic": "Problem Solving", "score": number }
    ]
  }
  Avoid markdown.
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
  };

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini report generation failed: ${res.status}`);

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No Gemini response for report");

  const cleaned = stripCodeFences(text);
  return JSON.parse(cleaned);
}
