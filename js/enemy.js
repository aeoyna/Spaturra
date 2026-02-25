class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 20; // Reduced from 30
        this.height = 20; // Reduced from 30
        this.x = Math.random() * (this.game.width - this.width);
        this.y = -this.height;
        this.markedForDeletion = false;

        // Enemy Types: chaser, wave, sniper
        let rand = Math.random();
        if (rand < 0.6) {
            this.type = 'chaser'; // Default heart
            this.speed = Math.random() * 1 + 1;
            this.color = '#ff3366';
            this.canShoot = false;
        } else if (rand < 0.8) {
            this.type = 'wave';
            this.speed = 2;
            this.color = '#33ccff';
            this.angle = 0;
            this.angleSpeed = Math.random() * 0.1 + 0.05;
            this.canShoot = true;
            this.shootTimer = 90;
            this.shotsFired = 0;
        } else {
            this.type = 'sniper';
            this.speed = 3;
            this.color = '#ffcc00';
            this.canShoot = true;
            this.shootTimer = 60; // 1 sec before first shot
            this.shotsFired = 0;
        }
    }

    update() {
        if (this.type === 'chaser') {
            let dx = this.game.player.x + (this.game.player.width / 2) - (this.x + this.width / 2);
            let dy = this.game.player.y + (this.game.player.height / 2) - (this.y + this.height / 2);
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                this.x += (dx / dist) * this.speed * 0.5;
                this.y += this.speed * 1.5;
            }
        } else if (this.type === 'wave') {
            this.y += this.speed;
            this.x += Math.sin(this.angle) * 4;
            this.angle += this.angleSpeed;
        } else if (this.type === 'sniper') {
            // Drifts down continuously - no hovering
            this.y += this.speed * 0.6;
            this.x += Math.sin(this.y / 80) * 0.8; // Gentle horizontal drift
        }

        // Keep within horizontal bounds gracefully
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Clean up if past screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }

        // Enemy shooting
        if (this.canShoot) {
            if (this.type === 'sniper' && this.shotsFired >= 2) {
                // Sniper stops shooting after 2 shots (reduced from 3)
            } else {
                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    this.shoot();
                    this.shotsFired++;
                    this.shootTimer = this.type === 'wave' ? 120 : 45; // Wave shoots slower
                }
            }
        }
    }

    shoot() {
        if (this.type === 'sniper') {
            // Aim at player precisely for snipers
            let dx = (this.game.player.centerX) - (this.x + this.width / 2);
            let dy = (this.game.player.centerY) - (this.y + this.height);
            let dist = Math.sqrt(dx * dx + dy * dy);
            let bulletSpeed = 6;

            let vx = (dx / dist) * bulletSpeed;
            let vy = (dy / dist) * bulletSpeed;

            this.game.bullets.push(
                new Bullet(this.game, this.x + this.width / 2 - 2, this.y + this.height, vx, vy, false, '#ffaa00')
            );
        } else if (this.type === 'wave') {
            this.game.bullets.push(
                new Bullet(this.game, this.x + this.width / 2 - 8, this.y + this.height, 0, 2, false, '#33ccff', 'ripple')
            );
        }
    }

    draw(ctx) {
        let x = this.x;
        let y = this.y;
        let w = this.width;
        let h = this.height;
        let cx = x + w / 2;
        let cy = y + h / 2;

        ctx.save();

        if (this.type === 'chaser') {
            // Cool Stylized Anime-style Heart
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff3366';
            ctx.fillStyle = '#ff3366';

            // Main stylized heart body
            ctx.beginPath();
            ctx.moveTo(cx, cy + h * 0.45); // Sharp point
            ctx.bezierCurveTo(cx - w * 0.65, cy - h * 0.2, cx - w * 0.4, cy - h * 0.7, cx, cy - h * 0.25);
            ctx.bezierCurveTo(cx + w * 0.4, cy - h * 0.7, cx + w * 0.65, cy - h * 0.2, cx, cy + h * 0.45);
            ctx.closePath();
            ctx.fill();

            // Inner core glow detail
            let pulse = 0.7 + Math.sin(Date.now() / 150) * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.5 * pulse;
            ctx.beginPath();
            ctx.ellipse(cx, cy - 2, w / 6, h / 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Sharp metallic/light glint
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.2, cy - h * 0.35);
            ctx.quadraticCurveTo(cx - w * 0.35, cy - h * 0.35, cx - w * 0.3, cy - h * 0.1);
            ctx.stroke();

            // Darker shadow detail for depth
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'wave') {
            // Manta-Ray Scout
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#0088bb';

            // Main body
            ctx.beginPath();
            ctx.moveTo(cx, y); // nose
            ctx.lineTo(x + w, cy); // right wing
            ctx.lineTo(cx, y + h); // tail
            ctx.lineTo(x, cy); // left wing
            ctx.closePath();
            ctx.fill();

            // Inner plating
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx, y + 5);
            ctx.lineTo(x + w - 10, cy);
            ctx.lineTo(cx, y + h - 5);
            ctx.lineTo(x + 10, cy);
            ctx.closePath();
            ctx.fill();

            // Glowing wingtips
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#00f2ff';
            ctx.beginPath();
            ctx.arc(x + 2, cy, 3, 0, Math.PI * 2);
            ctx.arc(x + w - 2, cy, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'sniper') {
            // Heavy Armored Turret
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffaa00';
            ctx.fillStyle = '#444444';

            // Octagonal armor
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y);
            ctx.lineTo(x + w * 0.8, y);
            ctx.lineTo(x + w, y + h * 0.3);
            ctx.lineTo(x + w, y + h * 0.7);
            ctx.lineTo(x + w * 0.8, y + h);
            ctx.lineTo(x + w * 0.2, y + h);
            ctx.lineTo(x, y + h * 0.7);
            ctx.lineTo(x, y + h * 0.3);
            ctx.closePath();
            ctx.fill();

            // Orange Lens / Sensor
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(cx, cy, w / 3, 0, Math.PI * 2);
            ctx.fill();

            // Lens flare
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Apply hit flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x, y, w, h);
        }

        ctx.restore();
    }
}

