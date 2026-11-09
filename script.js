const TOTAL_PAGES = 30;
const TEMPLATE = "plantilla.png";
const book = document.getElementById("book");
const select = document.getElementById("pageSelect");
const status = document.getElementById("status");
let current = 0;

function addOption(value, label) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  select.appendChild(option);
}

function createCover() {
  const p = document.createElement("section");
  p.className = "page cover active";
  p.dataset.page = "0";
  p.innerHTML = `
    <div class="cover-topline" contenteditable="true">Institución educativa</div>
    <div class="cover-flourish">❧ ✧ ❦ ✧ ❧</div>
    <img class="cover-emblem" alt="Escudo institucional" src="escudo.png">
    <div class="cover-kicker" contenteditable="true">Presenta</div>
    <h1 class="cover-title" contenteditable="true">Anuario escolar<br>Eugenio Ferro Falla</h1>
    <div class="cover-rule"></div>
    <p class="cover-course" contenteditable="true">Curso 11-01</p>
    <p class="cover-year" contenteditable="true">PROMOCIÓN · 2026</p>
    <div class="cover-flourish">❧ ✧ ❦ ✧ ❧</div>
    <div class="cover-motto" contenteditable="true">Ciencia · Virtud · Futuro</div>`;
  book.appendChild(p);
  addOption(0, "Portada");
}

function makeImageUpload(input, onImage) {
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { onImage(reader.result); markChanged(); };
    reader.readAsDataURL(file);
    input.value = "";
  });
}

function makePhotoTools(photo, frame, upload) {
  const tools = document.createElement("div");
  tools.className = "photo-tools";
  tools.innerHTML = `
    <button type="button" class="photo-replace">Cambiar foto</button>
    <button type="button" class="photo-remove">Borrar foto</button>
    <label>Zoom <input class="photo-zoom" type="range" min="50" max="500" step="5" value="100"></label>
    <label>Horizontal <input class="photo-x" type="range" min="-100" max="100" step="1" value="0"></label>
    <label>Vertical <input class="photo-y" type="range" min="-100" max="100" step="1" value="0"></label>
    <button type="button" class="photo-reset">Centrar imagen</button>
    <small>También puedes arrastrar la foto directamente dentro del marco.</small>`;
  const zoom = tools.querySelector(".photo-zoom");
  const x = tools.querySelector(".photo-x");
  const y = tools.querySelector(".photo-y");

  function update() {
    photo.style.transform =
      `translate(${x.value}%, ${y.value}%) scale(${Number(zoom.value) / 100})`;
    markChanged();
  }
  [zoom, x, y].forEach(el => el.addEventListener("input", update));

  tools.querySelector(".photo-replace").addEventListener("click", event => {
    event.stopPropagation();
    upload.click();
  });
  tools.querySelector(".photo-reset").addEventListener("click", event => {
    event.stopPropagation();
    zoom.value = 100; x.value = 0; y.value = 0;
    update();
  });
  tools.querySelector(".photo-remove").addEventListener("click", event => {
    event.stopPropagation();
    photo.removeAttribute("src");
    photo.style.transform = "";
    frame.classList.remove("has-photo");
    zoom.value = 100; x.value = 0; y.value = 0;
    upload.value = "";
    markChanged();
  });

  // Arrastrar la imagen con el ratón o con el dedo para cambiar su encuadre.
  let dragging = false;
  let startX = 0, startY = 0, originX = 0, originY = 0;
  function readTransform() {
    return {
      x: Number(x.value) || 0,
      y: Number(y.value) || 0
    };
  }
  photo.addEventListener("pointerdown", event => {
    if (!frame.classList.contains("has-photo")) return;
    dragging = true;
    photo.setPointerCapture(event.pointerId);
    const origin = readTransform();
    startX = event.clientX;
    startY = event.clientY;
    originX = origin.x;
    originY = origin.y;
    event.preventDefault();
  });
  photo.addEventListener("pointermove", event => {
    if (!dragging) return;
    const rect = frame.getBoundingClientRect();
    const dx = ((event.clientX - startX) / rect.width) * 100;
    const dy = ((event.clientY - startY) / rect.height) * 100;
    x.value = String(Math.max(-100, Math.min(100, originX + dx)));
    y.value = String(Math.max(-100, Math.min(100, originY + dy)));
    update();
  });
  function stopDrag() { dragging = false; }
  photo.addEventListener("pointerup", stopDrag);
  photo.addEventListener("pointercancel", stopDrag);
  frame.appendChild(tools);
  return tools;
}

