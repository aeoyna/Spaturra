class Obstacle {
    constructor(game) {
        this.game = game;
        this.width = 60 + Math.random() * 40; // Size ranges from 60 to 100
        this.height = this.width;
        this.x = Math.random() * (this.game.width - this.width);
        this.y = -this.height; // Start above screen

        this.speedY = 1 + Math.random() * 2; // Falls slowly
        this.markedForDeletion = false;

        this.color = '#444444'; // Dark grey asteroid
        this.borderColor = '#222222';
        this.hitTimer = 0;

        // Generate angular asteroid shape relative to center
        this.points = [];
        let numPoints = 8 + Math.floor(Math.random() * 5); // 8-12 points
        for (let i = 0; i < numPoints; i++) {
            let angle = (i / numPoints) * Math.PI * 2;
            let distance = 0.5 + Math.random() * 0.5; // 50-100% of radius
            this.points.push({
                x: Math.cos(angle) * (this.width / 2) * distance,
                y: Math.sin(angle) * (this.height / 2) * distance
            });
        }

        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    update() {
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.hitTimer > 0) this.hitTimer--;

        if (this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        let cx = this.x + this.width / 2;
        let cy = this.y + this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        // Flash white if hit (to show indestructible feedback)
        ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : this.color;

        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.closePath();
        ctx.fill();

        if (this.hitTimer === 0) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.restore();
    }
}
