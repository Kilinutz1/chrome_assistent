chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FIND_FORM") {
  const inputs = document.querySelectorAll('input[type="tel"], input[type="text"], input[type="email"], textarea');
  
  // 1. Create an empty list to store our "Scout Report"
  const foundFields = [];

  inputs.forEach((input,i) => {
    if (input.offsetParent !== null && !input.disabled && !input.readOnly) {
      
      // --- CLUE GATHERING (Same as before) ---
      const labelElement = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
      const labelText = labelElement ? labelElement.innerText.trim() : "no-label";
      const placeholderText = input.placeholder || "no-placeholder";
      
      const parentContainer = input.closest('div, form, section');
      let buttonText = "no-button";
      if (parentContainer) {
        const btn = parentContainer.querySelector('button, input[type="button"], input[type="submit"]');
        if (btn) {
          buttonText = btn.innerText || btn.value || "btn-no-text";
        }
      }
      const idText = input.id || "no-id";

      // --- 2. PACKING THE DATA ---
      // Instead of filling the box, we push an object into our list
      foundFields.push({
        index: i,
        id: idText,
        label: labelText,
        placeholder: placeholderText,
        context: buttonText.trim(),
        // We also send back a unique selector so we can find this EXACT box later
        name: input.name || ""
      });
      input.setAttribute('data-ai-index', i);
      // Optional: Visual hint so you know which fields were scanned
      input.style.border = "2px solid #fff9c4";
    }
  });

  // --- 3. SENDING THE REPORT ---
  // We send the array back to popup.js via the sendResponse
  sendResponse({ status: "success", fields: foundFields });
    }





if (request.action === "FILL_FINAL") {
  const data = request.payload; // Now an object where keys are the Index numbers

  Object.keys(data).forEach((index) => {
    // We look for the EXACT element we "stamped" earlier
    const input = document.querySelector(`[data-ai-index="${index}"]`);
    //LIST LIKE THIS {"0": "Max", "1": "test@mail.com"}
    if (input) {
      // 1. Fill the value provided by Gemini/Dummy
      input.value = data[index];

      // 2. Wake up the website's listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // 3. Visual "Success" feedback
      input.style.backgroundColor = "#c8e6c9"; 
      input.style.border = "2px solid #4caf50";
      
      // Optional: Clear the stamp if you're done
      // input.removeAttribute('data-ai-index'); 
    }
  });

  sendResponse({ status: "Form filled successfully" });
}




  return true;
});