import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mood, niche, website, imageData, language } = await req.json();
    console.log('Generating content for:', { topic, mood, niche, website, hasImage: !!imageData, language });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageInstruction = language && language !== 'en' 
      ? `- Generate all captions in ${language} language` 
      : '- Generate captions in English';

    const systemPrompt = `You are a creative social media content expert. Generate engaging captions and relevant hashtags for Instagram, Twitter, and other platforms.

When generating:
- Captions should be ${mood} in tone
- Content should be relevant to the ${niche} niche
${website ? `- Include or reference the website: ${website}` : ''}
${imageData ? '- Base the captions on what you see in the image/video provided' : ''}
- Keep captions concise (1-3 sentences)
- Include 8-12 relevant, trending hashtags
- Make hashtags specific and effective for reach
- Generate 5 DIFFERENT caption variations with the same hashtags
${languageInstruction}

Return ONLY a JSON object with this exact structure:
{
  "captions": ["Caption 1 here", "Caption 2 here", "Caption 3 here", "Caption 4 here", "Caption 5 here"],
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", ...]
}`;

    let userPrompt = topic 
      ? `Generate 5 different ${mood} social media captions about: ${topic} (niche: ${niche})`
      : `Generate 5 different ${mood} social media captions for ${niche} niche`;

    if (imageData) {
      userPrompt = `Analyze this image/video and ${userPrompt.toLowerCase()}`;
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { 
            type: 'image_url', 
            image_url: { url: imageData }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated');
    }

    console.log('Generated content:', content);

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      result = JSON.parse(jsonMatch[1]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});