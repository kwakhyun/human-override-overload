export type Direction = "up" | "down" | "left" | "right";
export type ActiveAbility = "empPulse" | "aegisWard" | "stratosRun" | "helixTempest";

export type SceneCallbacks = Readonly<{
  onHud: (hud: unknown) => void;
  onEvent: (event: Record<string, unknown>) => void;
  onFinish: (result: unknown) => void;
  onLoadProgress?: (progress: number) => void;
  onReady?: () => void;
}>;

export interface BattleSceneControls {
  chooseReward(id: string): boolean;
  setVirtualDirection(direction: Direction, active: boolean): void;
  setVirtualMovement(x: number, y: number): void;
  queueDash(): void;
  queueParry(): void;
  queueTag(): void;
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
  private suspended = false;

  constructor(callbacks: SceneCallbacks, debugScene: string | null) {
    this.callbacks = callbacks;
    this.debugScene = debugScene;
  }

  attach(controls: BattleSceneControls) {
    this.controls = controls;
    controls.setSuspended(this.suspended);
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

  setVirtualMovement(x: number, y: number) {
    this.controls?.setVirtualMovement(x, y);
  }

  queueDash() {
    this.controls?.queueDash();
  }

  queueParry() {
    this.controls?.queueParry();
  }

  queueTag() {
    this.controls?.queueTag();
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
    this.suspended = suspended;
    this.controls?.setSuspended(suspended);
  }

  focus() {
    this.controls?.focus();
  }
}
