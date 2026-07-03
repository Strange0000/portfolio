document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initTypingEffect();
    initNavigation();
    initScrollReveal();
    initStatsCounter();
    initCardGlow();
    initTiltEffect();
    initScrollToTop();
    initSmoothScroll();
    initVoiceSynthesis();
    initComments();
    initThemeToggle();
    initAdminMode();
});

/* ================================================
   THEME TOGGLE
   ================================================ */
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';
        let newIcon = '<i class="fas fa-moon"></i>';

        if (currentTheme === 'light') {
            newTheme = 'dark';
            newIcon = '<i class="fas fa-sun"></i>';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        btn.innerHTML = newIcon;
    });
}

/* ================================================
   VOICE SYNTHESIS & SCROLL READER
   ================================================ */
window.isVoiceActive = false;
window.currentSpokenSection = '';

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

function initVoiceSynthesis() {
    const btn = document.getElementById('voiceBtn');
    if (!btn || !('speechSynthesis' in window)) {
        if(btn) btn.style.display = 'none';
        return;
    }

    const initialText = "Voice assistant activated. I will read out the sections as you scroll.";

    btn.addEventListener('click', () => {
        window.isVoiceActive = !window.isVoiceActive;
        if (window.isVoiceActive) {
            btn.classList.add('speaking');
            speakText(initialText);
        } else {
            btn.classList.remove('speaking');
            window.speechSynthesis.cancel();
            window.currentSpokenSection = '';
        }
    });
}

/* ================================================
   COMMENTS SYSTEM
   ================================================ */
function initComments() {
    const form = document.getElementById('commentForm');
    const slider = document.querySelector('.testimonials-slider');
    
    if (!form || !slider || typeof db === 'undefined') return;

    // Load comments in real-time from Firestore
    db.collection('comments').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
        slider.innerHTML = '';
        
        if (snapshot.empty) {
            slider.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No comments yet. Be the first to share your thoughts!</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const newComment = document.createElement('div');
            newComment.className = 'testimonial-card revealed';
            // Store ID for deletion
            newComment.dataset.id = doc.id;
            
            newComment.innerHTML = `
                <button class="btn-delete-comment" title="Delete Comment" onclick="deleteComment('${doc.id}')"><i class="fas fa-trash"></i></button>
                <i class="fas fa-quote-left quote-icon"></i>
                <p class="t-text">"${data.text}"</p>
                <div class="t-author">
                    <div class="t-avatar" style="background: linear-gradient(135deg, #f43f5e, #f97316);"><i class="fas ${data.icon || 'fa-user'}"></i></div>
                    <div class="t-info">
                        <h4>${data.name}</h4>
                        <span>${data.designation}</span>
                    </div>
                </div>
            `;
            slider.appendChild(newComment);
        });
        
        // Auto scroll to the end when a new comment is added (if multiple exist)
        if (slider.lastElementChild && snapshot.docChanges().some(change => change.type === 'added')) {
            slider.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('commentName').value.trim();
        const desigField = document.getElementById('commentDesignation');
        const designation = desigField && desigField.value.trim() ? desigField.value.trim() : 'Visitor';
        const text = document.getElementById('commentText').value.trim();
        
        if (!name || !text) return;

        const icons = ['fa-user', 'fa-user-ninja', 'fa-user-secret', 'fa-user-astronaut', 'fa-smile'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        
        const btn = form.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-glow-text">Posting...</span>';
        btn.disabled = true;

        // Save to Firebase
        db.collection('comments').add({
            name: name,
            designation: designation,
            text: text,
            icon: randomIcon,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            form.reset();
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-glow-text">Posted!</span><span class="btn-glow-icon"><i class="fas fa-check"></i></span>';
            btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        }).catch((error) => {
            console.error("Error adding document: ", error);
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert("Error posting comment. Please try again.");
        });
    });
}

// Global function for admin deletion
window.deleteComment = function(id) {
    if (confirm("Are you sure you want to delete this comment?")) {
        db.collection('comments').doc(id).delete().then(() => {
            console.log("Document successfully deleted!");
        }).catch((error) => {
            console.error("Error removing document: ", error);
            alert("Error deleting comment!");
        });
    }
}

/* ================================================
   CUSTOM CURSOR
   ================================================ */
function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || window.innerWidth < 768) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
        dot.style.transition = 'none';
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.45;
        ringY += (mouseY - ringY) * 0.45;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('a, button, [data-magnetic], .skill-pill, .contact-link-card, .project-showcase');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
}

/* ================================================
   TYPING EFFECT
   ================================================ */
