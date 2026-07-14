export interface MineradioGestureStartupToken {
  readonly generation: number;
}

/** Per-runtime generation gate for Mineradio's asynchronous Camera startup. */
export class MineradioGestureStartupLifecycle {
  readonly #isRuntimeDestroyed: () => boolean;
  #generation = 0;
  #starting = false;

  constructor(isRuntimeDestroyed: () => boolean) {
    this.#isRuntimeDestroyed = isRuntimeDestroyed;
  }

  begin(): MineradioGestureStartupToken | null {
    if (this.#starting || this.#isRuntimeDestroyed()) return null;
    this.#starting = true;
    this.#generation += 1;
    return { generation: this.#generation };
  }

  cancel(): void {
    this.#generation += 1;
    this.#starting = false;
  }

  finish(token: MineradioGestureStartupToken): void {
    if (token.generation === this.#generation) this.#starting = false;
  }

  isCurrent(token: MineradioGestureStartupToken): boolean {
    return this.#starting && !this.#isRuntimeDestroyed() && token.generation === this.#generation;
  }
}
