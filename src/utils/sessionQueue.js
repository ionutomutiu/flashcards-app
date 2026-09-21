/**
 * How many cards to put between a lapse and its retry.
 *
 * Larger than most sessions, so in practice a failed card comes back at the end
 * of the session rather than shortly after — long enough that you recall it
 * rather than still having it in mind.
 */
export const RELEARN_GAP = 150;

/**
 * The session queue after answering the card at `index`.
 *
 * "Again" means you did not know the card, so it comes back in this same
 * session rather than a day later — the interval the scheduler wrote is only
 * what applies if you stop now. The retry goes RELEARN_GAP cards later, or at
 * the end of the queue when fewer than that remain. Getting a card right
 * cancels a retry that is still pending for it.
 */
export function applyRating(queue, index, rating, updatedCard, gap = RELEARN_GAP) {
  const card = queue[index];
  if (!card) return queue;

  if (rating === 'again') {
    const next = [...queue];
    next.splice(Math.min(index + 1 + gap, next.length), 0, updatedCard || card);
    return next;
  }

  return queue.filter((c, i) => i <= index || c.id !== card.id);
}

/**
 * Cards still waiting after `index`, and how many of those are retries.
 *
 * Retries are counted from the card's own `relearning` flag rather than from
 * what this session has already shown, so the count is still right after a
 * reload picks the session back up.
 */
export function queueCounts(queue, index) {
  const ahead = queue.slice(index);
  return {
    left: ahead.length,
    relearning: ahead.filter(c => c.relearning).length,
  };
}
