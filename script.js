const GEMINI_API_KEY = "AIzaSyC0iny6uph2g33bi3UjAPaGJPH-dpri6ys"; // Replace with your actual API key
const apiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Updated keywords for hotel booking
const ALLOWED_KEYWORDS = [
  "hotel",
  "motel",
  "inn",
  "resort",
  "lodge",
  "stay",
  "book",
  "booking",
  "room",
  "suite",
  "accommodation",
  "vacancy",
  "availability",
  "price",
  "budget",
  "cheap",
  "luxury",
  "rating",
  "stars",
  "amenities",
  "pool",
  "gym",
  "breakfast",
  "wifi",
  "parking",
  "location",
  "near",
  "city",
  "airport",
  "dates",
  "check-in",
  "check-out",
  "guests",
  "adults",
  "children",
  "compare",
  "vs",
  "versus",
  "review",
  "deal",
];

let messages = [];
let history = [];
let darkMode = localStorage.getItem("darkMode") === "true";

document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements, updating IDs for hotel theme
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const newChatBtn = document.getElementById("new-chat");
  const clearHistoryBtn = document.getElementById("clear-history");
  const historyDiv = document.getElementById("history");
  const emptyState = document.getElementById("empty-state");
  const themeToggle = document.getElementById("theme-toggle");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const exportChatBtn = document.getElementById("export-chat");

  // Compare Hotels Modal elements
  const compareBtn = document.getElementById("compare-hotels-btn"); // ID updated
  const compareModal = document.getElementById("compare-hotels-modal"); // ID updated
  const compareModalClose = document.getElementById(
    "compare-hotels-modal-close"
  ); // ID updated
  const compareCancel = document.getElementById("compare-hotels-cancel"); // ID updated
  const compareSubmit = document.getElementById("compare-hotels-submit"); // ID updated
  const hotelAInput = document.getElementById("hotel-a"); // ID updated
  const hotelBInput = document.getElementById("hotel-b"); // ID updated

  // Hotel Details Modal elements
  const hotelDetailsModal = document.getElementById("hotel-details-modal"); // ID updated
  const hotelDetailsModalClose = document.getElementById(
    "hotel-details-modal-close"
  ); // ID updated
  const hotelDirectionsBtn = document.getElementById("hotel-directions"); // ID updated
  const hotelBookNowBtn = document.getElementById("hotel-book-now"); // ID updated

  // Load history from localStorage (using a new key)
  loadHistory();

  // --- Event Listeners ---

  // Compare Hotels button
  compareBtn.addEventListener("click", () => {
    compareModal.classList.add("active");
    setTimeout(() => hotelAInput.focus(), 100); // Focus first input
  });

  // Close Compare Modal button
  compareModalClose.addEventListener("click", () => {
    compareModal.classList.remove("active");
  });

  // Cancel Compare Modal button
  compareCancel.addEventListener("click", () => {
    compareModal.classList.remove("active");
  });

  // Click outside Compare Modal to close
  compareModal.addEventListener("click", (e) => {
    if (e.target === compareModal) {
      compareModal.classList.remove("active");
    }
  });

  // Close Hotel Details Modal button
  hotelDetailsModalClose.addEventListener("click", () => {
    hotelDetailsModal.classList.remove("active");
  });

  // Click outside Hotel Details Modal to close
  hotelDetailsModal.addEventListener("click", (e) => {
    if (e.target === hotelDetailsModal) {
      hotelDetailsModal.classList.remove("active");
    }
  });

  // Compare Hotels Submit button
  compareSubmit.addEventListener("click", () => {
    const firstHotel = hotelAInput.value.trim();
    const secondHotel = hotelBInput.value.trim();

    if (!firstHotel || !secondHotel) {
      showToast("Please enter both hotel names", "error");
      return;
    }

    compareModal.classList.remove("active");
    compareHotels(firstHotel, secondHotel); // Call hotel comparison function

    // Clear inputs
    hotelAInput.value = "";
    hotelBInput.value = "";
  });

  // Apply dark mode if previously set
  if (darkMode) {
    document.body.classList.add("dark-theme");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Handle query parameters (e.g., from landing page)
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("query");
  if (query) {
    hideEmptyState();
    addMessage("user", query);
    getHotelResponse(query); // Call hotel response function
  }

  // Send button click
  sendBtn.addEventListener("click", () => sendMessage());
  // Enter key press in input
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // New Chat button
  newChatBtn.addEventListener("click", () => {
    messages = [];
    chatMessages.innerHTML = "";
    showEmptyState(); // Show the welcome message for hotels

    // Close sidebar on mobile if open
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
    }

    showToast("New hotel search started", "info");
  });

  // Clear History button
  clearHistoryBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all hotel search history? This cannot be undone."
      )
    ) {
      history = [];
      localStorage.setItem("hotelBooker_history", JSON.stringify(history)); // Use new key
      renderHistory();
      showToast("History cleared", "success");
    }
  });

  // History item click
  historyDiv.addEventListener("click", (e) => {
    const item = e.target.closest(".history-item");
    if (item) {
      const index = item.dataset.index;
      messages = [...history[index].messages]; // Load messages from history
      renderMessages(); // Display loaded messages

      // Close sidebar on mobile if open
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Theme toggle button
  themeToggle.addEventListener("click", () => {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark-theme");
    themeToggle.innerHTML = darkMode
      ? '<i class="fas fa-sun"></i>' // Sun icon for dark mode
      : '<i class="fas fa-moon"></i>'; // Moon icon for light mode
  });

  // Sidebar toggle button (for mobile)
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  // Export Chat button
  exportChatBtn.addEventListener("click", () => {
    exportChat();
  });

  // Click outside sidebar to close (on mobile)
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(e.target) &&
      !sidebarToggle.contains(e.target) &&
      sidebar.classList.contains("active")
    ) {
      sidebar.classList.remove("active");
    }
  });

  // Show empty state if no messages initially
  if (messages.length === 0) {
    showEmptyState();
  }

  // Event delegation for clicking on hotel results in the chat
  chatMessages.addEventListener("click", (e) => {
    const hotelElement = e.target.closest(".hotel-in-results"); // Use new class
    if (hotelElement) {
      const hotelName = hotelElement.dataset.hotelName; // Get name from data attribute
      if (hotelName) {
        showHotelDetails(hotelName); // Call function to show details modal
      }
    }
  });

  // Get Directions button in Hotel Details Modal
  hotelDirectionsBtn.addEventListener("click", () => {
    const hotelName = document.getElementById(
      "hotel-details-title"
    ).textContent;
    const address = document.getElementById("hotel-address")?.textContent || ""; // Get hidden address

    if (address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address + ", " + hotelName
      )}`; // Include hotel name for better accuracy
      window.open(mapsUrl, "_blank"); // Open Google Maps
    } else {
      showToast(`Could not find address for ${hotelName}`, "error");
    }

    hotelDetailsModal.classList.remove("active"); // Close modal
  });

  // Book Now button in Hotel Details Modal
  hotelBookNowBtn.addEventListener("click", () => {
    const hotelName = document.getElementById(
      "hotel-details-title"
    ).textContent;
    const website = document.getElementById("hotel-details-modal").dataset
      .website; // Get website from modal data attribute

    if (website && website !== "N/A") {
      // Open the hotel's website or a booking link (replace '#' with actual logic if integrating a booking API)
      window.open(website, "_blank");
      showToast(`Opening booking page for ${hotelName}...`, "info");
    } else {
      // Placeholder if no website/booking link is available
      showToast(
        `Booking functionality for ${hotelName} is not available yet.`,
        "info"
      );
      console.log(`Attempted to book: ${hotelName}`);
    }
    hotelDetailsModal.classList.remove("active"); // Close modal
  });

  // Add keyboard support for Compare Hotels modal inputs
  if (hotelAInput && hotelBInput) {
    hotelAInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        hotelBInput.focus(); // Move to next input on Enter
      }
    });

    hotelBInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        compareSubmit.click(); // Submit on Enter in second input
      }
    });
  }

  // Add event listener for Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (compareModal.classList.contains("active")) {
        compareModal.classList.remove("active");
      }
      if (hotelDetailsModal.classList.contains("active")) {
        hotelDetailsModal.classList.remove("active");
      }
    }
  });
}); // End DOMContentLoaded

// --- Core Functions ---

// Adds a message to the chat interface and message history
function addMessage(role, content, timestamp = new Date()) {
  hideEmptyState(); // Hide the welcome message
  // Format assistant messages using the hotel-specific formatter
  const formattedContent =
    role === "assistant" ? formatHotelResponse(content) : content;
  messages.push({ role, content: formattedContent, timestamp });
  renderMessages(); // Update the chat display

  // Save to history if it's a completed assistant response
  if (role === "assistant" && messages.length >= 2) {
    saveToHistory();
  }
}

// Renders all messages in the chat window
function renderMessages() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = ""; // Clear existing messages

  messages.forEach((msg) => {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container message-${msg.role}`;

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const timestamp = new Date(msg.timestamp);
    const timeStr = timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Update assistant name and icon in meta
    meta.innerHTML =
      msg.role === "user"
        ? `<i class="fas fa-user"></i> You <span class="message-time">${timeStr}</span>`
        : `<i class="fas fa-concierge-bell"></i> Hotel Booker <span class="message-time">${timeStr}</span>`; // Updated icon and name

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message chat-message-${msg.role}`;
    // Use innerHTML because formatted responses contain HTML
    messageDiv.innerHTML = msg.content;

    // Add copy button for user messages
    if (msg.role === "user") {
      const copyBtn = document.createElement("button");
      copyBtn.className = "message-action-btn";
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      copyBtn.title = "Copy message";
      copyBtn.onclick = () => copyToClipboard(msg.content); // Use original content for copy
      messageDiv.appendChild(copyBtn);
    }

    // Add feedback buttons for assistant messages (optional, kept from original)
    if (msg.role === "assistant") {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "feedback-buttons";
      // Basic feedback structure (can be expanded)
      feedbackDiv.innerHTML = `
        <button class="feedback-btn" title="Good response"><i class="fas fa-thumbs-up"></i></button>
        <button class="feedback-btn" title="Bad response"><i class="fas fa-thumbs-down"></i></button>
      `;
      // Add event listeners for feedback if needed
      messageContainer.appendChild(feedbackDiv); // Append feedback to container
    }

    messageContainer.appendChild(meta);
    messageContainer.appendChild(messageDiv);
    chatMessages.appendChild(messageContainer);
  });

  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Renders the search history in the sidebar
function renderHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = ""; // Clear existing history

  history.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.dataset.index = index; // Store index for retrieval

    const date = new Date(item.timestamp);
    const formattedDate =
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Use hotel icon for history items
    div.innerHTML = `
      <i class="fas fa-bed"></i> <!-- Hotel icon -->
      <div>
        <span>${item.title.substring(0, 30)}${
      item.title.length > 30 ? "..." : ""
    }</span>
        <span class="history-date">${formattedDate}</span>
      </div>
    `;
    historyDiv.appendChild(div);
  });
}

// Saves the current chat session to history and localStorage
function saveToHistory() {
  const userMessage = messages.find((msg) => msg.role === "user");
  // Generate a title based on the first user message
  const title =
    userMessage?.content?.substring(0, 50) +
      (userMessage?.content?.length > 50 ? "..." : "") || "Untitled Search";

  const historyItem = {
    id: Date.now(), // Simple ID based on timestamp
    title: title,
    messages: [...messages], // Store a copy of the messages
    timestamp: new Date(),
  };

  // Check if this chat session (based on ID) already exists in history to update it
  const exists = history.findIndex((h) => h.id === historyItem.id);
  if (exists > -1) {
    history[exists] = historyItem; // Update existing entry
  } else {
    history.unshift(historyItem); // Add as new entry at the beginning
  }

  // Limit history size (optional)
  // if (history.length > 50) { history.pop(); }

  localStorage.setItem("hotelBooker_history", JSON.stringify(history)); // Use new key
  renderHistory(); // Update the sidebar display
}

// Loads history from localStorage
function loadHistory() {
  const savedHistory = localStorage.getItem("hotelBooker_history"); // Use new key
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
      renderHistory(); // Display loaded history
    } catch (error) {
      console.error("Error loading history:", error);
      localStorage.removeItem("hotelBooker_history"); // Clear corrupted data
    }
  }
}

// Formats the raw response from the AI for hotel listings or general chat
function formatHotelResponse(response) {
  // Attempt to parse as JSON first (for structured details)
  try {
    const jsonData = JSON.parse(response);
    // If parsing succeeds and it looks like hotel details, format it specially
    if (jsonData.name && (jsonData.rating || jsonData.price_range)) {
      return formatSingleHotelDetails(jsonData); // Use a dedicated function
    }
  } catch (e) {
    // Not JSON or not the expected structure, proceed with text formatting
  }

  // --- Text Formatting Logic ---

  // Check for hotel listing format (e.g., "Hotels in London:")
  if (response.match(/^(Hotels|Accommodations)\s+in\s+([^:]+):/i)) {
    let cleanedText = response.replace(/<[^>]*>/g, ""); // Basic HTML cleanup
    let formattedResponse = `<div class="resource-response hotel-list-response">`; // Keep container

    const cityMatch = cleanedText.match(
      /^(Hotels|Accommodations)\s+in\s+([^:]+):/i
    );
    const searchTopic = cityMatch
      ? cityMatch[2].trim()
      : "your specified location";

    // Header for the list
    formattedResponse += `
          <div class="resource-response-header">
              <i class="fas fa-map-marked-alt"></i>
              <span>Hotels in ${searchTopic}</span>
          </div>
      `;

    // Remove intro line if present from cleanedText
    cleanedText = cleanedText
      .replace(/^(Hotels|Accommodations)\s+in\s+([^:]+):\s*/i, "")
      .trim();
    cleanedText = cleanedText
      .replace(
        /^(Here are a few options:|I found the following hotels:)\s*/i,
        ""
      )
      .trim();

    formattedResponse += `<div class="resource-list-container" style="padding: 15px 20px;">`; // Keep container, add padding

    // Extract hotels more intelligently - try numbered list first, then other separations
    let hotelEntries = [];

    // Try to find numbered pattern like "1. Hotel Name:"
    const numberedPattern = cleanedText.match(/\d+\.\s+([^:]+):/g);

    if (numberedPattern && numberedPattern.length > 0) {
      // Split by numbered pattern
      const parts = cleanedText.split(/\d+\.\s+[^:]+:/);
      parts.shift(); // Remove first empty part

      hotelEntries = numberedPattern.map((header, i) => {
        const name = header
          .replace(/^\d+\.\s+/, "")
          .replace(/:$/, "")
          .trim();
        const description = parts[i] ? parts[i].trim() : "";
        return { name, description };
      });
    } else {
      // Try to split by double newlines or other common separators
      const hotelBlocks = cleanedText
        .split(/\n\s*\n|\n\s*\d+\.\s+/)
        .filter((block) => block.trim());

      hotelEntries = hotelBlocks
        .map((block) => {
          const lines = block.trim().split("\n");
          if (lines.length === 0) return null;

          // Extract hotel name - assume it's the first part before a dash/colon or the whole first line
          const hotelNameMatch = lines[0].match(/^([^-–—:]+)/);
          const name = hotelNameMatch
            ? hotelNameMatch[1].trim()
            : lines[0].trim();

          // Extract description - rest of the text
          let description = "";
          if (lines.length > 1) {
            description = lines.slice(1).join(" ").trim();
          } else if (lines[0].includes(":")) {
            const parts = lines[0].split(":");
            description = parts.slice(1).join(":").trim();
          } else if (lines[0].match(/[–—-]/)) {
            const parts = lines[0].split(/[–—-]/);
            description = parts.slice(1).join(" ").trim();
          }

          return { name, description };
        })
        .filter((entry) => entry && entry.name);
    }

    // Generate HTML for each hotel entry
    hotelEntries.forEach((entry, index) => {
      if (entry.name) {
        // Clean the name to ensure it doesn't contain HTML or special characters
        const cleanName = entry.name.replace(/[<>]/g, "");

        // Add the "View Details" link first - this will be a separate clickable element
        formattedResponse += `
                  <div class="hotel-in-results" data-hotel-name="${cleanName}" title="Click for details" style="margin-bottom: 5px; display: inline-block; background: #f0f9fa; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                      <i class="fas fa-info-circle"></i> View Details & Check Availability
                  </div>`;

        // Add the numbered hotel info
        formattedResponse += `<div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px dashed #ddd;">`; // Add spacing and separator
        formattedResponse += `${index + 1}. <strong>${cleanName}</strong>`;

        // Check if we have a description and if it doesn't duplicate the hotel name
        if (entry.description && !entry.description.includes(cleanName)) {
          formattedResponse += `<p style="margin-top: 5px; margin-left: 15px; color: #444;">${entry.description}</p>`;
        }

        formattedResponse += `</div>`;
      }
    });

    // If no hotels were successfully parsed, add a fallback message
    if (hotelEntries.length === 0) {
      formattedResponse += `<div style="text-align: center; padding: 20px;">
              <i class="fas fa-exclamation-circle" style="color: #f39c12; font-size: 24px; margin-bottom: 10px;"></i>
              <p>Sorry, I couldn't structure the hotel information properly. Here's the raw information:</p>
              <div style="text-align: left; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                  ${cleanedText.replace(/\n/g, "<br>")}
              </div>
          </div>`;
    }

    formattedResponse += `</div>`; // Close resource-list-container

    // Footer prompt
    formattedResponse += `
          <div class="resource-response-footer">
              <i class="fas fa-question-circle"></i>
              Click 'View Details' on a hotel or ask for more specific criteria (e.g., 'with a pool', 'pet-friendly', 'near airport').
          </div>`;

    formattedResponse += `</div>`; // Close resource-response
    return formattedResponse;
  }

  // --- Comparison Table Formatting ---
  if (
    response.includes("Comparison:") &&
    response.includes("Category") &&
    response.includes("Details")
  ) {
    // Wrap the comparison table in a nice container
    return `<div class="resource-response comparison-response" style="margin: 15px 0;">
          <div class="resource-response-header">
              <i class="fas fa-exchange-alt"></i>
              <span>Hotel Comparison</span>
          </div>
          <div style="padding: 15px 20px;">
              ${response}
          </div>
      </div>`;
  }

  // --- General Text Formatting (Fallback) ---
  let generalFormatted = response
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold markdown
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic markdown
    .replace(/\n/g, "<br>"); // Convert newlines to <br>

  // Better detect and format lists
  if (response.match(/^[\s\n]*[-*•]\s+/m)) {
    generalFormatted = generalFormatted
      .replace(/(<br>|^)\s*[-*•]\s+/g, "$1<br>• ") // Handle list items
      .replace(/(<br>• .*?)(<br>)(?!\s*[-*•]\s+)/g, "$1</li>$2"); // Close list items except before another list item
  }

  return `<div class="chat-message-text">${generalFormatted}</div>`; // Wrap in a simple div
}

