const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('photoInput');
const downloadBtn = document.getElementById('downloadBtn');

// Background image
const background = new Image();
background.src = 'affiche.jpg';
background.onload = () => ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

// Lorsque l'utilisateur choisit une photo
input.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Réinitialiser le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Dessiner la photo en cercle
      const centerX = 500;
      const centerY = 250;
      const radius = 100;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();

      // Ajouter le texte
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = 'Orange';
      ctx.fillText("J'y serai !", centerX - 70, centerY + 180);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Téléchargement
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'mon_affiche_jeja.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});