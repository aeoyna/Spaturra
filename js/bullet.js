class Bullet {
    constructor(game, x, y, speedX, speedY, isPlayerBullet, color = '#00ffcc', type = 'normal') {
        this.game = game; // Needed for homing missiles to find enemies
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.isPlayerBullet = isPlayerBullet;
        this.color = color;
        this.type = type; // normal, laser, ripple, missile
        this.markedForDeletion = false;

        if (this.type === 'laser') {
            this.width = 4;
            this.height = 60;
            this.pierceCount = 3; // Pierces 3 enemies
        } else if (this.type === 'ripple') {
            this.width = 10;
            this.height = 10;
            this.radius = 5;
            this.pierceCount = 1;
        } else if (this.type === 'missile') {
            this.width = 6;
            this.height = 12;
            this.pierceCount = 1;
            this.color = '#ffaa00';
        } else if (this.type === 'bubble') {
            this.width = 16;
            this.height = 16;
            this.radius = 8;
            this.pierceCount = 1;
            this.color = '#33ccff';
            this.wobbleAngle = Math.random() * Math.PI * 2;
        } else if (this.type === 'ballistic') {
            this.width = 26;
            this.height = 26;
            this.radius = 13;
            this.pierceCount = 99; // Doesn't get cancelled by enemies; explosion handled in game.js
            this.color = '#ff2244';
        } else {
            this.width = isPlayerBullet ? 4 : 4;
            this.height = isPlayerBullet ? 20 : 10;
            this.pierceCount = 1;
        }
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.type === 'ripple') {
            this.radius += 0.2; // Grow over time (slower)
            this.width = this.radius * 2;
            this.height = this.radius * 2;
        } else if (this.type === 'bubble') {
            // Constant position to prevent perceived flickering
        } else if (this.type === 'missile') {
            // Homing logic: find closest enemy
            let closestEnemy = null;
            let minDistance = Infinity;

            // Combine enemies, midbosses, barrels into one array for targeting
            if (this.game) {
                const targets = [...this.game.enemies, ...this.game.midbosses, ...this.game.barrels];
                targets.forEach(target => {
                    const dx = (target.x + target.width / 2) - this.x;
                    const dy = (target.y + target.height / 2) - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestEnemy = target;
                    }
                });

                if (closestEnemy) {
                    const dx = (closestEnemy.x + closestEnemy.width / 2) - this.x;
                    const dy = (closestEnemy.y + closestEnemy.height / 2) - this.y;
                    const angle = Math.atan2(dy, dx);

                    const missileSpeed = 10;
                    // Gradually turn towards the target instead of snapping
                    const targetSpeedX = Math.cos(angle) * missileSpeed;
                    const targetSpeedY = Math.sin(angle) * missileSpeed;

                    this.speedX += (targetSpeedX - this.speedX) * 0.1;
                    this.speedY += (targetSpeedY - this.speedY) * 0.1;
                }
            }

            // Spawn smoke trail for missiles
            if (this.game && Math.random() < 0.4) {
                this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, 'smoke'));
            }
        }

        // Cleanup if off screen
        if (this.x > 600 || this.x < 0 || this.y > 800 || this.y < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();

        // Center of the bullet for rotation
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);

        // Rotate to face direction of travel (except for circular ones like ripple/bubble)
        if (this.type !== 'ripple' && this.type !== 'bubble') {
            const angle = Math.atan2(this.speedY, this.speedX);
            ctx.rotate(angle + Math.PI / 2); // Adjust so "up" is 0 velocity
        }

        // Intensity of glow varies by bullet type
        if (this.type === 'laser') {
            ctx.shadowBlur = 30;
        } else if (this.type === 'ripple') {
            ctx.shadowBlur = 35;
        } else {
            ctx.shadowBlur = 15;
        }
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;

        if (this.type === 'ripple') {
            // High-fidelity concentric rings - ensure solid display
            ctx.shadowBlur = 10; // Reduced from 35 to prevent artifacts
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                let r = this.radius - (i * 5);
                if (r <= 0) continue;
                ctx.globalAlpha = (1 - i * 0.3); // Solid steps
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.type === 'bubble') {
            // 3D Soap Bubble effect - Constant transparency
            ctx.globalAlpha = 0.6;
            let grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, this.radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, this.color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'laser') {
            // Plasma Beam
            const h = this.height;
            const w = this.width;

            // Outer glow
            ctx.fillStyle = this.color;
            ctx.fillRect(-w * 1.5, -h / 2, w * 3, h);

            // White core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-w / 2, -h / 2, w, h);

            // Impact/Plasma tips
            ctx.beginPath();
            ctx.ellipse(0, -h / 2, w * 2, w * 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'missile') {
            // Physical Missile Projectile
            const w = this.width;
            const h = this.height;

            // Fins
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(-w, h / 2); ctx.lineTo(w, h / 2); ctx.lineTo(0, 0); ctx.closePath();
            ctx.fill();

            // Body
            ctx.fillStyle = this.color;
            ctx.fillRect(-w / 2, -h / 2, w, h);

            // Tip
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, -h / 2 - 5); ctx.lineTo(w / 2, -h / 2); ctx.closePath();
            ctx.fill();

            // Engine Glow
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-w / 4, h / 2, w / 2, 3);
        } else if (this.type === 'ballistic') {
            // Large glowing warhead
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff2244';
            ctx.fillStyle = '#ff2244';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(-4, -4, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const w = this.width;
            const h = this.height;

            // Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -h / 2);
            ctx.lineTo(w / 2, h / 2);
            ctx.lineTo(-w / 2, h / 2);
            ctx.closePath();
            ctx.fill();

            // Trail blur
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = this.color;
            ctx.fillRect(-w, 0, w * 2, h * 1.5);
        }

        ctx.restore();
    }
}
