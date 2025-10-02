import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const trustedVendors = [
  'Amazon', 'eBay', 'Target', 'Walmart', 'Shein', 'Spirit Halloween', 
  'Hot Topic', 'Etsy', 'ThredUp', 'ASOS', 'H&M', 'Aerie', 'Old Navy',
  'Anthropologie', 'Urban Outfitters', 'Everlane', 'Levi\'s', 'SKIMS',
  'Nike', 'Nordstrom', 'Abercrombie & Fitch', 'Poshmark', 'Talbots',
  'Macy\'s', 'Saks Off 5th', 'Uniqlo', 'J. Crew', 'Madewell', 'Reformation'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, budget, quality } = await req.json();
    console.log('Generating costume for:', { description, budget, quality });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a Halloween costume expert and shopping assistant. Generate a complete costume breakdown with realistic shopping items.

For each costume request:
1. Break down the costume into 4-6 individual clothing items/accessories
2. Each item should include: category, name, estimated price, and a realistic vendor
3. Prioritize items from these trusted vendors: ${trustedVendors.join(', ')}
4. If you must suggest an item from outside trusted vendors, mark it as untrusted
5. Keep total cost within the budget
6. ${quality === 'cheaper' ? 'Focus on budget-friendly options' : quality === 'better' ? 'Focus on higher quality items' : 'Balance cost and quality'}

Return ONLY a valid JSON object with this structure:
{
  "items": [
    {
      "itemId": "unique-id",
      "category": "type of item (e.g., shirt, pants, hat, shoes, accessory)",
      "name": "descriptive item name",
      "brand": "brand name or 'Generic'",
      "price": numeric price,
      "vendor": "vendor name",
      "vendorTrusted": boolean,
      "productLink": "realistic product URL",
      "imageUrl": "https://placehold.co/400x400/1a0f2e/ff6b35?text=Item+Image"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Generate a Halloween costume for: "${description}"\nBudget: $${budget}\n\nProvide complete costume breakdown.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('AI Response:', generatedText);

    // Parse the JSON response
    let costumeData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        costumeData = JSON.parse(jsonMatch[0]);
      } else {
        costumeData = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse costume data');
    }

    // Validate and ensure all items are marked correctly
    if (costumeData.items) {
      costumeData.items = costumeData.items.map((item: any) => ({
        ...item,
        vendorTrusted: trustedVendors.some(v => 
          item.vendor.toLowerCase().includes(v.toLowerCase())
        ),
      }));
    }

    return new Response(JSON.stringify(costumeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-costume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
