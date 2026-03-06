// ============================================================
// ENSEMBLE — LIVE AI INTEGRATION v4
// Three autonomous agents: L&D Nudges, Onboarding Sequence, Skills Pipeline
// Calls Vercel proxy — no API key in this file
// ============================================================

// ── PROXY URL ────────────────────────────────────────────────
const PROXY_URL = 'https://ensemble-proxy.vercel.app/api/chat';

// ── QUERY BAR CONTEXT ────────────────────────────────────────
const ENSEMBLE_CONTEXT = `
You are the Ensemble AI, an intelligence layer built into Netflix's internal workforce analytics platform.
You have access to the following live workforce data for Q1 2026:

WORKFORCE SNAPSHOT:
- Total headcount: 12,847 across 4 segments
- Corporate (FTE): 4,210 — Product & Eng 1,820 | Finance & Legal 890 | Marketing 760 | People & Culture 740
- Studio & Content (FTE): 3,890 — Scripted 1,540 | Post-Production 980 | Unscripted 720 | Animation 650
- Union Crew (SAG/IATSE/WGA/DGA): 2,640 — SAG-AFTRA 1,240 | WGA 620 | IATSE 380 | DGA 400
- Freelance & Project-based: 2,107 — Camera & Lighting 820 | Sound & Music 490 | Editing & Post 430 | Writers & Directors 367

FLIGHT RISK (30-day model):
- Total flagged: 284 employees (+18 vs last cycle)
- Jordan Kim, Sr. Post-Production Supervisor — 87% risk. No L&D activity in 9 months. Comp 11% below band. Last review 14 months ago.
- Marcus Webb, Lead VFX Artist — 79% risk. Comp 14% below band midpoint. Vancouver office.
- Priya Nair, Product Manager II — 64% risk. 2 internal transfer applications, no movement in 6 months. Tenure 2.8 yrs.
- Lena Torres, DP/Cinematographer (Freelance) — 58% risk. Contract gap of 6+ weeks.
- Dev Sharma, ML Engineer, Recommendations — 52% risk. LinkedIn activity spike detected. Tenure 1.9 yrs.
- Amara Osei, Showrunner — 48% risk. No internal mobility pitch in 11 months. Tenure 4.2 yrs.
- Kenji Watanabe, IATSE Gaffer — 44% risk. CBA rate dispute open.

SKILLS GAPS (next production slate):
- Unreal Engine 5: 81% gap (critical)
- AI/ML Production workflows: 72% gap (critical)
- Post-Production AI tooling: 65% gap (critical)
- Virtual Production: 58% gap (high)
- SAG Compliance literacy: 50% gap (medium)
- Localization QA: 44% gap (medium)

UNION CONTRACT STATUS:
- WGA Drama Block: 14 writers — expires in 12 days (URGENT)
- SAG Reality Talent Pool: 8 talent — expires in 31 days
- IATSE Local 695 crew renewal: 22 crew — expires in 45 days
- DGA: Expiring soon (status: renegotiating)

L&D PARTICIPATION: 61% overall (+4pts QoQ). Studio segment lowest at 52%.
OPEN CRITICAL REQS: 43 roles blocking production — new hire wave incoming, onboarding effectiveness and 90-day retention at risk.

Be concise, data-driven, and actionable. Reference specific names and numbers from the data above.
Speak like a senior People Analytics advisor to an executive audience. No markdown headers.
Always respond as a structured bulleted list. Use "•" as the bullet character followed by a line break for each point. 3-5 bullets max. Each bullet one sentence, specific, and data-driven. Never write paragraphs.
`;

