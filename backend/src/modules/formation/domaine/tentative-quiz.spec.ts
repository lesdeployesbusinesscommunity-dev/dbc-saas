import { TentativeQuiz } from './tentative-quiz';

describe('TentativeQuiz (domaine)', () => {
  it('est réussie quand le score atteint exactement le seuil', () => {
    const tentative = TentativeQuiz.creer({ quizId: 'q1', inscriptionId: 'i1', score: 70, seuilReussite: 70 });
    expect(tentative.reussie).toBe(true);
  });

  it("n'est pas réussie quand le score est en dessous du seuil", () => {
    const tentative = TentativeQuiz.creer({ quizId: 'q1', inscriptionId: 'i1', score: 69, seuilReussite: 70 });
    expect(tentative.reussie).toBe(false);
  });

  it('est réussie quand le score dépasse le seuil', () => {
    const tentative = TentativeQuiz.creer({ quizId: 'q1', inscriptionId: 'i1', score: 100, seuilReussite: 70 });
    expect(tentative.reussie).toBe(true);
  });
});
