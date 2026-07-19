// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePokerTableController } from '../src/apps/poker/usePokerTableController';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('usePokerTableController', () => {
  it('does not leak an expired turn clock into the next hand', async () => {
    vi.useFakeTimers();
    render(<ControllerHarness />);

    fireEvent.click(screen.getByRole('button', { name: '弃牌' }));
    await advanceGameTimers(30);
    expect(screen.getByTestId('phase')).toHaveTextContent('settled');

    fireEvent.click(screen.getByRole('button', { name: '下一手' }));
    await advanceGameTimers(3);

    expect(screen.getByTestId('hand')).toHaveTextContent('8422');
    expect(screen.getByTestId('turn')).toHaveTextContent('hero');
    expect(screen.getByTestId('hero-action')).not.toHaveTextContent('弃牌');
    expect(screen.getByTestId('clock')).toHaveTextContent('20');
  });
});

function ControllerHarness() {
  const controller = usePokerTableController();
  return (
    <div>
      <span data-testid="phase">{controller.game.phase}</span>
      <span data-testid="hand">{controller.game.handNumber}</span>
      <span data-testid="turn">{controller.activePlayer?.id ?? 'none'}</span>
      <span data-testid="hero-action">{controller.hero.lastAction}</span>
      <span data-testid="clock">{controller.turnSeconds}</span>
      <button onClick={() => controller.act('fold')} type="button">
        弃牌
      </button>
      <button onClick={controller.nextHand} type="button">
        下一手
      </button>
    </div>
  );
}

async function advanceGameTimers(steps: number) {
  for (let step = 0; step < steps; step += 1) {
    await act(async () => vi.advanceTimersByTimeAsync(500));
  }
}
