import React from 'react';
import { ExerciseRecord } from '../types/exercise';
import { formatDuration } from '../engine/arithmeticEngine';
import { CheckCircle2, XCircle, Trash2, RotateCcw } from 'lucide-react';

interface SessionHistoryViewProps {
  records: ExerciseRecord[];
  onClearHistory: () => void;
  onReplayRecordSequence: (record: ExerciseRecord) => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  records,
  onClearHistory,
  onReplayRecordSequence,
}) => {
  const totalExercises = records.length;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const averageAccuracy =
    totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;

  return (
    <section
      aria-label="Practice Session Log"
      className="flex-1 min-h-0 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col gap-3 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2.5 shrink-0">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">
            Session Log & Stats
          </h2>
          <p className="text-[11px] text-[#64748B]">
            <span>{totalExercises} drills</span>
            <span aria-hidden="true"> · </span>
            <span>{correctCount} correct</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono-tabular">{averageAccuracy}% accuracy</span>
          </p>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0054A6] hover:text-[#E31E24] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-xs text-[#64748B] px-4">
          No completed drills yet. Complete a Blitz or Listening sequence to track your accuracy and speed.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#E2E8F0] pr-1">
          {records.slice(0, 20).map((rec) => (
            <div
              key={rec.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    rec.isCorrect
                      ? 'bg-[#00A651]/10 border-[#00A651]/30 text-[#00A651]'
                      : 'bg-[#E31E24]/10 border-[#E31E24]/30 text-[#E31E24]'
                  }`}
                >
                  {rec.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1E293B] truncate">
                    <span className="capitalize">{rec.mode}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="capitalize">{rec.config.operation}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-tabular">
                      {rec.config.digits}D · {rec.config.sequenceLength}R ·{' '}
                      {formatDuration(rec.durationMs)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-[#64748B]">
                    Ans:{' '}
                    <strong className="text-[#1E293B]">
                      {rec.submittedAnswer}
                    </strong>{' '}
                    (Correct: {rec.correctAnswer})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onReplayRecordSequence(rec)}
                className="h-9 px-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0054A6] bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
