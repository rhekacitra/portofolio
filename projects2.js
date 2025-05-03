import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');


// const svg = d3.select('svg');
// const legend = d3.select('.legend');

// let query = '';
// let currentPieData = []; // holds current pie slice labels like '2023'

// // Initial render
// renderProjects(projects, projectsContainer, 'h2');
// renderPieChart(projects);

// // Filter + re-render on input
// searchInput.addEventListener('input', (event) => {
//   query = event.target.value.toLowerCase();

//   let filteredProjects = projects.filter((project) => {
//     let values = Object.values(project).join('\n').toLowerCase();
//     return values.includes(query);
//   });

//   renderProjects(filteredProjects, projectsContainer, 'h2');
//   renderPieChart(filteredProjects);
// });

// function renderPieChart(projectsGiven) {
//   // Clear previous slices and legend
//   svg.selectAll('path').remove();
//   legend.selectAll('li').remove();

//   // Re-group by year
//   let rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);

//   let data = rolledData.map(([year, count]) => ({
//     value: count,
//     label: year
//   }));

//   // Pie chart setup
//   let sliceGenerator = d3.pie().value(d => d.value);
//   let arcData = sliceGenerator(data);

//   // let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
//   let colors = d3.scaleOrdinal(d3.schemePastel1);

//   let arc = d3.arc().innerRadius(0).outerRadius(50)({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });

//   // Add pie slices
//   arcData.forEach((d, idx) => {
//     svg.append('path')
//       .attr('d', arcGenerator(d))
//       .attr('fill', colors(idx));
//   });

//   // Add legend items
//   data.forEach((d, idx) => {
//     legend.append('li')
//       .attr('style', `--color:${colors(idx)}`)
//       .attr('class', 'legend-item')
//       .html(`<span class="swatch"></span> <strong>${d.label}</strong> <em>(${d.value})</em>`);
//   });

//   let selectedIndex = -1;

//   svg.selectAll('path').remove();

//   arcs.forEach((arc, i) => {
//     svg
//       .append('path')
//       .attr('d', arc)
//       .attr('fill', colors(i))
//       .attr('class', i === selectedIndex ? 'selected' : '')
//       .on('click', () => {
//         // Toggle selected index
//         selectedIndex = selectedIndex === i ? -1 : i;

//         // Update pie slice styles
//         svg.selectAll('path')
//           .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '')
//           .attr('fill', (_, idx) => idx === selectedIndex ? 'oklch(60% 45% 0)' : colors(idx));

//         // update legends
//         legend.selectAll('li')
//           .attr('class', (_, idx) =>
//             idx === selectedIndex ? 'legend-item selected' : 'legend-item'
//           );

//         updateFilteredProjects();
//       });
//   });
// }


// // svg.selectAll('path')
// //   .data(arcData)
// //   .enter()
// //   .append('path')
// //   .attr('d', arcGenerator)
// //   .attr('fill', (d, i) => colors(i))
// //   .on('click', (_, i) => {
// //     selectedIndex = selectedIndex === i ? -1 : i;

// //     // highlight selected pie slice
// //     svg.selectAll('path')
// //       .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

// //     // highlight matching legend
// //     legend.selectAll('li')
// //       .attr('class', (_, idx) =>
// //         idx === selectedIndex ? 'legend-item selected' : 'legend-item'
// //       );

// //     // trigger project filtering based on selected year
// //     updateFilteredProjects();
// //   });

// function updateFilteredProjects() {
//   let filtered = projects;

//   // Step 1: Apply search query
//   if (query) {
//     filtered = filtered.filter((project) => {
//       const values = Object.values(project).join('\n').toLowerCase();
//       return values.includes(query.toLowerCase());
//     });
//   }

//   // Step 2: Apply year filter (if a wedge is selected. selected is when !== -1)
//   if (selectedIndex !== -1 && currentPieData[selectedIndex]) {
//     const selectedYear = currentPieData[selectedIndex].label;
//     filtered = filtered.filter(project => project.year === selectedYear);
//   }

//   // Step 3: Render the filtered list
//   renderProjects(filtered, projectsContainer, 'h2');
// }
