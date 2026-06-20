/* Amp Academy Tutor — client adapter (drop-in). Load AFTER the course's course.js.
 *
 * Turns the offline tutor into a LIVE tutor when a relay endpoint is configured and the
 * device is online. With no endpoint, or offline, or on any error, it falls back to the
 * existing offline notice — so behavior is unchanged until you wire the relay. SAS §2.7:
 * NO api key here; the key lives only on the relay server.
 *
 * Configure (once per course, before this file):
 *   <script>window.AA_TUTOR = { endpoint: "https://amp-academy-tutor.ampacademy.workers.dev/tutor",
 *                                edition: "NEC 2017" };</script>
 *   <script src="js/aa-tutor-relay.js"></script>
 */
(function () {
  "use strict";
  var CFG = window.AA_TUTOR || {};
  var ENDPOINT = CFG.endpoint || "";
  var EDITION  = CFG.edition || "your edition of the NEC";
  var PLACEHOLDER = /<acct>|example\.com|YOUR_/i;
  var configured = !!(ENDPOINT && !PLACEHOLDER.test(ENDPOINT));

  if (typeof window.Tutor !== "object" || !window.Tutor) return;  // only the player-template courses
  var OFFLINE = window.Tutor.offlineNotice ||
    "The live tutor is offline right now — quick suggestions below; ask your instructor for the rest.";
  var history = [];

  function lessonContext() {
    var titleEl = document.querySelector(".lesson-h1") ||
                  document.querySelector(".j-hdr h2") || document.querySelector("h1");
    var title = titleEl ? titleEl.textContent.trim() : (document.title || "");
    var main = document.querySelector(".lesson-wrap") || document.querySelector(".main") ||
               document.querySelector("#scroll") || document.querySelector("main");
    var ctx = main ? main.textContent.replace(/\s+/g, " ").trim().slice(0, 3500) : "";
    return { title: title, ctx: ctx };
  }

  function setStatus(state) {
    // The widget header carries a small "offline" label; reflect reality when we can.
    var hdr = document.querySelector(".tutor-header");
    if (!hdr) return;
    var nodes = hdr.querySelectorAll("div");
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i].textContent.trim().toLowerCase();
      if (t === "offline" || t === "online" || t === "connecting…") { nodes[i].textContent = state; break; }
    }
  }

  if (window.Tutor && typeof window.Tutor === "object") {
    window.Tutor.live = configured;
    window.Tutor.ask = function (text) {
      if (!configured || !navigator.onLine) { setStatus("offline"); return Promise.resolve(OFFLINE); }
      setStatus("connecting…");
      var lc = lessonContext();
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, 20000);
      return fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: text, lessonTitle: lc.title,
          lessonId: (window.__AA_LESSON_ID || ""), lessonContext: lc.ctx,
          edition: EDITION, history: history.slice(-6)
        }),
        signal: ctrl.signal
      }).then(function (r) {
        clearTimeout(to);
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.ok && d && d.ok && d.answer) {
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: d.answer });
            setStatus("online");
            return d.answer;
          }
          setStatus("online");
          return (d && d.error) ? d.error : OFFLINE;
        });
      }).catch(function () { clearTimeout(to); setStatus("offline"); return OFFLINE; });
    };
  }

  if (configured) {
    // Defer: the tutor widget is built by initPage() which runs just after this script.
    var applyStatus = function () { setStatus(navigator.onLine ? "online" : "offline"); };
    setTimeout(applyStatus, 0);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyStatus);
    window.addEventListener("online",  function () { setStatus("online"); });
    window.addEventListener("offline", function () { setStatus("offline"); });
  }
})();