// Formats a single hotel's details (assuming input is a JS object)
function formatSingleHotelDetails(hotelData) {
  // Create a more comprehensive summary for the chat message
  let summary = `<div class="single-hotel-preview">`;

  // Hotel name as header
  summary += `<h3 style="margin-bottom: 10px; color: #0097A7;">${
    hotelData.name || "Hotel Details"
  }</h3>`;

  // Main info in a styled grid
  summary += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">`;

  if (hotelData.rating)
    summary += `<div><i class="fas fa-star" style="color: #FF9800;"></i> <strong>Rating:</strong> ${hotelData.rating}</div>`;

  if (hotelData.price_range)
    summary += `<div><i class="fas fa-dollar-sign" style="color: #43A047;"></i> <strong>Price:</strong> ${hotelData.price_range}</div>`;

  if (hotelData.location_description || hotelData.address)
    summary += `<div style="grid-column: span 2;"><i class="fas fa-map-marker-alt" style="color: #E53935;"></i> <strong>Location:</strong> ${
      hotelData.location_description || hotelData.address
    }</div>`;

  summary += `</div>`;

  // Description section
  if (hotelData.description) {
    summary += `<div style="margin: 10px 0; padding: 10px; background: #f0f9fa; border-radius: 8px;">
          <strong>Description:</strong> ${hotelData.description}
      </div>`;
  }

  // Amenities preview (limited)
  if (
    hotelData.amenities &&
    Array.isArray(hotelData.amenities) &&
    hotelData.amenities.length > 0
  ) {
    const displayAmenities = hotelData.amenities.slice(0, 3);
    summary += `<div style="margin-top: 10px;"><strong>Key Amenities:</strong> ${displayAmenities.join(
      ", "
    )}`;
    if (hotelData.amenities.length > 3)
      summary += ` and ${hotelData.amenities.length - 3} more`;
    summary += `</div>`;
  }

  // View full details button - styled to be more prominent
  summary += `<button class="hotel-in-results" data-hotel-name="${hotelData.name}"
      style="display: block; margin: 15px auto 5px; padding: 10px 15px; background: var(--primary-gradient);
      color: white; border: none; border-radius: 25px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,151,167,0.3);">
      <i class="fas fa-info-circle"></i> View Complete Details
  </button>`;

  summary += `</div>`;
  return summary;
}

