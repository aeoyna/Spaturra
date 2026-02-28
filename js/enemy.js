class Enemy {
    constructor(game, forceType) {
        this.game = game;
        this.width = 20; // Reduced from 30
        this.height = 20; // Reduced from 30
        this.x = Math.random() * (this.game.width - this.width);
        this.y = -this.height;
        this.markedForDeletion = false;

        // Enemy Types: chaser, wave, sniper
        let rand = Math.random();
        this.type = forceType || (rand < 0.6 ? 'chaser' : rand < 0.8 ? 'wave' : 'sniper');

        if (this.type === 'chaser') {
            this.speed = Math.random() * 1 + 1;
            this.color = '#ff3366';
            this.canShoot = false;
        } else if (this.type === 'wave') {
            this.speed = 2;
            this.color = '#33ccff';
            this.angle = 0;
            this.angleSpeed = Math.random() * 0.1 + 0.05;
            this.canShoot = true;
            this.shootTimer = 90;
            this.shotsFired = 0;
        } else if (this.type === 'sniper') {
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

class BeamBoss {
    constructor(game) {
        this.game = game;
        this.width = 160;
        this.height = 100;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.color = '#ff0000';
        this.hitTimer = 0;
        this.markedForDeletion = false;
        this.introPhase = true;
        this.speedY = 1.5;
        this.shootTimer = 120;
        this.laserActive = false;
        this.laserTimer = 0;
        this.berserk = false;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.hp <= this.maxHp / 2) this.berserk = true;

        if (this.introPhase) {
            this.y += this.speedY;
            if (this.y >= 60) this.introPhase = false;
        } else {
            this.shootTimer--;
            if (this.shootTimer <= 0 && !this.laserActive) {
                this.laserActive = true;
                this.laserTimer = 300; // 5 seconds
                this.shootTimer = 480; // Total cycle
                // Spawn the thick laser bullet
                this.game.bullets.push(new Bullet(this.game, this.x + this.width / 2 - 30, this.y + this.height, 0, 0, false, '#ff0000', 'boss-laser'));
            }

            if (this.laserActive) {
                this.laserTimer--;
                if (this.laserTimer <= 0) this.laserActive = false;
            }

            if (this.berserk && Math.random() < 0.05) {
                // Wave bullets during berserk
                this.game.bullets.push(new Bullet(this.game, this.x + Math.random() * this.width, this.y + this.height, (Math.random() - 0.5) * 4, 3, false, '#33ccff', 'ripple'));
            }
        }
    }

    draw(ctx) {
        let x = this.x, y = this.y, w = this.width, h = this.height;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const coreColor = this.berserk ? '#ff0000' : '#880000';

        ctx.save();

        // 1. Mechanical Arms / Fins (X-shape)
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((Math.PI / 4) + (i * Math.PI / 2));
            ctx.beginPath();
            ctx.moveTo(30, -10);
            ctx.lineTo(80, -25);
            ctx.lineTo(85, 25);
            ctx.lineTo(30, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 2. Primary Circular Hub
        let hubGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 60);
        hubGrad.addColorStop(0, '#555');
        hubGrad.addColorStop(0.7, '#111');
        hubGrad.addColorStop(1, '#333');

        ctx.fillStyle = hubGrad;
        ctx.shadowBlur = 15; ctx.shadowColor = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.stroke();

        // 3. Central Energy Lens (The "Eye")
        ctx.shadowBlur = 30; ctx.shadowColor = coreColor;
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();

        // Inner Glass Highlight
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 4. Energy Rings
        if (this.laserActive || this.berserk) {
            ctx.strokeStyle = this.berserk ? '#ff5555' : '#ff9999';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 40 + Math.sin(Date.now() / 100) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(cx, cy, 85, 0, Math.PI * 2); // Approximate cover
            ctx.fill();
        }
        ctx.restore();
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        let hpPct = this.hp / this.maxHp;
        // Background Glow
        ctx.save();
        ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
        ctx.fillStyle = 'rgba(40, 0, 0, 0.6)';
        ctx.fillRect(this.x, this.y - 25, this.width, 6);
        // Foreground
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 25, this.width * hpPct, 6);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y - 25, this.width, 6);
        ctx.restore();
    }
}

