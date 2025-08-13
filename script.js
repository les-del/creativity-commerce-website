// GSAP ScrollTrigger Configuration
gsap.registerPlugin(ScrollTrigger);

// Initialize scroll panels
function initializeScrollPanels() {
  const panels = gsap.utils.toArray(".section");
  const tops = panels.map(panel => 
    ScrollTrigger.create({
      trigger: panel, 
      start: "top top"
    })
  );

  panels.forEach((panel, i) => {
    ScrollTrigger.create({
      trigger: panel,
      start: () => panel.offsetHeight < window.innerHeight ? "top top" : "bottom bottom",
      pin: true, 
      pinSpacing: false 
    });
  });

  // Snap scrolling
  ScrollTrigger.create({
    snap: {
      snapTo: (progress, self) => {
        const panelStarts = tops.map(st => st.start);
        const snapScroll = gsap.utils.snap(panelStarts, self.scroll());
        return gsap.utils.normalize(0, ScrollTrigger.maxScroll(window), snapScroll);
      },
      duration: 0.5
    }
  });

  // Fade in panels
  panels.slice(1).forEach((panel) => {
    gsap.set(panel, {opacity: 0});
    gsap.to(panel, {
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top bottom",
        end: "top top",
        scrub: true
      }
    });
  });
}

// Video Player Class
class VideoPlayer {
  constructor() {
    this.playButton = document.querySelector('.play-button');
    this.videoContainer = document.querySelector('.fullscreen-video-container');
    this.video = document.querySelector('.fullscreen-video');
    this.playPauseBtn = document.querySelector('.play-pause-btn');
    this.progressBar = document.querySelector('.progress-bar');
    this.progressContainer = document.querySelector('.progress-container');
    this.timeDisplay = document.querySelector('.time-display');
    
    this.isPlaying = false;
    this.init();
  }

  init() {
    if (!this.video || !this.playButton) {
      console.warn('Video elements not found');
      return;
    }

    this.bindEvents();
    this.setupVideoListeners();
  }

  bindEvents() {
    this.playButton?.addEventListener('click', () => this.openVideo());
    this.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
    this.progressContainer?.addEventListener('click', (e) => this.seekTo(e));
    
    // Handle Esc key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.videoContainer.style.display === 'block') {
        this.closeVideo();
      }
    });

    // Handle fullscreen changes
    this.setupFullscreenListeners();
  }

  setupVideoListeners() {
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
    this.video.addEventListener('ended', () => this.closeVideo());
  }

  setupFullscreenListeners() {
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'];
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
          this.closeVideo();
        }
      });
    });
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  enterFullscreen(element) {
    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }

  exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  }

  openVideo() {
    this.videoContainer.style.display = 'block';
    this.enterFullscreen(this.videoContainer);
    
    this.video.play().then(() => {
      this.isPlaying = true;
      this.playPauseBtn.textContent = '❚❚';
    }).catch(error => {
      console.error('Video play failed:', error);
      this.closeVideo();
    });
  }

  closeVideo() {
    this.video.pause();
    this.video.currentTime = 0;
    this.videoContainer.style.display = 'none';
    this.playPauseBtn.textContent = '▶';
    this.isPlaying = false;
    
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      this.exitFullscreen();
    }
  }

  togglePlayPause() {
    if (this.video.paused) {
      this.video.play().then(() => {
        this.isPlaying = true;
        this.playPauseBtn.textContent = '❚❚';
      }).catch(error => {
        console.error('Video play failed:', error);
      });
    } else {
      this.video.pause();
      this.isPlaying = false;
      this.playPauseBtn.textContent = '▶';
    }
  }

  updateProgress() {
    if (this.progressBar && this.video.duration) {
      const progress = (this.video.currentTime / this.video.duration) * 100;
      this.progressBar.style.width = `${progress}%`;
      this.updateTimeDisplay();
    }
  }

  updateTimeDisplay() {
    if (this.timeDisplay && this.video.duration) {
      this.timeDisplay.textContent = `${this.formatTime(this.video.currentTime)} / ${this.formatTime(this.video.duration)}`;
    }
  }

  seekTo(event) {
    if (!this.video.duration) return;
    
    const rect = this.progressContainer.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    this.video.currentTime = pos * this.video.duration;
  }
}

