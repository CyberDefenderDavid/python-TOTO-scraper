let allData = [];
let currentFiltered = [];

fetch('toto_result.json')
  .then(response => response.json())
  .then(data => {
    allData = data;
    populateDropdowns(data);
    renderTable(data);
    currentFiltered = data;
    updateHotCold(data);
    renderAllDrawCounts(data);
  })
  .catch(error => {
    console.error("Error loading TOTO results:", error);
  });

function populateDropdowns(data) {
  const drawSet = new Set();
  const dateSet = new Set();

  data.forEach(r => {
    drawSet.add(r.draw_number);
    dateSet.add(r.date);
  });

  const drawFilter = document.getElementById('drawFilter');
  [...drawSet].sort().reverse().forEach(draw => {
    const option = document.createElement('option');
    option.value = draw;
    option.textContent = draw;
    drawFilter.appendChild(option);
  });

  const dateFilter = document.getElementById('dateFilter');
  [...dateSet].sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });

  drawFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);
  document.getElementById('bonusToggle').addEventListener('change', () => {
    updateHotCold(currentFiltered);
    renderAllDrawCounts(currentFiltered);
  });
  document.getElementById('hotCount').addEventListener('change', () => updateHotCold(currentFiltered));
}

function applyFilters() {
  const draw = document.getElementById('drawFilter').value;
  const date = document.getElementById('dateFilter').value;

  let filtered = allData;

  if (draw !== "all") {
    filtered = filtered.filter(r => r.draw_number === draw);
  }

  if (date !== "all") {
    filtered = filtered.filter(r => r.date === date);
  }

  currentFiltered = filtered;
  renderTable(filtered);
  updateHotCold(filtered);
  renderAllDrawCounts(filtered);
}

function renderTable(data) {
  const tbody = document.querySelector('#totoTable tbody');
  tbody.innerHTML = "";
  data.forEach(result => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${result.date}</td>
      <td>${result.draw_number}</td>
      <td>${result.winning_numbers.join(', ')}</td>
      <td>${result.additional_number}</td>
    `;
    tbody.appendChild(row);
  });
}

function generateToto() {
  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 49) + 1);
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  document.getElementById('totoGenOutput').textContent =
    "Your TOTO Numbers: " + sorted.join(', ');
}

function updateHotCold(data) {
  const includeBonus = document.getElementById('bonusToggle').value === "yes";
  const hotCountSetting = parseInt(document.getElementById('hotCount').value);

  const frequency = {};
  const appearances = {};

  for (let i = 1; i <= 49; i++) {
    frequency[i] = 0;
    appearances[i] = [];
  }

  data.forEach(draw => {
    draw.winning_numbers.forEach(num => {
      const n = parseInt(num, 10);
      if (!isNaN(n)) {
        frequency[n]++;
        appearances[n].push(draw.date);
      }
    });
    if (includeBonus) {
      const bonus = parseInt(draw.additional_number, 10);
      if (!isNaN(bonus)) {
        frequency[bonus]++;
        appearances[bonus].push(draw.date);
      }
    }
  });

  const entries = Object.entries(frequency)
    .map(([num, count]) => ({
      number: num,
      count: count,
      dates: appearances[num]
    }))
    .filter(x => x.count > 0);

  const sortedDesc = [...entries].sort((a, b) => b.count - a.count);
  const sortedAsc = [...entries].sort((a, b) => a.count - b.count);
  const bottomCount = sortedAsc[0]?.count || 0;

  const hot = sortedDesc.slice(0, hotCountSetting);
  const cold = sortedAsc.filter(x =>
    x.count === bottomCount && !hot.find(h => h.number === x.number)
  );

  const format = (list, type) =>
    list.map(e =>
      `<span class="pill ${type}">
        <div>${e.count} draw${e.count > 1 ? "s" : ""}</div>
        <div>"${e.number}"</div>
        <span class="tooltip">${e.dates.join('\n')}</span>
      </span>`
    ).join('');

  document.getElementById('hotNumbers').innerHTML = format(hot, "hot");
  document.getElementById('coldNumbers').innerHTML = format(cold, "cold");
  document.getElementById('drawCount').textContent = `Results based on ${data.length} draw(s)`;
}

function toggleAllDraws() {
  const section = document.getElementById("allDraws");
  section.classList.toggle("hidden");
}

function renderAllDrawCounts(data) {
  const container = document.getElementById("allDrawList");
  container.innerHTML = "";

  const freq = {};
  for (let i = 1; i <= 49; i++) freq[i] = 0;

  const includeBonus = document.getElementById('bonusToggle').value === "yes";

  data.forEach(draw => {
    draw.winning_numbers.forEach(num => {
      const n = parseInt(num, 10);
      if (!isNaN(n)) freq[n]++;
    });
    if (includeBonus) {
      const bonus = parseInt(draw.additional_number, 10);
      if (!isNaN(bonus)) freq[bonus]++;
    }
  });

  for (let i = 1; i <= 49; i++) {
    const box = document.createElement("div");
    box.className = "draw-panel";
    box.textContent = `${i} → ${freq[i]} time${freq[i] !== 1 ? "s" : ""}`;
    container.appendChild(box);
  }
}
