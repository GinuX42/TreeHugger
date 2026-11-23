export const STORAGE_KEY = 'treehugger-exam-v1';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function validId(id) {
  return typeof id === 'string' && /^[\w-]{1,80}$/.test(id) && !Object.hasOwn(Object.prototype, id);
}

export function validateQuestions(value) {
  if (!Array.isArray(value) || value.length > 500) throw Error('Erwartet werden bis zu 500 Fragen.');
  const ids = new Set();
  return value.map(q => {
    if (!isRecord(q) || !validId(q.id) || ids.has(q.id)) throw Error('Jede Frage benötigt eine eindeutige gültige ID.');
    ids.add(q.id);
    for (const key of ['title', 'question', 'solution']) {
      if (typeof q[key] !== 'string' || !q[key].trim() || q[key].length > 20000) throw Error('Titel, Aufgabe und Musterlösung benötigen jeweils 1–20000 Zeichen.');
    }
    if (!['open', 'choice'].includes(q.type) || !Number.isInteger(q.points) || q.points < 1 || q.points > 100) throw Error('Antwortform oder Punktzahl ungültig (1–100).');
    if (q.type === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 8 ||
          q.choices.some(c => typeof c !== 'string' || !c.trim() || c.length > 2000) ||
          new Set(q.choices.map(c => c.trim())).size !== q.choices.length ||
          !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
        throw Error('Auswahlfragen benötigen 2–8 unterschiedliche Antworten und die Nummer der richtigen Antwort.');
      }
    }
    return {
      id: q.id, title: q.title, question: q.question, solution: q.solution,
      type: q.type, points: q.points, choices: q.type === 'choice' ? [...q.choices] : [],
      correctIndex: q.type === 'choice' ? q.correctIndex : null
    };
  });
}
export function startAttempt(questions, ids) {
  const selected = validateQuestions(questions).filter(q => ids.includes(q.id));
  if (!selected.length) throw Error('Wählen Sie mindestens eine Frage aus.');
  return {id: crypto.randomUUID(), questions: selected, answers: {}, grades: {}, submitted: false};
}
export function scoreAttempt(attempt) {
  let earned = 0, maximum = 0, pending = 0;
  for (const q of attempt.questions) {
    maximum += q.points;
    if (q.type === 'choice') earned += attempt.answers[q.id] === q.correctIndex ? q.points : 0;
    else if (Number.isFinite(attempt.grades[q.id]) && attempt.grades[q.id] >= 0 && attempt.grades[q.id] <= q.points) earned += attempt.grades[q.id];
    else pending++;
  }
  return {earned, maximum, pending};
}
export function exportTasks(questions) {
  return {format: 'treehugger-tasks-v1', questions: validateQuestions(questions).map(({solution, correctIndex, ...q}) => q)};
}
export function exportSolutions(questions) {
  return {format: 'treehugger-solutions-v1', questions: validateQuestions(questions).map(q => ({
    id: q.id, title: q.title, question: q.question, solution: q.solution, points: q.points,
    correctAnswer: q.type === 'choice' ? q.choices[q.correctIndex] : null
  }))};
}
export function saveState(storage, state) {
  const raw = JSON.stringify(state);
  storage.setItem(STORAGE_KEY, raw);
  return raw;
}
export function loadState(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const state = JSON.parse(raw);
  const questions = validateQuestions(state.questions);
  if (!Array.isArray(state.attempts) || state.attempts.length > 100) throw Error('Ungültige Anzahl gespeicherter Bearbeitungen.');
  const ids = new Set();
  const attempts = state.attempts.map(a => {
    if (!isRecord(a) || !validId(a.id) || ids.has(a.id) || !isRecord(a.answers) || !isRecord(a.grades) || typeof a.submitted !== 'boolean') throw Error('Ungültige Bearbeitung.');
    ids.add(a.id);
    const snapshot = validateQuestions(a.questions);
    if (!snapshot.length) throw Error('Leere Bearbeitung.');
    const answers = {}, grades = {};
    for (const q of snapshot) {
      const answer = a.answers[q.id], grade = a.grades[q.id];
      if (answer !== undefined) {
        if (q.type === 'open' ? typeof answer !== 'string' || answer.length > 20000 : !Number.isInteger(answer) || answer < 0 || answer >= q.choices.length) throw Error('Ungültige gespeicherte Antwort.');
        answers[q.id] = answer;
      }
      if (grade !== undefined) {
        if (q.type !== 'open' || !a.submitted || !Number.isFinite(grade) || grade < 0 || grade > q.points || !Number.isInteger(grade * 2)) throw Error('Ungültige gespeicherte Bewertung.');
        grades[q.id] = grade;
      }
    }
    return {id: a.id, questions: snapshot, answers, grades, submitted: a.submitted};
  });
  return {questions, attempts};
}
