import Phaser from "phaser";
import {
  buildDefenseTower,
  createDefenseState,
  drainDefenseEvents,
  getDefenseHud,
  getDefenseResult,
  selectDefenseNode,
  startDefenseWave,
  stepDefense,
  upgradeDefenseTower,
} from "../../defense/engine.js";
import { DefenseView } from "../view/DefenseView";

export type DefenseSceneCallbacks = Readonly<{
  onHud: (hud: unknown) => void;
  onEvent: (event: Record<string, unknown>) => void;
  onFinish: (result: unknown) => void;
  onLoadProgress?: (progress: number) => void;
  onReady?: () => void;
}>;

export class DefenseScene extends Phaser.Scene {
  readonly state: any;
  private readonly callbacks: DefenseSceneCallbacks;
  private view?: DefenseView;
  private accumulator = 0;
  private suspended = false;
  private finishSent = false;
  private hudElapsed = 0;

  constructor(stageId: string, callbacks: DefenseSceneCallbacks) {
    super({ key: "DefenseBattle" });
    this.state = createDefenseState({ stageId });
    this.callbacks = callbacks;
  }

  create() {
    this.view = new DefenseView(this, this.state, (nodeId) => {
      selectDefenseNode(this.state, nodeId);
      this.publishHud();
    });
    this.input.keyboard?.on("keydown-SPACE", () => this.startWave());
    this.input.keyboard?.on("keydown-ONE", () => this.buildTower("pulseSentry"));
    this.input.keyboard?.on("keydown-TWO", () => this.buildTower("arcRelay"));
    this.input.keyboard?.on("keydown-THREE", () => this.buildTower("skyfireBattery"));
    this.input.keyboard?.on("keydown-FOUR", () => this.buildTower("aegisBastion"));
    this.input.keyboard?.on("keydown-U", () => this.upgradeTower());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.view?.destroy());
    this.publishHud();
    this.callbacks.onReady?.();
  }

  update(_time: number, deltaMs: number) {
    if (this.suspended || this.state.finished) {
      this.view?.render(this.state);
      return;
    }
    const delta = Math.min(0.1, deltaMs / 1000);
    this.accumulator += delta;
    while (this.accumulator >= 1 / 60) {
      stepDefense(this.state, 1 / 60);
      this.accumulator -= 1 / 60;
    }
    this.view?.render(this.state);
    for (const event of drainDefenseEvents(this.state)) this.callbacks.onEvent(event as Record<string, unknown>);
    this.hudElapsed += delta;
    if (this.hudElapsed >= 0.1 || this.state.finished) {
      this.hudElapsed = 0;
      this.publishHud();
    }
    if (this.state.finished && !this.finishSent) {
      this.finishSent = true;
      this.callbacks.onFinish(getDefenseResult(this.state));
    }
  }

  private publishHud() {
    this.callbacks.onHud(getDefenseHud(this.state));
  }

  selectNode(nodeId: string) {
    const changed = selectDefenseNode(this.state, nodeId);
    if (changed) this.publishHud();
    return changed;
  }

  buildTower(towerType: string) {
    const built = buildDefenseTower(this.state, towerType);
    if (built) this.publishHud();
    return built;
  }

  upgradeTower() {
    const upgraded = upgradeDefenseTower(this.state);
    if (upgraded) this.publishHud();
    return upgraded;
  }

  startWave() {
    const started = startDefenseWave(this.state);
    if (started) this.publishHud();
    return started;
  }

  setSuspended(suspended: boolean) {
    this.suspended = suspended;
  }
}
