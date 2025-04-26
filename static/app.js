let pieChart, barChart, lineChart;

async function fetchOptions() {
    const res = await fetch('/api/options');
    const data = await res.json();
    populateSelect('year', data.years);
    populateSelect('country', data.countries);
    populateSelect('category', data.categories);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}

async function fetchCharts() {
    const year = document.getElementById('year').value;
    const country = document.getElementById('country').value;
    const category = document.getElementById('category').value;
    const res = await fetch(`/api/charts?year=${year}&country=${country}&category=${category}`);
    const data = await res.json();
    renderCharts(data);
    fetchWordCloud(year, category);
}

async function fetchWordCloud(year, category) {
    const res = await fetch(`/api/wordcloud?year=${year}&category=${category}`);
    const data = await res.json();
    const wcDiv = document.getElementById('wordcloud');
    wcDiv.innerHTML = `<div class="chart-title">Word Cloud</div>` +
        (data.image ? `<img src="${data.image}" style="max-width:100%;">` : '<span style="color:#bbb;">No Data</span>');
}

function ensureCanvas(id, title) {
    const box = document.getElementById(id);
    box.innerHTML = `<div class="chart-title">${title}</div><canvas></canvas>`;
    return box.querySelector('canvas');
}

function renderCharts(data) {
    // Pie Chart (Top 6 Items + 'Other' category)
    const pieCanvas = ensureCanvas('pie', `Search Distribution by Year (${data.year})`);
    if (pieChart) pieChart.destroy();
    const pieData = data.pie;
    const top6 = pieData.slice(0, 6);
    const others = pieData.slice(6);
    const othersData = others.length > 0 ? others.reduce((acc, cur) => acc + cur.search_interest, 0) : 0;
    const pieChartData = {
        labels: [...top6.map(d => d.category), 'Other'],
        datasets: [{
            data: [...top6.map(d => d.search_interest), othersData],
            backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff', '#8bc34a', '#e57373'],
        }]
    };
    pieChart = new Chart(pieCanvas.getContext('2d'), {
        type: 'doughnut',
        data: pieChartData,
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} Search Interest`,
                    }
                }
            }
        }
    });

    // Word Map (Based on Year and Category)
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = `<div class="chart-title">Location Based Search Interest</div><div id="map-plot" style="width:100%;height:90%;"></div>`;
    Plotly.newPlot('map-plot', [{
        type: 'choropleth',
        locations: data.choropleth.map(d => d.country),
        z: data.choropleth.map(d => d.search_interest),
        text: data.choropleth.map(d => d.query),
        locationmode: 'country names',
        colorscale: 'Viridis',
        colorbar: { title: 'Search Interest' }
    }], {
        geo: { projection: { type: 'natural earth' }, bgcolor: 'rgba(0,0,0,0)' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 0, b: 0, l: 0, r: 0 }
    }, {responsive: true});

    // Line Graph (Category Data over Years with Queries)
    const lineCanvas = ensureCanvas('line', `Category Trends over Years`);
    if (lineChart) lineChart.destroy();
    const lineData = data.lineCategory;
    lineChart = new Chart(lineCanvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: lineData.map(d => d.year),
            datasets: [{
                label: 'Avg Search Interest',
                data: lineData.map(d => d.search_interest),
                borderColor: '#ff6384',
                backgroundColor: 'rgba(255,99,132,0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' } }
            }
        }
    });

    // Bar Graph (Data by Year and Country)
    const barCanvas = ensureCanvas('bar', `Search Interest by Country (${data.year})`);
    if (barChart) barChart.destroy();
    const barData = data.bar;
    barChart = new Chart(barCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: barData.map(d => d.country),
            datasets: [{
                label: 'Search Interest',
                data: barData.map(d => d.search_interest),
                backgroundColor: '#36a2eb'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' } }
            }
        }
    });
}

window.onload = async () => {
    await fetchOptions();
    document.querySelectorAll('select').forEach(sel => sel.onchange = fetchCharts);
    setTimeout(fetchCharts, 500); // Initial load after options
};
