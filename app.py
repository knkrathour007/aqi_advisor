from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__, template_folder="templates", static_folder="static")

# --------- INSERT YOUR KEYS HERE ----------
WAQI_TOKEN = "a8448e9f8c857c32a9246e0cfeea9139aebbde4a"   # WAQI token (you provided)
OWM_KEY = "a2ce8f0d30c5fbf572a5bb63e2cda359"             # OpenWeatherMap key (you provided)
# ------------------------------------------

# Small set of predefined cities to paint initial markers
START_CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/map")
def map_view():
    return render_template("map.html", start_cities=START_CITIES)

@app.route("/forecast")
def forecast_view():
    return render_template("forecast.html")

@app.route("/quiz")
def quiz_view():
    return render_template("quiz.html")

@app.route("/insights")
def insights_view():
    return render_template("insights.html")

# API: Get AQI for any city (uses OWM geocoding -> WAQI)
@app.route("/api/aqi")
def get_aqi():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "City required"}), 400

    # 1) geocode via OWM
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={requests.utils.requote_uri(city)}&limit=1&appid={OWM_KEY}"
    try:
        g = requests.get(geo_url, timeout=8).json()
    except Exception as e:
        return jsonify({"error": "Geocoding request failed", "detail": str(e)}), 500

    if not g:
        return jsonify({"error": "City not found"}), 404

    lat = g[0].get("lat")
    lon = g[0].get("lon")
    if lat is None or lon is None:
        return jsonify({"error": "Coordinates unavailable"}), 500

    # 2) WAQI feed by coordinates
    aqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
    try:
        a = requests.get(aqi_url, timeout=8).json()
    except Exception as e:
        return jsonify({"error": "AQI request failed", "detail": str(e)}), 500

    if a.get("status") != "ok":
        # return the raw WAQI message if present
        return jsonify({"error": "AQI unavailable", "waqi": a}), 500

    aqi_value = a["data"].get("aqi", "N/A")
    # try to get station name if exists
    name = a["data"].get("city", {}).get("name", city)

    return jsonify({"city": name, "lat": lat, "lon": lon, "aqi": aqi_value})

# API: 5-day forecast (OpenWeatherMap 3-hour list -> sample 5 days)
@app.route("/api/forecast")
def get_forecast():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "City required"}), 400

    # geocode
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={requests.utils.requote_uri(city)}&limit=1&appid={OWM_KEY}"
    try:
        g = requests.get(geo_url, timeout=8).json()
    except Exception as e:
        return jsonify({"error": "Geocoding failed", "detail": str(e)}), 500
    if not g:
        return jsonify({"error": "City not found"}), 404

    lat = g[0].get("lat")
    lon = g[0].get("lon")
    # 5-day/3-hour forecast
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OWM_KEY}&units=metric"
    try:
        fdata = requests.get(url, timeout=8).json()
    except Exception as e:
        return jsonify({"error": "Forecast request failed", "detail": str(e)}), 500

    if fdata.get("cod") not in ("200", 200, "200.0"):
        return jsonify({"error": "Forecast unavailable", "detail": fdata}), 500

    # Simplify to one entry per day (approx every 24h -> take list[0], [8], [16], [24], [32] if available)
    entries = fdata.get("list", [])
    forecast = []
    for idx in [0, 8, 16, 24, 32]:
        if idx < len(entries):
            e = entries[idx]
            forecast.append({
                "dt": e.get("dt_txt"),
                "temp": e["main"].get("temp"),
                "humidity": e["main"].get("humidity"),
                "weather": e["weather"][0].get("description").title()
            })

    # also attach current WAQI if available
    aqi_val = "N/A"
    try:
        aqi_resp = requests.get(f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}", timeout=8).json()
        if aqi_resp.get("status") == "ok":
            aqi_val = aqi_resp["data"].get("aqi", "N/A")
    except:
        aqi_val = "N/A"

    return jsonify({"city": city.title(), "aqi": aqi_val, "forecast": forecast})

if __name__ == "__main__":
    app.run(debug=True)
