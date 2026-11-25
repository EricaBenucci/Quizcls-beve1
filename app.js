const QUIZ_QUESTIONS = [
  {
    id: 1,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-01.webp",
    audioFile: "",
    text: "Nel 2006 il birrificio giapponese Sapporo inviò semi d'orzo nello spazio per cinque mesi, li riportò sulla Terra per coltivarli e produsse una birra venduta a prezzi stellari.",
    answer: true,
    explanation: "VERO! Si chiamava 'Space Barley': i semi rimasero a bordo della Stazione Spaziale Internazionale e la birra prodotta fu venduta in edizione limitatissima a scopo benefico a circa 110 dollari per sei bottiglie."
  },
  {
    id: 2,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-02.webp",
    audioFile: "",
    text: "Nell'antico Egitto gli operai che costruivano le piramidi ricevevano una razione quotidiana di birra come parte integrante del loro salario.",
    answer: true,
    explanation: "VERO! La birra era nutriente, densa e molto più sicura dell'acqua non trattata: gli operai di Giza ne ricevevano circa 4-5 litri al giorno."
  },
  {
    id: 3,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-03.webp",
    audioFile: "",
    text: "La cenosillicafobia è il termine scherzoso che indica la paura irragionevole di trovarsi davanti a un bicchiere di birra vuoto.",
    answer: true,
    explanation: "VERO! Dal greco 'kenos' (vuoto) e 'silix' (calice): è la fobia ironica del bicchiere vuoto sul tavolo del pub."
  },
  {
    id: 4,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-04.webp",
    audioFile: "",
    text: "L'editto tedesco della purezza del 1516 (Reinheitsgebot) includeva fin dall'origine il lievito tra i quattro ingredienti ammessi.",
    answer: false,
    explanation: "FALSO! Nel 1516 l'esistenza e il ruolo del lievito non erano ancora conosciuti: l'editto citava solo acqua, orzo e luppolo."
  },
  {
    id: 5,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-05.webp",
    audioFile: "",
    text: "Nel 1814 a Londra un'enorme tinozza di birra Porter esplose provocando una vera e propria inondazione di birra per le strade del quartiere di St. Giles.",
    answer: true,
    explanation: "VERO! È la celebre 'London Beer Flood' del 17 ottobre 1814: oltre un milione di litri di birra invasero le vie della zona."
  },
  {
    id: 6,
    chapter: "Capitolo 1 • Curiosità",
    image: "domanda-06.webp",
    audioFile: "",
    text: "Esistono davvero bagnoschiuma e detergenti formulati con ingredienti legati alla birra (come luppolo e lievito) per fare il bagno o la doccia.",
    answer: true,
    explanation: "VERO! Sulla scia della cultura delle beer spa e dei rituali di benessere nordici ed europei, esistono veri e propri bagnoschiuma e gel doccia cosmetici arricchiti con estratti legati alla birra, luppolo e lievito."
  }
];

const STORAGE_KEY = "chi_la_sa_la_beve_state_v1";

const state = {
  playerName: "",
  currentIndex: 0,
  answers: {},
  revealed: {},
  friendResults: [],
  reviewFilter: "all"
};

const views = {
  welcome: document.getElementById("view-welcome"),
  bridge: document.getElementById("view-bridge"),
  question: document.getElementById("view-question"),
  summary: document.getElementById("view-summary")
};

function pad2(num) {
  return String(num).padStart(2, "0");
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.playerName === "string") state.playerName = parsed.playerName;
    if (typeof parsed.currentIndex === "number") state.currentIndex = parsed.currentIndex;
    if (parsed.answers && typeof parsed.answers === "object") state.answers = parsed.answers;
    if (parsed.revealed && typeof parsed.revealed === "object") state.revealed = parsed.revealed;
    if (Array.isArray(parsed.friendResults)) state.friendResults = parsed.friendResults;
  } catch (e) {}
}

