const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const sound = (() => {
  let context;
  let enabled = localStorage.getItem("safetyLabSound") !== "off";

  function getContext() {
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return context;
  }

  function tone(frequency, duration, type = "sine", gain = 0.045, delay = 0) {
    if (!enabled) return;
    const audio = getContext();
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function play(name) {
    if (!enabled) return;
    if (name === "success") {
      tone(523, 0.12, "triangle");
      tone(784, 0.14, "triangle", 0.04, 0.09);
    } else if (name === "error") {
      tone(220, 0.13, "sawtooth", 0.035);
      tone(165, 0.16, "sawtooth", 0.025, 0.1);
    } else if (name === "complete") {
      tone(392, 0.1, "triangle");
      tone(523, 0.1, "triangle", 0.04, 0.08);
      tone(659, 0.16, "triangle", 0.045, 0.16);
    } else {
      tone(330, 0.055, "square", 0.018);
    }
  }

  function setEnabled(value) {
    enabled = value;
    localStorage.setItem("safetyLabSound", enabled ? "on" : "off");
    updateButtons();
  }

  function updateButtons() {
    $$("[data-sound-toggle]").forEach((button) => {
      button.textContent = enabled ? "Sound on" : "Sound off";
      button.setAttribute("aria-pressed", String(enabled));
    });
  }

  return { play, setEnabled, isEnabled: () => enabled, updateButtons };
})();

document.addEventListener("click", (event) => {
  const interactive = event.target.closest("button, a");
  if (!interactive) return;
  if (interactive.matches("[data-sound-toggle]")) {
    sound.setEnabled(!sound.isEnabled());
    sound.play("click");
    return;
  }
  sound.play("click");
});

sound.updateButtons();

const shareItems = [
  { item: "First name", answer: "depends", feedback: "A first name is usually lower risk, but it can become identifying when paired with school, photos, or location." },
  { item: "Favourite colour", answer: "safe", feedback: "This is usually safe because it does not identify where you live, how to contact you, or access an account." },
  { item: "Home address", answer: "unsafe", feedback: "Your address can reveal exactly where you live. Keep it private unless a trusted adult is helping." },
  { item: "School name", answer: "depends", feedback: "A school name can help strangers find your routine, especially if your name or photos are public too." },
  { item: "Phone number", answer: "unsafe", feedback: "Phone numbers can be used to contact, track, or trick you. Do not post them publicly." },
  { item: "Favourite sport", answer: "safe", feedback: "This is normally safe, though a team name plus location can reveal more than expected." },
  { item: "Password", answer: "unsafe", feedback: "Never share passwords. Real services and trusted adults should not ask you to post one." },
  { item: "Pet's name", answer: "depends", feedback: "Pet names can be used in security questions or guessed passwords, so be careful where you share them." },
  { item: "Email address", answer: "depends", feedback: "An email address can invite spam or scams. Share it only where there is a clear reason." },
  { item: "Birthday", answer: "depends", feedback: "A birthday can help identify you or answer security questions. The full date is more risky than just the month." }
];

const passwords = [
  { text: "password", strength: 1 },
  { text: "abc123", strength: 2 },
  { text: "football", strength: 3 },
  { text: "jenny123", strength: 4 },
  { text: "IceCreamRocket42$", strength: 5 },
  { text: "PurpleTiger87!", strength: 6 },
  { text: "VexaNimlo47!", strength: 7 },
  { text: "MivloTarnuZep42$", strength: 8 }
];

const commonPasswordWords = [
  "password",
  "football",
  "soccer",
  "dragon",
  "monkey",
  "qwerty",
  "abc",
  "jenny",
  "school",
  "birthday",
  "ice",
  "cream",
  "rocket",
  "tiger",
  "purple",
  "summer",
  "winter",
  "welcome"
];

const scenarios = [
  {
    title: "Friend request",
    text: "Someone you do not know sends you a friend request online.",
    actions: ["Accept quickly", "Ignore or block", "Send your school"],
    best: 1,
    suggestion: "I would not accept the request. I would ignore, block, or ask a trusted adult because I do not know who is really behind the account."
  },
  {
    title: "Private details",
    text: "A website asks for your full name, home address, and phone number.",
    actions: ["Enter everything", "Check with an adult", "Post it in chat"],
    best: 1,
    suggestion: "I would stop and ask a trusted adult. A website should have a clear reason before collecting private information."
  },
  {
    title: "Free smartphone",
    text: "You receive a message saying you have won a free smartphone if you click a link now.",
    actions: ["Click the link", "Share the link", "Delete or report"],
    best: 2,
    suggestion: "I would not click. It sounds too good to be true and uses pressure, so I would delete, report, or show a trusted adult."
  },
  {
    title: "Photo tag",
    text: "A friend wants to tag you in a public photo that shows your school uniform.",
    actions: ["Say yes", "Ask for private settings", "Add your address"],
    best: 1,
    suggestion: "I would ask them to keep it private or not tag me. Photos can reveal where I go to school and who I spend time with."
  }
];

function initShare() {
  if (!$("#shareItem")) return;
  let shareIndex = 0;
  let shareCorrect = 0;

  function renderShare() {
    const item = shareItems[shareIndex];
    $("#shareItem").textContent = item.item;
    $("#sharePosition").textContent = `Item ${shareIndex + 1} of ${shareItems.length}`;
    $("#shareScore").textContent = shareCorrect;
    $("#shareTotal").textContent = shareItems.length;
    $("#shareBar").style.width = `${(shareIndex / shareItems.length) * 100}%`;
  }

  function setFeedback(title, message, state) {
    const panel = $(".feedback");
    panel.classList.remove("correct", "incorrect");
    if (state) panel.classList.add(state);
    $("#shareFeedbackTitle").textContent = title;
    $("#shareFeedback").textContent = message;
  }

  function answerShare(choice) {
    const item = shareItems[shareIndex];
    const correct = choice === item.answer;
    if (correct) shareCorrect += 1;
    setFeedback(correct ? "Good call" : "Discuss this one", item.feedback, correct ? "correct" : "incorrect");
    sound.play(correct ? "success" : "error");
    shareIndex += 1;
    if (shareIndex >= shareItems.length) {
      $("#shareItem").textContent = "Round complete";
      $("#sharePosition").textContent = "All items sorted";
      $("#shareScore").textContent = shareCorrect;
      $("#shareBar").style.width = "100%";
      setFeedback("Privacy pattern", "The riskiest items identify you, locate you, contact you, or unlock an account. Context can turn a simple fact into personal information.", "correct");
      sound.play("complete");
      return;
    }
    renderShare();
  }

  $$(".choice").forEach((button) => {
    button.addEventListener("click", () => {
      if (shareIndex < shareItems.length) answerShare(button.dataset.choice);
    });
  });

  $("#shareReset").addEventListener("click", () => {
    shareIndex = 0;
    shareCorrect = 0;
    setFeedback("Make a choice", "A good privacy decision often depends on who can see it, why they need it, and whether a trusted adult knows.");
    renderShare();
  });

  renderShare();
}

function initPasswords() {
  if (!$("#passwordList")) return;
  let currentPasswords = [...passwords].sort(() => Math.random() - .5);

  function renderPasswords() {
    const list = $("#passwordList");
    list.innerHTML = "";
    currentPasswords.forEach((password, index) => {
      const row = document.createElement("div");
      row.className = "password-row";
      row.dataset.strength = password.strength;
      row.innerHTML = `
        <span class="rank">${index + 1}</span>
        <span class="password-text">${password.text}</span>
        <span class="move-buttons">
          <button class="icon-button" type="button" aria-label="Move ${password.text} up" data-move="up" data-index="${index}">↑</button>
          <button class="icon-button" type="button" aria-label="Move ${password.text} down" data-move="down" data-index="${index}">↓</button>
        </span>
      `;
      list.appendChild(row);
    });
  }

  function movePassword(index, direction) {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= currentPasswords.length) return;
    [currentPasswords[index], currentPasswords[target]] = [currentPasswords[target], currentPasswords[index]];
    renderPasswords();
  }

  function setRankingFeedback(message, state) {
    const feedback = $("#rankingFeedback");
    feedback.classList.remove("correct", "incorrect");
    feedback.classList.add(state);
    feedback.textContent = message;
  }

  function checkRanking() {
    let correct = 0;
    currentPasswords.forEach((password, index) => {
      if (password.strength === index + 1) correct += 1;
    });
    $("#rankScore").textContent = correct;
    $$(".password-row").forEach((row, index) => {
      row.classList.toggle("correct", Number(row.dataset.strength) === index + 1);
    });
    if (correct === passwords.length) {
      $("#checkRanking").textContent = "Perfect ranking";
      setRankingFeedback("Complete. The strongest examples are longer, mixed, and use made-up chunks instead of obvious dictionary words.", "correct");
      sound.play("complete");
    } else {
      $("#checkRanking").textContent = `${correct} placed correctly`;
      setRankingFeedback(`${correct} are in the right position. Look for length, numbers, symbols, personal clues, and dictionary words.`, "incorrect");
      sound.play("error");
    }
  }

  function testPassword(value) {
    const lowerValue = value.toLowerCase();
    const hasCommonWord = commonPasswordWords.some((word) => lowerValue.includes(word));
    const rules = {
      length: value.length >= 12,
      letters: /[a-z]/.test(value) && /[A-Z]/.test(value),
      numbers: /\d/.test(value),
      symbols: /[^A-Za-z0-9]/.test(value),
      personal: !/(name|birthday|school|password|123|abc|jenny)/i.test(value) && value.length > 0,
      dictionary: value.length > 0 && !hasCommonWord
    };
    const score = Object.values(rules).filter(Boolean).length;
    const labels = ["Very weak", "Weak", "Getting better", "Good", "Strong", "Excellent", "Excellent example"];
    const colors = ["#c7374b", "#c7374b", "#b86908", "#0d8b92", "#14845c", "#14845c", "#14845c"];
    $("#meterFill").style.width = `${Math.max(8, score * 16.7)}%`;
    $("#meterFill").style.background = colors[score];
    $("#meterLabel").textContent = labels[score];
    $$("#checkList li").forEach((li) => li.classList.toggle("met", rules[li.dataset.rule]));
  }

  $("#passwordList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-move]");
    if (!button) return;
    movePassword(Number(button.dataset.index), button.dataset.move);
  });

  $("#checkRanking").addEventListener("click", checkRanking);
  $("#shufflePasswords").addEventListener("click", () => {
    currentPasswords = [...passwords].sort(() => Math.random() - .5);
    $("#rankScore").textContent = "0";
    $("#checkRanking").textContent = "Check ranking";
    setRankingFeedback("Shuffled. Try ranking them again.", "correct");
    renderPasswords();
  });
  $("#passwordInput").addEventListener("input", (event) => testPassword(event.target.value));

  renderPasswords();
  testPassword("");
}

