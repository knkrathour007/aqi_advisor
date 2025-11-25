// map.js
const map = L.map('map').setView([22.9734,78.6569], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

let markers = [];

// helper color scale for WAQI numeric AQI
function getColorNumber(aqi) {
    if (aqi === null || aqi === undefined || isNaN(aqi)) return "#999";
    if (aqi <= 50) return "#2ECC71";
    if (aqi <= 100) return "#F1C40F";
    if (aqi <= 150) return "#E67E22";
    if (aqi <= 200) return "#E74C3C";
    return "#8E44AD";
}

function clearMarkers(){
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

function addMarker(lat, lon, title, aqi){
    const color = getColorNumber(aqi);
    const marker = L.circleMarker([lat, lon], {radius:10, color: color, fillOpacity:0.9}).addTo(map);
    marker.bindPopup(`<b>${title}</b><br>AQI: ${aqi}`);
    markers.push(marker);
    return marker;
}

async function searchCity(city){
    clearMarkers();
    try {
        const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
        const json = await res.json();
        if (!res.ok || json.error){
            alert(json.error || 'City/AQI fetch error');
            return;
        }
        addMarker(json.lat, json.lon, json.city, json.aqi);
        map.setView([json.lat, json.lon], 10);
    } catch (e) {
        alert('Network error when fetching AQI');
    }
}

document.getElementById('searchBtn').addEventListener('click', ()=>{
    const city = document.getElementById('searchCity').value.trim();
    if (city) searchCity(city);
});

// initial markers from a set of popular cities
const startingCities = ["Delhi","Mumbai","Bangalore","Kolkata","Chennai","Hyderabad","Pune"];
startingCities.forEach(async c => {
    try {
        const r = await fetch(`/api/aqi?city=${encodeURIComponent(c)}`);
        const j = await r.json();
        if (!j.error) addMarker(j.lat, j.lon, j.city, j.aqi);
    } catch(e){}
});
