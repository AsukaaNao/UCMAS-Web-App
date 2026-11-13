export type ExerciseMode = 'blitz' | 'listening';

export type DifficultyPreset = 'easy' | 'medium' | 'hard' | 'custom';

export type OperationType = 'addition' | 'subtraction' | 'mixed';

export type DigitCount = 1 | 2 | 3 | 4 | 5;

export type SequenceLength = 5 | 10 | 15 | 20 | 30 | 50;

export type NumbersAtOnce = 1 | 2 | 3 | 4 | 5;

export type IntervalDuration = number;

export type VoiceGender = 'male' | 'female';

export type VoiceLanguage = 'id' | 'en';

export type AudioSpeed = 'slow' | 'normal' | 'fast';

/**
 * Strict 6-state lifecycle for exercises:
 * 1. idle      - No active exercise; user is configuring settings.
 * 2. preparing - 3-second preparation countdown before numbers appear/play.
 * 3. running   - Numbers are actively being displayed (Blitz) or announced (Listening).
 * 4. completed - All numbers have been presented; timer stopped; awaiting user answer submission.
 * 5. submitted - User has submitted an answer; displaying results & evaluation.
 * 6. cancelled - Exercise was aborted mid-countdown or mid-run.
 */
export type ExerciseState =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'completed'
  | 'submitted'
  | 'cancelled';

export interface ExerciseConfig {
  mode: ExerciseMode;
  difficulty: DifficultyPreset;
  digits: DigitCount;
  sequenceLength: SequenceLength;
  numbersAtOnce: NumbersAtOnce;
  intervalSeconds: IntervalDuration;
  operation: OperationType;
  voice: VoiceGender;
  voiceLanguage: VoiceLanguage;
  audioSpeed: AudioSpeed;
  allowNegativeIntermediate?: boolean;
}

export interface ArithmeticTerm {
  id: string;
  roundIndex: number;
  termIndexInRound: number;
  globalIndex: number;
  operator: '+' | '-';
  magnitude: number;
  signedValue: number;
  displayString: string;
  spokenString: string;
  spokenStringId: string;
  spokenStringEn: string;
  runningTotalAfter: number;
}

export interface ArithmeticRound {
  roundNumber: number; // 1-based
  terms: ArithmeticTerm[];
  roundSubtotalDelta: number;
  runningTotalAfterRound: number;
}

export interface ArithmeticSequence {
  id: string;
  createdAt: number;
  mode: ExerciseMode;
  configSnapshot: ExerciseConfig;
  rounds: ArithmeticRound[];
  allTerms: ArithmeticTerm[];
  correctAnswer: number;
}

export interface ExerciseRecord {
  id: string;
  sequenceId: string;
  mode: ExerciseMode;
  difficulty: DifficultyPreset;
  config: ExerciseConfig;
  sequence: ArithmeticSequence;
  correctAnswer: number;
  submittedAnswer: number;
  isCorrect: boolean;
  accuracy: number; // 100 or 0 for a single exercise
  startTime: number;
  completionTime: number;
  durationMs: number;
  isRetry: boolean;
}
