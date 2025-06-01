import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let data = await loadData();

let commits = processCommits(data);
let filteredCommits = commits;
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let commitProgress = 100;
const brush = d3.brush().on('start brush end', brushed);

// let timeScale = d3
//   .scaleTime()
//   .domain([
//     d3.min(commits, (d) => d.datetime),
//     d3.max(commits, (d) => d.datetime),
//   ])
//   .range([0, 100]);

let timeScale = d3.scaleTime(
  [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
  [0, 100]
);

let commitMaxTime = timeScale.invert(commitProgress);
let renderedCommitIDs = new Set(); 


const timeSlider = document.getElementById("commit-progress");
// const selectedTime = document.getElementById("commit-time");
const selectedTime = d3.select('#selectedTime');

selectedTime.text(
  commitMaxTime.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short"
  })
);

let lines = filteredCommits.flatMap((d) => d.lines);
let files = [];
files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  });

let NUM_ITEMS = 100;
let ITEM_HEIGHT = 100;
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');

const scroller = scrollama();

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
    return d3
      .groups(data, d => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
  
        let ret = {
          id: commit,
          url: 'https://github.com/rhekacitra/portofolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length
        };
  
        // Object.defineProperty(ret, 'lines', {
        //   value: lines,
        //   enumerable: false,
        //   writable: false,
        //   configurable: true
        // });

        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: true,
          configurable: true,
          enumerable: false  // hides it from console.log
        });
  
        return ret;
      });
}

  
// function onTimeSliderChange() {
//     commitMaxTime = timeSlider.valueAsDate;
  
//     filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  
    
//     updateScatterPlot(data, filteredCommits);
  
//     // renderCommitInfo(data, filteredCommits);

//     updateFileDisplay(filteredCommits);
// }

function onTimeSliderChange() {
  commitProgress = Number(d3.select('#commitSlider').property('value'));
  commitMaxTime = timeScale.invert(commitProgress);

  selectedTime.text(
    commitMaxTime.toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  );

  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits); // Step 2
  renderCommitInfo(  // ✅ Add this line
    filteredCommits.flatMap(d => d.lines), 
    filteredCommits
  );
}

d3.select('#commitSlider').on('input', onTimeSliderChange);
renderScatterPlot(data, filteredCommits); // creates SVG once
updateScatterPlot(data, filteredCommits); // renders first view

function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };


  const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');

  xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([0, width])
      .nice();
  
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  const dots = svg.append('g').attr('class', 'dots');

  // svg.call(d3.brush());
  svg.call(d3.brush().on('start brush end', brushed));


  svg.selectAll('.dots, .overlay ~ *').raise();

  // const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
      .selectAll('circle')
      .data(sortedCommits, (d) => d.id)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', 5)
      .attr('fill', 'steelblue');

  // Add gridlines BEFORE the axes
  const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);

  // Add Y axis
  svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);

  // const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.5) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.5);
      updateTooltipVisibility(false);
  });

}

function renderCommitInfo(data, commits) {
    d3.select('#stats').selectAll('*').remove();

    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Total lines of code
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Compute file lengths: [ [fileName, maxLine], ... ]
    const fileLengths = d3.rollups(
        data,
        v => d3.max(v, d => d.line),
        d => d.file
    );

    // Longest file
    const longestFile = d3.greatest(fileLengths, d => d[1]); // [fileName, maxLine]
    dl.append('dt').text('Longest file');
    dl.append('dd').text(`${longestFile[1]} lines`);
  
    // Number of files
    const numFiles = d3.groups(data, d => d.file).length;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(numFiles);
  
    // Longest line
    const longestLine = d3.greatest(data, d => d.length);
    dl.append('dt').text('Longest line length');
    dl.append('dd').text(longestLine.length);
  
    // Most active time of day
    const workByPeriod = d3.rollups(
      data,
      v => v.length,
      d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
    dl.append('dt').text('Most active time of day');
    dl.append('dd').text(maxPeriod || 'Unknown');
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);

  svg.append('g').attr('class', 'brush').call(brush);

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);


  const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);
    
        // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // 🆕 Add class for updating
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // 🆕 Optional
    .call(yAxis);

  svg.append('g').attr('class', 'dots'); // container for circles
}

