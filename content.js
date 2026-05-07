chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FILL_FORM") {
    const inputs = document.querySelectorAll('input[type="tel"],input[type="text"], input[type="email"], textarea');

    inputs.forEach((input) => {
      // Standard check: only fill visible, usable boxes
      if (input.offsetParent !== null && !input.disabled && !input.readOnly) {
        
        // --- [NEW/UPDATED PART 1: LABELS] ---
        const labelElement = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        const labelText = labelElement ? labelElement.innerText.trim() : "no-label";

        // --- [NEW/UPDATED PART 2: BUTTONS] ---
        // We find the closest wrapper to see if there's a button nearby
        // 2. Placeholder Text (THE NEW PART)
        const placeholderText = input.placeholder || "no-placeholder";
        const parentContainer = input.closest('div, form, section');
        let buttonText = "no-button";
        if (parentContainer) {
          const btn = parentContainer.querySelector('button, input[type="button"], input[type="submit"]');
          if (btn) {
            buttonText = btn.innerText || btn.value || "btn-no-text";
          }
        }

        // --- [NEW/UPDATED PART 3: THE PASTE] ---
        const idText = input.id || "no-id";
        // We put all clues together so you can see them in the box!
        input.value = `LabelText: ${labelText} | PlaceholderText: ${placeholderText} | ButtonText: ${buttonText.trim()} | IDText: ${idText}`;

        // Standard: Trigger events so the website knows we typed
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.style.backgroundColor = "#fff9c4";
      }
    });

    sendResponse({ status: "done" });
  }
  return true;
});