import { useState, useCallback, useRef } from 'react';
import type { PlayerStats, CareerProgress, ClueType } from '../data/types';
import type { BadgeState, UnlockedBadge } from '../data/badges';
import { BADGE_DEFINITIONS } from '../data/badges';

function storageKey(clueType: ClueType) {
  return `kuntapeli-badges-${clueType}`;
}

function loadBadges(clueType: ClueType): BadgeState {
  try {
    const raw = localStorage.getItem(storageKey(clueType));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { unlocked: {} };
}

function saveBadges(clueType: ClueType, state: BadgeState) {
  localStorage.setItem(storageKey(clueType), JSON.stringify(state));
}

export function useBadges(clueType: ClueType) {
  const [badgeState, setBadgeState] = useState<BadgeState>(() =>
    loadBadges(clueType),
  );
  const [newlyUnlocked, setNewlyUnlocked] = useState<
    (UnlockedBadge & { badgeId: string }) | null
  >(null);
  const toastQueue = useRef<string[]>([]);
  const clueTypeRef = useRef(clueType);
  clueTypeRef.current = clueType;

  // Reload state when clueType changes
  const prevClueType = useRef(clueType);
  if (clueType !== prevClueType.current) {
    prevClueType.current = clueType;
    setBadgeState(loadBadges(clueType));
  }

  const showNextToast = useCallback((state: BadgeState) => {
    if (toastQueue.current.length === 0) return;
    const id = toastQueue.current.shift()!;
    const unlocked = state.unlocked[id];
    if (unlocked) {
      setNewlyUnlocked({ badgeId: id, ...unlocked });
    }
  }, []);

  const checkBadges = useCallback(
    (stats: PlayerStats, career: CareerProgress) => {
      const ct = clueTypeRef.current;
      const current = loadBadges(ct);
      const newUnlocks: string[] = [];
      const now = new Date().toISOString();

      // Filter stats to current clue type
      const filtered: PlayerStats = {
        ...stats,
        games: stats.games.filter((g) => g.clueType === ct),
      };

      for (const badge of BADGE_DEFINITIONS) {
        if (current.unlocked[badge.id]) continue;
        if (badge.check(filtered, career)) {
          current.unlocked[badge.id] = { id: badge.id, unlockedAt: now };
          newUnlocks.push(badge.id);
        }
      }

      if (newUnlocks.length > 0) {
        saveBadges(ct, current);
        setBadgeState(current);
        toastQueue.current.push(...newUnlocks);
        if (!newlyUnlocked) {
          showNextToast(current);
        }
      }
    },
    [newlyUnlocked, showNextToast],
  );

  const dismissToast = useCallback(() => {
    setNewlyUnlocked(null);
    setTimeout(() => {
      const state = loadBadges(clueTypeRef.current);
      if (toastQueue.current.length > 0) {
        const id = toastQueue.current.shift()!;
        const unlocked = state.unlocked[id];
        if (unlocked) {
          setNewlyUnlocked({ badgeId: id, ...unlocked });
        }
      }
    }, 300);
  }, []);

  return { badgeState, checkBadges, newlyUnlocked, dismissToast };
}
