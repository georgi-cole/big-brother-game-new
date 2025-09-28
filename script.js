// Big Brother Game JavaScript
class BigBrotherGame {
    constructor() {
        this.players = [];
        this.currentWeek = 1;
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.bindEvents();
        this.generatePlayers(this.settings.playerCount || 12);
        this.updateGameStatus();
        this.renderCastTable();
        this.renderPlayerState();
        this.loadTvBackground();
    }

    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('bbGameSettings');
        return saved ? JSON.parse(saved) : {
            playerCount: 12,
            tvBackground: null,
            tvBackgroundMode: 'none' // 'none', 'legacy', 'css', 'video'
        };
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('bbGameSettings', JSON.stringify(this.settings));
    }

    // Bind all event listeners
    bindEvents() {
        // Player count change
        const playerCountSelect = document.getElementById('playerCount');
        playerCountSelect.value = this.settings.playerCount;
        playerCountSelect.addEventListener('change', (e) => {
            this.settings.playerCount = parseInt(e.target.value);
            this.saveSettings();
        });

        // Restart and New Game buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });

        // TV Background controls
        document.getElementById('bgImageInput').addEventListener('change', (e) => {
            this.handleBackgroundImageUpload(e);
        });

        document.getElementById('clearBgBtn').addEventListener('click', () => {
            this.clearTvBackground();
        });

        document.getElementById('videoModeBtn').addEventListener('click', () => {
            this.toggleVideoMode();
        });

        // Sidebar toggles
        document.getElementById('toggleLeftSidebar').addEventListener('click', () => {
            this.toggleSidebar('left');
        });

        document.getElementById('toggleRightSidebar').addEventListener('click', () => {
            this.toggleSidebar('right');
        });
    }

    // Generate players based on current count setting
    generatePlayers(count) {
        const names = [
            'Alex', 'Bailey', 'Casey', 'Drew', 'Emery', 'Finley', 
            'Grace', 'Harper', 'Indigo', 'Jordan', 'Kai', 'Logan',
            'Morgan', 'Nico', 'Oakley', 'Parker', 'Quinn', 'Riley'
        ];

        this.players = [];
        for (let i = 0; i < count; i++) {
            this.players.push({
                id: i + 1,
                name: names[i] || `Player ${i + 1}`,
                age: Math.floor(Math.random() * 20) + 21,
                status: 'safe',
                hohWins: 0,
                vetoWins: 0,
                nominations: 0,
                evictWeek: null
            });
        }
    }

    // Restart game with current settings (key fix for issue)
    restartGame() {
        // Read the LIVE value from the select, not cached default
        const playerCountSelect = document.getElementById('playerCount');
        const currentPlayerCount = parseInt(playerCountSelect.value);
        
        // Update settings with live value
        this.settings.playerCount = currentPlayerCount;
        this.saveSettings();

        // Regenerate players with new count
        this.generatePlayers(currentPlayerCount);
        this.currentWeek = 1;
        this.updateGameStatus();
        this.renderCastTable();
        this.renderPlayerState();

        console.log(`Game restarted with ${currentPlayerCount} players`);
    }

    // Start completely new game
    newGame() {
        this.restartGame(); // Same as restart for now
        this.triggerConfetti();
    }

    // Update game status display
    updateGameStatus() {
        const activePlayersCount = this.players.filter(p => p.status !== 'evicted').length;
        document.getElementById('currentWeek').textContent = this.currentWeek;
        document.getElementById('playersRemaining').textContent = activePlayersCount;
    }

    // Render the cast table
    renderCastTable() {
        const tbody = document.getElementById('castTableBody');
        tbody.innerHTML = '';

        this.players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td class="status-${player.status}">${this.formatStatus(player.status)}</td>
                <td>${player.hohWins}</td>
                <td>${player.vetoWins}</td>
                <td>${player.nominations}</td>
                <td class="evict-week-col">${player.evictWeek || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Render player state sidebar
    renderPlayerState() {
        const statePanel = document.getElementById('playerStateList');
        statePanel.innerHTML = '';

        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.classList.add('player-item');
            playerItem.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-status ${player.status}">${this.formatStatus(player.status)}</span>
            `;
            statePanel.appendChild(playerItem);
        });
    }

    // Format player status for display
    formatStatus(status) {
        switch (status) {
            case 'safe': return 'Safe';
            case 'nominated': return 'Nominated';
            case 'evicted': return 'Evicted';
            case 'hoh': return 'HOH';
            case 'veto': return 'Veto';
            default: return 'Safe';
        }
    }

    // TV Background Management - Multi-mode support (key fix for issue)
    setTvBackgroundImage(url, options = {}) {
        const tv = document.getElementById('tv');
        const tvBgElement = document.getElementById('tvBg');
        const tvBgVideo = document.getElementById('tvBgVideo');
        const mode = options.mode || 'auto';

        // Clear all existing background modes
        tv.classList.remove('hasTvBg', 'hasTvVideo');
        tv.style.setProperty('--tv-bg', 'none');
        tvBgElement.classList.remove('active');
        tvBgElement.style.backgroundImage = '';
        tvBgVideo.style.opacity = '0';
        tvBgVideo.src = '';

        if (!url) {
            this.settings.tvBackground = null;
            this.settings.tvBackgroundMode = 'none';
            this.saveSettings();
            return;
        }

        // Determine mode and apply background
        if (mode === 'legacy' || mode === 'auto') {
            // Legacy element mode - use #tvBg element
            tvBgElement.style.backgroundImage = `url(${url})`;
            tvBgElement.classList.add('active');
            this.settings.tvBackgroundMode = 'legacy';
        } else if (mode === 'css') {
            // CSS variable mode - use ::before pseudo-element
            tv.style.setProperty('--tv-bg', `url(${url})`);
            tv.classList.add('hasTvBg');
            this.settings.tvBackgroundMode = 'css';
        } else if (mode === 'video') {
            // Video mode
            tvBgVideo.src = url;
            tvBgVideo.style.opacity = '1';
            tv.classList.add('hasTvVideo');
            this.settings.tvBackgroundMode = 'video';
        }

        this.settings.tvBackground = url;
        this.saveSettings();
    }

    // Handle background image upload
    handleBackgroundImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.setTvBackgroundImage(e.target.result, { mode: 'legacy' });
            };
            reader.readAsDataURL(file);
        }
    }

    // Clear TV background
    clearTvBackground() {
        this.setTvBackgroundImage(null);
        document.getElementById('bgImageInput').value = '';
    }

    // Toggle video mode (demo functionality)
    toggleVideoMode() {
        const currentMode = this.settings.tvBackgroundMode;
        if (currentMode === 'video') {
            this.clearTvBackground();
        } else {
            // For demo, use a sample video URL or create a canvas-based animation
            this.createDemoVideo();
        }
    }

    // Create demo video background
    createDemoVideo() {
        const tv = document.getElementById('tv');
        const tvBgVideo = document.getElementById('tvBgVideo');
        
        // Create a canvas-based "video" for demo
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        
        let hue = 0;
        const animate = () => {
            ctx.fillStyle = `hsl(${hue}, 50%, 20%)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = `hsl(${hue + 180}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(canvas.width/2 + Math.sin(hue/20) * 100, canvas.height/2 + Math.cos(hue/30) * 50, 50, 0, Math.PI * 2);
            ctx.fill();
            
            hue += 2;
            if (hue > 360) hue = 0;
        };
        
        // Convert canvas to video-like stream
        const stream = canvas.captureStream(30);
        tvBgVideo.srcObject = stream;
        tv.classList.add('hasTvVideo');
        
        this.settings.tvBackgroundMode = 'video';
        this.saveSettings();
        
        // Start animation
        const animationId = setInterval(animate, 33); // ~30fps
        
        // Store animation ID to clear later
        tvBgVideo.dataset.animationId = animationId;
        
        animate(); // Start immediately
    }

    // Load saved TV background on init
    loadTvBackground() {
        if (this.settings.tvBackground) {
            this.setTvBackgroundImage(this.settings.tvBackground, { 
                mode: this.settings.tvBackgroundMode 
            });
        }
    }

    // Sidebar toggle functionality (key fix for issue)
    toggleSidebar(side) {
        const body = document.body;
        const button = document.getElementById(`toggle${side === 'left' ? 'Left' : 'Right'}Sidebar`);
        
        if (side === 'left') {
            body.classList.toggle('layout-no-left');
            button.textContent = body.classList.contains('layout-no-left') ? 'Show Left' : 'Hide Left';
        } else {
            body.classList.toggle('layout-no-right');
            button.textContent = body.classList.contains('layout-no-right') ? 'Show Right' : 'Hide Right';
        }
    }

    // Confetti effect
    triggerConfetti() {
        const container = document.getElementById('confetti');
        container.innerHTML = '';

        for (let i = 0; i < 50; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: hsl(${Math.random() * 360}, 70%, 60%);
                left: ${Math.random() * 100}%;
                top: -10px;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            container.appendChild(confettiPiece);
        }

        // Add CSS animation if not exists
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(calc(100vh + 20px)) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Clean up after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    // Simulate some game events for demo
    simulateGameEvents() {
        if (this.players.length > 0) {
            // Randomly nominate some players
            const safePlayers = this.players.filter(p => p.status === 'safe');
            if (safePlayers.length >= 2) {
                safePlayers[0].status = 'nominated';
                safePlayers[1].status = 'nominated';
            }
            
            // Pick HOH
            if (safePlayers.length > 2) {
                safePlayers[2].status = 'hoh';
                safePlayers[2].hohWins++;
            }

            this.renderCastTable();
            this.renderPlayerState();
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bbGame = new BigBrotherGame();
    
    // Add some demo functionality
    setTimeout(() => {
        window.bbGame.simulateGameEvents();
    }, 2000);
});

// Add some test functions for debugging
window.testPlayerCount = (count) => {
    document.getElementById('playerCount').value = count;
    window.bbGame.restartGame();
};

window.testTvBackground = (url) => {
    window.bbGame.setTvBackgroundImage(url, { mode: 'legacy' });
};