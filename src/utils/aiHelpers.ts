export const getGeminiApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

interface StudentMark {
  roll_no: number;
  marks: number | string;
}

export const parseMarksheetImage = async (base64Image: string, mimeType: string): Promise<StudentMark[]> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in .env");

  const prompt = `
You are an AI assistant that extracts student marks from a marksheet image.
Look at the provided image. It contains a table with roll numbers (or student numbers) and marks/scores.
Extract the data and return ONLY a valid JSON array of objects.
Do not include any markdown formatting, backticks, or extra text.
Each object must have exactly two keys: "roll_no" (a number) and "marks" (a number or string if absent/NA).
Example:
[
  {"roll_no": 1, "marks": 85},
  {"roll_no": 2, "marks": "A"}
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // Remove data URI prefix if present
  const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to process image");
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) throw new Error("Invalid response from AI");

  try {
    return JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Failed to parse AI output as JSON: " + textResponse);
  }
};

export const parseVoiceToMarks = async (voiceTranscript: string): Promise<StudentMark[]> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in .env");

  const prompt = `
You are an AI assistant that converts dictated student marks into structured JSON.
The user dictated the following text containing roll numbers and their marks:
"${voiceTranscript}"

Extract the data and return ONLY a valid JSON array of objects.
Do not include any markdown formatting, backticks, or extra text.
Each object must have exactly two keys: "roll_no" (a number) and "marks" (a number or string if absent/NA).
Example:
[
  {"roll_no": 1, "marks": 85},
  {"roll_no": 2, "marks": "Absent"}
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to process speech text");
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) throw new Error("Invalid response from AI");

  try {
    return JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Failed to parse AI output as JSON: " + textResponse);
  }
};

export const generateBulkRemarks = async (studentsData: {name: string, marks: string}[], maxScore: string): Promise<Record<string, string>> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in .env");

  const prompt = `
You are a helpful teacher writing 1-line personalized encouraging remarks for students based on their test marks.
The maximum score is ${maxScore}.
Here is the JSON list of students and their marks:
${JSON.stringify(studentsData)}

Return ONLY a valid JSON object mapping each student's name to their remark.
Do not include any markdown formatting, backticks, or extra text.
Example:
{
  "Rahul": "Excellent performance, keep it up!",
  "Neha": "Good effort, but needs to focus more on revisions."
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to generate remarks");
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) throw new Error("Invalid response from AI");

  try {
    return JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Failed to parse AI output as JSON: " + textResponse);
  }
};

export const generateHomework = async (topic: string, standard: string, subject: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in .env");
  const prompt = `You are a helpful school teacher. Create a 5-question engaging homework assignment for a Class ${standard} student on the subject of ${subject}. The specific topic is "${topic}". Return ONLY the text of the homework (no markdown backticks, just plain text with newlines for formatting).`;
  return await fetchGeminiText(prompt, apiKey);
};

export const draftPoliteComplaint = async (rawNotes: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing.");
  const prompt = `You are a professional school teacher writing a message to a parent. Rewrite the following rough notes into a polite, constructive, and professional 3-4 sentence message focusing on student improvement. Rough notes: "${rawNotes}". Return ONLY the message text without quotes or formatting.`;
  return await fetchGeminiText(prompt, apiKey);
};

export const draftFormalAnnouncement = async (points: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key is missing.");
  const prompt = `You are a school Principal drafting an official notice. Convert these rough points into a formal, concise, and professional school circular. Points: "${points}". Return ONLY the circular text without markdown backticks.`;
  return await fetchGeminiText(prompt, apiKey);
};

// Internal helper for simple text generation
const fetchGeminiText = async (prompt: string, apiKey: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7 }
  };
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Failed to generate AI content");
  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error("Invalid response from AI");
  return textResponse.trim();
};
