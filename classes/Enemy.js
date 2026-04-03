class Enemy {
    constructor(x, y, radius, color, velocity, health = 10) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.health = health;
        this.maxHealth = health;
    }

    draw(ctx) {      
        ctx.beginPath();
        // Dibujemos al enemigo como un rombo invertido o poligono
        const numberOfSides = Math.random() > 0.5 ? 4 : 5;
        const size = this.radius;
        
        ctx.moveTo (this.x +  size * Math.cos(0), this.y +  size *  Math.sin(0));

        for (let i = 1; i <= numberOfSides; i++) {
            ctx.lineTo (this.x + size * Math.cos(i * 2 * Math.PI / numberOfSides), this.y + size * Math.sin(i * 2 * Math.PI / numberOfSides));
        }

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(ctx, playerPos) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw(ctx);
    }
}
