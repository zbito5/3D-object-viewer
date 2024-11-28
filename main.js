// get the canvas and webgl context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

// check if webgl is supported
if (!gl) {
  alert("webgl isn't supported in this browser.");
}

// set the canvas background color
gl.clearColor(0.8, 0.8, 0.8, 1.0); // light gray
gl.enable(gl.DEPTH_TEST); // enable depth testing

// vertex shader
const vertexShaderSource = `
  attribute vec4 aPosition;
  attribute vec4 aColor;
  varying vec4 vColor;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  void main() {
    vColor = aColor;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  }
`;

// fragment shader
const fragmentShaderSource = `
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor; // use color passed from vertex shader
  }
`;

// compile shader function
function compileShader(gl, sourceCode, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// compile shaders and create program
const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("error linking program:", gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// define cube vertices and colors
const cubeVertices = new Float32Array([
  // front face
  -0.5, -0.5,  0.5, // bottom-left
   0.5, -0.5,  0.5, // bottom-right
   0.5,  0.5,  0.5, // top-right
  -0.5,  0.5,  0.5, // top-left
  // back face
  -0.5, -0.5, -0.5, // bottom-left
   0.5, -0.5, -0.5, // bottom-right
   0.5,  0.5, -0.5, // top-right
  -0.5,  0.5, -0.5, // top-left
]);

const cubeColors = new Float32Array([
  1.0, 0.0, 0.0, 1.0, // front face red
  1.0, 0.0, 0.0, 1.0,
  1.0, 0.0, 0.0, 1.0,
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0, // back face green
  0.0, 1.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
]);

// generate sphere vertices
function createSphere(radius, latBands, longBands) {
  const vertices = [];
  for (let lat = 0; lat <= latBands; ++lat) {
    const theta = (lat * Math.PI) / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longBands; ++lon) {
      const phi = (lon * 2 * Math.PI) / longBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      vertices.push(radius * x, radius * y, radius * z);
    }
  }
  return new Float32Array(vertices);
}

const sphereVertices = createSphere(0.5, 30, 30);

// create buffers
const cubeVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const cubeColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

const sphereVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);

// handle shape switching
let currentShape = 'cube';

document.getElementById('cubeButton').addEventListener('click', () => {
  currentShape = 'cube';
  console.log(`Current shape is now: ${currentShape}`);
});

document.getElementById('sphereButton').addEventListener('click', () => {
  currentShape = 'sphere';
  console.log(`Current shape is now: ${currentShape}`);
});

// add zoom interaction
let zoom = -2.0;
canvas.addEventListener('wheel', (event) => {
  zoom += event.deltaY * -0.01;
  zoom = Math.min(Math.max(zoom, -10.0), -1.0);
  console.log(`Zoom level: ${zoom}`);
});

// create model view matrix
function createModelViewMatrix() {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, zoom]);
  mat4.rotateY(modelViewMatrix, modelViewMatrix, Date.now() * 0.001);
  mat4.rotateX(modelViewMatrix, modelViewMatrix, Date.now() * 0.0005);
  return modelViewMatrix;
}

// draw the scene
function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);

  const modelViewMatrix = createModelViewMatrix();

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelViewMatrix'), false, modelViewMatrix);

  if (currentShape === 'cube') {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aPosition'), 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aPosition'));

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColor'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColor'));

    gl.drawArrays(gl.TRIANGLE_FAN, 0, cubeVertices.length / 3);
    console.log('Drawing cube');
  } else if (currentShape === 'sphere') {
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aPosition'), 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aPosition'));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, sphereVertices.length / 3);
    console.log('Drawing sphere');
  }

  requestAnimationFrame(drawScene);
}

// start rendering
drawScene();
