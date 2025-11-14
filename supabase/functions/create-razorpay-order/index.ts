import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://esm.sh/zod@3.22.4';

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
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define validation schema
    const requestSchema = z.object({
      amount: z.number().int().positive().max(1000000),
      tier: z.enum(['monthly', 'six_months', 'yearly']),
      durationMonths: z.number().int().positive().max(12)
    });

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, tier, durationMonths } = validationResult.data;

    console.log('Creating Razorpay order:', { amount, tier, durationMonths, userId: user.id });

    // Create Razorpay order
    // Receipt must be max 40 chars - using timestamp and first 8 chars of user ID
    const shortUserId = user.id.substring(0, 8);
    const timestamp = Date.now().toString().substring(5); // Use last digits for uniqueness
    const receipt = `ord_${shortUserId}_${timestamp}`;
    
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        user_id: user.id,
        tier: tier,
        duration_months: durationMonths
      }
    };

    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error(`Razorpay API error: ${errorText}`);
    }

    const order = await razorpayResponse.json();
    console.log('Razorpay order created:', order.id);

    // Create payment history record
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: 'INR',
        tier: tier,
        duration_months: durationMonths,
        razorpay_order_id: order.id,
        status: 'pending'
      });

    if (historyError) {
      console.error('Error creating payment history:', historyError);
      // Don't fail the order creation if history fails
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-razorpay-order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
