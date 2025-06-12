const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('photoInput');
const downloadBtn = document.getElementById('downloadBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetBtn = document.getElementById('resetBtn');

// Dimensions originales
const ORIGINAL_WIDTH = 600;
const ORIGINAL_HEIGHT = 800;

// Position originale du cadre circulaire
const ORIGINAL_CIRCLE_X = 500;
const ORIGINAL_CIRCLE_Y = 250;
const ORIGINAL_CIRCLE_RADIUS = 100;

// Variables pour le positionnement et zoom
let isDragging = false;
let imgOffsetX = 0;
let imgOffsetY = 0;
let imgScale = 1.0;
let userImage = null;
let lastMouseX = 0;
let lastMouseY = 0;
let scaleRatio = 1;

// Background image
const background = new Image();
background.src = 'affiche.jpg';
background.onload = () => {
    resizeCanvas();
};

// Fonction pour redimensionner le canvas
function resizeCanvas() {
    const container = document.querySelector('.canvas-wrapper');
    const containerWidth = container.clientWidth;
    
    // Calculer les dimensions proportionnelles
    const aspectRatio = ORIGINAL_HEIGHT / ORIGINAL_WIDTH;
    const newHeight = containerWidth * aspectRatio;
    
    // Mettre à jour les dimensions du canvas
    canvas.width = containerWidth;
    canvas.height = newHeight;
    
    // Calculer le ratio de redimensionnement
    scaleRatio = containerWidth / ORIGINAL_WIDTH;
    
    // Redessiner si l'image de fond est chargée
    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
    
    // Redessiner l'image utilisateur si elle existe
    if (userImage) {
        drawCanvas();
    }
}

// Initialiser le redimensionnement
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Gestionnaire pour le fichier utilisateur
input.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        userImage = new Image();
        userImage.onload = () => {
            // Réinitialiser le positionnement et le zoom
            imgOffsetX = 0;
            imgOffsetY = 0;
            imgScale = 1.0;
            drawCanvas();
        };
        userImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Fonction de réinitialisation
function resetPosition() {
    imgOffsetX = 0;
    imgOffsetY = 0;
    imgScale = 1.0;
}

// Fonction de dessin principale
function drawCanvas() {
    // Effacer et redessiner le fond
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    if (userImage) {
        // Calculer les positions actuelles
        const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
        const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
        const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;
        
        // Appliquer le masque circulaire
        ctx.save();
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Calculer la taille de l'image avec le zoom
        const scaledSize = circleRadius * 2 * imgScale;
        
        // Calculer la position de dessin
        const drawX = circleX - circleRadius + (imgOffsetX * scaleRatio) - (scaledSize - circleRadius * 2) / 2;
        const drawY = circleY - circleRadius + (imgOffsetY * scaleRatio) - (scaledSize - circleRadius * 2) / 2;
        
        ctx.drawImage(
            userImage,
            drawX,
            drawY,
            scaledSize,
            scaledSize
        );
        
        ctx.restore();
        
        // Dessiner un cadre pour indiquer la zone active
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2 * scaleRatio;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
    }
}

// Fonction utilitaire pour obtenir les coordonnées de la souris ou du toucher
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (event.type.includes('mouse')) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else if (event.type.includes('touch')) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Gestionnaires pour le déplacement (souris ET tactile)
function handleStart(event) {
    if (!userImage) return;
    
    const coords = getCanvasCoordinates(event);
    lastMouseX = coords.x;
    lastMouseY = coords.y;
    
    // Calculer les positions actuelles
    const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
    const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
    const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;
    
    // Vérifier si le contact est dans le cercle
    const distance = Math.sqrt(
        (lastMouseX - circleX) ** 2 + 
        (lastMouseY - circleY) ** 2
    );
    
    if (distance <= circleRadius) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        event.preventDefault(); // Empêcher le défilement sur mobile
    }
}

