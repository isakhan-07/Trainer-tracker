const Store = (() => {
  const KEY = "fitflow-data-v1";

  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const seed = () => {
    const sections = [
      { id: uid(), name: "Сила", color: "#c8f542", description: "Жим, тяга, приседания и работа с весом." },
      { id: uid(), name: "Кардио", color: "#5eead4", description: "Бег, вело, интервалы и выносливость." },
      { id: uid(), name: "Мобильность", color: "#ffb020", description: "Растяжка, суставная гимнастика, восстановление." },
    ];
    const workouts = [
      {
        id: uid(),
        sectionId: sections[0].id,
        name: "Full Body A",
        duration: 55,
        intensity: "высокая",
        notes: "Присед, жим лёжа, тяга в наклоне.",
      },
      {
        id: uid(),
        sectionId: sections[1].id,
        name: "Интервалы 8×400",
        duration: 40,
        intensity: "средняя",
        notes: "Разминка 10 мин, затем интервалы.",
      },
      {
        id: uid(),
        sectionId: sections[2].id,
        name: "Вечерняя растяжка",
        duration: 20,
        intensity: "низкая",
        notes: "Таз, грудной отдел, задняя поверхность бедра.",
      },
    ];
    const d = new Date();
    const iso = (offset) => {
      const x = new Date(d);
      x.setDate(d.getDate() + offset);
      return x.toISOString().slice(0, 10);
    };
    const schedule = [
      { id: uid(), workoutId: workouts[0].id, date: iso(0), time: "18:30", completed: false, notes: "" },
      { id: uid(), workoutId: workouts[2].id, date: iso(0), time: "21:00", completed: false, notes: "" },
      { id: uid(), workoutId: workouts[1].id, date: iso(1), time: "07:30", completed: false, notes: "" },
      { id: uid(), workoutId: workouts[0].id, date: iso(3), time: "19:00", completed: false, notes: "" },
    ];
    return { sections, workouts, schedule };
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const data = seed();
        save(data);
        return data;
      }
      const parsed = JSON.parse(raw);
      parsed.sections ||= [];
      parsed.workouts ||= [];
      parsed.schedule ||= [];
      return parsed;
    } catch {
      const data = seed();
      save(data);
      return data;
    }
  };

  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  const mutate = (fn) => {
    const data = load();
    fn(data);
    save(data);
    return data;
  };

  return {
    uid,
    todayISO,
    load,
    save,
    mutate,
    create(collection, item) {
      const record = { id: uid(), ...item };
      mutate((data) => data[collection].push(record));
      return record;
    },
    update(collection, id, patch) {
      mutate((data) => {
        const i = data[collection].findIndex((x) => x.id === id);
        if (i >= 0) data[collection][i] = { ...data[collection][i], ...patch, id };
      });
    },
    remove(collection, id) {
      mutate((data) => {
        data[collection] = data[collection].filter((x) => x.id !== id);
      });
    },
  };
})();
