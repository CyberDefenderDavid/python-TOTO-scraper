let allData = [];

fetch("docs/toto_result.json")
  .then(res => res.json())
  .then(data => {
    allData = data;
    populateFilters(data);
    applyFilters();
  });

function populateFilters(data) {
  const drawSet = new Set(data.map(d => d.draw_number));
  const dateSet = new Set(data.map(d => d.date));

  const drawFilter = document.getElementById("drawFilter");
  const dateFilter = document.getElementById("dateFilter");

  [...drawSet].sort((a, b) => b - a).forEach(draw => {
    const opt = document.createElement("option");
    opt.value = draw;
    opt.textContent = draw;
    drawFilter.appendChild(opt);
  });

  [...dateSet].sort().forEach(date => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = date;
    dateFilter.appendChild(opt);
  });

  document.getElementById("drawFilter").onchange = applyFilters;
  document.getElementById("dateFilter").onchange = applyFilters;
  document.getElementById("bonusToggle").onchange = applyFilters;
  document.getElementById("hotCount").onchange = applyFilters;
}

function applyFilters() {
  const draw = document.getElementById("drawFilter").value;
  const date = document.getElementById("dateFilter").value;

  let filtered = [...allData];
  if (draw !== "all") filtered = filtered.filter(d => d.draw_number === draw);
  if (date !== "all") filtered = filtered.filter(d => d.date === date);

  renderTable(filtered);
  renderHotCold(filtered);
  renderAllDrawCounts(filtered);
}

function renderTable(data) {
  const tbody = document.querySelector("#totoTable tbody");
  tbody.innerHTML = "";

  data.forEach(draw => {
    const row = document.createElement("tr");

    const tdDate = `<td>${draw.date}</td>`;
    const tdDraw = `<td>${draw.draw_number}</td>`;
    const tdWin = `<td>${draw.winning_numbers.join(", ")}</td>`;
    const tdBonus = `<td>${draw.additional_number}</td>`;
    const tdPrizes = `<td><span class="prize-toggle" onclick="togglePrize('${draw.draw_number}')">Show</span>
      <table class="prize-table" id="prize-${draw.draw_number}">
        <thead><tr><th>Group</th><th>Amount</th><th>Winners</th></tr></thead>
        <tbody>
          ${draw.group_prizes.map(p => `<tr><td>${p.group}</td><td>${p.amount}</td><td>${p.shares}</td></tr>`).join("")}
        </tbody>
      </table>
    </td>`;

    row.innerHTML = tdDate + tdDraw + tdWin + tdBonus + tdPrizes;
    tbody.appendChild(row);
  });
}

function togglePrize(drawNumber) {
  const table = document.getElementById(`prize-${drawNumber}`);
  table.style.display = table.style.display === "none" ? "table" : "none";
}

function renderHotCold(data) {
  const freq = {};
  for (let i = 1; i <= 49; i++) freq[i] = 0;

  const includeBonus = document.getElementById("bonusToggle").value === "yes";

  data.forEach(draw => {
    draw.winning_numbers.forEach(num => freq[parseInt(num)]++);
    if (includeBonus) freq[parseInt(draw.additional_number)]++;
  });

  const count = parseInt(document.getElementById("hotCount").value, 10);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const hot = sorted.slice(0, count);
  const cold = sorted.slice().reverse().slice(0, 10);

  const hotDiv = document.getElementById("hotNumbers");
  const coldDiv = document.getElementById("coldNumbers");
  hotDiv.innerHTML = "";
  coldDiv.innerHTML = "";

  document.getElementById("drawCount").textContent = `Results based on ${data.length} draw(s)`;

  hot.forEach(([num, c]) => {
    const div = document.createElement("div");
    div.className = "pill hot";
    div.textContent = `${c} draws "${num}"`;
    hotDiv.appendChild(div);
  });

  cold.forEach(([num, c]) => {
    const div = document.createElement("div");
    div.className = "pill cold";
    div.textContent = `${c} draw${c === 1 ? "" : "s"} "${num}"`;
    coldDiv.appendChild(div);
  });
}

function renderAllDrawCounts(data) {
  const tbody = document.querySelector("#allDrawTable tbody");
  tbody.innerHTML = "";

  const freq = {};
  for (let i = 1; i <= 49; i++) freq[i] = 0;

  const includeBonus = document.getElementById("bonusToggle").value === "yes";

  data.forEach(draw => {
    draw.winning_numbers.forEach(num => freq[parseInt(num)]++);
    if (includeBonus) freq[parseInt(draw.additional_number)]++;
  });

  for (let i = 1; i <= 49; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i}</td><td>${freq[i]}</td>`;
    tbody.appendChild(row);
  }
}

function toggleAllDraws() {
  const section = document.getElementById("allDraws");
  section.classList.toggle("hidden");
}

/* Quick Pick */
function generateToto() {
  const nums = new Set();
  while (nums.size < 6) {
    nums.add(Math.floor(Math.random() * 49) + 1);
  }
  document.getElementById("totoGenOutput").textContent = [...nums].sort((a, b) => a - b).join(", ");
}

/* Dark Mode Toggle */
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