// ── AGENT INSIGHT CONTEXT ────────────────────────────────────
const AGENT_CONTEXT = `
You are the Ensemble Intelligence Agent for Netflix's workforce platform, designed specifically for HRBPs.
Generate exactly 3 prioritized workforce insights based on this Q1 2026 data.

WORKFORCE DATA:
- 12,847 total headcount across Corporate (4,210), Studio (3,890), Union (2,640), Freelance (2,107)
- 284 employees flagged as flight risk (+18 vs last cycle)
- Top risks: Jordan Kim (87%, post-prod, comp 11% below band, last review 14 months ago), Marcus Webb (79%, VFX, comp 14% below band), Priya Nair (64%, PM, 2 blocked internal transfers)
- Skills gaps: Unreal Engine 5 (81% — critical), AI/ML Production (72% — critical), Post-Production AI (65% — critical), Virtual Production (58% — high)
- Studio L&D participation at 52% — lowest of all segments
- 43 open critical reqs blocking production — new hire wave incoming, 90-day retention at risk
- Jordan Kim's last performance review was 14 months ago — manager effectiveness signal

RULES:
- Do NOT generate insights about union contract negotiations or CBA renewals — owned by Labor Relations.
- Focus only on topics HRBPs own: retention, L&D engagement, skills development, internal mobility, onboarding risk.
- Always include exactly one insight about skills gap severity and one about new hire ramp risk.
- Set interventionType to "ld" for the flight risk / L&D insight, "skills" for the skills gap insight, "onboarding" for the new hire ramp insight.

Respond ONLY with a valid JSON array. No preamble, no markdown fences, no explanation.
[
  {
    "priority": "CRITICAL|HIGH|MEDIUM",
    "title": "short title",
    "badge": "CRITICAL|HIGH|MEDIUM|OPPORTUNITY",
    "finding": "2-3 sentence finding with specific data points",
    "interventionType": "ld|skills|onboarding",
    "actions": [
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"},
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"}
    ]
  }
]
`;

// ── L&D NUDGES CONTEXT ───────────────────────────────────────
const LD_INTERVENTION_CONTEXT = `
You are the Ensemble AI running an autonomous L&D nudge program for Netflix's workforce platform.

EMPLOYEES WITH NO L&D ACTIVITY IN 90+ DAYS:
1. Jordan Kim, Sr. Post-Production Supervisor — Studio. No L&D in 9 months. Flight risk 87%. Los Angeles.
2. Marcus Webb, Lead VFX Artist — Studio. No L&D in 9 months. Flight risk 79%. Vancouver.
3. Amara Osei, Showrunner — Studio. No L&D in 11 months. Flight risk 48%. New York.
4. Kenji Watanabe, IATSE Gaffer — Union. CBA constraints apply. Flight risk 44%. Los Angeles.
5. Lena Torres, DP/Cinematographer — Freelance. No L&D in contract gap period. Flight risk 58%. New York.
6. Dev Sharma, ML Engineer — Corporate. No formal L&D enrollment. Flight risk 52%. Los Gatos.
7. Priya Nair, Product Manager II — Corporate. No L&D activity. Flight risk 64%. Los Gatos.

RULES:
- Union employees (Kenji Watanabe): status "skipped" — CBA restrictions prohibit direct outreach during renegotiation.
- Flight risk above 75%: status "flagged" for manager review.
- All others: status "sent".
- Freelance employees get a "preferred vendor program" outreach.

For each employee generate a short warm personalized nudge email (3-4 sentences) that references their role, recommends 1 program from: Virtual Production Certification, AI/ML Product Immersion, Executive Producer Track, Harvard Business Online, MasterClass for Business, Netflix Creator Fund. Sign off from "People Analytics and L&D Team, Netflix".

Respond ONLY with a valid JSON array. No preamble, no markdown fences.
[
  {
    "name": "Employee Name",
    "role": "Their Role",
    "segment": "corporate|studio|freelance|union",
    "status": "sent|skipped|flagged",
    "skipReason": "reason if skipped, else null",
    "flagReason": "reason if flagged, else null",
    "subject": "Email subject line",
    "body": "Full email body (plain text)"
  }
]
`;

