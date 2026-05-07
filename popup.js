API = ""


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
    chrome.tabs.sendMessage(tab.id, { action: "FIND_FORM" }, async (response) => {
    
    if (chrome.runtime.lastError) {
        status.innerText = "Fehler: Seite bitte einmal neu laden!";
        console.error(chrome.runtime.lastError.message);
        return;
    }

    // 1. Check if we actually found fields
    if (response && response.fields && response.fields.length > 0) {
        status.innerText = "Formular erkannt. Analysiere Daten...";

        // 2. Get your saved file data from storage
        // We need the 'knowledge' to give to Gemini

        chrome.storage.local.get(null, async (alleDaten) => {
            
            // 3. Prepare the data for Gemini
            // We combine the 'Form Map' and the 'File Content'
            const formMap = response.fields;
           

            //const aiAnswers = formMap.reduce((acc, field) => ({ ...acc, [field.index]: `${field.index} hi` }), {});
            // Send it straight back to the content script
            //chrome.tabs.sendMessage(tab.id, { action: "FILL_FINAL", payload: aiAnswers });
    
            //status.innerText = "Test-Daten (Einsen) gesendet!";
            //return;



            const fileContent = Object.values(alleDaten).join("\n\n"); // Joins all saved files into one string

            try {
                // 4. Call a function to talk to Gemini (We'll build this next)
                const aiAnswers = await callGEMAPI(formMap, fileContent);

                // 5. Send the answers BACK to content.js to finally fill the form
                chrome.tabs.sendMessage(tab.id, { 
                    action: "FILL_FINAL", 
                    payload: aiAnswers 
                }, (finalResponse) => {
                    status.innerText = "Fertig! Formular wurde ausgefüllt.";
                });

            } catch (error) {
                status.innerText = "KI-Fehler: " + error.message;
            }
        });

    } else {
        status.innerText = "Keine passenden Felder gefunden.";
    }
});
  } catch (error) {
    status.innerText = "Ein Fehler ist aufgetreten.";
    console.error(error);
  }
});


async function callGEMAPI(formMap, fileContent) {

    // Dein Prompt für die KI
    const prompt = `
Du bist ein Assistent zum automatischen Ausfüllen von Formularen.

FORMULARFELDER:
${JSON.stringify(formMap, null, 2)}

BENUTZERDATEN:
${fileContent}

Gib ausschließlich JSON zurück. ES ist wichtig dass 1 zu 1 NUR JSON zurückgegeben wird.
Wenn du bei einer Antwort keine oder unzureichende Daten hast dann kannst du diesen Eintrag weglassen.
Es soll am Ende JSON sein! Das Format ist stets der Index und dann was du in das Feld einfügen würdest
Format:
{
  "0": "Antwort",
  "1": "Antwort"
}
`;

    // API-Key
    const API_KEY = API;

    // Gemini Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // Anfrage an Gemini
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error("API Anfrage fehlgeschlagen");
    }

    // KOMPLETTE JSON Antwort
    const data = await response.json();

    console.log("RAW JSON:", data);

    // Direkt das JSON aus Gemini holen
    const jsonText = data.candidates[0].content.parts[0].text;

    // JSON zurückgeben
    return JSON.parse(jsonText);
}