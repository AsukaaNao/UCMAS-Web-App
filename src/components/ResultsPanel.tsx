import React, { useState } from 'react';
import { ExerciseRecord } from '../types/exercise';
import { formatDuration } from '../engine/arithmeticEngine';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface ResultsPanelProps {
  record: ExerciseRecord;
  onRetrySameSequence: () => void;
  onNewExercise: () => void;
  onReturnToSetup: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  record,
  onRetrySameSequence,
  onNewExercise,
  onReturnToSetup,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const difference = record.submittedAnswer - record.correctAnswer;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Exercise Evaluation Results"
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#FFFFFF] text-[#1E293B] flex flex-col justify-center p-3 sm:p-6 overflow-hidden animate-flash-in"
    >
      <div className="max-w-xl w-full max-h-full mx-auto bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-6 flex flex-col justify-between gap-3.5 overflow-hidden">
        {/* Top Evaluation Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {record.isCorrect ? (
              <div className="w-10 h-10 rounded-lg bg-[#00A651]/10 border border-[#00A651]/30 flex items-center justify-center text-[#00A651] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#E31E24]/10 border border-[#E31E24]/30 flex items-center justify-center text-[#E31E24] shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] truncate">
                <span>{record.mode === 'blitz' ? 'Blitz' : 'Listening'}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{record.config.operation}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {record.config.digits}D · {record.config.sequenceLength}R
                </span>
                {record.isRetry && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Retry</span>
                  </>
                )}
              </div>
              <h2
                className={`text-lg sm:text-xl font-bold truncate ${
                  record.isCorrect ? 'text-[#00A651]' : 'text-[#E31E24]'
                }`}
              >
                {record.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onReturnToSetup}
            aria-label="Close results and return to normal setup"
            className="h-9 px-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0054A6] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>

        {/* 2-Column Answer Comparison Cards */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          <div
            className={`p-3 rounded-lg border bg-[#FFFFFF] ${
              record.isCorrect ? 'border-[#00A651]' : 'border-[#E31E24]'
            }`}
          >
            <span className="text-[11px] font-medium text-[#64748B] block">
              Your Answer
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-flash-numeral mt-0.5 block ${
                record.isCorrect ? 'text-[#00A651]' : 'text-[#E31E24]'
              }`}
            >
              {record.submittedAnswer.toLocaleString()}
            </span>
            {!record.isCorrect && (
              <span className="text-[10px] font-mono-tabular text-[#E31E24] block">
                Diff: {difference > 0 ? `+${difference}` : difference}
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-[#64748B] block">
              Correct Answer
            </span>
            <span className="text-xl sm:text-2xl font-bold font-flash-numeral text-[#1E293B] mt-0.5 block">
              {record.correctAnswer.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#64748B] font-mono-tabular block">
              {record.sequence.allTerms.length} numbers
            </span>
          </div>
        </div>

        {/* Compact Result Metrics Row */}
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden shrink-0">
          <div className="grid grid-cols-4 divide-x divide-[#E2E8F0] bg-[#FFFFFF] text-center">
            <div className="p-2">
              <span className="text-[10px] text-[#64748B] block">
                Mode
              </span>
              <span className="text-xs font-semibold text-[#1E293B] block">
                {record.mode === 'blitz' ? 'Blitz' : 'Listening'}
              </span>
            </div>

            <div className="p-2">
              <span className="text-[10px] text-[#64748B] block">
                Result
              </span>
              <span
                className={`text-xs font-semibold block ${
                  record.isCorrect ? 'text-[#00A651]' : 'text-[#E31E24]'
                }`}
              >
                {record.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>

            <div className="p-2">
              <span className="text-[10px] text-[#64748B] block">
                Time
              </span>
              <span className="text-xs font-semibold font-mono-tabular text-[#1E293B] block">
                {formatDuration(record.durationMs)}
              </span>
            </div>

            <div className="p-2">
              <span className="text-[10px] text-[#64748B] block">
                Accuracy
              </span>
              <span className="text-xs font-semibold font-mono-tabular text-[#1E293B] block">
                {record.accuracy}%
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Sequence Breakdown (Scrolls internally only if opened) */}
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden flex flex-col min-h-0">
          <button
            type="button"
            onClick={() => setShowBreakdown((prev) => !prev)}
            className="w-full h-10 px-3.5 bg-[#FFFFFF] hover:bg-[#EFF6FF] flex items-center justify-between text-xs font-semibold text-[#0054A6] transition-colors shrink-0"
          >
            <span>
              {showBreakdown ? 'Hide' : 'Inspect'} Sequence (
              {record.sequence.rounds.length} rounds)
            </span>
            {showBreakdown ? (
              <ChevronUp className="w-4 h-4 text-[#0054A6] shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#0054A6] shrink-0" />
            )}
          </button>

          {showBreakdown && (
            <div className="max-h-36 sm:max-h-44 overflow-y-auto border-t border-[#E2E8F0]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#EFF6FF] text-[#64748B] sticky top-0">
                  <tr>
                    <th className="py-1.5 px-3 font-semibold">Rd</th>
                    <th className="py-1.5 px-3 font-semibold">Numbers</th>
                    <th className="py-1.5 px-3 font-semibold text-right">Delta</th>
                    <th className="py-1.5 px-3 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] font-mono-tabular bg-[#FFFFFF]">
                  {record.sequence.rounds.map((r) => (
                    <tr
                      key={r.roundNumber}
                      className="hover:bg-[#EFF6FF]/50"
                    >
                      <td className="py-1.5 px-3 text-[#64748B]">
                        #{r.roundNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold font-flash-numeral text-[#1E293B]">
                        <span>{r.terms.map((t) => t.displayString).join('   ')}</span>
                        {record.mode === 'listening' && r.terms[0] && (
                          <span className="ml-2 text-[11px] font-sans font-normal text-[#64748B]">
                            (
                            {(record.config.voiceLanguage || 'id') === 'id'
                              ? r.terms[0].spokenStringId || r.terms[0].spokenString
                              : r.terms[0].spokenStringEn || r.terms[0].spokenString}
                            )
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-1.5 px-3 text-right font-flash-numeral ${
                          r.roundSubtotalDelta >= 0
                            ? 'text-[#00A651]'
                            : 'text-[#E31E24]'
                        }`}
                      >
                        {r.roundSubtotalDelta >= 0
                          ? `${r.roundSubtotalDelta}`
                          : `−${Math.abs(r.roundSubtotalDelta)}`}
                      </td>
                      <td className="py-1.5 px-3 text-right font-semibold text-[#1E293B]">
                        {r.runningTotalAfterRound}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Primary Actions: Retry, New Exercise, or Setup */}
        <div className="grid grid-cols-3 gap-2 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={onRetrySameSequence}
            className="h-11 px-3 bg-[#0054A6] hover:bg-[#004482] text-[#FFFFFF] font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>

          <button
            type="button"
            onClick={onNewExercise}
            className="h-11 px-3 bg-[#0054A6] hover:bg-[#004482] text-[#FFFFFF] font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Exercise
          </button>

          <button
            type="button"
            onClick={onReturnToSetup}
            className="h-11 px-3 bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] text-[#0054A6] font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Setup
          </button>
        </div>
      </div>
    </div>
  );
};
