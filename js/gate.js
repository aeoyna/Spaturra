class Gate {
    constructor(game, x, modifier) {
        this.game = game;
        this.width = 120;
        this.height = 40;
        this.x = x;
        this.y = -this.height; // Start offscreen top
        this.modifier = modifier; // String: e.g. "x2", "x3", "-1", "-2"
        this.speedY = 1.5; // Slow downward movement
        this.markedForDeletion = false;

        this.isPenalty = this.modifier.startsWith('-');

        // Visuals
        if (this.isPenalty) {
            this.color = 'rgba(255, 50, 50, 0.4)'; // Semi-transparent red
            this.borderColor = '#ff3333';
        } else {
            this.color = 'rgba(0, 255, 204, 0.4)'; // Semi-transparent cyan
            this.borderColor = '#00ffcc';
        }
    }

    update() {
        this.y += this.speedY;

        // Cleanup if it goes off bottom of screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw transparent box
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw glowing border look (no actual shadow to save performance)
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw Text ("x2")
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.modifier, this.x + this.width / 2, this.y + this.height / 2);
    }
}
