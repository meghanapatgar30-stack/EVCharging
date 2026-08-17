const API_BASE = "http://localhost:5000/api";

let allStations = [];
let allBookings = [];

document.addEventListener("DOMContentLoaded", () => {
  loadStations();
  loadBookings();

  document.getElementById("search-input").addEventListener("input", applyFilters);
  document.getElementById("filter-location").addEventListener("change", applyFilters);
  document.getElementById("filter-availability").addEventListener("change", applyFilters);
  document.getElementById("filter-type").addEventListener("change", applyFilters);
  document.getElementById("clear-filters-btn").addEventListener("click", clearFilters);

  document.getElementById("booking-station").addEventListener("change", updateChargerOptions);
  document.getElementById("booking-form").addEventListener("submit", handleBookingSubmit);

  document.getElementById("booking-date").min = todayISO();
});

async function loadStations() {
  try {
    const res = await fetch(`${API_BASE}/stations`);
    if (!res.ok) throw new Error("Failed to load stations");
    allStations = await res.json();

    populateFilterOptions();
    populateStationDropdown();
    applyFilters();
    updateStats();
  } catch (err) {
    document.getElementById("stations-grid").innerHTML =
      `<p class="error-message">Could not load stations. Is the backend running on http://localhost:5000?</p>`;
  }
}

function populateFilterOptions() {
  const locationSelect = document.getElementById("filter-location");
  const typeSelect = document.getElementById("filter-type");

  const locations = [...new Set(allStations.map((s) => s.location))];
  const types = [...new Set(allStations.map((s) => s.chargingType))];

  locations.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationSelect.appendChild(opt);
  });

  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });
}

function applyFilters() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const location = document.getElementById("filter-location").value;
  const availability = document.getElementById("filter-availability").value;
  const type = document.getElementById("filter-type").value;

  let filtered = allStations;

  if (search) {
    filtered = filtered.filter(
      (s) => s.name.toLowerCase().includes(search) || s.location.toLowerCase().includes(search)
    );
  }
  if (location) filtered = filtered.filter((s) => s.location === location);
  if (availability) filtered = filtered.filter((s) => s.status === availability);
  if (type) filtered = filtered.filter((s) => s.chargingType === type);

  renderStations(filtered);
}

function clearFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-location").value = "";
  document.getElementById("filter-availability").value = "";
  document.getElementById("filter-type").value = "";
  applyFilters();
}

function renderStations(stations) {
  const grid = document.getElementById("stations-grid");
  const countEl = document.getElementById("results-count");

  countEl.textContent = `${stations.length} station${stations.length !== 1 ? "s" : ""} found`;

  if (!stations.length) {
    grid.innerHTML = `<p class="muted">No stations match your search/filters.</p>`;
    return;
  }

  grid.innerHTML = stations.map(stationCardHtml).join("");

  grid.querySelectorAll(".book-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stationId = btn.dataset.id;
      document.getElementById("booking-station").value = stationId;
      updateChargerOptions();
      document.getElementById("booking-section").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function badgeClass(status) {
  if (status === "Available") return "badge-available";
  if (status === "Busy") return "badge-busy";
  return "badge-offline";
}

function stationCardHtml(s) {
  return `
    <div class="station-card">
      <h3>${escapeHtml(s.name)}</h3>
      <div class="station-location">📍 ${escapeHtml(s.location)} &middot; ${s.distance} km away</div>

      <div class="station-meta">
        <span>Chargers: <b>${s.availableChargers}/${s.totalChargers} available</b></span>
        <span>Type: <b>${escapeHtml(s.chargingType)}</b></span>
        <span>Price: <b>&#8377;${s.pricePerKwh}/kWh</b></span>
        <span>Status: <span class="badge ${badgeClass(s.status)}">${escapeHtml(s.status)}</span></span>
      </div>

      <div class="station-footer">
        <span class="price">&#8377;${s.pricePerKwh}/kWh</span>
        <button class="btn btn-primary btn-small book-btn" data-id="${s.id}">Book Charger</button>
      </div>
    </div>
  `;
}

function updateStats() {
  const totalStations = allStations.length;
  const availableChargers = allStations.reduce((sum, s) => sum + s.availableChargers, 0);
  const activeBookings = allBookings.filter((b) => b.status !== "Cancelled").length;

  document.getElementById("stat-total-stations").textContent = totalStations;
  document.getElementById("stat-available-chargers").textContent = availableChargers;
  document.getElementById("stat-active-bookings").textContent = activeBookings;
}

function populateStationDropdown() {
  const select = document.getElementById("booking-station");
  select.innerHTML = `<option value="">Select a station</option>`;

  allStations.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.location})`;
    select.appendChild(opt);
  });
}

function updateChargerOptions() {
  const stationId = document.getElementById("booking-station").value;
  const chargerSelect = document.getElementById("booking-charger");

  if (!stationId) {
    chargerSelect.innerHTML = `<option value="">Select a station first</option>`;
    return;
  }

  const station = allStations.find((s) => String(s.id) === String(stationId));
  if (!station) return;

  let options = `<option value="">Select a charger</option>`;
  for (let i = 1; i <= station.totalChargers; i++) {
    options += `<option value="${i}">Charger ${i}</option>`;
  }
  chargerSelect.innerHTML = options;
}

async function handleBookingSubmit(e) {
  e.preventDefault();

  const errorEl = document.getElementById("booking-error");
  const successEl = document.getElementById("booking-success");
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  const stationId = document.getElementById("booking-station").value;
  const chargerNumber = document.getElementById("booking-charger").value;
  const date = document.getElementById("booking-date").value;
  const time = document.getElementById("booking-time").value;
  const userName = document.getElementById("booking-user").value.trim();

  if (!stationId || !chargerNumber || !date || !time || !userName) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.classList.remove("hidden");
    return;
  }

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Booking...";

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId, chargerNumber, date, time, userName })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Could not create booking");
    }

    document.getElementById("booking-success-text").textContent =
      `${data.booking.stationName} — Charger ${data.booking.chargerNumber} on ${data.booking.date} at ${data.booking.time}.`;
    successEl.classList.remove("hidden");

    e.target.reset();
    document.getElementById("booking-charger").innerHTML = `<option value="">Select a station first</option>`;

    await loadBookings();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Booking";
  }
}

async function loadBookings() {
  try {
    const res = await fetch(`${API_BASE}/bookings`);
    if (!res.ok) throw new Error("Failed to load bookings");
    allBookings = await res.json();

    renderBookings();
    updateStats();
  } catch (err) {
    document.getElementById("bookings-list").innerHTML =
      `<p class="error-message">Could not load bookings.</p>`;
  }
}

function renderBookings() {
  const listEl = document.getElementById("bookings-list");

  if (!allBookings.length) {
    listEl.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  const sorted = [...allBookings].reverse();

  listEl.innerHTML = sorted
    .map(
      (b) => `
    <div class="booking-row">
      <div>
        <div class="booking-main">${escapeHtml(b.stationName)} — Charger ${b.chargerNumber}</div>
        <div class="booking-sub">${escapeHtml(b.userName)} &middot; ${b.date} at ${b.time} &middot; ${escapeHtml(b.status)}</div>
      </div>
      <button class="btn btn-outline btn-small cancel-booking-btn" data-id="${b.id}">Cancel</button>
    </div>
  `
    )
    .join("");

  listEl.querySelectorAll(".cancel-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => cancelBooking(btn.dataset.id));
  });
}

async function cancelBooking(id) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not cancel booking");
    await loadBookings();
  } catch (err) {
    alert(err.message);
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
