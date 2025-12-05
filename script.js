let scene, camera, renderer;
let globe, snowParticles = [];
let isShaking = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;

// Variables pour la détection de shake mobile
let accHistory = [];
let shakeThrottle = false;
let lastX = 0, lastY = 0, lastZ = 0;
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function init() {
    // Scène
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

    // Caméra
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.5);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    // Conteneur de la boule
    globe = new THREE.Group();
    scene.add(globe);

    // Base en bois
    const baseGeometry = new THREE.CylinderGeometry(2, 2.3, 0.5, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.8,
        metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.25;
    globe.add(base);

    // Socle intérieur
    const innerBaseGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.2, 32);
    const innerBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3
    });
    const innerBase = new THREE.Mesh(innerBaseGeometry, innerBaseMaterial);
    innerBase.position.y = -1.9;
    globe.add(innerBase);

    // Sapin
    createTree();

    // Petite maison
    createHouse();

    // Sphère en verre
    const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        envMapIntensity: 1
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = -0.6;
    globe.add(sphere);

    // Particules de neige
    createSnowParticles();

    // Events
    if (!isMobile) {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('click', shakeGlobe);
    } else {
        // Pour mobile : rotation au toucher
        let touchStartX = 0, touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            const deltaX = (touchX - touchStartX) / window.innerWidth;
            const deltaY = (touchY - touchStartY) / window.innerHeight;

            targetRotationY = deltaX * Math.PI * 2;
            targetRotationX = -deltaY * Math.PI;
        }, { passive: false });

        // Masquer le prompt après la première interaction
        document.addEventListener('touchstart', () => {
            const prompt = document.getElementById('shake-prompt');
            if (prompt) {
                prompt.style.opacity = '0';
                setTimeout(() => prompt.remove(), 500);
            }
        }, { once: true });
    }

    window.addEventListener('resize', onWindowResize);

    // Initialiser la détection de shake mobile
    initShakeDetection();
}

function createTree() {
    const treeGroup = new THREE.Group();

    // Tronc
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = -1.6;
    treeGroup.add(trunk);

    // Feuillage (3 cônes)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x0d5c0d });

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), foliageMaterial);
    cone1.position.y = -1.2;
    treeGroup.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 8), foliageMaterial);
    cone2.position.y = -0.7;
    treeGroup.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8), foliageMaterial);
    cone3.position.y = -0.2;
    treeGroup.add(cone3);

    // Étoile
    const starGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const starMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.y = 0.3;
    treeGroup.add(star);

    treeGroup.position.x = -0.6;
    globe.add(treeGroup);
}

function createHouse() {
    const houseGroup = new THREE.Group();

    // Murs
    const wallGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd2691e });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = -1.55;
    houseGroup.add(walls);

    // Toit
    const roofGeometry = new THREE.ConeGeometry(0.5, 0.4, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = -1.1;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);

    // Porte
    const doorGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.02);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -1.675, 0.31);
    houseGroup.add(door);

    // Fenêtre
    const windowGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.02);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        emissive: 0xffeb3b,
        emissiveIntensity: 0.3
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(0.15, -1.5, 0.31);
    houseGroup.add(window1);

    houseGroup.position.x = 0.7;
    globe.add(houseGroup);
}

function createSnowParticles() {
    const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5
    });

    for (let i = 0; i < 300; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        particle.position.x = (Math.random() - 0.5) * 3.5;
        particle.position.y = Math.random() * 3.5 - 2.4;
        particle.position.z = (Math.random() - 0.5) * 3.5;

        // Vérifie si dans la sphère (centrée à y = -0.6)
        const sphereCenter = new THREE.Vector3(0, -0.6, 0);
        const distance = particle.position.distanceTo(sphereCenter);

        if (distance < 1.9) {
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.002,
                -Math.random() * 0.005 - 0.005,
                (Math.random() - 0.5) * 0.002
            );
            particle.userData.settled = false;
            particle.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
            snowParticles.push(particle);
            globe.add(particle);
        }
    }
}

function shakeGlobe() {
    isShaking = true;

    snowParticles.forEach(particle => {
        // Libère les particules posées
        particle.userData.settled = false;

        // Vélocités beaucoup plus aléatoires et turbulentes
        const angle = Math.random() * Math.PI * 2;
        const strength = Math.random() * 0.04 + 0.02;

        particle.userData.velocity.x = Math.cos(angle) * strength * (Math.random() + 0.5);
        particle.userData.velocity.y = Math.random() * 0.05 + 0.01;
        particle.userData.velocity.z = Math.sin(angle) * strength * (Math.random() + 0.5);
    });

    setTimeout(() => {
        isShaking = false;
    }, 2000);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    targetRotationX = mouseY * 0.3;
    targetRotationY = mouseX * Math.PI;
}

