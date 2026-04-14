const STORAGE_KEY = "japan_trip_planner_v2";

const defaultState = {
  editMode: false,
  activeCity: "all",
  statusFilter: "all",
  days: [
    {
      id: crypto.randomUUID(),
      city: "Tokyo",
      title: "Tokyo Arrival + Shibuya",
      date: "2026-05-12",
      expanded: true,
      events: [
        {
          id: crypto.randomUUID(),
          place: "Shibuya Sky",
          time: "17:30",
          address: "2-24-12 Shibuya, Shibuya City",
          description: "Golden-hour city views from the rooftop observatory.",
          tryThis: "Book a sunset slot and bring a light jacket.",
          notes: "Aim to arrive 25 minutes early.",
          status: "need_reservation",
          checked: false
        },
        {
          id: crypto.randomUUID(),
          place: "Uobei Sushi",
          time: "20:00",
          address: "1-7-1 Dogenzaka, Shibuya City",
          description: "Fast conveyor-belt sushi dinner after check-in.",
          tryThis: "Order seared salmon + shrimp avocado.",
          notes: "Short queue after 19:30.",
          status: "rec",
          checked: false
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      city: "Kyoto",
      title: "Arashiyama + Gion",
      date: "2026-05-16",
      expanded: true,
      events: [
        {
          id: crypto.randomUUID(),
          place: "Tenryu-ji Temple",
          time: "09:00",
          address: "68 Sagatenryuji Susukinobabacho, Kyoto",
          description: "Historic Zen temple with beautiful gardens.",
          tryThis: "Start in the garden before tour groups arrive.",
          notes: "Use digital ticket lane.",
          status: "reserved",
          checked: false
        },
        {
          id: crypto.randomUUID(),
          place: "Sagano Scenic Railway",
          time: "11:10",
          address: "Saga Kameoka route",
          description: "River valley train ride through Arashiyama.",
          tryThis: "Try open-window car for photos.",
          notes: "Seats assigned at booking.",
          status: "reserved",
          checked: false
        },
        {
          id: crypto.randomUUID(),
          place: "Kaiseki Dinner in Gion",
          time: "19:00",
          address: "Gion district, Higashiyama",
          description: "Seasonal multi-course Kyoto dining experience.",
          tryThis: "Select tea pairing.",
          notes: "Dress code smart casual.",
          status: "reserved",
          checked: false
        },
        {
          id: crypto.randomUUID(),
          place: "Hanamikoji Evening Walk",
          time: "21:00",
          address: "Hanamikoji Street, Gion",
          description: "Lantern-lit stroll through historic lanes.",
          tryThis: "Pause at Shirakawa canal bridge.",
          notes: "No flash photography.",
          status: "free",
          checked: false
        }
      ]
    }
  ]
};

const state = loadState();
const plannerEl = document.getElementById("planner");
const tabGroupEl = document.getElementById("tab-group");
const statusFilterEl = document.getElementById("status-filter");
const editToggleEl = document.getElementById("edit-toggle");
const addDayBtn = document.getElementById("add-day");

editToggleEl.addEventListener("click", () => {
  state.editMode = !state.editMode;
  persist();
  render();
});

addDayBtn.addEventListener("click", () => {
  state.days.push({
    id: crypto.randomUUID(),
    city: "Tokyo",
    title: "New Day",
    date: "2026-05-20",
    expanded: true,
    events: []
  });
  persist();
  render();
});

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    return sanitize(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function sanitize(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const days = Array.isArray(safe.days) ? safe.days : defaultState.days;
  return {
    editMode: Boolean(safe.editMode),
    activeCity: safe.activeCity || "all",
    statusFilter: safe.statusFilter || "all",
    days: days.map((day) => ({
      id: day.id || crypto.randomUUID(),
      city: day.city || "Tokyo",
      title: day.title || "Untitled Day",
      date: day.date || "",
      expanded: day.expanded !== false,
      events: (Array.isArray(day.events) ? day.events : []).map((event) => ({
        id: event.id || crypto.randomUUID(),
        place: event.place || "",
        time: event.time || "",
        address: event.address || "",
        description: event.description || "",
        tryThis: event.tryThis || "",
        notes: event.notes || "",
        status: normalizeStatus(event.status),
        checked: Boolean(event.checked)
      }))
    }))
  };
}

function normalizeStatus(status) {
  return ["free", "rec", "need_reservation", "reserved"].includes(status) ? status : "free";
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderControls();
  renderDays();
  renderProgress();
}

function renderControls() {
  editToggleEl.textContent = state.editMode ? "Exit Edit Mode" : "Enter Edit Mode";
  editToggleEl.setAttribute("aria-pressed", String(state.editMode));
  addDayBtn.classList.toggle("hidden", !state.editMode);

  const cities = ["all", ...new Set(state.days.map((d) => d.city))];
  tabGroupEl.innerHTML = "";
  cities.forEach((city) => tabGroupEl.append(cityPill(city, state.activeCity, (v) => {
    state.activeCity = v;
    persist();
    render();
  })));

  const statuses = ["all", "free", "rec", "need_reservation", "reserved"];
  statusFilterEl.innerHTML = "";
  statuses.forEach((status) => statusFilterEl.append(cityPill(status.replace("_", " "), state.statusFilter, (v) => {
    state.statusFilter = v;
    persist();
    render();
  }, status)));
}

function cityPill(label, activeValue, onClick, explicitValue) {
  const value = explicitValue ?? label;
  const btn = document.createElement("button");
  btn.className = `pill ${activeValue === value ? "active" : ""}`;
  btn.textContent = label[0].toUpperCase() + label.slice(1);
  btn.type = "button";
  btn.addEventListener("click", () => onClick(value));
  return btn;
}

function renderProgress() {
  const events = state.days.flatMap((d) => d.events);
  const total = events.length;
  const checked = events.filter((e) => e.checked).length;
  document.getElementById("checked-count").textContent = String(checked);
  document.getElementById("total-count").textContent = String(total);
  document.getElementById("progress-percent").textContent = `${total ? Math.round((checked / total) * 100) : 0}%`;
}

function renderDays() {
  plannerEl.innerHTML = "";
  filteredDays().forEach((day) => plannerEl.append(renderDay(day)));
}

function filteredDays() {
  return state.days
    .filter((day) => state.activeCity === "all" || day.city === state.activeCity)
    .map((day) => ({
      ...day,
      events: day.events.filter((event) => state.statusFilter === "all" || event.status === state.statusFilter)
    }))
    .filter((day) => day.events.length || state.editMode);
}

function renderDay(dayView) {
  const day = state.days.find((d) => d.id === dayView.id);
  const card = document.createElement("section");
  card.className = "day-card";

  const head = document.createElement("header");
  head.className = "day-head";

  const left = document.createElement("div");
  if (state.editMode) {
    left.append(field("Day title", day.title, (v) => updateDay(day.id, "title", v)));
    left.append(field("Day date", day.date, (v) => updateDay(day.id, "date", v), "date"));
    left.append(field("City", day.city, (v) => updateDay(day.id, "city", v)));
  } else {
    left.innerHTML = `<h2>${escape(day.title)}</h2><p>${escape(day.city)} · ${formatDate(day.date)}</p>`;
  }

  const expandBtn = document.createElement("button");
  expandBtn.className = "btn btn-mini";
  expandBtn.type = "button";
  expandBtn.textContent = day.expanded ? "Collapse" : "Expand";
  expandBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    day.expanded = !day.expanded;
    persist();
    render();
  });

  head.append(left, expandBtn);
  card.append(head);

  const content = document.createElement("div");
  content.className = `day-content ${day.expanded ? "" : "hidden"}`;
  dayView.events.forEach((event) => content.append(renderEvent(day, event)));

  if (state.editMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "link-btn";
    addBtn.textContent = "+ Add place";
    addBtn.type = "button";
    addBtn.addEventListener("click", () => {
      day.events.push({
        id: crypto.randomUUID(),
        place: "New place",
        time: "",
        address: "",
        description: "",
        tryThis: "",
        notes: "",
        status: "free",
        checked: false
      });
      persist();
      render();
    });
    content.append(addBtn);

    if (state.days.length > 1) {
      const delDayBtn = document.createElement("button");
      delDayBtn.className = "link-btn";
      delDayBtn.textContent = "Delete day";
      delDayBtn.type = "button";
      delDayBtn.addEventListener("click", () => {
        state.days = state.days.filter((d) => d.id !== day.id);
        persist();
        render();
      });
      content.append(delDayBtn);
    }
  }

  card.append(content);
  return card;
}

function renderEvent(day, eventView) {
  const event = day.events.find((e) => e.id === eventView.id);
  const tpl = document.getElementById("event-template").content.cloneNode(true);
  const card = tpl.querySelector(".event-card");
  const check = tpl.querySelector(".event-check");
  const main = tpl.querySelector(".event-main");
  const meta = tpl.querySelector(".event-meta");
  const badge = tpl.querySelector(".status-badge");

  check.checked = event.checked;
  check.addEventListener("change", () => {
    event.checked = check.checked;
    persist();
    renderProgress();
  });

  if (state.editMode) {
    main.append(
      field("Place", event.place, (v) => updateEvent(day.id, event.id, "place", v)),
      div2(
        field("Time", event.time, (v) => updateEvent(day.id, event.id, "time", v)),
        selectField("Status", event.status, ["free", "rec", "need_reservation", "reserved"], (v) => updateEvent(day.id, event.id, "status", v))
      )
    );

    meta.append(
      field("Address", event.address, (v) => updateEvent(day.id, event.id, "address", v)),
      textareaField("Description", event.description, (v) => updateEvent(day.id, event.id, "description", v)),
      textareaField("Try this", event.tryThis, (v) => updateEvent(day.id, event.id, "tryThis", v)),
      textareaField("Notes", event.notes, (v) => updateEvent(day.id, event.id, "notes", v))
    );
  } else {
    main.innerHTML = `<h3>${escape(event.place)}</h3><p>${escape(event.time || "Flexible time")}</p>`;
    meta.innerHTML = `<div>${escape(event.address)}</div><div>${escape(event.description)}</div><div><strong>Try this:</strong> ${escape(event.tryThis)}</div><div><strong>Notes:</strong> ${escape(event.notes)}</div>`;
  }

  badge.textContent = event.status.replace("_", " ");
  badge.classList.add(`status-${event.status}`);

  if (state.editMode) {
    const actions = tpl.querySelector(".event-actions");
    actions.classList.remove("hidden");
    tpl.querySelector(".delete").addEventListener("click", () => {
      day.events = day.events.filter((e) => e.id !== event.id);
      persist();
      render();
    });
    tpl.querySelector(".up").addEventListener("click", () => reorder(day, event.id, -1));
    tpl.querySelector(".down").addEventListener("click", () => reorder(day, event.id, +1));
  }

  return card;
}

function updateDay(dayId, key, value) {
  const day = state.days.find((d) => d.id === dayId);
  if (!day) return;
  day[key] = value;
  persist();
  render();
}

function updateEvent(dayId, eventId, key, value) {
  const day = state.days.find((d) => d.id === dayId);
  const event = day?.events.find((e) => e.id === eventId);
  if (!event) return;
  event[key] = key === "status" ? normalizeStatus(value) : value;
  persist();
  render();
}

function reorder(day, eventId, direction) {
  const idx = day.events.findIndex((e) => e.id === eventId);
  const target = idx + direction;
  if (idx < 0 || target < 0 || target >= day.events.length) return;
  const [row] = day.events.splice(idx, 1);
  day.events.splice(target, 0, row);
  persist();
  render();
}

function field(labelText, value, onInput, type = "text") {
  const wrap = document.createElement("label");
  wrap.className = "edit-grid";
  const label = document.createElement("span");
  label.className = "muted";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = type;
  input.value = value || "";
  input.addEventListener("input", () => onInput(input.value));
  wrap.append(label, input);
  return wrap;
}

function selectField(labelText, value, options, onInput) {
  const wrap = document.createElement("label");
  wrap.className = "edit-grid";
  const label = document.createElement("span");
  label.className = "muted";
  label.textContent = labelText;
  const select = document.createElement("select");
  options.forEach((opt) => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt.replace("_", " ");
    if (value === opt) el.selected = true;
    select.append(el);
  });
  select.addEventListener("change", () => onInput(select.value));
  wrap.append(label, select);
  return wrap;
}

function textareaField(labelText, value, onInput) {
  const wrap = document.createElement("label");
  wrap.className = "edit-grid";
  const label = document.createElement("span");
  label.className = "muted";
  label.textContent = labelText;
  const textarea = document.createElement("textarea");
  textarea.value = value || "";
  textarea.addEventListener("input", () => onInput(textarea.value));
  wrap.append(label, textarea);
  return wrap;
}

function div2(left, right) {
  const div = document.createElement("div");
  div.className = "inline-2";
  div.append(left, right);
  return div;
}

function escape(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  if (!date) return "TBD";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

render();
