class Game {
    constructor(canvasWidth, canvasHeight, audioManager) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.audio = audioManager;
        this.input = new InputHandler();
        this.background = new Background(this.width, this.height);
        this.player = new Player(this);

        this.bullets = [];
        this.enemies = [];
        this.midbosses = [];
        this.gates = [];
        this.barrels = []; // New barrel array
        this.obstacles = []; // Indestructible hazards
        this.particles = []; // For explosions if time permits
        this.powerUps = []; // Option powerups

        this.finalBossSpawned = false;
        this.finalBossSpawnMilestone = 10000;

        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 20; // 3 enemies per second at 60fps (much faster swarm)
        this.midbossSpawnMilestone = 1500;

        this.shakeDuration = 0;
        this.shakeMagnitude = 0;

        this.gateSpawnTimer = 0;
        this.gateSpawnInterval = 600; // Spawn a gate every 10 seconds or so

        this.barrelSpawnTimer = 0;
        this.barrelSpawnInterval = 300; // Spawn a barrel every ~5 seconds

        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = 400; // Less frequent than barrels

        this.score = 0;
        this.gameOver = false;

        this.scoreElement = document.getElementById('score-display');
        this.livesElement = document.getElementById('lives-display'); // New HUD element
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScoreElement = document.getElementById('final-score');
    }

    update() {
        if (this.gameOver) return;

        this.background.update();
        this.player.update(this.input);

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);

        // Spawn enemies (with per-type caps)
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            // Count how many of each type are currently alive
            const waveCount = this.enemies.filter(e => e.type === 'wave').length;
            const sniperCount = this.enemies.filter(e => e.type === 'sniper').length;

            const MAX_WAVE = 3; // Max blue (wave) enemies on screen
            const MAX_SNIPER = 2; // Max yellow (sniper) enemies on screen

            // Spawn candidate; if over-cap, downgrade to chaser
            const candidate = new Enemy(this);
            if ((candidate.type === 'wave' && waveCount >= MAX_WAVE) ||
                (candidate.type === 'sniper' && sniperCount >= MAX_SNIPER)) {
                candidate.type = 'chaser';
                candidate.color = '#ff3366';
                candidate.speed = Math.random() * 1 + 1;
                candidate.canShoot = false;
            }
            this.enemies.push(candidate);
            this.enemySpawnTimer = 0;
            // Slightly decrease spawn interval to make it harder over time
            if (this.enemySpawnInterval > 10) {
                this.enemySpawnInterval -= 0.2;
            }
        }

        // Spawn MidBoss based on score
        if (this.score >= this.midbossSpawnMilestone && this.midbosses.length === 0 && !this.finalBossSpawned) {
            this.midbosses.push(new MidBoss(this));
            this.midbossSpawnMilestone = this.score + 3000; // Next one is 3000 points AFTER the current score
        }

        // Spawn Final Boss
        if (this.score >= this.finalBossSpawnMilestone && !this.finalBossSpawned) {
            this.finalBossSpawned = true;
            let fb = new FinalBoss(this);
            fb.isFinalBoss = true; // Use a flag for easy checking
            this.midbosses.push(fb);
        }

        // Spawn Gates
        this.gateSpawnTimer++;
        if (this.gateSpawnTimer > this.gateSpawnInterval) {
            let modifiers = ['x2', 'x3', '-1', '-2']; // Mix of buff and debuff gates
            let mod = modifiers[Math.floor(Math.random() * modifiers.length)];
            let xPos = Math.random() * (this.width - 120); // Gate width is 120
            this.gates.push(new Gate(this, xPos, mod));
            this.gateSpawnTimer = 0;
        }

        // Spawn Barrels
        this.barrelSpawnTimer++;
        if (this.barrelSpawnTimer > this.barrelSpawnInterval) {
            this.barrels.push(new Barrel(this));
            this.barrelSpawnTimer = 0;
        }

        // Spawn Obstacles
        this.obstacleSpawnTimer++;
        if (this.obstacleSpawnTimer > this.obstacleSpawnInterval) {
            this.obstacles.push(new Obstacle(this));
            this.obstacleSpawnTimer = 0;
        }

        // Update enemies
        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

        // Update midbosses
        this.midbosses.forEach(mb => mb.update());
        this.midbosses = this.midbosses.filter(mb => !mb.markedForDeletion);

        // Update Gates
        this.gates.forEach(gate => gate.update());
        this.gates = this.gates.filter(gate => !gate.markedForDeletion);

        // Update Barrels
        this.barrels.forEach(barrel => barrel.update());
        this.barrels = this.barrels.filter(barrel => !barrel.markedForDeletion);

        // Update Obstacles
        this.obstacles.forEach(obs => obs.update());
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        // Update Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Update PowerUps
        this.powerUps.forEach(item => item.update());
        this.powerUps = this.powerUps.filter(item => !item.markedForDeletion);

        if (this.shakeDuration > 0) {
            this.shakeDuration--;
        }

        this.checkCollisions();
    }

    triggerShake(duration, magnitude) {
        this.shakeDuration = duration;
        this.shakeMagnitude = magnitude;
    }

    draw(ctx) {
        ctx.save();
        if (this.shakeDuration > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude;
            ctx.translate(dx, dy);
        }

        this.background.draw(ctx);
        this.player.draw(ctx);
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.enemies.forEach(enemy => enemy.draw(ctx));
        this.midbosses.forEach(mb => mb.draw(ctx));
        this.gates.forEach(gate => gate.draw(ctx));
        this.barrels.forEach(barrel => barrel.draw(ctx));
        this.obstacles.forEach(obs => obs.draw(ctx));
        this.particles.forEach(p => p.draw(ctx));
        this.powerUps.forEach(item => item.draw(ctx));

        ctx.restore();
    }

    checkCollisions() {
        // Simple AABB Collision
        const checkRectCollision = (rect1, rect2) => {
            return (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y);
        };

        // 1. Player Bullets vs Enemies / MidBoss
        this.bullets.forEach(bullet => {
            if (bullet.isPlayerBullet) {
                // Check Heart enemies
                this.enemies.forEach(enemy => {
                    if (!bullet.markedForDeletion && !enemy.markedForDeletion) {
                        if (checkRectCollision(bullet, enemy)) {
                            bullet.pierceCount--;
                            if (bullet.pierceCount <= 0) bullet.markedForDeletion = true;

                            enemy.markedForDeletion = true;
                            this.score += 100;
                            this.scoreElement.innerText = `Score: ${this.score}`;

                            // Enemy Explosion
                            this.audio.playExplosion();
                            let cx = enemy.x + enemy.width / 2;
                            let cy = enemy.y + enemy.height / 2;
                            for (let i = 0; i < 5; i++) this.particles.push(new Particle(this, cx, cy, 'explosion', '#ff6600'));
                            for (let i = 0; i < 5; i++) this.particles.push(new Particle(this, cx, cy, 'spark', '#ffff00'));
                        }
                    }
                });
                // Check MidBosses
                this.midbosses.forEach(mb => {
                    if (!bullet.markedForDeletion && !mb.markedForDeletion) {
                        if (checkRectCollision(bullet, mb)) {
                            bullet.pierceCount--;
                            if (bullet.pierceCount <= 0) bullet.markedForDeletion = true;

                            mb.hp--;
                            mb.hitTimer = 3; // Flash white for 3 frames
                            if (mb.hp <= 0) {
                                mb.markedForDeletion = true;
                                this.score += mb.isFinalBoss ? 5000 : 1000; // High score for boss
                                this.scoreElement.innerText = `Score: ${this.score}`;

                                if (mb.isFinalBoss) {
                                    this.finalBossSpawned = false;
                                    this.finalBossSpawnMilestone += 10000;
                                }

                                // Huge Explosion & Shake
                                this.triggerShake(20, 10);
                                this.audio.playExplosion();
                                let cx = mb.x + mb.width / 2;
                                let cy = mb.y + mb.height / 2;
                                for (let i = 0; i < 20; i++) this.particles.push(new Particle(this, cx, cy, 'explosion', '#ff0000'));
                                for (let i = 0; i < 20; i++) this.particles.push(new Particle(this, cx, cy, 'spark', '#ffff00'));
                                for (let i = 0; i < 10; i++) this.particles.push(new Particle(this, cx, cy, 'smoke'));
                            }
                        }
                    }
                });
                // Check Barrels
                this.barrels.forEach(barrel => {
                    if (!bullet.markedForDeletion && !barrel.markedForDeletion) {
                        if (checkRectCollision(bullet, barrel)) {
                            bullet.pierceCount--;
                            if (bullet.pierceCount <= 0) bullet.markedForDeletion = true;

                            barrel.hp--;
                            barrel.hitTimer = 3; // Flash white
                            if (barrel.hp <= 0) {
                                barrel.markedForDeletion = true;
                                this.score += 50; // Points for barrel
                                this.scoreElement.innerText = `Score: ${this.score}`;

                                // Barrel Explosion
                                this.audio.playExplosion();
                                let cx = barrel.x + barrel.width / 2;
                                let cy = barrel.y + barrel.height / 2;
                                for (let i = 0; i < 3; i++) this.particles.push(new Particle(this, cx, cy, 'explosion', '#aaaaaa'));
                                for (let i = 0; i < 3; i++) this.particles.push(new Particle(this, cx, cy, 'spark', '#ffffff'));

                                // Ensure powerup is fully inside canvas when spawned
                                let puX = barrel.x + barrel.width / 2;
                                let puY = barrel.y + barrel.height / 2;
                                if (puX < 15) puX = 15;
                                if (puX > this.width - 15) puX = this.width - 15;

                                this.powerUps.push(new PowerUp(this, puX, puY));
                            }
                        }
                    }
                });
                // Check Obstacles (indestructible)
                this.obstacles.forEach(obs => {
                    if (!bullet.markedForDeletion && !obs.markedForDeletion) {
                        if (checkRectCollision(bullet, obs)) {
                            bullet.markedForDeletion = true; // Bullet is destroyed
                            obs.hitTimer = 3; // Flash white
                            // Spark
                            this.particles.push(new Particle(this, bullet.x, bullet.y, 'spark', '#cccccc'));
                        }
                    }
                });
                // Check Enemy Bullets (Cancellation) — skip ballistic vs enemy bullets
                if (bullet.type !== 'ballistic') {
                    this.bullets.forEach(enemyBullet => {
                        if (!enemyBullet.isPlayerBullet && !enemyBullet.markedForDeletion && !bullet.markedForDeletion) {
                            if (checkRectCollision(bullet, enemyBullet)) {
                                bullet.markedForDeletion = true;
                                enemyBullet.markedForDeletion = true;
                                // Bullet Clash Spark
                                let cx = bullet.x + bullet.width / 2;
                                let cy = bullet.y + bullet.height / 2;
                                for (let i = 0; i < 3; i++) this.particles.push(new Particle(this, cx, cy, 'spark', '#ffffff'));
                            }
                        }
                    });
                }
            } else {
                // 2. Enemy Bullets vs Player
                if (!bullet.markedForDeletion) {
                    if (checkRectCollision(bullet, this.player)) {
                        bullet.markedForDeletion = true;
                        this.damagePlayer();
                    }
                }
            }
        });

        // 2b. Ballistic missiles: area explosion on contact with enemies/bosses
        this.bullets.forEach(bullet => {
            if (!bullet.isPlayerBullet || bullet.type !== 'ballistic' || bullet.markedForDeletion) return;
            const bCx = bullet.x + bullet.width / 2;
            const bCy = bullet.y + bullet.height / 2;
            const BLAST_R = 80;
            let hit = false;

            const checkBlast = (target) => {
                if (target.markedForDeletion) return;
                const tx = target.x + target.width / 2;
                const ty = target.y + target.height / 2;
                if (Math.hypot(tx - bCx, ty - bCy) < BLAST_R + target.width / 2) {
                    hit = true;
                    if (target.hp !== undefined) {
                        target.hp -= 5;
                        target.hitTimer = 5;
                        if (target.hp <= 0) {
                            target.markedForDeletion = true;
                            this.score += target.isFinalBoss ? 5000 : 1000;
                            this.scoreElement.innerText = `Score: ${this.score}`;
                        }
                    } else {
                        target.markedForDeletion = true;
                        this.score += 100;
                        this.scoreElement.innerText = `Score: ${this.score}`;
                    }
                    // Explosion particles
                    for (let i = 0; i < 4; i++) this.particles.push(new Particle(this, tx, ty, 'explosion', '#ff4400'));
                    for (let i = 0; i < 3; i++) this.particles.push(new Particle(this, tx, ty, 'spark', '#ffff00'));
                }
            };

            this.enemies.forEach(checkBlast);
            this.midbosses.forEach(checkBlast);

            if (hit) {
                bullet.markedForDeletion = true;
                this.triggerShake(10, 6);
                this.audio.playExplosion();
                // Large central blast
                for (let i = 0; i < 15; i++) this.particles.push(new Particle(this, bCx, bCy, 'explosion', '#ff2244'));
                for (let i = 0; i < 10; i++) this.particles.push(new Particle(this, bCx, bCy, 'spark', '#ffaa00'));
            }
        });

        // 3. Enemies & MidBosses & Barrels vs Player
        this.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion) {
                if (checkRectCollision(enemy, this.player)) {
                    enemy.markedForDeletion = true; // Destroy the enemy that hits you
                    this.damagePlayer();
                }
            }
        });

        // 3b. Guardian spinners vs enemies
        if (this.player.guardianActive) {
            for (let i = 0; i < this.player.guardianCount; i++) {
                const angle = this.player.guardianAngle + (i / this.player.guardianCount) * Math.PI * 2;
                const sx = this.player.centerX + Math.cos(angle) * this.player.guardianRadius;
                const sy = this.player.centerY + Math.sin(angle) * this.player.guardianRadius;
                const spinnerRect = { x: sx - 8, y: sy - 8, width: 16, height: 16 };

                this.enemies.forEach(enemy => {
                    if (!enemy.markedForDeletion && checkRectCollision(spinnerRect, enemy)) {
                        enemy.markedForDeletion = true;
                        this.score += 100;
                        this.scoreElement.innerText = `Score: ${this.score}`;
                        this.audio.playExplosion();
                        for (let p = 0; p < 4; p++) this.particles.push(new Particle(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'explosion', '#cc44ff'));
                    }
                });
            }
        }

        // 3c. Force field vs chaser enemies
        if (this.player.forceActive) {
            this.enemies.forEach(enemy => {
                if (enemy.markedForDeletion || enemy.type !== 'chaser') return;
                const ex = enemy.x + enemy.width / 2;
                const ey = enemy.y + enemy.height / 2;
                const dist = Math.hypot(ex - this.player.centerX, ey - this.player.centerY);
                if (dist < this.player.forceRadius + enemy.width / 2) {
                    enemy.markedForDeletion = true;
                    this.score += 100;
                    this.scoreElement.innerText = `Score: ${this.score}`;
                    this.audio.playExplosion();
                    for (let p = 0; p < 4; p++) this.particles.push(new Particle(this, ex, ey, 'spark', '#00ddff'));
                }
            });
        }
        this.midbosses.forEach(mb => {
            if (!mb.markedForDeletion) {
                if (checkRectCollision(mb, this.player)) {
                    this.damagePlayer();
                }
            }
        });
        this.barrels.forEach(barrel => {
            if (!barrel.markedForDeletion) {
                if (checkRectCollision(barrel, this.player)) {
                    barrel.markedForDeletion = true; // Destroy on impact
                    this.damagePlayer();
                }
            }
        });
        this.obstacles.forEach(obs => {
            if (!obs.markedForDeletion) {
                if (checkRectCollision(obs, this.player)) {
                    obs.markedForDeletion = true; // Destroy on impact
                    this.damagePlayer();
                }
            }
        });

        // 4. Gates vs Player
        this.gates.forEach(gate => {
            if (!gate.markedForDeletion) {
                if (checkRectCollision(gate, this.player)) {
                    gate.markedForDeletion = true;
                    this.audio.playPowerUp();

                    if (gate.isPenalty) {
                        let penalty = parseInt(gate.modifier, 10); // e.g. -1
                        this.player.firePower += penalty;
                        if (this.player.firePower <= 0) {
                            this.triggerGameOver();
                        }
                    } else {
                        let multiplier = parseInt(gate.modifier.substring(1), 10); // e.g. 2 -> "x2".substring(1)
                        if (this.player.firePower < 10) {
                            this.player.firePower = this.player.firePower * multiplier;
                            if (this.player.firePower > 10) this.player.firePower = 10;
                        }
                    }
                    this.livesElement.innerText = `Ships: ${this.player.firePower}`;
                }
            }
        });

        // 5. PowerUps vs Player
        this.powerUps.forEach(item => {
            if (!item.markedForDeletion) {
                if (checkRectCollision(item, this.player)) {
                    item.markedForDeletion = true;
                    this.audio.playPowerUp();
                    // PowerUp Types: 0:SpeedUp, 1:Missile, 2:Double, 3:Laser, 4:Ripple, 5:Barrier
                    switch (item.type) {
                        case 0:
                            if (this.player.speedLevel < 5) {
                                this.player.speedLevel++;
                                this.player.speed = this.player.baseSpeed + this.player.speedLevel * 2;
                            } else {
                                this.score += 500;
                            }
                            break;
                        case 1: // Missile
                            if (this.player.weaponType !== 'missile') {
                                this.player.weaponType = 'missile';
                                this.player.missileEnabled = true; // Kept for backwards compatibility but we'll use weaponType mostly
                            } else {
                                this.score += 500;
                            }
                            break;
                        case 2: // Double
                            if (this.player.weaponType !== 'double') {
                                this.player.weaponType = 'double';
                                this.player.missileEnabled = false; // Disable missile
                            } else {
                                this.score += 500;
                            }
                            break;
                        case 3: // Laser
                            if (this.player.weaponType !== 'laser') {
                                this.player.weaponType = 'laser';
                                this.player.missileEnabled = false; // Disable missile
                            } else {
                                this.score += 500;
                            }
                            break;
                        case 4: // Ripple
                            if (this.player.weaponType !== 'ripple') {
                                this.player.weaponType = 'ripple';
                                this.player.missileEnabled = false; // Disable missile
                            } else {
                                this.score += 500;
                            }
                            break;
                        case 5:
                            this.player.barrierActive = true;
                            this.player.barrierHp = 3; // Refills or activates barrier
                            break;
                        case 6: // Guardian
                            this.player.guardianActive = true;
                            break;
                        case 7: // Force
                            this.player.forceActive = true;
                            this.player.forceHp = 3;
                            break;
                        case 8: // Ballistic Missile
                            this.player.ballisticCharges = Math.min(
                                this.player.ballisticMaxCharges,
                                this.player.ballisticCharges + 3
                            );
                            this.player.ballisticTimer = 0; // Ready to fire immediately
                            break;
                    }
                    this.scoreElement.innerText = `Score: ${this.score}`;
                    this.livesElement.innerText = `Ships: ${this.player.firePower}`; // Sync lives with HUD
                }
            }
        });
    }

    damagePlayer() {
        if (this.player.invulnerableTimer > 0) return; // Ignore damage during i-frames

        this.triggerShake(15, 8); // Shake the screen when hit
        this.audio.playDamage(); // Play damage sound

        // Damage sparks
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(this, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'spark', '#00ffcc'));
        }

        if (this.player.barrierActive) {
            this.player.barrierHp--;
            this.player.invulnerableTimer = 30; // Half sec i-frames for barrier hit
            if (this.player.barrierHp <= 0) {
                this.player.barrierActive = false;
            }
            return; // Shield absorbed damage
        }

        this.player.firePower--; // Lose one ship
        this.livesElement.innerText = `Ships: ${this.player.firePower}`; // Update HUD
        // Reset powerups
        this.player.weaponType = 'normal';
        this.player.missileEnabled = false;
        this.player.speedLevel = 0;
        this.player.speed = this.player.baseSpeed;

        this.player.invulnerableTimer = 60; // 1 second of invulnerability at 60fps

        if (this.player.firePower <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.gameOverScreen.classList.remove('hidden');
        this.finalScoreElement.innerText = this.score;
    }
}
