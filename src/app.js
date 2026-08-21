import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { getProgress, toggleCarteMaitrisee } from "./db.js";

const h = React.createElement;
const { useState, useEffect, useRef, useCallback } = React;

// ---------- Icônes SVG (remplacent les emojis) ----------

function Icon(name, size) {
  const common = {
    width: size || 18,
    height: size || 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    resume: [
      h("path", { key: 1, d: "M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" }),
      h("path", { key: 2, d: "M14 3v5h5" }),
      h("line", { key: 3, x1: 8, y1: 13, x2: 16, y2: 13 }),
      h("line", { key: 4, x1: 8, y1: 17, x2: 13, y2: 17 }),
    ],
    flashcards: [
      h("rect", { key: 1, x: 3, y: 7, width: 14, height: 14, rx: 2 }),
      h("rect", { key: 2, x: 7, y: 3, width: 14, height: 14, rx: 2 }),
    ],
    audio: [
      h("path", { key: 1, d: "M4 9v6h4l5 4V5L8 9H4z" }),
      h("path", { key: 2, d: "M16 8.5a5 5 0 0 1 0 7" }),
      h("path", { key: 3, d: "M18.5 6a9 9 0 0 1 0 12" }),
    ],
    pdf: [
      h("path", { key: 1, d: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" }),
      h("circle", { key: 2, cx: 12, cy: 12, r: 3 }),
    ],
    play: [h("path", { key: 1, d: "M7 4l13 8-13 8V4z", fill: "currentColor", stroke: "none" })],
    pause: [
      h("rect", { key: 1, x: 6, y: 4, width: 4, height: 16, fill: "currentColor", stroke: "none" }),
      h("rect", { key: 2, x: 14, y: 4, width: 4, height: 16, fill: "currentColor", stroke: "none" }),
    ],
    stop: [h("rect", { key: 1, x: 5, y: 5, width: 14, height: 14, rx: 2, fill: "currentColor", stroke: "none" })],
    check: [h("polyline", { key: 1, points: "20 6 9 17 4 12" })],
    target: [
      h("circle", { key: 1, cx: 12, cy: 12, r: 8 }),
      h("circle", { key: 2, cx: 12, cy: 12, r: 4.5 }),
      h("circle", { key: 3, cx: 12, cy: 12, r: 1, fill: "currentColor" }),
    ],
    lightbulb: [
      h("path", { key: 1, d: "M9 18h6" }),
      h("path", { key: 2, d: "M10 22h4" }),
      h("path", { key: 3, d: "M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" }),
    ],
    menu: [
      h("line", { key: 1, x1: 4, y1: 6, x2: 20, y2: 6 }),
      h("line", { key: 2, x1: 4, y1: 12, x2: 20, y2: 12 }),
      h("line", { key: 3, x1: 4, y1: 18, x2: 20, y2: 18 }),
    ],
    chevronLeft: [h("polyline", { key: 1, points: "15 18 9 12 15 6" })],
    chevronRight: [h("polyline", { key: 1, points: "9 18 15 12 9 6" })],
    minus: [h("line", { key: 1, x1: 5, y1: 12, x2: 19, y2: 12 })],
    plus: [
      h("line", { key: 1, x1: 12, y1: 5, x2: 12, y2: 19 }),
      h("line", { key: 2, x1: 5, y1: 12, x2: 19, y2: 12 }),
    ],
    wifi: [
      h("path", { key: 1, d: "M5 12.5a10 10 0 0 1 14 0" }),
      h("path", { key: 2, d: "M8.5 16a5 5 0 0 1 7 0" }),
      h("circle", { key: 3, cx: 12, cy: 19.5, r: 1, fill: "currentColor", stroke: "none" }),
    ],
    wifiOff: [
      h("path", { key: 1, d: "M5 12.5a10 10 0 0 1 3.5-2.3" }),
      h("path", { key: 2, d: "M15.5 10.2a10 10 0 0 1 3.5 2.3" }),
      h("path", { key: 3, d: "M8.5 16a5 5 0 0 1 7 0" }),
      h("circle", { key: 4, cx: 12, cy: 19.5, r: 1, fill: "currentColor", stroke: "none" }),
      h("line", { key: 5, x1: 3, y1: 3, x2: 21, y2: 21 }),
    ],
  };
  return h("svg", common, ...(paths[name] || []));
}

// ---------- Utilitaires ----------

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Échec de chargement: ${url}`);
  return res.json();
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

// ---------- Vue Résumé ----------

function ResumeView({ resume }) {
  if (!resume) return h("div", { className: "empty" }, "Résumé indisponible.");
  return h(
    "div",
    null,
    resume.sections.map((s, i) =>
      h(
        "div",
        { className: "section-card", key: i },
        h("h3", null, s.titre),
        h("p", null, s.contenu),
        s.points_cles &&
          h(
            "ul",
            null,
            s.points_cles.map((p, j) => h("li", { key: j }, p))
          )
      )
    ),
    resume.essentiel &&
      h(
        "div",
        { className: "essentiel-box" },
        h("h3", null, Icon("target", 18), "L'essentiel"),
        h("p", null, resume.essentiel)
      )
  );
}

// ---------- Vue Flashcards ----------

function FlashcardsView({ cards, coursId }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [maitrisees, setMaitrisees] = useState([]);

  useEffect(() => {
    getProgress(coursId).then((p) => setMaitrisees(p.cartesMaitrisees || []));
  }, [coursId]);

  if (!cards || cards.length === 0)
    return h("div", { className: "empty" }, "Aucune flashcard disponible.");

  const carte = cards[index];
  const estMaitrisee = maitrisees.includes(carte.id);

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };
  const toggleMaitrisee = async () => {
    const updated = await toggleCarteMaitrisee(coursId, carte.id);
    setMaitrisees(updated.cartesMaitrisees);
  };

  return h(
    "div",
    { className: "flashcards-wrap" },
    h(
      "div",
      { className: "flashcard-counter" },
      `Carte ${index + 1} / ${cards.length}`
    ),
    h(
      "div",
      {
        className: `flashcard ${flipped ? "reponse" : ""}`,
        onClick: () => setFlipped((f) => !f),
      },
      h("span", { className: "badge" }, flipped ? "Réponse" : "Question"),
      h("span", null, flipped ? carte.reponse : carte.question)
    ),
    h(
      "div",
      { className: "flashcard-nav" },
      h("button", { onClick: prev }, Icon("chevronLeft", 16), "Précédent"),
      h(
        "button",
        {
          onClick: toggleMaitrisee,
          className: estMaitrisee ? "maitrisee" : "",
        },
        estMaitrisee ? Icon("check", 16) : null,
        estMaitrisee ? "Maîtrisée" : "Marquer comme maîtrisée"
      ),
      h("button", { onClick: next }, "Suivant", Icon("chevronRight", 16))
    )
  );
}

// ---------- Vue Audio (Web Speech API) ----------

function buildAudioScript(resume) {
  if (!resume) return "";
  let texte = resume.titre + ". ";
  for (const s of resume.sections) {
    texte += s.titre + ". " + s.contenu + " ";
  }
  if (resume.essentiel) texte += "En résumé. " + resume.essentiel;
  return texte;
}

function AudioView({ resume }) {
  const [enLecture, setEnLecture] = useState(false);
  const [enPause, setEnPause] = useState(false);
  const [supporte, setSupporte] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) setSupporte(false);
    return () => window.speechSynthesis && window.speechSynthesis.cancel();
  }, []);

  const texte = buildAudioScript(resume);

  const lire = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR";
    u.rate = 1;
    u.onend = () => {
      setEnLecture(false);
      setEnPause(false);
    };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setEnLecture(true);
    setEnPause(false);
  };

  const pauser = () => {
    window.speechSynthesis.pause();
    setEnPause(true);
  };
  const reprendre = () => {
    window.speechSynthesis.resume();
    setEnPause(false);
  };
  const stopper = () => {
    window.speechSynthesis.cancel();
    setEnLecture(false);
    setEnPause(false);
  };

  if (!supporte)
    return h(
      "div",
      { className: "empty" },
      "La synthèse vocale n'est pas disponible sur ce navigateur."
    );

  return h(
    "div",
    null,
    h(
      "div",
      { className: "audio-controls" },
      !enLecture &&
        h("button", { className: "btn", onClick: lire }, Icon("play", 16), "Lire le résumé"),
      enLecture &&
        !enPause &&
        h(
          "button",
          { className: "btn secondary", onClick: pauser },
          Icon("pause", 16),
          "Pause"
        ),
      enLecture &&
        enPause &&
        h(
          "button",
          { className: "btn secondary", onClick: reprendre },
          Icon("play", 16),
          "Reprendre"
        ),
      enLecture &&
        h("button", { className: "btn secondary", onClick: stopper }, Icon("stop", 16), "Stop")
    ),
    h(
      "div",
      { className: "audio-text" },
      h(
        "div",
        { className: "note" },
        Icon("audio", 16),
        h(
          "span",
          null,
          "Cette lecture utilise la voix de synthèse de votre appareil (Web Speech API) — fonctionne hors ligne, sans fichier audio à télécharger."
        )
      ),
      texte
    )
  );
}

// ---------- Vue PDF (PDF.js avec repli en iframe) ----------

function PdfView({ url }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [zoomManuel, setZoomManuel] = useState(1);
  const [pourcentageAffiche, setPourcentageAffiche] = useState(100);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const zoomRef = useRef(zoomManuel);
  useEffect(() => {
    zoomRef.current = zoomManuel;
  }, [zoomManuel]);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    setErreur(false);
    setPdfDoc(null);
    setPage(1);
    setZoomManuel(1);

    import("https://esm.sh/pdfjs-dist@4.6.82")
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://esm.sh/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
        return pdfjsLib.getDocument(url).promise;
      })
      .then((doc) => {
        if (annule) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setChargement(false);
      })
      .catch((err) => {
        console.error("PDF.js indisponible, repli en visionneuse native:", err);
        if (!annule) {
          setErreur(true);
          setChargement(false);
        }
      });

    return () => {
      annule = true;
    };
  }, [url]);

  // Rendu de la page : échelle = (ajustement à la largeur) x (zoom manuel)
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let annule = false;
    pdfDoc.getPage(page).then((pageObj) => {
      if (annule) return;

      const largeurDispo = wrapRef.current
        ? wrapRef.current.clientWidth - 24
        : 600;
      const viewportNaturel = pageObj.getViewport({ scale: 1 });
      const echelleAjustement = Math.min(
        largeurDispo / viewportNaturel.width,
        2.5
      );
      const echelleFinale = echelleAjustement * zoomManuel;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const viewport = pageObj.getViewport({
        scale: echelleFinale * devicePixelRatio,
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / devicePixelRatio}px`;
      canvas.style.height = `${viewport.height / devicePixelRatio}px`;
      pageObj.render({ canvasContext: ctx, viewport });

      setPourcentageAffiche(Math.round(echelleFinale * 100));
    });
    return () => {
      annule = true;
    };
  }, [pdfDoc, page, zoomManuel]);

  // Pincement tactile (mobile) + Ctrl/Cmd + molette (PC)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let pinchStartDist = null;
    let pinchStartZoom = 1;

    const distance = (touches) => {
      const [a, b] = touches;
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchStartDist = distance(e.touches);
        pinchStartZoom = zoomRef.current;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartDist) {
        e.preventDefault();
        const ratio = distance(e.touches) / pinchStartDist;
        setZoomManuel(
          Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchStartZoom * ratio))
        );
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchStartDist = null;
    };
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomManuel((z) =>
          Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.001))
        );
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [pdfDoc]);

  if (chargement) return h("div", { className: "loading" }, "Chargement du PDF…");

  if (erreur) {
    return h(
      "div",
      null,
      h(
        "p",
        { className: "empty" },
        "Visionneuse avancée indisponible, affichage natif du navigateur :"
      ),
      h("iframe", {
        src: url,
        style: { width: "100%", height: "75vh", border: "none", borderRadius: "8px" },
      })
    );
  }

  const zoomIn = () =>
    setZoomManuel((z) => Math.min(ZOOM_MAX, +(z + 0.25).toFixed(2)));
  const zoomOut = () =>
    setZoomManuel((z) => Math.max(ZOOM_MIN, +(z - 0.25).toFixed(2)));
  const zoomReset = () => setZoomManuel(1);

  return h(
    "div",
    null,
    h(
      "div",
      { className: "pdf-toolbar" },
      h(
        "button",
        {
          className: "btn secondary",
          disabled: page <= 1,
          onClick: () => setPage((p) => p - 1),
        },
        Icon("chevronLeft", 16),
        "Précédente"
      ),
      h("span", { className: "page-count" }, `Page ${page} / ${numPages}`),
      h(
        "button",
        {
          className: "btn secondary",
          disabled: page >= numPages,
          onClick: () => setPage((p) => p + 1),
        },
        "Suivante",
        Icon("chevronRight", 16)
      ),
      h(
        "div",
        { className: "zoom-controls" },
        h("button", { onClick: zoomOut, title: "Zoom arrière" }, Icon("minus", 16)),
        h(
          "span",
          {
            className: "zoom-level",
            onClick: zoomReset,
            title: "Cliquer pour réinitialiser",
          },
          `${pourcentageAffiche}%`
        ),
        h("button", { onClick: zoomIn, title: "Zoom avant" }, Icon("plus", 16))
      )
    ),
    h(
      "div",
      { className: "pdf-canvas-wrap", ref: wrapRef },
      h("canvas", { ref: canvasRef })
    ),
    h(
      "p",
      { className: "tip" },
      Icon("lightbulb", 14),
      h(
        "span",
        null,
        "Astuce : pince à deux doigts sur mobile, ou Ctrl/Cmd + molette sur PC, pour zoomer."
      )
    )
  );
}

