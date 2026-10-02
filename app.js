document.getElementById('generateBtn').addEventListener('click', generatePrompt);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

function parseDimensions(text) {
  const cleanText = text.replace(/,/g, '.');

  const mmValues = [];
  const lines = cleanText.split('\n');
  
  lines.forEach(line => {
    if (line.includes('mm')) {
      const nums = line.match(/(\d+(?:\.\d+)?)/g);
      if (nums) nums.forEach(n => mmValues.push(parseFloat(n)));
    }
  });

  const numbers = [...cleanText.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[0]));
  const source = mmValues.length >= 6 ? mmValues : numbers;

  if (source.length >= 6) {
    return {
      afloop: { b: source[0], h: source[1] },
      eind: { b: source[2], h: source[3] },
      veilig: { b: source[4], h: source[5] }
    };
  }

  return null;
}

function mmToPx(mm) {
  return Math.round((mm / 25.4) * 300);
}

function generatePrompt() {
  const modelSelect = document.getElementById('modelSelect');
  const inputData = document.getElementById('inputData').value;
  const checkFont = document.getElementById('checkFont').checked;
  const checkBorders = document.getElementById('checkBorders').checked;

  const modelError = document.getElementById('modelError');
  const inputError = document.getElementById('inputError');
  const resultContainer = document.getElementById('resultContainer');
  const resultBox = document.getElementById('resultBox');

  modelError.style.display = 'none';
  inputError.style.display = 'none';

  if (!modelSelect.value) {
    modelError.style.display = 'block';
    return;
  }

  const dims = parseDimensions(inputData);
  if (!dims) {
    inputError.style.display = 'block';
    return;
  }

  const pxAfloop = { b: mmToPx(dims.afloop.b), h: mmToPx(dims.afloop.h) };
  const pxEind = { b: mmToPx(dims.eind.b), h: mmToPx(dims.eind.h) };
  const pxVeilig = { b: mmToPx(dims.veilig.b), h: mmToPx(dims.veilig.h) };

  // Dynamische extra instructies opbouwen op basis van checkboxes
  let extraNL = "";
  let extraEN = "";

  if (checkFont) {
    extraNL += `\n- Zorg dat de kleinst aanwezige tekst minimaal 8 pt groot is. Schaal overige teksten proportioneel mee om de originele teksthiërarchie (verhouding tussen titels en broodtekst) te behouden.`;
    extraEN += `\n- Ensure the smallest text element is at least 8 pt. Scale all other text proportionally to maintain the original typographic hierarchy between titles and body text.`;
  }

  if (checkBorders) {
    extraNL += `\n- Verwijder alle kaders, randen, outlines en snijlijnen langs de randen. Laat de achtergrond zelf wel gewoon doorlopen tot het afloopformaat, maar zorg voor een lay-out zonder losse randen om het ontwerp.`;
    extraEN += `\n- Remove all outer frames, borders, outlines, and trim lines around the edges. Keep the background extending to the full bleed edge, but eliminate any decorative border lines or frames.`;
  }

  let output = "";

  switch (modelSelect.value) {
    case 'chatgpt':
      output = `Ik heb een bestand van mijn bestaande ontwerp geüpload. Pas dit aangeleverde ontwerp aan in formaat en resolutie.

Exacte afmetingen & marges (300 DPI):
- Totale afmetingen inclusief afloop: ${dims.afloop.b} × ${dims.afloop.h} mm (${pxAfloop.b} × ${pxAfloop.h} px)
- Eindformaat (afsnijdlijn): ${dims.eind.b} × ${dims.eind.h} mm (${pxEind.b} × ${pxEind.h} px)
- Veilige marge: ${dims.veilig.b} × ${dims.veilig.h} mm (${pxVeilig.b} × ${pxVeilig.h} px)

Strikte instructies voor de aanpassing:
1. Laat alle achtergronden en aflopende afbeeldingen van de bijlage volledig doorlopen tot het afloopformaat van ${dims.afloop.b} × ${dims.afloop.h} mm.
2. Plaats alle essentiële elementen (tekst, logo's) strikt binnen de veilige marge van ${dims.veilig.b} × ${dims.veilig.h} mm.
3. Zorg dat de uitvoerresolutie exact ${pxAfloop.b} × ${pxAfloop.h} pixels bedraagt voor printkwaliteit.
4. Behoud het bestaande ontwerp voor de rest 100%: verander niks aan de algemene stijl, kleuren, typografie of overige elementen. Voeg niets toe en vervorm niets.${extraNL ? `\n\nExtra correcties:${extraNL}` : ''}`;
      break;

    case 'midjourney':
      output = `Rescale the attached artwork image to exact print dimensions with full bleed.
High resolution canvas ${pxAfloop.b} x ${pxAfloop.h} pixels at 300 DPI. Extend background bleed area seamlessly to ${dims.afloop.b}x${dims.afloop.h} mm. Keep trim line at ${dims.eind.b}x${dims.eind.h} mm. Keep all vital text and logos safe inside ${dims.veilig.b}x${dims.veilig.h} mm. Do not change overall visual style, text font, or colors.${extraEN ? `\nAdditional requirements:${extraEN}` : ''} --ar ${dims.afloop.b}:${dims.afloop.h} --v 6.0`;
      break;

    case 'gemini_canva':
      output = `Pas het bijgevoegde bestand aan naar het formaat ${dims.afloop.b} x ${dims.afloop.h} mm (${pxAfloop.b} x ${pxAfloop.h} px op 300 DPI).
Laat de achtergrond en visuals naadloos doorlopen tot het afloopformaat van ${dims.afloop.b} x ${dims.afloop.h} mm. Houd alle bestaande teksten en logo's strikt binnen de veilige marge van ${dims.veilig.b} x ${dims.veilig.h} mm. Behoud exact de originele stijl, kleuren en typografie van het geüploade bestand zonder vervorming.${extraNL ? `\n\nPas ook de volgende correcties toe:${extraNL}` : ''}`;
      break;

    case 'generiek':
      output = `Pas het geüploade bestand aan naar het exacte printformaat:
- Afloopformaat: ${dims.afloop.b} × ${dims.afloop.h} mm (${pxAfloop.b} × ${pxAfloop.h} px op 300 DPI)
- Eindformaat (snijlijn): ${dims.eind.b} × ${dims.eind.h} mm
- Veilige marge: ${dims.veilig.b} × ${dims.veilig.h} mm

Instructies: Verleng achtergronden van het bijgevoegde bestand tot aan de afloop rand. Houd alle kritieke content/tekst binnen de veilige marge. Behoud de exacte stijl, kleuren, lettertypen en compositie van het origineel.${extraNL ? `\n\nAanvullende correcties:${extraNL}` : ''}`;
      break;
  }

  resultBox.textContent = output;
  resultContainer.style.display = 'block';
}