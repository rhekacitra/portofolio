import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

function filterByQuery(projects) {
  return projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('svg');
  svg.selectAll('path').remove();

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  if (data.length === 0) return;

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const colors = d3.scaleOrdinal(d3.schemePastel1);

  const arcs = arcData.map((d) => arcGenerator(d));

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : null)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

        legend.selectAll('li')
          .attr('class', (_, idx) => `legend-item${idx === selectedIndex ? ' selected' : ''}`);

        const selectedYear = data[selectedIndex]?.label;

        const filtered = filterByQuery(projects).filter((p) =>
          selectedIndex === -1 ? true : p.year === selectedYear
        );

        renderProjects(filtered, projectsContainer, 'h2');
      });
  });

  legend
    .selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .attr('style', (d, i) => `--color:${colors(i)}`)
    .attr('class', (d, i) => `legend-item${i === selectedIndex ? ' selected' : ''}`)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (_, d, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;

      svg.selectAll('path')
        .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

      legend.selectAll('li')
        .attr('class', (_, idx) => `legend-item${idx === selectedIndex ? ' selected' : ''}`);

      const selectedYear = data[selectedIndex]?.label;

      const filtered = filterByQuery(projects).filter((p) =>
        selectedIndex === -1 ? true : p.year === selectedYear
      );

      renderProjects(filtered, projectsContainer, 'h2');
    });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  selectedIndex = -1;

  const filteredProjects = filterByQuery(projects);

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});
