// api/generate-costume.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
const newId = uuidv4();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const trustedVendors = [
  'Amazon', 'eBay', 'Target', 'Walmart', 'Shein', 'Spirit Halloween',
  'Hot Topic', 'Etsy', 'ThredUp', 'ASOS', 'H&M', 'Aerie', 'Old Navy',
  'Anthropologie', 'Urban Outfitters', 'Everlane', "Levi's", 'SKIMS',
  'Nike', 'Nordstrom', 'Abercrombie & Fitch', 'Poshmark', 'Talbots',
  "Macy's", 'Saks Off 5th', 'Uniqlo', 'J. Crew', 'Madewell', 'Reformation'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, budget, quality } = req.body as { description: string; budget?: number; quality?: 'cheaper' | 'better' | 'normal' };
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key in environment variables');
    }

    // System prompt for costume breakdown
    const systemPrompt = `You are a Halloween costume expert and shopping assistant. 
Generate a costume breakdown with 4-6 items, categorize each as top/bottom/footwear/accessory, provide simple item names, estimated prices, suggested brand, and vendor (from trusted vendors). 
Budget: $${budget || 30}
Quality: ${quality || 'normal'}
Return ONLY JSON with the following structure:
{
  "items": [
    {
      "itemId": "unique-id",
      "category": "top|bottom|footwear|accessory",
      "name": "item name",
      "searchTerm": "search term for shopping",
      "brand": "brand name or Generic",
      "price": numeric price estimate,
      "vendor": "Amazon|Target|Walmart|Old Navy"
    }
  ]
}`;

    // Call OpenAI Chat Completion
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a Halloween costume for: "${description}"` }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || '';
    let costumeData;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      costumeData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiText);
    } catch (parseError) {
      throw new Error('Failed to parse OpenAI response JSON');
    }

    // Add product search URLs
    if (costumeData.items) {
      costumeData.items = costumeData.items.map((item: any) => {
        const vendor = item.vendor || 'Amazon';
        const searchTerm = encodeURIComponent(item.searchTerm || item.name);
        let productLink = '';

        switch (vendor.toLowerCase()) {
          case 'amazon':
            productLink = `https://www.amazon.com/s?k=${searchTerm}`;
            break;
          case 'target':
            productLink = `https://www.target.com/s?searchTerm=${searchTerm}`;
            break;
          case 'walmart':
            productLink = `https://www.walmart.com/search?q=${searchTerm}`;
            break;
          default:
            productLink = `https://www.amazon.com/s?k=${searchTerm}`;
        }

        return {
          ...item,
          itemId: item.itemId || uuidv4(),
          productLink,
          vendorTrusted: trustedVendors.some(v => vendor.toLowerCase().includes(v.toLowerCase())),
        };
      });
    }

    return res.status(200).json(costumeData);

  } catch (error: any) {
    console.error('Error generating costume:', error);
    return res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
}