// Time Display Class
class TimeDisplay {
  constructor() {
    this.sydTimeElement = document.querySelector('.footer-time p:first-child');
    this.localTimeElement = document.querySelector('.footer-time p:last-child');
    
    this.sydTimeZone = 'Australia/Sydney';
    this.localCityCode = '---';
    this.localTimeZone = 'UTC';
    this.isInSydney = false;
    
    this.randomCities = [
      { code: 'NYC', tz: 'America/New_York' },
      { code: 'LDN', tz: 'Europe/London' },
      { code: 'TOK', tz: 'Asia/Tokyo' },
      { code: 'PAR', tz: 'Europe/Paris' },
      { code: 'LAX', tz: 'America/Los_Angeles' },
      { code: 'BER', tz: 'Europe/Berlin' },
      { code: 'DXB', tz: 'Asia/Dubai' },
      { code: 'SIN', tz: 'Asia/Singapore' },
      { code: 'JNB', tz: 'Africa/Johannesburg' },
      { code: 'RIO', tz: 'America/Sao_Paulo' }
    ];

    this.init();
  }

  init() {
    if (!this.sydTimeElement || !this.localTimeElement) {
      console.warn('Time elements not found');
      return;
    }

    this.setInitialTime();
    this.fetchLocalInfo();
    this.startTimeUpdates();
  }

  setInitialTime() {
    this.updateSydneyTime();
    if (this.localTimeElement) {
      this.localTimeElement.textContent = '--- --:--';
    }
  }

  formatTime(timeZone) {
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Time formatting failed:', error);
      return '--:--';
    }
  }

  updateSydneyTime() {
    if (this.sydTimeElement) {
      this.sydTimeElement.textContent = `SYD ${this.formatTime(this.sydTimeZone)}`;
    }
  }

  updateLocalTime() {
    if (this.localTimeElement && this.localCityCode !== '---') {
      this.localTimeElement.textContent = `${this.localCityCode} ${this.formatTime(this.localTimeZone)}`;
    }
  }

  pickRandomCity() {
    const randomIndex = Math.floor(Math.random() * this.randomCities.length);
    this.localCityCode = this.randomCities[randomIndex].code;
    this.localTimeZone = this.randomCities[randomIndex].tz;
  }

  async fetchLocalInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const city = data.city || 'Unknown';
      this.localTimeZone = data.timezone || 'UTC';
      this.localCityCode = city.slice(0, 3).toUpperCase();

      // Check if in Sydney
      if (city.toLowerCase() === 'sydney' || this.localTimeZone === 'Australia/Sydney') {
        this.isInSydney = true;
        this.pickRandomCity();
      }

      this.updateLocalTime();
    } catch (error) {
      console.warn('Error fetching local info:', error);
      // Fallback to random city
      this.pickRandomCity();
      this.updateLocalTime();
    }
  }

  startTimeUpdates() {
    // Update times every second
    setInterval(() => {
      this.updateSydneyTime();
      this.updateLocalTime();
    }, 1000);

    // Always cycle through random cities every 3 seconds
    setInterval(() => {
      this.pickRandomCity();
      this.updateLocalTime();
    }, 3000);
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeScrollPanels();
    new VideoPlayer();
    new TimeDisplay();
  } catch (error) {
    console.error('Initialization failed:', error);
  }
});

// Handle window resize to fix GSAP ScrollTrigger issues
let resizeTimer;
window.addEventListener('resize', () => {
  // Clear the timer
  clearTimeout(resizeTimer);
  
  // Set a new timer to refresh ScrollTrigger after resize is complete
  resizeTimer = setTimeout(() => {
    // Refresh all ScrollTrigger instances
    ScrollTrigger.refresh();
    
    // Force a reflow to ensure proper sizing
    document.body.offsetHeight;
  }, 250); // Wait 250ms after resize stops
});