function initTypingEffect() {
    const el = document.getElementById('typedText');
    if (!el) return;

    const words = [
        'Data Scientist',
        'ML Engineer',
        'Computer Vision Dev',
        'Deep Learning Researcher',
        'Problem Solver',
        'Software Developer'
    ];

    let wordIdx = 0, charIdx = 0, deleting = false, speed = 80;

    function type() {
        const word = words[wordIdx];
        if (deleting) {
            el.textContent = word.substring(0, charIdx - 1);
            charIdx--;
            speed = 35;
        } else {
            el.textContent = word.substring(0, charIdx + 1);
            charIdx++;
            speed = 80;
        }

        if (!deleting && charIdx === word.length) {
            speed = 2200;
            deleting = true;
        } else if (deleting && charIdx === 0) {
            deleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 400;
        }

        setTimeout(type, speed);
    }

    setTimeout(type, 800);
}

/* ================================================
   NAVIGATION
   ================================================ */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const allLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        updateActiveLink();
    });

    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            links.classList.toggle('active');
        });
    }

    allLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('active');
        });
    });
}

function updateActiveLink() {
    const sections = document.querySelectorAll('.section, .hero');
    const links = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(sec => {
        const top = sec.offsetTop - 150;
        if (window.scrollY >= top) current = sec.id;
    });

    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });

    if (window.isVoiceActive && current && current !== window.currentSpokenSection) {
        window.currentSpokenSection = current;
        const sectionPhrases = {
            'home': 'Home section.',
            'about': 'About Me section. Discover my background and education.',
            'skills': 'Tech Stack section. Exploring my tools and technologies.',
            'projects': 'Projects section. View my featured work and live demos.',
            'experience': 'Journey section. My professional experience.',
            'testimonials': 'Feedback section. See what people say about my work.',
            'contact': 'Contact section. Get in touch or book a call.'
        };
        speakText(sectionPhrases[current] || `You are in the ${current} section.`);
    }
}

/* ================================================
   SCROLL REVEAL
   ================================================ */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-up');
    
    // Immediately reveal hero elements
    document.querySelectorAll('.hero .reveal-up').forEach(el => {
        setTimeout(() => el.classList.add('revealed'), 100);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(el => {
        if (!el.closest('.hero')) {
            observer.observe(el);
        }
    });
}

/* ================================================
   STATS COUNTER
   ================================================ */
function initStatsCounter() {
    const values = document.querySelectorAll('.metric-value');
    let started = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !started) {
                started = true;
                values.forEach(el => {
                    if (el.dataset.target) {
                        const target = parseInt(el.dataset.target);
                        if (!isNaN(target)) {
                            animateCount(el, target);
                        }
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    const metrics = document.querySelector('.hero-metrics');
    if (metrics) observer.observe(metrics);
}

function animateCount(el, target) {
    let current = 0;
    const step = target / 50;
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            el.textContent = target;
            clearInterval(interval);
        } else {
            el.textContent = Math.floor(current);
        }
    }, 30);
}

/* ================================================
   CARD GLOW EFFECT (Cursor-tracking)
   ================================================ */
function initCardGlow() {
    const cards = document.querySelectorAll('.skill-domain-card, .journey-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });
    });
}

/* ================================================
   3D TILT EFFECT
   ================================================ */
function initTiltEffect() {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            el.style.transform = `
                perspective(1000px)
                rotateY(${x * 8}deg)
                rotateX(${-y * 8}deg)
                scale3d(1.02, 1.02, 1.02)
            `;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale3d(1,1,1)';
            el.style.transition = 'transform 0.5s ease';
        });

        el.addEventListener('mouseenter', () => {
            el.style.transition = 'none';
        });
    });
}

/* ================================================
   SCROLL TO TOP
   ================================================ */
function initScrollToTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ================================================
   SMOOTH SCROLL
   ================================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/* ================================================
   ADMIN MODE (Delete Comments)
   ================================================ */
function initAdminMode() {
    // Enable via URL param or hash (hash works better for local file:// URLs)
    if (window.location.search.includes('admin=true') || window.location.hash.includes('admin=true')) {
        document.body.classList.add('admin-mode');
    }

    // Enable via secret keyboard shortcut (type "admin")
    let keys = [];
    window.addEventListener('keydown', (e) => {
        keys.push(e.key.toLowerCase());
        if (keys.length > 5) keys.shift();
        if (keys.join('').includes('admin')) {
            document.body.classList.toggle('admin-mode');
            keys = [];
        }
    });

    // Add delete buttons to existing hardcoded testimonials (if any exist)
    document.querySelectorAll('.testimonial-card').forEach(card => {
        if (!card.querySelector('.btn-delete-comment')) {
            const btn = document.createElement('button');
            btn.className = 'btn-delete-comment';
            btn.title = 'Delete Comment';
            btn.innerHTML = '<i class="fas fa-trash"></i>';
            card.appendChild(btn);
        }
    });
}
