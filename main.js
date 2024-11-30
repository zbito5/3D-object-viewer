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

// compile the shaders
const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// create the program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("error linking program:", gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// get uniform locations
const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

// buffer variables
let vertexBuffer, indexBuffer;

// shape data
const shapes = {
  cube: {
    vertices: new Float32Array([
      -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
      -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
    ]),
    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 3, 2, 6, 3, 6, 7, 0, 1, 5, 0, 5, 4,
      1, 2, 6, 1, 6, 5, 0, 3, 7, 0, 7, 4,
    ])
  },
  pyramid: {
    vertices: new Float32Array([
      0,  0.5,  0,  -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5, -0.5, -0.5,
      -0.5, -0.5, -0.5,
    ]),
    indices: new Uint16Array([
      0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 1,  1, 2, 3,  1, 3, 4,
    ])
  },
  sphere: generateSphereData(0.5, 16, 16)
};

// utility function to generate sphere data
function generateSphereData(radius, longitudeBands, latitudeBands) {
  const vertices = [];
  const indices = [];
  for (let lat = 0; lat <= latitudeBands; ++lat) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; ++lon) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      vertices.push(radius * cosPhi * sinTheta, radius * cosTheta, radius * sinPhi * sinTheta);
    }
  }
  for (let lat = 0; lat < latitudeBands; ++lat) {
    for (let lon = 0; lon < longitudeBands; ++lon) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices)
  };
}

// initialize buffers
function setShape(shape) {
  const data = shapes[shape];
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
}

// track user interaction
let rotationX = 0, rotationY = 0, zoom = -3.0, panX = 0, panY = 0;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;

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

    if (e.buttons === 1) {
      rotationX += dy * 0.01;
      rotationY += dx * 0.01;
    } else if (e.buttons === 2) {
      panX += dx * 0.01;
      panY -= dy * 0.01;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

canvas.addEventListener('mouseup', () => (isDragging = false));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom += e.deltaY * 0.01;
});

// keyboard interaction for rotation
window.addEventListener('keydown', (e) => {
  const rotationSpeed = 0.05;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
  switch (e.key) {
    case 'ArrowUp': rotationX -= rotationSpeed; break;
    case 'ArrowDown': rotationX += rotationSpeed; break;
    case 'ArrowLeft': rotationY -= rotationSpeed; break;
    case 'ArrowRight': rotationY += rotationSpeed; break;
  }
});

// create projection matrix
function createProjectionMatrix() {
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
  return projectionMatrix;
}

// create model-view matrix
function createModelViewMatrix() {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [panX, panY, zoom]);
  mat4.rotateX(modelViewMatrix, modelViewMatrix, rotationX);
  mat4.rotateY(modelViewMatrix, modelViewMatrix, rotationY);
  return modelViewMatrix;
}

// draw scene
function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const projectionMatrix = createProjectionMatrix();
  const modelViewMatrix = createModelViewMatrix();

  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

  const data = shapes[currentShape];
  gl.drawElements(gl.TRIANGLES, data.indices.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(drawScene);
}

// initialize
let currentShape = 'cube';
document.getElementById('shapeSelector').addEventListener('change', (e) => {
  currentShape = e.target.value;
  setShape(currentShape);
});
setShape(currentShape);
drawScene();
