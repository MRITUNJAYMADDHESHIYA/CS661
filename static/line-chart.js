// File: static/line-chart.js
let lineChartInstance = null;

/**
 * Renders a line chart of average search interest over years for a category.
 * @param {Array<{year: string|number, search_interest: number}>} lineData
 */
function renderLineChart(lineData, categoryName) {
    const container = document.getElementById('line');
    container.innerHTML = `<canvas id="line-canvas"></canvas>`;
    const ctx = document.getElementById('line-canvas').getContext('2d');

    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lineData.map(d => d.year),
            datasets: [{
                label: `Avg Search Interest${categoryName ? ' of "' + categoryName + '"' : ''}`,
                data: lineData.map(d => d.search_interest),
                borderColor: '#e15759',
                backgroundColor: 'rgba(225,87,89,0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: items => `Year: ${items[0].label}`
                    }
                },
                legend: {
                    labels: {
                        color: '#222'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year',        // ➡️ X axis label
                        color: '#222',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: { color: '#222' },
                    grid: { color: '#eee' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Search Interest', // ➡️ Y axis label
                        color: '#222',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: { color: '#222' },
                    grid: { color: '#eee' }
                }
            }
        }
    });
}
