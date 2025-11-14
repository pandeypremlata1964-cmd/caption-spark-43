import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
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
      razorpay_order_id: z.string().min(1).max(100),
      razorpay_payment_id: z.string().min(1).max(100),
      razorpay_signature: z.string().min(1).max(200),
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

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      tier,
      durationMonths
    } = validationResult.data;

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, tier, userId: user.id });

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const hmac = createHmac("sha256", razorpayKeySecret);
    hmac.update(text);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signature verified successfully');

    // Calculate expiry date
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Fetch order details to get amount
    const { data: orderData } = await supabase
      .from('payment_history')
      .select('amount')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    // Create subscription record
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: tier,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        razorpay_payment_id: razorpay_payment_id,
        razorpay_subscription_id: razorpay_order_id
      });

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      throw insertError;
    }

    // Update payment history to success
    const { error: updateError } = await supabase
      .from('payment_history')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'success'
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating payment history:', updateError);
      // Don't fail if history update fails
    }

    console.log('Subscription created successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