function initScenarios() {
  if (!$("#scenarioTabs")) return;
  let scenarioIndex = 0;

  function renderScenarios() {
    const tabs = $("#scenarioTabs");
    tabs.innerHTML = "";
    scenarios.forEach((scenario, index) => {
      const button = document.createElement("button");
      button.className = `scenario-tab${index === scenarioIndex ? " active" : ""}`;
      button.type = "button";
      button.textContent = scenario.title;
      button.addEventListener("click", () => {
        scenarioIndex = index;
        renderScenarios();
      });
      tabs.appendChild(button);
    });

    const scenario = scenarios[scenarioIndex];
    $("#scenarioCount").textContent = scenarioIndex + 1;
    $("#scenarioTitle").textContent = scenario.title;
    $("#scenarioText").textContent = scenario.text;
    $("#scenarioResponse").value = "";
    $("#scenarioFeedback").classList.remove("correct", "incorrect");
    $("#scenarioFeedback").innerHTML = `<h3>Warning signs</h3><p>Look for pressure, requests for private details, strangers, links, prizes, or anything that makes you feel rushed.</p>`;

    const actions = $("#scenarioActions");
    actions.innerHTML = "";
    scenario.actions.forEach((action, index) => {
      const button = document.createElement("button");
      button.className = "scenario-action";
      button.type = "button";
      button.textContent = action;
      button.addEventListener("click", () => {
        $$("#scenarioActions .scenario-action").forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        const correct = index === scenario.best;
        $("#scenarioFeedback").classList.remove("correct", "incorrect");
        $("#scenarioFeedback").classList.add(correct ? "correct" : "incorrect");
        $("#scenarioFeedback").innerHTML = correct
          ? "<h3>Strong choice</h3><p>This response protects private information and slows the situation down.</p>"
          : "<h3>Check the risk</h3><p>This could share too much, reward a stranger, or make you act before thinking.</p>";
        sound.play(correct ? "success" : "error");
      });
      actions.appendChild(button);
    });
  }

  $("#showSuggestion").addEventListener("click", () => {
    $("#scenarioResponse").value = scenarios[scenarioIndex].suggestion;
    $("#scenarioFeedback").classList.remove("incorrect");
    $("#scenarioFeedback").classList.add("correct");
    $("#scenarioFeedback").innerHTML = "<h3>Model response</h3><p>Use this as a starting point, then say it in your own words.</p>";
    sound.play("success");
  });

  $("#nextScenario").addEventListener("click", () => {
    scenarioIndex = (scenarioIndex + 1) % scenarios.length;
    renderScenarios();
  });

  renderScenarios();
}