// function updateScatterPlot(data, filteredCommits) {
//   const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

//   const width = 1000;
//   const height = 600;
//   const margin = { top: 10, right: 10, bottom: 30, left: 20 };

//   const usableArea = {
//     top: margin.top,
//     right: width - margin.right,
//     bottom: height - margin.bottom,
//     left: margin.left,
//     width: width - margin.left - margin.right,
//     height: height - margin.top - margin.bottom,
//   };

//   // d3.select('svg').remove();
//   d3.select('#chart svg').remove(); 

//   const svg = d3
//     .select('#chart')
//     .append('svg')
//     .attr('viewBox', `0 0 ${width} ${height}`)
//     .style('overflow', 'visible');

//   xScale = d3
//     .scaleTime()
//     .domain(d3.extent(filteredCommits, d => d.datetime))
//     .range([usableArea.left, usableArea.right])
//     .nice();

//   yScale = d3.scaleLinear()
//     .domain([0, 24])
//     .range([usableArea.bottom, usableArea.top]);

//   svg.call(d3.brush().on('start brush end', brushed));

//   svg.selectAll('.dots, .overlay ~ *').raise();
//   svg.selectAll('g').remove();

//   const dots = svg.append('g').attr('class', 'dots');

//   const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
//   const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

//   const newCommits = filteredCommits.filter(d => !renderedCommitIDs.has(d.id));
//   // const allCommits = [...renderedCommitIDs].map(id => filteredCommits.find(d => d.id === id)).filter(Boolean);
//   // const combinedCommits = [...allCommits, ...newCommits];

//   const circles = dots
//     .selectAll('circle')
//     .data(sortedCommits, (d) => d.id)
//     .join('circle')
//     .attr('cx', d => xScale(d.datetime))
//     .attr('cy', d => yScale(d.hourFrac))
//     .attr('r', d => rScale(d.totalLines))
//     .attr('fill', 'steelblue')
//     .style('fill-opacity', 0.5)
//     .on('mouseenter', (event, commit) => {
//       d3.select(event.currentTarget).style('fill-opacity', 1);
//       renderTooltipContent(commit);
//       updateTooltipVisibility(true);
//       updateTooltipPosition(event);
//     })
//     .on('mouseleave', (event) => {
//       d3.select(event.currentTarget).style('fill-opacity', 0.5);
//       updateTooltipVisibility(false);
//     });


//   // Add newly rendered commits to the global set
//   newCommits.forEach(d => renderedCommitIDs.add(d.id));

//   const gridlines = svg
//     .append('g')
//     .attr('class', 'gridlines')
//     .attr('transform', `translate(${usableArea.left}, 0)`);

//   gridlines.call(
//     d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
//   );

//   const xAxis = d3.axisBottom(xScale);

//   const yAxis = d3
//     .axisLeft(yScale)
//     .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

//   svg
//     .append('g')
//     .attr('transform', `translate(0, ${usableArea.bottom})`)
//     .attr('class', 'x-axis') // new line to mark the g tag
//     .call(xAxis);

//   svg
//     .append('g')
//     .attr('transform', `translate(${usableArea.left}, 0)`)
//     .attr('class', 'y-axis') // just for consistency
//     .call(yAxis);

//   const xAxisGroup = svg.select('g.x-axis');
//   xAxisGroup.selectAll('*').remove();
//   xAxisGroup.call(xAxis);
// }

