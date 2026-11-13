import {
  ArithmeticRound,
  ArithmeticSequence,
  ArithmeticTerm,
  AudioSpeed,
  DifficultyPreset,
  DigitCount,
  ExerciseConfig,
  ExerciseMode,
  ExerciseRecord,
  IntervalDuration,
  NumbersAtOnce,
  OperationType,
  SequenceLength,
  VoiceGender,
  VoiceLanguage,
} from '../types/exercise';

export const DIGIT_OPTIONS: DigitCount[] = [1, 2, 3, 4, 5];
export const SEQUENCE_LENGTH_OPTIONS: SequenceLength[] = [5, 10, 15, 20, 30, 50];
export const NUMBERS_AT_ONCE_OPTIONS: NumbersAtOnce[] = [1, 2, 3, 4, 5];
export const INTERVAL_OPTIONS: IntervalDuration[] = [0.5, 1, 1.5, 2, 3];
export const OPERATION_OPTIONS: { value: OperationType; label: string; description: string }[] = [
  { value: 'addition', label: 'Addition', description: 'All terms are positive (+)' },
  { value: 'subtraction', label: 'Subtraction', description: 'Starts with a base value, then subtracts (−)' },
  { value: 'mixed', label: 'Mixed', description: 'Combines addition (+) and subtraction (−)' },
];
export const VOICE_OPTIONS: { value: VoiceGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];
export const VOICE_LANGUAGE_OPTIONS: { value: VoiceLanguage; label: string; shortLabel: string }[] = [
  { value: 'id', label: 'Bahasa Indonesia', shortLabel: 'Indonesia (ID)' },
  { value: 'en', label: 'English', shortLabel: 'English (EN)' },
];
export const AUDIO_SPEED_OPTIONS: { value: AudioSpeed; label: string; rate: number }[] = [
  { value: 'slow', label: 'Slow', rate: 0.82 },
  { value: 'normal', label: 'Normal', rate: 1.05 },
  { value: 'fast', label: 'Fast', rate: 1.35 },
];

/**
 * Converts a non-negative integer (0 - 99,999) into natural Bahasa Indonesia words.
 * Examples:
 * - 5 -> "lima"
 * - 11 -> "sebelas"
 * - 25 -> "dua puluh lima"
 * - 105 -> "seratus lima"
 * - 1250 -> "seribu dua ratus lima puluh"
 */
export function numberToIndonesianWords(num: number): string {
  const n = Math.abs(Math.floor(num));
  if (n === 0) return 'nol';

  const units = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  const convertBelowThousand = (val: number): string => {
    if (val === 0) return '';
    if (val < 12) return units[val];
    if (val < 20) return `${units[val - 10]} belas`;
    if (val < 100) {
      const tens = Math.floor(val / 10);
      const rem = val % 10;
      return `${units[tens]} puluh${rem > 0 ? ` ${units[rem]}` : ''}`;
    }
    const hundreds = Math.floor(val / 100);
    const rem = val % 100;
    const hundredPrefix = hundreds === 1 ? 'seratus' : `${units[hundreds]} ratus`;
    return `${hundredPrefix}${rem > 0 ? ` ${convertBelowThousand(rem)}` : ''}`;
  };

  if (n < 1000) {
    return convertBelowThousand(n);
  }

  const thousands = Math.floor(n / 1000);
  const rem = n % 1000;
  const thousandPrefix =
    thousands === 1 ? 'seribu' : `${convertBelowThousand(thousands)} ribu`;

  return `${thousandPrefix}${rem > 0 ? ` ${convertBelowThousand(rem)}` : ''}`;
}

/**
 * Converts a non-negative integer (0 - 99,999) into natural English words.
 * Examples:
 * - 5 -> "five"
 * - 25 -> "twenty-five"
 * - 105 -> "one hundred five"
 * - 1250 -> "one thousand two hundred fifty"
 */
export function numberToEnglishWords(num: number): string {
  const n = Math.abs(Math.floor(num));
  if (n === 0) return 'zero';

  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  const convertBelowThousand = (val: number): string => {
    if (val === 0) return '';
    if (val < 20) return ones[val];
    if (val < 100) {
      const t = Math.floor(val / 10);
      const r = val % 10;
      return `${tens[t]}${r > 0 ? `-${ones[r]}` : ''}`;
    }
    const h = Math.floor(val / 100);
    const r = val % 100;
    return `${ones[h]} hundred${r > 0 ? ` ${convertBelowThousand(r)}` : ''}`;
  };

  if (n < 1000) {
    return convertBelowThousand(n);
  }

  const th = Math.floor(n / 1000);
  const rem = n % 1000;
  return `${convertBelowThousand(th)} thousand${
    rem > 0 ? ` ${convertBelowThousand(rem)}` : ''
  }`;
}

/**
 * Formats an arithmetic term for spoken announcement in the selected language.
 * Rule confirmed by user:
 * - For '+': speak ONLY the number (no "plus" or "tambah")
 * - For '-': speak "kurang [number]" in Indonesian or "minus [number]" in English
 */