// Hides the initial empty state message
function hideEmptyState() {
  const emptyState = document.getElementById("empty-state");
  if (emptyState) {
    emptyState.style.display = "none";
  }
}

// Shows the initial empty state message
function showEmptyState() {
  const emptyState = document.getElementById("empty-state");
  const chatMessages = document.getElementById("chat-messages");

  if (emptyState) {
    chatMessages.innerHTML = ""; // Clear messages
    emptyState.style.display = "flex"; // Make it visible
    chatMessages.appendChild(emptyState); // Ensure it's in the chat area
  } else {
    // Fallback: Create empty state if it wasn't found (shouldn't happen with correct HTML)
    const newEmptyState = document.createElement("div");
    newEmptyState.id = "empty-state";
    newEmptyState.className = "empty-state";
    // Update innerHTML for Hotel Booker
    newEmptyState.innerHTML = `
      <div class="empty-icon">
        <i class="fas fa-suitcase-rolling"></i> <!-- Icon changed -->
      </div>
      <h2>Welcome to Hotel Booker</h2> <!-- Title changed -->
      <p>Your AI assistant for finding and booking the perfect hotel.</p>
      <div class="feature-list">
        <div class="feature-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>"Hotels in Paris near Eiffel Tower"</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-calendar-alt"></i>
          <span>"Find hotels for July 10-15"</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-dollar-sign"></i>
          <span>"Budget hotels under $150"</span>
        </div>
        <div class="feature-item">
           <i class="fas fa-star"></i>
          <span>"5-star hotels with a pool"</span>
        </div>
      </div>
      <p class="start-prompt">
        Where and when would you like to travel?
      </p>
    `;
    chatMessages.innerHTML = "";
    chatMessages.appendChild(newEmptyState);
  }
}

