class Particle {
    constructor(game, x, y, type = 'explosion', color = '#ffaa00') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.markedForDeletion = false;

        if (this.type === 'explosion') {
            this.size = Math.random() * 10 + 5;
            this.speedX = (Math.random() - 0.5) * 6;
            this.speedY = (Math.random() - 0.5) * 6;
            this.timer = Math.random() * 20 + 10;
        } else if (this.type === 'spark') {
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 10;
            this.speedY = (Math.random() - 0.5) * 10;
            this.timer = Math.random() * 15 + 5;
            this.color = '#ffff00';
        } else if (this.type === 'smoke') {
            this.size = Math.random() * 15 + 10;
            this.speedX = (Math.random() - 0.5) * 2;
            this.speedY = Math.random() * -2 - 1; // drift up
            this.timer = Math.random() * 40 + 20;
            this.color = 'rgba(100, 100, 100, 0.5)';
        } else if (this.type === 'trail') {
            this.size = Math.random() * 5 + 2;
            this.speedX = 0;
            this.speedY = Math.random() * 2 + 1;
            this.timer = Math.random() * 10 + 5;
        }

        this.maxTimer = this.timer;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.type === 'spark') {
            this.speedX *= 0.9;
            this.speedY *= 0.9;
        } else if (this.type === 'explosion') {
            this.size *= 0.95; // shrink
        } else if (this.type === 'smoke') {
            this.size += 0.5; // grow
        } else if (this.type === 'trail') {
            this.size *= 0.9; // shrink
        }

        this.timer--;
        if (this.timer <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        let alpha = Math.max(0, this.timer / this.maxTimer);
        ctx.globalAlpha = alpha;

        if (this.type === 'spark') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = this.size * alpha;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.speedX * 3, this.y - this.speedY * 3);
            ctx.stroke();
        } else if (this.type === 'explosion') {
            // Anime style lens flare / sharp burst
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;

            // Draw a diamond/star shape for "sharp" explosion
            let s = this.size;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - s * 2);
            ctx.lineTo(this.x + s * 0.5, this.y - s * 0.5);
            ctx.lineTo(this.x + s * 2, this.y);
            ctx.lineTo(this.x + s * 0.5, this.y + s * 0.5);
            ctx.lineTo(this.x, this.y + s * 2);
            ctx.lineTo(this.x - s * 0.5, this.y + s * 0.5);
            ctx.lineTo(this.x - s * 2, this.y);
            ctx.lineTo(this.x - s * 0.5, this.y - s * 0.5);
            ctx.closePath();
            ctx.fill();

            // White core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'trail') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
