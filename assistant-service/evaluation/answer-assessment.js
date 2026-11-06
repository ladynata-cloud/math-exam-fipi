import { validateModelAnswer } from '../src/tutor.js';
import { verifyModelMathematics } from '../src/model-math.js';

// Recompute from the actual answer. Never trust a model-supplied score or a
// previously stored validation field. Structure alone has no math pass state.
export function assessAnswer(input, raw) {
  let answer;
  try {
    const { title, text, steps, check } = raw;
    answer = validateModelAnswer({ title, text, steps, check });
  } catch {
    return { structure: 'invalid', mathematics: { status: 'unverified', finalAnswer: 'unverified',
      explanation: 'unverified', mathematicallyVerified: false }, blocksPositiveReview: true };
  }
  const mathematics = verifyModelMathematics(input, answer);
  return { structure: 'valid', mathematics, blocksPositiveReview: mathematics.status === 'failed' };
}
