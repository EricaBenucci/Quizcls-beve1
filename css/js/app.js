// =========================================================
// DATI DEL QUIZ (Pronto per espansione a 60 domande)
// =========================================================
const QUIZ_QUESTIONS = [
  {
    id: 1,
    chapter: "Capitolo 1 • Curiosità",
    image: "assets/img/domanda-01.webp",
    audioFile: "", // Opzionale: es. "assets/audio/domanda-01.mp3"
    text: "Nel 2006 il birrificio giapponese Sapporo inviò semi d'orzo nello spazio per cinque mesi, li riportò sulla Terra per coltivarli e produsse una birra venduta a prezzi stellari.",
    answer: true,
    explanation: "VERO! Si chiamava 'Space Barley': i semi rimasero a bordo della Stazione Spaziale Internazionale e la birra prodotta fu venduta in edizione limitatissima a scopo benefico a circa 110 dollari per sei bottiglie."
  },
  {
    id: 2,
    chapter: "Capitolo 1 • Curiosità",
    image: "assets/img/domanda-02.webp",
    audioFile: "",
    text: "Nell'antico Egitto gli operai che costruivano le piramidi ricevevano una razione quotidiana di birra come parte integrante del loro salario.",
    answer: true,
    explanation: "VERO! La birra era nutriente, densa e molto più sicura dell'acqua non trattata: gli operai di Giza ne ricevevano circa 4-5 litri al giorno."
  },
  {
    id: 3,
    chapter: "Capitolo 1 • Curiosità",
    image: "assets/img/domanda-03.webp",
    audioFile: "",
    text: "La cenosillicafobia è il termine scherzoso che indica la paura irragionevole di trovarsi davanti a un bicchiere di birra vuoto.",
    answer: true,
    explanation: "VERO! Dal greco 'kenos' (vuoto) e 'silix' (calice): è la fobia ironica del bicchiere vuoto sul tavolo del pub."
  },
  {
    id: 4,
    chapter: "Capitolo 1 • Curiosità",
    image: "assets/img/domanda-04.webp",
    audioFile: "",
    text: "L'editto tedesco della purezza del 1516 (Reinheitsgebot) includeva fin dall'origine il lievito tra i quattro ingredienti ammessi.",
    answer: false,
    explanation: "FALSO! Nel 1516 l'esistenza e il ruolo del lievito non erano ancora conosciuti: l'editto citava solo acqua, orzo e luppolo."
  },
  {
    id: 5,
    chapter: "Capitolo 1 • Curiosità",
    image: "assets/img/domanda-05.webp",
    audioFile: "",
    text: "Nel 1814 a Londra un'enorme tinozza di birra Porter esplose provocando una vera e propria inondazione di birra per le strade del quartiere di St. Giles.",
    answer: true,
    explanation: "VERO! È la celebre 'London Beer Flood' del 17 ottobre 1814: oltre un milione di litri di birra invasero le vie della zona."
  }
];

const STORAGE_KEY = "cls_beve_state_v1";
const GROUP_KEY = "cls_beve_group_v1";

let state = {
  playerName: "",
  currentIndex: 0,
  answers: {}
};

let currentAudioObj = null;

// =========================================================
// INIZIALIZZAZIONE & LOCALSTORAGE
// =========================================================
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Impossibile leggere localStorage", e);
  }
  importScoreFromUrlIfPresent();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Impossibile salvare in localStorage", e);
  }
}

