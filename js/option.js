class PowerUp {
    constructor(game, x, y) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
        this.speedY = 2;
        this.markedForDeletion = false;
        // PowerUp Types:
        // 0: Speed Up
        // 1: Missile
        // 2: Double
        // 3: Laser
        // 4: Ripple
        // 5: Barrier
        // 6: Guardian
        // 7: Force
        // 8: Ballistic Missile
        this.type = Math.floor(Math.random() * 9);

        switch (this.type) {
            case 0: this.color = '#00ffff'; this.text = 'S'; break;
            case 1: this.color = '#ffaa00'; this.text = 'M'; break;
            case 2: this.color = '#ffff00'; this.text = 'D'; break;
            case 3: this.color = '#00ff00'; this.text = 'L'; break;
            case 4: this.color = '#ff6600'; this.text = 'R'; break;
            case 5: this.color = '#0060ff'; this.text = 'B'; break;
            case 6: this.color = '#cc44ff'; this.text = 'G'; break;
            case 7: this.color = '#00ddff'; this.text = 'F'; break;
            case 8: this.color = '#ff2244'; this.text = 'BM'; break;
        }
    }

    update() {
        this.y += this.speedY;
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = this.text === 'BM' ? 'bold 10px Arial' : 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
        ctx.restore();
    }
}
