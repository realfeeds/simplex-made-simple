# Simplex Made Simple

An interactive web application for practicing the step-by-step Simplex Tableau method in linear programming.

## Features

- Exact fraction arithmetic and symbolic Big-M representation (e.g., `1/3`, `6+2M`, `-M`).
- Step-by-step educational workflow:
  - Problem setup and dimension configuration.
  - Conversion to standard minimization form (slack, surplus, and artificial variables).
  - Initial tableau construction and Row 0 Gauss-Jordan elimination for artificial variables.
  - Interactive pivoting (optimality check, entering/leaving variable selection, ratio test, and tableau row operations).
  - Automatic detection and explanation of unbounded solutions.
  - Final solution reading and validation.
- Integrated help guides for each step.
- Random problem generator for practice.

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- KaTeX (LaTeX math rendering)

## Repository Structure

- `index.html` - Main HTML layout and application entry point.
- `style.css` - Styles for cards, tableaus, and help drawer.
- `app.js` - Fraction and Big-M algebra classes, Simplex solver engine, problem generator, and UI controller.

## How to Run

Open `index.html` directly in any modern web browser or serve it using a local development server.
