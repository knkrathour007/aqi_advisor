const questions = [
  { q:"Do you experience frequent coughing or breathlessness?", options:["No","Sometimes","Often"] },
  { q:"Do you have a diagnosed respiratory condition (asthma, COPD)?", options:["No","Yes"] },
  { q:"Do you get headaches or eye irritation outdoors?", options:["No","Sometimes","Often"] },
  { q:"Do symptoms improve when you stay indoors or use an air purifier?", options:["No","Yes"] },
  { q:"Do family members have frequent throat irritation or colds?", options:["No","Sometimes","Often"] },
  { q:"Do you spend significant time near busy roads, factories, or construction?", options:["No","Sometimes","Often"] }
];

let idx = 0;
let answers = [];

const container = document.getElementById('quizContainer');
const nextBtn = document.getElementById('nextBtn');

function renderQuestion(i){
  const item = questions[i];
  let html = `<h3>${i+1}. ${item.q}</h3>`;
  item.options.forEach((opt, k)=> {
    html += `<label style="display:block;margin:8px 0"><input type="radio" name="q${i}" value="${opt}"> ${opt}</label>`;
  });
  container.innerHTML = html;
}

function getSelected(i){
  const radios = document.getElementsByName(`q${i}`);
  for (let r of radios) if (r.checked) return r.value;
  return null;
}

nextBtn.addEventListener('click', ()=>{
  const sel = getSelected(idx);
  if (!sel) return alert('Please choose an answer');
  answers[idx] = sel;
  idx++;
  if (idx < questions.length) {
    renderQuestion(idx);
    if (idx === questions.length - 1) nextBtn.textContent = 'Finish';
  } else {
    // compute simple advice
    showAdvice();
  }
});

function showAdvice(){
  // Simple scoring heuristic:
  let score = 0;
  answers.forEach(a=>{
    if (a === "Often") score += 2;
    else if (a === "Sometimes") score += 1;
    else if (a === "Yes") score += 2;
  });

  let issue = "Low risk of AQI-related issues";
  let measures = ["Keep monitoring AQI", "Use mask outdoors on bad days"];
  let healthy = ["Stay hydrated", "Avoid heavy outdoor exertion when AQI is high"];

  if (score >= 8) {
    issue = "High risk of AQI-related respiratory irritation";
    measures = ["See a doctor for respiratory check", "Use indoor air purifier", "Avoid outdoor exposure during high AQI"];
    healthy = ["Keep inhaler/medicine handy if prescribed", "Use N95 when outside", "Close windows when AQI spikes"];
  } else if (score >= 4) {
    issue = "Moderate risk — take preventive steps";
    measures = ["Use mask on busy roads", "Limit outdoor exercise on high AQI days"];
    healthy = ["Rinse eyes, wash face after being outdoors", "Use saline for throat if irritated"];
  }

  container.innerHTML = `
    <div class="card">
      <h3>Result</h3>
      <p><b>Issue:</b> ${issue}</p>
      <p><b>Preventive measures:</b></p>
      <ul>${measures.map(m=>`<li>${m}</li>`).join('')}</ul>
      <p><b>Healthy practices:</b></p>
      <ul>${healthy.map(h=>`<li>${h}</li>`).join('')}</ul>
    </div>
  `;
  nextBtn.style.display = 'none';
}

renderQuestion(0);
