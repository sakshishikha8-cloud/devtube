// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const currentTheme = localStorage.getItem('devtube_theme') || 'dark';

if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggleBtn.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('devtube_theme', 'dark');
        themeToggleBtn.classList.replace('fa-sun', 'fa-moon');
        showToast("Dark Mode Enabled", "fa-moon");
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('devtube_theme', 'light');
        themeToggleBtn.classList.replace('fa-moon', 'fa-sun');
        showToast("Light Mode Enabled", "fa-sun");
    }
    // Refresh chart colors if it exists
    if(progressChartInstance) initDashboard(); 
});

// --- DYNAMIC BACKGROUND ANIMATION ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles;

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = Array.from({length: 60}, () => ({
        x: Math.random() * width, y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
    }));
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.z * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? `rgba(37, 99, 235, ${p.z / 3})` : `rgba(59, 130, 246, ${p.z / 3})`; 
        ctx.fill();
    });
    
    for (let i=0; i<particles.length; i++) {
        for (let j=i; j<particles.length; j++) {
            let dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            if (dist < 120) {
                ctx.beginPath(); 
                ctx.strokeStyle = isLight ? `rgba(71, 85, 105, ${0.15 - dist/800})` : `rgba(148, 163, 184, ${0.15 - dist/800})`;
                ctx.lineWidth = 1; ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
window.addEventListener('resize', initCanvas);
initCanvas(); animateParticles();

// --- UTILS ---
function showToast(message, icon = "fa-circle-check") {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.classList.add('toast');
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--accent-color)"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast); setTimeout(() => toast.remove(), 4000);
}

// Global User State
let currentUser = localStorage.getItem('devtube_user') || "Guest";
let userScore = parseInt(localStorage.getItem('devtube_score')) || 0;
let watchedCategories = JSON.parse(localStorage.getItem('devtube_watched_cats')) || { "DSA": 0, "Web Dev": 0, "Python": 0, "System Design": 0, "Machine Learning": 0, "Core CS": 0, "Web3": 0 };

// --- USER-CURATED VIDEO DATABASE ---
const rawVideos = [
    { id: "v1", title: "Python for Beginners - Full Course", channel: "Programming with Mosh", views: "32M", time: "4 years ago", youtubeId: "_uQrJ0TkZlc", category: "Python" },
    { id: "v2", title: "Python 100 Days of Code", channel: "CodeWithHarry", views: "15M", time: "1 year ago", youtubeId: "fzZNWqUJuA4", category: "Python" },
    { id: "v3", title: "Python Tutorial for Beginners (4 Hours)", channel: "freeCodeCamp", views: "41M", time: "5 years ago", youtubeId: "rfscVS0vtbw", category: "Python" },
    { id: "v5", title: "Python FastAPI Crash Course", channel: "freeCodeCamp", views: "1.2M", time: "2 years ago", youtubeId: "0sOvCWFmrtA", category: "Python" },
    { id: "v6", title: "Django Tutorial for Beginners", channel: "Programming with Mosh", views: "4M", time: "3 years ago", youtubeId: "rHux0gMZ3Eg", category: "Python" },
    { id: "v7", title: "Python Machine Learning", channel: "Programming with Mosh", views: "5M", time: "3 years ago", youtubeId: "7eh4d6sabA0", category: "Python" },
    { id: "v8", title: "Data Structures Easy to Advanced", channel: "freeCodeCamp", views: "8M", time: "4 years ago", youtubeId: "RBSGKlAvoiM", category: "DSA" },
    { id: "v9", title: "Algorithms and Data Structures Tutorial", channel: "freeCodeCamp", views: "4M", time: "3 years ago", youtubeId: "8hly31xKli0", category: "DSA" },
    { id: "v10", title: "Dynamic Programming - Learn to Solve", channel: "freeCodeCamp", views: "3M", time: "3 years ago", youtubeId: "oBt53YbR9Kk", category: "DSA" },
    { id: "v14", title: "Introduction to Big O Notation", channel: "CS Dojo", views: "2.5M", time: "6 years ago", youtubeId: "D6xkbGLQesk", category: "DSA" },
    { id: "v15", title: "Recursion in Software Engineering", channel: "freeCodeCamp", views: "1.2M", time: "2 years ago", youtubeId: "IJDJ0kBx2LM", category: "DSA" },
    { id: "v16", title: "Namaste JavaScript - Closures", channel: "Akshay Saini", views: "2.5M", time: "2 years ago", youtubeId: "qikxEIxsXco", category: "Web Dev" },
    { id: "v17", title: "React JS One Shot Complete Tutorial", channel: "CodeWithHarry", views: "6M", time: "1 year ago", youtubeId: "-mJFZp84TIY", category: "Web Dev" },
    { id: "v18", title: "Next.js 14 Full Course 2026", channel: "JavaScript Mastery", views: "1.8M", time: "3 months ago", youtubeId: "wm5gMKuwSYk", category: "Web Dev" },
    { id: "v19", title: "Learn CSS Grid in 20 Minutes", channel: "Web Dev Simplified", views: "3M", time: "3 years ago", youtubeId: "9zBsdzdE4sM", category: "Web Dev" },
    { id: "v20", title: "HTML & CSS Full Course", channel: "freeCodeCamp", views: "9M", time: "3 years ago", youtubeId: "G3e-cpL7ofc", category: "Web Dev" },
    { id: "v21", title: "Tailwind CSS Crash Course", channel: "Traversy Media", views: "2M", time: "2 years ago", youtubeId: "dFgzHOX84xQ", category: "Web Dev" },
    { id: "v22", title: "Node.js and Express.js - Full Course", channel: "freeCodeCamp", views: "4.5M", time: "3 years ago", youtubeId: "Oe421EPjeBE", category: "Web Dev" },
    { id: "v24", title: "Learn TypeScript in 50 Minutes", channel: "Programming with Mosh", views: "3.5M", time: "1 year ago", youtubeId: "d56mG7DezGs", category: "Web Dev" },
    { id: "v27", title: "System Design for Beginners Course", channel: "freeCodeCamp", views: "2.2M", time: "1 year ago", youtubeId: "m8Icp_Cid5o", category: "System Design" },
    { id: "v29", title: "Kubernetes in 1 Hour", channel: "TechWorld with Nana", views: "4M", time: "3 years ago", youtubeId: "X48VuDVv0do", category: "System Design" },
    { id: "v31", title: "SQL vs NoSQL Explained", channel: "Fireship", views: "1.5M", time: "3 years ago", youtubeId: "ZS_kXvOeQ5Y", category: "System Design" },
    { id: "v34", title: "TensorFlow 2.0 Complete Course", channel: "freeCodeCamp", views: "4M", time: "3 years ago", youtubeId: "tPYj3fFJGjk", category: "Machine Learning" },
    { id: "v35", title: "Let's build GPT: from scratch", channel: "Andrej Karpathy", views: "4.5M", time: "1 year ago", youtubeId: "kCc8FmEb1nY", category: "Machine Learning" },
    { id: "v36", title: "PyTorch for Deep Learning", channel: "freeCodeCamp", views: "2.5M", time: "1 year ago", youtubeId: "V_xro1bcAuA", category: "Machine Learning" },
    { id: "v37", title: "Operating Systems Crash Course", channel: "freeCodeCamp", views: "3M", time: "3 years ago", youtubeId: "mXw9ruZaxzQ", category: "Core CS" },
    { id: "v40", title: "Solidity Blockchain Development", channel: "freeCodeCamp", views: "3.5M", time: "2 years ago", youtubeId: "gyMwXuJrbJQ", category: "Web3" }
];

const videos = rawVideos.map(v => ({
    ...v, 
    thumbnail: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
    avatar: `https://ui-avatars.com/api/?name=${v.channel.replace(' ', '+')}&background=random`
}));

// --- STATE MANAGEMENT ---
let savedVideoIds = JSON.parse(localStorage.getItem('devtube_saved')) || [];
let activeCategory = "All";

// --- RENDER UI ---
const videoGrid = document.getElementById('video-grid');
const categoriesContainer = document.getElementById('categories');
// Automatically extracts unique categories from your array + adds "All"
const cats = ["All", ...new Set(videos.map(v => v.category))];

cats.forEach((cat, index) => {
    const span = document.createElement('span'); span.classList.add('category');
    if (index === 0) span.classList.add('active'); span.innerText = cat;
    span.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
        span.classList.add('active'); renderVideos(cat);
    });
    categoriesContainer.appendChild(span);
});

