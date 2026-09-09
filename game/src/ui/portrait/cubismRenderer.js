import { portraitFit } from './portraitFraming.js';

let corePromise;
export function loadCubismCore(url) {
  if (!corePromise) corePromise = (async () => {
    if (!window.Live2DCubismCore) await new Promise((resolve,reject)=>{
      const script=document.createElement('script'); script.src=url; script.async=true;
      script.onload=resolve; script.onerror=()=>{script.remove();reject(new Error('Cubism Core unavailable'));};
      document.head.appendChild(script);
    });
    const core=window.Live2DCubismCore, start=performance.now();
    while(true){
      try { core.Version.csmGetVersion(); return core; }
      catch(error){ if(performance.now()-start>8000)throw error; await new Promise(r=>setTimeout(r,30)); }
    }
  })().catch(error=>{corePromise=undefined;throw error;});
  return corePromise;
}

// Rectangular texture compilation replaces alpha Editor atlas packing only.
// Animated vertex positions, draw order and opacity all come from Cubism Core.
export function remapCubismUVs(model, layout) {
  const d=model.drawables, c=model.canvasinfo;
  return Array.from({length:d.count},(_,i)=>{
    const part=layout.meshes[d.ids[i]];
    if(!part)throw new Error('Missing Cubism material: '+d.ids[i]);
    const positions=d.vertexPositions[i], uv=new Float32Array(positions.length);
    for(let n=0;n<positions.length;n+=2){
      uv[n]=(positions[n]*c.PixelsPerUnit+c.CanvasOriginX-part.source[0]+part.atlas[0])/layout.size;
      uv[n+1]=(-positions[n+1]*c.PixelsPerUnit+c.CanvasOriginY-part.source[1]+part.atlas[1])/layout.size;
    }
    return {uv,page:part.page};
  });
}

