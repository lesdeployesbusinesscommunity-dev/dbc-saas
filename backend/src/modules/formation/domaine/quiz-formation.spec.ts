import { QuizFormation, corrigerQuiz, sansReponses, validerQuiz } from './quiz-formation';

const quiz: QuizFormation = {
  titre: 'Quiz de validation — Histoire et vision',
  seuil: 70,
  questions: [
    {
      id: 'q1',
      texte: 'Que signifie DBC ?',
      options: [
        { id: 'a', texte: 'Les Déployés Business Community' },
        { id: 'b', texte: 'Digital Business Center' },
      ],
      bonnes: ['a'],
    },
    {
      id: 'q2',
      texte: 'Missions de la DBC (plusieurs réponses)',
      options: [
        { id: 'a', texte: 'Équiper' },
        { id: 'b', texte: 'Connecter' },
        { id: 'c', texte: 'Racheter' },
      ],
      bonnes: ['a', 'b'],
    },
  ],
};

describe('Quiz de formation (domaine)', () => {
  it('exige exactement les bonnes options, ni plus ni moins', () => {
    const correction = corrigerQuiz(quiz, { q1: ['a'], q2: ['a'] });
    expect(correction.parQuestion).toEqual({ q1: true, q2: false });
    expect(correction.pourcentage).toBe(50);
    expect(correction.reussi).toBe(false);
  });

  it('réussit quand le seuil est atteint, quel que soit l’ordre des réponses', () => {
    const correction = corrigerQuiz(quiz, { q1: ['a'], q2: ['b', 'a'] });
    expect(correction).toMatchObject({ bonnes: 2, total: 2, pourcentage: 100, reussi: true });
  });

  it('ne révèle jamais les bonnes réponses au membre', () => {
    const vu = sansReponses(quiz);
    expect(JSON.stringify(vu)).not.toContain('bonnes');
    expect(vu.questions[1]).toMatchObject({ choixMultiple: true });
  });

  it('refuse un quiz incomplet', () => {
    expect(validerQuiz({ ...quiz, questions: [{ ...quiz.questions[0], bonnes: [] }] }).succes).toBe(false);
    expect(validerQuiz(quiz).succes).toBe(true);
  });
});
