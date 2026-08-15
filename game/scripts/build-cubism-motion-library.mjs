import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const live2dRoot = path.join(root, "public", "assets", "overload", "live2d");

function linearCurve(id, points, fadeInTime = 0.35, fadeOutTime = 0.35) {
  const segments = [points[0][0], points[0][1]];
  for (let index = 1; index < points.length; index += 1) {
    segments.push(0, points[index][0], points[index][1]);
  }
  return {
    Target: "Parameter",
    Id: id,
    FadeInTime: fadeInTime,
    FadeOutTime: fadeOutTime,
    Segments: segments,
  };
}

function motion(duration, curves, { loop = false, fadeInTime = 0.4, fadeOutTime = 0.5 } = {}) {
  return {
    Version: 3,
    Meta: {
      Duration: duration,
      Fps: 30,
      Loop: loop,
      AreBeziersRestricted: true,
      CurveCount: curves.length,
      TotalSegmentCount: curves.reduce((sum, curve) => sum + ((curve.Segments.length - 2) / 3), 0),
      TotalPointCount: curves.reduce((sum, curve) => sum + 1 + ((curve.Segments.length - 2) / 3), 0),
      UserDataCount: 0,
      TotalUserDataSize: 0,
      FadeInTime: fadeInTime,
      FadeOutTime: fadeOutTime,
    },
    Curves: curves,
  };
}

const commonBlink = (at, duration = 0.12) => [
  [0, 1],
  [Math.max(0, at - 0.08), 1],
  [at, 0],
  [at + duration, 1],
];