export function formatSpokenTerm(
  operator: '+' | '-',
  magnitude: number,
  language: VoiceLanguage
): string {
  if (language === 'id') {
    const words = numberToIndonesianWords(magnitude);
    return operator === '-' ? `kurang ${words}` : words;
  } else {
    const words = numberToEnglishWords(magnitude);
    return operator === '-' ? `minus ${words}` : words;
  }
}

export interface PresetSpecification {
  digits: DigitCount;
  sequenceLength: SequenceLength;
  numbersAtOnceBlitz: NumbersAtOnce;
  intervalSeconds: IntervalDuration;
  operation: OperationType;
  label: string;
  tagline: string;
}

export const DIFFICULTY_PRESETS: Record<Exclude<DifficultyPreset, 'custom'>, PresetSpecification> = {
  easy: {
    digits: 1,
    sequenceLength: 5,
    numbersAtOnceBlitz: 1,
    intervalSeconds: 2,
    operation: 'addition',
    label: 'Easy',
    tagline: '1 digit · 5 rounds · 2s pace · Addition',
  },
  medium: {
    digits: 2,
    sequenceLength: 10,
    numbersAtOnceBlitz: 2,
    intervalSeconds: 1,
    operation: 'mixed',
    label: 'Medium',
    tagline: '2 digits · 10 rounds · 1s pace · Mixed',
  },
  hard: {
    digits: 3,
    sequenceLength: 20,
    numbersAtOnceBlitz: 3,
    intervalSeconds: 0.5,
    operation: 'mixed',
    label: 'Hard',
    tagline: '3 digits · 20 rounds · 0.5s pace · Mixed',
  },
};

export function createDefaultConfig(
  mode: ExerciseMode,
  currentVoice: VoiceGender = 'female',
  currentSpeed: AudioSpeed = 'normal',
  currentLanguage: VoiceLanguage = 'id'
): ExerciseConfig {
  return {
    mode,
    difficulty: 'custom',
    digits: 1,
    sequenceLength: 10,
    numbersAtOnce: 1,
    intervalSeconds: 1,
    operation: 'addition',
    voice: currentVoice,
    voiceLanguage: currentLanguage,
    audioSpeed: currentSpeed,
    allowNegativeIntermediate: false,
  };
}

export function createConfigFromPreset(
  mode: ExerciseMode,
  _preset: Exclude<DifficultyPreset, 'custom'> = 'easy',
  currentVoice: VoiceGender = 'female',
  currentSpeed: AudioSpeed = 'normal',
  currentLanguage: VoiceLanguage = 'id'
): ExerciseConfig {
  return createDefaultConfig(mode, currentVoice, currentSpeed, currentLanguage);
}

export function detectMatchingPreset(_config: ExerciseConfig): DifficultyPreset {
  return 'custom';
}

export function validateExerciseConfig(config: ExerciseConfig): { valid: boolean; error?: string } {
  if (!DIGIT_OPTIONS.includes(config.digits)) {
    return { valid: false, error: 'Number of digits must be between 1 and 5.' };
  }
  if (!SEQUENCE_LENGTH_OPTIONS.includes(config.sequenceLength)) {
    return { valid: false, error: 'Invalid sequence length selected.' };
  }
  if (config.mode === 'blitz' && !NUMBERS_AT_ONCE_OPTIONS.includes(config.numbersAtOnce)) {
    return { valid: false, error: 'Numbers at once must be between 1 and 5.' };
  }
  if (
    typeof config.intervalSeconds !== 'number' ||
    Number.isNaN(config.intervalSeconds) ||
    config.intervalSeconds < 0.2 ||
    config.intervalSeconds > 5
  ) {
    return { valid: false, error: 'Interval duration must be between 0.2 and 5 seconds.' };
  }
  if (!['addition', 'subtraction', 'mixed'].includes(config.operation)) {
    return { valid: false, error: 'Invalid arithmetic operation.' };
  }
  return { valid: true };
}

function getDigitBounds(digits: DigitCount): { min: number; max: number } {
  if (digits === 1) {
    return { min: 1, max: 9 };
  }
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return { min, max };
}

