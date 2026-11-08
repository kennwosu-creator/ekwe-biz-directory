import { GoogleGenAI } from '@google/genai';

export async function parseEkweBusinessesWithLLM(rawSearchResults) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY environment variable.');

  const ai = new GoogleGenAI({ apiKey });

  const textCorpus = rawSearchResults.map(section => {
    return `Query: "${section.query}"\n` + section.organic.map(item => 
      `- Title: ${item.title}\n  Snippet: ${item.snippet}\n  Link: ${item.link}`
    ).join('\n');
  }).join('\n\n---\n\n');

  const prompt = `
You are an expert data extraction assistant specialized in Nigerian local commerce, specifically targeting Ekwe, Isu LGA, Imo State. 
Analyze the following Google search results and extract all distinct local businesses, shops, chemists, provision stores, POS agents, restaurants, or service providers.

For each business found, extract:
1. "name": The official or common name of the business or store.
2. "address": The specific street, market name, or village landmark in Ekwe/Isu LGA.
3. "phone": Any Nigerian phone number found.
4. "category": Choose the closest match from: ['General Goods', 'Pharmacies & Chemists', 'Financial & POS', 'Food & Drink', 'Hardware & Building', 'Services'].
5. "whatsapp_number": Use the phone number if mobile compatible, otherwise null.

Strictly output your response as a valid JSON array of objects with keys: name, address, phone, category, whatsapp_number.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }, { text: textCorpus }] }],
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text);
}