function renderVideos(filter = "All") {
    activeCategory = filter;
    videoGrid.innerHTML = ""; 
    
    let filteredVideos = filter === "All" ? videos : videos.filter(v => v.category === filter);
    if(filter === "Watch Later") {
        filteredVideos = videos.filter(v => savedVideoIds.includes(v.id));
    }

    if (filteredVideos.length === 0) {
        videoGrid.innerHTML = `<h3 style="grid-column: 1/-1; text-align:center; color: var(--text-secondary); margin-top: 50px;">No videos found here. Add some to Watch Later!</h3>`;
        return;
    }

    filteredVideos.forEach(video => {
        const isSaved = savedVideoIds.includes(video.id);
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');
        if(isSaved) videoCard.classList.add('is-saved');

        videoCard.innerHTML = `
            <div class="saved-badge"><i class="fa-solid fa-bookmark"></i></div>
            <div class="thumbnail-container"><img src="${video.thumbnail}" alt="Thumbnail" class="thumbnail" loading="lazy"></div>
            <div class="video-info">
                <img src="${video.avatar}" alt="Channel" class="channel-pic" loading="lazy">
                <div class="video-details">
                    <h4>${video.title}</h4><p>${video.channel}</p><p>${video.views} views • ${video.time}</p>
                </div>
            </div>`;
        videoCard.addEventListener('click', () => openVideoModal(video));
        videoGrid.appendChild(videoCard);
    });
}
renderVideos();


