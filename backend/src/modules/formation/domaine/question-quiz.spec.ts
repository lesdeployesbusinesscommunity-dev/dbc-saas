import { QuestionQuiz } from './question-quiz';

describe('QuestionQuiz (domaine)', () => {
  const question = QuestionQuiz.creer({
    quizId: 'q1',
    enonce: 'Quel est le premier pas pour formaliser son business ?',
    type: 'qcm',
    choix: ['Ouvrir un compte bancaire', 'Immatriculer son entreprise'],
    reponseCorrecte: 'Immatriculer son entreprise',
  });

  it('accepte une réponse exacte', () => {
    expect(question.estCorrecte('Immatriculer son entreprise')).toBe(true);
  });

  it('ignore la casse et les espaces superflus', () => {
    expect(question.estCorrecte('  immatriculer SON entreprise  ')).toBe(true);
  });

  it('refuse une réponse incorrecte', () => {
    expect(question.estCorrecte('Ouvrir un compte bancaire')).toBe(false);
  });
});
