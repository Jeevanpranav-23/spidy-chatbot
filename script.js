// DOM Elements
const statusElement = document.getElementById('status');
const responseElement = document.getElementById('response');
const micButton = document.getElementById('micButton');

// Check browser support
if (!('webkitSpeechRecognition' in window)) {
  statusElement.innerHTML = "⚠️ Voice commands not supported (Use Chrome/Edge)";
  micButton.disabled = true;
} else {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  // Speech Synthesis
  const synth = window.speechSynthesis;

  // Wake word and states
  const WAKE_WORD = "spidy";
  let isAwake = false;
  let lastActivity = Date.now();

  // Update UI status
  function updateStatus(text, icon = "fa-microphone-slash", color = "") {
    statusElement.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
    if (color) statusElement.style.color = color;
  }

  // Make the bot speak
  function speak(text, priority = false) {
    if (synth.speaking && !priority) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (Date.now() - lastActivity > 30000) { // 30s inactivity timeout
        updateStatus("Sleeping", "fa-moon", "#aaa");
      }
    };
    synth.speak(utterance);
    responseElement.innerHTML = `<p>${text}</p>`;
    lastActivity = Date.now();
  }

  // Process commands (OK Google-like features)
  function processCommand(command) {
    command = command.toLowerCase().trim();
    console.log("Processing:", command);

    // 1. Website Opening
    if (command.match(/open (youtube|google|gmail|maps|drive)/)) {
      const site = command.match(/open (youtube|google|gmail|maps|drive)/)[1];
      const urls = {
        youtube: "https://youtube.com",
        google: "https://google.com",
        gmail: "https://mail.google.com",
        maps: "https://maps.google.com",
        drive: "https://drive.google.com"
      };
      window.open(urls[site], '_blank');
      speak(`Opening ${site}`);
    }
    
    // 2. Search Commands
    else if (command.match(/(search|look up) (.+)/)) {
      const query = command.split(/(search|look up)/)[2].trim();
      window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      speak(`Searching for ${query}`);
    }
    
    // 3. Time/Date
    else if (command.includes('time')) {
      const time = new Date().toLocaleTimeString();
      speak(`It's ${time}`);
    }
    else if (command.includes('date')) {
      const date = new Date().toLocaleDateString();
      speak(`Today is ${date}`);
    }
    
    // 4. Calculator
    else if (command.match(/(calculate|what is) (.+)/)) {
      try {
        const expr = command.split(/(calculate|what is)/)[2].trim();
        const result = eval(expr.replace(/x/g, '*').replace(/÷/g, '/'));
        speak(`${expr} equals ${result}`);
      } catch {
        speak("I couldn't calculate that");
      }
    }
    
    // 5. Navigation
    else if (command.includes('navigate to') || command.includes('directions to')) {
      const location = command.split(/to (.+)/)[1];
      window.open(`https://maps.google.com?q=${encodeURIComponent(location)}`, '_blank');
      speak(`Getting directions to ${location}`);
    }
    
    // 6. Jokes
    else if (command.includes('tell me a joke')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Parallel lines have so much in common... it's a shame they'll never meet."
      ];
      speak(jokes[Math.floor(Math.random() * jokes.length)]);
    }
    
    // 7. Weather (placeholder - would need API in real implementation)
    else if (command.includes('weather')) {
      const location = command.split(/weather (in|at|for)?/)[2]?.trim() || "your location";
      speak(`I'd normally check the weather in ${location}, but you need a weather API for this.`);
    }
    
    // 8. System Commands
    else if (command.includes('scroll down')) {
      window.scrollBy(0, 200);
      speak("Scrolled down");
    }
    else if (command.includes('scroll up')) {
      window.scrollBy(0, -200);
      speak("Scrolled up");
    }
    
    // 9. Default
    else {
      speak("Try saying: 'Open YouTube', 'Search for cats', or 'What time is it?'");
    }
  }

  // Voice recognition handler
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('')
      .toLowerCase();

    if (!isAwake && transcript.includes(WAKE_WORD)) {
      isAwake = true;
      updateStatus("Listening...", "fa-microphone", "#4CAF50");
      micButton.classList.add("listening");
      speak("Yes? How can I help?", true);
      return;
    }

    if (isAwake && event.results[0].isFinal) {
      processCommand(transcript);
      isAwake = false;
      updateStatus("Say 'Spidy'", "fa-microphone-slash", "#6200ea");
      micButton.classList.remove("listening");
    }
  };

  // Error handling
  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    updateStatus("Error - try again", "fa-exclamation-circle", "red");
    isAwake = false;
    micButton.classList.remove("listening");
  };

  // Manual mic control
  micButton.addEventListener('click', () => {
    if (isAwake) {
      recognition.stop();
      isAwake = false;
      updateStatus("Mic off", "fa-microphone-slash", "#6200ea");
      micButton.classList.remove("listening");
    } else {
      recognition.start();
      updateStatus("Say 'Spidy'", "fa-microphone-slash", "#6200ea");
    }
  });

  // Auto-timeout
  setInterval(() => {
    if (Date.now() - lastActivity > 30000 && !isAwake) { // 30s timeout
      updateStatus("Sleeping", "fa-moon", "#aaa");
    }
  }, 5000);

  // Initial setup
  updateStatus("Say 'Spidy'", "fa-microphone-slash", "#6200ea");
  speak("Hello! Say 'Spidy' to activate me.");
}
