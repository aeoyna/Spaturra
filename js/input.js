class InputHandler {
    constructor() {
        this.keys = {};

        // Touch state for mobile controls
        this.touchActive = false;
        this.touchX = null;
        this.touchY = null;
        this.touchStartX = null;
        this.touchStartY = null;

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault(); // Prevent scrolling
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.touchActive = true;
                this.touchX = (touch.clientX - rect.left) * scaleX;
                this.touchY = (touch.clientY - rect.top) * scaleY;
                this.touchStartX = this.touchX;
                this.touchStartY = this.touchY;
            }, { passive: false });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.touchX = (touch.clientX - rect.left) * scaleX;
                this.touchY = (touch.clientY - rect.top) * scaleY;
            }, { passive: false });

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchActive = false;
                this.touchX = null;
                this.touchY = null;
            }, { passive: false });
        }
    }

    isDown(code) {
        return this.keys[code] === true;
    }
}
