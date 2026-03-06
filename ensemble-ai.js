// ============================================================
// ENSEMBLE — LIVE AI INTEGRATION v2
// Calls Vercel proxy — no API key in this file
// ============================================================

// ── PROXY URL — update this after deploying to Vercel ────────
const PROXY_URL = 'https://ensemble-proxy.vercel.app/api/chat';

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
OPEN CRITICAL REQS: 43 roles blocking production (-5 resolved this cycle).

Be concise, data-driven, and actionable. Reference specific names and numbers from the data above.
Speak like a senior People Analytics advisor to an executive audience. No markdown headers.
Always respond as a structured bulleted list. Use "•" as the bullet character followed by a line break for each point. 3-5 bullets max. Each bullet one sentence, specific, and data-driven. Never write paragraphs.
`;

const AGENT_CONTEXT = `
You are the Ensemble Intelligence Agent for Netflix's workforce platform.
Generate exactly 3 prioritized workforce insights based on this Q1 2026 data.

WORKFORCE DATA:
- 12,847 total headcount across Corporate (4,210), Studio (3,890), Union (2,640), Freelance (2,107)
- 284 employees flagged as flight risk (+18 vs last cycle)
- Top risks: Jordan Kim (87%, post-prod, comp 11% below band), Marcus Webb (79%, VFX, comp 14% below band), Priya Nair (64%, PM, 2 blocked internal transfers)
- WGA contract expiring in 12 days — 14 drama writers affected
- Skills gaps: Unreal Engine 5 (81%), AI/ML Production (72%), Post-Production AI (65%)
- Studio L&D participation at 52% — lowest of all segments
- 43 open critical reqs blocking production

Respond ONLY with a valid JSON array. No preamble, no markdown fences, no explanation.
Format exactly as:
[
  {
    "priority": "CRITICAL|HIGH|MEDIUM",
    "title": "short title",
    "badge": "CRITICAL|HIGH|MEDIUM|OPPORTUNITY",
    "finding": "2-3 sentence finding with specific data points",
    "hasIntervention": true or false (set true for whichever insight is most related to L&D or employee engagement),
    "actions": [
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"},
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"}
    ]
  }
]
`;

const INTERVENTION_CONTEXT = `
You are the Ensemble Autonomous Intervention Agent for Netflix's workforce platform.
You have just been triggered to run an autonomous L&D outreach intervention.

EMPLOYEES WITH NO L&D ACTIVITY IN 90+ DAYS (eligible for outreach):
1. Jordan Kim, Sr. Post-Production Supervisor — Studio segment. No L&D in 9 months. Flight risk 87%. Los Angeles.
2. Marcus Webb, Lead VFX Artist — Studio segment. No L&D in 9 months. Flight risk 79%. Vancouver.
3. Amara Osei, Showrunner — Studio segment. No L&D in 11 months. Flight risk 48%. New York.
4. Kenji Watanabe, IATSE Gaffer — Union segment. CBA constraints apply. Flight risk 44%. Los Angeles.
5. Lena Torres, DP/Cinematographer — Freelance segment. No L&D in contract gap period. Flight risk 58%. New York.
6. Dev Sharma, ML Engineer — Corporate segment. No formal L&D enrollment. Flight risk 52%. Los Gatos.
7. Priya Nair, Product Manager II — Corporate segment. No L&D activity. Flight risk 64%. Los Gatos.

RULES:
- Union employees (Kenji Watanabe) must be SKIPPED — CBA restrictions prohibit direct outreach during renegotiation. Set status to "skipped".
- Employees with flight risk above 75% should be FLAGGED for manager review. Set status to "flagged".
- All others get status "sent".
- Freelance employees get a modified "preferred vendor program" outreach, not a standard L&D email.

For each employee, generate a short personalized email (3-4 sentences) that:
- References their specific role and situation
- Recommends 1 relevant program from: Virtual Production Certification, AI/ML Product Immersion, Executive Producer Track, Harvard Business Online, MasterClass for Business, Netflix Creator Fund
- Has a warm but professional tone
- Signs off from "People Analytics and L&D Team, Netflix"