// Fetches response from Gemini API for hotel queries
async function getHotelResponse(userInput) {
  const inputLower = userInput.toLowerCase();
  // Basic check if input seems hotel-related
  if (!ALLOWED_KEYWORDS.some((keyword) => inputLower.includes(keyword))) {
    addMessage(
      "assistant",
      "⚠️ I specialize in hotel booking assistance. Please ask about hotels, locations, dates, or amenities (e.g., 'Hotels in New York with a gym' or 'Find a budget hotel near LAX for next Tuesday')."
    );
    return;
  }

  // Add typing indicator
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Construct the prompt for the Gemini API
    const prompt = `You are "Hotel Booker", an AI assistant specializing in finding and providing information about hotels.
      User query: "${userInput}"

            Based on the user query, provide relevant hotel information.

            When listing hotels (e.g., "hotels in London", "budget hotels near LAX"):
            1. Start the response with "Hotels in [Location]:"
            2. For each hotel (provide 3-5 options), include:
               - Hotel name as a distinct heading
               - A 1-2 sentence description covering key features, location benefits, and notable amenities
               - Rating information (stars or review score) if relevant
               - Price category or range if relevant
            3. Format each hotel as a distinct entry with numbering (1., 2., etc.)
            4. Keep information well-structured and easily scannable

            If asked about a specific hotel, provide a comprehensive overview of that property.

            Keep responses focused on hotel booking. If information is uncertain, provide realistic approximations rather than saying "I don't know specific details."`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6, // Slightly more creative for finding options
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    // Remove typing indicator
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Process the response
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content
    ) {
      let rawResponse = data.candidates[0].content.parts[0].text;

      // Check if the response is likely JSON for details modal
      if (
        rawResponse.trim().startsWith("{") &&
        rawResponse.trim().endsWith("}")
      ) {
        try {
          const jsonData = JSON.parse(rawResponse);
          // If it parses and has a name, assume it's details for the modal
          if (jsonData.name) {
            populateHotelDetailsModal(jsonData); // Directly populate modal
            return; // Don't add this JSON to chat messages directly
          }
        } catch (e) {
          // Not valid JSON, treat as text
          console.warn(
            "Received JSON-like response, but failed to parse or validate:",
            e
          );
        }
      }

      // Otherwise, add the (potentially formatted) text response to chat
      addMessage("assistant", rawResponse);
    } else {
      // Handle cases where the API returns no candidates or empty content
      console.warn("API response missing candidates or content:", data);
      addMessage(
        "assistant",
        "Sorry, I couldn't retrieve any information for that request. Could you try rephrasing?"
      );
      showToast("No information found", "warning");
    }
  } catch (error) {
    // Remove typing indicator if still present
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }
    console.error("Error fetching hotel response:", error);
    addMessage(
      "assistant",
      `Sorry, I encountered an error trying to find hotel information: ${error.message}. Please try again later.`
    );
    showToast("Error getting hotel information", "error");
  }
}