function makeTextBlock(label, left, top, width, height, initialCount) {
  const wrap = document.createElement("div");
  wrap.className = "lines";
  wrap.dataset.label = label;
  Object.assign(wrap.style, {
    left: `${left}%`, top: `${top}%`, width: `${width}%`,
    height: `${height}%`
  });

  const inputs = document.createElement("div");
  inputs.className = "line-inputs";
  wrap.appendChild(inputs);

  const controls = document.createElement("div");
  controls.className = "line-controls";
  controls.innerHTML = `
    <button type="button" class="line-add" title="Añadir una línea">＋</button>
    <button type="button" class="line-remove" title="Quitar la última línea">−</button>`;
  wrap.appendChild(controls);

  function addLine(value = "") {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = label;
    input.setAttribute("aria-label", `${label}`);
    input.value = value;
    inputs.appendChild(input);
    markChanged();
  }
  controls.querySelector(".line-add").addEventListener("click", addLine);
  controls.querySelector(".line-remove").addEventListener("click", () => {
    if (inputs.lastElementChild) {
      inputs.lastElementChild.remove();
      markChanged();
    }
  });
  for (let i = 0; i < initialCount; i++) addLine();
  return wrap;
}

function makeSignatureArea() {
  const area = document.createElement("div");
  area.className = "signature-area";
  area.title = "Haz clic para insertar una imagen o pega una imagen copiada";
  area.setAttribute("aria-label", "Espacio para insertar imagen de firma");
  const hint = document.createElement("span");
  hint.className = "signature-hint";
  hint.textContent = "Pegar o insertar imagen";
  const img = document.createElement("img");
  img.className = "signature-image";
  img.alt = "Imagen de firma";
  area.append(hint, img);

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.className = "signature-file";
  file.setAttribute("aria-label", "Seleccionar imagen para la firma");
  makeImageUpload(file, data => {
    img.src = data;
    area.classList.add("has-image");
  });
  area.appendChild(file);

  area.addEventListener("click", event => {
    if (event.target === file || event.target.closest(".signature-tools")) return;
    file.click();
  });
  area.addEventListener("paste", event => {
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find(item => item.type.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    const blob = imageItem.getAsFile();
    if (!blob) return;
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
      area.classList.add("has-image");
      markChanged();
    };
    reader.readAsDataURL(blob);
  });
  area.tabIndex = 0;

  const tools = document.createElement("div");
  tools.className = "signature-tools";
  tools.innerHTML = `
    <label>Tamaño <input type="range" min="30" max="220" step="5" value="100"></label>
    <button type="button" class="signature-remove">Quitar imagen</button>`;
  tools.querySelector("input").addEventListener("input", event => {
    img.style.width = `${event.target.value}%`;
    img.style.height = `${event.target.value}%`;
    markChanged();
  });
  tools.querySelector("button").addEventListener("click", event => {
    event.stopPropagation();
    img.removeAttribute("src");
    img.style.width = ""; img.style.height = "";
    area.classList.remove("has-image");
    markChanged();
  });
  area.appendChild(tools);
  return area;
}

function createPage(n) {
  const p = document.createElement("section");
  p.className = "page";
  p.dataset.page = String(n);
  p.style.backgroundImage = `url("${TEMPLATE}")`;

  const photoFrame = document.createElement("div");
  photoFrame.className = "photo-frame";
  const photo = document.createElement("img");
  photo.className = "photo";
  photo.alt = "Fotografía de la página";
  photoFrame.appendChild(photo);

  const upload = document.createElement("input");
  upload.className = "upload";
  upload.title = "Seleccionar fotografía";
  upload.setAttribute("aria-label", "Seleccionar fotografía");
  upload.hidden = true;
  makeImageUpload(upload, data => {
    photo.src = data;
    photo.style.transform = "translate(0%, 0%) scale(1)";
    photoFrame.classList.add("has-photo");
    photoFrame.querySelector(".photo-zoom").value = 100;
    photoFrame.querySelector(".photo-x").value = 0;
    photoFrame.querySelector(".photo-y").value = 0;
    markChanged();
  });

  const addPhoto = document.createElement("button");
  addPhoto.type = "button";
  addPhoto.className = "photo-add";
  addPhoto.textContent = "+ Agregar foto";
  addPhoto.setAttribute("aria-label", "Agregar fotografía al cuadro grande");
  addPhoto.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    upload.click();
  });

  // El cuadro completo también permite volver a elegir una fotografía.
  photoFrame.addEventListener("click", event => {
    if (event.target === photoFrame && !photoFrame.classList.contains("has-photo")) {
      upload.click();
    }
  });

  photoFrame.append(upload, addPhoto);
  makePhotoTools(photo, photoFrame, upload);
  p.appendChild(photoFrame);

  p.appendChild(makeTextBlock("Frase favorita", 35.2, 37.1, 22.3, 12.5, 4));
  p.appendChild(makeTextBlock("Recuerdo favorito", 63.2, 37.1, 22.5, 12.5, 4));
  p.appendChild(makeTextBlock("Nombre completo", 9.1, 68.9, 20.2, 7.5, 3));
  p.appendChild(makeTextBlock("Lista de aspiraciones", 38.2, 68.9, 19.5, 7.5, 3));
  p.appendChild(makeTextBlock("Agradecimientos", 64.3, 68.9, 21.2, 7.5, 2));
  p.appendChild(makeSignatureArea());

  const counter = document.createElement("span");
  counter.className = "page-count";
  counter.textContent = `${String(n).padStart(2, "0")} / ${TOTAL_PAGES}`;
  p.appendChild(counter);
  book.appendChild(p);
  addOption(n, `Página ${n}`);
}