function handleMove(event) {
    if (!isDragging || !userImage) return;
    
    const coords = getCanvasCoordinates(event);
    const mouseX = coords.x;
    const mouseY = coords.y;
    
    // Calculer le déplacement
    const dx = (mouseX - lastMouseX) / scaleRatio;
    const dy = (mouseY - lastMouseY) / scaleRatio;
    
    // Mettre à jour la position
    imgOffsetX += dx;
    imgOffsetY += dy;
    
    // Limiter le déplacement aux bords du cercle (avec zoom)
    const maxOffset = ORIGINAL_CIRCLE_RADIUS * (imgScale - 1);
    imgOffsetX = Math.max(-maxOffset, Math.min(maxOffset, imgOffsetX));
    imgOffsetY = Math.max(-maxOffset, Math.min(maxOffset, imgOffsetY));
    
    // Mettre à jour la position du contact
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    
    drawCanvas();
    event.preventDefault(); // Empêcher le défilement sur mobile
}

function handleEnd() {
    isDragging = false;
    canvas.style.cursor = 'default';
}

// Écouteurs pour souris
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

// Écouteurs pour tactile
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd);
canvas.addEventListener('touchcancel', handleEnd);

// Changement de curseur au survol (uniquement pour souris)
canvas.addEventListener('mousemove', (e) => {
    if (isDragging || !userImage) return;
    
    const coords = getCanvasCoordinates(e);
    const mouseX = coords.x;
    const mouseY = coords.y;
    
    // Calculer les positions actuelles
    const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
    const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
    const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;
    
    // Vérifier si le curseur est dans le cercle
    const distance = Math.sqrt(
        (mouseX - circleX) ** 2 + 
        (mouseY - circleY) ** 2
    );
    
    if (distance <= circleRadius) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
});

// Zoom avec la molette
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!userImage) return;
    
    // Sens de la molette
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -1 : 1;
    
    // Calculer le nouveau zoom avec limites
    imgScale = Math.max(1.0, Math.min(3.0, imgScale + delta * zoomIntensity));
    
    // Réajuster les décalages pour rester dans les limites
    const maxOffset = ORIGINAL_CIRCLE_RADIUS * (imgScale - 1);
    imgOffsetX = Math.max(-maxOffset, Math.min(maxOffset, imgOffsetX));
    imgOffsetY = Math.max(-maxOffset, Math.min(maxOffset, imgOffsetY));
    
    drawCanvas();
});

// Boutons de contrôle
zoomInBtn.addEventListener('click', () => {
    if (!userImage) return;
    imgScale = Math.min(3.0, imgScale + 0.1);
    drawCanvas();
});

zoomOutBtn.addEventListener('click', () => {
    if (!userImage) return;
    imgScale = Math.max(1.0, imgScale - 0.1);
    drawCanvas();
});

resetBtn.addEventListener('click', () => {
    if (!userImage) return;
    resetPosition();
    drawCanvas();
});

// Téléchargement
downloadBtn.addEventListener('click', () => {
    // Créer un canvas temporaire pour la résolution originale
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = ORIGINAL_WIDTH;
    tempCanvas.height = ORIGINAL_HEIGHT;
    
    // Dessiner l'arrière-plan
    tempCtx.drawImage(background, 0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    
    if (userImage) {
        // Calculer les positions
        const circleX = ORIGINAL_CIRCLE_X;
        const circleY = ORIGINAL_CIRCLE_Y;
        const circleRadius = ORIGINAL_CIRCLE_RADIUS;
        
        // Appliquer le masque circulaire
        tempCtx.save();
        tempCtx.beginPath();
        tempCtx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        tempCtx.closePath();
        tempCtx.clip();
        
        // Calculer la taille de l'image avec le zoom
        const scaledSize = circleRadius * 2 * imgScale;
        
        // Calculer la position de dessin
        const drawX = circleX - circleRadius + imgOffsetX - (scaledSize - circleRadius * 2) / 2;
        const drawY = circleY - circleRadius + imgOffsetY - (scaledSize - circleRadius * 2) / 2;
        
        tempCtx.drawImage(
            userImage,
            drawX,
            drawY,
            scaledSize,
            scaledSize
        );
        
        tempCtx.restore();
    }
    
    // Créer le lien de téléchargement
    const link = document.createElement('a');
    link.download = 'mon_affiche_jeja.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
});