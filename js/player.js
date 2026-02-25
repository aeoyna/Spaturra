class Player {
    constructor(game) {
        this.game = game;
        this.centerX = this.game.width / 2;
        this.centerY = this.game.height - 80; // Keeping original centerY for initialization, as this.y and this.height are not defined yet.

        this.baseWidth = 30;
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.color = '#00ffcc';

        this.shootTimer = 0;
        this.shootInterval = 10; // Frames between shots

        this.firePower = 1; // Starting fleet size

        // Health (now represented by firePower/number of ships)
        this.invulnerableTimer = 0; // i-frames
        this.engineFlameScale = 1;
        this.engineTimer = 0;

        // PowerUps
        this.barrierActive = false;
        this.barrierHp = 0;

        this.speedLevel = 0;
        this.weaponType = 'normal'; // 'normal', 'double', 'laser', 'ripple'
        this.missileEnabled = false;

        // Guardian: spinners orbit the ship and destroy chaser enemies
        this.guardianActive = false;
        this.guardianAngle = 0;
        this.guardianRadius = 65;
        this.guardianCount = 3;

        // Force: magnetic field destroys chaser enemies that get too close; bullets pass through
        this.forceActive = false;
        this.forceHp = 3;
        this.forceRadius = 55;

        // Ballistic Missile: area-damage shots that prioritize bosses
        this.ballisticCharges = 0;
        this.ballisticMaxCharges = 3;
        this.ballisticTimer = 0;
        this.ballisticInterval = 90; // frames between auto-fire

        this.cheatTimer = 0;

        this.updateBoundingBox();
    }

    getShipOffsets() {
        // Defines a tightly packed cluster (swerm/mass) formation
        const offsets = [
            { dx: 0, dy: 0 },       // 1: Center
            { dx: -20, dy: 15 },    // 2: Bottom Left
            { dx: 20, dy: 15 },     // 3: Bottom Right
            { dx: 0, dy: -25 },     // 4: Top Center
            { dx: -25, dy: -10 },   // 5: Mid Left
            { dx: 25, dy: -10 },    // 6: Mid Right
            { dx: -40, dy: 25 },    // 7: Far Bottom Left
            { dx: 40, dy: 25 },     // 8: Far Bottom Right
            { dx: 0, dy: 30 },      // 9: Rear Center
            { dx: 0, dy: -50 }      // 10: Vanguard Top Center
        ];
        return offsets.slice(0, this.firePower);
    }

    updateBoundingBox() {
        // Encompass the entire fleet cluster
        let activeOffsets = this.getShipOffsets();
        let minDx = 0, maxDx = 0, minDy = 0, maxDy = 0;

        activeOffsets.forEach(off => {
            minDx = Math.min(minDx, off.dx - this.baseWidth / 2);
            maxDx = Math.max(maxDx, off.dx + this.baseWidth / 2);
            minDy = Math.min(minDy, off.dy - 20); // Height approx
            maxDy = Math.max(maxDy, off.dy + 20);
        });

        this.width = maxDx - minDx;
        this.height = maxDy - minDy;
        this.x = this.centerX + minDx;
        this.y = this.centerY + minDy;

        return { minDx, maxDx, minDy, maxDy };
    }

    computeAutoDodge() {
        // Scan threats and compute a dodge direction (-1=left, 0=none, 1=right)
        const DANGER_Y = 200;   // Look-ahead distance (pixels above player)
        const DANGER_X = 110;   // Horizontal threat radius (pixels)
        let dodgeWeight = 0;

        const px = this.centerX;
        const py = this.centerY;

        // Helper: evaluate a single threat object (must have x, y, width, height)
        const addThreat = (obj, threatScale = 1.0) => {
            const cx = obj.x + obj.width / 2;
            const cy = obj.y + obj.height / 2;
            const dy = py - cy;
            if (dy < 0 || dy > DANGER_Y) return; // must be above player
            const dx = cx - px;
            if (Math.abs(dx) > DANGER_X) return;  // must be horizontally close
            const proximity = (1 - Math.abs(dy) / DANGER_Y) * threatScale;
            dodgeWeight += (dx < 0 ? 1 : -1) * proximity;
        };

        // --- Enemy bullets (downward-moving only) ---
        this.game.bullets.forEach(b => {
            if (b.isPlayerBullet || b.markedForDeletion) return;
            if (b.speedY <= 0) return;
            addThreat(b, 1.0);
        });

        // --- Enemies ---
        this.game.enemies.forEach(e => {
            if (e.markedForDeletion) return;
            addThreat(e, 1.2);
        });

        // --- MidBosses / Final Boss ---
        this.game.midbosses.forEach(mb => {
            if (mb.markedForDeletion) return;
            addThreat(mb, 2.0); // Bosses are bigger threat
        });

        // --- Barrels ---
        this.game.barrels.forEach(barrel => {
            if (barrel.markedForDeletion) return;
            addThreat(barrel, 1.2);
        });

        // --- Obstacles (rocks/indestructible) ---
        this.game.obstacles.forEach(obs => {
            if (obs.markedForDeletion) return;
            addThreat(obs, 1.5); // High weight as indestructible
        });

        if (Math.abs(dodgeWeight) < 0.1) return 0; // No significant threat
        return dodgeWeight > 0 ? 1 : -1; // 1=move right, -1=move left
    }

    computeAutoTarget() {
        // Returns the X of the best target to move towards, or null if none.
        // Priority 1: Power-ups (anywhere on screen)
        let bestTarget = null;
        let bestScore = -Infinity;

        const px = this.centerX;
        const py = this.centerY;

        // Score power-ups highly — they're valuable
        this.game.powerUps.forEach(item => {
            if (item.markedForDeletion) return;
            const cx = item.x + item.width / 2;
            const dist = Math.abs(cx - px);
            const score = 2000 - dist; // Closer = higher score
            if (score > bestScore) {
                bestScore = score;
                bestTarget = cx;
            }
        });

        // Score enemies above the player (align to shoot them)
        // Only consider enemies within a reasonable horizontal range
        const allEnemies = [
            ...this.game.enemies,
            ...this.game.midbosses,
        ];
        allEnemies.forEach(e => {
            if (e.markedForDeletion) return;
            const cx = e.x + e.width / 2;
            const cy = e.y + e.height / 2;
            // Only target enemies roughly above the player
            if (cy >= py) return;
            const dist = Math.abs(cx - px);
            // Prefer closer enemies; midbosses are worth more
            const bonus = e.hp ? 500 : 0; // Midbosses have hp property
            const score = 1000 + bonus - dist;
            if (score > bestScore) {
                bestScore = score;
                bestTarget = cx;
            }
        });

        return bestTarget; // null = nothing to chase
    }

    update(input) {
        let bounds = this.updateBoundingBox();

        let movingLeft = (input.isDown('ArrowLeft') || input.isDown('KeyA'));
        let movingRight = (input.isDown('ArrowRight') || input.isDown('KeyD'));

        // Auto-dodge: compute only when the player isn't manually steering
        const manualInput = movingLeft || movingRight || (input.touchActive && input.touchX !== null);
        let autoDodge = 0;
        let autoTargetX = null;
        if (!manualInput) {
            autoDodge = this.computeAutoDodge();
            if (autoDodge === 0) {
                // Only pursue targets when there's no dodge threat
                autoTargetX = this.computeAutoTarget();
            }
        }

        // Touch-based movement: follow the X position of the finger
        if (input.touchActive && input.touchX !== null) {
            const targetX = input.touchX;
            const dx = targetX - this.centerX;
            const touchSpeed = this.speed * 1.5;
            if (Math.abs(dx) > 2) {
                const move = Math.sign(dx) * Math.min(Math.abs(dx), touchSpeed);
                this.centerX += move;
            } else {
                this.centerX = targetX;
            }
            // Clamp to screen bounds
            this.centerX = Math.max(-bounds.minDx, Math.min(this.game.width - bounds.maxDx, this.centerX));
        } else if (movingLeft && (this.centerX + bounds.minDx) > 0) {
            // Keyboard movement
            this.centerX -= this.speed;
        } else if (movingRight && (this.centerX + bounds.maxDx) < this.game.width) {
            this.centerX += this.speed;
        } else if (autoDodge === -1 && (this.centerX + bounds.minDx) > 0) {
            // Auto-dodge left
            this.centerX -= this.speed;
        } else if (autoDodge === 1 && (this.centerX + bounds.maxDx) < this.game.width) {
            // Auto-dodge right
            this.centerX += this.speed;
        } else if (autoTargetX !== null) {
            // Auto-target: glide toward enemy or power-up
            const dx = autoTargetX - this.centerX;
            if (Math.abs(dx) > 3) {
                const dir = Math.sign(dx);
                if (dir === -1 && (this.centerX + bounds.minDx) > 0) {
                    this.centerX -= this.speed;
                } else if (dir === 1 && (this.centerX + bounds.maxDx) < this.game.width) {
                    this.centerX += this.speed;
                }
            }
        }

        // Ensure AABB is synced after moving
        this.updateBoundingBox();

        // Auto-fire: shoot automatically every shootInterval frames
        if (this.shootTimer > 0) this.shootTimer--;
        if (this.shootTimer === 0) {
            this.shoot();
            this.shootTimer = this.shootInterval;
        }

        // I-frames
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        // Cheats
        if (this.cheatTimer > 0) this.cheatTimer--;

        if (this.cheatTimer === 0 && (input.isDown('ShiftLeft') || input.isDown('ShiftRight'))) {
            if (input.isDown('KeyM')) {
                this.game.score += 500;
                this.weaponType = 'missile';
                this.missileEnabled = true;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyD')) {
                this.game.score += 500;
                this.weaponType = 'double';
                this.missileEnabled = false;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyL')) {
                this.game.score += 500;
                this.weaponType = 'laser';
                this.missileEnabled = false;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyR')) {
                this.game.score += 500;
                this.weaponType = 'ripple';
                this.missileEnabled = false;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyO')) {
                if (this.firePower < 10) {
                    this.firePower++;
                    this.game.audio.playPowerUp();
                }
                this.cheatTimer = 15;
            } else if (input.isDown('KeyS')) {
                if (this.speedLevel < 5) {
                    this.speedLevel++;
                    this.speed = this.baseSpeed + this.speedLevel * 2;
                    this.game.audio.playPowerUp();
                }
                this.cheatTimer = 15;
            } else if (input.isDown('KeyV')) {
                // Barrier (moved from B to V)
                this.barrierActive = true;
                this.barrierHp = 3;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyG')) {
                // Guardian
                this.guardianActive = true;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyF')) {
                // Force
                this.forceActive = true;
                this.forceHp = 3;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            } else if (input.isDown('KeyB')) {
                // Ballistic Missile
                this.ballisticCharges = this.ballisticMaxCharges;
                this.ballisticTimer = 0;
                this.game.audio.playPowerUp();
                this.cheatTimer = 15;
            }
        }

        // Engine flame flicker
        this.engineTimer += 0.2;
        this.engineFlameScale = 0.8 + Math.sin(this.engineTimer) * 0.2;

        // Spawn engine trails from the main ship
        let sx = this.centerX;
        let sy = this.centerY + 20;
        if (Math.random() < 0.5) {
            this.game.particles.push(new Particle(this.game, sx, sy, 'trail', '#00ffff'));
        }

        // --- Guardian: advance spinner angle ---
        if (this.guardianActive) {
            this.guardianAngle += 0.06;
        }

        // --- Ballistic Missile: auto-fire when charges available ---
        if (this.ballisticCharges > 0) {
            if (this.ballisticTimer > 0) {
                this.ballisticTimer--;
            } else {
                this.fireBallisticMissile();
                this.ballisticCharges--;
                this.ballisticTimer = this.ballisticInterval;
            }
        }
    }

    fireBallisticMissile() {
        // Find best target: bosses first, then any enemy
        let target = null;
        if (this.game.midbosses.length > 0) {
            target = this.game.midbosses[0];
        } else if (this.game.enemies.length > 0) {
            let closest = null, minDist = Infinity;
            this.game.enemies.forEach(e => {
                if (e.markedForDeletion) return;
                const d = Math.hypot((e.x + e.width / 2) - this.centerX, (e.y + e.height / 2) - this.centerY);
                if (d < minDist) { minDist = d; closest = e; }
            });
            target = closest;
        }

        let vx = 0, vy = -10;
        if (target) {
            const dx = (target.x + target.width / 2) - this.centerX;
            const dy = (target.y + target.height / 2) - this.centerY;
            const dist = Math.hypot(dx, dy);
            const spd = 10;
            vx = (dx / dist) * spd;
            vy = (dy / dist) * spd;
        }

        this.game.bullets.push(new Bullet(this.game, this.centerX - 8, this.centerY - 20, vx, vy, true, '#ff2244', 'ballistic'));
        // Explosion particle burst on launch
        for (let i = 0; i < 4; i++) {
            this.game.particles.push(new Particle(this.game, this.centerX, this.centerY, 'spark', '#ff6600'));
        }
    }

    shoot() {
        // Fire bullets from every ship in the fleet
        let activeOffsets = this.getShipOffsets();

        activeOffsets.forEach(off => {
            let bX = this.centerX + off.dx;
            let bY = this.centerY + off.dy;

            if (this.weaponType === 'normal') {
                this.game.bullets.push(new Bullet(this.game, bX - 2, bY - 20, 0, -12, true, '#00ffcc', 'normal'));
            } else if (this.weaponType === 'double') {
                this.game.bullets.push(new Bullet(this.game, bX - 10, bY - 15, -3, -12, true, '#00ffcc', 'normal'));
                this.game.bullets.push(new Bullet(this.game, bX + 10, bY - 15, 3, -12, true, '#00ffcc', 'normal'));
            } else if (this.weaponType === 'laser') {
                this.game.bullets.push(new Bullet(this.game, bX - 2, bY - 60, 0, -15, true, '#00ff00', 'laser'));
            } else if (this.weaponType === 'ripple') {
                this.game.bullets.push(new Bullet(this.game, bX - 5, bY - 20, 0, -8, true, '#ff6600', 'ripple'));
            }

            if (this.missileEnabled) {
                this.game.bullets.push(new Bullet(this.game, bX, bY - 10, 0, -12, true, '#ffaa00', 'missile'));
            }
        });

        // Play shoot sound once per trigger
        this.game.audio.playShoot(this.weaponType);
    }

    draw(ctx) {
        let activeOffsets = this.getShipOffsets();

        activeOffsets.forEach(off => {
            this.drawSingleShip(ctx, this.centerX + off.dx, this.centerY + off.dy);
        });

        // Draw barrier if active around the "lead" ship or the whole cluster?
        // Let's draw it around the cluster for better visual feedback
        if (this.barrierActive) {
            ctx.save();
            ctx.strokeStyle = `rgba(0, 150, 255, ${this.barrierHp * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(this.centerX, this.centerY, this.width * 0.7, this.height * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(0, 150, 255, 0.1)`;
            ctx.fill();
            ctx.restore();
        }

        // --- Guardian: draw orbiting spinners ---
        if (this.guardianActive) {
            const t = Date.now();
            for (let i = 0; i < this.guardianCount; i++) {
                const angle = this.guardianAngle + (i / this.guardianCount) * Math.PI * 2;
                const sx = this.centerX + Math.cos(angle) * this.guardianRadius;
                const sy = this.centerY + Math.sin(angle) * this.guardianRadius;
                ctx.save();
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#cc44ff';
                ctx.fillStyle = '#cc44ff';
                ctx.beginPath();
                ctx.arc(sx, sy, 8, 0, Math.PI * 2);
                ctx.fill();
                // Inner bright core
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // --- Force: magnetic field ellipse ---
        if (this.forceActive) {
            const alpha = 0.15 + Math.sin(Date.now() / 200) * 0.08;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 220, 255, ${0.5 + this.forceHp * 0.12})`;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ddff';
            ctx.beginPath();
            ctx.ellipse(this.centerX, this.centerY, this.forceRadius, this.forceRadius * 0.75, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(0, 180, 255, ${alpha})`;
            ctx.fill();
            // Inner ring
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(this.centerX, this.centerY, this.forceRadius * 0.6, this.forceRadius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- Ballistic charges HUD ---
        if (this.ballisticCharges > 0) {
            ctx.save();
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = '#ff2244';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff2244';
            for (let i = 0; i < this.ballisticCharges; i++) {
                ctx.fillText('▲', this.centerX - 8 + i * 14, this.centerY + 40);
            }
            ctx.restore();
        }
    }

    drawSingleShip(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Apply invulnerability flicker
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw Player Ship (Vic Viper Style)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2ff';

        const shipW = 30;
        const shipH = 40;
        const px = -shipW / 2;
        const py = -shipH / 2;

        // 1. Engine Flame
        ctx.save();
        ctx.fillStyle = '#00f2ff';
        ctx.shadowBlur = 20 * this.engineFlameScale;
        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.moveTo(-5, shipH / 2 - 5);
        ctx.lineTo(0, shipH / 2 + 10 * this.engineFlameScale);
        ctx.lineTo(5, shipH / 2 - 5);
        ctx.fill();
        ctx.restore();

        // 2. Wings
        ctx.fillStyle = '#006688';
        ctx.beginPath();
        ctx.moveTo(0, py + shipH * 0.4);
        ctx.lineTo(px, py + shipH * 0.8);
        ctx.lineTo(px + shipW, py + shipH * 0.8);
        ctx.closePath();
        ctx.fill();

        // 3. Body & Prongs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-shipW / 4, py);
        ctx.lineTo(-shipW / 8, py + shipH * 0.7);
        ctx.lineTo(-shipW / 2, py + shipH * 0.7);
        ctx.moveTo(shipW / 4, py);
        ctx.lineTo(shipW / 8, py + shipH * 0.7);
        ctx.lineTo(shipW / 2, py + shipH * 0.7);
        ctx.rect(-shipW / 8, py + shipH * 0.2, shipW / 4, shipH * 0.6);
        ctx.fill();

        // 4. Cockpit
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.ellipse(0, py + shipH * 0.4, shipW / 6, shipH / 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit highlight (re-added from original draw)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(-2, py + shipH * 0.35, 2, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 5. Finishing metallic accents (re-added from original draw)
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-shipW / 4, py); ctx.lineTo(-shipW / 4, py + shipH * 0.7);
        ctx.moveTo(shipW / 4, py); ctx.lineTo(shipW / 4, py + shipH * 0.7);
        ctx.stroke();

        ctx.restore();
    }
}
