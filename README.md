Project Overview

This project is a 3D Shape Viewer designed to display various 3D shapes such as cubes, pyramids, spheres, cyclinder, etc in a web environment using WebGL. Users can interact with the objects by rotating them, zooming in and out, and changing their views. The application is built with HTML and JavaScript, utilizing WebGL for rendering the 3D graphics.

Running the Project

	1.	Prerequisites:
        •	A modern web browser with support for WebGL (e.g., Google Chrome, Firefox, Safari).
        •	An internet connection to load external libraries.
	2.	Opening the Project:
        •	Download the project folder to your local machine.
        •	Locate the index.html file in the project directory.
	3.	Launching the Application:
        •	Open the index.html file in a web browser by double-clicking on it or dragging it into your browser window.
        •	The project should load displaying a 3D object on the canvas.

Interacting with the Application

	•	Shape Selection:
	•	Use the dropdown menu above the canvas to switch between different 3D shapes like the cube, pyramid, or sphere.
	•	Camera Controls:
	•	Rotate: Click and drag on the canvas to rotate the object.
	•	Zoom: Scroll up or down to zoom in or out.
	•	Pan: Right-click and drag to pan the view.

Technical Details

	•	HTML Canvas:
	•	The 3D rendering takes place on a canvas element defined in the HTML file with dimensions set to 800x600 pixels.
	•	JavaScript and WebGL:
	•	The main.js file contains the WebGL context initialization, shader program setup, and render loop.
	•	Vertex and fragment shaders are defined for basic lighting and material effects.
	•	Libraries Used:
	•	glMatrix: An external JavaScript library for managing matrix operations, which is crucial for transformations and calculations in a 3D space.

Troubleshooting

	•	WebGL Not Supported:
	•	Ensure your browser is up-to-date if the WebGL content does not render.
	•	Script Errors:
	•	Open the developer console in your browser to check for any errors or warnings that might provide more insight into issues with the WebGL scripts.