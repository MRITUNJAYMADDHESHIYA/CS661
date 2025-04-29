function renderBarChart(barData) {
  // Limit to top 15 entries
  barData = barData.slice(0, 13);

  const container = d3.select('#bar');
  container.style('position', 'relative');
  container.selectAll('*').remove();

  // Create a wrapper div for title + svg
  const wrapper = container.append('div')
    .style('width', '100%')
    .style('text-align', 'center');

  // ➡️ Add title ABOVE
  wrapper.append('div')
    .attr('class', 'chart-title')
    .style('font-size', '15px')
    .style('font-weight', 'bold')
    .style('margin-bottom', '10px')
    .text('Top Categories by Search Interest');

  const margin = { top: 10, right: 20, bottom: 30, left: 90 };
  const width = document.getElementById('bar').clientWidth - margin.left - margin.right;
  const height = barData.length * 40;

  const svg = wrapper.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('background', '#f9f9f9')
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, 1.5 * d3.max(barData, d => d.search_interest)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(barData.map(d => d.category))
    .range([0, height])
    .padding(0.1);

  svg.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .remove();

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5));

  const containerNode = document.getElementById('bar');

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

  svg.selectAll('rect')
    .data(barData)
    .enter()
    .append('rect')
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

  // Add category labels inside bars
  svg.selectAll('.bar-label')
    .data(barData)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', 5)
    .attr('y', d => y(d.category) + y.bandwidth() / 2)
    .attr('dy', '.35em')
    .attr('fill', '#fff')
    .attr('font-size', '12px')
    .attr('text-anchor', 'start')
    .text(d => d.category);
}
