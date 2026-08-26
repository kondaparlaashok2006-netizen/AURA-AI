// AURA Mobile Agent Core
(function () {
  const KEY = "aura_mobile_agent_v1";

  const defaults = {
    name: localStorage.getItem("aura_username") || "Ashu",
    permissionMode: "ask",
    micMode: "ptt",
    face: "board",
    memory: [],
    updatedAt: Date.now()
  };

  let state;

  try {
    state = JSON.parse(localStorage.getItem(KEY)) || defaults;
  } catch (_) {
    state = defaults;
  }

  state = Object.assign({}, defaults, state);

  function save() {
    state.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function remember(text, role) {
    const value = String(text || "").trim();

    if (!value) return;

    state.memory.push({
      role: role || "user",
      text: value,
      at: Date.now()
    });

    if (state.memory.length > 100) {
      state.memory = state.memory.slice(-100);
    }

    save();
  }

  function findMemory(query) {
    const q = String(query || "").toLowerCase();

    return state.memory
      .filter(item =>
        item.text.toLowerCase().includes(q)
      )
      .slice(-8);
  }

  window.AURAMobileAgent = {

    getState: function () {
      return JSON.parse(JSON.stringify(state));
    },

    remember: remember,

    findMemory: findMemory,

    clearMemory: function () {
      state.memory = [];
      save();
    },

    setName: function (name) {
      state.name =
        String(name || "Ashu").trim() || "Ashu";

      localStorage.setItem(
        "aura_username",
        state.name
      );

      save();
    },

    setPermissionMode: function (mode) {
      state.permissionMode =
        mode === "bypassPermissions"
          ? "bypassPermissions"
          : "ask";

      save();
    },

    setMicMode: function (mode