Respond ONLY with a valid JSON array. No preamble, no markdown fences.
Format exactly as:
[
  {
    "name": "Employee Name",
    "role": "Their Role",
    "segment": "corporate|studio|freelance|union",
    "status": "sent|skipped|flagged",
    "skipReason": "reason if skipped, else null",
    "flagReason": "reason if flagged, else null",
    "subject": "Email subject line",
    "body": "Full email body (plain text, no HTML)"
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
        max_tokens: 600,
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

// ── NON-STREAMING HELPER (for intervention) ──────────────────
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
    query,
    ENSEMBLE_CONTEXT,
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
      btn.disabled = false;
      btn.textContent = 'Ask →';
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
        <div class="agent-step" id="step-3"><span class="agent-step-icon">△</span> Checking contract expiry windows</div>
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

function renderInsightCards(container, insights) {
  const priorityNum = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
  const priorityClass = { 'CRITICAL': 'priority-critical', 'HIGH': 'priority-high', 'MEDIUM': 'priority-medium' };
  const badgeClass = { 'CRITICAL': 'badge-critical', 'HIGH': 'badge-high', 'MEDIUM': 'badge-medium', 'OPPORTUNITY': 'badge-opportunity' };

  container.innerHTML = insights.map((insight, idx) => `
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
        ${insight.hasIntervention ? `
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
            <button onclick="runIntervention(this)"
              style="display:flex;align-items:center;gap:8px;background:var(--red);border:none;border-radius:5px;padding:9px 18px;color:white;font-size:12px;font-weight:600;cursor:pointer;"
              onmouseover="this.style.background='#c0070f'" onmouseout="this.style.background='var(--red)'">
              <span>⬡</span> Run Autonomous L&D Intervention
            </button>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px;font-family:'DM Mono',monospace;">
              Agent will identify eligible employees, draft personalized outreach, and send — autonomously.
            </div>
          </div>` : ''}
      </div>
    </div>
  `).join('');

  setTimeout(() => {
    container.querySelectorAll('.insight-card').forEach(c => c.style.opacity = '1');
  }, insights.length * 120 + 400);
}

// ── AUTONOMOUS INTERVENTION AGENT ────────────────────────────
window.runIntervention = async function(btn) {
  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.6">⬡ Agent running...</span>';

  const auditContainer = document.getElementById('agent-audit-container');
  auditContainer.innerHTML = `
    <div style="margin-top:24px;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
        <div class="agent-pulse"></div>
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);font-family:'DM Mono',monospace;">
          Autonomous Agent · L&D Intervention Running
        </div>
      </div>
      <div style="padding:20px;" id="intervention-log">
        <div style="font-size:12px;color:var(--text-muted);font-family:'DM Mono',monospace;">Identifying eligible employees...</div>
      </div>
    </div>
  `;
  auditContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const raw = await callClaude(
      'Run the autonomous L&D intervention now. Generate personalized outreach for all eligible employees.',
      INTERVENTION_CONTEXT
    );
    const results = JSON.parse(raw.replace(/```json|```/g, '').trim());
    renderAuditLog(results, btn);
  } catch (e) {
    document.getElementById('intervention-log').innerHTML = `<div style="color:var(--red);font-size:12px;">Agent error: ${e.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = '<span>⬡</span> Run Autonomous L&D Intervention';
    console.error(e);
  }
};

function renderAuditLog(results, btn) {
  const sent = results.filter(r => r.status === 'sent');
  const skipped = results.filter(r => r.status === 'skipped');
  const flagged = results.filter(r => r.status === 'flagged');
  const statusColor = { sent: 'var(--green)', skipped: 'var(--text-muted)', flagged: 'var(--amber)' };
  const statusBg = { sent: 'rgba(46,204,113,0.1)', skipped: 'rgba(85,85,85,0.1)', flagged: 'rgba(243,156,18,0.1)' };
  const segColor = { corporate: 'var(--blue)', studio: '#ff6b6b', union: 'var(--purple)', freelance: 'var(--amber)' };
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  document.getElementById('intervention-log').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
      <div style="background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.2);border-radius:6px;padding:12px 14px;text-align:center;">
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--green);">${sent.length}</div>
        <div style="font-size:10px;color:var(--green);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Emails Sent</div>
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
                <div style="font-size:11px;color:var(--text-dim);margin-top:1px;">${r.role}</div>
              </div>
              <div style="font-size:10px;padding:2px 7px;border-radius:3px;background:${statusBg[r.status]};color:${statusColor[r.status]};font-family:'DM Mono',monospace;font-weight:600;text-transform:uppercase;">${r.status}</div>
              <div style="font-size:10px;padding:2px 7px;border-radius:3px;background:var(--surface3);color:${segColor[r.segment] || 'var(--text-muted)'};font-family:'DM Mono',monospace;">${r.segment}</div>
            </div>
            <span style="color:var(--text-muted);font-size:11px;transition:transform 0.2s;" id="email-chevron-${i}">▾</span>
          </div>
          <div id="email-body-${i}" style="display:none;padding:0 14px 14px;">
            ${r.status === 'skipped' ? `
              <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;padding:8px 12px;background:var(--surface3);border-radius:4px;">⚠ Skipped: ${r.skipReason}</div>
            ` : `
              ${r.status === 'flagged' ? `<div style="font-size:11px;color:var(--amber);font-family:'DM Mono',monospace;padding:8px 12px;background:rgba(243,156,18,0.08);border-radius:4px;margin-bottom:8px;">△ Flagged for manager review: ${r.flagReason}</div>` : ''}
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

  btn.innerHTML = '✓ Intervention Complete';
  btn.style.background = 'rgba(46,204,113,0.15)';
  btn.style.color = 'var(--green)';
  btn.style.border = '1px solid rgba(46,204,113,0.3)';
}

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