const libraries = {
  aegis: {
    "idle/idle-01.motion3.json": motion(6.4, [
      linearCurve("ParamAngleX", [[0, 0], [1.6, -3.2], [3.2, 2.2], [4.8, -1.4], [6.4, 0]]),
      linearCurve("ParamAngleY", [[0, 0], [2.1, 1.8], [4.3, -1.2], [6.4, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [1.7, -1.7], [3.5, 1.2], [5.1, -0.8], [6.4, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [1.6, -2.4], [3.4, 1.8], [5.2, -1.1], [6.4, 0]]),
      linearCurve("ParamBodyAngleZ", [[0, 0], [2.2, 1.25], [4.3, -0.8], [6.4, 0]]),
      linearCurve("ParamBreath", [[0, 0.12], [1.55, 0.92], [3.1, 0.18], [4.75, 1], [6.4, 0.12]]),
      linearCurve("ParamHairFront", [[0, 0], [1.8, 0.24], [3.7, -0.18], [5.3, 0.12], [6.4, 0]]),
      linearCurve("ParamHairSide", [[0, 0], [1.95, 0.42], [3.85, -0.34], [5.5, 0.18], [6.4, 0]]),
      linearCurve("ParamHairBack", [[0, 0], [2.1, 0.56], [4.05, -0.42], [5.7, 0.2], [6.4, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(2.92)),
      linearCurve("ParamEyeROpen", commonBlink(2.92)),
    ], { loop: true }),
    "idle/idle-02.motion3.json": motion(5.2, [
      linearCurve("ParamAngleX", [[0, 0], [1.2, 5], [2.9, 4], [4.1, -1.2], [5.2, 0]]),
      linearCurve("ParamAngleY", [[0, 0], [1.4, -1.5], [3.2, 1], [5.2, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [1.4, 2.2], [3.4, 1.1], [5.2, 0]]),
      linearCurve("ParamEyeBallX", [[0, 0], [1.1, 0.45], [3.5, 0.35], [5.2, 0]]),
      linearCurve("ParamEyeBallY", [[0, 0], [1.1, 0.12], [3.5, 0.08], [5.2, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [1.5, 2.7], [3.4, 1.4], [5.2, 0]]),
      linearCurve("ParamBreath", [[0, 0.25], [1.4, 0.9], [2.8, 0.2], [4.2, 0.86], [5.2, 0.25]]),
      linearCurve("ParamHairSide", [[0, 0], [1.6, -0.42], [3.5, 0.28], [5.2, 0]]),
      linearCurve("ParamHairBack", [[0, 0], [1.8, -0.58], [3.7, 0.36], [5.2, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(4.25)),
      linearCurve("ParamEyeROpen", commonBlink(4.25)),
    ]),
    "idle/idle-03.motion3.json": motion(4.8, [
      linearCurve("ParamAngleX", [[0, 0], [1.3, -4.5], [2.8, -3.8], [4.1, 1.2], [4.8, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [1.4, -2.4], [3.2, -1.2], [4.8, 0]]),
      linearCurve("ParamEyeBallX", [[0, 0], [1.2, -0.42], [3.4, -0.28], [4.8, 0]]),
      linearCurve("ParamBrowLY", [[0, 0], [1.2, 0.18], [3.3, 0.1], [4.8, 0]]),
      linearCurve("ParamBrowRY", [[0, 0], [1.2, 0.18], [3.3, 0.1], [4.8, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [1.5, -2.2], [3.2, -1.1], [4.8, 0]]),
      linearCurve("ParamHairFront", [[0, 0], [1.6, -0.22], [3.3, 0.16], [4.8, 0]]),
      linearCurve("ParamHairSide", [[0, 0], [1.7, 0.38], [3.5, -0.25], [4.8, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(2.15)),
      linearCurve("ParamEyeROpen", commonBlink(2.15)),
    ]),
    "touch/head.motion3.json": motion(1.35, [
      linearCurve("ParamAngleX", [[0, 0], [0.18, -8], [0.62, -5], [1.35, 0]], 0.1, 0.4),
      linearCurve("ParamAngleY", [[0, 0], [0.2, 4], [0.65, 2], [1.35, 0]], 0.1, 0.4),
      linearCurve("ParamAngleZ", [[0, 0], [0.2, -6], [0.7, -2.5], [1.35, 0]], 0.1, 0.4),
      linearCurve("ParamBodyAngleX", [[0, 0], [0.22, -3], [0.75, -1.5], [1.35, 0]], 0.1, 0.4),
      linearCurve("ParamHairFront", [[0, 0], [0.3, 0.55], [0.72, -0.32], [1.35, 0]], 0.1, 0.45),
      linearCurve("ParamHairSide", [[0, 0], [0.32, 0.8], [0.78, -0.45], [1.35, 0]], 0.1, 0.45),
      linearCurve("ParamHairBack", [[0, 0], [0.38, 1], [0.85, -0.56], [1.35, 0]], 0.1, 0.45),
      linearCurve("ParamEyeLOpen", [[0, 1], [0.18, 0.72], [0.42, 1], [1.35, 1]], 0.08, 0.25),
      linearCurve("ParamEyeROpen", [[0, 1], [0.18, 0.72], [0.42, 1], [1.35, 1]], 0.08, 0.25),
    ], { fadeInTime: 0.1, fadeOutTime: 0.4 }),
    "touch/chest.motion3.json": motion(1.25, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.16, 7], [0.38, -3], [0.68, 2], [1.25, 0]], 0.08, 0.35),
      linearCurve("ParamBodyAngleY", [[0, 0], [0.18, -4], [0.5, 1.5], [1.25, 0]], 0.08, 0.35),
      linearCurve("ParamAngleY", [[0, 0], [0.2, -5], [0.52, 2], [1.25, 0]], 0.08, 0.35),
      linearCurve("ParamBreath", [[0, 0.3], [0.18, 1], [0.5, 0.18], [1.25, 0.35]], 0.08, 0.35),
      linearCurve("ParamHairSide", [[0, 0], [0.22, -0.72], [0.48, 0.48], [0.82, -0.22], [1.25, 0]], 0.08, 0.4),
      linearCurve("ParamHairBack", [[0, 0], [0.24, -0.9], [0.54, 0.58], [0.9, -0.28], [1.25, 0]], 0.08, 0.4),
    ], { fadeInTime: 0.08, fadeOutTime: 0.38 }),
    "touch/arms.motion3.json": motion(1.2, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.16, -6], [0.34, 4], [0.58, -2.5], [1.2, 0]], 0.08, 0.35),
      linearCurve("ParamAngleX", [[0, 0], [0.16, -7], [0.4, 3], [1.2, 0]], 0.08, 0.35),
      linearCurve("ParamAngleZ", [[0, 0], [0.18, -4], [0.48, 2], [1.2, 0]], 0.08, 0.35),
      linearCurve("ParamHairFront", [[0, 0], [0.2, 0.48], [0.45, -0.3], [1.2, 0]], 0.08, 0.4),
      linearCurve("ParamHairSide", [[0, 0], [0.22, 0.76], [0.5, -0.5], [1.2, 0]], 0.08, 0.4),
    ], { fadeInTime: 0.08, fadeOutTime: 0.38 }),
    "touch/legs.motion3.json": motion(1.3, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.18, 4.5], [0.5, -2], [0.85, 1], [1.3, 0]], 0.1, 0.4),
      linearCurve("ParamBodyAngleZ", [[0, 0], [0.2, 3], [0.58, -1.4], [1.3, 0]], 0.1, 0.4),
      linearCurve("ParamAngleY", [[0, 0], [0.2, 3.5], [0.58, -1.5], [1.3, 0]], 0.1, 0.4),
      linearCurve("ParamHairBack", [[0, 0], [0.24, -0.6], [0.62, 0.38], [1.3, 0]], 0.1, 0.4),
    ]),
  },
  mika: {
    "idle/idle-01.motion3.json": motion(5.4, [
      linearCurve("ParamAngleX", [[0, 0], [1.25, 4.5], [2.7, -3.5], [4.15, 2.2], [5.4, 0]]),
      linearCurve("ParamAngleY", [[0, 0], [1.4, -2], [3, 1.7], [4.5, -1], [5.4, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [1.35, 3], [2.8, -2.2], [4.25, 1.4], [5.4, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [1.25, 3.8], [2.75, -3], [4.2, 2], [5.4, 0]]),
      linearCurve("ParamBodyAngleZ", [[0, 0], [1.4, -2], [3, 1.5], [5.4, 0]]),
      linearCurve("ParamBreath", [[0, 0.1], [1.25, 1], [2.55, 0.16], [4, 0.96], [5.4, 0.1]]),
      linearCurve("ParamHairFront", [[0, 0], [1.5, -0.38], [2.9, 0.32], [4.4, -0.18], [5.4, 0]]),
      linearCurve("ParamHairSide", [[0, 0], [1.65, -0.75], [3.05, 0.62], [4.55, -0.32], [5.4, 0]]),
      linearCurve("ParamHairBack", [[0, 0], [1.8, -1], [3.25, 0.82], [4.7, -0.42], [5.4, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(2.25)),
      linearCurve("ParamEyeROpen", commonBlink(2.25)),
      linearCurve("ParamMouthForm", [[0, 0.28], [1.6, 0.5], [3.3, 0.34], [5.4, 0.28]]),
    ], { loop: true }),
    "idle/idle-02.motion3.json": motion(4.5, [
      linearCurve("ParamAngleX", [[0, 0], [0.8, -8], [1.8, -5], [3.1, 4], [4.5, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [0.9, -5], [2, -2], [3.2, 2.5], [4.5, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [0.9, -5], [2.1, -2.5], [3.4, 3], [4.5, 0]]),
      linearCurve("ParamEyeBallX", [[0, 0], [0.8, -0.55], [2.2, -0.35], [3.5, 0.35], [4.5, 0]]),
      linearCurve("ParamCheek", [[0, 0], [0.9, 0.32], [2.7, 0.2], [4.5, 0]]),
      linearCurve("ParamMouthForm", [[0, 0.28], [0.9, 0.68], [2.7, 0.5], [4.5, 0.28]]),
      linearCurve("ParamHairSide", [[0, 0], [1.05, 0.9], [2.3, -0.62], [3.6, 0.3], [4.5, 0]]),
      linearCurve("ParamHairBack", [[0, 0], [1.15, 1.15], [2.45, -0.78], [3.8, 0.38], [4.5, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(3.55)),
      linearCurve("ParamEyeROpen", commonBlink(3.55)),
    ]),
    "idle/idle-03.motion3.json": motion(4.2, [
      linearCurve("ParamAngleX", [[0, 0], [0.75, 7], [1.55, -5], [2.35, 6], [3.2, -2], [4.2, 0]]),
      linearCurve("ParamAngleZ", [[0, 0], [0.8, 4.5], [1.65, -3.5], [2.5, 3], [4.2, 0]]),
      linearCurve("ParamBodyAngleX", [[0, 0], [0.8, 5.5], [1.7, -4], [2.6, 3.8], [4.2, 0]]),
      linearCurve("ParamBodyAngleZ", [[0, 0], [0.9, -3], [1.8, 2.4], [2.8, -1.6], [4.2, 0]]),
      linearCurve("ParamHairFront", [[0, 0], [1, -0.55], [1.9, 0.48], [2.9, -0.3], [4.2, 0]]),
      linearCurve("ParamHairSide", [[0, 0], [1.05, -1], [2, 0.86], [3.05, -0.5], [4.2, 0]]),
      linearCurve("ParamHairBack", [[0, 0], [1.15, -1.25], [2.15, 1.05], [3.2, -0.62], [4.2, 0]]),
      linearCurve("ParamEyeLOpen", commonBlink(1.86)),
      linearCurve("ParamEyeROpen", commonBlink(1.86)),
      linearCurve("ParamMouthForm", [[0, 0.3], [1, 0.78], [2.3, 0.48], [4.2, 0.3]]),
    ]),
    "touch/head.motion3.json": motion(1.55, [
      linearCurve("ParamAngleX", [[0, 0], [0.18, 9], [0.5, -6], [0.85, 4], [1.55, 0]], 0.08, 0.45),
      linearCurve("ParamAngleY", [[0, 0], [0.2, -5], [0.6, 2.5], [1.55, 0]], 0.08, 0.45),
      linearCurve("ParamAngleZ", [[0, 0], [0.2, 7], [0.56, -4], [0.92, 2.5], [1.55, 0]], 0.08, 0.45),
      linearCurve("ParamBodyAngleX", [[0, 0], [0.22, 5], [0.62, -3], [1.55, 0]], 0.08, 0.45),
      linearCurve("ParamCheek", [[0, 0], [0.22, 1], [1.05, 0.78], [1.55, 0]], 0.08, 0.5),
      linearCurve("ParamEyeLSmile", [[0, 0], [0.26, 1], [1.05, 0.75], [1.55, 0]], 0.08, 0.5),
      linearCurve("ParamEyeRSmile", [[0, 0], [0.26, 1], [1.05, 0.75], [1.55, 0]], 0.08, 0.5),
      linearCurve("ParamMouthForm", [[0, 0.3], [0.25, 0.9], [1.05, 0.65], [1.55, 0.3]], 0.08, 0.45),
      linearCurve("ParamHairSide", [[0, 0], [0.28, -1.15], [0.62, 0.8], [1, -0.4], [1.55, 0]], 0.08, 0.48),
      linearCurve("ParamHairBack", [[0, 0], [0.32, -1.4], [0.7, 1], [1.08, -0.52], [1.55, 0]], 0.08, 0.48),
    ], { fadeInTime: 0.08, fadeOutTime: 0.5 }),
    "touch/chest.motion3.json": motion(1.65, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.16, -9], [0.36, 5], [0.62, -4], [1.05, 2], [1.65, 0]], 0.06, 0.5),
      linearCurve("ParamBodyAngleY", [[0, 0], [0.18, 6], [0.52, -3], [1.65, 0]], 0.06, 0.5),
      linearCurve("ParamAngleX", [[0, 0], [0.18, -8], [0.48, 5], [1.65, 0]], 0.06, 0.5),
      linearCurve("ParamAngleZ", [[0, 0], [0.2, -7], [0.52, 4], [1.65, 0]], 0.06, 0.5),
      linearCurve("ParamCheek", [[0, 0], [0.2, 1], [1.15, 0.9], [1.65, 0]], 0.06, 0.55),
      linearCurve("ParamMouthForm", [[0, 0.3], [0.2, -0.45], [0.7, -0.2], [1.65, 0.3]], 0.06, 0.5),
      linearCurve("ParamHairFront", [[0, 0], [0.2, 0.8], [0.5, -0.56], [0.88, 0.3], [1.65, 0]], 0.06, 0.55),
      linearCurve("ParamHairSide", [[0, 0], [0.24, 1.35], [0.58, -0.92], [1, 0.48], [1.65, 0]], 0.06, 0.55),
      linearCurve("ParamHairBack", [[0, 0], [0.28, 1.6], [0.64, -1.1], [1.08, 0.58], [1.65, 0]], 0.06, 0.55),
    ], { fadeInTime: 0.06, fadeOutTime: 0.55 }),
    "touch/arms.motion3.json": motion(1.45, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.16, 8], [0.38, -5], [0.68, 3], [1.45, 0]], 0.06, 0.45),
      linearCurve("ParamBodyAngleZ", [[0, 0], [0.18, -6], [0.44, 4], [1.45, 0]], 0.06, 0.45),
      linearCurve("ParamAngleX", [[0, 0], [0.18, 9], [0.46, -4], [1.45, 0]], 0.06, 0.45),
      linearCurve("ParamMouthForm", [[0, 0.3], [0.2, 0.82], [0.85, 0.62], [1.45, 0.3]], 0.06, 0.45),
      linearCurve("ParamHairSide", [[0, 0], [0.2, -1.25], [0.5, 0.9], [0.9, -0.45], [1.45, 0]], 0.06, 0.48),
      linearCurve("ParamHairBack", [[0, 0], [0.24, -1.5], [0.56, 1.05], [0.98, -0.55], [1.45, 0]], 0.06, 0.48),
    ], { fadeInTime: 0.06, fadeOutTime: 0.5 }),
    "touch/legs.motion3.json": motion(1.5, [
      linearCurve("ParamBodyAngleX", [[0, 0], [0.18, -6], [0.42, 4], [0.78, -2.5], [1.5, 0]], 0.08, 0.48),
      linearCurve("ParamBodyAngleZ", [[0, 0], [0.2, 5], [0.48, -3], [1.5, 0]], 0.08, 0.48),
      linearCurve("ParamAngleY", [[0, 0], [0.2, -5], [0.55, 2.5], [1.5, 0]], 0.08, 0.48),
      linearCurve("ParamCheek", [[0, 0], [0.24, 0.82], [1.05, 0.64], [1.5, 0]], 0.08, 0.52),
      linearCurve("ParamMouthForm", [[0, 0.3], [0.22, -0.32], [0.82, -0.08], [1.5, 0.3]], 0.08, 0.48),
      linearCurve("ParamHairSide", [[0, 0], [0.24, 1], [0.58, -0.72], [1.5, 0]], 0.08, 0.5),
      linearCurve("ParamHairBack", [[0, 0], [0.28, 1.28], [0.64, -0.86], [1.5, 0]], 0.08, 0.5),
    ], { fadeInTime: 0.08, fadeOutTime: 0.52 }),
  },
};

