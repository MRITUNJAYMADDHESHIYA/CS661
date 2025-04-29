let geoJsonData = null;

// Load GeoJSON once and cache it
fetch('/geo.json')
  .then(res => res.json())
  .then(j => { geoJsonData = j; });

/**
 * Renders an interactive, zoomable choropleth world map of search interest
 * @param {{[country: string]: number}} freq  // country → interest value
 */
function renderMapChart(freq) {
  const container = d3.select('#map')
    .style('width', '100%')  // Make the container responsive
    .style('height', '500px');  // Set a fixed height for the map

  // Clear old content
  container.selectAll('*').remove();

  // Chart title
  container.append('div')
    .attr('class', 'chart-title')
    .style('text-align', 'center')
    .style('font-size', '1.3rem')
    .style('font-weight', 'bold')
    .style('color', '#333')
    .text('Location-based Search Interest');

  // Tooltip div
  const tooltip = container.append('div')
    .attr('class', 'map-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', '#fff')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  // Wait for geoJSON load
  if (!geoJsonData) {
    return setTimeout(() => renderMapChart(freq), 100);
  }

  // SVG container for the map
  const width = container.node().clientWidth;
  //const width = 100%
  const height = 480;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Projection & path
  const projection = d3.geoMercator()
    .scale(width / 2 / Math.PI)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Color scale
  const maxVal = d3.max(Object.values(freq));
  const colorScale = d3.scaleThreshold()
    .domain(d3.range(0, maxVal, maxVal / 8))
    .range(d3.schemeGreens[9]);
// Draw countries
svg.selectAll('path')
  .data(geoJsonData.features)
  .enter().append('path')
    .attr('d', path)
    .attr('fill', d => colorScale(freq[d.properties.name] || 0))    // [5]
    .style('stroke', '#fff')
    .style('stroke-width', '0.5px')
    .style('opacity', 0.85)
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 1).style('fill', '#ff5733');
      tooltip
        .style('opacity', 1)
        .html(`<strong>${d.properties.name}</strong><br/>Search Interest: ${freq[d.properties.name] || 0}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top',  (event.pageY + 10) + 'px');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this)
        .style('opacity', 0.85)
        .style('fill', d => colorScale(freq[d.properties.name] || 0));
      tooltip.style('opacity', 0);
    })
    .on('click', function(event, d) {
      // 1. Toggle the country <select>
      const sel = document.getElementById('country');
      const clicked = d.properties.name;
      sel.value = sel.value === clicked ? '' : clicked;

      // 2. Re-fetch and redraw all charts with the new filter
      fetchCharts();
    });

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 140}, 20)`);

  const thresholds = d3.range(0, maxVal, maxVal / 8);
  thresholds.forEach((t, i) => {
    legend.append('rect')
      .attr('x',100)
      .attr('y', (i+3) * 25)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', colorScale(t + 0.1));

    legend.append('text')
      .attr('x', 125)
      .attr('y', (i+3) * 25 + 14)
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(Math.round(t));
  });
}