// Fetches comparison data for two hotels
async function compareHotels(hotelA, hotelB) {
  const comparisonMessage = `Compare ${hotelA} vs ${hotelB}`;
  addMessage("user", comparisonMessage);

  // Add typing indicator
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Construct the prompt for comparing hotels
    const prompt = `You are "Hotel Booker". Compare these two hotels: "${hotelA}" and "${hotelB}".
      Create a detailed comparison table with the following categories:
      - Overview: Brief comparison (1-2 sentences).
      - Rating: Star rating or user review score.
      - Price Range: e.g., $, $$, $$$, or specific range if known.
      - Key Amenities: List 3-4 notable amenities for each (e.g., Pool, Free WiFi, Restaurant, Gym, Pet-friendly).
      - Location Highlights: Key aspects of their location (e.g., Near airport, Downtown, Beachfront).
      - Best For: Who is each hotel best suited for (e.g., Business travelers, Families, Budget stays).

      Format the response *only* as an HTML table with the class "comparison-table".
      Use <th> for headers "Category", "${hotelA}", and "${hotelB}".
      Use <td> for the data. Use the category names listed above in the first column.
      Be concise but informative. If information isn't readily available, state "N/A" or make reasonable assumptions based on typical hotel types.
      Example row structure: <tr><td class="category">Rating</td><td>4.5 Stars</td><td>3 Stars</td></tr>`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5, // More factual for comparison
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    // Remove typing indicator
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content) {
      let comparisonHtml = data.candidates[0].content.parts[0].text;
      // Basic validation to ensure it looks like an HTML table
      if (!comparisonHtml.includes('<table class="comparison-table">')) {
        comparisonHtml = formatComparisonAsTableFallback(
          comparisonHtml,
          hotelA,
          hotelB
        );
      }
      addMessage("assistant", comparisonHtml); // Add the HTML table directly
    } else {
      throw new Error("No comparison data received from API.");
    }
  } catch (error) {
    // Remove typing indicator if still present
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }
    console.error("Error comparing hotels:", error);
    addMessage(
      "assistant",
      `Sorry, I couldn't compare those hotels: ${error.message}. Please try again.`
    );
    showToast("Error comparing hotels", "error");
  }
}