function initToolkit() {
  if (!$("#privacyToggles")) return;
  const completed = new Set();

  function updateScore() {
    $("#toolkitScore").textContent = completed.size;
    if (completed.size === 3) sound.play("complete");
  }

  function checkPrivacy() {
    const toggles = $$("#privacyToggles .toggle-row");
    const allGoodOn = toggles
      .filter((toggle) => toggle.dataset.good === "true")
      .every((toggle) => toggle.classList.contains("on"));
    const riskyOff = toggles
      .filter((toggle) => toggle.dataset.good === "false")
      .every((toggle) => !toggle.classList.contains("on"));
    const complete = allGoodOn && riskyOff;
    const feedback = $("#privacyFeedback");
    feedback.classList.remove("correct", "incorrect");
    feedback.classList.add(complete ? "correct" : "incorrect");
    feedback.textContent = complete
      ? "Nice settings check. Private profile, friends-only posts, and tag approval are safer choices."
      : "Keep improving it. Public location should stay off, and protective settings should be on.";
    if (complete) completed.add("privacy");
    sound.play(complete ? "success" : "error");
    updateScore();
  }

  $$("#privacyToggles .toggle-row").forEach((toggle) => {
    if (toggle.dataset.good === "false") toggle.classList.add("risky");
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("on");
      checkPrivacy();
    });
  });

  $$("#spotList .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("found");
      const found = $$("#spotList .chip.found").length;
      const feedback = $("#scamFeedback");
      feedback.classList.remove("correct", "incorrect");
      if (found === 4) {
        feedback.classList.add("correct");
        feedback.textContent = "You spotted every warning sign. This message should be deleted, reported, or shown to a trusted adult.";
        completed.add("scam");
        sound.play("success");
      } else {
        feedback.classList.add("incorrect");
        feedback.textContent = `${found}/4 warning signs found. Look for pressure, prizes, links, and private information requests.`;
      }
      updateScore();
    });
  });

  $$("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-plan]").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      $("#pausePlan").textContent = button.dataset.plan;
      completed.add("plan");
      sound.play("success");
      updateScore();
    });
  });
}

initShare();
initPasswords();
initScenarios();
initToolkit();
