document.getElementById('forecastBtn').addEventListener('click', async ()=>{
    const city = document.getElementById('forecastCity').value.trim();
    if (!city) return alert('Type a city');
    const out = document.getElementById('forecastResults');
    out.innerHTML = "<p>Loading...</p>";
    try {
        const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
        const json = await res.json();
        if (!res.ok || json.error) {
            out.innerHTML = `<p style="color:red">${json.error || 'Error'}</p>`;
            return;
        }
        const rows = json.forecast.map(d => `
          <div class="forecast-item card">
            <h3>${d.date}</h3>
            <p><b>AQI:</b> ${d.aqi}</p>
            <p><b>Temp:</b> ${d.temp}°C</p>
            <p><b>Humidity:</b> ${d.humidity}%</p>
            <p>${d.desc}</p>
          </div>
        `).join('');
        out.innerHTML = `<div class="forecast-grid">${rows}</div>`;
    } catch(e){
        out.innerHTML = `<p style="color:red">Network error</p>`;
    }
});
