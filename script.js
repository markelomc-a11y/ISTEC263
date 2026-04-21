// ---------- WEBGL (efeito líquido) ----------
const glCanvas = document.getElementById("webgl");
const gl = glCanvas.getContext("webgl");

glCanvas.width = window.innerWidth;
glCanvas.height = window.innerHeight;

gl.viewport(0, 0, glCanvas.width, glCanvas.height);

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision mediump float;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / vec2(${window.innerWidth.toFixed(1)}, ${window.innerHeight.toFixed(1)});
  
  float wave = sin(uv.x * 10.0 + time) * 0.02;
  float drip = smoothstep(0.5 + wave, 0.4, uv.y);

  gl_FragColor = vec4(0.5 * drip, 0.0, 0.0, drip);
}
`;

function shader(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return s;
}

const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
gl.linkProgram(program);
gl.useProgram(program);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,-1, 1,-1, -1,1,
  -1,1, 1,-1, 1,1
]), gl.STATIC_DRAW);

const pos = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(pos);
gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(program, "time");

// ---------- PARTÍCULAS ----------
const bloodCanvas = document.getElementById("blood");
const ctx = bloodCanvas.getContext("2d");

bloodCanvas.width = window.innerWidth;
bloodCanvas.height = window.innerHeight;

const particles = [];

for (let i = 0; i < 150; i++) {
  particles.push({
    x: Math.random() * bloodCanvas.width,
    y: Math.random() * bloodCanvas.height,
    speed: 2 + Math.random() * 4,
    size: Math.random() * 3 + 1
  });
}

// ---------- LOOP ----------
let time = 0;

function render() {
  time += 0.01;

  // WebGL
  gl.uniform1f(timeLoc, time);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 2D particles
  ctx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
  ctx.fillStyle = "red";

  particles.forEach(p => {
    p.y += p.speed;

    if (p.y > bloodCanvas.height) {
      p.y = 0;
      p.x = Math.random() * bloodCanvas.width;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(render);
}

render();