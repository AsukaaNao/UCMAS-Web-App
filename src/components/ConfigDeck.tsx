import React, { useState } from 'react';
import {
  AUDIO_SPEED_OPTIONS,
  DIGIT_OPTIONS,
  NUMBERS_AT_ONCE_OPTIONS,
  OPERATION_OPTIONS,
  SEQUENCE_LENGTH_OPTIONS,
  VOICE_LANGUAGE_OPTIONS,
  VOICE_OPTIONS,
  createDefaultConfig,
} from '../engine/arithmeticEngine';
import {
  AudioSpeed,
  DigitCount,
  ExerciseConfig,
  NumbersAtOnce,
  OperationType,
  SequenceLength,
  VoiceGender,
  VoiceLanguage,
} from '../types/exercise';
import { audioController } from '../controllers/audioController';
import { Play, Volume2, RotateCcw, Globe } from 'lucide-react';

interface ConfigDeckProps {
  config: ExerciseConfig;
  onChangeConfig: (next: ExerciseConfig) => void;
  onStartExercise: () => void;
  disabled: boolean;
  validationError: string | null;
}

export const ConfigDeck: React.FC<ConfigDeckProps> = ({
  config,
  onChangeConfig,
  onStartExercise,
  disabled,
  validationError,
}) => {
  const [testingVoice, setTestingVoice] = useState(false);

  const updateCustomField = <K extends keyof ExerciseConfig>(
    key: K,
    value: ExerciseConfig[K]
  ) => {
    if (disabled) return;
    onChangeConfig({
      ...config,
      difficulty: 'custom',
      [key]: value,
    });
  };

  const activeLanguage: VoiceLanguage = config.voiceLanguage || 'id';

  const handleTestVoice = async () => {
    if (testingVoice || disabled) return;
    if (!audioController.isSpeechSupported()) return;
    setTestingVoice(true);

    const samplePhrase =
      activeLanguage === 'id'
        ? config.operation === 'addition'
          ? 'dua puluh empat, lima belas, delapan'
          : 'empat puluh lima, kurang dua belas, sembilan belas'
        : config.operation === 'addition'
          ? 'twenty-four, fifteen, eight'
          : 'forty-five, minus twelve, nineteen';

    await audioController.speakText({
      text: samplePhrase,
      voiceGender: config.voice,
      language: activeLanguage,
      speed: config.audioSpeed,
    });
    setTestingVoice(false);
  };

  const handleResetDefault = () => {
    if (disabled) return;
    onChangeConfig(
      createDefaultConfig(
        config.mode,
        config.voice,
        config.audioSpeed,
        activeLanguage
      )
    );
  };

  const totalRounds = config.sequenceLength;
  const effectiveSimultaneous = config.mode === 'blitz' ? config.numbersAtOnce : 1;
  const totalNumbers = totalRounds * effectiveSimultaneous;
  const estimatedDurationSec = (totalRounds * config.intervalSeconds).toFixed(1);

  return (
    <section
      aria-label="Exercise Configuration"
      className="flex-1 min-h-0 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2 overflow-hidden"
    >
      {/* Compact Header Row */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-[#1E293B] truncate">
            {config.mode === 'blitz' ? 'Blitz Flash Setup' : 'Listening Audio Setup'}
          </h2>
          <span className="text-[11px] font-mono-tabular text-[#64748B] shrink-0">
            · {totalRounds}R · {totalNumbers} nums · ~{estimatedDurationSec}s
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetDefault}
          disabled={disabled}
          className="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0054A6] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg active:scale-[0.98] transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
          title="Reset to default settings"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Static Viewport Controls Stack (Fits 100% without scrolling) */}
      <div className="flex-1 min-h-0 flex flex-col justify-evenly gap-1.5">
        {/* 1. Operation Selector (+ Inline Negative Totals Toggle) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] sm:text-xs font-semibold text-[#1E293B]">
              Operation
            </label>
            {config.operation !== 'addition' ? (
              <button
                type="button"
                onClick={() =>
                  updateCustomField(
                    'allowNegativeIntermediate',
                    !config.allowNegativeIntermediate
                  )
                }
                className="text-[11px] font-semibold text-[#0054A6] hover:text-[#004482] hover:underline"
              >
                {config.allowNegativeIntermediate
                  ? 'Rule: Negative totals allowed (Tap to lock ≥ 0)'
                  : 'Rule: Totals stay ≥ 0 (Tap to allow negative)'}
              </button>
            ) : (
              <span className="text-[11px] text-[#64748B]">
                All positive terms
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {OPERATION_OPTIONS.map((op: { value: OperationType; label: string }) => {
              const active = config.operation === op.value;
              return (
                <button
                  key={op.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateCustomField('operation', op.value)}
                  className={`h-9 sm:h-10 px-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                  } disabled:opacity-50`}
                >
                  {op.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Number of Digits (1 - 5) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] sm:text-xs font-semibold text-[#1E293B]">
              Number of Digits
            </label>
            <span className="text-[11px] font-mono-tabular text-[#64748B]">
              {config.digits === 1
                ? '1–9'
                : `${Math.pow(10, config.digits - 1).toLocaleString()}–${(
                    Math.pow(10, config.digits) - 1
                  ).toLocaleString()}`}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {DIGIT_OPTIONS.map((d: DigitCount) => {
              const active = config.digits === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateCustomField('digits', d)}
                  className={`h-9 sm:h-10 px-2 text-xs sm:text-sm font-mono-tabular font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                  } disabled:opacity-50`}
                >
                  {d}D
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Sequence Length (5, 10, 15, 20, 30, 50) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] sm:text-xs font-semibold text-[#1E293B]">
              {config.mode === 'blitz'
                ? 'Sequence Length (Rounds)'
                : 'Sequence Length (Numbers)'}
            </label>
            <span className="text-[11px] font-mono-tabular text-[#64748B]">
              {totalNumbers} total numbers
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {SEQUENCE_LENGTH_OPTIONS.map((len: SequenceLength) => {
              const active = config.sequenceLength === len;
              return (
                <button
                  key={len}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateCustomField('sequenceLength', len)}
                  className={`h-9 sm:h-10 px-1 text-xs sm:text-sm font-mono-tabular font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                  } disabled:opacity-50`}
                >
                  {len}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Display Duration (Horizontal Slider Scrollbar) / Audio Interval */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="duration-slider"
              className="text-[11px] sm:text-xs font-semibold text-[#1E293B]"
            >
              {config.mode === 'blitz' ? 'Display Duration' : 'Audio Interval'}
            </label>
            <span className="text-xs font-mono-tabular font-bold text-[#0054A6] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
              {config.intervalSeconds.toFixed(1)}s per{' '}
              {config.mode === 'blitz' ? 'flash' : 'number'}
            </span>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] space-y-1.5">
            <input
              id="duration-slider"
              type="range"
              min={0.3}
              max={3.0}
              step={0.1}
              disabled={disabled}
              value={config.intervalSeconds}
              onChange={(e) =>
                updateCustomField(
                  'intervalSeconds',
                  Math.round(parseFloat(e.target.value) * 10) / 10
                )
              }
              className="w-full ucmas-slider cursor-pointer disabled:opacity-50"
            />
            <div className="flex items-center justify-between text-[10px] font-mono-tabular text-[#64748B] px-0.5">
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((mark) => (
                <button
                  key={mark}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateCustomField('intervalSeconds', mark)}
                  className={`hover:text-[#0054A6] transition-colors ${
                    Math.abs(config.intervalSeconds - mark) < 0.05
                      ? 'text-[#0054A6] font-bold'
                      : ''
                  }`}
                >
                  {mark.toFixed(1)}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5A. Blitz-specific: Numbers at Once (1 - 5) */}
        {config.mode === 'blitz' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-semibold text-[#1E293B]">
                Numbers Displayed at Once
              </label>
              <span className="text-[11px] text-[#64748B]">
                {config.numbersAtOnce === 1
                  ? 'Single number per flash'
                  : `${config.numbersAtOnce} simultaneous numbers`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {NUMBERS_AT_ONCE_OPTIONS.map((count: NumbersAtOnce) => {
                const active = config.numbersAtOnce === count;
                return (
                  <button
                    key={count}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateCustomField('numbersAtOnce', count)}
                    className={`h-9 sm:h-10 px-2 text-xs sm:text-sm font-mono-tabular font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                    } disabled:opacity-50`}
                  >
                    ×{count}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5B. Listening-specific: Voiceover Language (ID / EN), Voice Gender, and Speed */}
        {config.mode === 'listening' && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-semibold text-[#1E293B] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#0054A6]" />
                Voiceover Language, Gender & Speed
              </label>
              <button
                type="button"
                disabled={disabled || testingVoice}
                onClick={handleTestVoice}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#EFF6FF] text-[11px] font-semibold text-[#0054A6] transition-colors disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {testingVoice
                  ? 'Speaking...'
                  : `Test (${activeLanguage === 'id' ? 'ID' : 'EN'})`}
              </button>
            </div>

            {/* Row 1: Language (Indonesia ID | English EN) + Voice Gender (Female | Male) */}
            <div className="grid grid-cols-4 gap-1.5">
              {VOICE_LANGUAGE_OPTIONS.map((lang) => {
                const active = activeLanguage === lang.value;
                return (
                  <button
                    key={lang.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateCustomField('voiceLanguage', lang.value)}
                    className={`h-9 px-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                    } disabled:opacity-50`}
                  >
                    {lang.shortLabel}
                  </button>
                );
              })}

              {VOICE_OPTIONS.map((v: { value: VoiceGender; label: string }) => {
                const active = config.voice === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateCustomField('voice', v.value)}
                    className={`h-9 px-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                    } disabled:opacity-50`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Announcement Speed (Slow | Normal | Fast) */}
            <div className="grid grid-cols-3 gap-1.5">
              {AUDIO_SPEED_OPTIONS.map((sp: { value: AudioSpeed; label: string }) => {
                const active = config.audioSpeed === sp.value;
                return (
                  <button
                    key={sp.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateCustomField('audioSpeed', sp.value)}
                    className={`h-8 px-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0054A6] border-[#0054A6] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1E293B] hover:bg-[#EFF6FF] hover:border-[#0054A6]/40'
                    } disabled:opacity-50`}
                  >
                    {sp.label} Speed
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E31E24] text-xs font-medium text-[#E31E24] shrink-0"
        >
          {validationError}
        </div>
      )}

      {/* Bottom Launch Button (Anchored inside the static card) */}
      <div className="pt-2.5 border-t border-[#E2E8F0] shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={onStartExercise}
          className="w-full h-12 bg-[#0054A6] hover:bg-[#004482] active:scale-[0.99] text-[#FFFFFF] font-semibold text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          Start {config.mode === 'blitz' ? 'Blitz' : 'Listening'} Drill
          {config.mode === 'listening' ? ` (${activeLanguage.toUpperCase()})` : ''}
        </button>
      </div>
    </section>
  );
};
