(function () {
  "use strict";

  var TOOLS = window.AI_TOOLS || [];
  var CAPS = window.AI_CAPABILITIES || [];
  var SVG_NS = "http://www.w3.org/2000/svg";

  // ---- State -------------------------------------------------------------
  // Default selection: Devin plus the next two tools.
  var selected = {};
  TOOLS.forEach(function (t, i) {
    selected[t.id] = i < 3;
  });
  var sortKey = "autonomy";
  var sortDir = -1; // -1 = descending, 1 = ascending
  var searchTerm = "";
  var highlightDevin = true;

  // ---- Helpers -----------------------------------------------------------
  function selectedTools() {
    return TOOLS.filter(function (t) {
      return selected[t.id];
    });
  }

  function capByKey(key) {
    return CAPS.filter(function (c) {
      return c.key === key;
    })[0];
  }

  function avgScore(tool) {
    var sum = 0;
    CAPS.forEach(function (c) {
      sum += tool.ratings[c.key] || 0;
    });
    return sum / CAPS.length;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      node.appendChild(c);
    });
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  // ---- Tooltip -----------------------------------------------------------
  var tooltip = document.getElementById("tooltip");
  function showTooltip(text, x, y) {
    tooltip.textContent = text;
    tooltip.hidden = false;
    var pad = 12;
    var rect = tooltip.getBoundingClientRect();
    var left = x + pad;
    if (left + rect.width > window.innerWidth) left = x - rect.width - pad;
    var top = y + pad;
    if (top + rect.height > window.innerHeight) top = y - rect.height - pad;
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }
  function hideTooltip() {
    tooltip.hidden = true;
  }

  // ---- Tool toggles ------------------------------------------------------
  function renderToggles() {
    var box = document.getElementById("tool-toggles");
    box.innerHTML = "";
    TOOLS.forEach(function (t) {
      var on = selected[t.id];
      var chip = el("button", {
        class: "chip" + (on ? " chip-on" : ""),
        type: "button",
        "aria-pressed": on ? "true" : "false",
        title: t.tagline,
      });
      chip.style.setProperty("--chip-color", t.color);
      chip.appendChild(el("span", { class: "chip-dot" }));
      chip.appendChild(el("span", { text: t.name }));
      if (t.featured) chip.appendChild(el("span", { class: "chip-badge", text: "★" }));
      chip.addEventListener("click", function () {
        selected[t.id] = !selected[t.id];
        renderAll();
      });
      box.appendChild(chip);
    });
  }

  // ---- Radar chart -------------------------------------------------------
  function renderRadar() {
    var svg = document.getElementById("radar-chart");
    svg.innerHTML = "";
    var cx = 210,
      cy = 210,
      maxR = 150,
      n = CAPS.length;
    var levels = 5;

    function point(i, r) {
      var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    }

    // Grid rings
    for (var lvl = 1; lvl <= levels; lvl++) {
      var r = (maxR * lvl) / levels;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var p = point(i, r);
        pts.push(p.x + "," + p.y);
      }
      svg.appendChild(
        svgEl("polygon", {
          points: pts.join(" "),
          class: "radar-grid",
        })
      );
    }

    // Axes + labels
    for (var a = 0; a < n; a++) {
      var outer = point(a, maxR);
      svg.appendChild(
        svgEl("line", {
          x1: cx,
          y1: cy,
          x2: outer.x,
          y2: outer.y,
          class: "radar-axis",
        })
      );
      var labelP = point(a, maxR + 26);
      var anchor = "middle";
      if (labelP.x > cx + 5) anchor = "start";
      else if (labelP.x < cx - 5) anchor = "end";
      var label = svgEl("text", {
        x: labelP.x,
        y: labelP.y,
        "text-anchor": anchor,
        class: "radar-label",
        "dominant-baseline": "middle",
      });
      label.textContent = CAPS[a].label;
      svg.appendChild(label);
    }

    // Data polygons for each selected tool
    selectedTools().forEach(function (t) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var val = t.ratings[CAPS[i].key] || 0;
        var p = point(i, (maxR * val) / 5);
        pts.push(p.x + "," + p.y);
      }
      svg.appendChild(
        svgEl("polygon", {
          points: pts.join(" "),
          class: "radar-shape",
          fill: t.color,
          stroke: t.color,
        })
      );
      // Vertices
      for (var j = 0; j < n; j++) {
        var v = t.ratings[CAPS[j].key] || 0;
        var pp = point(j, (maxR * v) / 5);
        var dot = svgEl("circle", {
          cx: pp.x,
          cy: pp.y,
          r: 3.5,
          fill: t.color,
          class: "radar-vertex",
        });
        (function (toolName, capLabel, value) {
          dot.addEventListener("mousemove", function (e) {
            showTooltip(toolName + " · " + capLabel + ": " + value + "/5", e.clientX, e.clientY);
          });
          dot.addEventListener("mouseleave", hideTooltip);
        })(t.name, CAPS[j].label, v);
        svg.appendChild(dot);
      }
    });

    renderRadarLegend();
  }

  function renderRadarLegend() {
    var legend = document.getElementById("radar-legend");
    legend.innerHTML = "";
    var tools = selectedTools();
    if (!tools.length) {
      legend.appendChild(el("p", { class: "empty", text: "Select at least one tool to compare." }));
      return;
    }
    tools.forEach(function (t) {
      var item = el("div", { class: "legend-item" });
      var sw = el("span", { class: "legend-swatch" });
      sw.style.background = t.color;
      item.appendChild(sw);
      item.appendChild(el("span", { class: "legend-name", text: t.name }));
      item.appendChild(el("span", { class: "legend-avg", text: avgScore(t).toFixed(1) + " avg" }));
      legend.appendChild(item);
    });
  }

  // ---- Scorecard table ---------------------------------------------------
  function renderTable() {
    var table = document.getElementById("score-table");
    var thead = table.querySelector("thead");
    var tbody = table.querySelector("tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    var headRow = el("tr");
    var nameTh = el("th", { class: "th-name sortable", "data-key": "name", text: "Tool" });
    headRow.appendChild(nameTh);

    CAPS.forEach(function (c) {
      var th = el("th", { class: "sortable", "data-key": c.key, title: c.desc });
      th.appendChild(el("span", { text: c.label }));
      headRow.appendChild(th);
      th.addEventListener("mousemove", function (e) {
        showTooltip(c.desc, e.clientX, e.clientY);
      });
      th.addEventListener("mouseleave", hideTooltip);
    });
    var avgTh = el("th", { class: "sortable", "data-key": "avg", text: "Avg" });
    headRow.appendChild(avgTh);
    thead.appendChild(headRow);

    // Sort indicators + click handlers
    headRow.querySelectorAll(".sortable").forEach(function (th) {
      var key = th.getAttribute("data-key");
      if (key === sortKey) {
        th.classList.add("sorted");
        th.appendChild(el("span", { class: "sort-arrow", text: sortDir === -1 ? " ▼" : " ▲" }));
      }
      th.addEventListener("click", function () {
        if (sortKey === key) sortDir *= -1;
        else {
          sortKey = key;
          sortDir = key === "name" ? 1 : -1;
        }
        renderTable();
      });
    });

    // Filter + sort rows
    var rows = TOOLS.filter(function (t) {
      var hay = (t.name + " " + t.vendor + " " + t.type).toLowerCase();
      return hay.indexOf(searchTerm.toLowerCase()) !== -1;
    });
    rows.sort(function (a, b) {
      var av, bv;
      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      }
      if (sortKey === "avg") {
        av = avgScore(a);
        bv = avgScore(b);
      } else {
        av = a.ratings[sortKey] || 0;
        bv = b.ratings[sortKey] || 0;
      }
      return (av - bv) * sortDir;
    });

    if (!rows.length) {
      var tr = el("tr");
      tr.appendChild(el("td", { class: "no-results", colspan: CAPS.length + 2, text: "No tools match your filter." }));
      tbody.appendChild(tr);
      return;
    }

    rows.forEach(function (t) {
      var tr = el("tr");
      if (highlightDevin && t.featured) tr.classList.add("row-featured");
      var nameCell = el("td", { class: "td-name" });
      var dot = el("span", { class: "td-dot" });
      dot.style.background = t.color;
      nameCell.appendChild(dot);
      var nameWrap = el("span", { class: "td-name-wrap" });
      var link = el("a", { class: "td-link", href: t.url, target: "_blank", rel: "noopener", text: t.name });
      nameWrap.appendChild(link);
      nameWrap.appendChild(el("span", { class: "td-vendor", text: t.vendor }));
      nameCell.appendChild(nameWrap);
      tr.appendChild(nameCell);

      CAPS.forEach(function (c) {
        var v = t.ratings[c.key] || 0;
        var td = el("td", { class: "td-score" });
        var cell = el("span", { class: "score-pill score-" + v, text: String(v) });
        td.appendChild(cell);
        tr.appendChild(td);
      });

      var avgTd = el("td", { class: "td-score td-avg", text: avgScore(t).toFixed(1) });
      tr.appendChild(avgTd);
      tbody.appendChild(tr);
    });
  }

  // ---- Capability spotlight ---------------------------------------------
  function populateCapabilitySelect() {
    var sel = document.getElementById("capability-select");
    sel.innerHTML = "";
    CAPS.forEach(function (c) {
      var opt = el("option", { value: c.key, text: c.label });
      sel.appendChild(opt);
    });
    sel.value = "autonomy";
    sel.addEventListener("change", renderSpotlight);
  }

  function renderSpotlight() {
    var sel = document.getElementById("capability-select");
    var key = sel.value;
    var cap = capByKey(key);
    document.getElementById("capability-desc").textContent = cap ? cap.desc : "";

    var box = document.getElementById("spotlight-bars");
    box.innerHTML = "";
    var ranked = TOOLS.slice().sort(function (a, b) {
      return (b.ratings[key] || 0) - (a.ratings[key] || 0);
    });
    ranked.forEach(function (t) {
      var v = t.ratings[key] || 0;
      var row = el("div", { class: "bar-row" + (t.featured ? " bar-featured" : "") });
      row.appendChild(el("span", { class: "bar-name", text: t.name }));
      var track = el("div", { class: "bar-track" });
      var fill = el("div", { class: "bar-fill" });
      fill.style.background = t.color;
      fill.style.width = "0%";
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("span", { class: "bar-value", text: v + "/5" }));
      box.appendChild(row);
      // Animate on next frame
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fill.style.width = (v / 5) * 100 + "%";
        });
      });
    });
  }

  // ---- Tool deep-dive cards ---------------------------------------------
  function renderDeepDive() {
    var box = document.getElementById("deep-dive-cards");
    if (!box) return;
    box.innerHTML = "";
    // Show strongest tools first by average score.
    var ordered = TOOLS.slice().sort(function (a, b) {
      return avgScore(b) - avgScore(a);
    });
    ordered.forEach(function (t) {
      var card = el("div", { class: "dd-card" + (t.featured ? " dd-featured" : "") });
      card.style.setProperty("--card-color", t.color);

      var head = el("div", { class: "dd-head" });
      var dot = el("span", { class: "dd-dot" });
      dot.style.background = t.color;
      head.appendChild(dot);
      var titleWrap = el("div", { class: "dd-titles" });
      titleWrap.appendChild(el("span", { class: "dd-name", text: t.name }));
      titleWrap.appendChild(el("span", { class: "dd-vendor", text: t.vendor + " · " + t.type }));
      head.appendChild(titleWrap);
      head.appendChild(el("span", { class: "dd-avg", text: avgScore(t).toFixed(1) }));
      card.appendChild(head);

      card.appendChild(el("p", { class: "dd-tagline", text: t.tagline }));
      if (t.notes) card.appendChild(el("p", { class: "dd-notes", text: t.notes }));

      var meta = el("div", { class: "dd-meta" });
      meta.appendChild(el("span", { class: "dd-pricing", text: "💳 " + t.pricing }));
      card.appendChild(meta);

      if (t.sources && t.sources.length) {
        var src = el("div", { class: "dd-sources" });
        src.appendChild(el("span", { class: "dd-sources-label", text: "Sources:" }));
        t.sources.forEach(function (s) {
          src.appendChild(
            el("a", { class: "dd-source", href: s.url, target: "_blank", rel: "noopener", text: s.label })
          );
        });
        card.appendChild(src);
      }
      box.appendChild(card);
    });
  }

  // ---- Theme -------------------------------------------------------------
  function initTheme() {
    var toggle = document.getElementById("theme-toggle");
    var icon = toggle.querySelector(".theme-icon");
    var stored = localStorage.getItem("theme");
    function apply(dark) {
      if (dark) {
        document.documentElement.setAttribute("data-theme", "dark");
        icon.textContent = "☀️";
      } else {
        document.documentElement.removeAttribute("data-theme");
        icon.textContent = "🌙";
      }
    }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    apply(stored ? stored === "dark" : prefersDark);
    toggle.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      apply(!isDark);
      localStorage.setItem("theme", !isDark ? "dark" : "light");
    });
  }

  // ---- Wire up -----------------------------------------------------------
  function renderAll() {
    renderToggles();
    renderRadar();
    renderTable();
  }

  function init() {
    initTheme();
    document.getElementById("year").textContent = new Date().getFullYear();

    document.getElementById("table-search").addEventListener("input", function (e) {
      searchTerm = e.target.value;
      renderTable();
    });
    document.getElementById("highlight-devin").addEventListener("change", function (e) {
      highlightDevin = e.target.checked;
      renderTable();
    });

    populateCapabilitySelect();
    renderAll();
    renderSpotlight();
    renderDeepDive();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