// ---------- Vue Cours (onglets) ----------

const ONGLETS = [
  { id: "resume", label: "Résumé", icon: "resume" },
  { id: "flashcards", label: "Flashcards", icon: "flashcards" },
  { id: "audio", label: "Audio", icon: "audio" },
  { id: "pdf", label: "PDF source", icon: "pdf" },
];

function CourseView({ cours }) {
  const [onglet, setOnglet] = useState("resume");
  const [resume, setResume] = useState(null);
  const [flashcards, setFlashcards] = useState(null);

  useEffect(() => {
    setOnglet("resume");
    fetchJSON(`${cours.chemin}/resume.json`).then(setResume).catch(console.error);
    fetchJSON(`${cours.chemin}/flashcards.json`)
      .then(setFlashcards)
      .catch(console.error);
  }, [cours]);

  return h(
    "div",
    { className: "main" },
    h("h2", null, cours.titre),
    h(
      "div",
      { className: "tabs" },
      ONGLETS.map((o) =>
        h(
          "button",
          {
            key: o.id,
            className: `tab ${onglet === o.id ? "active" : ""}`,
            onClick: () => setOnglet(o.id),
          },
          Icon(o.icon, 16),
          o.label
        )
      )
    ),
    onglet === "resume" && h(ResumeView, { resume }),
    onglet === "flashcards" &&
      h(FlashcardsView, { cards: flashcards, coursId: cours.id }),
    onglet === "audio" && h(AudioView, { resume }),
    onglet === "pdf" && h(PdfView, { url: `${cours.chemin}/source.pdf` })
  );
}