export async function createCubismRenderer(canvas, assets, characterId, presentation, signal) {
  const read=async (url,binary=false)=>{
    const response=await fetch(url,{signal});
    if(!response.ok)throw new Error('Cubism asset HTTP '+response.status);
    return binary?response.arrayBuffer():response.json();
  };
  const [Core,data,layout]=await Promise.all([loadCubismCore(assets.core),read(assets.moc,true),read(assets.layout)]);
  signal?.throwIfAborted();
  const moc=Core.Moc.fromArrayBuffer(data);
  if(!moc)throw new Error('Invalid Cubism model');
  let model,gl,program,disposed=false;
  const textures=[],buffers=[],shaders=[];
  const destroy=()=>{
    if(disposed)return;disposed=true;
    if(gl){
      buffers.forEach(b=>Object.values(b).forEach(v=>gl.deleteBuffer(v)));
      textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));
      if(program)gl.deleteProgram(program);
    }
    model?.release();moc._release();
  };
  try {
    model=Core.Model.fromMoc(moc);
    if(!model)throw new Error('Cubism initialization failed');
    const d=model.drawables,p=model.parameters,c=model.canvasinfo;
    if(Array.from(d.maskCounts).some(n=>n)||Array.from(d.constantFlags).some(f=>f&3))throw new Error('Unsupported Cubism material mode');
    p.values.set(p.defaultValues);model.update();
    const remapped=remapCubismUVs(model,layout);
    gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});
    if(!gl)throw new Error('WebGL unavailable');
    const shader=(type,source)=>{
      const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;
    };
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 aPosition; attribute vec2 aUV;
      uniform vec4 uFrame; uniform vec2 uViewport; uniform vec3 uCanvas; varying vec2 vUV;
      void main(){vec2 pixel=vec2(aPosition.x,-aPosition.y)*uCanvas.z+uCanvas.xy;
        vec2 screen=pixel*uFrame.zw+uFrame.xy;
        gl_Position=vec4(screen.x/uViewport.x*2.0-1.0,1.0-screen.y/uViewport.y*2.0,0.0,1.0);vUV=aUV;}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float; varying vec2 vUV;
      uniform sampler2D uTexture; uniform float uOpacity; uniform vec4 uMultiply; uniform vec4 uScreen;
      void main(){vec4 color=texture2D(uTexture,vUV);color.rgb*=uMultiply.rgb;
        color.rgb=color.rgb+uScreen.rgb*color.a-color.rgb*uScreen.rgb;
        gl_FragColor=color*uOpacity;}`));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const position=gl.getAttribLocation(program,'aPosition'),uv=gl.getAttribLocation(program,'aUV');
    const uniforms=Object.fromEntries(['uFrame','uViewport','uCanvas','uOpacity','uMultiply','uScreen','uTexture'].map(k=>[k,gl.getUniformLocation(program,k)]));
    gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(uv);gl.uniform1i(uniforms.uTexture,0);
    gl.uniform3f(uniforms.uCanvas,c.CanvasOriginX,c.CanvasOriginY,c.PixelsPerUnit);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
    // One upload per atlas, with cancellation and CPU bitmap release.
    for(const file of assets.textures){
      const response=await fetch(file,{signal});if(!response.ok)throw new Error('Cubism texture HTTP '+response.status);
      const bitmap=await createImageBitmap(await response.blob(),{premultiplyAlpha:'premultiply',colorSpaceConversion:'none'});
      try {
        signal?.throwIfAborted();
        const texture=gl.createTexture();textures.push(texture);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      } finally {bitmap.close();}
    }
    for(let i=0;i<d.count;i++){
      const b={vertices:gl.createBuffer(),uvs:gl.createBuffer(),indices:gl.createBuffer()};buffers.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER,b.vertices);gl.bufferData(gl.ARRAY_BUFFER,d.vertexPositions[i],gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,b.uvs);gl.bufferData(gl.ARRAY_BUFFER,remapped[i].uv,gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,d.indices[i],gl.STATIC_DRAW);
    }
    const order=Array.from({length:d.count},(_,i)=>i), params=Object.fromEntries(p.ids.map((id,i)=>[id,i]));
    return {
      destroy,
      resize(width,height,dpr=1){
        const fit=portraitFit(width,height,characterId,presentation), density=Math.min(2,Math.max(1,dpr||1));
        canvas.width=Math.max(1,Math.round(width*density));canvas.height=Math.max(1,Math.round(height*density));
        gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
        gl.uniform2f(uniforms.uViewport,Math.max(1,width),Math.max(1,height));
        gl.uniform4f(uniforms.uFrame,fit.left,fit.top,fit.width/960,fit.height/1280);return fit;
      },
      draw(values){
        if(disposed||gl.isContextLost())return;
        for(const [id,value] of Object.entries(values)){
          const i=params[id];if(i===undefined)continue;
          p.values[i]=Number.isFinite(value)?Math.max(p.minimumValues[i],Math.min(p.maximumValues[i],value)):p.defaultValues[i];
        }
        for(const id of ['ParamAngleX','ParamAngleY','ParamAngleZ'])if(params[id]!==undefined)p.values[params[id]]=0;
        model.update();gl.useProgram(program);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
        order.sort((a,b)=>d.renderOrders[a]-d.renderOrders[b]);
        for(const i of order){
          if(d.opacities[i]<=0||!(d.dynamicFlags[i]&1))continue;
          const b=buffers[i];gl.bindBuffer(gl.ARRAY_BUFFER,b.vertices);gl.bufferSubData(gl.ARRAY_BUFFER,0,d.vertexPositions[i]);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
          gl.bindBuffer(gl.ARRAY_BUFFER,b.uvs);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.indices);
          gl.bindTexture(gl.TEXTURE_2D,textures[remapped[i].page]);gl.uniform1f(uniforms.uOpacity,d.opacities[i]);
          gl.uniform4fv(uniforms.uMultiply,d.multiplyColors?.subarray(i*4,i*4+4)||[1,1,1,1]);
          gl.uniform4fv(uniforms.uScreen,d.screenColors?.subarray(i*4,i*4+4)||[0,0,0,0]);
          gl.drawElements(gl.TRIANGLES,d.indices[i].length,gl.UNSIGNED_SHORT,0);
        }
        d.resetDynamicFlags();
      },
    };
  } catch(error) {destroy();throw error;}
}
