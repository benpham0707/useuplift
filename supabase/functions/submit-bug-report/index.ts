import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BugReportPayload {
  title: string
  description: string
  category?: string
  severity?: string
  pageUrl?: string
  browserInfo?: string
  screenSize?: string
  creditsAffected?: number
  userEmail?: string
}

const ADMIN_EMAIL = 'benpham0707@berkeley.edu'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

async function sendEmail(bugReport: BugReportPayload & { userId?: string, reportId: string, createdAt: string }) {
  if (!RESEND_API_KEY) {
    console.log('No RESEND_API_KEY configured, skipping email notification')
    return { success: false, error: 'Email service not configured' }
  }

  const severityColors: Record<string, string> = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  }

  const severityColor = severityColors[bugReport.severity || 'medium'] || '#eab308'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { font-size: 14px; color: #1f2937; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .description { white-space: pre-wrap; }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { flex: 1; min-width: 150px; }
    .credits-alert { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 8px; margin-top: 16px; }
    .credits-alert strong { color: #92400e; }
    .footer { background: #1f2937; color: #9ca3af; padding: 16px 20px; border-radius: 0 0 12px 12px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐛 New Bug Report</h1>
      <span class="badge" style="background: ${severityColor}; color: white; margin-top: 12px;">
        ${bugReport.severity?.toUpperCase() || 'MEDIUM'} SEVERITY
      </span>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Title</div>
        <div class="field-value" style="font-weight: 600; font-size: 16px;">${bugReport.title}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Description</div>
        <div class="field-value description">${bugReport.description}</div>
      </div>
      
      <div class="meta">
        <div class="meta-item">
          <div class="field">
            <div class="field-label">Category</div>
            <div class="field-value">${bugReport.category || 'General'}</div>
          </div>
        </div>
        <div class="meta-item">
          <div class="field">
            <div class="field-label">Reporter Email</div>
            <div class="field-value">${bugReport.userEmail || 'Not provided'}</div>
          </div>
        </div>
      </div>
      
      <div class="field">
        <div class="field-label">Page URL</div>
        <div class="field-value" style="word-break: break-all;">${bugReport.pageUrl || 'Not provided'}</div>
      </div>
      
      <div class="meta">
        <div class="meta-item">
          <div class="field">
            <div class="field-label">Browser</div>
            <div class="field-value">${bugReport.browserInfo || 'Unknown'}</div>
          </div>
        </div>
        <div class="meta-item">
          <div class="field">
            <div class="field-label">Screen Size</div>
            <div class="field-value">${bugReport.screenSize || 'Unknown'}</div>
          </div>
        </div>
      </div>
      
      ${bugReport.creditsAffected ? `
      <div class="credits-alert">
        <strong>⚠️ Credit Compensation May Be Needed</strong>
        <p style="margin: 8px 0 0 0;">User reports approximately <strong>${bugReport.creditsAffected} credits</strong> may have been affected.</p>
      </div>
      ` : ''}
      
      <div class="field" style="margin-top: 20px;">
        <div class="field-label">Report ID</div>
        <div class="field-value" style="font-family: monospace; font-size: 12px;">${bugReport.reportId}</div>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">Report submitted on ${new Date(bugReport.createdAt).toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p style="margin: 8px 0 0 0;">User ID: ${bugReport.userId || 'Anonymous'}</p>
    </div>
  </div>
</body>
</html>
`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Uplift Bug Reports <bugs@updates.uplift-edu.com>',
        to: [ADMIN_EMAIL],
        subject: `[${bugReport.severity?.toUpperCase() || 'MEDIUM'}] Bug Report: ${bugReport.title}`,
        html: htmlContent,
        reply_to: bugReport.userEmail || undefined,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend API error:', errorText)
      return { success: false, error: errorText }
    }

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    // Get auth header if present (for authenticated users)
    const authHeader = req.headers.get('Authorization')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    })

    // Try to get user info if authenticated
    let userId: string | undefined
    let userEmail: string | undefined
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email
      }
    }

    const body = await req.json() as BugReportPayload

    // Validate required fields
    if (!body.title || !body.description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided email or fall back to authenticated user's email
    const reporterEmail = body.userEmail || userEmail

    // Insert bug report into database
    const { data: bugReport, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: userId,
        user_email: reporterEmail,
        title: body.title,
        description: body.description,
        category: body.category || 'general',
        severity: body.severity || 'medium',
        page_url: body.pageUrl,
        browser_info: body.browserInfo,
        screen_size: body.screenSize,
        credits_affected: body.creditsAffected,
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save bug report', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email notification
    const emailResult = await sendEmail({
      ...body,
      userEmail: reporterEmail,
      userId,
      reportId: bugReport.id,
      createdAt: bugReport.created_at,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId: bugReport.id,
        emailSent: emailResult.success,
        message: 'Bug report submitted successfully! Thank you for helping us improve.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('submit-bug-report error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

