import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_QUESTIONS, initialQuestions} from '../Erweiterung/exam-bank.js';
import {validateQuestions, startAttempt, exportTasks} from '../Erweiterung/exam-model.js';
import {QUIZ_QUESTIONS} from '../Erweiterung/quiz-model.js';

test('new exam is independent of the quiz and all 60 points have a criterion', () => {
  const bank = validateQuestions(initialQuestions());
  assert.equal(bank.length, 66);
  assert.equal(QUIZ_QUESTIONS.length, 54);
  const attempt = startAttempt(bank, EXAM_QUESTIONS.map(q => q.id));
  assert.equal(attempt.questions.length, 12);
  assert.equal(attempt.questions.reduce((sum, q) => sum + q.points, 0), 60);
  for (const q of attempt.questions) {
    assert.equal(q.type, 'open');
    assert.equal(q.points, 5);
    assert.equal(q.solution.split('\n').reduce((sum, line) => sum + Number(line.match(/^(\d+) P\. – /)[1]), 0), 5);
  }
  assert.ok(exportTasks(bank).questions.every(q => !('solution' in q) && !('correctIndex' in q)));
});
