let initialData = null;
console.log = () => {};
var globalfilter = { 'year': 2022 };

async function fetchOptions() {
    const res = await fetch('/api/options');
    const data = await res.json();
    
    populateSelect('year', data.years);
    populateSelect('country', data.countries, true); // Add "All" option for countries
    populateSelect('category', data.categories, true); // Add "All" option for categories

    // After populating, select defaults
    document.getElementById('year').value = data.years[0];   // first year
    document.getElementById('country').value = 'all';         // All countries
    document.getElementById('category').value = 'all';        // All categories
}

function populateSelect(id, options, includeAll = false) {
    const select = document.getElementById(id);
    select.innerHTML =
        `<option value="" disabled>Select ${id}</option>` +
        (includeAll ? `<option value="all">All</option>` : '') +
        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}

async function fetchCharts() {
    const year = document.getElementById('year').value;
    const country = document.getElementById('country').value;
    const category = document.getElementById('category').value;

    if (year === "" || year === null) return; // don't fetch if year is not selected

    const query = {
        year,
        country: (country === "all") ? "" : country,
        category: (category === "all") ? "" : category
    };

    const res = await fetch('/fetchdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });

    const data = await res.json();

    // Save initial data the first time
    if (!initialData) {
        initialData = data;
    }

    // If both country and category are "All", use initial data
    const isReset = (country === "all" && category === "all");
    const finalData = isReset ? initialData : data;

    const freq = {};
    finalData.choropleth.forEach(d => {
        freq[d.country] = d.search_interest;
    });

    renderMapChart(freq);
    renderPieChart(finalData.pie, query.country || 'World', query.year);
    renderBarChart(finalData.bar);
    renderLineChart(finalData.lineCategory);
    renderWordCloud(finalData.wordcloud);
}

window.onload = async () => {
    await fetchOptions();
    document.querySelectorAll('select').forEach(sel => sel.onchange = fetchCharts);
    setTimeout(fetchCharts, 500); // Initial load after options
};
