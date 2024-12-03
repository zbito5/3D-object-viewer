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
  varying float vLightIntensity;
  
  void main() {
    vec4 viewPosition = uModelViewMatrix * aPosition;
    vPosition = viewPosition.xyz;
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float diffuseIntensity = max(dot(vNormal, lightDirection), 0.0);
    vLightIntensity = 0.3 + 0.7 * diffuseIntensity;
    gl_Position = uProjectionMatrix * viewPosition;
  }
`;

// fragment shader code
const fragmentShaderSource = `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vLightIntensity;
  uniform vec3 uMaterialAmbient;
  uniform vec3 uMaterialDiffuse;
  uniform vec3 uMaterialSpecular;
  uniform float uShininess;
  void main() {
    vec3 color = uMaterialAmbient * 0.3 + uMaterialDiffuse * vLightIntensity;
    vec3 viewDirection = normalize(-vPosition);
    vec3 reflectDirection = reflect(-normalize(vec3(1.0, 1.0, 1.0)), vNormal);
    float specularIntensity = pow(max(dot(viewDirection, reflectDirection), 0.0), uShininess);
    color += uMaterialSpecular * specularIntensity;
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
            -0.5, -0.5, 0.5, 0, 0, 1, // Front face
            0.5, -0.5, 0.5, 0, 0, 1,
            0.5, 0.5, 0.5, 0, 0, 1,
            -0.5, 0.5, 0.5, 0, 0, 1,

            -0.5, -0.5, -0.5, 0, 0, -1, // Back face
            -0.5, 0.5, -0.5, 0, 0, -1,
            0.5, 0.5, -0.5, 0, 0, -1,
            0.5, -0.5, -0.5, 0, 0, -1,

            -0.5, 0.5, -0.5, 0, 1, 0, // Top face
            -0.5, 0.5, 0.5, 0, 1, 0,
            0.5, 0.5, 0.5, 0, 1, 0,
            0.5, 0.5, -0.5, 0, 1, 0,

            -0.5, -0.5, -0.5, 0, -1, 0, // Bottom face
            0.5, -0.5, -0.5, 0, -1, 0,
            0.5, -0.5, 0.5, 0, -1, 0,
            -0.5, -0.5, 0.5, 0, -1, 0,

            0.5, -0.5, -0.5, 1, 0, 0, // Right face
            0.5, 0.5, -0.5, 1, 0, 0,
            0.5, 0.5, 0.5, 1, 0, 0,
            0.5, -0.5, 0.5, 1, 0, 0,

            -0.5, -0.5, -0.5, -1, 0, 0, // Left face
            -0.5, -0.5, 0.5, -1, 0, 0,
            -0.5, 0.5, 0.5, -1, 0, 0,
            -0.5, 0.5, -0.5, -1, 0, 0,
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
            0, 0.5, 0, 0, 1, 0, // Top vertex
            -0.5, -0.5, 0.5, -0.577, -0.577, 0.577, // Front-left
            0.5, -0.5, 0.5, 0.577, -0.577, 0.577, // Front-right
            0.5, -0.5, -0.5, 0.577, -0.577, -0.577, // Back-right
            -0.5, -0.5, -0.5, -0.577, -0.577, -0.577, // Back-left
        ]),
        indices: new Uint16Array([
            0, 1, 2,   // Front face
            0, 2, 3,   // Right face
            0, 3, 4,   // Back face
            0, 4, 1,   // Left face
            1, 4, 3, 1, 3, 2 // Bottom face
        ])
    },
    sphere: generateSphereData(0.5, 32, 32),
    cylinder: generateCylinderData(0.5, 1.0, 32),
    cone: generateConeData(0.5, 1.0, 32),
};

