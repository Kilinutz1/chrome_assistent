const listeElement = document.getElementById('dateiListe');

// Diese Funktion leert die Liste im HTML und baut sie neu auf
function updateListe() {
    chrome.storage.local.get(null, (alleDaten) => {
        listeElement.innerHTML = ""; // Erstmal alles löschen

        Object.keys(alleDaten).forEach((name) => {
            // Wir erstellen ein Listen-Element (li)
            const li = document.createElement('li');
            li.style.marginBottom = "5px";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.background = "#eee";
            li.style.padding = "5px";

            // Text-Bereich für den Namen
            const span = document.createElement('span');
            span.innerText = name;

            // Der Lösch-Button (Das "X")
            const loeschBtn = document.createElement('button');
            loeschBtn.innerText = "X";
            loeschBtn.style.marginLeft = "10px";
            loeschBtn.style.cursor = "pointer";
            loeschBtn.style.color = "red";

            // Event-Listener zum Löschen
            loeschBtn.addEventListener('click', () => {
                chrome.storage.local.remove(name, () => {
                    updateListe(); // Liste nach dem Löschen neu zeichnen
                });
            });

            // Alles zusammenfügen
            li.appendChild(span);
            li.appendChild(loeschBtn);
            listeElement.appendChild(li);
        });
    });
}




updateListe();

document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const inhalt = e.target.result;
    console.log("Datei-Inhalt geladen:", inhalt);
    // Hier könntest du den Inhalt jetzt an Gemini schicken
    chrome.storage.local.set({ [file.name]: inhalt }, () => {
  if (chrome.runtime.lastError) {
    console.error("Speicherfehler:", chrome.runtime.lastError.message);
    alert("Fehler: Speicher voll oder Limit erreicht!");
  } else {
    updateListe();
    console.log("Erfolgreich gespeichert!");
  }
});
  };

  reader.readAsText(file); // Liest die Datei als Text ein
});