function physics(characterId) {
  const mika = characterId === "mika";
  const mobility = mika ? 0.92 : 0.78;
  const delay = mika ? 0.18 : 0.24;
  const acceleration = mika ? 1.35 : 1.05;
  const scale = mika ? 1.15 : 0.82;
  const settings = [
    ["HairFrontPhysics", "앞머리 관성", "ParamAngleX", "ParamHairFront", 0.58],
    ["HairSidePhysics", "옆머리 관성", "ParamBodyAngleX", "ParamHairSide", 0.82],
    ["HairBackPhysics", "뒷머리 관성", "ParamAngleZ", "ParamHairBack", 1],
  ].map(([id, name, input, output, strength], index) => ({
    Id: id,
    Input: [{
      Source: { Target: "Parameter", Id: input },
      Weight: 100,
      Type: index === 2 ? "Angle" : "X",
      Reflect: index !== 1,
    }],
    Output: [{
      Destination: { Target: "Parameter", Id: output },
      VertexIndex: 2,
      Scale: scale * strength,
      Weight: 100,
      Type: "Angle",
      Reflect: index === 1,
    }],
    Vertices: [
      { Position: { X: 0, Y: 0 }, Mobility: 0, Delay: 0, Acceleration: 0, Radius: 0 },
      { Position: { X: 0, Y: 10 }, Mobility: mobility, Delay: delay, Acceleration: acceleration, Radius: 10 },
      { Position: { X: 0, Y: 20 }, Mobility: mobility * 0.94, Delay: delay * 1.65, Acceleration: acceleration * 0.86, Radius: 10 },
    ],
    Normalization: {
      Position: { Minimum: -10, Default: 0, Maximum: 10 },
      Angle: { Minimum: -30, Default: 0, Maximum: 30 },
    },
  }));
  return {
    Version: 3,
    Meta: {
      PhysicsSettingCount: settings.length,
      TotalInputCount: settings.reduce((sum, setting) => sum + setting.Input.length, 0),
      TotalOutputCount: settings.reduce((sum, setting) => sum + setting.Output.length, 0),
      VertexCount: settings.reduce((sum, setting) => sum + setting.Vertices.length, 0),
      EffectiveForces: { Gravity: { X: 0, Y: -1 }, Wind: { X: mika ? 0.22 : 0.08, Y: 0 } },
      PhysicsDictionary: settings.map((setting) => ({ Id: setting.Id, Name: setting.Id })),
    },
    PhysicsSettings: settings,
  };
}

for (const [characterId, files] of Object.entries(libraries)) {
  for (const [relativePath, data] of Object.entries(files)) {
    const output = path.join(live2dRoot, characterId, "motions", relativePath);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
  }
  await writeFile(
    path.join(live2dRoot, characterId, `${characterId}.physics3.json`),
    `${JSON.stringify(physics(characterId), null, 2)}\n`,
  );
}

console.log("Built premium Cubism motion and physics libraries for AEGIS and MIKA.");