class MidBoss {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 80;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height; // Start offscreen
        this.maxHp = 15; // Lowered HP for better visual feedback
        this.hp = this.maxHp; // Current health
        this.color = '#ffaa00';
        this.hitTimer = 0; // Added hit flash timer
        this.markedForDeletion = false;

        this.introPhase = true;
        this.speedY = 2; // Speed coming in

        // Sweeping movement
        this.speedX = 3;
        this.directionX = 1;

        // Shooting
        this.shootTimer = 60; // shoot earlier
        this.phase = 1;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;

        // Phase 2 transition
        if (this.hp <= this.maxHp / 2 && this.phase === 1) {
            this.phase = 2;
            this.color = '#ff0000'; // Turn red in anger
            this.speedX = 6; // Move twice as fast
        }

        if (this.introPhase) {
            this.y += this.speedY;
            if (this.y >= 50) { // Stop near the top
                this.introPhase = false;
            }
        } else {
            // Sweep side to side
            this.x += this.speedX * this.directionX;
            if (this.x <= 0 || this.x + this.width >= this.game.width) {
                this.directionX *= -1;
            }

            // Shoot occasionally
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shoot();
                this.shootTimer = this.phase === 1 ? 90 : 40; // Shoot much faster in phase 2
            }
        }
    }

    shoot() {
        // Multi-directional spread shot
        let spreadAngles = [-0.2, 0, 0.2];
        let speed = 4;

        spreadAngles.forEach(angleOffset => {
            let dx = this.game.player.x - (this.x + this.width / 2);
            let dy = this.game.player.y - (this.y + this.height);
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Base vector towards player
            let vx = (dx / dist) * speed;
            let vy = (dy / dist) * speed;

            // Apply slight rotation for spread (simplified)
            let rotatedVx = vx * Math.cos(angleOffset) - vy * Math.sin(angleOffset);
            let rotatedVy = vx * Math.sin(angleOffset) + vy * Math.cos(angleOffset);

            this.game.bullets.push(
                new Bullet(this.game, this.x + this.width / 2 - 2, this.y + this.height, rotatedVx, rotatedVy, false, '#ff3300')
            );
        });
    }

    draw(ctx) {
        let x = this.x;
        let y = this.y;
        let w = this.width;
        let h = this.height;
        let cx = x + w / 2;
        let cy = y + h / 2;

        ctx.save();

        // Armor Layers
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // 1. Base Structure (Dark Iron)
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + w - 20, y);
        ctx.lineTo(x + w, y + 40);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + 40);
        ctx.closePath();
        ctx.fill();

        // 2. Primary Armor Plates (Color-coded)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Left plate
        ctx.moveTo(x, y + 40); ctx.lineTo(x + w / 4, y + 20); ctx.lineTo(x + w / 4, y + h); ctx.lineTo(x, y + h); ctx.closePath();
        // Right plate
        ctx.moveTo(x + w, y + 40); ctx.lineTo(x + w * 0.75, y + 20); ctx.lineTo(x + w * 0.75, y + h); ctx.lineTo(x + w, y + h); ctx.closePath();
        ctx.fill();

        // 3. Glowing Core / Engine Ports
        ctx.fillStyle = '#ff3300';
        ctx.shadowBlur = 20;
        // Central pulsing core
        let pulse = 1 + Math.sin(Date.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(cx, cy + 10, 15 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Exhaust ports
        ctx.fillRect(x + 10, y + h - 10, 20, 10);
        ctx.fillRect(x + w - 30, y + h - 10, 20, 10);

        // 4. Machinery detail lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();

        // Apply hit flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x, y, w, h);
        }

        ctx.restore();

        // Draw Health Bar
        let hpPercentage = this.hp / this.maxHp;
        let barWidth = this.width;
        let barHeight = 6;
        let barX = x;
        let barY = y - 15;

        ctx.fillStyle = '#441111';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

class FinalBoss {
    constructor(game) {
        this.game = game;
        this.width = 300;
        this.height = 120;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height; // Start offscreen
        this.maxHp = 150;
        this.hp = this.maxHp;
        this.color = '#aa00ff'; // Purple/dark theme
        this.hitTimer = 0;
        this.markedForDeletion = false;

        this.introPhase = true;
        this.speedY = 1;

        this.speedX = 2;
        this.directionX = 1;

        this.shootTimer = 40;
        this.beamTimer = 180;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;

        if (this.introPhase) {
            this.y += this.speedY;
            if (this.y >= 20) {
                this.introPhase = false;
            }
        } else {
            this.x += this.speedX * this.directionX;
            if (this.x <= 0 || this.x + this.width >= this.game.width) {
                this.directionX *= -1;
            }

            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shoot();
                this.shootTimer = 60;
            }

            this.beamTimer--;
            if (this.beamTimer <= 0) {
                this.fireBeam();
                this.beamTimer = 240; // Every 4 seconds
            }
        }
    }

    shoot() {
        // Massive spread shot
        let spreadAngles = [-0.4, -0.2, 0, 0.2, 0.4];
        let speed = 5;

        spreadAngles.forEach(angleOffset => {
            let dx = this.game.player.centerX - (this.x + this.width / 2);
            let dy = this.game.player.centerY - (this.y + this.height);
            let dist = Math.sqrt(dx * dx + dy * dy);

            let vx = (dx / dist) * speed;
            let vy = (dy / dist) * speed;

            let rotatedVx = vx * Math.cos(angleOffset) - vy * Math.sin(angleOffset);
            let rotatedVy = vx * Math.sin(angleOffset) + vy * Math.cos(angleOffset);

            this.game.bullets.push(
                new Bullet(this.game, this.x + this.width / 2 - 2, this.y + this.height, rotatedVx, rotatedVy, false, '#ff00ff')
            );
        });
    }

    fireBeam() {
        // Fire straight down laser-like fast bullets
        this.game.bullets.push(
            new Bullet(this.game, this.x + 20, this.y + this.height, 0, 8, false, '#00ffff')
        );
        this.game.bullets.push(
            new Bullet(this.game, this.x + this.width - 20, this.y + this.height, 0, 8, false, '#00ffff')
        );
    }

    draw(ctx) {
        let x = this.x;
        let y = this.y;
        let w = this.width;
        let h = this.height;
        let cx = x + w / 2;
        let cy = y + h / 2;

        ctx.save();

        // Dreadnought Silhouette
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // 1. Massive Hull (Layered)
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h * 0.6);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h * 0.6);
        ctx.closePath();
        ctx.fill();

        // 2. Heavy Armor Plates (Purple)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Left Wing Armor
        ctx.moveTo(x, y + 20); ctx.lineTo(x + w / 3, y); ctx.lineTo(x + w / 3, y + h * 0.7); ctx.lineTo(x, y + h * 0.5); ctx.closePath();
        // Right Wing Armor
        ctx.moveTo(x + w, y + 20); ctx.lineTo(x + w * 2 / 3, y); ctx.lineTo(x + w * 2 / 3, y + h * 0.7); ctx.lineTo(x + w, y + h * 0.5); ctx.closePath();
        ctx.fill();

        // 3. Central Core Chamber (Pulsing Red)
        let pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0044';
        ctx.fillStyle = '#ff0044';
        ctx.beginPath();
        ctx.arc(cx, cy, 25 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 5, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // 4. Exposed Conduits / Lights
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#00f2ff';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 40 + i * 20, y + 10, 5, 20);
            ctx.fillRect(x + w - 45 - i * 20, y + 10, 5, 20);
        }

        // Apply hit flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x, y, w, h);
        }

        ctx.restore();

        // Health Bar
        let hpPercentage = this.hp / this.maxHp;
        let barWidth = this.width;
        let barHeight = 8;
        let barX = x;
        let barY = y - 20;

        ctx.fillStyle = '#441111';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#aa00ff';
        ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
