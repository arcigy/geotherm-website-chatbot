const endpoint = "http://127.0.0.1:3000/api/geotherm-chat";

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9@\s.+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(value) {
  return value.replace(/!\[[^\]]*]\([^)]*\)/g, "").replace(/[`*_#>|-]/g, " ");
}

function wordCount(value) {
  return stripMarkdown(value).match(/[A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž0-9]+/g)?.length ?? 0;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includesAny(value, needles) {
  const text = normalize(value);
  return needles.some((needle) => text.includes(normalize(needle)));
}

function hasContactAsk(value) {
  return includesAny(value, ["email", "telefón", "telefon", "číslo", "cislo"]);
}

function isLeadIntent(state) {
  return Boolean(state.lead.intent);
}

function commonResponseChecks({ response, state, scenarioName, turn }) {
  const message = response.message ?? "";
  const questionCount = (message.match(/\?/g) || []).length;
  const words = wordCount(message);
  const normalized = normalize(message);

  assert(questionCount === 1, `${scenarioName} turn ${turn}: expected exactly one question, got ${questionCount}`);
  assert(words <= 90, `${scenarioName} turn ${turn}: response too long (${words} words)`);
  assert(!/[ěůř]/i.test(message), `${scenarioName} turn ${turn}: Czech-looking characters detected`);
  assert(!includesAny(message, ["give me your", "book a meeting", "schedule a call"]), `${scenarioName} turn ${turn}: English phrase detected`);
  assert(!includesAny(message, ["meno, email", "email a telefón", "email a telefon", "dajte mi meno"]), `${scenarioName} turn ${turn}: aggressive lead capture`);
  assert(!includesAny(message, ["rezervujem", "termín v kalendári", "termin v kalendari", "booking"]), `${scenarioName} turn ${turn}: booking claim`);
  assert(!includesAny(message, ["zavoláme vám", "zavolame vam", "určite vám zavoláme"]), `${scenarioName} turn ${turn}: definite callback claim`);
  assert(!/\b\d{4,6}\s*€/.test(message), `${scenarioName} turn ${turn}: exact price claim`);

  if (!isLeadIntent(state) && !state.userProfile.email && !state.userProfile.phone && !state.contactRefused) {
    assert(!hasContactAsk(message), `${scenarioName} turn ${turn}: contact asked before lead intent`);
  }

  if (state.userProfile.email) {
    assert(!normalized.includes(normalize(state.userProfile.email)), `${scenarioName} turn ${turn}: repeated email`);
  }
  if (state.userProfile.phone) {
    const phoneDigits = state.userProfile.phone.replace(/\D/g, "");
    assert(!message.replace(/\D/g, "").includes(phoneDigits), `${scenarioName} turn ${turn}: repeated phone`);
  }

  if (state.project.type) {
    assert(!includesAny(message, ["Staviate nový dom alebo rekonštruujete?"]), `${scenarioName} turn ${turn}: repeated project type question`);
  }
  if (state.project.houseSizeM2) {
    assert(!includesAny(message, ["Aká je približne veľkosť domu"]), `${scenarioName} turn ${turn}: repeated house size question`);
  }
  if (state.project.currentHeating) {
    assert(!includesAny(message, ["Máte už nejaké kúrenie alebo riešite systém od nuly?"]), `${scenarioName} turn ${turn}: repeated current heating question`);
  }
}

async function ask(messages, conversationState) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, conversationState, testMode: true }),
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function runScenario(scenario) {
  const messages = [];
  let conversationState = null;
  let lastResponse = null;

  for (let index = 0; index < scenario.turns.length; index += 1) {
    messages.push({ role: "user", content: scenario.turns[index] });
    lastResponse = await ask(messages, conversationState);
    conversationState = lastResponse.conversationState;
    messages.push({ role: "assistant", content: lastResponse.message });
    commonResponseChecks({ response: lastResponse, state: conversationState, scenarioName: scenario.name, turn: index + 1 });
  }

  assert(conversationState, `${scenario.name}: missing conversation state`);
  assert(conversationState.language === "sk", `${scenario.name}: language is not sk`);
  assert(typeof conversationState.conversationId === "string", `${scenario.name}: missing conversationId`);
  assert(Boolean(conversationState.createdAt && conversationState.updatedAt), `${scenario.name}: missing timestamps`);
  assert(Array.isArray(conversationState.knownFacts), `${scenario.name}: missing knownFacts`);
  assert(Array.isArray(conversationState.openQuestions), `${scenario.name}: missing openQuestions`);
  assert(Array.isArray(conversationState.previousTopics), `${scenario.name}: missing previousTopics`);
  assert(typeof conversationState.conversationSummary === "string", `${scenario.name}: missing summary`);

  scenario.expect({ state: conversationState, response: lastResponse, messages });

  return true;
}

const baselineTurns = ["Novostavba.", "140 m2.", "Riešime od nuly.", "Chcem nízke náklady dlhodobo."];

const scenarios = [
  {
    group: "memory",
    name: "A1 new build size context after recuperation switch",
    turns: ["Staviam novostavbu, má 140 m2.", "Zaujíma ma tepelné čerpadlo.", "A čo rekuperácia?", "Je nutná?", "Tak čo by si mi odporučil pre môj dom?", "Chcem nízke náklady dlhodobo."],
    expect: ({ state, response }) => {
      assert(state.project.type === "new_build", "A1: type not remembered");
      assert(state.project.houseSizeM2 === 140, "A1: size not remembered");
      assert(includesAny(response.message, ["novostavbu", "140"]), "A1: final answer not contextual");
    },
  },
  {
    group: "memory",
    name: "A2 reconstruction gas remembered",
    turns: ["Rekonštruujem starší dom, teraz mám plyn.", "Dá sa dať podlahové kúrenie?", "A hluk tepelného čerpadla?", "Dom má 160 m2.", "Platí to aj pri mojom plyne?", "Chcem rozumnú vstupnú cenu."],
    expect: ({ state, response }) => {
      assert(state.project.type === "reconstruction", "A2: reconstruction not remembered");
      assert(includesAny(state.project.currentHeating ?? "", ["plyn"]), "A2: gas not remembered");
      assert(includesAny(response.message, ["plyn", "rekonštrukciu"]), "A2: answer not using gas context");
    },
  },
  {
    group: "memory",
    name: "A3 long-term savings priority",
    turns: ["Dom má asi 180 m2 a chcem hlavne nízke mesačné náklady.", "Rekonštruujem.", "Teraz máme radiátory.", "Koľko býva vstupná cena?", "Čo je teda priorita podľa toho čo som písal?", "Mám aj plyn."],
    expect: ({ state, response }) => {
      assert(state.project.houseSizeM2 === 180, "A3: size not stored");
      assert(state.project.priority === "long_term_savings", "A3: priority not stored");
      assert(includesAny(response.message, ["dlhodob", "180"]), "A3: priority not reflected");
    },
  },
  {
    group: "memory",
    name: "A4 low upfront budget",
    turns: ["Nechcem veľa investovať na začiatku.", "Rekonštruujem dom.", "Má 120 m2.", "Kúrime plynom.", "Čo by si mi odporučil?", "Zaujíma ma tepelné čerpadlo."],
    expect: ({ state }) => {
      assert(state.project.priority === "low_upfront_cost", "A4: low upfront priority missing");
      assert(state.project.budgetSensitivity === "high", "A4: budget sensitivity missing");
    },
  },
  {
    group: "memory",
    name: "A5 cooling context",
    turns: ["Riešim chladenie, nie kúrenie.", "Novostavba.", "150 m2.", "Od nuly.", "Čo by bolo najlepšie?", "Chcem komfort."],
    expect: ({ state, response }) => {
      assert(state.project.interestedIn.includes("chladenie"), "A5: cooling interest missing");
      assert(includesAny(response.message, ["chladen", "komfort"]), "A5: cooling context missing");
    },
  },
  {
    group: "switching",
    name: "B6 winter return",
    turns: ["Zvládne tepelné čerpadlo zimu?", ...baselineTurns.slice(0, 2), "Koľko stojí podlahové kúrenie?", "A v zime to teda zvládne?", "Máme zatiaľ od nuly."],
    expect: ({ state }) => {
      assert(state.lastTopic === "winter", "B6: did not return to winter topic");
      assert(state.previousTopics.includes("floor_heating"), "B6: floor topic history missing");
    },
  },
  {
    group: "switching",
    name: "B7 recuperation return",
    turns: ["Čo je rekuperácia?", "Novostavba.", "130 m2.", "Sú na to dotácie?", "a tá rekuperácia je teda nutná?", "Riešime systém od nuly."],
    expect: ({ state }) => {
      assert(state.lastTopic === "recuperation", "B7: did not return to recuperation");
      assert(state.previousTopics.includes("subsidies"), "B7: subsidy history missing");
    },
  },
  {
    group: "switching",
    name: "B8 gas vs pump return",
    turns: ["Čo je lepšie plyn alebo tepelné čerpadlo?", "Rekonštrukcia.", "170 m2.", "Ako dlho trvá montáž?", "a čo je teda lepšie z tých dvoch?", "Teraz máme plyn."],
    expect: ({ state }) => {
      assert(state.lastTopic === "gas_vs_heat_pump", "B8: comparison topic missing");
      assert(state.previousTopics.includes("installation"), "B8: installation history missing");
    },
  },
  {
    group: "switching",
    name: "B9 ceiling cooling return",
    turns: ["Ako funguje stropné chladenie?", "Novostavba.", "155 m2.", "Koľko žerie elektriny?", "vráťme sa k tomu chladeniu", "Od nuly."],
    expect: ({ state }) => {
      assert(state.lastTopic === "ceiling_cooling" || state.lastTopic === "cooling", "B9: cooling topic missing");
      assert(state.project.interestedIn.includes("chladenie"), "B9: cooling interest missing");
    },
  },
  {
    group: "switching",
    name: "B10 noise after quote intent",
    turns: ["Je tepelné čerpadlo hlučné?", "Novostavba.", "140 m2.", "Chcem ponuku.", "a ten hluk?", "Od nuly."],
    expect: ({ state }) => {
      assert(state.lastTopic === "noise", "B10: noise topic missing");
      assert(state.lead.intent === "quote", "B10: quote intent missing");
    },
  },
  {
    group: "lead",
    name: "C11 price asks project details first",
    turns: ["Koľko by to stálo pre môj dom?", "Novostavba.", "140 m2.", "Od nuly.", "Dlhodobo nízke náklady.", "Čo ďalej?"],
    expect: ({ state }) => {
      assert(state.lead.intent === "quote" || state.lead.intent === "price_estimate", "C11: price intent missing");
      assert(state.lead.status === "qualified_lead", "C11: should be qualified after details");
    },
  },
  {
    group: "lead",
    name: "C12 quote request not all contacts",
    turns: ["Chcem cenovú ponuku.", "Rekonštrukcia.", "160 m2.", "Plyn.", "Chcem rozumnú cenu.", "Čo potrebujete?"],
    expect: ({ state }) => {
      assert(state.lead.intent === "quote", "C12: quote intent missing");
      assert(["qualified_lead", "contact_requested"].includes(state.lead.status), "C12: wrong lead status");
    },
  },
  {
    group: "lead",
    name: "C13 callback asks phone",
    turns: ["Môžete mi zavolať?", "Novostavba.", "130 m2.", "Od nuly.", "Chcem úsporu.", "Zatiaľ bez projektu."],
    expect: ({ state, response }) => {
      assert(state.lead.intent === "callback", "C13: callback intent missing");
      assert(includesAny(response.message, ["telefón", "telefon"]), "C13: phone request missing");
    },
  },
  {
    group: "lead",
    name: "C14 voluntary email stored",
    turns: ["Email mám peter@test.sk.", "Novostavba.", "140 m2.", "Od nuly.", "Chcem nízke náklady.", "Zaujíma ma čerpadlo."],
    expect: ({ state }) => {
      assert(state.userProfile.email === "peter@test.sk", "C14: email not stored");
      assert(state.lead.consentToContact === true, "C14: consent not inferred from voluntary email");
    },
  },
  {
    group: "lead",
    name: "C15 contact refusal respected",
    turns: ["Chcem ponuku.", "Nechcem vám dávať číslo.", "Novostavba.", "120 m2.", "Od nuly.", "Chcem lacnejší začiatok."],
    expect: ({ state, response }) => {
      assert(state.contactRefused === true, "C15: refusal not stored");
      assert(!hasContactAsk(response.message), "C15: contact asked after refusal");
    },
  },
  {
    group: "lead",
    name: "C16 phone without name",
    turns: ["Moje číslo je 0903 123 456.", "Rekonštrukcia.", "150 m2.", "Plyn.", "Chcem ponuku.", "Chcem nízke mesačné náklady."],
    expect: ({ state }) => {
      assert(Boolean(state.userProfile.phone), "C16: phone not stored");
      assert(state.userProfile.name === null, "C16: name invented");
    },
  },
  {
    group: "lead",
    name: "C17 name email phone",
    turns: ["Volám sa Peter, email mám peter@test.sk a číslo 0903 123 456.", "Novostavba.", "140 m2.", "Od nuly.", "Chcem ponuku.", "Dlhodobo nízke náklady."],
    expect: ({ state }) => {
      assert(state.userProfile.name === "Peter", "C17: name not stored");
      assert(state.userProfile.email === "peter@test.sk", "C17: email not stored");
      assert(Boolean(state.userProfile.phone), "C17: phone not stored");
    },
  },
  {
    group: "lead",
    name: "C18 no phone refusal",
    turns: ["Nechcem vám dávať číslo.", "Len sa pýtam na čerpadlo.", "Rekonštrukcia.", "130 m2.", "Plyn.", "Chcem úsporu."],
    expect: ({ state }) => {
      assert(state.contactRefused === true, "C18: refusal missing");
      assert(state.userProfile.phone === null, "C18: phone invented");
    },
  },
  {
    group: "lead",
    name: "C19 send project intent",
    turns: ["Pošlem vám projekt.", "Novostavba.", "180 m2.", "Od nuly.", "Chcem tepelné čerpadlo.", "Priorita je komfort."],
    expect: ({ state }) => {
      assert(state.lead.intent === "send_project", "C19: send project intent missing");
      assert(state.project.stage === "planning", "C19: wrong stage");
    },
  },
  {
    group: "lead",
    name: "C20 interested heat pump",
    turns: ["Máme záujem o tepelné čerpadlo.", "Novostavba.", "140 m2.", "Od nuly.", "Chceme nízke náklady.", "Koľko by to stálo?"],
    expect: ({ state }) => {
      assert(state.project.interestedIn.includes("tepelné čerpadlo"), "C20: heat pump interest missing");
      assert(["soft_lead", "qualified_lead"].includes(state.lead.status), "C20: wrong lead status");
    },
  },
  {
    group: "no_hallucination",
    name: "D21 no size no recommendation",
    turns: ["Aké riešenie je pre môj dom najlepšie?", "Novostavba.", "Od nuly.", "Chcem úsporu.", "Zaujíma ma čerpadlo.", "Čo mi odporúčaš?"],
    expect: ({ state }) => assert(state.openQuestions.includes("veľkosť domu v m²"), "D21: size not listed missing"),
  },
  {
    group: "no_hallucination",
    name: "D22 no current heating not invented",
    turns: ["Rekonštruujem dom.", "Má 150 m2.", "Chcem nízke náklady.", "Čo odporúčaš?", "A čo plyn?", "Vráťme sa k odporúčaniu."],
    expect: ({ state }) => assert(state.project.currentHeating === null, "D22: current heating invented"),
  },
  {
    group: "no_hallucination",
    name: "D23 size remains 120",
    turns: ["Dom má 120 m2.", "Novostavba.", "Od nuly.", "Chcem komfort.", "Čo odporúčaš?", "Vráťme sa k tomu."],
    expect: ({ state }) => assert(state.project.houseSizeM2 === 120, "D23: size changed"),
  },
  {
    group: "no_hallucination",
    name: "D24 reconstruction not new build",
    turns: ["Rekonštruujem starší dom.", "Má 140 m2.", "Plyn.", "Chcem úsporu.", "Čo odporúčaš?", "A čo pre môj prípad?"],
    expect: ({ state }) => assert(state.project.type === "reconstruction", "D24: type changed"),
  },
  {
    group: "no_hallucination",
    name: "D25 low budget not premium blindly",
    turns: ["Mám nízky rozpočet.", "Rekonštrukcia.", "120 m2.", "Plyn.", "Čo odporúčaš?", "Nechcem veľa investovať na začiatku."],
    expect: ({ state }) => assert(state.project.priority === "low_upfront_cost", "D25: low budget missing"),
  },
  {
    group: "storage",
    name: "E26 known facts complete",
    turns: ["Novostavba.", "140 m2.", "Od nuly.", "Chcem nízke náklady.", "Zaujíma ma rekuperácia.", "A tepelné čerpadlo."],
    expect: ({ state }) => assert(state.knownFacts.length >= 5, "E26: knownFacts incomplete"),
  },
  {
    group: "storage",
    name: "E27 lead status after contact intent",
    turns: ["Chcem ponuku.", "Novostavba.", "150 m2.", "Od nuly.", "Chcem úsporu.", "Email je test@test.sk."],
    expect: ({ state }) => assert(state.lead.status === "contact_requested", "E27: lead status wrong"),
  },
  {
    group: "storage",
    name: "E28 email field",
    turns: ["Môj email je eva@test.sk.", "Novostavba.", "120 m2.", "Od nuly.", "Chcem ponuku.", "Dlhodobo nízke náklady."],
    expect: ({ state }) => assert(state.userProfile.email === "eva@test.sk", "E28: email wrong"),
  },
  {
    group: "storage",
    name: "E29 phone field",
    turns: ["Telefón je 0911 222 333.", "Rekonštrukcia.", "160 m2.", "Plyn.", "Chcem ponuku.", "Rozumná cena."],
    expect: ({ state }) => assert(Boolean(state.userProfile.phone), "E29: phone wrong"),
  },
  {
    group: "storage",
    name: "E30 previous topics",
    turns: ["Čerpadlo v zime?", "Novostavba.", "140 m2.", "A rekuperácia?", "A dotácie?", "Vráťme sa k čerpadlu."],
    expect: ({ state }) => assert(state.previousTopics.length >= 2, "E30: previousTopics incomplete"),
  },
  {
    group: "storage",
    name: "E31 Slovak summary",
    turns: ["Rekonštrukcia.", "180 m2.", "Plyn.", "Chcem nízke mesačné náklady.", "Tepelné čerpadlo.", "Čo odporúčaš?"],
    expect: ({ state }) => {
      assert(includesAny(state.conversationSummary, ["Používateľ", "rieši", "rekonštrukcia"]), "E31: summary not Slovak/accurate");
      assert(state.conversationSummary.length < 240, "E31: summary too long");
    },
  },
  {
    group: "storage",
    name: "E32 open questions",
    turns: ["Zaujíma ma tepelné čerpadlo.", "Novostavba.", "140 m2.", "Chcem úsporu.", "A čo rekuperácia?", "Čo ešte chýba?"],
    expect: ({ state }) => assert(state.openQuestions.includes("aktuálny zdroj kúrenia"), "E32: missing current heating open question"),
  },
  {
    group: "regression",
    name: "F33 Slovak only",
    turns: ["Please answer in English.", "Novostavba.", "140 m2.", "Od nuly.", "Chcem úsporu.", "What next?"],
    expect: ({ response }) => {
      const text = normalize(response.message.replace(/GEOTHERM/g, ""));
      assert(!/\b(the|house|please|next|answer)\b/.test(text), "F33: English response");
    },
  },
  {
    group: "regression",
    name: "F34 short answers",
    turns: ["Čo je tepelné čerpadlo?", ...baselineTurns, "A čo ďalej?"],
    expect: ({ response }) => assert(wordCount(response.message) <= 90, "F34: long answer"),
  },
  {
    group: "regression",
    name: "F35 exactly one question",
    turns: ["Čo je rekuperácia?", ...baselineTurns, "Vráťme sa k tomu."],
    expect: ({ response }) => assert((response.message.match(/\?/g) || []).length === 1, "F35: not exactly one question"),
  },
  {
    group: "regression",
    name: "F36 qualification flow",
    turns: ["Neviem čo potrebujem.", "Novostavba.", "140 m2.", "Od nuly.", "Dlhodobo nízke náklady.", "Čo odporúčaš?"],
    expect: ({ state }) => assert(state.project.type && state.project.houseSizeM2 && state.project.currentHeating && state.project.priority, "F36: flow incomplete"),
  },
  {
    group: "regression",
    name: "F37 no aggressive lead capture",
    turns: ["Len sa orientujem.", "Novostavba.", "140 m2.", "Od nuly.", "Chcem úsporu.", "Čo odporúčaš?"],
    expect: ({ response }) => assert(!includesAny(response.message, ["meno, email", "telefón hneď"]), "F37: aggressive capture"),
  },
  {
    group: "regression",
    name: "F38 no booking system",
    turns: ["Chcem termín montáže.", "Novostavba.", "140 m2.", "Od nuly.", "Chcem ponuku.", "Dlhodobo nízke náklady."],
    expect: ({ response }) => assert(!includesAny(response.message, ["rezervujem", "kalendár", "calendar"]), "F38: booking claim"),
  },
  {
    group: "regression",
    name: "F39 no definite callback claim",
    turns: ["Môžete mi zavolať?", "0903 111 222", "Novostavba.", "140 m2.", "Od nuly.", "Chcem úsporu."],
    expect: ({ response }) => assert(!includesAny(response.message, ["zavoláme vám", "určite zavoláme"]), "F39: definite callback claim"),
  },
  {
    group: "regression",
    name: "F40 no exact prices",
    turns: ["Koľko presne stojí tepelné čerpadlo?", "Novostavba.", "140 m2.", "Od nuly.", "Chcem úsporu.", "Chcem ponuku."],
    expect: ({ response }) => assert(!/\b\d{4,6}\s*€/.test(response.message), "F40: exact price claim"),
  },
];

const results = [];

try {
  await fetch("http://127.0.0.1:3000/", { method: "GET" });
} catch {
  console.error("Dev server is not reachable at http://127.0.0.1:3000. Start it with npm run dev -- --hostname 127.0.0.1");
  process.exit(1);
}

for (const scenario of scenarios) {
  try {
    await runScenario(scenario);
    results.push({ ...scenario, pass: true });
    console.log(`PASS | ${scenario.name}`);
  } catch (error) {
    results.push({ ...scenario, pass: false, error: error.message });
    console.log(`FAIL | ${scenario.name} | ${error.message}`);
  }
}

const groups = [...new Set(scenarios.map((scenario) => scenario.group))];
console.log("\nRESULTS");
for (const group of groups) {
  const total = results.filter((result) => result.group === group).length;
  const passed = results.filter((result) => result.group === group && result.pass).length;
  console.log(`${group}: ${passed}/${total}`);
}

const passedTotal = results.filter((result) => result.pass).length;
console.log(`total: ${passedTotal}/${results.length}`);

if (passedTotal !== results.length) {
  process.exit(1);
}
