from flask import Flask, render_template, request, jsonify
from wordcloud import WordCloud
import pandas as pd
import base64
import io
import matplotlib
matplotlib.use('Agg')  # <<< Important! No GUI backend
import matplotlib.pyplot as plt
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load your dataset
df = pd.read_csv('Final_Cleaned_Google_Trends_2002_2010_50k.csv')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/options')
def get_options():
    categories = sorted(df['category'].dropna().unique().tolist())
    countries = sorted(df['country'].dropna().unique().tolist())
    years = sorted(df['year'].dropna().unique().tolist())
    return jsonify({'categories': categories, 'countries': countries, 'years': years})

@app.route('/geo.json')
def geojson():
    return app.send_static_file('data/geo.json')

@app.route('/fetchdata', methods=['POST'])
def fetchdata():
    val = request.get_json()

    # Retrieve values from request and handle missing/empty values
    year = val.get('year', None)
    country = val.get('country', None)
    category = val.get('category', None)

    # Validate and filter data based on the request
    try:
        if year:
            year = int(year)
        else:
            year = None
    except ValueError:
        return jsonify({"error": "Invalid year value"}), 400

    # Filter DataFrame
    filtered = df.copy()
    if year:
        filtered = filtered[filtered['year'] == year]
    if country:
        filtered = filtered[filtered['country'] == country]
    if category:
        filtered = filtered[filtered['category'] == category]

    # Choropleth Data
    choropleth = filtered[['country', 'search_interest', 'query']].to_dict(orient='records')

    # Pie Chart Data
    pie = filtered.groupby('category')['search_interest'].sum().reset_index().to_dict(orient='records')

    # Bar Chart Data
    if country:
      bar_df = df[df['country'] == country]
      if bar_df.shape[0] < 15:  # << if not enough data
        bar_df = df  # fall back to full dataset
    else:
       bar_df = df
    bar = bar_df.groupby('category')['search_interest'].sum().reset_index().sort_values(by='search_interest', ascending=False).to_dict(orient='records')

    # Line Chart Data
    line = df[df['category'] == category] if category else df
    lineCategory = line.groupby('year')['search_interest'].mean().reset_index().to_dict(orient='records')

    # WordCloud Image
    wc_df = df
    if country:
        wc_df = wc_df[wc_df['country'] == country]
    if category:
        wc_df = wc_df[wc_df['category'] == category]
    if year:
        wc_df = wc_df[wc_df['year'] == year]

    text_data = ' '.join(wc_df['query'].dropna().astype(str))
    wordcloud_img = ""

    if text_data:
        wc = WordCloud(width=800, height=400, background_color='white').generate(text_data)
        buf = io.BytesIO()
        plt.figure(figsize=(10, 5))
        plt.imshow(wc, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)
        plt.savefig(buf, format='png')
        plt.close()
        encoded = base64.b64encode(buf.getvalue()).decode()
        wordcloud_img = f"data:image/png;base64,{encoded}"

    return jsonify({
        'choropleth': choropleth,
        'pie': pie,
        'bar': bar,
        'lineCategory': lineCategory,
        'wordcloud': wordcloud_img
    })

if __name__ == '__main__':
    app.run(debug=True)
