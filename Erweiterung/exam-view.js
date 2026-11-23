import {EXAM_QUESTIONS, initialQuestions} from './exam-bank.js';
import {STORAGE_KEY, validateQuestions, startAttempt, scoreAttempt, exportTasks, exportSolutions, saveState, loadState} from './exam-model.js';

const $ = id => document.getElementById(id);
const selected = new Set();
let state = {questions: initialQuestions(), attempts: []};
let stored;
let damaged = false;
let activeId;
let editId;

function message(text) {
  $('status').textContent = text;
}
function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, handler) {
  const node = element('button', text);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}
try {
  stored = localStorage.getItem(STORAGE_KEY);
  state = loadState(localStorage) ?? state;
} catch (error) {
  damaged = true;
  message('Der lokale Speicher konnte nicht gelesen werden. Eine Sicherung kann importiert werden. ' + error.message);
}

// Keep the previously committed state if a write fails. Detect changes from another tab.
function commit(next, restoring = false) {
  try {
    if (damaged && !restoring) throw Error('Bitte zuerst eine gültige Sicherung importieren.');
    if (localStorage.getItem(STORAGE_KEY) !== stored) throw Error('Ein anderer Tab hat Daten geändert. Laden Sie diese Seite neu.');
    const raw = saveState(localStorage, next);
    stored = raw;
    state = next;
    damaged = false;
    message('Lokal gespeichert.');
    return true;
  } catch (error) {
    message('Änderung nicht gespeichert. ' + error.message);
    return false;
  }
}
function download(name, data) {
  const date = new Date();
  const stamp = [String(date.getFullYear()).slice(-2), date.getMonth() + 1, date.getDate()].map(n => String(n).padStart(2, '0')).join('_');
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  const link = element('a');
  link.href = url;
  link.download = stamp + '_TreeHugger_' + name + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function show(manager) {
  $('manager').hidden = !manager;
  $('runner').hidden = manager;
}
function selectedQuestions() { return state.questions.filter(q => selected.has(q.id)); }
function countSelection() {
  const questions = selectedQuestions();
  $('selected').textContent = questions.length + ' ausgewählt · ' + questions.reduce((sum, q) => sum + q.points, 0) + ' Punkte';
}
function renderBank() {
  const query = $('filter').value.trim().toLocaleLowerCase('de');
  const bank = $('bank');
  bank.replaceChildren();
  for (const q of state.questions.filter(q => (q.title + ' ' + q.question).toLocaleLowerCase('de').includes(query))) {
    const card = element('article');
    const label = element('label');
    const check = element('input');
    check.type = 'checkbox';
    check.checked = selected.has(q.id);
    check.addEventListener('change', () => {
      if (check.checked) selected.add(q.id);
      else selected.delete(q.id);
      countSelection();
    });
    label.append(check, element('strong', q.title));
    card.append(label, element('p', (q.type === 'open' ? 'Offene Antwort' : 'Auswahlantwort') + ' · ' + q.points + ' P.'),
      button('Bearbeiten', () => edit(q)), button('Löschen', () => {
        if (!confirm('Frage aus der Verwaltung löschen? Bereits begonnene Bearbeitungen behalten ihre Kopie.')) return;
        if (commit({...state, questions: state.questions.filter(item => item.id !== q.id)})) {
          selected.delete(q.id);
          if (editId === q.id) $('editor').hidden = true;
          renderBank();
        }
      }));
    bank.append(card);
  }
  if (!bank.childElementCount) bank.append(element('p', 'Keine passenden Fragen.'));
  countSelection();
}
function edit(q) {
  editId = q?.id ?? null;
  for (const key of ['title', 'question', 'solution']) $(key).value = q?.[key] ?? '';
  $('type').value = q?.type ?? 'open';
  $('points').value = q?.points ?? 1;
  $('choices').value = q?.choices.join('\n') ?? '';
  $('correct').value = (q?.correctIndex ?? 0) + 1;
  toggleChoices();
  $('editor').hidden = false;
  $('title').focus();
}
function toggleChoices() {
  $('choiceFields').hidden = $('type').value !== 'choice';
  $('choiceFields').disabled = $('choiceFields').hidden;
}
$('type').addEventListener('change', toggleChoices);
$('editor').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const question = {
      id: editId ?? crypto.randomUUID(), title: $('title').value.trim(),
      question: $('question').value.trim(), solution: $('solution').value.trim(),
      type: $('type').value, points: Number($('points').value),
      choices: $('choices').value.split('\n').map(s => s.trim()).filter(Boolean),
      correctIndex: Number($('correct').value) - 1
    };
    const questions = validateQuestions(editId ? state.questions.map(q => q.id === editId ? question : q) : [...state.questions, question]);
    if (commit({...state, questions})) {
      $('editor').hidden = true;
      renderBank();
    }
  } catch (error) { message(error.message); }
});
$('new').onclick = () => edit();
$('cancel').onclick = () => { $('editor').hidden = true; };
$('filter').oninput = renderBank;
$('manage').onclick = () => show(true);
$('practice').onclick = () => { show(false); renderAttempts(); };
$('chooseExam').onclick = () => {
  selected.clear();
  const known = new Set(EXAM_QUESTIONS.map(q => q.id));
  for (const q of state.questions) if (known.has(q.id)) selected.add(q.id);
  renderBank();
};
$('clear').onclick = () => { selected.clear(); renderBank(); };
for (const [id, name, format] of [['tasks', 'Aufgaben', exportTasks], ['solutions', 'Musterloesungen', exportSolutions]]) {
  $(id).onclick = () => selected.size ? download(name, format(selectedQuestions())) : message('Wählen Sie zuerst Fragen aus.');
}
$('backup').onclick = () => download('Sicherung', {...state, format: 'treehugger-backup-v1'});
$('restore').onchange = async () => {
  const file = $('restore').files[0];
  if (!file) return;
  try {
    if (file.size > 32 * 1024 * 1024) throw Error('Die Sicherung überschreitet 32 MB.');
    const raw = await file.text();
    if (JSON.parse(raw)?.format !== 'treehugger-backup-v1') throw Error('Bitte eine TreeHugger-Sicherung auswählen.');
    const next = loadState({getItem: () => raw});
    if (!confirm('Fragen und Bearbeitungen durch die Sicherung ersetzen?')) return;
    if (commit(next, true)) {
      selected.clear();
      activeId = null;
      $('editor').hidden = true;
      renderBank();
      renderAttempts();
    }
  } catch (error) { message('Import fehlgeschlagen. ' + error.message); }
  finally { $('restore').value = ''; }
};
$('start').onclick = () => {
  try {
    if (state.attempts.length >= 100) throw Error('Das Limit von 100 Bearbeitungen ist erreicht. Exportieren und löschen Sie eine ältere Bearbeitung.');
    const attempt = startAttempt(state.questions, [...selected]);
    if (commit({...state, attempts: [...state.attempts, attempt]})) {
      activeId = attempt.id;
      show(false);
      renderAttempts();
    }
  } catch (error) { message(error.message); }
};
function current() { return state.attempts.find(a => a.id === activeId); }
function updateAttempt(changes) {
  return commit({...state, attempts: state.attempts.map(a => a.id === activeId ? {...a, ...changes} : a)});
}
function renderAttempts() {
  const list = $('attempts');
  list.replaceChildren();
  state.attempts.forEach((a, i) => {
    const option = element('option', (i + 1) + '. Bearbeitung · ' + a.questions.length + ' Fragen · ' + (a.submitted ? 'abgegeben' : 'in Arbeit'));
    option.value = a.id;
    list.append(option);
  });
  if (!current()) activeId = state.attempts.at(-1)?.id;
  list.value = activeId ?? '';
  renderAttempt();
}
$('attempts').onchange = () => { activeId = $('attempts').value; renderAttempt(); };
$('deleteAttempt').onclick = () => {
  if (current() && confirm('Diese Bearbeitung und ihre Antworten löschen?') &&
      commit({...state, attempts: state.attempts.filter(a => a.id !== activeId)})) renderAttempts();
};
$('resultExport').onclick = () => {
  const a = current();
  if (a) download('Bearbeitung', {format: 'treehugger-result-v1', id: a.id, submitted: a.submitted, questions: exportTasks(a.questions).questions, answers: a.answers, grades: a.grades, result: a.submitted ? scoreAttempt(a) : null});
};
function answerField(q, a) {
  if (q.type === 'open') {
    const label = element('label', 'Ihre Antwort');
    const input = element('textarea');
    input.rows = 4;
    input.maxLength = 20000;
    input.value = a.answers[q.id] ?? '';
    input.disabled = a.submitted;
    input.oninput = () => updateAttempt({answers: {...current().answers, [q.id]: input.value}});
    label.append(input);
    return label;
  }
  const field = element('fieldset');
  field.append(element('legend', 'Wählen Sie eine Antwort.'));
  q.choices.forEach((choice, i) => {
    const label = element('label');
    const radio = element('input');
    radio.type = 'radio';
    radio.name = q.id;
    radio.checked = a.answers[q.id] === i;
    radio.disabled = a.submitted;
    radio.onchange = () => updateAttempt({answers: {...current().answers, [q.id]: i}});
    label.append(radio, element('span', choice));
    field.append(label);
  });
  return field;
}
function scoreText() {
  const score = scoreAttempt(current());
  return score.earned + ' von ' + score.maximum + ' Punkten · ' + (score.pending ? score.pending + ' offene Antworten ausstehend' : 'Bewertung vollständig');
}
function solutionCard(q, a, summary) {
  const section = element('section');
  section.className = 'solution';
  section.append(element('h4', 'Musterlösung'), element('pre', q.solution));
  if (q.type === 'choice') {
    section.append(element('p', 'Richtige Antwort: ' + q.choices[q.correctIndex]), element('p', (a.answers[q.id] === q.correctIndex ? q.points : 0) + ' Punkte'));
    return section;
  }
  const label = element('label', 'Selbstbewertung (0–' + q.points + ' Punkte)');
  const grade = element('input');
  Object.assign(grade, {type: 'number', min: '0', max: String(q.points), step: '0.5', value: a.grades[q.id] ?? ''});
  grade.onchange = () => {
    const grades = {...current().grades};
    if (!grade.validity.valid) { grade.reportValidity(); return; }
    if (grade.value === '') delete grades[q.id];
    else grades[q.id] = grade.valueAsNumber;
    if (updateAttempt({grades})) summary.textContent = scoreText();
  };
  label.append(grade);
  section.append(label);
  return section;
}
function renderAttempt() {
  const a = current();
  const box = $('attempt');
  box.replaceChildren();
  $('resultExport').disabled = $('deleteAttempt').disabled = !a;
  if (!a) { box.append(element('p', 'Wählen Sie in der Fragenverwaltung Aufgaben aus und starten Sie eine Bearbeitung.')); return; }
  const summary = element('p');
  summary.className = 'result';
  summary.setAttribute('aria-live', 'polite');
  if (a.submitted) {
    summary.textContent = scoreText();
    box.append(summary);
  }
  a.questions.forEach((q, i) => {
    const card = element('article');
    card.append(element('h3', (i + 1) + '. ' + q.title + ' · ' + q.points + ' P.'), element('pre', q.question), answerField(q, a));
    if (a.submitted) card.append(solutionCard(q, a, summary));
    box.append(card);
  });
  if (!a.submitted) box.append(button('Bearbeitung abgeben und auswerten', () => {
    if (confirm('Bearbeitung abschließen und Antworten festschreiben?') && updateAttempt({submitted: true})) renderAttempts();
  }));
}
renderBank();
renderAttempts();
