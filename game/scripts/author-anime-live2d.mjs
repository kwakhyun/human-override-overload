/** Run against an explicitly user-approved Cubism 5.4 editing connection.
 * Import the new PSD and generate its meshes first. No credentials are stored.
 * These are actual keyed Editor objects; facial warp geometry still needs
 * native Editor authoring and visual review before this is a shipping rig.
 */
export async function authorAnimeRig(request, modelUID) {
  const call = (method, data = {}) => request(method, { ModelUID: modelUID, ...data });
  const structure = await call('GetPartStructure');
  const objects = structure.PartStructure.Children;
  const art = objects.filter(o => o.Type === 'ArtMesh' && !o.Id.startsWith('Pivot_'));
  const existing = new Set(objects.map(o => o.Id));
  const records = [];
  await request('EditBegin', { Silent: true });
  try {
    for (const id of ['ParamArmL', 'ParamArmR', 'ParamCoatL', 'ParamCoatR']) {
      await call('AddParameter', { Id: id, Name: id.slice(5), Min: -1, Default: 0, Max: 1 });
    }
    for (const [index, object] of art.entries()) {
      const name = object.Id;
      await call('EditArtMesh', { Id: `Pivot_${name}`, Opacity: 0 });
      await call('EditArtMesh', { Id: name, DrawOrder: 800 - index * 10 });
      let parameter, amplitude;
      if (name.startsWith('Hair_Fringe')) { parameter = 'ParamHairFront'; amplitude = name.endsWith('L') ? -.6 : .65; }
      else if (name.startsWith('Hair_Side')) { parameter = 'ParamHairSide'; amplitude = name.endsWith('L') ? -.5 : .5; }
      else if (name.startsWith('Hair_Back')) { parameter = 'ParamHairBack'; amplitude = name.endsWith('L') ? -.7 : .6; }
      else if (name.startsWith('Arm_')) { parameter = name.endsWith('L') ? 'ParamArmL' : 'ParamArmR'; amplitude = name.endsWith('L') ? -.25 : .25; }
      else if (name.startsWith('Coat_')) { parameter = name.endsWith('L') ? 'ParamCoatL' : 'ParamCoatR'; amplitude = name.endsWith('L') ? -.22 : .22; }
      else if (name === 'Torso') { parameter = 'ParamBreath'; amplitude = 0; }
      else continue;
      const id = `Rig_${name}`;
      if (!existing.has(id)) await call('AddRotationDeformer', { Id: id, Name: name, TargetObjectIds: [`Pivot_${name}`], Mode: 'AsParent' });
      await call('EditArtMesh', { Id: name, ParentDeformerId: id });
      const keys = parameter === 'ParamBreath' ? [0, 1] : [-1, 0, 1];
      for (const key of keys) await call('AddParameterKey', { ObjectId: id, ParameterId: parameter, KeyValue: key });
      for (const key of keys) await call('EditRotationDeformer', { Id: id, Parameters: [{ Id: parameter, Value: key }], IsExactMatch: true, Angle: key * amplitude, Scale: 100 + (parameter === 'ParamBreath' ? key * .45 : 0) });
      records.push({ id, parameter, keys, amplitudeDegrees: amplitude });
    }
    for (const side of ['L', 'R']) {
      for (const prefix of ['Hand_', 'Forearm_']) {
        if (art.some(object => object.Id === prefix + side)) await call('EditArtMesh', { Id: prefix + side, ParentDeformerId: 'Rig_Arm_' + side });
      }
      const id = `Rig_Eye_${side}`;
      await call('AddWarpDeformer', { Id: id, Name: `Eye ${side} closure`, TargetObjectIds: [`Eye_${side}`], WarpDivH: 4, WarpDivV: 4, BezierDivH: 1, BezierDivV: 1 });
      for (const key of [0, 1]) await call('AddParameterKey', { ObjectId: id, ParameterId: `ParamEye${side}Open`, KeyValue: key });
      for (const [mesh, keys] of [[`Eye_${side}`, [[0,0],[.35,0],[.4,100],[1,100]]], [`ClosedEye_${side}`, [[0,100],[.35,100],[.4,0],[1,0]]]]) {
        for (const [value] of keys) await call('AddParameterKey', { ObjectId: mesh, ParameterId: `ParamEye${side}Open`, KeyValue: value });
        for (const [value, opacity] of keys) await call('EditArtMesh', { Id: mesh, Parameters: [{Id:`ParamEye${side}Open`,Value:value}], IsExactMatch:true, Opacity:opacity });
      }
      records.push({ id, parameter: `ParamEye${side}Open`, keys: [0, 1], status: 'Native geometry authoring required' });
    }
    await request('EditEnd');
  } catch (error) {
    await request('EditEnd', { Cancel: true });
    throw error;
  }
  return records;
}
