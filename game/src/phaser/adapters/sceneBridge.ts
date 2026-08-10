export type Direction = "up" | "down" | "left" | "right";
export type ActiveAbility = "empPulse" | "aegisWard" | "stratosRun" | "helixTempest";

export type SceneCallbacks = Readonly<{
  onHud: (hud: unknown) => void;
  onEvent: (event: Record<string, unknown>) => void;
  onFinish: (result: unknown) => void;
  onReady?: () => void;
}>;

export interface BattleSceneControls {
  chooseReward(id: string): boolean;
  setVirtualDirection(direction: Direction, active: boolean): void;
  queueDash(): void;
  queueActiveAbility(ability: ActiveAbility): void;
  enterBossRoom(): boolean;
  continueNarrative(): void;
  setSuspended(suspended: boolean): void;
  focus(): void;
}

export class SceneBridge {
  readonly callbacks: SceneCallbacks;
  readonly debugScene: string | null;
  private controls: BattleSceneControls | null = null;

  constructor(callbacks: SceneCallbacks, debugScene: string | null) {
    this.callbacks = callbacks;
    this.debugScene = debugScene;
  }

  attach(controls: BattleSceneControls) {
    this.controls = controls;
    this.callbacks.onReady?.();
  }

  detach(controls: BattleSceneControls) {
    if (this.controls === controls) this.controls = null;
  }

  chooseReward(id: string) {
    return this.controls?.chooseReward(id) ?? false;
  }

  setVirtualDirection(direction: Direction, active: boolean) {
    this.controls?.setVirtualDirection(direction, active);
  }

  queueDash() {
    this.controls?.queueDash();
  }

  queueActiveAbility(ability: ActiveAbility) {
    this.controls?.queueActiveAbility(ability);
  }

  enterBossRoom() {
    return this.controls?.enterBossRoom() ?? false;
  }

  continueNarrative() {
    this.controls?.continueNarrative();
  }

  setSuspended(suspended: boolean) {
    this.controls?.setSuspended(suspended);
  }

  focus() {
    this.controls?.focus();
  }
}
