import { PORTRAIT_RIGS, portraitFit } from './portraitMotion.js';

function shader(gl, type, source) {
  const value = gl.createShader(type);
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(value);
    gl.deleteShader(value);
    throw new Error(message);
  }
  return value;
}
const vec = (values) => `vec${values.length}(${values.map(n => Number(n).toFixed(5)).join(',')})`;

export function createPortraitRenderer(canvas, source, characterId, presentation = 'profile') {
  const rig = PORTRAIT_RIGS[characterId];
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl || !rig) throw new Error('Portrait WebGL unavailable');
  const vertex = shader(gl, gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 a_position;
    varying vec2 v_uv;
    uniform vec4 u_fit;
    uniform vec4 u_poseA;
    uniform vec4 u_poseB;
    uniform vec3 u_idle;
    float weight(vec2 p, vec2 center, vec2 radius) {
      vec2 q = (p - center) / radius;
      return exp(-dot(q,q)*2.0);
    }
    vec2 eyelid(vec2 p, vec2 eye, vec2 size, float tilt) {
      vec2 d = p-eye;
      float along = d.y-d.x*tilt;
      float wx = 1.0-smoothstep(size.x*.65, size.x*1.3, abs(d.x));
      float wy = 1.0-smoothstep(size.y, size.y*3.0, abs(along));
      p.y -= along * (u_idle.z * .92 - u_poseB.w * .065) * wx * wy;
      return p;
    }
    void main() {
      vec2 original = a_position;
      v_uv = original / vec2(960.0,1280.0);
      vec2 p = original;
      ${rig.eyes.map(e => `p = eyelid(p, ${vec(e.slice(0,2))}, ${vec(e.slice(2,4))}, ${e[4].toFixed(5)});`).join('\n')}
      vec2 neck = ${vec(rig.neck)};
      float head = 1.0-smoothstep(neck.y-60.0, neck.y+110.0, original.y);
      head *= 1.0-smoothstep(170.0,270.0,abs(original.x-${rig.head[0].toFixed(1)}));
      vec2 local = p-neck;
      float angle = u_poseA.z*head;
      p = neck + mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*local;
      p += u_poseA.xy*head;
      float torso = weight(original,${vec(rig.chest)},vec2(245.0,420.0));
      p.x += u_poseA.w*torso;
      p.y -= u_idle.x*3.2*torso;
      p.x += (original.x-${rig.chest[0].toFixed(1)})*.006*u_idle.x*torso;
      p.x += u_poseB.x*weight(original,${vec(rig.arms[0])},vec2(100.0,300.0));
      p.x += u_poseB.y*weight(original,${vec(rig.arms[1])},vec2(100.0,285.0));
      p.y -= abs(u_poseB.x)*.25*weight(original,${vec(rig.arms[0])},vec2(100.0,220.0));
      p.y -= abs(u_poseB.y)*.25*weight(original,${vec(rig.arms[1])},vec2(100.0,220.0));
      p.x += u_poseB.z*weight(original,vec2(450.0,1110.0),vec2(200.0,250.0));
      float hairL = weight(original,${vec(rig.hair[0])},vec2(76.0,220.0));
      float hairR = weight(original,${vec(rig.hair[1])},vec2(62.0,210.0));
      p.x += u_idle.y*(hairL*.8-hairR*.6);
      // All movement tends to zero before the cropped floor; no image scaling.
      p = mix(p,original,smoothstep(1140.0,1280.0,original.y));
      vec2 clip = (p / vec2(960.0,1280.0)*2.0-1.0)*vec2(1.0,-1.0);
      gl_Position = vec4(clip*u_fit.xy+u_fit.zw,0.0,1.0);
    }
  `);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_texture;
    void main() { gl_FragColor = texture2D(u_texture,v_uv); }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  // Denser rows/columns around eyelids retain the painted lashes as eyes close.
  const xs = new Set(), ys = new Set();
  for (let x = 0; x < 960; x += 9) xs.add(x);
  for (let y = 0; y < 1280; y += 9) ys.add(y);
  xs.add(960); ys.add(1280);
  for (const [x,y,w,h] of rig.eyes) {
    for (let dx = -w * 1.5; dx <= w * 1.5; dx += 2) xs.add(x+dx);
    for (let dy = -h * 3; dy <= h * 3; dy += 2) ys.add(y+dy);
  }
  const columns = [...xs].sort((a,b)=>a-b), rows = [...ys].sort((a,b)=>a-b);
  const vertices = new Float32Array(columns.length * rows.length * 2);
  if (vertices.length / 2 > 65535) throw new Error('Portrait mesh exceeds index capacity');
  let cursor = 0;
  for (const y of rows) for (const x of columns) { vertices[cursor++] = x; vertices[cursor++] = y; }
  const indices = new Uint16Array((columns.length - 1) * (rows.length - 1) * 6);
  cursor = 0;
  for (let y = 0; y < rows.length - 1; y++) for (let x = 0; x < columns.length - 1; x++) {
    const a = y * columns.length + x, b = a + columns.length;
    indices.set([a, b, a+1, a+1, b, b+1], cursor); cursor += 6;
  }
  const vertexBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer(), texture = gl.createTexture();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  // WebGL 1 requires power-of-two textures for mipmaps. Derive this in memory
  // from the already decoded DOM image; no duplicate asset fetch or new art.
  const textureSource = document.createElement('canvas');
  textureSource.width = 1024; textureSource.height = 2048;
  const context = textureSource.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source,0,0,1024,2048);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureSource);
  gl.generateMipmap(gl.TEXTURE_2D);
  const uniforms = Object.fromEntries(['u_fit','u_poseA','u_poseB','u_idle'].map(key=>[key,gl.getUniformLocation(program,key)]));
  let width = 1, height = 1, fit = portraitFit(1,1,characterId,presentation);
  return {
    resize(w,h,dpr = 1) {
      width = Math.max(1,w); height = Math.max(1,h); fit = portraitFit(width,height,characterId,presentation);
      canvas.width = Math.round(width*Math.min(2,dpr)); canvas.height = Math.round(height*Math.min(2,dpr));
      gl.viewport(0,0,canvas.width,canvas.height);
      return fit;
    },
    draw(frame) {
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(uniforms.u_fit,fit.width/width,fit.height/height,
        (fit.left*2+fit.width)/width-1,1-(fit.top*2+fit.height)/height);
      gl.uniform4f(uniforms.u_poseA,...frame.pose.subarray(0,4));
      gl.uniform4f(uniforms.u_poseB,...frame.pose.subarray(4,8));
      gl.uniform3f(uniforms.u_idle,frame.breath,frame.hair,frame.blink);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    },
    destroy() {
      gl.deleteTexture(texture); gl.deleteBuffer(vertexBuffer); gl.deleteBuffer(indexBuffer); gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
