console.log = () => {}

// Fetch and populate all dropdowns with an “All” option first
async function fetchOptions() {
  const res = await fetch('/api/options')
  const data = await res.json()

  populateSelect('year', data.years, 'All Years')
  populateSelect('country', data.countries, 'All Countries')
  populateSelect('category', data.categories, 'All Categories')
}

function populateSelect(id, options, allLabel) {
  const select = document.getElementById(id)
  // First option is the “All” choice with empty value
  select.innerHTML =
    `<option value="">${allLabel}</option>` +
    options.map(opt => `<option value="${opt}">${opt}</option>`).join('')
}

async function fetchCharts() {
  const year = document.getElementById('year').value
  const country = document.getElementById('country').value
  const category = document.getElementById('category').value

  const res = await fetch('/fetchdata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, country, category })
  })
  const data = await res.json()

  // Build country → interest map for the choropleth
  const freq = {}
  data.choropleth.forEach(d => {
    freq[d.country] = d.search_interest
  })

  renderMapChart(freq)
  renderPieChart(data.pie, country, year)
  renderBarChart(data.bar)
  renderLineChart(data.lineCategory, category)
  renderWordCloud(data.words)
}

window.onload = async () => {
  await fetchOptions()
  // Re-fetch charts on any dropdown change
  document.querySelectorAll('select').forEach(sel => sel.onchange = fetchCharts)
  // Initial chart load
  setTimeout(fetchCharts, 500)
}
