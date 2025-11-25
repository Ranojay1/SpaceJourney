window.addEventListener('error', (e) => {
    console.error('[SpaceJourney] uncaught error', e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (ev) => {
    console.error('[SpaceJourney] unhandled rejection', ev.reason);
});

class SpaceJourney {
    constructor() {
        this.config = null;
        this.currentStep = -1;
        this.mainStars = [];
        this.finalPlanet = null;
        this.isAnimating = false;
        this.started = false;
        this.stars = [];
        
        // Camera state for smooth transitions
        this.camera = { x: 0, y: 0, scale: 1 };
        this.targetCamera = { x: 0, y: 0, scale: 1 };
        
        this.elements = {
            canvas: document.getElementById('stars-canvas'),
            warpOverlay: document.getElementById('warp-overlay'),
            universe: document.getElementById('universe'),
            starsContainer: document.getElementById('stars-container'),
            spaceship: document.getElementById('spaceship'),
            titleScreen: document.getElementById('title-screen'),
            mainTitle: document.getElementById('main-title'),
            subtitle: document.getElementById('subtitle'),
            startBtn: document.getElementById('start-btn'),
            messageBox: document.getElementById('message-box'),
            messageText: document.getElementById('message-text'),
            finalScreen: document.getElementById('final-screen'),
            finalMessage: document.getElementById('final-message'),
            flame: document.querySelector('.ship-flame')
        };
        
        // Ship position tracking
        this.shipPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.travelAngle = 0;
        this.speedLinesInterval = null;
        
        this.ctx = this.elements.canvas.getContext('2d');
        // collection for nebula elements to avoid querying the DOM each frame
        this.nebulas = [];
        this._lastNebulaScale = 1;
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.setupTitleScreen();
        this.setupCanvas();
        this.createStars();
        this.createMainStars();
        this.createFinalPlanet();
        // Create space elements AFTER path is defined
        this.createNebulae();
        this.createDistantGalaxies();
        this.createAsteroids();
        this.createStarClusters();
        this.positionShip();
        this.bindEvents();
        this.startShootingStars();
        this.startComets();
        this.animate();
    }
    
    positionShip() {
        // Initial position at center of viewport
        this.elements.spaceship.style.left = `${this.shipPos.x}px`;
        this.elements.spaceship.style.top = `${this.shipPos.y}px`;
    }
    
    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.elements.canvas.width = window.innerWidth;
        this.elements.canvas.height = window.innerHeight;
    }
    
    createStars() {
        const count = 600;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005,
                direction: Math.random() > 0.5 ? 1 : -1
            });
        }
    }
    
    animate() {
        this.ctx.fillStyle = '#000008';
        this.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        
        for (const star of this.stars) {
            star.alpha += star.speed * star.direction;
            if (star.alpha >= 1 || star.alpha <= 0.2) star.direction *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fill();
            
            // Glow effect for larger stars
            if (star.radius > 1) {
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(200, 220, 255, ${star.alpha * 0.2})`;
                this.ctx.fill();
            }
        }
        
        // Update nebula visibility when scale changes enough
        try {
            const s = this.camera.scale || 1;
            if (Math.abs(s - this._lastNebulaScale) > 0.015) {
                this.updateNebulaOnScale(s);
                this._lastNebulaScale = s;
            }
        } catch (e) {}
        requestAnimationFrame(() => this.animate());
    }
    
    async loadConfig() {
        try {
            const response = await fetch('/config');
            if (!response.ok) throw new Error('No se pudo cargar config.json');
            this.config = await response.json();
        } catch (err) {
            document.body.innerHTML = `<div style='color:#fff;background:#222;padding:2em;font-size:1.5em;text-align:center;'>Error cargando configuración: ${err.message}</div>`;
            console.error('Error loading config', err);
            throw err;
        }
    }
    
    setupTitleScreen() {
        this.elements.mainTitle.textContent = this.config.title || 'SPACE JOURNEY';
        this.elements.subtitle.textContent = this.config.subtitle || 'Un viaje entre las estrellas';
        this.elements.startBtn.textContent = this.config.startButton || 'COMENZAR';
        // normal behavior (no forced visibility)
    }
    
    createMainStars() {
        const textsCount = this.config.textos.length;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        let currentX = centerX;
        let currentY = centerY;
        
        for (let i = 0; i < textsCount; i++) {
            const item = this.config.textos[i];
            const star = document.createElement('div');
            const color = item.color || 'white';
            star.className = `star main ${color}`;
            
            // Apply star size - individual or default
            const starSize = item.size || this.config.starSize || 12;
            star.style.width = `${starSize}px`;
            star.style.height = `${starSize}px`;
            
            // Use configured distance or default
            const dist = item.distance || 300;
            const angle = (i / textsCount) * Math.PI * 2 + Math.random() * 0.3;
            const x = currentX + Math.cos(angle) * dist;
            const y = currentY + Math.sin(angle) * dist;
            
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            star.dataset.index = i;
            
            this.elements.starsContainer.appendChild(star);
            this.mainStars.push({
                element: star,
                x: x,
                y: y,
                text: item.text,
                color: color,
                distance: dist
            });
            
            currentX = x;
            currentY = y;
        }
    }
    
    createFinalPlanet() {
        const planetType = this.config.finalPlanetType || 'earth';
        const planet = document.createElement('div');
        planet.className = `planet ${planetType}`;
        
        // Apply planet size from config
        const planetSize = this.config.planetSize || 60;
        planet.style.width = `${planetSize}px`;
        planet.style.height = `${planetSize}px`;
        
        // Position for final planet - use config distance
        const lastStar = this.mainStars[this.mainStars.length - 1];
        const angle = Math.atan2(lastStar.y - window.innerHeight/2, lastStar.x - window.innerWidth/2) + 0.8;
        const distance = this.config.planetDistance || 400;
        const x = lastStar.x + Math.cos(angle) * distance;
        const y = lastStar.y + Math.sin(angle) * distance;
        
        planet.style.left = `${x}px`;
        planet.style.top = `${y}px`;
        
        this.elements.starsContainer.appendChild(planet);
        this.finalPlanet = {
            element: planet,
            x: x,
            y: y
        };
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.start();
        });
        
        document.body.addEventListener('click', () => {
            if (this.started && !this.isAnimating) {
                this.nextStep();
            }
        });
    }
    
    start() {
        this.started = true;
        this.elements.titleScreen.classList.add('hidden');
        setTimeout(() => this.nextStep(), 500);
    }
    
    nextStep() {
        if (this.isAnimating) return;
        
        this.currentStep++;
        
        if (this.currentStep < this.mainStars.length) {
            this.travelToStar(this.currentStep);
        } else if (this.currentStep === this.mainStars.length) {
            this.travelToFinalPlanet();
        }
    }
    
    travelToStar(index) {
        this.isAnimating = true;
        this.elements.messageBox.classList.add('hidden');
        this.elements.flame.classList.add('active');
        
        const star = this.mainStars[index];
        const warpThreshold = this.config.warpThreshold || 400;
        
        // Calculate actual distance from current ship position
        const dx = star.x - this.shipPos.x;
        const dy = star.y - this.shipPos.y;
        const actualDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Duration based on distance and ship speed (lower speed = faster)
        const shipSpeed = this.config.shipSpeed || 3;
        const duration = Math.max(1500, actualDistance * shipSpeed);
        const isWarp = actualDistance > warpThreshold;
        
        // Rotate ship towards target
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        this.travelAngle = Math.atan2(dy, dx); // Store for speed lines
        this.elements.spaceship.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        
        // Enable warp effect if distance is large
        if (isWarp) {
            this.elements.warpOverlay.classList.add('active');
            this.elements.warpOverlay.classList.remove('hidden');
            this.startSpeedLines();
        }
        
        // Animate ship and camera together
        this.animateToTarget(star.x, star.y, duration, () => {
            this.elements.flame.classList.remove('active');
            this.stopSpeedLines();
            this.elements.warpOverlay.classList.remove('active');
            this.elements.spaceship.style.transform = 'translate(-50%, -50%)';
            this.showMessage(star.text);
            this.isAnimating = false;
        });
    }
    
    animateToTarget(targetX, targetY, duration, callback) {
        const startX = this.shipPos.x;
        const startY = this.shipPos.y;
        const startScale = this.camera.scale;
        const targetScale = 2.5; // Zoom in when arriving
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out cubic
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Update ship position
            this.shipPos.x = startX + (targetX - startX) * ease;
            this.shipPos.y = startY + (targetY - startY) * ease;
            
            // Move ship element
            this.elements.spaceship.style.left = `${this.shipPos.x}px`;
            this.elements.spaceship.style.top = `${this.shipPos.y}px`;
            
            // Zoom effect - starts at 70% of journey
            const zoomProgress = Math.max(0, (progress - 0.7) / 0.3);
            const zoomEase = zoomProgress * zoomProgress;
            this.camera.scale = startScale + (targetScale - startScale) * zoomEase;
            
            // Move camera to keep ship centered + apply zoom with easing
            const cameraEase = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const offsetX = window.innerWidth / 2 - this.shipPos.x;
            const offsetY = window.innerHeight / 2 - this.shipPos.y;
            
            this.elements.universe.style.transition = 'none';
            this.elements.universe.style.transformOrigin = `${this.shipPos.x}px ${this.shipPos.y}px`;
            this.elements.universe.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${this.camera.scale})`;

            // adjust nebulas so they don't vanish when zooming (only if scale changed enough)
            try {
                const s = this.camera.scale || 1;
                if (Math.abs(s - this._lastNebulaScale) > 0.015) {
                    this.updateNebulaOnScale(s);
                    this._lastNebulaScale = s;
                }
            } catch (e) {}
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Keep zoom level permanent
                callback();
            }
        };
        
        requestAnimationFrame(animate);
    }

    updateNebulaOnScale(scale) {
        if (!scale || scale <= 0) scale = 1;
        const container = this.elements.starsContainer;
        if (!container) return;
        // use cached nebula list when available
        const list = this.nebulas && this.nebulas.length ? this.nebulas : Array.from(container.querySelectorAll('.nebula, .nebula-cluster'));
        for (const el of list) {
            const baseBlur = parseFloat(el.dataset.baseBlur || '0') || 40;
            const baseOpacity = parseFloat(el.dataset.baseOpacity || '0') || 0.12;

            // compute new values with gentle scaling
            const newBlur = Math.max(1, baseBlur / Math.max(scale, 1));
            // make opacity increase more strongly as we zoom in
            const newOpacity = Math.min(1, Math.max(0.02, baseOpacity * (1 + (scale - 1) * 1.2)));

            // apply styles (avoid forcing layout reads)
            el.style.filter = `blur(${newBlur}px)`;
            el.style.opacity = `${newOpacity}`;
        }
    }
    
    travelToFinalPlanet() {
        this.isAnimating = true;
        this.elements.messageBox.classList.add('hidden');
        this.elements.flame.classList.add('active');
        
        const warpThreshold = this.config.warpThreshold || 400;
        
        // Calculate distance to planet
        const dx = this.finalPlanet.x - this.shipPos.x;
        const dy = this.finalPlanet.y - this.shipPos.y;
        const actualDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Duration based on distance and ship speed
        const shipSpeed = this.config.shipSpeed || 3;
        const duration = Math.max(2000, actualDistance * shipSpeed);
        const isWarp = actualDistance > warpThreshold;
        
        // Point ship towards planet
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        this.travelAngle = Math.atan2(dy, dx);
        this.elements.spaceship.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        
        if (isWarp) {
            this.elements.warpOverlay.classList.add('active');
            this.elements.warpOverlay.classList.remove('hidden');
            this.startSpeedLines();
        }
        
        this.animateToTarget(this.finalPlanet.x, this.finalPlanet.y, duration, () => {
            this.elements.flame.classList.remove('active');
            this.stopSpeedLines();
            this.elements.warpOverlay.classList.remove('active');
            this.elements.spaceship.style.transform = 'translate(-50%, -50%)';
            this.elements.spaceship.classList.add('orbiting');
            this.showFinalMessage();
        });
    }
    
    showMessage(text) {
        this.elements.messageText.textContent = text;
        this.elements.messageBox.classList.remove('hidden');
    }
    
    showFinalMessage() {
        this.elements.finalMessage.textContent = this.config.lastText;
        this.elements.finalScreen.classList.remove('hidden');
    }
    
    startSpeedLines() {
        // Clear any existing interval
        this.stopSpeedLines();
        
        this.speedLinesInterval = setInterval(() => {
            this.createSpeedLine();
        }, 30);
    }
    
    stopSpeedLines() {
        if (this.speedLinesInterval) {
            clearInterval(this.speedLinesInterval);
            this.speedLinesInterval = null;
        }
    }
    
    createSpeedLine() {
        const line = document.createElement('div');
        line.className = 'speed-line';
        
        // Lines appear ahead of the ship in travel direction
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Position lines AHEAD of the ship (in travel direction)
        const aheadDistance = 80 + Math.random() * 150; // Distance ahead of ship
        const spread = 250; // Spread perpendicular to travel direction
        
        // Perpendicular offset for spread
        const perpAngle = this.travelAngle + Math.PI / 2;
        const perpOffset = (Math.random() - 0.5) * spread;
        
        // Start position - ahead of ship with perpendicular spread
        const startX = centerX + Math.cos(this.travelAngle) * aheadDistance + Math.cos(perpAngle) * perpOffset;
        const startY = centerY + Math.sin(this.travelAngle) * aheadDistance + Math.sin(perpAngle) * perpOffset;
        
        // Lines point towards ship (opposite of travel direction)
        const lineAngle = this.travelAngle + Math.PI;
        const lineWidth = 150 + Math.random() * 200;
        
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transform = `rotate(${lineAngle}rad)`;
        line.style.setProperty('--line-width', `${lineWidth}px`);
        
        this.elements.warpOverlay.appendChild(line);
        
        // Remove after animation
        setTimeout(() => line.remove(), 300);
    }
    
    startShootingStars() {
        const freq = this.config.spaceElements?.shootingStars?.frequency || 2000;
        setInterval(() => {
            if (Math.random() > 0.5) this.createShootingStar();
        }, freq);
    }
    
    
    createShootingStar() {
        const star = document.createElement('div');
        star.className = 'shooting-star';

        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight / 2;
        
        const endX = (Math.random() * window.innerWidth * 1.2) - (window.innerWidth * 0.2);
        const endY = (Math.random() * window.innerHeight * 1.2) - (window.innerHeight * 0.2);

        const travelX = endX - startX;
        const travelY = endY - startY;

        const angle = Math.atan2(travelY, travelX) * 180 / Math.PI + 180;
        const duration = 1 + Math.random() * 1.5;
        const tailLength = 100 + Math.random() * 200;

        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;
        star.style.setProperty('--angle', `${angle}deg`);
        star.style.setProperty('--duration', `${duration}s`);
        star.style.setProperty('--tail-length', `${tailLength}px`);
        star.style.setProperty('--end-x', `${travelX}px`);
        star.style.setProperty('--end-y', `${travelY}px`);

        this.elements.starsContainer.appendChild(star);

        setTimeout(() => star.remove(), duration * 1000);
    }

    createNebulae() {
        const cfg = this.config.spaceElements?.nebulae || { count: 5, minSize: 200, maxSize: 500 };
        const colors = ['rgba(138,43,226,0.15)', 'rgba(255,105,180,0.12)', 'rgba(0,191,255,0.1)', 'rgba(255,69,0,0.08)'];
        
        // Place nebulae along the journey path
        for (let i = 0; i < cfg.count; i++) {
            const nebula = document.createElement('div');
            nebula.className = 'nebula';
            const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
            nebula.style.width = `${size}px`;
            nebula.style.height = `${size}px`;
            
            // Position near journey path
            const pathPoint = this.getPointAlongPath(Math.random());
            nebula.style.left = `${pathPoint.x + (Math.random() - 0.5) * 400}px`;
            nebula.style.top = `${pathPoint.y + (Math.random() - 0.5) * 400}px`;
            nebula.style.background = `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 70%)`;
            nebula.style.animationDelay = `${Math.random() * 5}s`;
            this.elements.starsContainer.appendChild(nebula);
        }
    }

    createDistantGalaxies() {
        const cfg = this.config.spaceElements?.distantGalaxies || { count: 3, size: 80 };
        
        for (let i = 0; i < cfg.count; i++) {
            const galaxy = document.createElement('div');
            galaxy.className = 'distant-galaxy';
            galaxy.style.width = `${cfg.size}px`;
            galaxy.style.height = `${cfg.size}px`;
            
            // Position near journey path
            const pathPoint = this.getPointAlongPath(Math.random());
            galaxy.style.left = `${pathPoint.x + (Math.random() - 0.5) * 600}px`;
            galaxy.style.top = `${pathPoint.y + (Math.random() - 0.5) * 600}px`;
            galaxy.style.animationDelay = `${Math.random() * 10}s`;
            this.elements.starsContainer.appendChild(galaxy);
        }
    }

    createAsteroids() {
        const cfg = this.config.spaceElements?.asteroids || { count: 15, minSize: 20, maxSize: 60 };
        this.asteroids = [];
        
        for (let i = 0; i < cfg.count; i++) {
            const asteroid = document.createElement('div');
            asteroid.className = 'asteroid';
            const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
            asteroid.style.width = `${size}px`;
            asteroid.style.height = `${size}px`;
            
            // Position along journey path
            const pathPoint = this.getPointAlongPath(Math.random());
            const x = pathPoint.x + (Math.random() - 0.5) * 500;
            const y = pathPoint.y + (Math.random() - 0.5) * 500;
            
            asteroid.style.left = `${x}px`;
            asteroid.style.top = `${y}px`;
            
            // Random velocity for movement
            const speed = 0.3 + Math.random() * 0.5;
            const angle = Math.random() * Math.PI * 2;
            
            this.asteroids.push({
                el: asteroid,
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 2
            });
            
            this.elements.starsContainer.appendChild(asteroid);
        }
        
        // Start asteroid movement
        this.animateAsteroids();
    }
    
    animateAsteroids() {
        if (!this.asteroids) return;
        
        for (const ast of this.asteroids) {
            ast.x += ast.vx;
            ast.y += ast.vy;
            ast.rotation += ast.rotSpeed;
            ast.el.style.left = `${ast.x}px`;
            ast.el.style.top = `${ast.y}px`;
            ast.el.style.transform = `rotate(${ast.rotation}deg)`;
        }
        
        requestAnimationFrame(() => this.animateAsteroids());
    }

    createStarClusters() {
        // Replace small-point star clusters with configurable soft nebula blobs
        const cfg = this.config.spaceElements?.nebulae || { count: 4, minSize: 120, maxSize: 360 };
        const colors = (cfg.colors && cfg.colors.length) ? cfg.colors : ['rgba(138,43,226,0.14)', 'rgba(255,105,180,0.12)', 'rgba(0,191,255,0.1)', 'rgba(255,69,0,0.08)', 'rgba(120,255,180,0.08)'];

        const clusterCount = cfg.count || 4;
        for (let c = 0; c < clusterCount; c++) {
            const t = (c + 0.3) / clusterCount;
            const pathPoint = this.getPointAlongPath(t);
            const clusterX = pathPoint.x + (Math.random() - 0.5) * 300;
            const clusterY = pathPoint.y + (Math.random() - 0.5) * 300;

            const nebula = document.createElement('div');
            nebula.className = 'nebula nebula-cluster';
            const size = (cfg.minSize || 120) + Math.random() * ((cfg.maxSize || 360) - (cfg.minSize || 120));
            nebula.style.width = `${size}px`;
            nebula.style.height = `${size}px`;
            nebula.style.left = `${clusterX}px`;
            nebula.style.top = `${clusterY}px`;

            const color = colors[c % colors.length];
            nebula.style.background = `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 60%)`;

            const opacityMin = (typeof cfg.opacityMin === 'number') ? cfg.opacityMin : 0.08;
            const opacityMax = (typeof cfg.opacityMax === 'number') ? cfg.opacityMax : 0.18;
            const opacityVal = (opacityMin + Math.random() * (opacityMax - opacityMin));
            nebula.style.opacity = opacityVal.toFixed(3);

            const blurMin = (typeof cfg.blurMin === 'number') ? cfg.blurMin : 30;
            const blurMax = (typeof cfg.blurMax === 'number') ? cfg.blurMax : 80;
            const blurVal = Math.floor(blurMin + Math.random() * (blurMax - blurMin));
            nebula.style.filter = `blur(${blurVal}px)`;
            // store base values for dynamic adjustments when zooming
            nebula.dataset.baseBlur = String(blurVal);
            nebula.dataset.baseOpacity = String(opacityVal);

            const blend = cfg.blendMode || 'screen';
            nebula.style.mixBlendMode = blend;

            const durMin = (typeof cfg.animationDurationMin === 'number') ? cfg.animationDurationMin : 6;
            const durMax = (typeof cfg.animationDurationMax === 'number') ? cfg.animationDurationMax : 12;
            nebula.style.animationDuration = `${(durMin + Math.random() * (durMax - durMin)).toFixed(1)}s`;
            nebula.style.animationDelay = `${Math.random() * Math.max(0, (durMax - durMin))}s`;
            this.elements.starsContainer.appendChild(nebula);
            // cache nebula node for efficient updates
            this.nebulas.push(nebula);
        }
    }

    startComets() {
        setInterval(() => {
            if (Math.random() > 0.3) this.createComet();
        }, 8000);
    }

    createComet() {
        const comet = document.createElement('div');
        comet.className = 'comet';
        
        // Spawn near current camera view
        const camX = -this.camera.x + window.innerWidth / 2;
        const camY = -this.camera.y + window.innerHeight / 2;
        
        const startX = camX + window.innerWidth * 0.8;
        const startY = camY - 100;
        
        comet.style.left = `${startX}px`;
        comet.style.top = `${startY}px`;
        this.elements.starsContainer.appendChild(comet);
        setTimeout(() => comet.remove(), 4000);
    }
    
    // Helper: get a point along the journey path (0 = start, 1 = end)
    getPointAlongPath(t) {
        const points = [
            { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            ...this.mainStars.map(s => ({ x: s.x, y: s.y }))
        ];
        
        if (this.finalPlanet) {
            points.push({ x: this.finalPlanet.x, y: this.finalPlanet.y });
        }
        
        if (points.length < 2) return points[0] || { x: 0, y: 0 };
        
        const totalSegments = points.length - 1;
        const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
        const segmentT = (t * totalSegments) - segmentIndex;
        
        const p1 = points[segmentIndex];
        const p2 = points[segmentIndex + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * segmentT,
            y: p1.y + (p2.y - p1.y) * segmentT
        };
    }
}

document.addEventListener('DOMContentLoaded', () => new SpaceJourney());
