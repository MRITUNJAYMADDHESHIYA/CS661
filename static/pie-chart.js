let pieChartInstance = null;

/**
 * Renders a doughnut chart showing the Top N categories + “Other,”
 * with percentage labels on each slice and a properly sized palette.
 */
function renderPieChart(pieData, year = '') {
  // 1) Sort and split out top N + Other
  pieData.sort((a, b) => b.search_interest - a.search_interest);
  const topN     = pieData.slice(0, 6);    // pick however many “top” slices you want
  const rest     = pieData.slice(7);
  const otherVal = rest.reduce((sum, d) => sum + d.search_interest, 0);
  if (otherVal > 0) {
    const otherCats = rest.map(d => d.category).join(', ');
    topN.push({ category: 'Other', search_interest: otherVal, otherCategories: otherCats });
  }

  // 2) Compute total & number of slices
  const total     = topN.reduce((sum, d) => sum + d.search_interest, 0);
  const sliceCount= topN.length;

  // 3) Generate a distinct color for each slice via HSL
  const backgroundColor = Array.from({ length: sliceCount }, (_, i) => {
    // rotate hue around the circle
    const hue = Math.round((i * 360) / sliceCount);
    return `hsl(${hue}, 65%, 55%)`;
  });

  // 4) Build container & canvas
  const container = document.getElementById('pie');
  container.innerHTML = `<canvas id="pie-canvas"></canvas>`;

  const ctx = document.getElementById('pie-canvas').getContext('2d');

  // 5) Destroy old chart
  if (pieChartInstance) pieChartInstance.destroy();

  // 6) Create doughnut chart
  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topN.map(d => d.category),
      datasets: [{
        data: topN.map(d => d.search_interest),
        backgroundColor,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      radius: '80%',
      // inner hole size (you already have this as cutout)
      cutout: '30%',
      plugins: {
        title: {
          display: true,
          text: `Top Categories in ${year || 'Country and year'}`,
          font: { size: 20 },
          padding: { top: 20, bottom: 0 }
        },
        legend: {
          position: 'bottom',
          labels: { color: '#222', font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: ({ label, raw, dataIndex }) => {
              const pct = ((raw / total) * 100).toFixed(1) + '%';
              if (label === 'Other') {
                return `Other: ${pct} (Includes: ${topN[dataIndex].otherCategories})`;
              }
              return `${label}: ${pct} (raw: ${raw})`;
            }
          }
        },
        datalabels: {
          color: '#fff',
          formatter: val => ((val / total) * 100).toFixed(1) + '%',
          font: { weight: 'bold', size: 14 },
          anchor: 'center',
          align: 'center'
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // 7) Click-to-filter hack
  pieChartInstance.canvas.onclick = evt => {
    const points = pieChartInstance.getElementsAtEventForMode(
      evt, 'nearest', { intersect: true }, false
    );
    if (!points.length) return;
    const idx = points[0].index;
    const clicked = topN[idx].category;
    const sel = document.getElementById('category');
    sel.value = sel.value === clicked ? '' : clicked;
    fetchCharts();
  };
}
