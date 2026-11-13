/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArithmeticSequence,
  ExerciseConfig,
  ExerciseMode,
  ExerciseRecord,
  ExerciseState,
} from './types/exercise';
import {
  createDefaultConfig,
  evaluateExerciseSubmission,
  formatSpokenTerm,
  generateArithmeticSequence,
  validateExerciseConfig,
} from './engine/arithmeticEngine';
import { audioController } from './controllers/audioController';
import { ConfigDeck } from './components/ConfigDeck';
import { ExerciseStage } from './components/ExerciseStage';
import { ResultsPanel } from './components/ResultsPanel';
import { SessionHistoryView } from './components/SessionHistoryView';
import {
  Eye,
  Headphones,
  History,
} from 'lucide-react';

const STORAGE_KEY_RECORDS = 'ucmas_training_records_v1';

type AppTab = 'blitz' | 'listening' | 'history';

export default function App() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Separate retained custom configurations for Blitz and Listening modes
  const [blitzConfig, setBlitzConfig] = useState<ExerciseConfig>(() =>
    createDefaultConfig('blitz')
  );
  const [listeningConfig, setListeningConfig] = useState<ExerciseConfig>(() =>
    createDefaultConfig('listening')
  );
  const [activeMode, setActiveMode] = useState<ExerciseMode>('blitz');
  const [activeTab, setActiveTab] = useState<AppTab>('blitz');

  const currentConfig = activeMode === 'blitz' ? blitzConfig : listeningConfig;

  const handleUpdateConfig = useCallback((nextConfig: ExerciseConfig) => {
    if (nextConfig.mode === 'blitz') {
      setBlitzConfig(nextConfig);
    } else {
      setListeningConfig(nextConfig);
    }
  }, []);

  // Exercise Manager Finite State Machine
  const [exerciseState, setExerciseState] = useState<ExerciseState>('idle');
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [isBlankFrame, setIsBlankFrame] = useState<boolean>(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const [activeSequence, setActiveSequence] = useState<ArithmeticSequence | null>(null);
  const [isRetryRun, setIsRetryRun] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Timing & Evaluation state
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [latestRecord, setLatestRecord] = useState<ExerciseRecord | null>(null);

  // Session History persisted in localStorage
  const [sessionRecords, setSessionRecords] = useState<ExerciseRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
      return raw ? (JSON.parse(raw) as ExerciseRecord[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(sessionRecords.slice(0, 30)));
    } catch {
      // Ignore storage quota errors
    }
  }, [sessionRecords]);

  // Refs for clean cancellation of all timers and async loops
  const runIdRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);
  const elapsedIntervalRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    if (elapsedIntervalRef.current !== null) {
      window.clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const registerTimeout = useCallback((fn: () => void, delayMs: number): number => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current++;
      clearAllTimers();
      audioController.stopAll();
    };
  }, [clearAllTimers]);

  const handleCancelExercise = useCallback(() => {
    runIdRef.current++;
    clearAllTimers();
    audioController.stopAll();
    setIsSpeakingNow(false);
    setIsBlankFrame(false);
    setExerciseState('cancelled');
  }, [clearAllTimers]);

  const handleReturnToIdle = useCallback(() => {
    runIdRef.current++;
    clearAllTimers();
    audioController.stopAll();
    setIsSpeakingNow(false);
    setIsBlankFrame(false);
    setAudioError(null);
    setValidationError(null);
    setExerciseState('idle');
    setActiveTab(activeMode);
  }, [activeMode, clearAllTimers]);

  const handleSwitchMode = useCallback(
    (targetMode: ExerciseMode) => {
      runIdRef.current++;
      clearAllTimers();
      audioController.stopAll();
      setIsSpeakingNow(false);
      setIsBlankFrame(false);
      setAudioError(null);
      setValidationError(null);
      setActiveMode(targetMode);
      setActiveTab(targetMode);
      setExerciseState('idle');
    },
    [clearAllTimers]
  );

  const launchSequenceExecution = useCallback(
    (sequenceToRun: ArithmeticSequence, retryFlag: boolean) => {
      runIdRef.current++;
      const currentRunId = runIdRef.current;
      clearAllTimers();
      audioController.stopAll();

      setValidationError(null);
      setAudioError(null);
      setActiveTab(sequenceToRun.mode);
      setActiveSequence(sequenceToRun);
      setIsRetryRun(retryFlag);
      setCurrentRoundIndex(0);
      setIsBlankFrame(false);
      setIsSpeakingNow(false);
      setElapsedMs(0);

      // Enter Preparing state (3-second countdown)
      setExerciseState('preparing');
      setCountdownValue(3);
      audioController.playCue('tick');

      registerTimeout(() => {
        if (runIdRef.current !== currentRunId) return;
        setCountdownValue(2);
        audioController.playCue('tick');
      }, 1000);

      registerTimeout(() => {
        if (runIdRef.current !== currentRunId) return;
        setCountdownValue(1);
        audioController.playCue('tick');
      }, 2000);

      registerTimeout(() => {
        if (runIdRef.current !== currentRunId) return;

        const startTs = performance.now();
        setExerciseStartTime(startTs);
        setExerciseState('running');
        audioController.playCue('start');

        elapsedIntervalRef.current = window.setInterval(() => {
          if (runIdRef.current !== currentRunId) return;
          setElapsedMs(Math.max(0, performance.now() - startTs));
        }, 100);

        const cfg = sequenceToRun.configSnapshot;
        const totalRounds = sequenceToRun.rounds.length;
        const intervalMs = cfg.intervalSeconds * 1000;

        if (cfg.mode === 'blitz') {
          const stepBlitzRound = (roundIdx: number) => {
            if (runIdRef.current !== currentRunId) return;

            if (roundIdx >= totalRounds) {
              clearAllTimers();
              const finalElapsed = Math.max(100, performance.now() - startTs);
              setElapsedMs(finalElapsed);
              setIsBlankFrame(false);
              audioController.playCue('finish');
              setExerciseState('completed');
              return;
            }

            setCurrentRoundIndex(roundIdx);
            setIsBlankFrame(false);

            const blankLeadMs = Math.min(70, Math.floor(intervalMs * 0.14));
            const visibleDurationMs = Math.max(120, intervalMs - blankLeadMs);

            registerTimeout(() => {
              if (runIdRef.current !== currentRunId) return;
              if (roundIdx + 1 < totalRounds) {
                setIsBlankFrame(true);
              }
            }, visibleDurationMs);

            registerTimeout(() => {
              if (runIdRef.current !== currentRunId) return;
              stepBlitzRound(roundIdx + 1);
            }, intervalMs);
          };

          stepBlitzRound(0);
        } else {
          if (!audioController.isSpeechSupported()) {
            clearAllTimers();
            setAudioError(
              'Web Speech API is not available in this browser. Please try Chrome, Edge, or Safari.'
            );
            setExerciseState('cancelled');
            return;
          }

          const stepListeningAnnouncement = async (roundIdx: number) => {
            if (runIdRef.current !== currentRunId) return;

            if (roundIdx >= totalRounds) {
              clearAllTimers();
              const finalElapsed = Math.max(100, performance.now() - startTs);
              setElapsedMs(finalElapsed);
              setIsSpeakingNow(false);
              audioController.playCue('finish');
              setExerciseState('completed');
              return;
            }

            setCurrentRoundIndex(roundIdx);
            const term = sequenceToRun.rounds[roundIdx].terms[0];
            const activeLang = cfg.voiceLanguage || 'id';
            const phraseToSpeak = formatSpokenTerm(
              term.operator,
              term.magnitude,
              activeLang
            );

            setIsSpeakingNow(true);
            const speechResult = await audioController.speakText({
              text: phraseToSpeak,
              voiceGender: cfg.voice,
              language: activeLang,
              speed: cfg.audioSpeed,
            });

            if (runIdRef.current !== currentRunId) return;
            setIsSpeakingNow(false);

            if (speechResult.error) {
              clearAllTimers();
              setAudioError(speechResult.error);
              setExerciseState('cancelled');
              return;
            }

            if (roundIdx + 1 < totalRounds) {
              registerTimeout(() => {
                if (runIdRef.current !== currentRunId) return;
                void stepListeningAnnouncement(roundIdx + 1);
              }, intervalMs);
            } else {
              registerTimeout(() => {
                if (runIdRef.current !== currentRunId) return;
                void stepListeningAnnouncement(roundIdx + 1);
              }, 350);
            }
          };

          registerTimeout(() => {
            if (runIdRef.current !== currentRunId) return;
            void stepListeningAnnouncement(0);
          }, 180);
        }
      }, 3000);
    },
    [clearAllTimers, registerTimeout]
  );

  const handleStartNewExercise = useCallback(() => {
    if (exerciseState === 'preparing' || exerciseState === 'running') {
      return;
    }
    const check = validateExerciseConfig(currentConfig);
    if (!check.valid) {
      setValidationError(check.error || 'Invalid configuration.');
      return;
    }
    try {
      const freshSequence = generateArithmeticSequence(currentConfig);
      launchSequenceExecution(freshSequence, false);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Failed to generate sequence.'
      );
    }
  }, [currentConfig, exerciseState, launchSequenceExecution]);

  const handleRetrySameSequence = useCallback(() => {
    if (!activeSequence) return;
    if (exerciseState === 'preparing' || exerciseState === 'running') return;
    launchSequenceExecution(activeSequence, true);
  }, [activeSequence, exerciseState, launchSequenceExecution]);

  const handleReplayHistoricalRecord = useCallback(
    (rec: ExerciseRecord) => {
      if (exerciseState === 'preparing' || exerciseState === 'running') return;
      setActiveMode(rec.mode);
      setActiveTab(rec.mode);
      if (rec.mode === 'blitz') {
        setBlitzConfig(rec.config);
      } else {
        setListeningConfig(rec.config);
      }
      launchSequenceExecution(rec.sequence, true);
    },
    [exerciseState, launchSequenceExecution]
  );

  const handleSubmitAnswer = useCallback(
    (submittedAnswer: number) => {
      if (exerciseState !== 'completed' || !activeSequence) return;

      const completionTimestamp = exerciseStartTime + elapsedMs;
      const record = evaluateExerciseSubmission({
        sequence: activeSequence,
        submittedAnswer,
        startTime: exerciseStartTime,
        completionTime: completionTimestamp,
        isRetry: isRetryRun,
      });

      if (record.isCorrect) {
        audioController.playCue('correct');
      } else {
        audioController.playCue('incorrect');
      }

      setLatestRecord(record);
      setSessionRecords((prev) => [record, ...prev]);
      setExerciseState('submitted');
    },
    [activeSequence, elapsedMs, exerciseStartTime, exerciseState, isRetryRun]
  );

  const isExerciseBusy = exerciseState === 'preparing' || exerciseState === 'running';

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#FFFFFF] text-[#1E293B] select-none">
      {/* Minimal Top App Status Header */}
      <header className="h-12 shrink-0 border-b border-[#E2E8F0] bg-[#FFFFFF] flex items-center">
        <div className="max-w-2xl w-full mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://ucmas.com/wp-content/uploads/2026/04/UCMAS-Logo-HQ.png"
              alt="UCMAS Logo"
              className="h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <span className="text-xs font-medium text-[#64748B] truncate hidden sm:inline">
              Mental Arithmetic Training
            </span>
          </div>

          <span className="text-[11px] font-semibold text-[#0054A6] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
            {activeTab === 'blitz'
              ? 'Blitz Mode'
              : activeTab === 'listening'
                ? 'Listening Mode'
                : 'Session Log'}
          </span>
        </div>
      </header>

      {/* Main Static Viewport Content (Zero Page Scroll) */}
      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-3 sm:px-5 py-2.5 sm:py-3.5 flex flex-col overflow-hidden bg-[#FFFFFF]">
        {activeTab === 'history' ? (
          <SessionHistoryView
            records={sessionRecords}
            onClearHistory={() => setSessionRecords([])}
            onReplayRecordSequence={handleReplayHistoricalRecord}
          />
        ) : (
          <ConfigDeck
            config={currentConfig}
            onChangeConfig={handleUpdateConfig}
            onStartExercise={handleStartNewExercise}
            disabled={isExerciseBusy}
            validationError={validationError}
          />
        )}

        {/* Full-Screen Drill Popup Overlay */}
        {exerciseState === 'submitted' && latestRecord ? (
          <ResultsPanel
            record={latestRecord}
            onRetrySameSequence={handleRetrySameSequence}
            onNewExercise={handleStartNewExercise}
            onReturnToSetup={handleReturnToIdle}
          />
        ) : exerciseState !== 'idle' ? (
          <ExerciseStage
            config={currentConfig}
            exerciseState={exerciseState}
            countdownValue={countdownValue}
            currentRoundIndex={currentRoundIndex}
            isBlankFrame={isBlankFrame}
            sequence={activeSequence}
            elapsedMs={elapsedMs}
            audioError={audioError}
            isSpeakingNow={isSpeakingNow}
            onStartExercise={handleStartNewExercise}
            onCancelExercise={handleCancelExercise}
            onSubmitAnswer={handleSubmitAnswer}
            onReturnToIdle={handleReturnToIdle}
          />
        ) : null}
      </main>

      {/* Native Mobile App Bottom Navigation Bar */}
      <nav
        aria-label="Bottom Navigation Bar"
        className="h-16 shrink-0 border-t border-[#E2E8F0] bg-[#FFFFFF]"
      >
        <div className="max-w-2xl w-full h-full mx-auto grid grid-cols-3 items-center px-3 gap-2">
          <button
            type="button"
            onClick={() => handleSwitchMode('blitz')}
            className={`h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
              activeTab === 'blitz'
                ? 'text-[#0054A6] bg-[#EFF6FF] font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              Blitz Flash
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('listening')}
            className={`h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
              activeTab === 'listening'
                ? 'text-[#0054A6] bg-[#EFF6FF] font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Headphones className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              Listening
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'text-[#0054A6] bg-[#EFF6FF] font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              History ({sessionRecords.length})
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