// Fallback formatter if the API doesn't return a proper HTML table for comparison
function formatComparisonAsTableFallback(text, hotelA, hotelB) {
  const sections = {};
  let currentSection = "";
  const lines = text.split("\n");

  lines.forEach((line) => {
    line = line.trim();
    if (!line) return;
    const sectionMatch = line.match(/^([^:]+):\s*(.*)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = sectionMatch[2].trim();
    } else if (currentSection && sections[currentSection]) {
      sections[currentSection] += ` ${line}`; // Append to existing section if no colon
    }
  });

  let tableHtml = `
    <div class="comparison-result">
      <h3>Comparison: ${hotelA} vs ${hotelB}</h3>
      <p>(Note: Displayed in fallback format)</p>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
  `;

  const orderedSections = [
    "Overview",
    "Rating",
    "Price Range",
    "Key Amenities",
    "Location Highlights",
    "Best For",
  ];
  orderedSections.forEach((sectionName) => {
    if (sections[sectionName]) {
      tableHtml += `
            <tr>
                <td class="category">${sectionName}</td>
                <td>${sections[sectionName].replace(/<[^>]*>/g, "")}</td>
            </tr>`; // Basic display
    }
  });

  tableHtml += `</tbody></table></div>`;
  return tableHtml;
}

// Fetches and displays detailed information for a specific hotel in the modal
async function showHotelDetails(hotelName) {
  // Show the modal immediately with loading state
  const hotelDetailsModal = document.getElementById("hotel-details-modal");
  const titleElement = document.getElementById("hotel-details-title");
  const imageElement = document.getElementById("hotel-image");
  const ratingElement = document.getElementById("hotel-rating");
  const priceRangeElement = document.getElementById("hotel-price-range");
  const locationElement = document.getElementById("hotel-location");
  const categoriesElement = document.getElementById("hotel-categories");
  const descriptionElement = document.getElementById("hotel-description");
  const amenitiesElement = document.getElementById("hotel-amenities-list");
  const featuresElement = document.getElementById("hotel-features-info");
  const addressElement = document.getElementById("hotel-address"); // Hidden div

  // Show loading state in modal
  titleElement.textContent = hotelName;
  // imageElement.src = "https://via.placeholder.com/180x180?text=Loading..."; // Placeholder image
  ratingElement.innerHTML = '<i class="fas fa-star"></i> Loading...';
  priceRangeElement.innerHTML = '<i class="fas fa-dollar-sign"></i> Loading...';
  locationElement.innerHTML =
    '<i class="fas fa-map-marker-alt"></i> Loading...';
  categoriesElement.innerHTML = "";
  descriptionElement.textContent = "Loading hotel information...";
  amenitiesElement.textContent = "Loading...";
  featuresElement.textContent = "Loading...";
  addressElement.textContent = ""; // Clear hidden address
  hotelDetailsModal.dataset.website = ""; // Clear website data attribute

  // Show the modal
  hotelDetailsModal.classList.add("active");

  try {
    // First check if this hotel has already been looked up in this session
    const existingHotel = messages.find((msg) => {
      if (msg.role !== "assistant") return false;
      try {
        // Try to parse the message content as JSON
        const data = JSON.parse(msg.content);
        return (
          data &&
          data.name &&
          data.name.toLowerCase() === hotelName.toLowerCase()
        );
      } catch (e) {
        return false;
      }
    });

    if (existingHotel) {
      // If we already have data for this hotel, use it instead of making a new API call
      try {
        const hotelData = JSON.parse(existingHotel.content);
        populateHotelDetailsModal(hotelData);
        return;
      } catch (e) {
        console.log(
          "Failed to reuse existing hotel data, proceeding with new API call"
        );
        // Continue with API call if parsing fails
      }
    }

    // Construct the prompt to get hotel details in JSON format
    const prompt = `You are "Hotel Booker". Provide detailed information about the hotel "${hotelName}" in JSON format only.
        Include these fields if available:
        - name: Full hotel name.
        - rating: Star rating (e.g., "4.5 Stars") or user score (e.g., "8.8/10").
        - price_range: Price category (e.g., "$$", "$$$$", "Budget", "Luxury") or approximate range (e.g., "$150-$250").
        - address: Full street address.
        - location_description: Brief description of location (e.g., "Downtown near Convention Center", "5 miles from Airport").
        - phone: Contact phone number.
        - website: Official website URL.
        - description: A detailed paragraph describing the hotel (4-6 sentences). Include information about its style, ambiance, history if notable, and key selling points.
        - amenities: Array of at least 6-8 key amenities (strings, e.g., ["Free WiFi", "Swimming Pool", "Fitness Center", "Restaurant", "Pet-friendly", "Free Breakfast"]).
        - features: Array of 4-6 other notable features (strings, e.g., ["Spa Services", "Business Center", "Airport Shuttle", "Ocean View Rooms"]).
        - categories: Array of relevant categories (strings, e.g., ["Business", "Family-friendly", "Luxury", "Budget", "Airport Hotel"]).
        - image_url: Suggest a relevant placeholder image URL from a service like Unsplash or Pexels that represents this type of hotel.
        - nearby_attractions: Array of 3-5 nearby points of interest or attractions.

        Return *only* the valid JSON object. Do not include any introductory text, backticks, or explanations. If information for a field is unavailable, omit the field or use "N/A".`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // More factual for details
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0].content) {
      let jsonString = data.candidates[0].content.parts[0].text;
      // Clean potential markdown/formatting around the JSON
      jsonString = jsonString.replace(/^```json\s*|```$/g, "").trim();

      try {
        const hotelData = JSON.parse(jsonString);
        populateHotelDetailsModal(hotelData);
      } catch (e) {
        console.error(
          "Failed to parse JSON response for hotel details:",
          e,
          "\nRaw response:",
          jsonString
        );
        showErrorInHotelModal(
          hotelName,
          "Could not process the hotel details. The format received was unexpected."
        );
      }
    } else {
      throw new Error("No details received from API.");
    }
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    showErrorInHotelModal(
      hotelName,
      `Error retrieving hotel information: ${error.message}. Please try again later.`
    );
  }
}