// --- SIDEBAR NAVIGATION (SPA ROUTING) ---
const browseView = document.getElementById('browse-view');
const dashboardView = document.getElementById('dashboard-view');

document.getElementById('nav-home').addEventListener('click', (e) => {
    setActiveNav(e.currentTarget);
    dashboardView.style.display = 'none';
    browseView.style.display = 'block';
    document.querySelectorAll('.category')[0].click();
});

document.getElementById('nav-saved').addEventListener('click', (e) => {
    setActiveNav(e.currentTarget);
    dashboardView.style.display = 'none';
    browseView.style.display = 'block';
    document.querySelectorAll('.category').forEach(c => c.classList.remove('active')); 
    renderVideos("Watch Later");
});

document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    setActiveNav(e.currentTarget);
    browseView.style.display = 'none';
    dashboardView.style.display = 'block';
    initDashboard(); // Render charts and stats
});

function setActiveNav(element) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    element.classList.add('active');
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('mobile-active');
}

document.getElementById('menu-btn').addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.toggle('mobile-active');
    } else {
        document.getElementById('sidebar').classList.toggle('collapsed');
    }
});


// --- DASHBOARD (Chart.js) LOGIC ---
let progressChartInstance = null;

function initDashboard() {
    document.getElementById('dash-xp').innerText = userScore;
    
    // Count total watched
    let totalWatched = 0;
    for (let cat in watchedCategories) totalWatched += watchedCategories[cat];
    document.getElementById('dash-watched').innerText = totalWatched;

    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (progressChartInstance) progressChartInstance.destroy();

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#475569' : '#f8fafc';

    // Remove empty categories from chart
    let cleanCategories = {};
    for (let cat in watchedCategories) {
        if(watchedCategories[cat] > 0) cleanCategories[cat] = watchedCategories[cat];
    }

    let labels = Object.keys(cleanCategories);
    let data = Object.values(cleanCategories);
    
    if(totalWatched === 0) {
        labels = ["Start learning to see stats!"];
        data = [100];
    }

    progressChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: textColor } }
            },
            cutout: '70%'
        }
    });
}