function initShakeDetection() {
    // Demander la permission pour iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // Créer un bouton de permission pour iOS
        const permissionButton = document.createElement('button');
        permissionButton.id = 'permission-btn';
        permissionButton.textContent = 'Activer le shake';
        permissionButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            font-size: 18px;
            background: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            z-index: 2000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        permissionButton.addEventListener('click', async () => {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    setupDeviceMotion();
                    permissionButton.remove();
                } else {
                    alert('Permission refusée. Vous ne pourrez pas utiliser la fonction shake.');
                    permissionButton.remove();
                }
            } catch (error) {
                console.error('Erreur lors de la demande de permission:', error);
                permissionButton.remove();
            }
        });

        document.body.appendChild(permissionButton);
    } else if (window.DeviceMotionEvent) {
        // Android et autres appareils
        setupDeviceMotion();
    }
}

function setupDeviceMotion() {
    window.addEventListener('devicemotion', (e) => {
        if (shakeThrottle) return;

        const acc = e.accelerationIncludingGravity;
        if (!acc) return;

        // Calculer l'accélération totale
        const totalAcc = Math.sqrt(
            Math.pow(acc.x || 0, 2) +
            Math.pow(acc.y || 0, 2) +
            Math.pow(acc.z || 0, 2)
        );

        accHistory.push(totalAcc);
        if (accHistory.length > 10) accHistory.shift();

        // Calculer la variation
        if (accHistory.length >= 3) {
            const recent = accHistory.slice(-3);
            const max = Math.max(...recent);
            const min = Math.min(...recent);
            const variation = max - min;

            // Seuil de sensibilité
            if (variation > 5) {
                const intensity = Math.min(Math.floor(variation / 2), 12);
                shakeGlobe(intensity);

                // Feedback visuel
                updateShakeInfo(variation.toFixed(1));

                // Throttle pour éviter trop d'appels
                shakeThrottle = true;
                setTimeout(() => shakeThrottle = false, 100);
            }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
    });
}

function updateShakeInfo(intensity) {
    const info = document.getElementById('info');
    if (info) {
        info.textContent = `🌨️ Shake détecté ! Intensité: ${intensity}`;
        info.style.background = 'rgba(0,200,100,0.8)';

        setTimeout(() => {
            info.textContent = 'Secouez votre téléphone ! 🌨️';
            info.style.background = 'rgba(0,0,0,0.7)';
        }, 1000);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotation douce
    globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;
    globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;

    // Animation des flocons
    snowParticles.forEach(particle => {
        // Ignore les particules posées au sol
        if (particle.userData.settled) return;

        particle.position.add(particle.userData.velocity);

        if (!isShaking) {
            // Gravité
            particle.userData.velocity.y -= 0.0003;

            // Friction de l'air (ralentit progressivement)
            particle.userData.velocity.x *= 0.98;
            particle.userData.velocity.z *= 0.98;

            // Petit mouvement de rotation aléatoire
            particle.position.x += Math.sin(Date.now() * 0.001 + particle.id) * 0.0003;
            particle.position.z += Math.cos(Date.now() * 0.001 + particle.id) * 0.0003;
        }

        // Limites sphériques (à vérifier AVANT le sol)
        // La sphère est centrée à y = -0.6
        const sphereCenter = new THREE.Vector3(0, -0.6, 0);
        const distanceFromCenter = particle.position.distanceTo(sphereCenter);

        if (distanceFromCenter > 1.8) {
            const normal = particle.position.clone().sub(sphereCenter).normalize();

            // Replace la particule à l'intérieur
            particle.position.copy(sphereCenter.clone().add(normal.multiplyScalar(1.78)));

            // Rebond contre le verre avec forte perte d'énergie
            const dot = particle.userData.velocity.dot(normal);
            particle.userData.velocity.sub(normal.multiplyScalar(2 * dot)).multiplyScalar(0.3);

            // Force une composante vers le bas pour éviter de rester collé
            particle.userData.velocity.y -= 0.005;

            // Si vitesse trop faible près du mur, force le settlement
            const speed = particle.userData.velocity.length();
            if (speed < 0.005) {
                particle.userData.velocity.y = -0.01; // Force à tomber
            }
        }

        // Détection du sol
        if (particle.position.y < -1.75) {
            particle.position.y = -1.75;

            // Si vitesse très faible, la particule se pose
            if (Math.abs(particle.userData.velocity.y) < 0.003 &&
                Math.abs(particle.userData.velocity.x) < 0.003 &&
                Math.abs(particle.userData.velocity.z) < 0.003) {
                particle.userData.settled = true;
                particle.userData.velocity.set(0, 0, 0);
            } else {
                // Rebond avec perte d'énergie
                particle.userData.velocity.y *= -0.3;
                particle.userData.velocity.x *= 0.7;
                particle.userData.velocity.z *= 0.7;
            }
        }
    });

    renderer.render(scene, camera);
}

init();
animate();
