// --- Global Toast Notification Helper ---
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Theme Toggle Logic (Light / Dark Mode) ---
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
    const themeIcon = themeToggleBtn.querySelector('i');
    const body = document.body;
    const currentTheme = localStorage.getItem('skymode_theme');

    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        
        if (body.classList.contains('light-mode')) {
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('skymode_theme', 'light');
            showToast('Switched to Light Mode');
        } else {
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('skymode_theme', 'dark');
            showToast('Switched to Dark Mode');
        }
    });
}

// --- Sticky Navbar Effect ---
window.addEventListener("scroll", function() {
    const navbar = document.getElementById("navbar");
    if (navbar) {
        if (window.scrollY > 40) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
});

// --- Scroll Reveal Animation ---
function reveal() {
    var reveals = document.querySelectorAll(".reveal");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 80;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
reveal(); // Trigger once on load

// --- FAQ Accordion Logic ---
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    
    question.addEventListener("click", () => {
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove("active");
            }
        });
        item.classList.toggle("active");
    });
});

// --- Hero Telemetry, Real Country, Real IP, Device IP & Network Tools Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('toolsModal');
  const openBtn = document.getElementById('openToolsBtn');
  const closeBtn = document.getElementById('closeToolsBtn');
  const ipDisplay = document.getElementById('ipDisplay');
  const speedDisplay = document.getElementById('speedDisplay');
  const speedRingFill = document.getElementById('speedRingFill');
  const runSpeedTestBtn = document.getElementById('runSpeedTest');

  const heroCountryDisplay = document.getElementById('heroCountryDisplay');
  const heroIpDisplay = document.getElementById('heroIpDisplay');
  const heroDeviceIpDisplay = document.getElementById('heroDeviceIpDisplay');
  const heroServerCountry = document.getElementById('heroServerCountry');

  // Robust Live IP & Country Data Fetcher using ipwho.is with fallback
  async function fetchRealTelemetry() {
      let detectedIp = '104.28.19.82';
      let detectedCountry = 'Singapore';

      try {
          // Primary free geolocation API with zero CORS issues
          const res = await fetch('https://ipwho.is/');
          const data = await res.json();
          if (data && data.success) {
              detectedIp = data.ip || detectedIp;
              detectedCountry = data.country || detectedCountry;
          } else {
              // Fallback to ipapi.co
              const res2 = await fetch('https://ipapi.co/json/');
              const data2 = await res2.json();
              if (data2 && data2.ip) {
                  detectedIp = data2.ip;
                  detectedCountry = data2.country_name || detectedCountry;
              }
          }
      } catch (err) {
          try {
              // Second fallback to ipify for raw IP
              const res3 = await fetch('https://api.ipify.org?format=json');
              const data3 = await res3.json();
              if (data3 && data3.ip) {
                  detectedIp = data3.ip;
              }
          } catch (e) {
              // Keep default
          }
      }

      // Update Hero Telemetry Display Elements
      if (heroCountryDisplay) heroCountryDisplay.innerText = detectedCountry;
      if (heroIpDisplay) heroIpDisplay.innerText = detectedIp;
      if (heroDeviceIpDisplay) heroDeviceIpDisplay.innerText = detectedIp;
      if (heroServerCountry) heroServerCountry.innerText = `${detectedCountry} Secure Node`;
      if (ipDisplay) ipDisplay.innerText = detectedIp;
  }

  fetchRealTelemetry();

  if (openBtn && modal) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        fetchRealTelemetry();
      });
  }

  if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal) {
          modal.style.display = 'none';
      }
  });

  if (runSpeedTestBtn) {
      runSpeedTestBtn.addEventListener('click', async () => {
        runSpeedTestBtn.disabled = true;
        runSpeedTestBtn.innerText = "Testing...";
        if (speedDisplay) speedDisplay.innerText = "0.00";
        if (speedRingFill) speedRingFill.style.strokeDashoffset = "314";

        let progressInterval = setInterval(() => {
            let randomMock = (Math.random() * 60 + 20).toFixed(1);
            if (speedDisplay) speedDisplay.innerText = randomMock;
            if (speedRingFill) {
                let mockOffset = 314 - (randomMock / 100) * 314;
                speedRingFill.style.strokeDashoffset = Math.max(0, mockOffset);
            }
        }, 120);

        const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png" + "?r=" + Math.random();
        const downloadSize = 211599; 
        const startTime = new Date().getTime();

        try {
          const response = await fetch(imageUrl);
          await response.blob(); 
          
          const endTime = new Date().getTime();
          const durationInSeconds = (endTime - startTime) / 1000;
          const bitsLoaded = downloadSize * 8;
          const speedBps = bitsLoaded / durationInSeconds;
          const speedKbps = speedBps / 1024;
          const speedMbps = (speedKbps / 1024).toFixed(2);

          clearInterval(progressInterval);

          if (speedDisplay) speedDisplay.innerText = speedMbps;
          
          let percentage = Math.min(parseFloat(speedMbps) / 100, 1);
          let dashOffset = 314 - (percentage * 314);
          if (speedRingFill) speedRingFill.style.strokeDashoffset = dashOffset;

          showToast(`Speed Test Completed: ${speedMbps} Mbps`);
        } catch (error) {
          clearInterval(progressInterval);
          if (speedDisplay) speedDisplay.innerText = "Error";
          if (speedRingFill) speedRingFill.style.strokeDashoffset = "314";
        } finally {
          runSpeedTestBtn.disabled = false;
          runSpeedTestBtn.innerHTML = '<i class="fa-solid fa-gauge-high"></i> Test Again';
        }
      });
  }

  // --- AI Chat Assistant Interactive Logic ---
  const chatToggle = document.getElementById('aiChatToggle');
  const chatBox = document.getElementById('aiChatBox');
  const chatClose = document.getElementById('aiChatClose');
  const chatInput = document.getElementById('aiChatInput');
  const chatSend = document.getElementById('aiChatSend');
  const chatMessages = document.getElementById('aiChatMessages');

  if (chatToggle && chatBox) {
      chatToggle.addEventListener('click', () => {
          chatBox.classList.toggle('active');
          if (chatBox.classList.contains('active') && chatInput) {
              chatInput.focus();
          }
      });
  }

  if (chatClose && chatBox) {
      chatClose.addEventListener('click', () => {
          chatBox.classList.remove('active');
      });
  }

  function appendMessage(text, sender) {
      if (!chatMessages) return;
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('ai-message', sender === 'user' ? 'user-msg' : 'bot-msg');
      msgDiv.innerText = text;
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getAiResponse(query) {
      const q = query.toLowerCase();
      if (q.includes('price') || q.includes('plan') || q.includes('cost') || q.includes('package')) {
          return "We offer 3 high-speed plans: Starter (Rs.250/mo, 50GB), Standard (Rs.400/mo, 200GB - Most Popular), and Pro (Rs.500/mo, 300GB). Check out our Pricing section to select your plan!";
      } else if (q.includes('dialog') || q.includes('mobitel') || q.includes('isp') || q.includes('work') || q.includes('edu')) {
          return "Yes! Skymode VPN works seamlessly with Dialog and Mobitel educational or work packages using custom SNI bug hosts.";
      } else if (q.includes('app') || q.includes('client') || q.includes('netmod') || q.includes('v2rayng')) {
          return "We recommend 'Netmod' for Windows PC and 'v2rayNG' for Android mobile devices to run your V2Ray config link.";
      } else if (q.includes('bank') || q.includes('pay') || q.includes('transfer') || q.includes('account')) {
          return "Bank transfers can be made to Nations Trust Bank (FRIMI), Account No: 205003177364 under H K Thilina Madushanka. Remember to put ONLY your name in the payment remark!";
      } else if (q.includes('contact') || q.includes('admin') || q.includes('whatsapp') || q.includes('telegram')) {
          return "You can instantly reach our support team via WhatsApp or Telegram links found in the footer or during checkout verification.";
      } else {
          return "That's a great question! For custom connection support or instant server setup, please complete your order on our pricing page or reach our admins via WhatsApp.";
      }
  }

  function handleUserMessage() {
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage(text, 'user');
      chatInput.value = '';

      const typingDiv = document.createElement('div');
      typingDiv.classList.add('ai-message', 'bot-msg', 'ai-typing');
      typingDiv.innerHTML = '<span>.</span><span>.</span><span>.</span>';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      setTimeout(() => {
          chatMessages.removeChild(typingDiv);
          const reply = getAiResponse(text);
          appendMessage(reply, 'bot');
      }, 1000);
  }

  if (chatSend && chatInput) {
      chatSend.addEventListener('click', handleUserMessage);
      chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') handleUserMessage();
      });
  }
});