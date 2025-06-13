const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('photoInput');
const downloadBtn = document.getElementById('downloadBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetBtn = document.getElementById('resetBtn');

// Dimensions originales
const ORIGINAL_WIDTH = 499;
const ORIGINAL_HEIGHT = 605;

// Position originale du cadre circulaire
const ORIGINAL_CIRCLE_X = 340;
const ORIGINAL_CIRCLE_Y = 250;
const ORIGINAL_CIRCLE_RADIUS = 130;

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
background.src = 'jeja.jpg'; // Assurez-vous que le chemin est correct
background.onload = () => {
    resizeCanvas();
};

// Fonction pour redimensionner le canvas
function resizeCanvas() {
    const container = document.querySelector('.canvas-wrapper');
    const containerWidth = container.clientWidth;

    const aspectRatio = ORIGINAL_HEIGHT / ORIGINAL_WIDTH;
    const newHeight = containerWidth * aspectRatio;

    canvas.width = containerWidth;
    canvas.height = newHeight;

    scaleRatio = containerWidth / ORIGINAL_WIDTH;

    drawCanvas(); // Redessiner tout pour être sûr
}

// Initialiser le redimensionnement
window.addEventListener('resize', resizeCanvas);

// Gestionnaire pour le fichier utilisateur
input.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        userImage = new Image();
        userImage.onload = () => {
            resetPosition(); // Réinitialiser position et zoom
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

// ==================================================================
//               FONCTION DE DESSIN PRINCIPALE (CORRIGÉE)
// ==================================================================
function drawCanvas() {
    // Effacer et redessiner le fond
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    if (userImage) {
        // Calculer les positions actuelles avec le bon ratio
        const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
        const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
        const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;

        // Appliquer le masque circulaire
        ctx.save();
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // --- DÉBUT DE LA CORRECTION -----
        // Calculer les dimensions de l'image en conservant le ratio
        const circleDiameter = circleRadius * 2;
        const imgRatio = userImage.width / userImage.height;

        let drawWidth, drawHeight;

        // Si l'image est plus "large" que le cercle (en termes de ratio)
        if (imgRatio > 1) {
            drawHeight = circleDiameter;
            drawWidth = drawHeight * imgRatio;
        } else { // Si l'image est plus "haute" ou carrée
            drawWidth = circleDiameter;
            drawHeight = drawWidth / imgRatio;
        }

        // Appliquer le zoom utilisateur
        drawWidth *= imgScale;
        drawHeight *= imgScale;

        // Calculer la position pour centrer l'image, puis appliquer le décalage (drag)
        const drawX = circleX - drawWidth / 2 + (imgOffsetX * scaleRatio);
        const drawY = circleY - drawHeight / 2 + (imgOffsetY * scaleRatio);
        // --- FIN DE LA CORRECTION ---

        // Activer l'anti-crénelage pour une meilleure qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dessiner l'image avec ses dimensions proportionnelles
        ctx.drawImage(
            userImage,
            drawX,
            drawY,
            drawWidth,  // Utiliser la nouvelle largeur calculée
            drawHeight  // Utiliser la nouvelle hauteur calculée
        );

        ctx.restore(); // Restaurer le contexte pour enlever le masque

        // Dessiner un cadre pour indiquer la zone active
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2 * scaleRatio;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
    }
}


// Fonctions de gestion des événements (drag, zoom, etc.) - Inchangées
// ... (le reste de votre code pour handleStart, handleMove, handleEnd, wheel, etc. est correct)

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
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function handleStart(event) {
    if (!userImage) return;
    const coords = getCanvasCoordinates(event);
    lastMouseX = coords.x;
    lastMouseY = coords.y;
    const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
    const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
    const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;
    const distance = Math.sqrt((lastMouseX - circleX) ** 2 + (lastMouseY - circleY) ** 2);
    if (distance <= circleRadius) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        event.preventDefault();
    }
}

function handleMove(event) {
    if (!isDragging || !userImage) return;
    const coords = getCanvasCoordinates(event);
    const mouseX = coords.x;
    const mouseY = coords.y;
    const dx = (mouseX - lastMouseX) / scaleRatio;
    const dy = (mouseY - lastMouseY) / scaleRatio;
    imgOffsetX += dx;
    imgOffsetY += dy;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    drawCanvas();
    event.preventDefault();
}

function handleEnd() {
    isDragging = false;
    canvas.style.cursor = 'default';
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd);
canvas.addEventListener('touchcancel', handleEnd);

canvas.addEventListener('mousemove', (e) => {
    if (isDragging || !userImage) return;
    const coords = getCanvasCoordinates(e);
    const mouseX = coords.x;
    const mouseY = coords.y;
    const circleX = ORIGINAL_CIRCLE_X * scaleRatio;
    const circleY = ORIGINAL_CIRCLE_Y * scaleRatio;
    const circleRadius = ORIGINAL_CIRCLE_RADIUS * scaleRatio;
    const distance = Math.sqrt((mouseX - circleX) ** 2 + (mouseY - circleY) ** 2);
    canvas.style.cursor = distance <= circleRadius ? 'grab' : 'default';
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!userImage) return;
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -1 : 1;
    imgScale = Math.max(1.0, Math.min(3.0, imgScale + delta * zoomIntensity));
    drawCanvas();
});

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


// ==================================================================
//               TÉLÉCHARGEMENT (CORRIGÉ)
// ==================================================================
downloadBtn.addEventListener('click', () => {
    if (!userImage) return;

    const qualityFactor = 3;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = ORIGINAL_WIDTH * qualityFactor;
    tempCanvas.height = ORIGINAL_HEIGHT * qualityFactor;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Il faut utiliser un nouveau `Image` pour s'assurer que `onload` se déclenche correctement
    const bgHD = new Image();
    bgHD.onload = () => {
        tempCtx.drawImage(bgHD, 0, 0, tempCanvas.width, tempCanvas.height);

        const circleX = ORIGINAL_CIRCLE_X * qualityFactor;
        const circleY = ORIGINAL_CIRCLE_Y * qualityFactor;
        const circleRadius = ORIGINAL_CIRCLE_RADIUS * qualityFactor;

        tempCtx.save();
        tempCtx.beginPath();
        tempCtx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        tempCtx.closePath();
        tempCtx.clip();

        // --- DÉBUT DE LA CORRECTION (identique à drawCanvas) ---
        const circleDiameter = circleRadius * 2;
        const imgRatio = userImage.width / userImage.height;

        let drawWidth, drawHeight;

        if (imgRatio > 1) {
            drawHeight = circleDiameter;
            drawWidth = drawHeight * imgRatio;
        } else {
            drawWidth = circleDiameter;
            drawHeight = drawWidth / imgRatio;
        }

        drawWidth *= imgScale;
        drawHeight *= imgScale;

        const drawX = circleX - drawWidth / 2 + (imgOffsetX * qualityFactor);
        const drawY = circleY - drawHeight / 2 + (imgOffsetY * qualityFactor);
        // --- FIN DE LA CORRECTION ---

        tempCtx.drawImage(
            userImage,
            drawX,
            drawY,
            drawWidth,  // Utiliser la nouvelle largeur
            drawHeight  // Utiliser la nouvelle hauteur
        );

        tempCtx.restore();

        // (Optionnel) Redessiner le cadre sur l'image finale
        tempCtx.beginPath();
        tempCtx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        tempCtx.lineWidth = 2 * qualityFactor;
        tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        tempCtx.stroke();

        const link = document.createElement('a');
        link.download = 'mon_affiche_jeja.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    };
    bgHD.src = background.src;
});