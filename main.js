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
  attribute vec3 aNormal;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix; 
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vPosition = vec3(uModelViewMatrix * aPosition);
    vNormal = normalize(mat3(uNormalMatrix) * aNormal); 
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  }
`;

// fragment shader code
const fragmentShaderSource = `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 uLightPosition;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientLight;
  uniform vec3 uMaterialAmbient;
  uniform vec3 uMaterialDiffuse;
  uniform vec3 uMaterialSpecular;
  uniform float uShininess;

  void main() {
    vec3 lightDir = normalize(uLightPosition - vPosition);
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition); // Camera is at origin
    vec3 reflectDir = reflect(-lightDir, normal);

    // Ambient component
    vec3 ambient = uAmbientLight * uMaterialAmbient;

    // Diffuse component
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = uLightColor * uMaterialDiffuse * diff;

    // Specular component
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = uLightColor * uMaterialSpecular * spec;

    // Combine components
    vec3 color = ambient + diffuse + specular;
    gl_FragColor = vec4(color, 1.0);
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
      // Positions          Normals
      -0.5, -0.5,  0.5,     0,  0,  1, // Front face
      0.5, -0.5,  0.5,     0,  0,  1,
      0.5,  0.5,  0.5,     0,  0,  1,
      -0.5,  0.5,  0.5,     0,  0,  1,

      -0.5, -0.5, -0.5,     0,  0, -1, // Back face
      -0.5,  0.5, -0.5,     0,  0, -1,
      0.5,  0.5, -0.5,     0,  0, -1,
      0.5, -0.5, -0.5,     0,  0, -1,

      -0.5,  0.5, -0.5,     0,  1,  0, // Top face
      -0.5,  0.5,  0.5,     0,  1,  0,
      0.5,  0.5,  0.5,     0,  1,  0,
      0.5,  0.5, -0.5,     0,  1,  0,

      -0.5, -0.5, -0.5,     0, -1,  0, // Bottom face
      0.5, -0.5, -0.5,     0, -1,  0,
      0.5, -0.5,  0.5,     0, -1,  0,
      -0.5, -0.5,  0.5,     0, -1,  0,

      0.5, -0.5, -0.5,     1,  0,  0, // Right face
      0.5,  0.5, -0.5,     1,  0,  0,
      0.5,  0.5,  0.5,     1,  0,  0,
      0.5, -0.5,  0.5,     1,  0,  0,

      -0.5, -0.5, -0.5,    -1,  0,  0, // Left face
      -0.5, -0.5,  0.5,    -1,  0,  0,
      -0.5,  0.5,  0.5,    -1,  0,  0,
      -0.5,  0.5, -0.5,    -1,  0,  0,
    ]),
    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3,       // Front face
      4, 5, 6, 4, 6, 7,       // Back face
      8, 9, 10, 8, 10, 11,    // Top face
      12, 13, 14, 12, 14, 15, // Bottom face
      16, 17, 18, 16, 18, 19, // Right face
      20, 21, 22, 20, 22, 23, // Left face
    ])
  },
  pyramid: {
    vertices: new Float32Array([
      // Positions          Normals
      0,  0.5,  0,         0,  1,  0, // Top
     -0.5, -0.5,  0.5,     0,  0,  1, // Front-left
      0.5, -0.5,  0.5,     0,  0,  1, // Front-right
      0.5, -0.5, -0.5,     1,  0,  0, // Back-right
     -0.5, -0.5, -0.5,    -1,  0,  0, // Back-left
    ]),
    indices: new Uint16Array([
      0, 1, 2, // Front face
      0, 2, 3, // Right face
      0, 3, 4, // Back face
      0, 4, 1, // Left face
      1, 4, 3, 1, 3, 2, // Bottom face
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

      // Calculate vertex position
      const x = radius * cosPhi * sinTheta;
      const y = radius * cosTheta;
      const z = radius * sinPhi * sinTheta;

      // Normalized normal vector
      const nx = cosPhi * sinTheta;
      const ny = cosTheta;
      const nz = sinPhi * sinTheta;

      // Add position and normal to the vertex data
      vertices.push(x, y, z, nx, ny, nz);
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
    indices: new Uint16Array(indices),
  };
}

// initialize buffers
function setShape(shape) {
  const data = shapes[shape];
  const stride = 6 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);

  const aNormal = gl.getAttribLocation(program, 'aNormal');
  gl.enableVertexAttribArray(aNormal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
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
// Add this function to calculate the normal matrix
function createNormalMatrix(modelViewMatrix) {
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  return normalMatrix;
}
// draw scene
function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const projectionMatrix = createProjectionMatrix();
  const modelViewMatrix = createModelViewMatrix();

  // Calculate normal matrix
  const normalMatrix = createNormalMatrix(modelViewMatrix);

  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

  // Add this line to pass the normal matrix
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);

  gl.uniform3fv(gl.getUniformLocation(program, 'uLightPosition'), [1.0, 1.0, 1.0]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uLightColor'), [1.0, 1.0, 1.0]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uAmbientLight'), [0.4, 0.4, 0.4]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialAmbient'), [0.2, 0.2, 0.2]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialDiffuse'), [0.8, 0.3, 0.3]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialSpecular'), [1.0, 1.0, 1.0]);
  gl.uniform1f(gl.getUniformLocation(program, 'uShininess'), 64.0);

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