function randomIntInclusive(min: number, max: number): number {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  if (safeMax <= safeMin) return safeMin;
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

/**
 * Shared Arithmetic Generation Engine
 * Used by both Blitz Calculation and Listening Calculation.
 */
export function generateArithmeticSequence(config: ExerciseConfig): ArithmeticSequence {
  const validation = validateExerciseConfig(config);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid exercise configuration.');
  }

  const effectiveNumbersAtOnce: NumbersAtOnce =
    config.mode === 'blitz' ? config.numbersAtOnce : 1;
  const totalRounds = config.sequenceLength;
  const totalTermsCount = totalRounds * effectiveNumbersAtOnce;
  const { min: minVal, max: maxVal } = getDigitBounds(config.digits);
  const allowNegative = Boolean(config.allowNegativeIntermediate);
  const activeLang: VoiceLanguage = config.voiceLanguage || 'id';

  const rounds: ArithmeticRound[] = [];
  const allTerms: ArithmeticTerm[] = [];
  let runningTotal = 0;
  let globalIndex = 0;

  for (let r = 0; r < totalRounds; r++) {
    const roundTerms: ArithmeticTerm[] = [];
    let roundDelta = 0;

    for (let t = 0; t < effectiveNumbersAtOnce; t++) {
      let operator: '+' | '-' = '+';
      let magnitude = randomIntInclusive(minVal, maxVal);

      if (globalIndex === 0) {
        operator = '+';
        if (config.operation === 'subtraction') {
          const upperHalfMin = Math.max(minVal, Math.floor((minVal + maxVal) / 2));
          magnitude = randomIntInclusive(upperHalfMin, maxVal);
        } else {
          magnitude = randomIntInclusive(minVal, maxVal);
        }
      } else if (config.operation === 'addition') {
        operator = '+';
        magnitude = randomIntInclusive(minVal, maxVal);
      } else if (config.operation === 'subtraction') {
        if (allowNegative) {
          operator = '-';
          magnitude = randomIntInclusive(minVal, maxVal);
        } else if (runningTotal >= minVal) {
          operator = '-';
          const maxSubtractable = Math.min(maxVal, runningTotal);
          magnitude = randomIntInclusive(minVal, maxSubtractable);
        } else {
          operator = '+';
          const replenishMin = Math.max(minVal, Math.floor((minVal + maxVal) / 2));
          magnitude = randomIntInclusive(replenishMin, maxVal);
        }
      } else {
        if (allowNegative) {
          operator = Math.random() < 0.48 ? '-' : '+';
          magnitude = randomIntInclusive(minVal, maxVal);
        } else {
          const canSubtract = runningTotal >= minVal;
          if (canSubtract && Math.random() < 0.48) {
            operator = '-';
            const maxSubtractable = Math.min(maxVal, runningTotal);
            magnitude = randomIntInclusive(minVal, maxSubtractable);
          } else {
            operator = '+';
            magnitude = randomIntInclusive(minVal, maxVal);
          }
        }
      }

      if (allTerms.length > 0 && maxVal > minVal) {
        const prev = allTerms[allTerms.length - 1];
        let attempts = 0;
        while (prev.magnitude === magnitude && prev.operator === operator && attempts < 5) {
          const maxAllowed =
            operator === '-' && !allowNegative ? Math.min(maxVal, runningTotal) : maxVal;
          if (maxAllowed > minVal) {
            magnitude = randomIntInclusive(minVal, maxAllowed);
          }
          attempts++;
        }
      }

      const signedValue = operator === '+' ? magnitude : -magnitude;
      runningTotal += signedValue;
      roundDelta += signedValue;

      // Positive numbers show clean digits without '+' (e.g. 5), negative numbers show '−5'
      const displayString = operator === '+' ? `${magnitude}` : `−${magnitude}`;

      const spokenStringId = formatSpokenTerm(operator, magnitude, 'id');
      const spokenStringEn = formatSpokenTerm(operator, magnitude, 'en');
      const spokenString = activeLang === 'id' ? spokenStringId : spokenStringEn;

      const term: ArithmeticTerm = {
        id: `term-${r + 1}-${t + 1}-${globalIndex}`,
        roundIndex: r,
        termIndexInRound: t,
        globalIndex,
        operator,
        magnitude,
        signedValue,
        displayString,
        spokenString,
        spokenStringId,
        spokenStringEn,
        runningTotalAfter: runningTotal,
      };

      roundTerms.push(term);
      allTerms.push(term);
      globalIndex++;
    }

    rounds.push({
      roundNumber: r + 1,
      terms: roundTerms,
      roundSubtotalDelta: roundDelta,
      runningTotalAfterRound: runningTotal,
    });
  }

  const verifiedTotal = allTerms.reduce((acc, item) => acc + item.signedValue, 0);

  if (allTerms.length !== totalTermsCount) {
    throw new Error('Generated sequence length mismatch.');
  }

  return {
    id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    mode: config.mode,
    configSnapshot: {
      ...config,
      numbersAtOnce: effectiveNumbersAtOnce,
      voiceLanguage: activeLang,
    },
    rounds,
    allTerms,
    correctAnswer: verifiedTotal,
  };
}

/**
 * Shared Scoring & Answer Evaluation Engine
 */
export function evaluateExerciseSubmission(params: {
  sequence: ArithmeticSequence;
  submittedAnswer: number;
  startTime: number;
  completionTime: number;
  isRetry: boolean;
}): ExerciseRecord {
  const { sequence, submittedAnswer, startTime, completionTime, isRetry } = params;
  const correctAnswer = sequence.allTerms.reduce((sum, term) => sum + term.signedValue, 0);
  const isCorrect = submittedAnswer === correctAnswer;
  const accuracy = isCorrect ? 100 : 0;
  const durationMs = Math.max(100, completionTime - startTime);

  return {
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sequenceId: sequence.id,
    mode: sequence.mode,
    difficulty: sequence.configSnapshot.difficulty,
    config: sequence.configSnapshot,
    sequence,
    correctAnswer,
    submittedAnswer,
    isCorrect,
    accuracy,
    startTime,
    completionTime,
    durationMs,
    isRetry,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
}