// --- MODALS & WORKSPACE PLAYER ---
const overlay = document.getElementById('overlay');
const codeEditor = document.getElementById('code-editor');
let currentActiveVideo = null;

function closeAllModals() {
    overlay.style.display = 'none';
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.getElementById('youtube-player').src = ""; 
    document.getElementById('sidebar').classList.remove('mobile-active'); 
}
overlay.addEventListener('click', closeAllModals);
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));

// Login
document.getElementById('nav-signin-btn').addEventListener('click', () => { overlay.style.display = 'block'; document.getElementById('login-modal').style.display = 'block'; });
document.getElementById('submit-login').addEventListener('click', () => {
    const user = document.getElementById('login-user').value.trim();
    if(user) {
        currentUser = user; localStorage.setItem('devtube_user', user);
        closeAllModals(); showToast(`Welcome, ${user}!`, "fa-hand-wave");
        document.getElementById('nav-signin-btn').innerHTML = `<img src="https://ui-avatars.com/api/?name=${user}&background=0D8ABC&color=fff" class="channel-pic" style="width:25px;height:25px;margin-right:5px;"> ${user}`;
    }
});

// Video Opening & Workspace Loading
function openVideoModal(video) {
    currentActiveVideo = video;
    overlay.style.display = 'block'; document.getElementById('video-modal').style.display = 'block';
    document.getElementById('modal-video-title').innerText = video.title;
    
    document.getElementById('youtube-player').src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`;
    
    // Auto-load saved code notes
    const savedNotes = localStorage.getItem('notes_' + video.id);
    if(savedNotes) {
        codeEditor.value = savedNotes;
    } else {
        codeEditor.value = ""; 
    }

    const saveBtn = document.getElementById('save-video-btn');
    if(video.id.startsWith("custom")) {
        saveBtn.style.display = 'none';
    } else {
        saveBtn.style.display = 'inline-block';
        if(savedVideoIds.includes(video.id)) {
            saveBtn.classList.add('active'); document.getElementById('save-btn-text').innerText = "Saved";
        } else {
            saveBtn.classList.remove('active'); document.getElementById('save-btn-text').innerText = "Watch Later";
        }
        
        // Track analytics for Dashboard
        if(video.category && watchedCategories[video.category] !== undefined) {
            watchedCategories[video.category]++;
        } else if (video.category) {
            watchedCategories[video.category] = 1;
        }
        localStorage.setItem('devtube_watched_cats', JSON.stringify(watchedCategories));
    }
    incrementStreakOnWatch();
}

// Auto-save Code Workspace Notes on input
codeEditor.addEventListener('input', () => {
    if(currentActiveVideo) {
        localStorage.setItem('notes_' + currentActiveVideo.id, codeEditor.value);
    }
});

// Watch Later Toggle
document.getElementById('save-video-btn').addEventListener('click', function() {
    if(!currentActiveVideo || currentActiveVideo.id.startsWith("custom")) return;
    const id = currentActiveVideo.id;
    if(savedVideoIds.includes(id)) {
        savedVideoIds = savedVideoIds.filter(v => v !== id);
        this.classList.remove('active'); document.getElementById('save-btn-text').innerText = "Watch Later";
        showToast("Removed from Watch Later.", "fa-bookmark-slash");
    } else {
        savedVideoIds.push(id);
        this.classList.add('active'); document.getElementById('save-btn-text').innerText = "Saved";
        showToast("Saved to Watch Later!", "fa-bookmark");
    }
    localStorage.setItem('devtube_saved', JSON.stringify(savedVideoIds));
    if(activeCategory === "Watch Later") renderVideos("Watch Later"); 
});


// --- DISTRACTION-FREE CUSTOM URL PLAYER ---
document.getElementById('custom-url-btn').addEventListener('click', () => {
    overlay.style.display = 'block'; 
    document.getElementById('url-modal').style.display = 'block';
});

document.getElementById('play-custom-btn').addEventListener('click', () => {
    const url = document.getElementById('custom-yt-url').value.trim();
    if(!url) return showToast("Please paste a URL.", "fa-circle-exclamation");
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);

    if (match && match[1].length === 11) {
        closeAllModals(); 
        openVideoModal({ id: "custom_" + match[1], title: "Distraction-Free Workspace", youtubeId: match[1] });
        document.getElementById('custom-yt-url').value = ''; 
    } else {
        showToast("Invalid YouTube URL. Please try again.", "fa-circle-xmark");
    }
});


// --- STREAK SYSTEM ---
const streakCountDisplay = document.getElementById('streak-count');
const streakMsg = document.getElementById('streak-msg');
const fireIcon = document.getElementById('fire-icon');
const getTodayString = () => new Date().toISOString().split('T')[0];

function initStreak() {
    let streak = parseInt(localStorage.getItem('devtube_streak')) || 0;
    let lastCheckIn = localStorage.getItem('devtube_last_checkin');
    const today = getTodayString();
    
    if (lastCheckIn) {
        const diffDays = Math.ceil(Math.abs(new Date(today) - new Date(lastCheckIn)) / (1000 * 60 * 60 * 24)); 
        if (diffDays > 1) { streak = 0; localStorage.setItem('devtube_streak', streak); }
    }
    streakCountDisplay.innerText = streak;
    if (lastCheckIn === today) {
        fireIcon.classList.add('streak-active');
        streakMsg.innerHTML = "Streak secured for today! Keep learning. 🔥";
    }
}

function incrementStreakOnWatch() {
    let streak = parseInt(localStorage.getItem('devtube_streak')) || 0;
    const today = getTodayString();
    let lastCheckIn = localStorage.getItem('devtube_last_checkin');

    if (lastCheckIn !== today) {
        streak += 1;
        localStorage.setItem('devtube_streak', streak);
        localStorage.setItem('devtube_last_checkin', today);
        streakCountDisplay.innerText = streak;
        fireIcon.classList.add('streak-active');
        streakMsg.innerHTML = "Awesome! Lecture completed, streak increased! 🔥";
        showToast(`Streak updated to ${streak} days!`, "fa-fire");
    }
}
initStreak();


// --- QUIZ & LEADERBOARD SYSTEM ---
const quizzes = {
    "DSA": [
        { q: "What is the time complexity of Binary Search?", opts: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], ans: 1 },
        { q: "Which data structure uses LIFO?", opts: ["Queue", "Tree", "Stack", "Graph"], ans: 2 }
    ],
    "Web Dev": [
        { q: "Which hook is used to manage state in React?", opts: ["useEffect", "useContext", "useState", "useReducer"], ans: 2 }
    ],
    "Python": [
        { q: "How do you define a function in Python?", opts: ["function()", "def name():", "create name():", "void name()"], ans: 1 }
    ]
};

let currentQuizTopic = "";

document.getElementById('nav-quizzes').addEventListener('click', () => {
    closeAllModals(); overlay.style.display = 'block';
    const modal = document.getElementById('quiz-modal'); modal.style.display = 'block';
    const container = document.getElementById('quiz-topics-container');
    container.innerHTML = "";
    Object.keys(quizzes).forEach(topic => {
        const btn = document.createElement('button'); btn.classList.add('quiz-topic-btn');
        btn.innerHTML = `<span>${topic} Quiz</span> <i class="fa-solid fa-arrow-right"></i>`;
        btn.addEventListener('click', () => openQuiz(topic));
        container.appendChild(btn);
    });
});

function openQuiz(topic) {
    document.getElementById('quiz-modal').style.display = 'none';
    const qModal = document.getElementById('active-quiz-modal'); qModal.style.display = 'block';
    document.getElementById('quiz-title').innerText = `${topic} Quiz`;
    currentQuizTopic = topic;
    
    const container = document.getElementById('quiz-questions-container'); container.innerHTML = "";
    quizzes[topic].forEach((qData, index) => {
        const div = document.createElement('div'); div.classList.add('quiz-question');
        let html = `<h4>Q${index+1}: ${qData.q}</h4>`;
        qData.opts.forEach((opt, i) => {
            html += `<label class="quiz-option"><input type="radio" name="q${index}" value="${i}"> ${opt}</label>`;
        });
        div.innerHTML = html; container.appendChild(div);
    });
}

document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    const questions = quizzes[currentQuizTopic];
    let allAnswered = true;

    questions.forEach((qData, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if(!selected) { allAnswered = false; }
        else if(parseInt(selected.value) === qData.ans) { score += 10; }
    });

    if(!allAnswered) return showToast("Please answer all questions!", "fa-circle-exclamation");

    userScore += score;
    localStorage.setItem('devtube_score', userScore);
    closeAllModals();
    showToast(`Quiz completed! You scored ${score} points. Total Score: ${userScore}`, "fa-trophy");
});

document.getElementById('nav-leaderboard').addEventListener('click', () => {
    closeAllModals(); overlay.style.display = 'block'; document.getElementById('leaderboard-modal').style.display = 'block';
    let board = [
        { name: "Striver (Admin)", score: 950 },
        { name: "CodeNinja", score: 820 },
        { name: currentUser, score: userScore }
    ];
    board.sort((a,b) => b.score - a.score);
    const tbody = document.getElementById('leaderboard-body'); tbody.innerHTML = "";
    board.forEach((user, index) => {
        tbody.innerHTML += `<tr>
            <td>#${index + 1}</td>
            <td>${user.name === currentUser ? `<b>${user.name} (You)</b>` : user.name}</td>
            <td>${user.score} XP</td>
        </tr>`;
    });
});

// Search
document.getElementById('search-btn').addEventListener('click', () => {
    const q = document.getElementById('search-input').value.toLowerCase();
    if(!q) return;
    document.getElementById('nav-home').click(); // switch to browse view if hidden
    videoGrid.innerHTML = "";
    const filtered = videos.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q));
    if(filtered.length === 0) { videoGrid.innerHTML = `<h3 style="grid-column:1/-1;text-align:center;">No results found.</h3>`; return; }
    filtered.forEach(video => {
        const videoCard = document.createElement('div'); videoCard.classList.add('video-card');
        videoCard.innerHTML = `
            <div class="thumbnail-container"><img src="${video.thumbnail}" alt="Thumbnail" class="thumbnail" loading="lazy"></div>
            <div class="video-info"><img src="${video.avatar}" alt="Channel" class="channel-pic" loading="lazy">
                <div class="video-details"><h4>${video.title}</h4><p>${video.channel}</p><p>${video.views} views</p></div>
            </div>`;
        videoCard.addEventListener('click', () => openVideoModal(video));
        videoGrid.appendChild(videoCard);
    });
});

// --- AI ASSISTANT ---
const aiFab = document.getElementById('ai-fab');
const aiChatbot = document.getElementById('ai-chatbot');
aiFab.addEventListener('click', () => { aiChatbot.classList.add('active'); aiFab.style.transform = 'scale(0)'; });
document.getElementById('minimize-ai').addEventListener('click', () => { aiChatbot.classList.remove('active'); aiFab.style.transform = 'scale(1)'; });

document.getElementById('ai-send-btn').addEventListener('click', handleSendMessage);
document.getElementById('ai-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSendMessage(); });

function handleSendMessage() {
    const input = document.getElementById('ai-input'); const text = input.value.trim();
    if(!text) return;
    const aiMessages = document.getElementById('ai-messages');
    aiMessages.innerHTML += `<div class="msg user-msg">${text}</div>`; input.value = '';
    setTimeout(() => {
        let res = "I can help you build your roadmap! Try taking a Topic Quiz to test your skills.";
        if(text.toLowerCase().includes("python")) res = "For Python, check out the 'Python for Beginners' or 'Django' tutorials by Mosh in the Explorer!";
        aiMessages.innerHTML += `<div class="msg ai-msg">${res}</div>`;
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 1000);
}