function pages() { return [...book.querySelectorAll(".page")]; }

function show(n) {
  current = Math.max(0, Math.min(TOTAL_PAGES, n));
  pages().forEach(p => p.classList.toggle("active", Number(p.dataset.page) === current));
  select.value = String(current);
  status.textContent = current === 0
    ? "Portada · diseño original conservado"
    : `Página ${current} de ${TOTAL_PAGES} · foto ajustable, líneas editables e imagen de firma`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function markChanged() {
  status.textContent = "Hay cambios sin guardar · pulsa «Guardar cambios»";
}

function capture() {
  return pages().map(p => ({
    textBlocks: [...p.querySelectorAll(".lines")].map(block => ({
      values: [...block.querySelectorAll(".line-inputs input")].map(input => input.value)
    })),
    editable: [...p.querySelectorAll("[contenteditable='true']")].map(el => el.innerHTML),
    photo: p.querySelector(".photo")?.getAttribute("src") || "",
    photoTransform: p.querySelector(".photo")?.style.transform || "",
    photoZoom: p.querySelector(".photo-zoom")?.value || "100",
    photoX: p.querySelector(".photo-x")?.value || "0",
    photoY: p.querySelector(".photo-y")?.value || "0",
    signature: p.querySelector(".signature-image")?.getAttribute("src") || "",
    signatureWidth: p.querySelector(".signature-image")?.style.width || "",
    signatureHeight: p.querySelector(".signature-image")?.style.height || ""
  }));
}

function applyState(p, row) {
  if (!row) return;
  const blocks = [...p.querySelectorAll(".lines")];
  blocks.forEach((block, i) => {
    const values = row.textBlocks?.[i]?.values || [];
    const inputBox = block.querySelector(".line-inputs");
    inputBox.innerHTML = "";
    values.forEach(value => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.placeholder = block.dataset.label;
      input.setAttribute("aria-label", block.dataset.label);
      inputBox.appendChild(input);
    });
  });
  [...p.querySelectorAll("[contenteditable='true']")].forEach((el, i) => {
    if (row.editable?.[i] !== undefined) el.innerHTML = row.editable[i];
  });
  const photo = p.querySelector(".photo");
  if (row.photo) {
    photo.src = row.photo;
    photo.style.transform = row.photoTransform || "translate(0%, 0%) scale(1)";
    p.querySelector(".photo-frame")?.classList.add("has-photo");
    p.querySelector(".photo-zoom").value = row.photoZoom || 100;
    p.querySelector(".photo-x").value = row.photoX || 0;
    p.querySelector(".photo-y").value = row.photoY || 0;
  }
  const signature = p.querySelector(".signature-image");
  if (row.signature) {
    signature.src = row.signature;
    signature.style.width = row.signatureWidth || "";
    signature.style.height = row.signatureHeight || "";
    p.querySelector(".signature-area")?.classList.add("has-image");
  }
}

function save() {
  try {
    localStorage.setItem("anuario30_verde_dorado_v2", JSON.stringify(capture()));
    status.textContent = "Cambios guardados en este navegador.";
  } catch {
    status.textContent = "No se pudo guardar todo. Descarga el libro HTML para conservar las imágenes.";
  }
}

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem("anuario30_verde_dorado_v2") || "null");
    if (data) pages().forEach((p, i) => applyState(p, data[i]));
  } catch (error) { console.warn("No se pudieron recuperar los cambios.", error); }
}

createCover();
for (let n = 1; n <= TOTAL_PAGES; n++) createPage(n);

document.getElementById("prev").addEventListener("click", () => show(current - 1));
document.getElementById("next").addEventListener("click", () => show(current + 1));
select.addEventListener("change", () => show(Number(select.value)));
document.getElementById("save").addEventListener("click", save);
document.getElementById("pdf").addEventListener("click", () => window.print());

book.addEventListener("input", event => {
  if (event.target.matches("input:not([type=file]), textarea, [contenteditable=true]")) markChanged();
});

document.getElementById("export").addEventListener("click", () => {
  const state = capture();
  const clone = document.documentElement.cloneNode(true);
  const cloneBook = clone.querySelector("#book");
  cloneBook.querySelectorAll(".page").forEach((p, i) => {
    const row = state[i];
    p.classList.add("active");
    applyState(p, row);
    p.querySelectorAll('input[type="file"], .photo-tools, .line-controls, .signature-tools')
      .forEach(el => el.remove());
    p.querySelectorAll(".line-inputs input").forEach(el => {
      el.setAttribute("value", el.value);
    });
  });
  clone.querySelector(".toolbar")?.remove();
  const blob = new Blob(["<!DOCTYPE html>\n" + clone.outerHTML], {
    type: "text/html;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "anuario-30-plantillas-editado.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
});

loadSaved();
show(0);