// ── SKILLS PIPELINE CONTEXT ──────────────────────────────────
const SKILLS_PIPELINE_CONTEXT = `
You are the Ensemble AI mobilizing an internal skills pipeline for Netflix's workforce platform.

CRITICAL SKILLS GAPS:
1. Unreal Engine 5 — 81% gap. Affects VFX, Animation, Virtual Production teams. Critical for next slate.
2. AI/ML Production workflows — 72% gap. Affects Product & Eng, Post-Production. Critical.
3. Post-Production AI tooling — 65% gap. Affects Post-Production, Studio Operations. Critical.
4. Virtual Production — 58% gap. Affects Studio & Content broadly. High priority.

EMPLOYEES WITH ADJACENT SKILLS (internal pipeline candidates):
1. Marcus Webb, Lead VFX Artist — Strong 3D background, adjacent to Unreal Engine 5. Studio segment.
2. Dev Sharma, ML Engineer — Strong ML foundation, adjacent to AI/ML Production workflows. Corporate segment.
3. Jordan Kim, Sr. Post-Production Supervisor — Deep post-prod experience, adjacent to Post-Production AI tooling. Studio segment.
4. Priya Nair, Product Manager II — Product and data background, adjacent to AI/ML Production workflows. Corporate segment.
5. Amara Osei, Showrunner — Broad production experience, adjacent to Virtual Production. Studio segment.
6. Lena Torres, DP/Cinematographer — Camera and production background, adjacent to Virtual Production. Freelance segment.

EXTERNAL GAPS (no strong internal candidates):
- Unreal Engine 5 has only 1 adjacent internal candidate (Marcus Webb) — flag for external sourcing.
- Localization QA (44% gap) — no internal pipeline identified — flag for external sourcing.

RULES:
- Employees already flagged as high flight risk (Jordan Kim 87%, Marcus Webb 79%): status "flagged" — upskilling investment requires retention plan first.
- Freelance employees (Lena Torres): status "flagged" — confirm contract renewal before enrolling.
- External gaps: create a separate "sourcing alert" entry with name "External Sourcing Required", role being the skill gap, status "flagged".
- All others: status "sent".

For each candidate generate a short personalized upskilling invitation (3-4 sentences) that references their current role and adjacent strength, names the specific skills program, and expresses genuine excitement about their growth potential. Sign off from "People Analytics and L&D Team, Netflix".

Respond ONLY with a valid JSON array. No preamble, no markdown fences.
[
  {
    "name": "Employee Name or External Sourcing Required",
    "role": "Their Role or Skill Gap Name",
    "segment": "corporate|studio|freelance|union|external",
    "status": "sent|flagged",
    "flagReason": "reason if flagged, else null",
    "subject": "Email subject line or Alert subject",
    "body": "Full email body or sourcing alert description (plain text)"
  }
]
`;

// ── ONBOARDING SEQUENCE CONTEXT ──────────────────────────────
const ONBOARDING_CONTEXT = `
You are the Ensemble AI running an autonomous onboarding sequence for Netflix's workforce platform.

OPEN CRITICAL REQS BY DEPARTMENT (43 total blocking production):
1. Post-Production — 8 reqs. Supervisor-level and above. High complexity ramp. Manager: Sarah Chen.
2. VFX & Animation — 7 reqs. Specialized technical roles. Vancouver and LA. Manager: Derek Okafor.
3. Product & Engineering — 6 reqs. ML and platform roles. Los Gatos. Manager: Raj Patel.
4. Studio Operations — 5 reqs. Cross-functional coordination roles. Manager: Lisa Moreno.
5. Scripted Content — 5 reqs. Writers and development roles. New York. Manager: James Whitfield.
6. Marketing — 4 reqs. Brand and growth roles. Manager: Anya Kowalski.
7. People & Culture — 4 reqs. HRBP and L&D roles. Manager: Diane Foster.
8. Unscripted & Animation — 4 reqs. Production coordinator roles. Manager: Carlos Reyes.

ONBOARDING RISK FLAGS:
- Post-Production and VFX have no documented 90-day onboarding plan on file — flag.
- Product & Engineering new hires historically take 60+ days to first meaningful contribution — flag.
- People & Culture reqs are HRBP roles — flag for People Analytics review before onboarding plan is finalized.

RULES:
- Departments with no onboarding plan on file or historical ramp risk: status "flagged".
- People & Culture: status "flagged" with People Analytics review note.
- All others: status "sent". No skips for onboarding outreach.

For each department generate a short personalized onboarding sequence kickoff message (3-4 sentences) to the hiring manager referencing their open reqs, highlighting 1 key onboarding risk or opportunity, and asking them to confirm their 30-60-90 day plan. Sign off from "People Analytics and L&D Team, Netflix".

Respond ONLY with a valid JSON array. No preamble, no markdown fences.
[
  {
    "name": "Manager Name",
    "role": "Their Role",
    "department": "Department name",
    "openReqs": number,
    "status": "sent|flagged",
    "flagReason": "reason if flagged, else null",
    "subject": "Email subject line",
    "body": "Full message body (plain text)"
  }
]
`;

