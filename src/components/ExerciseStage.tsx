import React, { useCallback, useEffect, useState } from 'react';
import {
  ArithmeticRound,
  ArithmeticSequence,
  ExerciseConfig,
  ExerciseState,
} from '../types/exercise';
import { formatDuration } from '../engine/arithmeticEngine';
import {
  Square,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CornerDownLeft,
  Eye,
  Headphones,
  Delete,
  X,
} from 'lucide-react';

interface ExerciseStageProps {
  config: ExerciseConfig;
  exerciseState: ExerciseState;
  countdownValue: number;
  currentRoundIndex: number;
  isBlankFrame: boolean;
  sequence: ArithmeticSequence | null;
  elapsedMs: number;
  audioError: string | null;
  isSpeakingNow: boolean;
  onStartExercise: () => void;
  onCancelExercise: () => void;
  onSubmitAnswer: (numericAnswer: number) => void;
  onReturnToIdle: () => void;
}

export const ExerciseStage: React.FC<ExerciseStageProps> = ({
  config,
  exerciseState,
  countdownValue,
  currentRoundIndex,
  isBlankFrame,
  sequence,
  elapsedMs,
  audioError,
  isSpeakingNow,
  onStartExercise,
  onCancelExercise,
  onSubmitAnswer,
  onReturnToIdle,
}) => {
  const [rawAnswer, setRawAnswer] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (exerciseState === 'completed') {
      setRawAnswer('');
      setInputError(null);
    }
  }, [exerciseState]);

  const submitCurrentAnswer = useCallback(() => {
    if (exerciseState !== 'completed') return;
    const trimmed = rawAnswer.trim().replace(/,/g, '');
    if (!trimmed || trimmed === '-') {
      setInputError('Tap your calculated final answer first.');
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setInputError('Enter a valid whole number.');
      return;
    }
    setInputError(null);
    onSubmitAnswer(parsed);
  }, [exerciseState, onSubmitAnswer, rawAnswer]);

  const handleDigitPress = useCallback((digit: string) => {
    setInputError(null);
    setRawAnswer((prev) => {
      if (prev.replace('-', '').length >= 9) return prev;
      if (prev === '0') return digit;
      if (prev === '-0') return `-${digit}`;
      return prev + digit;
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    setInputError(null);
    setRawAnswer((prev) => {
      if (prev.startsWith('-')) return prev.slice(1);
      return `-${prev}`;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setInputError(null);
    setRawAnswer((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setInputError(null);
    setRawAnswer('');
  }, []);

  useEffect(() => {
    if (exerciseState !== 'completed') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === '-') {
        e.preventDefault();
        handleToggleSign();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitCurrentAnswer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    exerciseState,
    handleBackspace,
    handleClear,
    handleDigitPress,
    handleToggleSign,
    submitCurrentAnswer,
  ]);

  if (exerciseState === 'idle') {
    return null;
  }

  const totalRounds = config.sequenceLength;
  const effectiveSimultaneous = config.mode === 'blitz' ? config.numbersAtOnce : 1;

  const activeRound: ArithmeticRound | undefined =
    sequence && currentRoundIndex >= 0 && currentRoundIndex < sequence.rounds.length
      ? sequence.rounds[currentRoundIndex]
      : undefined;

  const progressPercentage =
    sequence && sequence.rounds.length > 0
      ? Math.min(100, Math.round(((currentRoundIndex + 1) / sequence.rounds.length) * 100))
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full-Screen Mental Arithmetic Drill"
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#FFFFFF] text-[#1E293B] flex flex-col justify-between p-3 sm:p-6 overflow-hidden animate-flash-in"
    >
      {/* Full-Screen Popup Header Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5 shrink-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B] min-w-0">
          {config.mode === 'blitz' ? (
            <Eye className="w-4 h-4 text-[#0054A6] shrink-0" />
          ) : (
            <Headphones className="w-4 h-4 text-[#0054A6] shrink-0" />
          )}
          <span className="font-semibold text-[#1E293B] truncate">
            {config.mode === 'blitz'
              ? 'Blitz'
              : `Listening (${(config.voiceLanguage || 'id').toUpperCase()})`}
          </span>
          <span aria-hidden="true">·</span>
          <span className="capitalize shrink-0">{config.operation}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular shrink-0">
            {config.digits}D · {config.intervalSeconds.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(exerciseState === 'running' || exerciseState === 'completed') && (
            <span className="text-xs font-mono-tabular text-[#0054A6] px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#E2E8F0]">
              <strong className="font-semibold">{formatDuration(elapsedMs)}</strong>
            </span>
          )}

          {(exerciseState === 'preparing' || exerciseState === 'running') && (
            <button
              type="button"
              onClick={onCancelExercise}
              className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#E31E24] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToIdle}
            aria-label="Close full-screen drill and return to normal setup"
            className="h-9 px-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0054A6] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Center Stage Content (Zero-Scroll Locked) */}
      <div className="flex-1 min-h-0 max-w-4xl w-full mx-auto flex flex-col items-center justify-center py-2">
        {/* PREPARING STATE (3-Second Countdown - Pure Unboxed Number in UCMAS Blue) */}
        {exerciseState === 'preparing' && (
          <div className="text-center space-y-4 my-auto">
            <p className="text-xs sm:text-sm font-semibold text-[#64748B]">
              Hands ready · Starting in
            </p>
            <div className="py-4 flex items-center justify-center">
              <span
                key={countdownValue}
                className="text-8xl sm:text-9xl font-bold font-flash-numeral text-[#0054A6] animate-flash-in select-none leading-none"
              >
                {countdownValue}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              {config.mode === 'blitz'
                ? `${totalRounds} rounds · ${effectiveSimultaneous} at once`
                : `${totalRounds} spoken numbers (${
                    (config.voiceLanguage || 'id') === 'id'
                      ? 'Bahasa Indonesia'
                      : 'English'
                  })`}
            </p>
          </div>
        )}

        {/* RUNNING STATE - BLITZ MODE (Pure Unboxed Numbers on White Background) */}
        {exerciseState === 'running' && config.mode === 'blitz' && activeRound && (
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B] font-mono-tabular">
              <span>
                Round{' '}
                <strong className="text-[#1E293B]">
                  {currentRoundIndex + 1}
                </strong>{' '}
                of {totalRounds}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {config.numbersAtOnce === 1
                  ? 'Single Flash'
                  : `${config.numbersAtOnce} Simultaneous`}
              </span>
            </div>

            <div className="w-full min-h-[200px] sm:min-h-[280px] flex items-center justify-center">
              {isBlankFrame ? (
                <div className="h-32 w-full" aria-hidden="true" />
              ) : (
                <div
                  key={`round-${activeRound.roundNumber}`}
                  className={`w-full grid gap-6 sm:gap-10 items-center justify-items-center animate-flash-in ${
                    activeRound.terms.length === 1
                      ? 'grid-cols-1'
                      : activeRound.terms.length === 2
                        ? 'grid-cols-2 max-w-2xl mx-auto'
                        : activeRound.terms.length === 3
                          ? 'grid-cols-3 max-w-3xl mx-auto'
                          : activeRound.terms.length === 4
                            ? 'grid-cols-2 sm:grid-cols-4 max-w-4xl mx-auto'
                            : 'grid-cols-2 sm:grid-cols-3 max-w-4xl mx-auto'
                  }`}
                >
                  {activeRound.terms.map((term, idx) => {
                    const sizeClass =
                      activeRound.terms.length === 1
                        ? 'text-7xl sm:text-8xl lg:text-9xl'
                        : activeRound.terms.length === 2
                          ? 'text-5xl sm:text-7xl lg:text-8xl'
                          : activeRound.terms.length === 3
                            ? 'text-4xl sm:text-6xl lg:text-7xl'
                            : 'text-4xl sm:text-5xl lg:text-6xl';

                    return (
                      <span
                        key={term.id}
                        className={`font-bold font-flash-numeral select-none leading-none text-center text-[#1E293B] ${sizeClass} ${
                          activeRound.terms.length === 5 && idx === 4
                            ? 'col-span-2 sm:col-span-1'
                            : ''
                        }`}
                      >
                        {term.displayString}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RUNNING STATE - LISTENING MODE (Simple Blue Audio Controls & Indicators) */}
        {exerciseState === 'running' && config.mode === 'listening' && (
          <div className="w-full max-w-sm text-center space-y-6 my-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl bg-[#EFF6FF] border border-[#E2E8F0] flex items-center justify-center">
              <Volume2
                className={`w-12 h-12 text-[#0054A6] transition-transform duration-150 ${
                  isSpeakingNow ? 'scale-105' : 'scale-95 opacity-75'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#0054A6]">
                {isSpeakingNow
                  ? `Speaking (${
                      (config.voiceLanguage || 'id') === 'id'
                        ? 'Bahasa Indonesia'
                        : 'English'
                    })...`
                  : 'Waiting Interval...'}
              </p>
              <h3 className="text-3xl font-bold font-mono-tabular text-[#1E293B]">
                Number {Math.min(totalRounds, currentRoundIndex + 1)} of {totalRounds}
              </h3>
              <p className="text-xs text-[#64748B]">
                Numbers stay hidden · Calculate in your head
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 h-8" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                <span
                  key={bar}
                  className={`w-2 rounded-full transition-all duration-150 ${
                    isSpeakingNow
                      ? bar % 2 === 0
                        ? 'h-8 bg-[#0054A6]'
                        : 'h-4 bg-[#0054A6]/70'
                      : 'h-2 bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* COMPLETED STATE (Compact Static Keypad fitting 100dvh without scroll) */}
        {exerciseState === 'completed' && (
          <div className="w-full max-w-sm mx-auto bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-2.5 animate-flash-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E293B]">
                Enter Final Result
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A651]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {formatDuration(elapsedMs)}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="none"
                aria-label="Calculated Answer Readout"
                placeholder="0"
                value={rawAnswer}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9-]/g, '');
                  setRawAnswer(cleaned);
                  if (inputError) setInputError(null);
                }}
                className="w-full py-2.5 px-3 text-2xl sm:text-3xl font-bold font-flash-numeral text-center bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#0054A6] rounded-lg text-[#1E293B] focus:outline-none transition-colors"
              />
              {rawAnswer.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-[11px] font-semibold text-[#0054A6] bg-[#EFF6FF] hover:bg-[#E2E8F0] rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {inputError && (
              <p role="alert" className="text-[11px] text-center font-medium text-[#E31E24]">
                {inputError}
              </p>
            )}

            <div className="grid grid-cols-3 gap-1.5 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-11 sm:h-12 rounded-lg bg-[#FFFFFF] hover:bg-[#EFF6FF] active:bg-[#EFF6FF] border border-[#E2E8F0] text-lg sm:text-xl font-bold font-flash-numeral text-[#1E293B] transition-colors"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleToggleSign}
                aria-label="Toggle positive or negative sign"
                className="h-11 sm:h-12 rounded-lg bg-[#EFF6FF] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-base font-bold font-mono-tabular text-[#0054A6] transition-colors"
              >
                ±
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-11 sm:h-12 rounded-lg bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] text-lg sm:text-xl font-bold font-flash-numeral text-[#1E293B] transition-colors"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Backspace"
                className="h-11 sm:h-12 rounded-lg bg-[#EFF6FF] hover:bg-[#E2E8F0] border border-[#E2E8F0] flex items-center justify-center text-[#0054A6] transition-colors"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={submitCurrentAnswer}
                className="flex-1 h-11 bg-[#0054A6] hover:bg-[#004482] text-[#FFFFFF] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                Submit Answer
                <CornerDownLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onReturnToIdle}
                className="h-11 px-3.5 text-xs font-semibold text-[#0054A6] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* CANCELLED STATE */}
        {exerciseState === 'cancelled' && (
          <div className="w-full max-w-sm mx-auto bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 text-center space-y-4 my-auto animate-flash-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#E2E8F0] text-[#0054A6] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {audioError ? 'Audio Interrupted' : 'Drill Stopped'}
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {audioError
                  ? audioError
                  : 'Timers and audio playback were safely stopped.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onStartExercise}
                className="h-11 inline-flex items-center justify-center gap-1.5 px-4 bg-[#0054A6] hover:bg-[#004482] text-[#FFFFFF] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart
              </button>
              <button
                type="button"
                onClick={onReturnToIdle}
                className="h-11 inline-flex items-center justify-center gap-1.5 px-4 bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] text-[#0054A6] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Popup Footer Progress Bar */}
      <div className="max-w-4xl w-full mx-auto pt-2.5 border-t border-[#E2E8F0] shrink-0">
        {exerciseState === 'running' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-mono-tabular">
              <span>Drill Progress</span>
              <span className="text-[#1E293B] font-semibold">
                {currentRoundIndex + 1} / {totalRounds} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0054A6] transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <span className="truncate">
              {exerciseState === 'completed'
                ? 'Tap keypad or type on keyboard to submit'
                : 'Tap Close at top-right anytime to return to setup'}
            </span>
            <span className="font-mono-tabular shrink-0">
              {config.mode === 'blitz'
                ? `${config.numbersAtOnce}×${config.sequenceLength}`
                : `${(config.voiceLanguage || 'id').toUpperCase()} · ${config.voice} · ${
                    config.audioSpeed
                  }`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
