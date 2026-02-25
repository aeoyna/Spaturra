class Background {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.layers = [
            { stars: [], speed: 0.2, count: 50, color: 'rgba(255, 255, 255, 0.3)', size: 1 },
            { stars: [], speed: 0.8, count: 30, color: 'rgba(200, 240, 255, 0.6)', size: 2 },
            { stars: [], speed: 2.5, count: 15, color: 'rgba(255, 255, 255, 0.9)', size: 3 }
        ];

        this.layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                layer.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: Math.random() * layer.size + 0.5
                });
            }
        });

        // Nebula clouds
        this.nebulae = [];
        for (let i = 0; i < 3; i++) {
            this.nebulae.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 300 + 200,
                color: i === 0 ? 'rgba(50, 0, 150, 0.1)' : (i === 1 ? 'rgba(0, 50, 100, 0.1)' : 'rgba(100, 0, 100, 0.05)'),
                speed: 0.1
            });
        }
    }

    update() {
        this.layers.forEach(layer => {
            for (let star of layer.stars) {
                star.y += layer.speed;
                if (star.y > this.height) {
                    star.y = 0;
                    star.x = Math.random() * this.width;
                }
            }
        });

        for (let neb of this.nebulae) {
            neb.y += neb.speed;
            if (neb.y > this.height + neb.size) {
                neb.y = -neb.size;
                neb.x = Math.random() * this.width;
            }
        }
    }

    draw(ctx) {
        // Draw Nebulae first
        for (let neb of this.nebulae) {
            let grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.size);
            grad.addColorStop(0, neb.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(neb.x, neb.y, neb.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Parallax Stars
        this.layers.forEach(layer => {
            ctx.fillStyle = layer.color;
            for (let star of layer.stars) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Refined CRT Effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let i = 0; i < this.height; i += 3) {
            ctx.fillRect(0, i, this.width, 1);
        }
    }
}
