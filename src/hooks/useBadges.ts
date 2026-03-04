import { useState, useCallback, useRef } from 'react';
import type { PlayerStats, CareerProgress } from '../data/types';
import type { BadgeState, UnlockedBadge } from '../data/badges';
import { BADGE_DEFINITIONS } from '../data/badges';

const STORAGE_KEY = 'kuntapeli-badges';

function loadBadges(): BadgeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { unlocked: {} };
}

function saveBadges(state: BadgeState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useBadges() {
  const [badgeState, setBadgeState] = useState<BadgeState>(loadBadges);
  const [newlyUnlocked, setNewlyUnlocked] = useState<
    (UnlockedBadge & { badgeId: string }) | null
  >(null);
  const toastQueue = useRef<string[]>([]);

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
      const current = loadBadges();
      const newUnlocks: string[] = [];
      const now = new Date().toISOString();

      for (const badge of BADGE_DEFINITIONS) {
        if (current.unlocked[badge.id]) continue;
        if (badge.check(stats, career)) {
          current.unlocked[badge.id] = { id: badge.id, unlockedAt: now };
          newUnlocks.push(badge.id);
        }
      }

      if (newUnlocks.length > 0) {
        saveBadges(current);
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
    // Show next queued toast after a brief delay
    setTimeout(() => {
      const state = loadBadges();
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
