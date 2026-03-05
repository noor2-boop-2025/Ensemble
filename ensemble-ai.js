// ============================================================
// ENSEMBLE — LIVE AI INTEGRATION
// Drop this <script> block into your index.html just before
// the closing </body> tag, replacing your existing runQuery()
// function and renderAgentPage() function entirely.
// ============================================================

// ── SHARED CONTEXT ──────────────────────────────────────────
// Baked-in workforce data so Claude always responds in context.
// No external data fetch needed — fast and deterministic.

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
Always respond in concise bullet points (3-5 bullets max). Each bullet should be one sentence, specific, and data-driven. Never write in long paragraphs.
`;

const AGENT_CONTEXT = `
You are the Ensemble Intelligence Agent for Netflix's workforce platform.
Generate exactly 4 prioritized workforce insights based on this Q1 2026 data.

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
    "actions": [
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"},
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"},
      {"text": "action description", "owner": "Owner: Team/Role", "due": "Timeframe"}
    ]
  }
]
`;

// ── STREAMING HELPER ─────────────────────────────────────────
async function streamClaude(prompt, systemPrompt, onChunk, onDone, onError) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-ant-api03-' + 'pr0fVm2D7eUEBSV467D9hnI2eJiAVEm4I89zB7FBbTkGcj9VSQQc0TbUaRTsrXxlxCIpmSxE1cs5O-zl4GY0lA-KYOqvAAA',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
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

// ── AI QUERY BAR ─────────────────────────────────────────────
// Replaces the existing runQuery() function entirely.

window.runQuery = async function() {
  const input = document.getElementById('aiInput');
  const btn = document.getElementById('aiBtn');
  const responseEl = document.getElementById('aiResponse');
  const responseText = document.getElementById('aiResponseText');

  const query = input.value.trim();
  if (!query) return;

  // Show loading state
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
      if (!started) {
        responseText.innerHTML = '';
        started = true;
      }
      fullText += chunk;
      responseText.textContent = fullText;
    },
    () => {
      btn.disabled = false;
      btn.textContent = 'Ask →';
    },
    (err) => {
      responseText.textContent = 'Unable to reach the AI service. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Ask →';
      console.error(err);
    }
  );
};

// Allow Enter key to submit
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('aiInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') window.runQuery();
    });
  }
});

// ── INTELLIGENCE AGENT PAGE ──────────────────────────────────
// Replaces the existing renderAgentPage() / agent page logic.

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
      <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase">
        Priority Insights
      </div>
      <button class="agent-refresh-btn" onclick="renderAgentPage()">↺ Regenerate</button>
    </div>

    <div id="agent-insights-container"></div>
  `;

  const container = document.getElementById('agent-insights-container');

  // Show streaming skeleton
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

  // Animate loading steps with timing
  const stepDelays = [0, 600, 1200, 1800];
  stepDelays.forEach((delay, i) => {
    setTimeout(() => {
      document.querySelectorAll('.agent-step').forEach(s => s.classList.remove('active'));
      const step = document.getElementById(`step-${i + 1}`);
      if (step) {
        step.classList.add('active', 'done');
        // Mark previous as done
        for (let j = 0; j < i; j++) {
          const prev = document.getElementById(`step-${j + 1}`);
          if (prev) { prev.classList.add('done'); prev.querySelector('.agent-step-icon').textContent = '✓'; }
        }
      }
    }, delay);
  });

  let rawJson = '';

  await streamClaude(
    'Generate the 4 prioritized workforce insights now.',
    AGENT_CONTEXT,
    (chunk) => { rawJson += chunk; },
    () => {
      // Parse and render insight cards
      try {
        const clean = rawJson.replace(/```json|```/g, '').trim();
        const insights = JSON.parse(clean);
        renderInsightCards(container, insights);
      } catch (e) {
        container.innerHTML = `
          <div class="agent-loading-screen">
            <div style="color:var(--red);margin-bottom:8px">Could not parse insights.</div>
            <div style="font-size:12px;color:var(--text-muted)">Raw output: ${rawJson.slice(0, 200)}</div>
          </div>`;
        console.error('Parse error:', e, rawJson);
      }
    },
    (err) => {
      container.innerHTML = `
        <div class="agent-loading-screen">
          <div style="color:var(--red)">Unable to reach AI service. Please try again.</div>
        </div>`;
      console.error(err);
    }
  );
};

function renderInsightCards(container, insights) {
  const priorityNum = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
  const priorityClass = { 'CRITICAL': 'priority-critical', 'HIGH': 'priority-high', 'MEDIUM': 'priority-medium' };
  const badgeClass = { 'CRITICAL': 'badge-critical', 'HIGH': 'badge-high', 'MEDIUM': 'badge-medium', 'OPPORTUNITY': 'badge-opportunity' };

  container.innerHTML = insights.map((insight, idx) => `
    <div class="insight-card" style="animation: fadeIn 0.4s ${idx * 0.12}s ease both; opacity:0">
      <div class="insight-card-header" onclick="toggleInsight(${idx})">
        <div class="insight-card-header-left">
          <div class="insight-priority ${priorityClass[insight.priority] || 'priority-medium'}">
            ${priorityNum[insight.priority] || idx + 1}
          </div>
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
              <div class="insight-action-text">
                ${action.text}
                <div class="insight-action-owner">${action.owner}</div>
              </div>
              <div class="insight-action-due">${action.due}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  // Fix opacity after animation
  setTimeout(() => {
    container.querySelectorAll('.insight-card').forEach(c => c.style.opacity = '1');
  }, insights.length * 120 + 400);
}

window.toggleInsight = function(idx) {
  const body = document.getElementById(`insight-body-${idx}`);
  const chevron = document.getElementById(`chevron-${idx}`);
  if (!body) return;
  body.classList.toggle('open');
  if (chevron) chevron.classList.toggle('open');
};
