// get the canvas element and webgl context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

// check if webgl is supported
if (!gl) {
  alert("webgl isn't supported in this browser.");
}

// set the background color for the canvas
gl.clearColor(0.8, 0.8, 0.8, 1.0); // light gray
gl.enable(gl.DEPTH_TEST); // enable depth testing for 3d rendering

// vertex shader code
const vertexShaderSource = `
  attribute vec4 aPosition;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  }
`;

// fragment shader code
const fragmentShaderSource = `
  void main() {
    gl_FragColor = vec4(0.5, 0.2, 0.8, 1.0); // purple color
  }
`;

// function to compile shaders
function compileShader(gl, sourceCode, type) {
  const shader = gl.createShader(type); // create shader
  gl.shaderSource(shader, sourceCode); // set source code
  gl.compileShader(shader); // compile the shader

  // check for compilation errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// compile the vertex and fragment shaders
const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// create the webgl program and link shaders
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// check for linking errors
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("error linking program:", gl.getProgramInfoLog(program));
}

// use the program
gl.useProgram(program);

// define cube vertices
const vertices = new Float32Array([
  // front face
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
  // back face
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,
  // top face
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,
  // bottom face
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5,
  // right face
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
  // left face
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,
]);

// define indices for cube faces
const indices = new Uint16Array([
  0, 1, 2, 0, 2, 3,   // front face
  4, 5, 6, 4, 6, 7,   // back face
  8, 9, 10, 8, 10, 11, // top face
  12, 13, 14, 12, 14, 15, // bottom face
  16, 17, 18, 16, 18, 19, // right face
  20, 21, 22, 20, 22, 23  // left face
]);

// create and bind vertex buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// create and bind index buffer
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// enable and configure position attribute
const aPosition = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

// get uniform locations for matrices
const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

// track user interaction
let rotationX = 0;
let rotationY = 0;
let zoom = -3.0;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// mouse interaction
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;

    // left mouse button rotates
    if (e.buttons === 1) {
      rotationX += dy * 0.01;
      rotationY += dx * 0.01;
    }

    // right mouse button pans
    if (e.buttons === 2) {
      panX += dx * 0.01;
      panY -= dy * 0.01;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

canvas.addEventListener('mouseup', () => (isDragging = false));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); // prevent default scrolling
  const zoomSpeed = 0.05; // fine-tune zoom sensitivity
  zoom += e.deltaY * zoomSpeed; // adjust zoom level
});

// keyboard interaction for rotation
window.addEventListener('keydown', (e) => {
  const rotationSpeed = 0.05; // how much the cube rotates per key press

  // prevent default behavior for arrow keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }

  // handle cube rotation
  switch (e.key) {
    case 'ArrowUp':    // rotate upward
      rotationX -= rotationSpeed;
      break;
    case 'ArrowDown':  // rotate downward
      rotationX += rotationSpeed;
      break;
    case 'ArrowLeft':  // rotate left
      rotationY -= rotationSpeed;
      break;
    case 'ArrowRight': // rotate right
      rotationY += rotationSpeed;
      break;
  }
});

// function to create projection matrix
function createProjectionMatrix() {
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
  return projectionMatrix;
}

// function to create model-view matrix
function createModelViewMatrix() {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [panX, panY, zoom]); // apply zoom and pan
  mat4.rotateX(modelViewMatrix, modelViewMatrix, rotationX); // rotate x-axis
  mat4.rotateY(modelViewMatrix, modelViewMatrix, rotationY); // rotate y-axis
  return modelViewMatrix;
}

// function to render the scene
function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projectionMatrix = createProjectionMatrix();
  const modelViewMatrix = createModelViewMatrix();

  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(drawScene);
}

// start rendering
drawScene();
