import {DOM_QUESTIONS} from "./quiz-dom.js";
import {CSS_MUTATION_QUESTIONS} from "./quiz-css-mutation.js";

function freezeQuestion(question) {
  return Object.freeze({
    ...question,
    choices: Object.freeze([...question.choices]),
    choiceExplanations: Object.freeze([...question.choiceExplanations]),
    answer: Object.freeze({...question.answer, lines: Object.freeze([...question.answer.lines])})
  });
}

export const QUIZ_QUESTIONS = Object.freeze([...DOM_QUESTIONS, ...CSS_MUTATION_QUESTIONS].map(freezeQuestion));
export const QUIZ_TOPICS = Object.freeze([...new Set(QUIZ_QUESTIONS.map(question => question.topic))]);
export const QUIZ_LEVELS = Object.freeze(["Erstie", "Bachelor", "Master"]);

function shuffleItems(items, random) {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function shuffleAnswers(question, random) {
  const positions = shuffleItems([0, 1, 2, 3], random);
  return freezeQuestion({
    ...question,
    choices: positions.map(index => question.choices[index]),
    choiceExplanations: positions.map(index => question.choiceExplanations[index]),
    correctIndex: positions.indexOf(question.correctIndex)
  });
}

export function createQuizRound({topic = "all", level = "all", limit = "all", shuffle = true, shuffleChoices = false, random = Math.random} = {}) {
  if (topic !== "all" && !QUIZ_TOPICS.includes(topic)) throw new Error("Wählen Sie ein vorhandenes Thema.");
  if (level !== "all" && !QUIZ_LEVELS.includes(level)) throw new Error("Wählen Sie eine vorhandene Stufe.");
  const questions = QUIZ_QUESTIONS.filter(question => (topic === "all" || question.topic === topic) && (level === "all" || question.level === level));
  if (shuffle) shuffleItems(questions, random);
  const count = limit === "all" ? questions.length : Number(limit);
  if (limit !== "all" && (!Number.isSafeInteger(count) || count < 1)) throw new Error("Wählen Sie eine gültige Anzahl von Fragen.");
  const round = questions.slice(0, count);
  return Object.freeze(shuffleChoices ? round.map(question => shuffleAnswers(question, random)) : round);
}
