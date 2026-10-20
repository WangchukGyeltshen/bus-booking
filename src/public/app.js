// Front-end logic for the Bus Ticket Booking page.
// Talks to the API in src/app.ts using fetch().

const state = { info: null, booked: [], selected: [], ages: {} };
const $ = (id) => document.getElementById(id);
const MAX_SEATS = 4;

/** Calls the API and throws the server's error message on failure. */
async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/** Shows a success or error message box. */
function show(el, message, ok) {
  el.hidden = false;
  el.className = "result " + (ok ? "success" : "error");
  el.style.whiteSpace = "pre-line";
  el.textContent = message;
}

/** Formats a Date as YYYY-MM-DD in local time. */
function toDateString(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Fare for one passenger (mirrors the server rule, for display only). */
function fare(age) {
  return age < state.info.childAgeLimit ? state.info.childFare : state.info.adultFare;
}

/** Loads routes and fares, sets up the date picker, then loads seats. */
async function init() {
  state.info = await api("/api/routes");
  $("route").innerHTML = state.info.routes
    .map((r) => `<option value="${r}">${r.replace("-", " to ")}</option>`)
    .join("");
  $("fare-info").textContent =
    `Departs daily at ${state.info.departure}. Adult Nu. ${state.info.adultFare}, ` +
    `child under ${state.info.childAgeLimit} Nu. ${state.info.childFare}.`;

  const today = new Date();
  const maxDay = new Date();
  maxDay.setDate(today.getDate() + 30);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  $("date").min = toDateString(today);
  $("date").max = toDateString(maxDay);
  $("date").value = toDateString(tomorrow);

  $("route").addEventListener("change", loadSeats);
  $("date").addEventListener("change", loadSeats);
  $("booking-form").addEventListener("submit", onBook);
  $("cancel-form").addEventListener("submit", onCancel);
  await loadSeats();
}

/** Fetches booked seats for the chosen route and date. */
async function loadSeats() {
  state.selected = [];
  state.ages = {};
  try {
    const q = `route=${encodeURIComponent($("route").value)}&date=${$("date").value}`;
    state.booked = (await api(`/api/seats?${q}`)).booked;
  } catch (err) {
    state.booked = [];
    show($("booking-result"), err.message, false);
  }
  render();
}

/** Selects or unselects a seat (max 4). */
function toggleSeat(seat) {
  if (state.selected.includes(seat)) {
    state.selected = state.selected.filter((s) => s !== seat);
    delete state.ages[seat];
  } else if (state.selected.length >= MAX_SEATS) {
    show($("booking-result"), `You can select at most ${MAX_SEATS} seats.`, false);
    return;
  } else {
    state.selected.push(seat);
    state.ages[seat] = 30;
  }
  render();
}

/** Redraws the seat grid, passenger age inputs and total. */
function render() {
  const grid = $("seat-grid");
  grid.innerHTML = "";
  for (let seat = 1; seat <= state.info.totalSeats; seat++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat" + (state.selected.includes(seat) ? " selected" : "");
    btn.textContent = seat;
    btn.dataset.seat = seat;
    btn.disabled = state.booked.includes(seat);
    btn.addEventListener("click", () => toggleSeat(seat));
    grid.appendChild(btn);
  }

  $("passengers").innerHTML = state.selected
    .map((seat) => `<label>Seat ${seat}: passenger age
      <input type="number" id="age-${seat}" min="0" max="120" value="${state.ages[seat]}" /></label>`)
    .join("");
  for (const seat of state.selected) {
    $(`age-${seat}`).addEventListener("input", (e) => {
      state.ages[seat] = e.target.value;
      updateTotal();
    });
  }
  updateTotal();
}

/** Recalculates the displayed total. */
function updateTotal() {
  $("total").textContent = state.selected.reduce((sum, s) => sum + fare(Number(state.ages[s])), 0);
}

/** Sends the booking to the API. */
async function onBook(e) {
  e.preventDefault();
  const body = {
    name: $("name").value,
    phone: $("phone").value,
    route: $("route").value,
    date: $("date").value,
    passengers: state.selected.map((seat) => ({ seat, age: Number(state.ages[seat]) })),
  };
  try {
    const b = await api("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    show($("booking-result"),
      `Booking confirmed!\nBooking ID: ${b.id}\nSeats: ${b.passengers.map((p) => p.seat).join(", ")}` +
      `\nTotal paid: Nu. ${b.totalFare}`, true);
    await loadSeats();
  } catch (err) {
    show($("booking-result"), err.message, false);
  }
}

/** Cancels a booking by ID and shows the refund. */
async function onCancel(e) {
  e.preventDefault();
  const id = $("cancel-id").value.trim();
  try {
    const b = await api(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST" });
    show($("cancel-result"), `Booking ${b.id} cancelled.\nRefund: Nu. ${b.refund}`, true);
    await loadSeats();
  } catch (err) {
    show($("cancel-result"), err.message, false);
  }
}

init();