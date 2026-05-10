chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FIND_FORM") {
  const inputs = document.querySelectorAll('input[type="tel"], input[type="text"], input[type="email"],input[type="radio"], input[type="checkbox"], textarea,[role="radio"], [role="checkbox"]');
  
  // 1. Create an empty list to store our "Scout Report"
  const foundFields = [];

  inputs.forEach((input,i) => {
    const tagName = input.tagName;
    if (tagName!="TEXTAREA" && tagName!="INPUT"){
      const isDisabled = input.getAttribute('aria-disabled') === 'true';
      const isVisible = input.offsetParent !== null;
      if (!isDisabled && isVisible){
        foundFields.push({
        index: i,
        label: "no-label",
        placeholder: "no-placeholder",
        type: input.getAttribute('role'),
        // We also send back a unique selector so we can find this EXACT box later
      });
      if (input.parentNode) {
        const marker = document.createElement('span');
        marker.innerText = ` [FIELD_ID:${i}] `;
        marker.style.color = "red";
        marker.style.fontWeight = "bold";
        marker.style.fontSize = "12px";
        marker.className = "ai-marker"; 
        marker.style.opacity = "0";// Class for easy removal later
        marker.style.position = "absolute";
        
        // Insert it immediately after the input
        input.parentNode.insertBefore(marker, input.nextSibling);}
      input.setAttribute('data-ai-index', i);
      // Optional: Visual hint so you know which fields were scanned
      input.style.border = "2px solid #fff9c4";
      }
    }







    else if (input.offsetParent !== null && !input.disabled && !input.readOnly) {
      
      // --- CLUE GATHERING (Same as before) ---
      const labelElement = input.id? document.querySelector(`label[for="${input.id}"]`):null || input.closest('label');
      const labelText = labelElement ? labelElement.innerText.trim() : "no-label";
      const placeholderText = input.placeholder || "no-placeholder";
            

      foundFields.push({
        index: i,
        label: labelText,
        placeholder: placeholderText,
        type: input.type,
        // We also send back a unique selector so we can find this EXACT box later
      });
      if (input.parentNode) {
        const marker = document.createElement('span');
        marker.innerText = ` [FIELD_ID:${i}] `;
        marker.style.color = "red";
        marker.style.fontWeight = "bold";
        marker.style.fontSize = "12px";
        marker.className = "ai-marker"; 
        marker.style.opacity = "0";// Class for easy removal later
        marker.style.position = "absolute";
        
        // Insert it immediately after the input
        input.parentNode.insertBefore(marker, input.nextSibling);}
      input.setAttribute('data-ai-index', i);
      // Optional: Visual hint so you know which fields were scanned
      input.style.border = "2px solid #fff9c4";
    }
  });

  // --- 3. SENDING THE REPORT ---
  // We send the array back to popup.js via the sendResponse
  const visibleText = document.body.innerText;
  document.querySelectorAll('.ai-marker').forEach(el => el.remove());
  sendResponse({ status: "success", fields: foundFields, pageText:  visibleText});
    }





if (request.action === "FILL_FINAL") {
  const data = request.payload; // Now an object where keys are the Index numbers

  Object.keys(data).forEach((index) => {
    // We look for the EXACT element we "stamped" earlier
    const input = document.querySelector(`[data-ai-index="${index}"]`);
    if (input) {
      // 1. Fill the value provided by Gemini/Dummy
      const tagName = input.tagName;
      if (tagName!="TEXTAREA" && tagName!="INPUT"){
          const valueFromAI = data[index];
          const shouldBeChecked = 
          valueFromAI === true || 
          valueFromAI === "true" || 
          valueFromAI === "Yes" || 
          valueFromAI === "True" ||
          valueFromAI === "checked";
        if (shouldBeChecked){
          const z= input.getAttribute('aria-checked') === 'true';
          if (!z){
          input.click()
          input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          }
        }

      }
      else{
      if(input.type === "radio" || input.type === "checkbox") {
        const valueFromAI = data[index];
          const shouldBeChecked = 
          valueFromAI === true || 
          valueFromAI === "true" || 
          valueFromAI === "Yes" || 
          valueFromAI === "True" ||
          valueFromAI === "checked";
        if (shouldBeChecked){
          input.checked = true
          input.click()
        }
      }
      else{
        input.value = data[index];
      }
    

      // 2. Wake up the website's listeners
      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
      input.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
    }

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