function updateScatterPlot(data, commits) {
  const svg = d3.select('#chart').select('svg');

  xScale.domain(d3.extent(commits, d => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}


  
function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    tooltip.style.left = `${event.clientX - tooltipWidth / 2}px`;
    tooltip.style.top = `${event.clientY - tooltipHeight - 10}px`;
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');


    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });

    time.textContent = commit.datetime?.toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
      });
    
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
    
}

function createBrushSelector(svg) {
  svg.call(d3.brush());
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

// function updateTimeDisplay() {

//   commitProgress = Number(timeSlider.value);
//   const currentTime = timeScale.invert(commitProgress);

//   selectedTime.textContent = currentTime.toLocaleString("en-US", {
//     dateStyle: "long",
//     timeStyle: "short"
//   });

//   const filteredCommits = filterCommitsByTime(commits, currentTime);

//   updateScatterPlot(data, filteredCommits);
//   renderCommitInfo(data, filteredCommits);
//   renderFileList(filteredCommits);
// }

// function filterCommitsByTime(commits, maxTime) {
//   return commits.filter(d => d.datetime <= maxTime);
// }

function updateTimeDisplay() {
  commitProgress = Number(document.getElementById('commitSlider').value);
  commitMaxTime = timeScale.invert(commitProgress);

  const selectedTime = d3.select('#selectedTime');
  selectedTime.text(
    commitMaxTime.toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short"
    })
  );

  filterCommitsByTime(); // Sets filteredCommits
  updateScatterPlot(data, filteredCommits); // Refresh chart
}

function filterCommitsByTime() {
  filteredCommits = commits.filter(d => d.datetime < commitMaxTime);
}

filterCommitsByTime();
updateScatterPlot(data, filteredCommits);
updateFileDisplay(filteredCommits); // initial render


d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );


d3.select('#files-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .each(function(d) {
    d3.select(this).datum(d);
  })
  .html((d, i) => {
    const filesEdited = d3.rollups(d.lines, v => v.length, d => d.file).length;
    return `
      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })}, I made 
        <a href="${d.url}" target="_blank">
          ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>. I edited ${d.totalLines} lines across ${filesEdited} files.
        Then I looked over all I had made, and I saw that it was very good.
      </p>
    `;
  });



scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
.onStepEnter(onStepEnter);

function renderFileList(filteredCommits) {
    const lines = filteredCommits.flatMap(d => d.lines);
  
    let files = d3.groups(lines, d => d.file).map(([name, lines]) => ({ name, lines }));
    files = d3.sort(files, d => -d.lines.length); // now sorted
    

    const container = d3.select('.files');
    container.selectAll('div').remove();
  
    const filesContainer = container.selectAll('div')
      .data(files)
      .enter()
      .append('div');
  

    // Add filename + line count using <code> and <small>
    filesContainer
      .append('dt')
      .html(d => `<code>${d.name}</code><br><small style="color: grey";> ${d.lines.length} lines</small>`);
  
    // Add a <dd> with one <div class="line"> per line
    filesContainer
      .append('dd')
      .selectAll('div')
      .data(d => d.lines)
      .join('div')
      .attr('class', 'line')
      .style('background', d => colors(d.type));
  
}

// function renderItems(startIndex) {
//   // Clear previous content
//   itemsContainer.selectAll('div').remove();

//   const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
//   const newCommitSlice = commits.slice(startIndex, endIndex);

//   // Update the scatterplot view to only show these commits
//   updateScatterPlot(data, newCommitSlice);
//   // displayCommitFiles();

//   // Render the scrollytelling narrative
//   itemsContainer.selectAll('div')
//     .data(newCommitSlice)
//     .enter()
//     .append('div')
//     .attr('class', 'item')
//     .html((commit, index) => {
//       const date = commit.datetime.toLocaleString("en", {
//         dateStyle: "full",
//         timeStyle: "short"
//       });

//       const filesEdited = d3.rollups(
//         commit.lines,
//         D => D.length,
//         d => d.file
//       ).length;