// ── STREAMING HELPER ─────────────────────────────────────────
async function streamClaude(prompt, systemPrompt, onChunk, onDone, onError) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            onChunk(parsed.delta.text);
          }
        } catch {}
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

// ── NON-STREAMING HELPER ─────────────────────────────────────
async function callClaude(prompt, systemPrompt) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}

// ── AI QUERY BAR ─────────────────────────────────────────────
window.runQuery = async function() {
  const input = document.getElementById('aiInput');
  const btn = document.getElementById('aiBtn');
  const responseEl = document.getElementById('aiResponse');
  const responseText = document.getElementById('aiResponseText');
  const query = input.value.trim();
  if (!query) return;
  btn.disabled = true;
  btn.textContent = 'Thinking...';
  responseEl.classList.add('visible');
  responseText.innerHTML = '<div class="dot-pulse"><span></span><span></span><span></span></div>';
  let fullText = '';
  let started = false;
  await streamClaude(
    query, ENSEMBLE_CONTEXT,
    (chunk) => {
      if (!started) { responseText.innerHTML = ''; started = true; }
      fullText += chunk;
      responseText.innerHTML = fullText.split('•').filter(s => s.trim()).map(s =>
        `<div style="display:flex;gap:8px;margin-bottom:6px"><span style="color:var(--red);flex-shrink:0">•</span><span>${s.trim()}</span></div>`
      ).join('');
    },
    () => { btn.disabled = false; btn.textContent = 'Ask →'; },
    (err) => {
      responseText.textContent = 'Unable to reach the AI service. Please try again.';
      btn.disabled = false; btn.textContent = 'Ask →';
      console.error(err);
    }
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('aiInput');
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.runQuery(); });
});

// ── INTELLIGENCE AGENT PAGE ──────────────────────────────────
window.renderAgentPage = async function() {
  const content = document.getElementById('agent-content');
  if (!content) return;
  content.innerHTML = `
    <div class="agent-hero">
      <div class="agent-hero-label"><div class="agent-pulse"></div> Ensemble Intelligence Agent</div>
      <div class="agent-hero-title">Proactive Workforce Intelligence</div>
      <div class="agent-hero-sub">AI-generated insights from your live Q1 2026 workforce data. Prioritized by impact and urgency.</div>
      <div class="agent-meta">
        <div class="agent-meta-item">⬡ <span>Claude Sonnet</span></div>
        <div class="agent-meta-item">◎ <span>12,847 employees analyzed</span></div>
        <div class="agent-meta-item">△ <span>Q1 2026 · Live data</span></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase">Priority Insights</div>
      <button class="agent-refresh-btn" onclick="renderAgentPage()">↺ Regenerate</button>
    </div>
    <div id="agent-insights-container"></div>
    <div id="agent-audit-container"></div>
  `;

  const container = document.getElementById('agent-insights-container');
  container.innerHTML = `
    <div class="agent-loading-screen">
      <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">Analyzing workforce data</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">Running pattern detection across all 4 segments...</div>
      <div class="agent-loading-steps">
        <div class="agent-step active" id="step-1"><span class="agent-step-icon">◎</span> Scanning flight risk signals</div>
        <div class="agent-step" id="step-2"><span class="agent-step-icon">◇</span> Evaluating skills gap severity</div>
        <div class="agent-step" id="step-3"><span class="agent-step-icon">△</span> Checking onboarding risk</div>
        <div class="agent-step" id="step-4"><span class="agent-step-icon">⬡</span> Generating prioritized recommendations</div>
      </div>
    </div>
  `;

  const stepDelays = [0, 600, 1200, 1800];
  stepDelays.forEach((delay, i) => {
    setTimeout(() => {
      document.querySelectorAll('.agent-step').forEach(s => s.classList.remove('active'));
      const step = document.getElementById(`step-${i + 1}`);
      if (step) {
        step.classList.add('active', 'done');
        for (let j = 0; j < i; j++) {
          const prev = document.getElementById(`step-${j + 1}`);
          if (prev) { prev.classList.add('done'); prev.querySelector('.agent-step-icon').textContent = '✓'; }
        }
      }
    }, delay);
  });

  let rawJson = '';
  await streamClaude(
    'Generate the 3 prioritized workforce insights now.',
    AGENT_CONTEXT,
    (chunk) => { rawJson += chunk; },
    () => {
      try {
        const insights = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
        renderInsightCards(container, insights);
      } catch (e) {
        container.innerHTML = `<div class="agent-loading-screen"><div style="color:var(--red)">Could not parse insights. Please regenerate.</div></div>`;
        console.error('Parse error:', e, rawJson);
      }
    },
    (err) => {
      container.innerHTML = `<div class="agent-loading-screen"><div style="color:var(--red)">Unable to reach AI service. Please try again.</div></div>`;
      console.error(err);
    }
  );
};

