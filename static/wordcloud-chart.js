// File: static/wordcloud-chart.js

/**
 * Renders an interactive word cloud where each word is clickable.
 * Attempts to fit every word by normalizing font sizes and tightening padding.
 * @param {Array<{text: string, size: number, country: string, category: string}>} words
 */
function renderWordCloud(words) {
  const container = d3.select('#wordcloud');
  container.html('');
  if (!words || !words.length) {
    container.append('span').style('color','#bbb').text('No Data');
    return;
  }

  // Dimensions
  const width  = container.node().clientWidth;
  const height = 400;

  // Build a linear scale mapping your raw frequencies into a reasonable pixel range
  const counts   = words.map(d => d.size);
  const minCount = d3.min(counts);
  const maxCount = d3.max(counts);
  // map smallest frequency to 10px, largest to 50px (adjust as needed)
  const sizeScale = d3.scaleLinear()
    .domain([minCount, maxCount])
    .range([0.5, 50]);

  // Kick off the layout
  d3.layout.cloud()
    .size([width, height])
    .words(words.map(d => ({
        text:     d.text,
        country:  d.country,
        category: d.category,
        size:     sizeScale(d.size)   // use normalized sizes
    })))
    .padding(1)             // tighter spacing
    .rotate(() => (Math.random() < 0.2 ? 90 : 0))  // some vertical words
    .spiral('archimedean')  // try archimedean spiral for denser packing
    .font('Impact')
    .fontSize(d => d.size)
    .on('end', drawCloud)
    .start();

  function drawCloud(placed) {
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
        .attr('transform', `translate(${width/2},${height/2})`);

    svg.selectAll('text')
      .data(placed)
      .enter().append('text')
        .style('font-family','Impact')
        .style('fill', (d,i) => d3.schemeCategory10[i%10])
        .attr('text-anchor','middle')
        .attr('font-size', d => d.size + 'px')
        .attr('transform',   d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .style('cursor','pointer')
        .on('click', (e, d) => {
          document.getElementById('country').value  = d.country  || '';
          document.getElementById('category').value = d.category || '';
          fetchCharts();
        });
  }
}