// ---------- Navigation hiérarchique (Groupe → Module → Sous-module → Cours) ----------

// Parcourt l'index à 4 niveaux et retourne le premier cours disponible
// (ou, à défaut, le tout premier cours trouvé) ainsi que le chemin
// (groupeId/moduleId/sousmoduleId) qui mène jusqu'à lui.
function trouverCoursInitial(index) {
  let premierTrouve = null;
  let premierTrouveChemin = null;
  for (const groupe of index.groupes || []) {
    for (const module of groupe.modules || []) {
      for (const sousmodule of module.sousmodules || []) {
        for (const cours of sousmodule.cours || []) {
          const chemin = `${groupe.id}/${module.id}/${sousmodule.id}`;
          if (!premierTrouve) {
            premierTrouve = cours;
            premierTrouveChemin = chemin;
          }
          if (cours.disponible !== false) {
            return { cours, chemin };
          }
        }
      }
    }
  }
  return premierTrouve ? { cours: premierTrouve, chemin: premierTrouveChemin } : null;
}

// ---------- App racine ----------

function App() {
  const [index, setIndex] = useState(null);
  const [coursSelectionne, setCoursSelectionne] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  // Sections dépliées de la sidebar : ensembles d'ids "groupeId", "groupeId/moduleId",
  // "groupeId/moduleId/sousmoduleId"
  const [ouverts, setOuverts] = useState(new Set());
  const online = useOnlineStatus();

  useEffect(() => {
    fetchJSON("./data/index.json").then((data) => {
      setIndex(data);
      const initial = trouverCoursInitial(data);
      if (initial) {
        setCoursSelectionne(initial.cours);
        const [gId, mId, smId] = initial.chemin.split("/");
        setOuverts(
          new Set([gId, `${gId}/${mId}`, `${gId}/${mId}/${smId}`])
        );
      }
    });
  }, []);

  if (!index) return h("div", { className: "loading" }, "Chargement…");

  const choisirCours = (cours) => {
    if (cours.disponible === false) return;
    setCoursSelectionne(cours);
    setMenuOuvert(false);
  };

  const toggleOuvert = (id) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return h(
    "div",
    { className: "app" },
    h(
      "button",
      {
        className: "menu-toggle",
        onClick: () => setMenuOuvert((v) => !v),
      },
      Icon("menu", 18),
      "Cours"
    ),
    h("div", {
      className: `sidebar-overlay ${menuOuvert ? "open" : ""}`,
      onClick: () => setMenuOuvert(false),
    }),
    h(
      "div",
      { className: `sidebar ${menuOuvert ? "open" : ""}` },
      h(
        "h1",
        null,
        "Révision",
        h(
          "span",
          { className: `offline-badge ${online ? "online" : ""}` },
          Icon(online ? "wifi" : "wifiOff", 13),
          online ? "En ligne" : "Hors ligne"
        )
      ),
      index.groupes.map((groupe) => {
        const groupeOuvert = ouverts.has(groupe.id);
        return h(
          "div",
          { className: "groupe", key: groupe.id },
          h(
            "div",
            {
              className: "groupe-nom",
              onClick: () => toggleOuvert(groupe.id),
            },
            Icon(groupeOuvert ? "minus" : "plus", 13),
            groupe.nom
          ),
          groupeOuvert &&
            groupe.modules.map((module) => {
              const moduleKey = `${groupe.id}/${module.id}`;
              const moduleOuvert = ouverts.has(moduleKey);
              return h(
                "div",
                { key: module.id, className: "module" },
                h(
                  "div",
                  {
                    className: "module-nom",
                    onClick: () => toggleOuvert(moduleKey),
                  },
                  Icon(moduleOuvert ? "minus" : "plus", 12),
                  module.nom
                ),
                moduleOuvert &&
                  module.sousmodules.map((sousmodule) => {
                    const sousmoduleKey = `${moduleKey}/${sousmodule.id}`;
                    const sousmoduleOuvert = ouverts.has(sousmoduleKey);
                    return h(
                      "div",
                      { key: sousmodule.id, className: "sousmodule" },
                      h(
                        "div",
                        {
                          className: "sousmodule-nom",
                          onClick: () => toggleOuvert(sousmoduleKey),
                        },
                        Icon(sousmoduleOuvert ? "minus" : "plus", 11),
                        sousmodule.nom
                      ),
                      sousmoduleOuvert &&
                        sousmodule.cours.map((cours) =>
                          h(
                            "div",
                            {
                              key: cours.id,
                              className: `cours-item ${
                                coursSelectionne?.id === cours.id ? "active" : ""
                              } ${cours.disponible === false ? "indisponible" : ""}`,
                              onClick: () => choisirCours(cours),
                            },
                            cours.titre,
                            cours.disponible === false &&
                              h("span", { className: "badge-bientot" }, "Bientôt")
                          )
                        )
                    );
                  })
              );
            })
        );
      })
    ),
    coursSelectionne
      ? h(CourseView, { cours: coursSelectionne, key: coursSelectionne.id })
      : h("div", { className: "main empty" }, "Sélectionne un cours.")
  );
}

const root = createRoot(document.getElementById("root"));
root.render(h(App));