// ── INSIGHT CARD RENDERER ────────────────────────────────────
function renderInsightCards(container, insights) {
  const priorityNum = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
  const priorityClass = { 'CRITICAL': 'priority-critical', 'HIGH': 'priority-high', 'MEDIUM': 'priority-medium' };
  const badgeClass = { 'CRITICAL': 'badge-critical', 'HIGH': 'badge-high', 'MEDIUM': 'badge-medium', 'OPPORTUNITY': 'badge-opportunity' };

  const actionBtns = {
    ld: {
      label: '⬡ Send L&D Nudges',
      fn: 'runLDNudges',
      sub: 'Agent will identify eligible employees and send personalized learning nudges — autonomously.'
    },
    skills: {
      label: '⬡ Mobilize Skills Pipeline',
      fn: 'runSkillsPipeline',
      sub: 'Agent will match internal candidates to skill gaps, flag external sourcing needs, and send invitations.'
    },
    onboarding: {
      label: '⬡ Activate Onboarding Sequence',
      fn: 'runOnboardingSequence',
      sub: 'Agent will contact hiring managers, flag missing onboarding plans, and kick off 30-60-90 sequences.'
    }
  };

  container.innerHTML = insights.map((insight, idx) => {
    const btn = actionBtns[insight.interventionType];
    const actionHtml = btn ? `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <button onclick="${btn.fn}(this)"
          style="display:flex;align-items:center;gap:8px;background:var(--red);border:none;border-radius:5px;padding:9px 18px;color:white;font-size:12px;font-weight:600;cursor:pointer;"
          onmouseover="this.style.background='#c0070f'" onmouseout="this.style.background='var(--red)'">
          ${btn.label}
        </button>
        <div style="font-size:10px;color:var(--text-muted);margin-top:6px;font-family:'DM Mono',monospace;">${btn.sub}</div>
      </div>` : '';

    return `
      <div class="insight-card" style="animation:fadeIn 0.4s ${idx * 0.12}s ease both;opacity:0">
        <div class="insight-card-header" onclick="toggleInsight(${idx})">
          <div class="insight-card-header-left">
            <div class="insight-priority ${priorityClass[insight.priority] || 'priority-medium'}">${priorityNum[insight.priority] || idx + 1}</div>
            <div class="insight-card-title">${insight.title}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="insight-card-badge ${badgeClass[insight.badge] || 'badge-medium'}">${insight.badge}</span>
            <span class="insight-chevron" id="chevron-${idx}">▾</span>
          </div>
        </div>
        <div class="insight-card-body open" id="insight-body-${idx}">
          <div class="insight-finding">${insight.finding}</div>
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);font-family:'DM Mono',monospace;margin-bottom:10px;font-weight:600">Recommended Actions</div>
          <div class="insight-actions">
            ${(insight.actions || []).map((action, ai) => `
              <div class="insight-action-item">
                <div class="insight-action-num">${ai + 1}</div>
                <div class="insight-action-text">${action.text}<div class="insight-action-owner">${action.owner}</div></div>
                <div class="insight-action-due">${action.due}</div>
              </div>
            `).join('')}
          </div>
          ${actionHtml}
        </div>
      </div>`;
  }).join('');

  setTimeout(() => {
    container.querySelectorAll('.insight-card').forEach(c => c.style.opacity = '1');
  }, insights.length * 120 + 400);
}