//       return `
//         <p>
//           On ${date}, I made 
//           <a href="${commit.url}" target="_blank">
//             ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
//           </a>. I edited ${commit.totalLines} lines across ${filesEdited} files. 
//           Then I looked over all I had made, and I saw that it was very good.
//         </p>
//       `;
//     })
//     .style('position', 'absolute')
//     .style('top', (_, i) => `${i * ITEM_HEIGHT}px`);
// }

// function displayCommitFiles() {
//   const lines = filteredCommits.flatMap((d) => d.lines);
//   let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
//   let files = d3
//     .groups(lines, (d) => d.file)
//     .map(([name, lines]) => {
//       return { name, lines };
//     });
//   files = d3.sort(files, (d) => -d.lines.length);
//   d3.select('.files').selectAll('div').remove();
//   let filesContainer = d3
//     .select('.files')
//     .selectAll('div')
//     .data(files)
//     .enter()
//     .append('div');
//   filesContainer
//     .append('dt')
//     .html(
//       (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`,
//     );
//   filesContainer
//     .append('dd')
//     .selectAll('div')
//     .data((d) => d.lines)
//     .enter()
//     .append('div')
//     .attr('class', 'line')
//     .style('background', (d) => fileTypeColors(d.type));
// }



// function updateFileDisplay(filteredCommits) {
//   const lines = filteredCommits.flatMap(d => d.lines);

//   let files = d3.groups(lines, d => d.file)
//     .map(([name, lines]) => ({ name, lines }));

//   // Sort by number of lines (optional)
//   files = d3.sort(files, d => -d.lines.length);

//   const filesContainer = d3
//     .select('.files')
//     .selectAll('div')
//     .data(files, d => d.name)
//     .join(
//       enter => enter.append('div').call(div => {
//         div.append('dt').append('code');
//         div.append('dd');
//       })
//     );

//   filesContainer.select('dt > code').html(d => `
//     ${d.name}<br><small>${d.lines.length} lines</small>
//   `);
//     // filesContainer.select('dd').text(d => `${d.lines.length} lines`);

//     filesContainer
//     .select('dd')
//     .selectAll('div')
//     .data(d => d.lines)
//     .join('div')
//     .attr('class', 'loc')
//     .attr('style', d => `--color: ${colors(d.type)}`);
  
// }

function updateFileDisplay(filteredCommits) {
  d3.select('#files')
  .html('') // Clear previous content
  .append('h2');
  
  let lines = filteredCommits.flatMap((d) => d.lines);

  let files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  })
  .sort((a, b) => b.lines.length - a.lines.length);


  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        }),
    );

  // Set file name and total lines
  filesContainer.select('dt > code')
    .html((d) => `${d.name}<br><small>${d.lines.length} lines</small>`);

  // Draw one <div> per line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', d => `--color: ${colors(d.type)}`);
}

// function onStepEnter(response) {
//   console.log(response.element.__data__.datetime);
// }

function onStepEnter(response) {
  const currentCommit = response.element.__data__;
  const currentTime = currentCommit.datetime;

  // Filter and update everything
  const filtered = commits.filter(d => d.datetime <= currentTime);

  if (filtered.length === 0) {
    console.warn("No commits to show at", currentTime);
    return;
  }

  updateScatterPlot(data, filtered);
  renderCommitInfo(data, filtered);
  updateFileDisplay(filtered);
}

function onFileStepEnter(response) {
  const datetime = response.element.__data__.datetime;

  commitMaxTime = datetime;
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateFileDisplay(filteredCommits);
}

const fileScroller = scrollama();

fileScroller
  .setup({
    container: '#scrolly-2',
    step: '#scrolly-2 .step',
  })
  .onStepEnter(onFileStepEnter);


renderCommitInfo(data, commits);
updateScatterPlot(data, commits);
renderTooltipContent(commits);


timeSlider.addEventListener("input", updateTimeDisplay);
updateTimeDisplay();
timeSlider.addEventListener("input", onTimeSliderChange);
onTimeSliderChange();