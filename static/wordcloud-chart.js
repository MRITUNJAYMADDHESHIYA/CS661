function renderWordCloud(imageData) {
    const container = document.getElementById('wordcloud');
    container.innerHTML = imageData
        ? `<img src="${imageData}" style="max-width:100%;"/>`
        : '<span style="color:#bbb;">No Data</span>';
}
