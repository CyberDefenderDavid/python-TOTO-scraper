let allData = [];

fetch("toto_result.json")
  .then(res => res.json())
  .then(data => {
    allData = data;
    populateFilters(data);
    renderTable(data);
    renderStats(data);
  })
  .catch(err => console.error("Failed to load JSON:", err));

function populateFilters(data) {
  const drawFilter = document.getElementById("drawFilter");
  const dateFilter = document.getElementById("dateFilter");
  const draws = [...new Set(data.map(r => r.draw_number))].sort((a, b) => b - a);
  const dates = [...new Set(data.map(r => r.date))].sort((a, b) => new Date(b) - new Date(a));

  for (const d of draws) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    drawFilter.appendChild(opt);
  }
  for (const dt of dates) {
    const opt = document.createElement("option");
    opt.value = dt;
    opt.textContent = dt;
    dateFilter.appendChild(opt);
  }

  drawFilter.addEventListener("change", applyFilters);
  dateFilter.addEventListener("change", applyFilters);
  document.getElementById("bonusToggle").addEventListener("change", () => renderStats(allData));
  document.getElementById("hotCount").addEventListener("change", () => renderStats(allData));
  document.getElementById("coldCount").addEventListener("change", () => renderStats(allData));
}

function applyFilters() {
  const drawVal = document.getElementById("drawFilter").value;
  const dateVal = document.getElementById("dateFilter").value;
  let filtered = allData;
  if (drawVal !== "all") filtered = filtered.filter(d => d.draw_number === drawVal);
  if (dateVal !== "all") filtered = filtered.filter(d => d.date === dateVal);
  renderTable(filtered);
  renderStats(filtered);
}

function renderTable(data) {
  const tbody = document.querySelector("#totoTable tbody");
  tbody.innerHTML = "";
  data.forEach(draw => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${draw.date}</td>
      <td>${draw.draw_number}</td>
      <td>${draw.winning_numbers.join(", ")}</td>
      <td>${draw.additional_number}</td>
      <td><a href="#" onclick="togglePrize(this)">Show</a></td>
    `;
    const prizeTr = document.createElement("tr");
    prizeTr.classList.add("hidden");
    prizeTr.innerHTML = `
      <td colspan="5">
        <table class="all-draw-table">
          <thead><tr><th>Group</th><th>Amount</th><th>Winners</th></tr></thead>
          <tbody>
            ${draw.group_prizes.map(p => `
              <tr>
                <td>${p.group}</td>
                <td>${p.amount}</td>
                <td>${p.shares}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </td>`;
    tbody.appendChild(tr);
    tbody.appendChild(prizeTr);
  });
}

function togglePrize(link) {
  const row = link.closest("tr").nextSibling;
  row.classList.toggle("hidden");
  link.textContent = row.classList.contains("hidden") ? "Show" : "Hide";
}

function renderStats(data) {
  const includeAdd = document.getElementById("bonusToggle").value === "yes";
  let hotCount = document.getElementById("hotCount").value;
  let coldCount = document.getElementById("coldCount").value;
  hotCount = hotCount === "all" ? 49 : parseInt(hotCount, 10);
  coldCount = coldCount === "all" ? 49 : parseInt(coldCount, 10);

  const countMap = {};
  for (let i = 1; i <= 49; i++) countMap[i] = 0;

  data.forEach(d => {
    d.winning_numbers.forEach(n => countMap[n]++);
    if (includeAdd && d.additional_number) countMap[d.additional_number]++;
  });

  const allEntries = Object.entries(countMap);
  const sortedHot = [...allEntries].sort((a, b) => b[1] - a[1]).slice(0, hotCount);
  const sortedCold = [...allEntries].sort((a, b) => a[1] - b[1]).slice(0, coldCount);

  const hotDiv = document.getElementById("hotNumbers");
  const coldDiv = document.getElementById("coldNumbers");
  hotDiv.innerHTML = sortedHot.map(([num, cnt]) => `<span class="pill hot">${cnt} draws "${num}"</span>`).join("");
  coldDiv.innerHTML = sortedCold.map(([num, cnt]) => `<span class="pill cold">${cnt} draws "${num}"</span>`).join("");

  document.getElementById("drawCount").textContent = `Results based on ${data.length} draw(s)`;

  renderAllDrawList(countMap);
}

function renderAllDrawList(countMap) {
  const container = document.getElementById("allDrawList");
  if (!container) return;
  container.innerHTML = Object.entries(countMap).map(
    ([n, c]) => `<tr><td>${n}</td><td>${c}</td></tr>`
  ).join("");
}

function toggleAllDraws() {
  document.getElementById("allDraws").classList.toggle("hidden");
}

function generateToto() {
  const nums = new Set();
  while (nums.size < 6) nums.add(Math.floor(Math.random() * 49) + 1);
  document.getElementById("totoGenOutput").textContent = [...nums].sort((a, b) => a - b).join(", ");
}

document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});