function showView(viewName) {
  stopAudio();
  Object.entries(views).forEach(([key, el]) => {
    if (!el) return;
    if (key === viewName) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
  updateTopBadge();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateTopBadge() {
  const badge = document.getElementById("player-badge-top");
  if (!badge) return;
  if (state.playerName && state.playerName.trim()) {
    badge.textContent = `🍺 ${state.playerName.trim()}`;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function syncWelcomeButtons() {
  const input = document.getElementById("player-name");
  if (input && state.playerName) {
    input.value = state.playerName;
  }
  const hasProgress = Object.keys(state.answers).length > 0 || state.currentIndex > 0;
  const resumeBtn = document.getElementById("btn-resume");
  if (resumeBtn) {
    if (hasProgress) {
      resumeBtn.classList.remove("hidden");
    } else {
      resumeBtn.classList.add("hidden");
    }
  }
}

function renderBridge(index) {
  const q = QUIZ_QUESTIONS[index];
  if (!q) return;
  const numStr = pad2(q.id);
  const pct = ((index + 1) / QUIZ_QUESTIONS.length) * 100;

  document.getElementById("bridge-progress-fill").style.width = `${pct}%`;
  document.getElementById("bridge-chapter").textContent = q.chapter;
  document.getElementById("bridge-title").textContent = `Libro — Pagina / Domanda #${numStr}`;
  document.getElementById("btn-enter-question").textContent = `Vai alla Domanda #${numStr} →`;
}

function renderQuestion(index) {
  const q = QUIZ_QUESTIONS[index];
  if (!q) return;

  state.currentIndex = index;
  saveState();

  const numStr = pad2(q.id);
  document.getElementById("q-chapter").textContent = q.chapter;
  document.getElementById("q-counter").textContent = `#${numStr} • ${index + 1}/${QUIZ_QUESTIONS.length}`;
  document.getElementById("q-text").textContent = q.text;

  const imgEl = document.getElementById("q-image");
  const fallbackEl = document.getElementById("q-img-fallback");
  fallbackEl.classList.add("hidden");
  imgEl.style.display = "block";
  imgEl.src = q.image;
  imgEl.alt = `Illustrazione domanda ${q.id}`;

  const chosen = state.answers[q.id];
  const btnTrue = document.getElementById("btn-true");
  const btnFalse = document.getElementById("btn-false");
  btnTrue.classList.toggle("selected", chosen === true);
  btnFalse.classList.toggle("selected", chosen === false);

  const btnNext = document.getElementById("btn-next");
  btnNext.disabled = chosen === undefined;
  btnNext.textContent = index === QUIZ_QUESTIONS.length - 1 ? "Vedi Risultato Finale →" : "Avanti →";

  const btnPrev = document.getElementById("btn-prev");
  btnPrev.disabled = index === 0;

  document.getElementById("confirm-solution-box").classList.add("hidden");
  const wantBtn = document.getElementById("btn-want-solution");
  const solBox = document.getElementById("revealed-solution-box");

  if (state.revealed[q.id]) {
    wantBtn.classList.add("hidden");
    solBox.classList.remove("hidden");
    document.getElementById("revealed-verdict").textContent = q.answer
      ? "✅ Risposta corretta: VERO"
      : "❌ Risposta corretta: FALSO";
    document.getElementById("revealed-explanation").textContent = q.explanation;
  } else {
    wantBtn.classList.remove("hidden");
    solBox.classList.add("hidden");
  }
}

function selectAnswer(value) {
  const q = QUIZ_QUESTIONS[state.currentIndex];
  if (!q) return;
  state.answers[q.id] = value;
  saveState();

  document.getElementById("btn-true").classList.toggle("selected", value === true);
  document.getElementById("btn-false").classList.toggle("selected", value === false);
  document.getElementById("btn-next").disabled = false;
}

let currentAudio = null;

function stopAudio() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  const label = document.getElementById("audio-label");
  if (label) label.textContent = "Ascolta domanda";
}

function playQuestionAudio() {
  const q = QUIZ_QUESTIONS[state.currentIndex];
  if (!q) return;
  const label = document.getElementById("audio-label");

  if (q.audioFile) {
    stopAudio();
    currentAudio = new Audio(q.audioFile);
    label.textContent = "In riproduzione...";
    currentAudio.play().catch(() => {
      label.textContent = "Ascolta domanda";
    });
    currentAudio.onended = () => {
      label.textContent = "Ascolta domanda";
    };
    return;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(q.text);
    utter.lang = "it-IT";
    utter.rate = 0.98;
    label.textContent = "In ascolto...";
    utter.onend = () => {
      label.textContent = "Ascolta domanda";
    };
    utter.onerror = () => {
      label.textContent = "Ascolta domanda";
    };
    window.speechSynthesis.speak(utter);
  }
}

function calculateScore() {
  let score = 0;
  QUIZ_QUESTIONS.forEach((q) => {
    if (state.answers[q.id] === q.answer) {
      score += 1;
    }
  });
  return score;
}

function getRankInfo(score, total) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.85) {
    return { icon: "🏆", title: "Mastro Birraio", heading: "Prestazione da leggenda!" };
  }
  if (ratio >= 0.6) {
    return { icon: "🍻", title: "Luppolo d'Oro", heading: "Ottimo giro!" };
  }
  if (ratio >= 0.35) {
    return { icon: "🍺", title: "Assaggiatore Curioso", heading: "Buona spinta!" };
  }
  return { icon: "🌾", title: "Novizio della Spina", heading: "Il prossimo giro sarà il tuo!" };
}

function encodeShareCode(name, score, total) {
  const payload = JSON.stringify({
    n: (name || "Giocatore").trim().slice(0, 20),
    s: score,
    t: total
  });
  const bytes = new TextEncoder().encode(payload);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return `CLSB1:${btoa(bin)}`;
}

function decodeShareCode(rawInput) {
  if (!rawInput) return null;
  let str = rawInput.trim();
  const match = str.match(/CLSB1:[A-Za-z0-9+/=]+/);
  if (match) {
    str = match[0];
  }
  if (!str.startsWith("CLSB1:")) return null;
  const b64 = str.slice(6);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  const jsonText = new TextDecoder().decode(bytes);
  const data = JSON.parse(jsonText);
  if (typeof data.n !== "string" || typeof data.s !== "number" || typeof data.t !== "number") {
    return null;
  }
  return {
    name: data.n.trim().slice(0, 20) || "Amico",
    score: Math.max(0, Math.min(data.t, Math.round(data.s))),
    total: Math.max(1, Math.round(data.t))
  };
}

function renderSummary() {
  const total = QUIZ_QUESTIONS.length;
  const score = calculateScore();
  const rank = getRankInfo(score, total);
  const myName = (state.playerName || "Tu").trim() || "Tu";

  document.getElementById("summary-heading").textContent = rank.heading;
  document.getElementById("player-badge-icon").textContent = rank.icon;
  document.getElementById("player-rank-title").textContent = rank.title;
  document.getElementById("player-score-text").textContent = `${score} / ${total}`;

  renderGroupChart(myName, score, total);
  renderReviewList();
}

function renderGroupChart(myName, myScore, total) {
  const chartEl = document.getElementById("group-chart");
  if (!chartEl) return;

  const entries = [
    { name: `${myName} (Tu)`, score: myScore, total, isMe: true },
    ...state.friendResults.map((f) => ({
      name: f.name,
      score: f.score,
      total: f.total || total,
      isMe: false
    }))
  ].sort((a, b) => b.score - a.score);

  chartEl.innerHTML = entries
    .map((item) => {
      const pct = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
      return `
        <div class="chart-row ${item.isMe ? "is-me" : ""}">
          <div class="chart-meta">
            <span class="chart-name">${escapeHtml(item.name)}</span>
            <span class="chart-val">${item.score}/${item.total}</span>
          </div>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderReviewList() {
  const listEl = document.getElementById("review-list");
  if (!listEl) return;

  const filtered = QUIZ_QUESTIONS.filter((q) => {
    if (state.reviewFilter === "wrong") {
      return state.answers[q.id] !== q.answer;
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="subtitle small">Nessuna domanda da mostrare con questo filtro.</p>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((q) => {
      const userAns = state.answers[q.id];
      const isCorrect = userAns === q.answer;
      const userLabel = userAns === true ? "VERO" : userAns === false ? "FALSO" : "Non risposto";
      const rightLabel = q.answer ? "VERO" : "FALSO";
      return `
        <div class="review-item ${isCorrect ? "correct" : "wrong"}">
          <div class="review-top">
            <strong>#${pad2(q.id)} • ${isCorrect ? "✅ Corretta" : "❌ Da rivedere"}</strong>
            <span class="review-tag">Risposta: ${rightLabel}</span>
          </div>
          <p class="review-q">${escapeHtml(q.text)}</p>
          <p class="review-ans">La tua scelta: <strong>${userLabel}</strong></p>
          <p class="review-exp">${escapeHtml(q.explanation)}</p>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  syncWelcomeButtons();
  updateTopBadge();

  document.getElementById("btn-start").addEventListener("click", () => {
    const nameInput = document.getElementById("player-name");
    state.playerName = (nameInput.value || "").trim();
    state.currentIndex = 0;
    state.answers = {};
    state.revealed = {};
    saveState();
    renderBridge(0);
    showView("bridge");
  });

  document.getElementById("btn-resume").addEventListener("click", () => {
    const idx = Math.max(0, Math.min(QUIZ_QUESTIONS.length - 1, state.currentIndex || 0));
    renderBridge(idx);
    showView("bridge");
  });

  document.getElementById("btn-open-group-home").addEventListener("click", () => {
    renderSummary();
    showView("summary");
  });

  document.getElementById("btn-enter-question").addEventListener("click", () => {
    renderQuestion(state.currentIndex);
    showView("question");
  });

  document.getElementById("btn-true").addEventListener("click", () => selectAnswer(true));
  document.getElementById("btn-false").addEventListener("click", () => selectAnswer(false));
  document.getElementById("btn-audio").addEventListener("click", playQuestionAudio);

  document.getElementById("btn-want-solution").addEventListener("click", (e) => {
    e.target.classList.add("hidden");
    document.getElementById("confirm-solution-box").classList.remove("hidden");
  });

  document.getElementById("btn-cancel-reveal").addEventListener("click", () => {
    document.getElementById("confirm-solution-box").classList.add("hidden");
    document.getElementById("btn-want-solution").classList.remove("hidden");
  });

  document.getElementById("btn-confirm-reveal").addEventListener("click", () => {
    const q = QUIZ_QUESTIONS[state.currentIndex];
    if (!q) return;
    state.revealed[q.id] = true;
    saveState();
    document.getElementById("confirm-solution-box").classList.add("hidden");
    const solBox = document.getElementById("revealed-solution-box");
    solBox.classList.remove("hidden");
    document.getElementById("revealed-verdict").textContent = q.answer
      ? "✅ Risposta corretta: VERO"
      : "❌ Risposta corretta: FALSO";
    document.getElementById("revealed-explanation").textContent = q.explanation;
  });

  document.getElementById("btn-hide-solution").addEventListener("click", () => {
    document.getElementById("revealed-solution-box").classList.add("hidden");
    document.getElementById("btn-want-solution").classList.remove("hidden");
  });

  document.getElementById("btn-prev").addEventListener("click", () => {
    if (state.currentIndex > 0) {
      renderBridge(state.currentIndex - 1);
      showView("bridge");
    }
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    if (state.currentIndex < QUIZ_QUESTIONS.length - 1) {
      renderBridge(state.currentIndex + 1);
      showView("bridge");
    } else {
      renderSummary();
      showView("summary");
    }
  });

  document.getElementById("tab-group").addEventListener("click", () => {
    document.getElementById("tab-group").classList.add("active");
    document.getElementById("tab-review").classList.remove("active");
    document.getElementById("panel-group").classList.remove("hidden");
    document.getElementById("panel-review").classList.add("hidden");
  });

  document.getElementById("tab-review").addEventListener("click", () => {
    document.getElementById("tab-review").classList.add("active");
    document.getElementById("tab-group").classList.remove("active");
    document.getElementById("panel-review").classList.remove("hidden");
    document.getElementById("panel-group").classList.add("hidden");
  });

  document.getElementById("btn-copy-code").addEventListener("click", async () => {
    const score = calculateScore();
    const total = QUIZ_QUESTIONS.length;
    const code = encodeShareCode(state.playerName || "Giocatore", score, total);
    const msg = `🍺 ${state.playerName || "Giocatore"} ha fatto ${score}/${total} su Chi la sa la beve! Codice: ${code}`;

    try {
      await navigator.clipboard.writeText(msg);
    } catch (e) {
      const temp = document.createElement("textarea");
      temp.value = msg;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    const fb = document.getElementById("copy-feedback");
    fb.classList.remove("hidden");
    setTimeout(() => fb.classList.add("hidden"), 2500);
  });

  document.getElementById("btn-add-friend").addEventListener("click", () => {
    const input = document.getElementById("friend-code-input");
    const parsed = decodeShareCode(input.value);
    if (!parsed) return;
    state.friendResults.push(parsed);
    saveState();
    input.value = "";
    renderSummary();
  });

  document.getElementById("btn-reset-group").addEventListener("click", () => {
    state.friendResults = [];
    saveState();
    renderSummary();
  });

  document.getElementById("filter-all").addEventListener("click", () => {
    state.reviewFilter = "all";
    document.getElementById("filter-all").classList.add("active");
    document.getElementById("filter-wrong").classList.remove("active");
    renderReviewList();
  });

  document.getElementById("filter-wrong").addEventListener("click", () => {
    state.reviewFilter = "wrong";
    document.getElementById("filter-wrong").classList.add("active");
    document.getElementById("filter-all").classList.remove("active");
    renderReviewList();
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    state.currentIndex = 0;
    state.answers = {};
    state.revealed = {};
    saveState();
    syncWelcomeButtons();
    showView("welcome");
  });

  const leaveLink = document.getElementById("leave-site-link");
  const leaveModal = document.getElementById("leave-modal");
  let pendingUrl = leaveLink ? leaveLink.dataset.targetUrl : "https://italianbeerschool.it";

  if (leaveLink && leaveModal) {
    leaveLink.addEventListener("click", (e) => {
      e.preventDefault();
      pendingUrl = leaveLink.dataset.targetUrl || leaveLink.href;
      leaveModal.classList.remove("hidden");
    });

    document.getElementById("btn-cancel-leave").addEventListener("click", () => {
      leaveModal.classList.add("hidden");
    });

    document.getElementById("btn-confirm-leave").addEventListener("click", () => {
      window.location.href = pendingUrl;
    });
  }
});
