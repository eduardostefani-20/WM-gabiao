/* ==========================================================================
   WM GABIÃO — portfolio-pdf.js
   Gera o portfólio em PDF no navegador, no mesmo padrão visual do portfólio
   original (capa escura com a logo, uma página por obra, formas amarelas),
   sempre com os dados atuais do site. Carrega o jsPDF só quando é usado.
   ========================================================================== */

const PdfPortfolio = (() => {
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const W = 1920;
  const H = 1080;
  const COLORS = { dark: '#1E1E1E', yellow: '#F2B233', logoYellow: '#FFC300', light: '#F1F2F4', text: '#1E1E1E', muted: '#6B6B6B' };
  const FONTS = [
    ['BebasNeue-Regular.ttf', 'Bebas', 'normal'],
    ['Montserrat-Light.ttf', 'Montserrat', 'light'],
    ['Montserrat-Regular.ttf', 'Montserrat', 'normal'],
    ['Montserrat-SemiBold.ttf', 'Montserrat', 'bold']
  ];

  let doc;
  let pageNumber = 0;

  /* ---------- Carregamento ---------- */

  function loadScript(src){
    return new Promise((resolve, reject) => {
      if (window.jspdf) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar o gerador de PDF.'));
      document.head.append(script);
    });
  }

  function toBase64(buffer){
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }

  async function registerFonts(){
    for (const [file, family, style] of FONTS) {
      const buffer = await (await fetch(`assets/fonts/${file}`)).arrayBuffer();
      doc.addFileToVFS(file, toBase64(buffer));
      doc.addFont(file, family, style);
    }
  }

  async function loadBitmap(url){
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Imagem indisponível: ${url}`);
    return createImageBitmap(await response.blob());
  }

  /* Recorta a imagem no formato do quadro (como object-fit: cover) e devolve um JPEG. */
  function coverImage(bitmap, width, height, radius = 0, background = '#FFFFFF'){
    const scale = Math.min(1, 1400 / width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (radius) {
      context.beginPath();
      context.roundRect(0, 0, canvas.width, canvas.height, radius * scale);
      context.clip();
    }
    const ratio = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const drawWidth = bitmap.width * ratio;
    const drawHeight = bitmap.height * ratio;
    context.drawImage(bitmap, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  /* Ajusta a imagem dentro de um quadro sem cortar (para logos). */
  function containImage(bitmap, width, height){
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext('2d');
    const ratio = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const drawWidth = bitmap.width * ratio;
    const drawHeight = bitmap.height * ratio;
    context.drawImage(bitmap, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
    return canvas.toDataURL('image/png');
  }

  /* ---------- Desenho ---------- */

  function polygon(points, style){
    const [start, ...rest] = points;
    const segments = rest.map((point, index) => {
      const previous = index === 0 ? start : rest[index - 1];
      return [point[0] - previous[0], point[1] - previous[1]];
    });
    doc.lines(segments, start[0], start[1], [1, 1], style, true);
  }

  function hexagon(cx, cy, radius, style){
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 90);
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    polygon(points, style);
  }

  function setFont(family, style, size, color = COLORS.text){
    doc.setFont(family, style);
    doc.setFontSize(size);
    doc.setTextColor(color);
  }

  function newPage(background = '#FFFFFF'){
    if (pageNumber > 0) doc.addPage([W, H], 'landscape');
    pageNumber += 1;
    doc.setFillColor(background);
    doc.rect(0, 0, W, H, 'F');
  }

  function pageLabel(color = COLORS.text){
    setFont('Montserrat', 'bold', 28, color);
    doc.text(String(pageNumber).padStart(2, '0'), 47, 1085 - 22);
  }

  /* Formas decorativas no estilo do portfólio original. */
  function decorate(variant){
    doc.setLineWidth(9);
    if (variant % 2 === 0) {
      doc.setDrawColor(COLORS.text);
      doc.roundedRect(20, -60, 620, 410, 60, 60, 'S');
      doc.setFillColor(COLORS.yellow);
      polygon([[1280, H], [1620, 900], [1720, 900], [W + 60, H]], 'F');
      doc.setDrawColor(COLORS.yellow);
      doc.lines([[0, 90], [190, 110]], 1800, -10, [1, 1], 'S');
    } else {
      doc.setFillColor(COLORS.yellow);
      polygon([[0, 960], [60, 940], [350, H], [0, H]], 'F');
      doc.setDrawColor(COLORS.text);
      doc.lines([[300, 170], [300, -170]], 10, -10, [1, 1], 'S');
      doc.setDrawColor(COLORS.yellow);
      doc.lines([[0, 120], [200, 110]], 1800, -10, [1, 1], 'S');
    }
  }

  /* ---------- Páginas ---------- */

  async function coverPage(content){
    newPage(COLORS.dark);
    doc.setFillColor(COLORS.light);
    hexagon(1960, 300, 380, 'F');
    hexagon(720, 640, 470, 'F');
    doc.setDrawColor(COLORS.yellow);
    doc.setLineWidth(10);
    hexagon(800, 470, 520, 'S');
    doc.setFillColor(COLORS.logoYellow);
    hexagon(560, 530, 530, 'F');
    try {
      const logo = await loadBitmap('assets/logo/logo-wm-portfolio.png');
      doc.addImage(containImage(logo, 900, 345), 'PNG', 110, 360, 900, 345);
    } catch { /* sem logo, segue só com o texto */ }
    // O título ocupa o espaço livre à direita do hexágono, sem passar da margem.
    let titleSize = 300;
    setFont('Bebas', 'normal', titleSize, COLORS.yellow);
    while (doc.getTextWidth('PORTFÓLIO') > W - 1200 - 80) doc.setFontSize(titleSize -= 10);
    doc.text('PORTFÓLIO', 1200, 600);
    setFont('Montserrat', 'light', 30, '#BDBDBD');
    doc.text(doc.splitTextToSize(content.hero_title || '', W - 1200 - 80), 1205, 690);
    doc.text(`${new Date().getFullYear()} · WM Gabião & Construção`, 1205, 800);
  }

  async function projectPage(project, index){
    const left = index % 2 === 0;
    newPage();
    decorate(index);

    const photo = { x: left ? 47 : 720, y: 177, w: 1195, h: 770 };
    if (!left) photo.x = 1920 - 47 - photo.w;
    try {
      const bitmap = await loadBitmap(project.images[0]);
      doc.addImage(coverImage(bitmap, photo.w, photo.h, left ? 0 : 24), 'JPEG', photo.x, photo.y, photo.w, photo.h);
    } catch { /* foto indisponível */ }

    const textX = left ? 1275 : 47;
    const textWidth = 600;
    const align = left ? 'right' : 'left';
    const anchorX = left ? textX + textWidth + 10 : textX;

    setFont('Bebas', 'normal', 104);
    doc.setLineHeightFactor(0.95);
    const title = doc.splitTextToSize(project.system.toUpperCase(), textWidth);
    let y = 330 - (title.length - 1) * 50;
    doc.text(title, anchorX, y, { align });
    y += title.length * 99 + 30;

    doc.setLineHeightFactor(1.3);
    setFont('Montserrat', 'bold', 30);
    doc.text(doc.splitTextToSize(project.location || '', textWidth), anchorX, y, { align });
    y += 70;

    if (project.clients) {
      const names = project.clients.split(',').map(name => name.trim()).filter(Boolean);
      setFont('Montserrat', 'light', 30);
      doc.text(names.length > 1 ? 'Clientes' : 'Cliente', anchorX, y, { align });
      setFont('Montserrat', 'bold', 30);
      doc.text(names, anchorX, y + 36, { align });
      y += 36 + names.length * 36 + 40;
    }

    setFont('Montserrat', 'bold', 22, COLORS.muted);
    doc.text(doc.splitTextToSize(project.title.toUpperCase(), textWidth), anchorX, y, { align });
    y += 50;
    setFont('Montserrat', 'normal', 26);
    doc.text(doc.splitTextToSize(project.description || '', textWidth), anchorX, y, { align });

    pageLabel();
  }

  async function galleryPages(project, index){
    const extra = project.images.slice(1);
    for (let start = 0; start < extra.length; start += 2) {
      const pair = extra.slice(start, start + 2);
      newPage();
      decorate(index + 1 + start / 2);
      const frames = pair.length === 1
        ? [{ x: 230, y: 113, w: 1460, h: 820 }]
        : [{ x: 113, y: 113, w: 860, h: 640 }, { x: 1020, y: 350, w: 860, h: 640 }];
      for (const [i, frame] of frames.entries()) {
        try {
          const bitmap = await loadBitmap(pair[i]);
          doc.addImage(coverImage(bitmap, frame.w, frame.h, 24), 'JPEG', frame.x, frame.y, frame.w, frame.h);
        } catch { /* foto indisponível */ }
      }
      if (pair.length === 2) {
        setFont('Bebas', 'normal', 72);
        doc.setLineHeightFactor(0.95);
        doc.text(doc.splitTextToSize(project.system.toUpperCase(), 760), 113, 850);
        setFont('Montserrat', 'bold', 26);
        doc.text(project.location || '', 113, 990);
      }
      pageLabel();
    }
  }

  async function clientsPage(clients){
    newPage();
    decorate(1);
    setFont('Bebas', 'normal', 110);
    doc.text('CLIENTES E PARCEIROS', W / 2, 205, { align: 'center' });

    const columns = 4;
    const rows = Math.ceil(clients.length / columns);
    const cellW = 400;
    const cellH = rows > 2 ? 250 : 360;
    const startY = rows > 2 ? 270 : 300;
    for (const [i, client] of clients.entries()) {
      const row = Math.floor(i / columns);
      const inRow = Math.min(columns, clients.length - row * columns);
      const x = (W - inRow * cellW) / 2 + (i % columns) * cellW + cellW / 2;
      const y = startY + row * cellH + (rows > 2 ? 90 : 140);
      const radius = rows > 2 ? 85 : 130;
      doc.setFillColor(COLORS.light);
      doc.circle(x, y, radius, 'F');
      let drawn = false;
      if (client.logo_url) {
        try {
          const bitmap = await loadBitmap(client.logo_url);
          const size = radius * 1.25;
          doc.addImage(containImage(bitmap, size, size * 0.7), 'PNG', x - size / 2, y - size * 0.35, size, size * 0.7);
          drawn = true;
        } catch { /* sem logo */ }
      }
      if (!drawn) {
        setFont('Bebas', 'normal', radius * 0.75, COLORS.dark);
        doc.text(initials(client.name), x, y + radius * 0.26, { align: 'center' });
      }
      setFont('Montserrat', 'bold', 22);
      doc.text(client.name, x, y + radius + 40, { align: 'center' });
    }
    pageLabel();
  }

  function backPage(content){
    newPage(COLORS.dark);
    doc.setDrawColor(COLORS.yellow);
    doc.setLineWidth(10);
    hexagon(1700, 300, 420, 'S');
    setFont('Bebas', 'normal', 150, '#FFFFFF');
    doc.setLineHeightFactor(0.95);
    doc.text(doc.splitTextToSize((content.budget_title || '').toUpperCase(), 1150), 120, 330);
    setFont('Montserrat', 'bold', 32, COLORS.yellow);
    doc.text('CONTATO', 120, 730);
    setFont('Montserrat', 'normal', 34, '#FFFFFF');
    doc.text([content.phone, content.email, `@${String(content.instagram || '').replace(/^.*\//, '').replace('@', '')}`, content.location].filter(Boolean), 120, 790);
    setFont('Montserrat', 'light', 24, '#9E9E9E');
    doc.text('WM Gabião & Construção LTDA — CNPJ 50.788.949/0001-76', 120, 1020);
  }

  /* ---------- API ---------- */

  async function generate({ content, projects, clients, onProgress = () => {} }){
    await loadScript(JSPDF_URL);
    doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: [W, H], compress: true });
    pageNumber = 0;
    await registerFonts();

    onProgress('Capa');
    await coverPage(content);
    for (const [index, project] of projects.entries()) {
      onProgress(`Obra ${index + 1} de ${projects.length}`);
      await projectPage(project, index);
      await galleryPages(project, index);
    }
    onProgress('Clientes');
    if (clients.length) await clientsPage(clients);
    backPage(content);

    doc.setProperties({ title: 'Portfólio WM Gabião', author: 'WM Gabião & Construção LTDA' });
    doc.save('Portfolio-WM-Gabiao.pdf');
  }

  return { generate };
})();