class BombBoss {
    constructor(game, x, y, generation = 1) {
        this.game = game;
        this.generation = generation; // 1, 2, or 4
        this.width = 160 / generation;
        this.height = 160 / generation;
        this.x = x !== undefined ? x : this.game.width / 2 - this.width / 2;
        this.y = y !== undefined ? y : -this.height;
        this.maxHp = 60 / generation;
        this.hp = this.maxHp;
        this.color = '#ffaa00';
        this.hitTimer = 0;
        this.markedForDeletion = false;
        this.introPhase = x === undefined;
        this.speedY = 1;
        this.speedX = (Math.random() - 0.5) * 4 * generation;
        this.shootTimer = 60 / generation;
        this.hasSplit = false;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.introPhase) {
            this.y += this.speedY;
            if (this.y >= 80) this.introPhase = false;
        } else {
            this.x += this.speedX;
            this.y += Math.sin(Date.now() / 500) * 0.5;
            if (this.x < 0 || this.x + this.width > this.game.width) this.speedX *= -1;

            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shootTimer = 120 / this.generation;
                this.game.bullets.push(new Bullet(this.game, this.x + this.width / 2 - 12, this.y + this.height, 0, 2, false, '#ffaa00', 'boss-bomb'));
            }
        }

        if (this.hp <= 0 && !this.hasSplit) {
            this.hasSplit = true;
            this.markedForDeletion = true; // Ensure it's marked
            if (this.generation < 4) {
                let nextGen = this.generation * 2;
                this.game.midbosses.push(new BombBoss(this.game, this.x, this.y, nextGen));
                this.game.midbosses.push(new BombBoss(this.game, this.x + this.width / 2, this.y, nextGen));
            }
        }
    }

    draw(ctx) {
        let x = this.x, y = this.y, w = this.width, h = this.height;
        ctx.save();

        const cx = x + w / 2;
        const cy = y + h / 2;
        const radius = w / 2;

        // 1. Lava Core (Glowing Gradient)
        let lavaGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
        lavaGrad.addColorStop(0, '#fff');
        lavaGrad.addColorStop(0.2, '#ffaa00');
        lavaGrad.addColorStop(0.6, '#ff4400');
        lavaGrad.addColorStop(1, '#220000');

        ctx.shadowBlur = 25; ctx.shadowColor = '#ff4400';
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Obsidian Shards (Floating crust)
        ctx.fillStyle = '#111';
        ctx.shadowBlur = 0;
        for (let i = 0; i < 8; i++) {
            const angle = (Date.now() / 1000) + (i * Math.PI / 4);
            const sx = cx + Math.cos(angle) * (radius * 0.8);
            const sy = cy + Math.sin(angle) * (radius * 0.8);
            const sw = radius * 0.4;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-sw / 2, -sw / 2);
            ctx.lineTo(sw / 2, 0);
            ctx.lineTo(-sw / 3, sw / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class MirrorBoss {
    constructor(game) {
        this.game = game;
        this.width = 140; this.height = 80;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.maxHp = 120; this.hp = this.maxHp;
        this.color = '#00ffff';
        this.hitTimer = 0; this.markedForDeletion = false;
        this.introPhase = true;
        this.satellites = [];
        this.shootTimer = 180;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.introPhase) {
            this.y += 1;
            if (this.y >= 40) {
                this.introPhase = false;
                // Spawn reflective satellites
                for (let i = 0; i < 4; i++) {
                    this.satellites.push({ x: Math.random() * (this.game.width - 40), y: 150 + Math.random() * 300, w: 40, h: 40, angle: Math.random() * Math.PI });
                }
            }
        } else {
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shootTimer = 240;
                this.fireReflectiveBeam();
            }
        }
    }

    fireReflectiveBeam() {
        // Core logic: fire a beam that visits satellites
        let startX = this.x + this.width / 2;
        let startY = this.y + this.height;
        this.satellites.forEach((s, i) => {
            setTimeout(() => {
                this.game.bullets.push(new Bullet(this.game, s.x + s.w / 2, s.y + s.h / 2, (this.game.player.x - s.x) / 50, (this.game.player.y - s.y) / 50, false, '#00ffff', 'laser'));
            }, i * 300);
        });
    }

    draw(ctx) {
        let x = this.x, y = this.y, w = this.width, h = this.height;

        // 1. Draw Crystalline Satellites
        this.satellites.forEach(s => {
            ctx.save();
            ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
            ctx.rotate(Date.now() / 500);

            ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);

            // Inner Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 2. Draw Main Prism Body
        ctx.save();
        let prismGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        prismGrad.addColorStop(0, '#004466');
        prismGrad.addColorStop(0.5, '#0088aa');
        prismGrad.addColorStop(1, '#004466');

        ctx.fillStyle = prismGrad;
        ctx.shadowBlur = 20; ctx.shadowColor = '#00ffff';

        // Hexagonal / Prismatic Shape
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y);
        ctx.lineTo(x + w * 0.8, y);
        ctx.lineTo(x + w, y + h * 0.5);
        ctx.lineTo(x + w * 0.8, y + h);
        ctx.lineTo(x + w * 0.2, y + h);
        ctx.lineTo(x, y + h * 0.5);
        ctx.closePath();
        ctx.fill();

        // Glowing Outline
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        }
        ctx.restore();
    }
}

class CloudBoss {
    constructor(game) {
        this.game = game;
        this.width = 180; this.height = 100;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.maxHp = 150; this.hp = this.maxHp;
        this.color = '#ffffff';
        this.hitTimer = 0; this.markedForDeletion = false;
        this.clouds = [];
        this.introPhase = true;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.introPhase) {
            this.y += 1;
            if (this.y >= 50) this.introPhase = false;
        }

        // Generate shielding clouds
        if (Math.random() < 0.05 && this.clouds.length < 10) {
            this.clouds.push({ x: this.x + Math.random() * this.width - 40, y: this.y + this.height + Math.random() * 40, w: 80, h: 40, life: 200 });
        }
        this.clouds.forEach(c => c.life--);
        this.clouds = this.clouds.filter(c => c.life > 0);

