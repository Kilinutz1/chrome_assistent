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



document.getElementById('fillFormBtn').addEventListener('click', async () => {
    // Update the status message so the user knows something is happening
  const status = document.getElementById('statusMeldung');
  status.innerText = "Sende Befehl an die Seite...";

  try {
    // 2. Find the tab that is currently open and active
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      status.innerText = "Fehler: Kein aktiver Tab gefunden.";
      return;
    }

    // 3. Send a message to the 'content.js' running on that tab
    chrome.tabs.sendMessage(tab.id, { action: "FILL_FORM" }, (response) => {
      
      // Check if the message actually arrived
      if (chrome.runtime.lastError) {
        status.innerText = "Fehler: Seite bitte einmal neu laden!";
        console.error(chrome.runtime.lastError.message);
      } else {
        status.innerText = "Erfolg! Felder wurden ausgefüllt.";
      }
    });
  } catch (error) {
    status.innerText = "Ein Fehler ist aufgetreten.";
    console.error(error);
  }
});