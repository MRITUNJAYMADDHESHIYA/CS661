from flask import Flask, render_template, request, jsonify
from wordcloud import WordCloud
import pandas as pd
import base64
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask_cors import CORS
from collections import Counter

app = Flask(__name__)
CORS(app)

# Load dataset once at startup
df = pd.read_csv('Data_Google_Search.csv')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/options')
def get_options():
    # Cast years to strings for consistent <option> values
    years = sorted(df['year'].dropna().unique().astype(int).astype(str).tolist())
    countries  = sorted(df['country'].dropna().unique().tolist())
    categories = sorted(df['category'].dropna().unique().tolist())
    return jsonify({
        'years': years,
        'countries': countries,
        'categories': categories
    })

@app.route('/geo.json')
def geojson():
    return app.send_static_file('data/geo.json')

@app.route('/fetchdata', methods=['POST'])
def fetchdata():
    params   = request.get_json() or {}
    # Explicitly treat empty strings as None (no filter)
    year_val     = params.get('year')     or None
    country_val  = params.get('country')  or None
    category_val = params.get('category') or None

    # Convert year to int, if provided
    try:
        year = int(year_val) if year_val is not None else None
    except ValueError:
        return jsonify({"error": "Invalid year value"}), 400

    # Apply filters
    filtered = df
    if year is not None:
        filtered = filtered[filtered['year'] == year]
    if country_val:
        filtered = filtered[filtered['country'] == country_val]
    if category_val:
        filtered = filtered[filtered['category'] == category_val]

    # Prepare datasets
    choropleth = filtered[['country', 'search_interest', 'query']] \
                    .to_dict(orient='records')
    pie = filtered.groupby('category')['search_interest'] \
                  .sum().reset_index().to_dict(orient='records')

    # Bar: total by category for the selected country, or global if none
    bar_source = df[df['country'] == country_val] if country_val else df
    bar = bar_source.groupby('category')['search_interest'] \
                    .sum().reset_index() \
                    .sort_values('search_interest', ascending=False) \
                    .to_dict(orient='records')

    # Line: average interest over years for the selected category, or global
    line_source = df[df['category'] == category_val] if category_val else df
    lineCategory = line_source.groupby('year')['search_interest'] \
                              .mean().reset_index().to_dict(orient='records')

    # WordCloud: frequencies & metadata from filtered set
    queries = filtered['query'].dropna().astype(str)
    counts = Counter(queries)
    wordcloud_img = ""
    words_meta = []

    if counts:
        # Generate PNG
        wc = WordCloud(
            width=1600, height=900, background_color='white',
            max_words=10000, min_font_size=1, stopwords=set(),
            collocations=False, prefer_horizontal=1.0, scale=2, margin=1
        ).generate_from_frequencies(counts)
        buf = io.BytesIO()
        plt.figure(figsize=(10,5))
        plt.imshow(wc, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)
        plt.savefig(buf, format='png')
        plt.close()
        wordcloud_img = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

        # Build metadata for each word
        for word, freq in counts.items():
            sub = filtered[filtered['query'] == word]
            w_country  = sub['country'].mode().iat[0]  if not sub['country'].mode().empty else None
            w_category = sub['category'].mode().iat[0] if not sub['category'].mode().empty else None
            words_meta.append({
                'text':     word,
                'size':     freq,
                'country':  w_country,
                'category': w_category
            })

    return jsonify({
        'choropleth':   choropleth,
        'pie':          pie,
        'bar':          bar,
        'lineCategory': lineCategory,
        'wordcloud':    wordcloud_img,
        'words':        words_meta
    })

if __name__ == '__main__':
    app.run(debug=True)