        // Movement
        this.x += Math.sin(Date.now() / 1000) * 2;
    }

    draw(ctx) {
        // 1. Swirling Energy Clouds (Barrier)
        ctx.save();
        this.clouds.forEach(c => {
            const cx = c.x + c.w / 2;
            const cy = c.y + c.h / 2;
            const pulse = Math.sin(Date.now() / 200 + c.x) * 5;

            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20; ctx.shadowColor = '#00ccff';

            // Main Puff
            ctx.beginPath();
            ctx.arc(cx, cy, (c.h / 2) + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Side Puffs
            ctx.beginPath();
            ctx.arc(cx - 20, cy + 10, c.h / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 20, cy - 5, c.h / 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 2. Vapor Fortress (The Body) - Angled decagonal shape
        let x = this.x, y = this.y, w = this.width, h = this.height;
        ctx.save();

        let fortressGrad = ctx.createLinearGradient(x, y, x, y + h);
        fortressGrad.addColorStop(0, '#888');
        fortressGrad.addColorStop(0.5, '#444');
        fortressGrad.addColorStop(1, '#666');

        ctx.fillStyle = fortressGrad;
        ctx.shadowBlur = 15; ctx.shadowColor = '#000';

        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y);
        ctx.lineTo(x + w * 0.7, y);
        ctx.lineTo(x + w, y + h * 0.3);
        ctx.lineTo(x + w, y + h * 0.7);
        ctx.lineTo(x + w * 0.7, y + h);
        ctx.lineTo(x + w * 0.3, y + h);
        ctx.lineTo(x, y + h * 0.7);
        ctx.lineTo(x, y + h * 0.3);
        ctx.closePath();
        ctx.fill();

        // Technical Details Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core / Bridge Window
        ctx.fillStyle = '#00ccff';
        ctx.shadowBlur = 10; ctx.shadowColor = '#00ccff';
        ctx.fillRect(x + w / 2 - 20, y + h / 2 - 5, 40, 10);

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.3, y);
            ctx.lineTo(x + w * 0.7, y);
            ctx.lineTo(x + w, y + h * 0.3);
            ctx.lineTo(x + w, y + h * 0.7);
            ctx.lineTo(x + w * 0.7, y + h);
            ctx.lineTo(x + w * 0.3, y + h);
            ctx.lineTo(x, y + h * 0.7);
            ctx.lineTo(x, y + h * 0.3);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

class DesariumBoss {
    constructor(game) {
        this.game = game;
        this.width = 120; this.height = 120;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -this.height;
        this.maxHp = 100; this.hp = this.maxHp;
        this.markedForDeletion = false;
        this.hitTimer = 0;
        this.stealth = false;
        this.stealthTimer = 0;
        this.introPhase = true;
        this.shootTimer = 60;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.introPhase) {
            this.y += 2;
            if (this.y >= 100) this.introPhase = false;
        } else {
            this.stealthTimer++;
            if (this.stealthTimer > 180) {
                this.stealth = !this.stealth;
                this.stealthTimer = 0;
            }

            if (!this.stealth) {
                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    this.shootTimer = 60;
                    // Fire missiles
                    for (let i = -1; i <= 1; i++) {
                        this.game.bullets.push(new Bullet(this.game, this.x + this.width / 2 + i * 20, this.y + this.height, i * 2, 5, false, '#00ffff', 'boss-missile'));
                    }
                }
            }

            // Move towards player slowly
            let dx = this.game.player.x - this.x;
            this.x += Math.sign(dx) * 1;
        }
    }

    draw(ctx) {
        let x = this.x, y = this.y, w = this.width, h = this.height;
        ctx.save();

        // Stealth Transparency
        if (this.stealth) {
            ctx.globalAlpha = 0.15 + (Math.sin(Date.now() / 200) * 0.05); // Pulsing stealth
        }

        // 1. Sleek Stealth Body (Matte Black with highlights)
        ctx.shadowBlur = 15; ctx.shadowColor = '#000';
        ctx.fillStyle = '#111';

        // Triangular / Viper Shape
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y); // Nose
        ctx.lineTo(x + w, y + h); // Right wing tip
        ctx.lineTo(x + w / 2, y + h * 0.85); // Rear notch
        ctx.lineTo(x, y + h); // Left wing tip
        ctx.closePath();
        ctx.fill();

        // 2. Purple Circuitry / Energy Lines
        if (!this.stealth || Math.random() < 0.2) {
            ctx.strokeStyle = '#cc00ff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10; ctx.shadowColor = '#cc00ff';

            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + 20);
            ctx.lineTo(x + w / 2, y + h * 0.65);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + w * 0.35, y + h * 0.7);
            ctx.lineTo(x + w * 0.65, y + h * 0.7);
            ctx.stroke();
        }

        // 3. Engine Glow (Rear)
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 20; ctx.shadowColor = '#ff00ff';
        const flicker = 0.8 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.88, 12 * flicker, 0, Math.PI * 2);
        ctx.fill();

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        }
        ctx.restore();
    }
}
