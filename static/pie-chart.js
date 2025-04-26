let pieChartInstance = null;

/**
 * Renders a doughnut chart showing the Top 6 categories + “Other.”
 * @param {Array<{category: string, search_interest: number}>} pieData
 * @param {string} year
 */
function renderPieChart(pieData, year = '') {
    // Sort descending by search interest
    pieData.sort((a, b) => b.search_interest - a.search_interest);

    // Take top 6 and aggregate the rest into "Other"
    const top6 = pieData.slice(0, 6);
    const rest = pieData.slice(6);
    const otherVal = rest.reduce((sum, d) => sum + d.search_interest, 0);
    // Collect categories for the "Other" slice
    const otherCategories = rest.map(d => d.category);
    if (otherVal > 0) {
        top6.push({ category: 'Other', search_interest: otherVal, otherCategories });
    }

    const container = document.getElementById('pie');
    container.innerHTML = `
      <div class="chart-title">Top Categories in ${year || 'All Years'}</div>
      <canvas id="pie-canvas"></canvas>
    `;
    const ctx = document.getElementById('pie-canvas').getContext('2d');

    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: top6.map(d => d.category),
            datasets: [{
                data: top6.map(d => d.search_interest),
                backgroundColor: [
                    '#4e79a7','#f28e2b','#e15759',
                    '#76b7b2','#59a14f','#edc948','#b07aa1'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#222', font: { size: 14 } } },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const label = tooltipItem.label;
                            const value = tooltipItem.raw;
                            if (label === 'Other') {
                                const idx = tooltipItem.dataIndex;
                                const categories = top6[idx].otherCategories;
                                return `Other: ${value} (Includes: ${categories.join(', ')})`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}