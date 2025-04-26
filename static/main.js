console.log = () => {}
var globalfilter = { 'year': 2022 }

async function fetchOptions() {
    const res = await fetch('/api/options');
    const data = await res.json();
    populateSelect('year', data.years);
    populateSelect('country', data.countries);
    populateSelect('category', data.categories);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = 
    `<option value="" disabled selected>Select ${id}</option>` + 
    options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}

async function fetchCharts() {
    const year = document.getElementById('year').value;
    const country = document.getElementById('country').value;
    const category = document.getElementById('category').value;
    const res = await fetch('/fetchdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, country, category })
    });
    const data = await res.json();
    // Choropleth expects {country: value, ...}
    const freq = {};
    data.choropleth.forEach(d => {
        freq[d.country] = d.search_interest;
    });
    renderMapChart(freq);
    renderPieChart(data.pie, country, year);
    renderBarChart(data.bar);
    renderLineChart(data.lineCategory);
    renderWordCloud(data.wordcloud);
}

window.onload = async () => {
    await fetchOptions();
    document.querySelectorAll('select').forEach(sel => sel.onchange = fetchCharts);
    setTimeout(fetchCharts, 500); // Initial load after options
};
