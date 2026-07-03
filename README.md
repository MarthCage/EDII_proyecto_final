# Sistema de pre-requisitos universitario

Pagina web estatica para el proyecto final de Estructuras Discretas II.

## Funciones

- Registro de cursos.
- Eliminacion de cursos por nombre.
- Registro de relaciones de prerrequisito.
- Visualizacion del grafo por ciclos.
- BFS para ver cursos que dependen de un curso seleccionado.
- DFS para validar si la malla es un DAG.
- Calculo de cursos disponibles escribiendo cursos aprobados separados por comas.
- Ventana modal de resultados para todas las acciones principales.

## Como usar

Abre `index.html` en el navegador.

## Como subir a GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube `index.html`, `styles.css`, `app.js` y `README.md`.
3. Entra a Settings > Pages.
4. Elige Deploy from a branch.
5. Selecciona la rama `main` y carpeta `/root`.
6. Guarda y copia el enlace generado por GitHub Pages.

## Actualizacion de visualizacion

La seccion del grafo tiene tamano fijo. Si hay mas ciclos o mas cursos de los que caben en pantalla, se usan barras de desplazamiento horizontal y vertical dentro del panel del grafo.