function getGroupScores() {
  try {
    return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGroupScores(list) {
  localStorage.setItem(GROUP_KEY, JSON.stringify(list));
}

// =========================================================
// NAVIGAZIONE SCHERMATE
// =========================================================
function showView(viewId) {
  stopAudio();
  document.querySelectorAll(".view").forEach((el) => el.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");

  const badge = document.getElementById("player-badge-top");
  if (state.playerName) {
    badge.textContent = `👤 ${state.playerName}`;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function renderBridge() {
  const q = QUIZ_QUESTIONS[state.currentIndex];
  const num = String(q.id).padStart(2, "0");
  const pct = ((state.currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  document.getElementById("bridge-progress-fill").style.width = `${pct}%`;
  document.getElementById("bridge-chapter").textContent = q.chapter;
  document.getElementById("bridge-title").textContent = `Libro — Pagina / Domanda #${num}`;
  document.getElementById("btn-enter-question").textContent = `Vai alla Domanda #${num} →`;

  showView("view-bridge");
}

function renderQuestion() {
  const q = QUIZ_QUESTIONS[state.currentIndex];
  const num = String(q.id).padStart(2, "0");

  document.getElementById("q-chapter").textContent = q.chapter;
  document.getElementById("q-counter").textContent = `#${num} • ${state.currentIndex + 1}/${QUIZ_QUESTIONS.length}`;
  document.getElementById("q-text").textContent = q.text;

  const imgEl = document.getElementById("q-image");
  const fallbackEl = document.getElementById("q-img-fallback");
  imgEl.style.display = "block";
  fallbackEl.classList.add("hidden");
  imgEl.src = q.image;

  document.getElementById("confirm-solution-box").classList.add("hidden");
  document.getElementById("revealed-solution-box").classList.add("hidden");
  document.getElementById("btn-want-solution").classList.remove("hidden");

  const userAns = state.answers[q.id];
  document.getElementById("btn-true").classList.toggle("selected", userAns === true);
  document.getElementById("btn-false").classList.toggle("selected", userAns === false);

  const btnNext = document.getElementById("btn-next");
  btnNext.disabled = typeof userAns !== "boolean";
  btnNext.textContent =
    state.currentIndex === QUIZ_QUESTIONS.length - 1
      ? "Vedi risultato finale 🏁"
      : "Avanti →";

  document.getElementById("btn-prev").disabled = state.currentIndex === 0;

  showView("view-question");
}

// =========================================================
// AUDIO
// =========================================================
function stopAudio() {
  if (currentAudioObj) {
    currentAudioObj.pause();
    currentAudioObj.currentTime = 0;
    currentAudioObj = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  const label = document.getElementById("audio-label");
  if (label) label.textContent = "Ascolta domanda";
}

function toggleAudio() {
  const q = QUIZ_QUESTIONS[state.currentIndex];
  const label = document.getElementById("audio-label");

  if (label.textContent === "Ferma audio") {
    stopAudio();
    return;
  }

  stopAudio();
  label.textContent = "Ferma audio";

  if (q.audioFile) {
    currentAudioObj = new Audio(q.audioFile);
    currentAudioObj.onended = () => stopAudio();
    currentAudioObj.play().catch(() => stopAudio());
  } else if ("speechSynthesis" in window) {
    const utter = new SpeechSynthesisUtterance(q.text);
    utter.lang = "it-IT";
    utter.rate = 1.0;
    utter.onend = () => stopAudio();
    utter.onerror = () => stopAudio();
    window.speechSynthesis.speak(utter);
  } else {
    alert("Audio non supportato su questo browser.");
    stopAudio();
  }
}

// =========================================================
// PUNTEGGIO, BADGE & CLASSIFICA GRUPPO
// =========================================================
function calculateScore() {
  let correct = 0;
  QUIZ_QUESTIONS.forEach((q) => {
    if (state.answers[q.id] === q.answer) correct++;
  });
  return correct;
}

function getBadgeForScore(score, total) {
  const ratio = score / total;
  if (ratio >= 0.85) return { icon: "👑", title: "Mastro Birraio Supremo" };
  if (ratio >= 0.6) return { icon: "🍻", title: "Assaggiatore Esperto" };
  if (ratio >= 0.4) return { icon: "🍺", title: "Bevitore Curioso" };
  return { icon: "🌾", title: "Apprendista del Luppolo" };
}

function upsertPlayerInGroup(name, score, total) {
  const cleanName = (name || "Giocatore").trim();
  const group = getGroupScores();
  const idx = group.findIndex((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  const badge = getBadgeForScore(score, total);
  const entry = { name: cleanName, score, total, icon: badge.icon, title: badge.title };

  if (idx >= 0) {
    group[idx] = entry;
  } else {
    group.push(entry);
  }
  saveGroupScores(group);
  return group;
}

function encodeSharePayload(name, score, total) {
  const raw = `${name}|${score}|${total}`;
  return btoa(encodeURIComponent(raw));
}

function decodeAndAddCode(inputStr) {
  try {
    let token = inputStr.trim();
    if (token.includes("g=")) {
      const url = new URL(token);
      token = url.searchParams.get("g") || "";
    }
    const decoded = decodeURIComponent(atob(token));
    const [name, scoreStr, totalStr] = decoded.split("|");
    const score = parseInt(scoreStr, 10);
    const total = parseInt(totalStr, 10) || QUIZ_QUESTIONS.length;
    if (!name || Number.isNaN(score)) return false;

    upsertPlayerInGroup(name, score, total);
    return true;
  } catch {
    return false;
  }
}

function importScoreFromUrlIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const g = params.get("g");
  if (g) {
    decodeAndAddCode(g);
  }
}

function renderGroupChart() {
  const chart = document.getElementById("group-chart");
  const group = getGroupScores().sort((a, b) => b.score - a.score);

  if (group.length === 0) {
    chart.innerHTML = `<p class="subtitle small">Nessun punteggio salvato nel gruppo.</p>`;
    return;
  }

  chart.innerHTML = group
    .map((p) => {
      const pct = Math.round((p.score / p.total) * 100);
      return `
        <div class="chart-row">
          <div class="chart-row-head">
            <span>${p.icon} ${p.name} <small>(${p.title})</small></span>
            <span>${p.score}/${p.total}</span>
          </div>
          <div class="chart-track">
            <div class="chart-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderReviewList(onlyWrong = false) {
  const container = document.getElementById("review-list");
  const items = QUIZ_QUESTIONS.filter((q) => {
    const isCorrect = state.answers[q.id] === q.answer;
    return onlyWrong ? !isCorrect : true;
  });

  if (items.length === 0) {
    container.innerHTML = `<p class="subtitle small">Nessuna risposta sbagliata: giro perfetto! 🎉</p>`;
    return;
  }

  container.innerHTML = items
    .map((q) => {
      const userAns = state.answers[q.id];
      const isCorrect = userAns === q.answer;
      const num = String(q.id).padStart(2, "0");
      const statusIcon = isCorrect ? "✅" : "❌";
      const userLabel = userAns === true ? "Vero" : userAns === false ? "Falso" : "Non risposto";

      return `
        <details class="review-item ${isCorrect ? "ok" : "ko"}">
          <summary>${statusIcon} #${num} — Hai detto: ${userLabel}</summary>
          <p><strong>Domanda:</strong> ${q.text}</p>
          <p>${q.explanation}</p>
        </details>
      `;
    })
    .join("");
}

function renderSummary() {
  const total = QUIZ_QUESTIONS.length;
  const score = calculateScore();
  const badge = getBadgeForScore(score, total);

  if (state.playerName) {
    upsertPlayerInGroup(state.playerName, score, total);
  }

  document.getElementById("summary-heading").textContent = state.playerName
    ? `Risultato di ${state.playerName}`
    : "Il tuo risultato";
  document.getElementById("player-badge-icon").textContent = badge.icon;
  document.getElementById("player-rank-title").textContent = badge.title;
  document.getElementById("player-score-text").textContent = `${score} / ${total}`;

  renderGroupChart();
  renderReviewList(false);
  showView("view-summary");
}

// =========================================================
// EVENT LISTENERS
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  loadState();

  const nameInput = document.getElementById("player-name");
  if (state.playerName) {
    nameInput.value = state.playerName;
  }

  if (Object.keys(state.answers).length > 0) {
    document.getElementById("btn-resume").classList.remove("hidden");
  }

  document.getElementById("btn-start").addEventListener("click", () => {
    const name = nameInput.value.trim() || "Giocatore";
    state.playerName = name;
    state.currentIndex = 0;
    state.answers = {};
    saveState();
    renderBridge();
  });

  document.getElementById("btn-resume").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name) state.playerName = name;
    saveState();
    renderBridge();
  });

  document.getElementById("btn-open-group-home").addEventListener("click", () => {
    renderGroupChart();
    renderReviewList(false);
    showView("view-summary");
  });

  document.getElementById("btn-enter-question").addEventListener("click", () => {
    renderQuestion();
  });

  document.getElementById("btn-audio").addEventListener("click", toggleAudio);

  function handleAnswer(val) {
    const q = QUIZ_QUESTIONS[state.currentIndex];
    state.answers[q.id] = val;
    saveState();
    document.getElementById("btn-true").classList.toggle("selected", val === true);
    document.getElementById("btn-false").classList.toggle("selected", val === false);
    document.getElementById("btn-next").disabled = false;
  }

  document.getElementById("btn-true").addEventListener("click", () => handleAnswer(true));
  document.getElementById("btn-false").addEventListener("click", () => handleAnswer(false));

  document.getElementById("btn-want-solution").addEventListener("click", () => {
    document.getElementById("btn-want-solution").classList.add("hidden");
    document.getElementById("confirm-solution-box").classList.remove("hidden");
  });

  document.getElementById("btn-cancel-reveal").addEventListener("click", () => {
    document.getElementById("confirm-solution-box").classList.add("hidden");
    document.getElementById("btn-want-solution").classList.remove("hidden");
  });

  document.getElementById("btn-confirm-reveal").addEventListener("click", () => {
    const q = QUIZ_QUESTIONS[state.currentIndex];
    document.getElementById("confirm-solution-box").classList.add("hidden");
    document.getElementById("revealed-verdict").textContent = q.answer ? "✅ Risposta: VERO" : "❌ Risposta: FALSO";
    document.getElementById("revealed-explanation").textContent = q.explanation;
    document.getElementById("revealed-solution-box").classList.remove("hidden");
  });

  document.getElementById("btn-hide-solution").addEventListener("click", () => {
    document.getElementById("revealed-solution-box").classList.add("hidden");
    document.getElementById("btn-want-solution").classList.remove("hidden");
  });

  document.getElementById("btn-prev").addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      saveState();
      renderBridge();
    }
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    if (state.currentIndex < QUIZ_QUESTIONS.length - 1) {
      state.currentIndex++;
      saveState();
      renderBridge();
    } else {
      renderSummary();
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

  document.getElementById("filter-all").addEventListener("click", () => {
    document.getElementById("filter-all").classList.add("active");
    document.getElementById("filter-wrong").classList.remove("active");
    renderReviewList(false);
  });

  document.getElementById("filter-wrong").addEventListener("click", () => {
    document.getElementById("filter-wrong").classList.add("active");
    document.getElementById("filter-all").classList.remove("active");
    renderReviewList(true);
  });

  document.getElementById("btn-copy-code").addEventListener("click", async () => {
    const total = QUIZ_QUESTIONS.length;
    const score = calculateScore();
    const token = encodeSharePayload(state.playerName || "Giocatore", score, total);
    const shareUrl = `${window.location.origin}${window.location.pathname}?g=${token}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      const fb = document.getElementById("copy-feedback");
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 3000);
    } catch {
      prompt("Copia questo link e invialo al gruppo:", shareUrl);
    }
  });

  document.getElementById("btn-add-friend").addEventListener("click", () => {
    const input = document.getElementById("friend-code-input");
    if (decodeAndAddCode(input.value)) {
      input.value = "";
      renderGroupChart();
    } else {
      alert("Codice o link non valido. Controlla di averlo incollato per intero.");
    }
  });

  document.getElementById("btn-reset-group").addEventListener("click", () => {
    saveGroupScores([]);
    renderGroupChart();
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    state.currentIndex = 0;
    state.answers = {};
    saveState();
    showView("view-welcome");
  });

  // Modale di conferma per il link minuscolo in fondo
  const leaveLink = document.getElementById("leave-site-link");
  const leaveModal = document.getElementById("leave-modal");
  const btnCancelLeave = document.getElementById("btn-cancel-leave");
  const btnConfirmLeave = document.getElementById("btn-confirm-leave");
  let pendingLeaveUrl = "";

  if (leaveLink && leaveModal) {
    leaveLink.addEventListener("click", (e) => {
      e.preventDefault();
      stopAudio();
      pendingLeaveUrl = leaveLink.dataset.targetUrl || leaveLink.href;
      leaveModal.classList.remove("hidden");
    });
  }

  if (btnCancelLeave && leaveModal) {
    btnCancelLeave.addEventListener("click", () => {
      pendingLeaveUrl = "";
      leaveModal.classList.add("hidden");
    });
  }

  if (btnConfirmLeave) {
    btnConfirmLeave.addEventListener("click", () => {
      const target = pendingLeaveUrl;
      leaveModal.classList.add("hidden");
      if (target) {
        window.location.href = target;
      }
    });
  }
});
