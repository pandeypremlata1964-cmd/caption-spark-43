import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's quota
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_user_quota', { user_id_param: user.id });

    if (quotaError) {
      console.error('Error checking quota:', quotaError);
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quota = quotaData?.[0];
    console.log('User quota:', quota);

    if (!quota || quota.remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily limit reached',
          message: `You've used all ${quota?.daily_limit || 3} generations for today. Upgrade to get unlimited access!`,
          upgradeRequired: true
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, mood, niche, website, imageData, language, captionLengths } = await req.json();
    console.log('Generating content for:', { topic, mood, niche, website, hasImage: !!imageData, language });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageInstruction = language && language !== 'en' 
      ? `- Generate all captions in ${language} language` 
      : '- Generate captions in English';

    // Determine which caption types to generate
    const lengths = captionLengths || { short: true, medium: true, long: true };
    const captionTypes = [];
    
    if (lengths.short) {
      captionTypes.push('SHORT (10-30 words, 1 sentence): Example: "Transform your workspace with cutting-edge technology that boosts productivity and creativity."');
    }
    if (lengths.medium) {
      captionTypes.push('MEDIUM (30-60 words, 2-3 sentences): Example: "Discover the future of innovation with our latest tech solutions. We\'re revolutionizing the way businesses operate with smart, efficient tools. Join thousands of satisfied customers today."');
    }
    if (lengths.long) {
      captionTypes.push('LONG (60-100 words, 4-5 sentences): Example: "In today\'s fast-paced digital world, staying ahead of the curve is essential for success. Our comprehensive technology platform empowers businesses to streamline operations, enhance collaboration, and drive meaningful results. With features designed for modern teams, we\'ve created an ecosystem that supports growth at every stage. Whether you\'re a startup or an enterprise, our solutions scale with your needs. Experience the difference that innovative technology can make in your daily workflow."');
    }

    const countShort = lengths.short ? 5 : 0;
    const countMedium = lengths.medium ? 5 : 0;
    const countLong = lengths.long ? 5 : 0;
    const totalCount = countShort + countMedium + countLong;

    const systemPrompt = `You are a creative social media content expert. Generate engaging captions and relevant hashtags for Instagram, Twitter, and other platforms.

CRITICAL: Generate captions in the following lengths:
${captionTypes.join('\n')}

Requirements:
- Tone: ${mood}
- Niche: ${niche}
${website ? `- Include website: ${website}` : ''}
${imageData ? '- Base captions on the image/video content' : ''}
- Generate EXACTLY: ${countShort} short caption(s), ${countMedium} medium caption(s), ${countLong} long caption(s) (in that order)
- Each caption should be UNIQUE and creative with different angles/perspectives
- Include 8-12 relevant, trending hashtags
${languageInstruction}

Return ONLY a JSON object with this exact structure:
{
  "captions": [array of ${totalCount} generated captions in order: all short first, then all medium, then all long],
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

    // Increment usage count
    const { error: usageError } = await supabase
      .from('daily_usage')
      .upsert({
        user_id: user.id,
        usage_date: new Date().toISOString().split('T')[0],
        generation_count: (quota.used_today || 0) + 1
      }, {
        onConflict: 'user_id,usage_date'
      });

    if (usageError) {
      console.error('Error updating usage:', usageError);
    } else {
      console.log('Usage updated successfully');
    }

    return new Response(
      JSON.stringify({
        ...result,
        usage: {
          used: (quota.used_today || 0) + 1,
          limit: quota.daily_limit,
          remaining: quota.remaining - 1
        }
      }),
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