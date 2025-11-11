import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const NY_API_KEY = process.env.NY_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SECTION = 'home';

async function fetchNYTimesTopStories(): Promise<{ titles: string; abstracts: string }> {
    let titles = '';
    let abstracts = '';

    const nyUrl = `https://api.nytimes.com/svc/topstories/v2/${SECTION}.json?api-key=${NY_API_KEY}`;
    const nyResponse = await fetch(nyUrl);

    if (nyResponse.ok) {
        const nyData = (await nyResponse.json()).results || [];
        for (const headlines of nyData.slice(0, 15)) {
            titles += "\n" + (headlines.title || "No Title");
            abstracts += "\n" + (headlines.abstract || "No Abstract");
        }
    } else {
        throw new Error(`NYTimes API Error: ${nyResponse.status}`);
    }

    return { titles, abstracts };
}

async function fetchKeywordsFromOpenAI(combined: string): Promise<string> {
    const data = {
        model: "mistralai/mistral-7b-instruct",
        messages: [
            { role: "system", content: "You are an AI expert in generating concise, meaningful keywords for news articles." },
            { role: "user", content: `
Task:
- Read the article below.
- Generate exactly 8–10 keywords that capture the main topics, entities, and themes.
- Each keyword should be 5 letters long (no exception).
- All keywords must be real, meaningful English words, suitable for use as trend tags.
- Avoid generic words like "news" or "article".
- Return only a comma-separated list, no explanations.

Article:
${combined}
` }
        ]
    };

    const headers = {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const json = await response.json();
    return json.choices[0].message.content;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { titles, abstracts } = await fetchNYTimesTopStories();
        const combined = `Titles:${titles}\n\nAbstracts:${abstracts}`;
        const keywords = await fetchKeywordsFromOpenAI(combined);
        res.status(200).json({ keywords });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