function generateConeData(radius, height, radialSegments) {
    const vertices = [];
    const indices = [];

    // Add the tip of the cone
    vertices.push(0, height / 2, 0, 0, 1, 0); // Tip vertex

    // Add the base vertices
    for (let i = 0; i <= radialSegments; ++i) {
        const theta = (i * 2 * Math.PI) / radialSegments;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        vertices.push(x, -height / 2, z, 0, -1, 0); // Base vertex
    }

    // Indices for the cone sides
    for (let i = 1; i <= radialSegments; ++i) {
        const next = i + 1 > radialSegments ? 1 : i + 1; // Wrap to the first vertex
        indices.push(0, i, next);
    }

    // Indices for the base
    const baseCenterIndex = vertices.length / 6; // Center of the base
    vertices.push(0, -height / 2, 0, 0, -1, 0); // Base center vertex
    for (let i = 1; i < radialSegments; ++i) {
        indices.push(baseCenterIndex, i + 1, i);
    }
    indices.push(baseCenterIndex, 1, radialSegments); // Close the base

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
    };
}


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
            const x = radius * cosPhi * sinTheta;
            const y = radius * cosTheta;
            const z = radius * sinPhi * sinTheta;
            vertices.push(x, y, z, x, y, z);
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

function generateCylinderData(radius, height, radialSegments) {
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= radialSegments; ++i) {
        const theta = (i * 2 * Math.PI) / radialSegments;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        vertices.push(x, height / 2, z, 0, 1, 0);
        vertices.push(x, -height / 2, z, 0, -1, 0);
    }
    vertices.push(0, height / 2, 0, 0, 1, 0);
    vertices.push(0, -height / 2, 0, 0, -1, 0);
    const topCenterIndex = vertices.length / 6 - 2;
    const bottomCenterIndex = vertices.length / 6 - 1;
    for (let i = 0; i < radialSegments; ++i) {
        const next = (i + 1) % radialSegments;
        indices.push(topCenterIndex, i * 2, next * 2);
        indices.push(bottomCenterIndex, next * 2 + 1, i * 2 + 1);
        indices.push(i * 2, i * 2 + 1, next * 2);
        indices.push(next * 2, i * 2 + 1, next * 2 + 1);
    }
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
    };
}

function setShape(shape) {
    const data = shapes[shape];
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
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

let rotationX = 0, rotationY = 0, rotationZ = 0, panX = 0, panY = 0, zoom = -3.0;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        if (e.buttons === 1) { rotationX += dy * 0.01; rotationY += dx * 0.01; }
        else if (e.buttons === 2) { panX += dx * 0.01; panY -= dy * 0.01; }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});

canvas.addEventListener('mouseup', () => (isDragging = false));
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom += e.deltaY * 0.01; });

// Handle keyboard input for shape rotation
window.addEventListener('keydown', (e) => {
    const rotationSpeed = 0.05;

    // Prevent the page from scrolling when arrow keys are pressed
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    // Adjust rotation based on the pressed key
    switch (e.key) {
        case 'ArrowUp':
            rotationX -= rotationSpeed; // Rotate up
            break;
        case 'ArrowDown':
            rotationX += rotationSpeed; // Rotate down
            break;
        case 'ArrowLeft':
            rotationY -= rotationSpeed; // Rotate left
            break;
        case 'ArrowRight':
            rotationY += rotationSpeed; // Rotate right
            break;
        case 'q':
            rotationZ -= rotationSpeed; // Rotate counterclockwise around Z
            break;
        case 'e':
            rotationZ += rotationSpeed; // Rotate clockwise around Z
            break;
    }
});


function createProjectionMatrix() {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    return projectionMatrix;
}

function createModelViewMatrix() {
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [panX, panY, zoom]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, rotationX);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, rotationY);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotationZ);
    return modelViewMatrix;
}

function createNormalMatrix(modelViewMatrix) {
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    return normalMatrix;
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const projectionMatrix = createProjectionMatrix();
    const modelViewMatrix = createModelViewMatrix();
    const normalMatrix = createNormalMatrix(modelViewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);
    gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialAmbient'), [0.2, 0.2, 0.2]);
    gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialDiffuse'), [0.8, 0.6, 0.4]);
    gl.uniform3fv(gl.getUniformLocation(program, 'uMaterialSpecular'), [1.0, 1.0, 1.0]);
    gl.uniform1f(gl.getUniformLocation(program, 'uShininess'), 64.0);
    const data = shapes[currentShape];
    gl.drawElements(gl.TRIANGLES, data.indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(drawScene);
}

let currentShape = 'cube';
document.getElementById('shapeSelector').addEventListener('change', (e) => {
    currentShape = e.target.value;
    setShape(currentShape);
});
setShape(currentShape);
drawScene();
