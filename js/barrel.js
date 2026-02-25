class Barrel {
    constructor(game) {
        this.game = game;
        this.width = 120; // Sideways & ~3x larger (was 40)
        this.height = 90; // Sideways & ~3x larger (was 50)

        // Prevent spawning partially offscreen on the right with the new width
        let maxX = this.game.width - this.width;
        if (maxX < 0) maxX = 0; // Failsafe
        this.x = Math.random() * maxX;

        this.y = -this.height; // Start offscreen top
        this.speedY = 1.5; // Falls at a steady pace

        this.maxHp = Math.floor(Math.random() * 16) + 5; // Random HP between 5 and 20
        this.hp = this.maxHp;
        this.markedForDeletion = false;

        // Colors for rock look
        this.color = '#708090'; // SlateGray
        this.craterColor = '#4e5b68'; // Darker gray for details

        this.hitTimer = 0; // For hit flash

        // Asteroid shape generation
        this.points = [];
        let numPoints = 8 + Math.floor(Math.random() * 5); // 8-12 points
        for (let i = 0; i < numPoints; i++) {
            let angle = (i / numPoints) * Math.PI * 2;
            let distance = 0.7 + Math.random() * 0.3; // 70-100% of radius
            this.points.push({
                x: Math.cos(angle) * (this.width / 2) * distance,
                y: Math.sin(angle) * (this.height / 2) * distance
            });
        }

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;

        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Cleanup if it goes off bottom of screen
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

        // Flash white when hit
        ctx.fillStyle = this.hitTimer > 0 ? '#ffffff' : this.color;

        // Draw asteroid polygon
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

        // Draw some "craters" or details
        if (this.hitTimer === 0) {
            ctx.fillStyle = this.craterColor;
            ctx.beginPath();
            ctx.arc(-this.width * 0.2, -this.height * 0.1, this.width * 0.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.width * 0.1, this.height * 0.2, this.width * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Display remaining HP in the center (un-rotated)
        let cxCenter = this.x + this.width / 2;
        let cyCenter = this.y + this.height / 2;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Add a slight black shadow so it's readable over the white hit flash too
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.hp, cxCenter, cyCenter);

        // Reset shadow
        ctx.shadowBlur = 0;
    }
}