// ── SHARED AUDIT SHELL ───────────────────────────────────────
function showAuditShell(btn, title) {
  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.6">⬡ Agent running...</span>';
  const auditContainer = document.getElementById('agent-audit-container');
  auditContainer.innerHTML = `
    <div style="margin-top:24px;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
        <div class="agent-pulse"></div>
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);font-family:'DM Mono',monospace;">${title}</div>
      </div>
      <div style="padding:20px;" id="intervention-log">
        <div style="font-size:12px;color:var(--text-muted);font-family:'DM Mono',monospace;">Agent running...</div>
      </div>
    </div>
  `;
  auditContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── SHARED AUDIT LOG RENDERER ────────────────────────────────
function renderAuditLog(results, btn, completedLabel, segmentKey, segColors) {
  const sent = results.filter(r => r.status === 'sent');
  const skipped = results.filter(r => r.status === 'skipped');
  const flagged = results.filter(r => r.status === 'flagged');
  const statusColor = { sent: 'var(--green)', skipped: 'var(--text-muted)', flagged: 'var(--amber)' };
  const statusBg = { sent: 'rgba(46,204,113,0.1)', skipped: 'rgba(85,85,85,0.1)', flagged: 'rgba(243,156,18,0.1)' };
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  document.getElementById('intervention-log').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
      <div style="background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.2);border-radius:6px;padding:12px 14px;text-align:center;">
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--green);">${sent.length}</div>
        <div style="font-size:10px;color:var(--green);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Sent</div>
      </div>
      <div style="background:rgba(85,85,85,0.1);border:1px solid var(--border);border-radius:6px;padding:12px 14px;text-align:center;">
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--text-muted);">${skipped.length}</div>
        <div style="font-size:10px;color:var(--text-muted);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Skipped</div>
      </div>
      <div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.2);border-radius:6px;padding:12px 14px;text-align:center;">
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--amber);">${flagged.length}</div>
        <div style="font-size:10px;color:var(--amber);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Flagged</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${results.map((r, i) => `
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;overflow:hidden;">
          <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="toggleEmail(${i})">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="width:7px;height:7px;border-radius:50%;background:${statusColor[r.status]};flex-shrink:0;"></div>
              <div>
                <div style="font-size:12px;font-weight:600;">${r.name}</div>
                <div style="font-size:11px;color:var(--text-dim);margin-top:1px;">${r.role || r.department || ''}</div>
              </div>
              <div style="font-size:10px;padding:2px 7px;border-radius:3px;background:${statusBg[r.status]};color:${statusColor[r.status]};font-family:'DM Mono',monospace;font-weight:600;text-transform:uppercase;">${r.status}</div>
              ${r[segmentKey] ? `<div style="font-size:10px;padding:2px 7px;border-radius:3px;background:var(--surface3);color:${segColors[r[segmentKey]] || 'var(--text-muted)'};font-family:'DM Mono',monospace;">${r[segmentKey]}</div>` : ''}
            </div>
            <span style="color:var(--text-muted);font-size:11px;transition:transform 0.2s;" id="email-chevron-${i}">▾</span>
          </div>
          <div id="email-body-${i}" style="display:none;padding:0 14px 14px;">
            ${r.status === 'skipped' ? `
              <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;padding:8px 12px;background:var(--surface3);border-radius:4px;">⚠ Skipped: ${r.skipReason}</div>
            ` : `
              ${r.status === 'flagged' ? `<div style="font-size:11px;color:var(--amber);font-family:'DM Mono',monospace;padding:8px 12px;background:rgba(243,156,18,0.08);border-radius:4px;margin-bottom:8px;">△ Flagged: ${r.flagReason}</div>` : ''}
              <div style="font-size:11px;color:var(--text-dim);font-family:'DM Mono',monospace;margin-bottom:6px;">Subject: ${r.subject}</div>
              <div style="font-size:12px;color:var(--text);line-height:1.7;padding:10px 12px;background:var(--surface3);border-radius:4px;white-space:pre-wrap;">${r.body}</div>
            `}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:10px;color:var(--text-muted);font-family:'DM Mono',monospace;">⬡ Ensemble Agent · Completed ${now} · Q1 2026</div>
      <div style="font-size:10px;color:var(--text-muted);font-family:'DM Mono',monospace;">Audit log retained · All actions logged</div>
    </div>
  `;

  btn.innerHTML = `✓ ${completedLabel}`;
  btn.style.background = 'rgba(46,204,113,0.15)';
  btn.style.color = 'var(--green)';
  btn.style.border = '1px solid rgba(46,204,113,0.3)';
}

// ── AGENT: SEND L&D NUDGES ───────────────────────────────────
window.runLDNudges = async function(btn) {
  showAuditShell(btn, 'Autonomous Agent · Sending L&D Nudges');
  try {
    const raw = await callClaude('Run the L&D nudge program now.', LD_INTERVENTION_CONTEXT);
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const segColors = { corporate: 'var(--blue)', studio: '#ff6b6b', union: 'var(--purple)', freelance: 'var(--amber)' };
    renderAuditLog(results, btn, 'Nudges Sent', 'segment', segColors);
  } catch (e) {
    document.getElementById('intervention-log').innerHTML = `<div style="color:var(--red);font-size:12px;">Agent error: ${e.message}</div>`;
    btn.disabled = false; btn.innerHTML = '⬡ Send L&D Nudges';
    console.error(e);
  }
};

// ── AGENT: MOBILIZE SKILLS PIPELINE ─────────────────────────
window.runSkillsPipeline = async function(btn) {
  showAuditShell(btn, 'Autonomous Agent · Mobilizing Skills Pipeline');
  try {
    const raw = await callClaude('Mobilize the internal skills pipeline now. Match candidates to gaps and flag external sourcing needs.', SKILLS_PIPELINE_CONTEXT);
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const segColors = { corporate: 'var(--blue)', studio: '#ff6b6b', union: 'var(--purple)', freelance: 'var(--amber)', external: 'var(--red)' };
    renderAuditLog(results, btn, 'Pipeline Mobilized', 'segment', segColors);
  } catch (e) {
    document.getElementById('intervention-log').innerHTML = `<div style="color:var(--red);font-size:12px;">Agent error: ${e.message}</div>`;
    btn.disabled = false; btn.innerHTML = '⬡ Mobilize Skills Pipeline';
    console.error(e);
  }
};

// ── AGENT: ACTIVATE ONBOARDING SEQUENCE ─────────────────────
window.runOnboardingSequence = async function(btn) {
  showAuditShell(btn, 'Autonomous Agent · Activating Onboarding Sequence');
  try {
    const raw = await callClaude('Activate the onboarding sequence for all open req departments now.', ONBOARDING_CONTEXT);
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const segColors = { 'Post-Production': '#ff6b6b', 'VFX & Animation': '#ff6b6b', 'Product & Engineering': 'var(--blue)', 'Studio Operations': '#ff6b6b', 'Scripted Content': '#ff6b6b', 'Marketing': 'var(--amber)', 'People & Culture': 'var(--purple)', 'Unscripted & Animation': '#ff6b6b' };
    renderAuditLog(results, btn, 'Sequence Activated', 'department', segColors);
  } catch (e) {
    document.getElementById('intervention-log').innerHTML = `<div style="color:var(--red);font-size:12px;">Agent error: ${e.message}</div>`;
    btn.disabled = false; btn.innerHTML = '⬡ Activate Onboarding Sequence';
    console.error(e);
  }
};

// ── TOGGLE HELPERS ───────────────────────────────────────────
window.toggleEmail = function(i) {
  const body = document.getElementById(`email-body-${i}`);
  const chevron = document.getElementById(`email-chevron-${i}`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.toggleInsight = function(idx) {
  const body = document.getElementById(`insight-body-${idx}`);
  const chevron = document.getElementById(`chevron-${idx}`);
  if (!body) return;
  body.classList.toggle('open');
  if (chevron) chevron.classList.toggle('open');
};
