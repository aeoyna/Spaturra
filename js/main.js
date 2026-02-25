window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // UI elements
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const scoreElement = document.getElementById('score-display');
    const finalScoreElement = document.getElementById('final-score');

    // Game state
    let game;
    let input = new InputHandler(); // Instantiate globally
    let audioManager = new AudioManager();
    let animationId;
    let isPlaying = false;

    // FPS Capping variables
    let lastTime = 0;
    const fps = 48; // Reduced to 80% (original 60)
    const frameInterval = 1000 / fps;

    // Reset game state
    function initGame() {
        audioManager.init(); // Initialize audio context on user gesture
        game = new Game(canvas.width, canvas.height, audioManager);
        game.updateLivesHUD(); // Initial HUD render
        scoreElement.innerText = 'Score: 0';
        isPlaying = true;

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        // Start game loop
        lastTime = performance.now();
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(animate);
    }

    function animate(currentTime) {
        if (!game.gameOver) {
            animationId = requestAnimationFrame(animate);
        } else {
            isPlaying = false;
            // Auto-restart after 2 seconds
            setTimeout(() => {
                if (!isPlaying) {
                    initGame();
                }
            }, 2000);
            return; // Stop processing frame if game over
        }

        const deltaTime = currentTime - lastTime;

        // Only update and draw if enough time has passed (capping to 60 FPS)
        if (deltaTime >= frameInterval) {
            lastTime = currentTime - (deltaTime % frameInterval);

            // Clear screen and fill with solid black background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Reset context properties to prevent style bleeding
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;

            // Update game logic
            game.update(input); // Pass input down to player

            // Draw scene
            game.draw(ctx);
        }
    }

    // Input listeners for UI
    // Start Button Listener (click for desktop, touchend for mobile)
    const startButton = document.getElementById('start-button');
    const handleStart = () => {
        if (!isPlaying) {
            initGame();
        }
    };
    if (startButton) {
        startButton.addEventListener('click', handleStart);
        startButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleStart();
        });
    }

    window.addEventListener('keydown', e => {
        if (e.code === 'Enter' || e.code === 'Space') {
            if (!isPlaying) {
                initGame();
            }
        }
    });

    // Allow clicking OR touching anywhere to start
    window.addEventListener('click', handleStart);
    window.addEventListener('touchend', (e) => {
        // Only fire if not on a specific UI button (prevent double-fire)
        if (e.target.id !== 'start-button') {
            handleStart();
        }
    });

    // Initial draw to show something before start
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw initial starfield statically
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
    }
});
