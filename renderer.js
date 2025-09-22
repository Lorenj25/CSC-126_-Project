const backendUrl = "http://127.0.0.1:8000";
const fileInput = document.getElementById("fileInput");
const operation = document.getElementById("operation");
const paramInput = document.getElementById("paramInput");
const processBtn = document.getElementById("processBtn");
const pdfBtn = document.getElementById("pdfBtn");
const gallery = document.getElementById("gallery");
const status = document.getElementById("status");

function setStatus(msg) {
  status.innerText = msg;
}

processBtn.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (files.length === 0) {
    alert("Choose one or more images first.");
    return;
  }
  const op = operation.value;
  if (!op || op === "none") {
    alert("Choose an operation.");
    return;
  }
  let params = null;
  try {
    params = paramInput.value ? JSON.parse(paramInput.value) : null;
  } catch (e) {
    alert("Invalid JSON in params.");
    return;
  }

  setStatus("Processing...")
  if (files.length === 1) {
    const form = new FormData();
    form.append("image", files[0]);
    form.append("operation", op);
    form.append("params", JSON.stringify(params || {}));
    const res = await fetch(`${backendUrl}/process`, { method: "POST", body: form });
    const data = await res.json();
    if (data.success) {
      addCard(files[0].name, URL.createObjectURL(files[0]), data.image_base64);
    } else {
      alert("Processing failed");
    }
    //sadadsadas
  } else {
    const form = new FormData();
    files.forEach(f => form.append("images", f));
    form.append("operation", op);
    form.append("params", JSON.stringify(params || {}));
    const res = await fetch(`${backendUrl}/batch`, { method: "POST", body: form });
    const data = await res.json();
    if (data.success) {
      // Clear gallery then append each
      data.results.forEach((r, idx) => {
        const originalURL = URL.createObjectURL(files[idx]);
        addCard(files[idx].name, originalURL, r.image_base64);
      });
    } else {
      alert("Batch processing failed");
    }
  }
  setStatus("");
});

pdfBtn.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (files.length === 0) { alert("Select images to create PDF"); return; }
  const form = new FormData();
  files.forEach(f => form.append("images", f));
  await fetch(`${backendUrl}/export_pdf`, { method: "POST", body: form })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert("Failed to generate PDF");
    });
});

function addCard(title, originalURL, processedDataUrl) {
  const div = document.createElement("div");
  div.className = "card";
  const nameEl = document.createElement("div");
  nameEl.innerText = title;
  const preview = document.createElement("div");
  preview.className = "preview";
  const imgOrig = document.createElement("img");
  imgOrig.src = originalURL;
  imgOrig.alt = "original";
  const imgProc = document.createElement("img");
  imgProc.src = processedDataUrl;
  imgProc.alt = "processed";
  preview.appendChild(imgOrig);
  preview.appendChild(imgProc);

  const btnDownload = document.createElement("button");
  btnDownload.innerText = "Download processed";
  btnDownload.addEventListener("click", () => {
    downloadDataUrl(processedDataUrl, title.replace(/\.[^/.]+$/, "") + "-processed.png");
  });

  div.appendChild(nameEl);
  div.appendChild(preview);
  div.appendChild(btnDownload);
  gallery.prepend(div);
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
