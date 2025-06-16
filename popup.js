document.addEventListener('DOMContentLoaded', function() {
  const promptInput = document.getElementById('prompt-input');
  const submitButton = document.getElementById('submit-prompt');
  const responsesContainer = document.getElementById('responses');
  const selectedLLMsContainer = document.getElementById('selected-llms');
  const addLLMButton = document.getElementById('add-llm');
  const llmDropdown = document.getElementById('llm-dropdown');
  
  let selectedLLMs = new Set();

  // Handle adding LLMs
  addLLMButton.addEventListener('click', function(e) {
    e.stopPropagation();
    const rect = addLLMButton.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 150; // Approximate height of dropdown
    
    // Calculate position
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;
    
    // Check if dropdown would go below viewport
    if (top + dropdownHeight > windowHeight) {
      top = rect.top + window.scrollY - dropdownHeight;
    }
    
    // Ensure dropdown doesn't go off-screen horizontally
    const dropdownWidth = 160; // min-width from CSS
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - 10; // 10px padding from edge
    }
    
    llmDropdown.style.top = `${top}px`;
    llmDropdown.style.left = `${left}px`;
    llmDropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!llmDropdown.contains(e.target) && e.target !== addLLMButton) {
      llmDropdown.classList.add('hidden');
    }
  });

  // Handle LLM selection from dropdown
  llmDropdown.addEventListener('click', function(e) {
    const option = e.target.closest('.llm-option');
    if (option) {
      const llm = option.dataset.llm;
      if (!selectedLLMs.has(llm)) {
        addLLMBubble(llm);
        selectedLLMs.add(llm);
      }
      llmDropdown.classList.add('hidden');
    }
  });

  function addLLMBubble(llm) {
    const bubble = document.createElement('div');
    bubble.className = `llm-bubble ${llm}`;
    bubble.innerHTML = `
      ${llm.charAt(0).toUpperCase() + llm.slice(1)}
      <span class="remove-llm">&times;</span>
    `;
    
    bubble.querySelector('.remove-llm').addEventListener('click', function(e) {
      e.stopPropagation();
      selectedLLMs.delete(llm);
      bubble.remove();
    });
    
    selectedLLMsContainer.appendChild(bubble);
  }

  submitButton.addEventListener('click', async function() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }

    if (selectedLLMs.size === 0) {
      alert('Please select at least one LLM');
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Opening...';

    try {
      // Copy prompt to clipboard as backup
      await navigator.clipboard.writeText(prompt);
      
      // Open tabs for each selected LLM
      for (const llm of selectedLLMs) {
        const url = getLLMUrl(llm, prompt);
        if (url) {
          const tab = await chrome.tabs.create({ url: url });
          
          // Wait for the page to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to paste the prompt based on the LLM
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: pastePrompt,
              args: [llm, prompt]
            });
          } catch (error) {
            console.error(`Error pasting to ${llm}:`, error);
          }
        }
      }

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Tabs opened! If automatic pasting failed, use ⌘V to paste.';
      responsesContainer.appendChild(successMessage);
      
      // Remove success message after 5 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 5000);

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while opening the LLM tabs');
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = 'Ask LLMs';
    }
  });

  function getLLMUrl(llm, prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    
    switch (llm) {
      case 'chatgpt':
        return 'https://chat.openai.com/';
      case 'claude':
        return 'https://claude.ai/';
      case 'gemini':
        return 'https://gemini.google.com/';
      case 'deepseek':
        return 'https://chat.deepseek.com/';
      default:
        return null;
    }
  }
});

// This function will be injected into each tab
function pastePrompt(llm, prompt) {
  // Function to wait for an element to be present
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  // Main execution
  async function execute() {
    let inputSelector;
    
    // Define the most reliable selector for each LLM
    switch (llm) {
      case 'chatgpt':
        inputSelector = 'textarea[data-id="root"], textarea[placeholder*="Send a message"], textarea[placeholder*="Message"]';
        break;
      case 'claude':
        inputSelector = 'textarea[placeholder*="Message"], textarea[aria-label*="Message"]';
        break;
      case 'gemini':
        inputSelector = 'textarea[aria-label*="prompt"], textarea[placeholder*="prompt"]';
        break;
      case 'deepseek':
        inputSelector = 'textarea[placeholder*="message"], textarea[aria-label*="message"]';
        break;
    }

    // Wait for the input field to be present
    const inputField = await waitForElement(inputSelector);
    
    if (inputField) {
      // Wait a bit to ensure the page is fully interactive
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simply set the value of the input field
      inputField.value = prompt;
      
      // Trigger a basic input event
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Start the execution
  execute().catch(console.error);
} 