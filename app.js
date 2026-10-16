(() => {
  const view = document.getElementById("view");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const primaryAction = document.getElementById("primaryAction");
  const modal = document.getElementById("modal");
  const modalForm = document.getElementById("modalForm");
  const modalTitle = document.getElementById("modalTitle");
  const backdrop = document.getElementById("backdrop");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const toastEl = document.getElementById("toast");

  const titles = {
    home: ["Главная", "Сегодняшние занятия и прогресс"],
    schedule: ["Расписание", "План на неделю — создать, изменить, отметить"],
    sections: ["Разделы", "Группы тренировок: сила, кардио, мобильность"],
    workouts: ["Тренировки", "Шаблоны занятий внутри разделов"],
  };

  let weekStart = startOfWeek(new Date());
  let workoutFilter = "all";
  let workoutQuery = "";

  function startOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d;
  }

  function iso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDay(date) {
    return date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric" });
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      toastEl.hidden = true;
    }, 2200);
  }

  function route() {
    const name = (location.hash.replace("#/", "") || "home").split("?")[0];
    return titles[name] ? name : "home";
  }

  function setNav() {
    const r = route();
    document.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === r);
    });
    pageTitle.textContent = titles[r][0];
    pageSubtitle.textContent = titles[r][1];
    primaryAction.textContent =
      r === "home" ? "К расписанию" : r === "schedule" ? "Добавить занятие" : r === "sections" ? "Новый раздел" : "Новая тренировка";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    if (window.innerWidth <= 860 && modal.hidden) backdrop.hidden = true;
  }

  function findById(list, id) {
    return list.find((x) => x.id === id);
  }

  function intensityBadge(level) {
    if (level === "высокая") return `<span class="badge warn">${level}</span>`;
    if (level === "низкая") return `<span class="badge ok">${level}</span>`;
    return `<span class="badge">${level}</span>`;
  }

  function closeModal() {
    modal.hidden = true;
    if (!sidebar.classList.contains("open")) backdrop.hidden = true;
    modalForm.innerHTML = "";
  }

  function openModal(title, fieldsHtml, onSubmit) {
    modalTitle.textContent = title;
    modalForm.innerHTML = fieldsHtml;
    modal.hidden = false;
    backdrop.hidden = false;
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(modalForm);
      const values = Object.fromEntries(fd.entries());
      onSubmit(values);
    };
    const first = modalForm.querySelector("input, select, textarea");
    if (first) first.focus();
  }

  function confirmDelete(message, onYes) {
    openModal(
      "Удалить?",
      `
      <p class="muted">${message}</p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelDel">Отмена</button>
        <button type="submit" class="btn btn-danger">Удалить</button>
      </div>
    `,
      () => {
        onYes();
        closeModal();
      }
    );
    modalForm.querySelector("#cancelDel").onclick = closeModal;
  }

  function pluralWorkouts(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} тренировка`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} тренировки`;
    return `${n} тренировок`;
  }

  const COLORS = ["#c8f542", "#5eead4", "#ffb020", "#ff5c7a", "#60a5fa", "#c084fc"];

  function sectionFields(item = {}) {
    const current = item.color || COLORS[0];
    const swatches = COLORS.map(
      (c) => `
        <label class="swatch">
          <input type="radio" name="color" value="${c}" ${c === current ? "checked" : ""}>
          <span style="background:${c}"></span>
        </label>`
    ).join("");
    return `
      <label>Название<input name="name" required maxlength="48" value="${escapeAttr(item.name || "")}"></label>
      <div>
        <span class="muted">Цвет</span>
        <div class="swatches">${swatches}</div>
      </div>
      <label>Описание<textarea name="description" maxlength="240">${escapeHtml(item.description || "")}</textarea></label>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close>Отмена</button>
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </div>
    `;
  }

  function workoutFields(data, item = {}) {
    const options = data.sections
      .map(
        (s) =>
          `<option value="${s.id}" ${item.sectionId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`
      )
      .join("");
    return `
      <label>Название<input name="name" required maxlength="64" value="${escapeAttr(item.name || "")}"></label>
      <label>Раздел
        <select name="sectionId" required>
          <option value="">Выберите раздел</option>
          ${options}
        </select>
      </label>
      <div class="form-row">
        <label>Длительность, мин<input name="duration" type="number" min="5" max="300" required value="${item.duration || 45}"></label>
        <label>Интенсивность
          <select name="intensity">
            ${["низкая", "средняя", "высокая"]
              .map((x) => `<option ${item.intensity === x ? "selected" : ""}>${x}</option>`)
              .join("")}
          </select>
        </label>
      </div>
      <label>Заметки<textarea name="notes" maxlength="400">${escapeHtml(item.notes || "")}</textarea></label>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close>Отмена</button>
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </div>
    `;
  }

  function sessionFields(data, item = {}) {
    const options = data.workouts
      .map((w) => `<option value="${w.id}" ${item.workoutId === w.id ? "selected" : ""}>${escapeHtml(w.name)}</option>`)
      .join("");
    return `
      <label>Тренировка
        <select name="workoutId" required>
          <option value="">Выберите тренировку</option>
          ${options}
        </select>
      </label>
      <div class="form-row">
        <label>Дата<input name="date" type="date" required value="${item.date || Store.todayISO()}"></label>
        <label>Время<input name="time" type="time" required value="${item.time || "18:00"}"></label>
      </div>
      <label>Заметка<textarea name="notes" maxlength="200">${escapeHtml(item.notes || "")}</textarea></label>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close>Отмена</button>
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll('"', "&quot;");
  }

  function renderHome(data) {
    const today = Store.todayISO();
    const todayItems = data.schedule
      .filter((s) => s.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
    const done = data.schedule.filter((s) => s.completed).length;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekCount = data.schedule.filter((s) => s.date >= iso(weekStart) && s.date <= iso(weekEnd)).length;

    view.innerHTML = `
      <div class="grid-stats">
        <article class="card stat"><div class="label">Разделов</div><div class="value">${data.sections.length}</div></article>
        <article class="card stat"><div class="label">Тренировок</div><div class="value">${data.workouts.length}</div></article>
        <article class="card stat"><div class="label">На этой неделе</div><div class="value">${weekCount}</div></article>
        <article class="card stat"><div class="label">Выполнено всего</div><div class="value">${done}</div></article>
      </div>
      <div class="section-head"><h2>Сегодня</h2><span class="muted">${new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</span></div>
      <div class="list">
        ${
          todayItems.length
            ? todayItems
                .map((s) => sessionRow(data, s))
                .join("")
            : `<div class="empty">На сегодня ничего не запланировано. Добавьте занятие в расписании.</div>`
        }
      </div>
    `;
  }

  function sessionRow(data, session) {
    const workout = findById(data.workouts, session.workoutId);
    const section = workout ? findById(data.sections, workout.sectionId) : null;
    return `
      <article class="row-card ${session.completed ? "done" : ""}">
        <span class="dot" style="background:${section?.color || "#8d99a8"}"></span>
        <div class="grow">
          <p class="title">${escapeHtml(workout?.name || "Удаленная тренировка")}</p>
          <p class="meta">${session.time} · ${section?.name || "—"} · ${workout?.duration || "?"} мин ${session.notes ? " · " + escapeHtml(session.notes) : ""}</p>
        </div>
        <div class="actions">
          <button class="chip ${session.completed ? "active" : ""}" data-toggle="${session.id}">${session.completed ? "Готово" : "Отметить"}</button>
        </div>
      </article>
    `;
  }

  function renderSchedule(data) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
    const end = days[6];
    const label = `${weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} — ${end.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;

    view.innerHTML = `
      <div class="week-nav">
        <button class="btn btn-ghost" id="prevWeek" type="button">←</button>
        <strong>${label}</strong>
        <button class="btn btn-ghost" id="nextWeek" type="button">→</button>
      </div>
      <div class="week-grid">
        ${days
          .map((d) => {
            const key = iso(d);
            const items = data.schedule
              .filter((s) => s.date === key)
              .sort((a, b) => a.time.localeCompare(b.time));
            const isToday = key === Store.todayISO();
            return `
              <section class="day-col ${isToday ? "today" : ""}" data-day="${key}">
                <header>
                  <h3>${formatDay(d)}</h3>
                  <span class="num">${d.getDate()}</span>
                </header>
                ${
                  items.length
                    ? items.map((s) => daySession(data, s)).join("")
                    : `<p class="muted" style="font-size:.8rem">Нет занятий</p>`
                }
                <button class="chip" data-add-day="${key}" type="button">+ занятие</button>
              </section>
            `;
          })
          .join("")}
      </div>
    `;

    document.getElementById("prevWeek").onclick = () => {
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() - 7);
      render();
    };
    document.getElementById("nextWeek").onclick = () => {
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
      render();
    };
  }

  function daySession(data, session) {
    const workout = findById(data.workouts, session.workoutId);
    const section = workout ? findById(data.sections, workout.sectionId) : null;
    return `
      <article class="session-card ${session.completed ? "done" : ""}">
        <strong>${session.time} · ${escapeHtml(workout?.name || "—")}</strong>
        <span class="meta">${section?.name || ""} ${session.notes ? " · " + escapeHtml(session.notes) : ""}</span>
        <div class="actions">
          <button class="chip ${session.completed ? "active" : ""}" data-toggle="${session.id}" type="button">${session.completed ? "✓" : "Старт"}</button>
          <button class="chip" data-edit-session="${session.id}" type="button">Изм.</button>
          <button class="chip" data-del-session="${session.id}" type="button">Удал.</button>
        </div>
      </article>
    `;
  }

  function renderSections(data) {
    view.innerHTML = `
      <div class="cards-grid">
        ${
          data.sections.length
            ? data.sections
                .map((s) => {
                  const count = data.workouts.filter((w) => w.sectionId === s.id).length;
                  return `
                    <article class="section-card">
                      <div class="row-card" style="padding:0;border:0;background:transparent;box-shadow:none">
                        <span class="dot" style="background:${s.color}"></span>
                        <div class="grow">
                          <p class="title">${escapeHtml(s.name)}</p>
                          <p class="meta">${pluralWorkouts(count)}</p>
                        </div>
                      </div>
                      <p class="muted">${escapeHtml(s.description || "Без описания")}</p>
                      <div class="actions">
                        <button class="btn btn-ghost" data-edit-section="${s.id}">Изменить</button>
                        <button class="btn btn-danger" data-del-section="${s.id}">Удалить</button>
                      </div>
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty">Разделов пока нет. Создайте первый — например «Сила».</div>`
        }
      </div>
    `;
  }

  function renderWorkouts(data) {
    const filtered = data.workouts.filter((w) => {
      const bySection = workoutFilter === "all" || w.sectionId === workoutFilter;
      const q = workoutQuery.trim().toLowerCase();
      const byQuery = !q || w.name.toLowerCase().includes(q) || (w.notes || "").toLowerCase().includes(q);
      return bySection && byQuery;
    });

    view.innerHTML = `
      <div class="toolbar">
        <input id="searchWorkouts" type="search" placeholder="Поиск тренировки" value="${escapeAttr(workoutQuery)}">
      </div>
      <div class="filters">
        <button class="chip ${workoutFilter === "all" ? "active" : ""}" data-filter="all" type="button">Все</button>
        ${data.sections
          .map(
            (s) =>
              `<button class="chip ${workoutFilter === s.id ? "active" : ""}" data-filter="${s.id}" type="button">${escapeHtml(s.name)}</button>`
          )
          .join("")}
      </div>
      <div class="cards-grid">
        ${
          filtered.length
            ? filtered
                .map((w) => {
                  const s = findById(data.sections, w.sectionId);
                  return `
                    <article class="workout-card">
                      <p class="title">${escapeHtml(w.name)}</p>
                      <p class="meta">${s ? escapeHtml(s.name) : "Без раздела"} · ${w.duration} мин</p>
                      ${intensityBadge(w.intensity)}
                      <p class="muted">${escapeHtml(w.notes || "")}</p>
                      <div class="actions">
                        <button class="btn btn-ghost" data-edit-workout="${w.id}">Изменить</button>
                        <button class="btn btn-danger" data-del-workout="${w.id}">Удалить</button>
                      </div>
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty">Нет тренировок. Сначала создайте раздел, затем добавьте занятие.</div>`
        }
      </div>
    `;

    const search = document.getElementById("searchWorkouts");
    search.oninput = () => {
      workoutQuery = search.value;
      render();
      const again = document.getElementById("searchWorkouts");
      if (again) {
        again.focus();
        again.setSelectionRange(workoutQuery.length, workoutQuery.length);
      }
    };
  }

  function render() {
    setNav();
    const data = Store.load();
    const r = route();
    if (r === "home") renderHome(data);
    if (r === "schedule") renderSchedule(data);
    if (r === "sections") renderSections(data);
    if (r === "workouts") renderWorkouts(data);
  }

  function openCreate() {
    const data = Store.load();
    const r = route();
    if (r === "home") {
      location.hash = "#/schedule";
      return;
    }
    if (r === "sections") {
      openModal("Новый раздел", sectionFields(), (values) => {
        Store.create("sections", values);
        closeModal();
        toast("Раздел создан");
        render();
      });
    }
    if (r === "workouts") {
      if (!data.sections.length) {
        toast("Сначала создайте раздел");
        location.hash = "#/sections";
        return;
      }
      openModal("Новая тренировка", workoutFields(data), (values) => {
        values.duration = Number(values.duration);
        Store.create("workouts", values);
        closeModal();
        toast("Тренировка добавлена");
        render();
      });
    }
    if (r === "schedule") {
      if (!data.workouts.length) {
        toast("Сначала создайте тренировку");
        location.hash = "#/workouts";
        return;
      }
      openModal("Занятие в расписании", sessionFields(data), (values) => {
        Store.create("schedule", { ...values, completed: false });
        closeModal();
        toast("Занятие запланировано");
        render();
      });
    }
  }

  view.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toggle], [data-add-day], [data-edit-session], [data-del-session], [data-edit-section], [data-del-section], [data-edit-workout], [data-del-workout], [data-filter]");
    if (!t) return;
    const data = Store.load();

    if (t.dataset.toggle) {
      const item = findById(data.schedule, t.dataset.toggle);
      Store.update("schedule", item.id, { completed: !item.completed });
      toast(item.completed ? "Снято с выполнения" : "Отмечено выполненным");
      render();
    }

    if (t.dataset.addDay) {
      if (!data.workouts.length) {
        toast("Сначала создайте тренировку");
        return;
      }
      openModal("Занятие в расписании", sessionFields(data, { date: t.dataset.addDay }), (values) => {
        Store.create("schedule", { ...values, completed: false });
        closeModal();
        toast("Занятие запланировано");
        render();
      });
    }

    if (t.dataset.editSession) {
      const item = findById(data.schedule, t.dataset.editSession);
      openModal("Изменить занятие", sessionFields(data, item), (values) => {
        Store.update("schedule", item.id, values);
        closeModal();
        toast("Занятие обновлено");
        render();
      });
    }

    if (t.dataset.delSession) {
      confirmDelete("Занятие исчезнет из расписания.", () => {
        Store.remove("schedule", t.dataset.delSession);
        toast("Занятие удалено");
        render();
      });
    }

    if (t.dataset.editSection) {
      const item = findById(data.sections, t.dataset.editSection);
      openModal("Изменить раздел", sectionFields(item), (values) => {
        Store.update("sections", item.id, values);
        closeModal();
        toast("Раздел обновлён");
        render();
      });
    }

    if (t.dataset.delSection) {
      confirmDelete("Удалятся связанные тренировки и занятия в расписании.", () => {
        const sid = t.dataset.delSection;
        const workoutIds = data.workouts.filter((w) => w.sectionId === sid).map((w) => w.id);
        Store.mutate((d) => {
          d.sections = d.sections.filter((s) => s.id !== sid);
          d.workouts = d.workouts.filter((w) => w.sectionId !== sid);
          d.schedule = d.schedule.filter((s) => !workoutIds.includes(s.workoutId));
        });
        toast("Раздел удалён");
        render();
      });
    }

    if (t.dataset.editWorkout) {
      const item = findById(data.workouts, t.dataset.editWorkout);
      openModal("Изменить тренировку", workoutFields(data, item), (values) => {
        values.duration = Number(values.duration);
        Store.update("workouts", item.id, values);
        closeModal();
        toast("Тренировка обновлена");
        render();
      });
    }

    if (t.dataset.delWorkout) {
      confirmDelete("Занятия этой тренировки тоже будут удалены из расписания.", () => {
        const id = t.dataset.delWorkout;
        Store.mutate((d) => {
          d.workouts = d.workouts.filter((w) => w.id !== id);
          d.schedule = d.schedule.filter((s) => s.workoutId !== id);
        });
        toast("Тренировка удалена");
        render();
      });
    }

    if (t.dataset.filter) {
      workoutFilter = t.dataset.filter;
      render();
    }
  });

  modalForm.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });

  document.getElementById("modalClose").onclick = closeModal;
  backdrop.onclick = () => {
    closeModal();
    closeSidebar();
  };
  primaryAction.onclick = openCreate;
  menuBtn.onclick = () => {
    const open = sidebar.classList.toggle("open");
    backdrop.hidden = !open && modal.hidden;
  };
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeSidebar));
  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeSidebar();
    }
  });

  if (!location.hash) location.hash = "#/home";
  render();
})();
