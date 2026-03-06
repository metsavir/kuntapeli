import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlayerStats, CareerProgress, ClueType } from '../data/types';
import type { BadgeState, UnlockedBadge } from '../data/badges';
import { BADGE_DEFINITIONS } from '../data/badges';
import { getItem, setItem } from '../utils/storage';

function storageKey(clueType: ClueType) {
  return `kuntapeli-badges-${clueType}`;
}

const EMPTY: BadgeState = { unlocked: {} };

function parseBadges(raw: string | null): BadgeState {
  if (!raw) return EMPTY;
  try {
    return JSON.parse(raw) as BadgeState;
  } catch {
    return EMPTY;
  }
}

export function useBadges(clueType: ClueType) {
  const [badgeState, setBadgeState] = useState<BadgeState>(EMPTY);
  const [newlyUnlocked, setNewlyUnlocked] = useState<
    (UnlockedBadge & { badgeId: string }) | null
  >(null);
  const toastQueue = useRef<string[]>([]);
  const clueTypeRef = useRef(clueType);
  clueTypeRef.current = clueType;

  // Async load from storage
  useEffect(() => {
    getItem(storageKey(clueType)).then((raw) => {
      setBadgeState(parseBadges(raw));
    });
  }, [clueType]);

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
      getItem(storageKey(ct)).then((raw) => {
        const current = parseBadges(raw);
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
          setItem(storageKey(ct), JSON.stringify(current));
          setBadgeState(current);
          toastQueue.current.push(...newUnlocks);
          if (!newlyUnlocked) {
            showNextToast(current);
          }
        }
      });
    },
    [newlyUnlocked, showNextToast],
  );

  const dismissToast = useCallback(() => {
    setNewlyUnlocked(null);
    setTimeout(() => {
      getItem(storageKey(clueTypeRef.current)).then((raw) => {
        const state = parseBadges(raw);
        if (toastQueue.current.length > 0) {
          const id = toastQueue.current.shift()!;
          const unlocked = state.unlocked[id];
          if (unlocked) {
            setNewlyUnlocked({ badgeId: id, ...unlocked });
          }
        }
      });
    }, 300);
  }, []);

  return { badgeState, checkBadges, newlyUnlocked, dismissToast };
}
