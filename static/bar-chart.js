/**
 * Renders a horizontal bar chart of search interest by category (Year + Country)
 * and shows details on hover via a tooltip positioned near the mouse.
 * @param {Array<{category: string, search_interest: number}>} barData
 */
function renderBarChart(barData) {
    // limit to top 15 entries
    barData = barData.slice(0, 15);
    const container = d3.select('#bar');
    container.style('position', 'relative');
    container.selectAll('*').remove();

    // get the container DOM node for positioning calculations
    const containerNode = document.getElementById('bar');

    // create tooltip div
    const tooltip = d3.select(containerNode)
        .append('div')
        .attr('class', 'bar-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.7)')
        .style('color', '#fff')
        .style('padding', '5px 8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    const margin = { top: 10, right: 20, bottom: 30, left: 120 };
    const width = containerNode.clientWidth - margin.left - margin.right ;
    const height = barData.length * 40;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right )
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.search_interest)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(barData.map(d => d.category))
        .range([0, height])
        .padding(0.1);

    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '12px');

    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

    svg.selectAll('rect')
        .data(barData)
      .enter().append('rect')
        .attr('y', d => y(d.category))
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .attr('width', d => x(d.search_interest))
        .attr('fill', '#4e79a7')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('fill', '#2c5f8a');
            tooltip.style('opacity', 1)
                .html(`<strong>${d.category}</strong><br/>Search Interest: ${d.search_interest}`);
        })
        .on('mousemove', function(event) {
            const rect = containerNode.getBoundingClientRect();
            tooltip.style('left', (event.pageX - rect.left + 10) + 'px')
                   .style('top', (event.pageY - rect.top + 10) + 'px');
        })
        .on('mouseleave', function() {
            d3.select(this).attr('fill', '#4e79a7');
            tooltip.style('opacity', 0);
        });
}
    const container = d3.select('#map');
    container.selectAll('*').remove();
    container.append('div').attr('class','chart-title').text('Location based search interest');

    const width = document.getElementById('map').clientWidth;
    const height = 350;
    const svg = container.append('svg').attr('width', width).attr('height', height);

    const projection = d3.geoMercator()
        .scale((width / 1.3) / Math.PI)
        .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const values = Object.values(freq);
    const max = d3.max(values);
    const color = d3.scaleThreshold()
        .domain(d3.range(0, max, max / 8))
        .range(d3.schemeGreens[9]);

    svg.append('g')
      .selectAll('path')
      .data(geoJsonData.features)
      .enter().append('path')
        .attr('d', path)
        .attr('fill', d => color(freq[d.properties.name] || 0))
        .style('stroke', '#fff')
        .on('mouseover', (e,d) => {
            const v = freq[d.properties.name] || 0;
            // tooltip logic...
        });