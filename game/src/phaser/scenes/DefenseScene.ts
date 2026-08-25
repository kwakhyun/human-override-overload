import Phaser from "phaser";
import {
  activateDefenseAbility,
  buildDefenseTower,
  createDefenseState,
  cycleDefenseTargetPriority,
  drainDefenseEvents,
  getDefenseHud,
  getDefenseResult,
  selectDefenseNode,
  sellDefenseTower,
  specializeDefenseTower,
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
  private readonly portrait: boolean;
  private simulationSpeed = 1;

  constructor(stageId: string, doctrineId: string, callbacks: DefenseSceneCallbacks, portrait = false) {
    super({ key: "DefenseBattle" });
    this.state = createDefenseState({ stageId, doctrineId });
    this.callbacks = callbacks;
    this.portrait = portrait;
  }

  create() {
    this.view = new DefenseView(this, this.state, (nodeId) => {
      if (this.suspended) return;
      selectDefenseNode(this.state, nodeId);
      this.publishHud();
    }, this.portrait);
    this.input.keyboard?.on("keydown-SPACE", () => this.startWave());
    this.input.keyboard?.on("keydown-ONE", () => this.buildTower("pulseSentry"));
    this.input.keyboard?.on("keydown-TWO", () => this.buildTower("arcRelay"));
    this.input.keyboard?.on("keydown-THREE", () => this.buildTower("skyfireBattery"));
    this.input.keyboard?.on("keydown-FOUR", () => this.buildTower("aegisBastion"));
    this.input.keyboard?.on("keydown-U", () => this.upgradeTower());
    this.input.keyboard?.on("keydown-T", () => this.cycleTargetPriority());
    this.input.keyboard?.on("keydown-S", () => this.sellTower());
    this.input.keyboard?.on("keydown-Z", () => this.specializeTower(0));
    this.input.keyboard?.on("keydown-X", () => this.specializeTower(1));
    this.input.keyboard?.on("keydown-Q", () => this.activateAbility("empSweep"));
    this.input.keyboard?.on("keydown-W", () => this.activateAbility("orbitalStrike"));
    this.input.keyboard?.on("keydown-E", () => this.activateAbility("emergencyRepair"));
    this.input.keyboard?.on("keydown-P", () => this.setSpeed(this.simulationSpeed > 0 ? 0 : 1));
    this.input.keyboard?.on("keydown-F", () => this.setSpeed(this.simulationSpeed === 2 ? 1 : 2));
    this.input.keyboard?.on("keydown-LEFT", () => this.cycleNode(-1));
    this.input.keyboard?.on("keydown-UP", () => this.cycleNode(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.cycleNode(1));
    this.input.keyboard?.on("keydown-DOWN", () => this.cycleNode(1));
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
    this.accumulator += delta * this.simulationSpeed;
    while (this.accumulator >= 1 / 60) {
      stepDefense(this.state, 1 / 60);
      this.accumulator -= 1 / 60;
    }
    this.view?.render(this.state);
    for (const event of drainDefenseEvents(this.state)) {
      this.view?.handleEvent(event as Record<string, unknown>);
      this.callbacks.onEvent(event as Record<string, unknown>);
    }
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
    this.callbacks.onHud({ ...getDefenseHud(this.state), simulationSpeed: this.simulationSpeed });
  }

  selectNode(nodeId: string) {
    if (this.suspended) return false;
    const changed = selectDefenseNode(this.state, nodeId);
    if (changed) this.publishHud();
    return changed;
  }

  cycleNode(direction = 1) {
    if (this.suspended || !this.state.nodes.length) return false;
    const step = direction < 0 ? -1 : 1;
    const currentIndex = this.state.nodes.findIndex((node: { id: string }) => node.id === this.state.selectedNodeId);
    const startIndex = currentIndex < 0 ? (step < 0 ? 0 : -1) : currentIndex;
    const nextIndex = (startIndex + step + this.state.nodes.length) % this.state.nodes.length;
    return this.selectNode(this.state.nodes[nextIndex].id);
  }

  private selectNextEmptyNode(fromNodeId: string | null) {
    if (!this.state.nodes.length) return false;
    const startIndex = this.state.nodes.findIndex((node: { id: string }) => node.id === fromNodeId);
    for (let offset = 1; offset <= this.state.nodes.length; offset += 1) {
      const node = this.state.nodes[(Math.max(0, startIndex) + offset) % this.state.nodes.length];
      const occupied = this.state.towers.some((tower: { nodeId: string }) => tower.nodeId === node.id);
      if (occupied) continue;
      selectDefenseNode(this.state, node.id);
      return true;
    }
    return false;
  }

  buildTower(towerType: string) {
    if (this.suspended) return false;
    const builtNodeId = this.state.selectedNodeId;
    const built = buildDefenseTower(this.state, towerType);
    if (built) {
      this.selectNextEmptyNode(builtNodeId);
      this.publishHud();
    }
    return built;
  }

  upgradeTower() {
    if (this.suspended) return false;
    const upgraded = upgradeDefenseTower(this.state);
    if (upgraded) this.publishHud();
    return upgraded;
  }

  specializeTower(branchIndex: number) {
    if (this.suspended) return false;
    // Branch ids live in the deterministic HUD so DOM and keyboard paths share one source of truth.
    const hud: any = getDefenseHud(this.state);
    const branchId = hud.selectedTower?.branches?.[branchIndex]?.id;
    if (!branchId) return false;
    const changed = specializeDefenseTower(this.state, branchId);
    if (changed) this.publishHud();
    return changed;
  }

  cycleTargetPriority() {
    if (this.suspended) return false;
    const changed = cycleDefenseTargetPriority(this.state);
    if (changed) this.publishHud();
    return changed;
  }

  sellTower() {
    if (this.suspended) return false;
    const changed = sellDefenseTower(this.state);
    if (changed) this.publishHud();
    return changed;
  }

  activateAbility(abilityId: string) {
    if (this.suspended) return false;
    const activated = activateDefenseAbility(this.state, abilityId);
    if (activated) this.publishHud();
    return activated;
  }

  startWave() {
    if (this.suspended) return false;
    const started = startDefenseWave(this.state);
    if (started) this.publishHud();
    return started;
  }

  setSuspended(suspended: boolean) {
    this.suspended = suspended;
  }

  setSpeed(speed: number) {
    this.simulationSpeed = speed <= 0 ? 0 : speed >= 2 ? 2 : 1;
    this.publishHud();
    return true;
  }
}