// Populates the Hotel Details modal with data from a JSON object
function populateHotelDetailsModal(hotelData) {
  const titleElement = document.getElementById("hotel-details-title");
  const imageElement = document.getElementById("hotel-image");
  const ratingElement = document.getElementById("hotel-rating");
  const priceRangeElement = document.getElementById("hotel-price-range");
  const locationElement = document.getElementById("hotel-location");
  const categoriesElement = document.getElementById("hotel-categories");
  const descriptionElement = document.getElementById("hotel-description");
  const amenitiesElement = document.getElementById("hotel-amenities-list");
  const featuresElement = document.getElementById("hotel-features-info");
  const addressElement = document.getElementById("hotel-address"); // Hidden div
  const hotelDetailsModal = document.getElementById("hotel-details-modal");

  titleElement.textContent = hotelData.name || "Hotel Details";
  imageElement.src =
    hotelData.image_url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&q=80&w=800";
  imageElement.alt = `${hotelData.name || "Hotel"} Image`;

  ratingElement.innerHTML = `<i class="fas fa-star"></i> ${
    hotelData.rating || "N/A"
  }`;
  priceRangeElement.innerHTML = `<i class="fas fa-dollar-sign"></i> ${
    hotelData.price_range || "N/A"
  }`;
  locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${
    hotelData.location_description || hotelData.address || "N/A"
  }`;

  // Store full address and website for button actions
  addressElement.textContent = hotelData.address || "";
  hotelDetailsModal.dataset.website = hotelData.website || ""; // Store website URL

  // Format description with better spacing
  descriptionElement.textContent =
    hotelData.description || "No description available.";

  // Populate categories with better styling
  categoriesElement.innerHTML = ""; // Clear previous
  if (
    hotelData.categories &&
    Array.isArray(hotelData.categories) &&
    hotelData.categories.length > 0
  ) {
    hotelData.categories.forEach((cat) => {
      if (cat && typeof cat === "string") {
        const tag = document.createElement("span");
        tag.className = "category-tag";
        tag.textContent = cat.trim();
        categoriesElement.appendChild(tag);
      }
    });
  } else {
    categoriesElement.innerHTML = '<span class="category-tag">General</span>'; // Default tag
  }

  // Populate amenities with icon-based formatting
  if (
    hotelData.amenities &&
    Array.isArray(hotelData.amenities) &&
    hotelData.amenities.length > 0
  ) {
    // Map common amenities to appropriate icons
    const amenityIcons = {
      wifi: "fa-wifi",
      internet: "fa-wifi",
      pool: "fa-swimming-pool",
      swim: "fa-swimming-pool",
      gym: "fa-dumbbell",
      fitness: "fa-dumbbell",
      restaurant: "fa-utensils",
      dining: "fa-utensils",
      breakfast: "fa-coffee",
      coffee: "fa-coffee",
      bar: "fa-glass-martini-alt",
      lounge: "fa-glass-martini-alt",
      parking: "fa-parking",
      garage: "fa-parking",
      pet: "fa-paw",
      dog: "fa-paw",
      cat: "fa-paw",
      air: "fa-fan",
      conditioning: "fa-fan",
      spa: "fa-spa",
      massage: "fa-spa",
      laundry: "fa-tshirt",
      cleaning: "fa-tshirt",
      tv: "fa-tv",
      television: "fa-tv",
      "room service": "fa-concierge-bell",
      concierge: "fa-concierge-bell",
      shuttle: "fa-shuttle-van",
      transport: "fa-shuttle-van",
      business: "fa-briefcase",
      meeting: "fa-briefcase",
      conference: "fa-briefcase",
      child: "fa-child",
      kids: "fa-child",
      baby: "fa-baby",
      family: "fa-users",
      garden: "fa-leaf",
      terrace: "fa-leaf",
    };

    // Create a grid layout for amenities
    let amenitiesHTML =
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';

    hotelData.amenities.forEach((item) => {
      if (item && typeof item === "string") {
        const itemLower = item.toLowerCase();
        let iconClass = "fa-check-circle"; // Default icon

        // Find a matching icon
        for (const [keyword, icon] of Object.entries(amenityIcons)) {
          if (itemLower.includes(keyword)) {
            iconClass = icon;
            break;
          }
        }

        amenitiesHTML += `
                  <div style="margin-bottom: 8px;">
                      <i class="fas ${iconClass}" style="color: var(--success-color); margin-right: 8px; width: 16px; text-align: center;"></i>
                      ${item.trim()}
                  </div>`;
      }
    });

    amenitiesHTML += "</div>";
    amenitiesElement.innerHTML = amenitiesHTML;
  } else {
    amenitiesElement.textContent = "No specific amenities listed.";
  }

  // Populate features with enhanced formatting
  if (
    hotelData.features &&
    Array.isArray(hotelData.features) &&
    hotelData.features.length > 0
  ) {
    let featuresHTML =
      '<div style="display: grid; grid-template-columns: 1fr; gap: 8px;">';

    hotelData.features.forEach((item) => {
      if (item && typeof item === "string") {
        featuresHTML += `
                  <div style="padding: 8px 12px; background: #f0f9fa; border-radius: 6px; margin-bottom: 4px;">
                      <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                      ${item.trim()}
                  </div>`;
      }
    });

    featuresHTML += "</div>";
    featuresElement.innerHTML = featuresHTML;
  } else {
    featuresElement.textContent = "No specific features listed.";
  }

  // If there are nearby attractions, add them
  if (
    hotelData.nearby_attractions &&
    Array.isArray(hotelData.nearby_attractions) &&
    hotelData.nearby_attractions.length > 0
  ) {
    // Create a new section for nearby attractions
    const modalBody = document.querySelector(".modal-body");

    // Check if we already have this section to avoid duplicates
    let attractionsSection = document.getElementById("hotel-attractions");
    if (!attractionsSection) {
      attractionsSection = document.createElement("div");
      attractionsSection.classList.add("resource-services");
      attractionsSection.id = "hotel-attractions";
      attractionsSection.innerHTML = `
              <h4><i class="fas fa-map-marked-alt"></i> Nearby Attractions</h4>
              <div id="hotel-attractions-list"></div>
          `;
      modalBody.appendChild(attractionsSection);
    }

    const attractionsList = document.getElementById("hotel-attractions-list");
    attractionsList.innerHTML = hotelData.nearby_attractions
      .map(
        (attraction) => `<div style="margin-bottom: 8px;">
              <i class="fas fa-landmark" style="color: var(--primary-color); margin-right: 8px;"></i>
              ${attraction}
          </div>`
      )
      .join("");
  }
}

// Shows an error message within the Hotel Details modal
function showErrorInHotelModal(hotelName, message) {
  document.getElementById("hotel-details-title").textContent = hotelName;
  document.getElementById("hotel-image").src =
    "https://via.placeholder.com/180x180?text=Error";
  document.getElementById("hotel-rating").innerHTML =
    '<i class="fas fa-star"></i> N/A';
  document.getElementById("hotel-price-range").innerHTML =
    '<i class="fas fa-dollar-sign"></i> N/A';
  document.getElementById("hotel-location").innerHTML =
    '<i class="fas fa-map-marker-alt"></i> N/A';
  document.getElementById("hotel-categories").innerHTML = "";
  document.getElementById("hotel-description").textContent = message;
  document.getElementById("hotel-amenities-list").textContent = "Not available";
  document.getElementById("hotel-features-info").textContent = "Not available";
  document.getElementById("hotel-address").textContent = "";
  document.getElementById("hotel-details-modal").dataset.website = "";
}

// Handles sending the user's message
function sendMessage() {
  const userInput = document.getElementById("user-input");
  const content = userInput.value.trim();

  if (content) {
    // Check if it's a comparison request
    if (
      content.toLowerCase().includes("compare") &&
      (content.toLowerCase().includes(" vs ") ||
        content.toLowerCase().includes(" versus "))
    ) {
      // Try to extract hotel names for the comparison modal
      const match = content
        .toLowerCase()
        .match(/compare\s+(.+?)\s+(?:vs|versus)\s+(.+)/);
      if (match && match[1] && match[2]) {
        const hotelA = match[1].trim();
        const hotelB = match[2].trim();
        // Open the comparison modal and pre-fill names
        document.getElementById("hotel-a").value = hotelA;
        document.getElementById("hotel-b").value = hotelB;
        document.getElementById("compare-hotels-modal").classList.add("active");
        // Optionally, add the user message and trigger comparison directly
        // addMessage("user", content);
        // compareHotels(hotelA, hotelB);
      } else {
        // If names can't be extracted, just send the message
        addMessage("user", content);
        getHotelResponse(content);
      }
    } else {
      // Process as a normal hotel search/query
      addMessage("user", content);
      getHotelResponse(content);
    }
    userInput.value = ""; // Clear input field
  }
}

// --- Utility Functions ---

// Shows a temporary notification toast
function showToast(message, type = "info") {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  toast.innerHTML = `${icon} ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode === document.body) {
      toast.remove();
    }
  }, 3000); // Remove after 3 seconds
}

// Exports the current chat history as a text file
function exportChat() {
  if (messages.length === 0) {
    showToast("No hotel search data to export", "error");
    return;
  }

  let exportText = "Hotel Booker Search Results\n"; // Updated title
  exportText += "===========================\n\n";

  messages.forEach((msg) => {
    const role = msg.role === "user" ? "You" : "Hotel Booker"; // Updated name
    const time = new Date(msg.timestamp).toLocaleString();
    // Strip HTML tags for plain text export
    const content = msg.content
      .replace(/<[^>]*>?/gm, "")
      .replace(/&nbsp;/g, " ");
    exportText += `[${time}] ${role}:\n`;
    exportText += `${content}\n\n`;
  });

  const blob = new Blob([exportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  a.href = url;
  a.download = `HotelBooker_Results_${date}.txt`; // Updated filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Hotel search data exported successfully", "success");
}

// Copies text to the clipboard
function copyToClipboard(text) {
  // Use the original, unformatted text if possible
  const plainText = text.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " "); // Basic HTML stripping
  navigator.clipboard.writeText(plainText).then(
    () => showToast("Copied to clipboard", "success"),
    () => showToast("Failed to copy", "error")
  );
}
