root = document.documentElement;
styles = {
  buttonDefault: getComputedStyle(root).getPropertyValue('--accent').trim(),
  buttonHover: getComputedStyle(root).getPropertyValue('--accent-hover').trim(),
  danger: getComputedStyle(root).getPropertyValue('--danger').trim()
}

fetch('../json/relevant-data.json')
  .then(r => r.json())
  .then(d => console.log(d))
const client = supabase.createClient(
      'https://pjvtmezsftuhtseznhhd.supabase.co', // deine Supabase-URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdnRtZXpzZnR1aHRzZXpuaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzM0ODYsImV4cCI6MjA3NTg0OTQ4Nn0.OnPVKCy0_Ojdnuf6AuWb_Rsd_G935ZvJ1eqom2mFk_M'          // dein anon key
);


sessionTimeout = 24
user = null;
async function login(email, password) {
  base.info('Anmelden... \n<div class="loader"></div>', null, false);
  const { data, error } = await client.auth.signInWithPassword({
    email: email,
    password: password
  });
if (error) {
  base.error('Fehler bei der Anmeldung: ' + error.message, () => {login(email, password); resolve(false);});
  console.error('Fehler bei der Anmeldung:', error);
  return false
}
 user = data.session.user.id
  showUserIcon();
 if(!localStorage.getItem("login")) base.info('Erfolgreich angemeldet.');
 else hideInfoBox();
 localStorage.setItem("login", JSON.stringify({timeout: (Date.now() + 1000 * 60 * 60 * sessionTimeout), email: email, password: password}))
 return true
}
async function init()
{
  ladeBilder();
  let storage = JSON.parse(localStorage.getItem("login") ?? '{"timeout": 0}')
  if(Date.now() < storage.timeout) 
  {
    login(storage.email, storage.password)
    console.log(storage.timeout - Date.now())
  }
  else
  {
    localStorage.removeItem("login")
    storage.timeout != 0 && base.info("Your session timed out.")
  }
}


document.getElementById("root").addEventListener("click", function (event) {
  const card = event.target.closest(".card");
  if (!card) {
    document.querySelectorAll('.database .card')
    .forEach(c => {c.style.border = 'none'; });
  }
  if(!card && !event.target.closest(".editor"))
  {
    hideEditor();
  }
});

    // Daten abrufen
async function ladeBilder() {
      const container = document.getElementById('bilder');
        container.innerHTML = '<div class="loader"></div>'; // Ladeanzeige
      const { data, error } = await client  
        .from('images') // Tabellenname
        .select('*');

      if (error) {
        base.error('Fehler beim Laden der Bilder.', ladeBilder);
        console.error('Fehler beim Laden:', error);
        return;
      }
      
        container.innerHTML = data.length ? '' : 'No images'; // vorherige Inhalte löschen

  data.forEach(bild => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="element" src="data:image/png;base64,${bild.image}" alt="Bild" />
    `;
    card.addEventListener('click', () => {
  document.querySelectorAll('.database .card')
    .forEach(c => {c.style.border = 'none'; });
  card.style.border = '2px solid #007BFF';

  // Editor anzeigen
    showEditor(bild);
    });

    container.appendChild(card);
  })}

   
document.addEventListener("DOMContentLoaded", hideEditor)

function getLabelElements(label){
  return {
    label: Array.from(label.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join(''),
    inputs: label.querySelectorAll('input, select, textarea, button, span')
  }
}

document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();
  if(!user) {
    base.error('Benutzer nicht authentifiziert.');
    return;
  }

  const fileInput = document.getElementById('bildDatei');
  let metaData = {};

  let isValid = true;
  document.querySelectorAll('.upload-form label[read="true"]').forEach(i => {
    if(!isValid) return;
    const elements = getLabelElements(i);
    if(i.getAttribute("force") == "true" && Array.from(elements.inputs).some(e => e.value.trim() == ""))
    {
      base.error(`Bitte das Feld "${elements.label}" vollständig ausfüllen.`);
      i.style.border = "2px solid red"
      isValid = false;
      return
    }
    else
    {
      i.style.border = "none"
    }

    if(elements.inputs.length == 1) metaData[elements.label] = elements.inputs[0].value
    else 
    {
      metaData[elements.label] = {}
      elements.inputs.forEach(e => metaData[elements.label][e.getAttribute("labelPart")] = e.value)
    }
  })

  if(!isValid) 
  {
    return false;
  }
  let file = fileInput.files[0];
  if (!file)
  {
    base.error('Bitte ein Bild auswählen.');
    return false;
  }
  base.info("Bild wird verarbeitet...<div class='loader'></div>", null, false);
  // Datei in Base64 konvertieren
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64String = reader.result.split(',')[1]; // Nur der Base64-Teil
    base.info("Hochladen...<div class='loader'></div>", null, false);
    const { data, error } = await client
      .from('images')
      .insert([
        {
          image: base64String,
          meta: JSON.stringify(metaData),
          user_id: user
        }
      ]);

    if (error) {
      console.error('Fehler beim Hochladen:', error);
      base.error('Upload fehlgeschlagen.', () => document.getElementById('uploadForm').onsubmit(e));
    } else {
      ladeBilder(); // Galerie aktualisieren
      fileInput.value = ''; // Formular zurücksetzen
      hideInfoBox()
    }
  };

  reader.readAsDataURL(file);
  document.querySelector(".upload-form").classList.replace("upload-form-show", "upload-form-hide");
  document.querySelector(".upload-icon").classList.remove("upload-shown")
  return false
};

function dezimalZuGradMinuten(dezimal, isLat) {
  const abs = Math.abs(dezimal);
  const grad = Math.floor(abs);
  const minuten = Math.round((abs - grad) * 60);
  const richtung = isLat
    ? dezimal >= 0 ? 'N' : 'S'
    : dezimal >= 0 ? 'E' : 'W';
  return { grad, minuten, richtung };
}
function gradMinutenZuDezimal(grad, minuten, richtung) {
  let dez = parseFloat(grad) + parseFloat(minuten) / 60;
  if (richtung === 'S' || richtung === 'W') dez *= -1;
  return dez;
}

function showEditor(bild = null)
{
  document.querySelector('.editor .content').style.display = 'block';
  document.querySelector('.placeholder-content').style.display = 'none';
  if(bild)
  {
    document.querySelector('.editor .content .image').src = `data:image/png;base64,${bild.image}`;
    let meta;
    try { meta = JSON.parse(bild.meta) } catch(e) { meta = {}}
    let container = document.querySelector('.editor .content .editor-infos')

    container.querySelectorAll("label").forEach(l => {
      let method = Convert[l.getAttribute("convertMethod")]
      let name = getLabelElements(l).label
      l.innerHTML = `${name} ` + "<span>" + (method ? method(meta, Array.from(name).filter(e => e != ":").join('')) : (meta[name] ?? `${name} nicht verfügbar`)) + "</span><br>"
    })
  }
  // Speichern
  document.querySelector('.saveBtn').onclick = async () => {
    
  };

  // Löschen
  document.querySelector('.deleteBtn').onclick = async () => {
    if(!user) return base.error('Benutzer nicht authentifiziert.');
    const confirmed = await base.confirm("Möchten Sie dieses Bild wirklich löschen?");
    base.info(confirmed)
    if (!confirmed) return;

    const { error } = await client
      .from('images')
      .delete()
      .eq('id', bild.id);

    console.log(error)
    if (error) {
      base.error('Fehler beim Löschen.');
      console.error(error);
    } else {
      ladeBilder();
      hideEditor();
    }
  };
}
function hideEditor()
{
  document.querySelector('.editor .content').style.display = 'none';
  document.querySelector('.editor .placeholder-content').style.display = 'block  ';
}

function showInfoBox(icon, text, buttons = [], inputs = [], customSize = null)
{
  if(!(icon instanceof DisplayIcon)) throw {name: "ArgumentError", message: "expected DisplayIcon"}
  if(!(buttons instanceof Array) || !buttons.every(b => b instanceof InfoBoxButton)) throw {name: "ArgumentError", message: "expected Array"}
  const box = document.querySelector(".info-box")
  if(customSize)
  {
    box.style.width = customSize[0];
    box.style.height = customSize[1];
  }
  else
  {
    box.style.width = "fit-content";
    box.style.height = "fit-content";
  }
  box.innerHTML = ""
  let row = document.createElement("div");
  row.classList.add("row");
  let left = document.createElement(icon.type == "emoji" ? "span" : "img")
  left[icon.type == "emoji" ? "textContent" : "src"] = icon.pathOrText;
  left.classList.add("info-icon")

  let right = document.createElement("span")
  right.innerHTML = text;
  right.classList.add("text")

  let form = document.createElement("div")
  let btns = document.createElement("div");
  btns.classList.add("buttons");
  let ipts = document.createElement("div");
  ipts.classList.add("inputs");
  for(const btn of buttons)
  {
    let button = document.createElement("button");
    button.textContent = btn.text;
    button.classList.add("button");
    button.style.backgroundColor = btn.options.color ?? styles.buttonDefault;
    for(const [key, value] of Object.entries(btn.options.customCSS ?? {}))
    {
      button.style[key] = value;
    }
    button.addEventListener("click", btn.onClick);
    btns.appendChild(button);
    if(btn.addBreak)
    {
      const b = document.createElement("div")
      b.classList.add("break");
      btns.appendChild(b);
    }
  }
  for(const ipt of inputs)
  {
    let input = document.createElement("input");
    for(const e of Object.entries(ipt))
    {
      input.setAttribute(e[0], e[1])
    }
    input.classList.add("input");
    ipts.appendChild(input);
    ipts.appendChild(document.createElement("br"));
  }
  row.appendChild(left); row.appendChild(right);
  box.appendChild(row);
  form.appendChild(ipts);
  form.appendChild(btns);
  box.appendChild(form);
  if(box.classList.contains("hide")) 
  {
    box.classList.replace("hide", "show")
    document.querySelector(".overlay").classList.replace("hide", "show")
  }
  else 
  {
    (async function() {box.classList.replace("show", "hide"); await sleep(100); box.classList.replace("hide", "show"); document.querySelector(".overlay").classList.replace("hide", "show")})()
  }
  base.currentInfoBox = {inputs: ipts, buttons: btns, icon: left, text: right};
}

function hideInfoBox()
{
  const box = document.querySelector(".info-box")
  const overlay = document.querySelector(".overlay");
  if(box.classList.contains("show")) 
  {
    box.classList.replace("show", "hide")
    overlay.classList.replace("show", "hide")
  }
  else
  {
    box.classList.add("hide")
    overlay.classList.add("hide")
  }
}

class DisplayIcon {
  constructor(type, icon) {
    this.pathOrText = icon;
    this.type = type;
  }
  pathOrText;
  type;
}

class InfoBoxButton {
  constructor(text, onClick, options = {
      color: styles.buttonDefault
    }, addBreak = false) {
    this.text = text;
    this.onClick = onClick;
    this.options = options ?? {};
    this.addBreak = addBreak;
  }
  text;
  onClick;
  options;
  addBreak = false;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

base = {
  info: (text, after = () => {}, showButton = true, customSize = null) => showInfoBox(new DisplayIcon("img", "pictures/information.png"), text, [
    ...(showButton ? [new InfoBoxButton("OK",  () => hideInfoBox() & after())] : [])
  ], [], customSize),
  error: (text, retry) => showInfoBox(new DisplayIcon("img", "pictures/error.png"), text, [
    new InfoBoxButton("OK", hideInfoBox),
    ...(retry ? [new InfoBoxButton("Erneut versuchen", () => {hideInfoBox(); retry()})] : [])
  ]),
  confirm: async (text) => {
    return new Promise((resolve) => {
      showInfoBox(new DisplayIcon("img", "pictures/question.png"), text, [
        new InfoBoxButton("Ja", () => {hideInfoBox(); resolve(true);}),
        new InfoBoxButton("Abbrechen", () => {hideInfoBox(); resolve(false);})
      ]);
    });
  },
  currentInfoBox: null
}

document.querySelectorAll(".login-button").forEach(e => {
    e.addEventListener("click", function(){
      if(!user)
      {
        showInfoBox(new DisplayIcon("emoji", ""), "Anmelden", [
          new InfoBoxButton("Anmelden", () => {
            login(base.currentInfoBox.inputs.children[0].value, base.currentInfoBox.inputs.children[2].value)
            hideInfoBox()
          }),
          new InfoBoxButton("Registrieren", async () => {
            const email = base.currentInfoBox.inputs.children[0].value;
            const password = base.currentInfoBox.inputs.children[2].value;
            const {error} = await client.auth.signUp({
              email: email,
              password: password
            })
            if(error)
            {
              base.error("Fehler bei der Registrierung: " + error.message);
            }
            else
            {
              base.info("Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu aktivieren.");
            }
          }),
          new InfoBoxButton("×", hideInfoBox, {color: styles.danger})
        ], [
          {placeholder: "E-Mail", name: "email", type: "email", autocomplete: "username"},
          {placeholder: "Passwort", name: "password", type: "password", autocomplete: "current-password"}
        ], ["40vw", "30vh"]);
      }
      else
      {
        showInfoBox(new DisplayIcon("emoji", ""), `<h3>Profil</h3><div class="profile-box"><b>E-Mail:</b> ${JSON.parse(localStorage.getItem("login")).email}</div>`, [
          
          new InfoBoxButton("Profilbild ändern", () => {
            hideInfoBox();
            showInfoBox(new DisplayIcon("emoji", ""), "Profilbild ändern", [new InfoBoxButton("Hochladen", async () => {
              hideInfoBox();
              const fileInput = base.currentInfoBox.inputs.querySelector('input[name="profilePic"]');
              let file = fileInput.files[0];
              if (!file)
              {
                base.error('Bitte ein Bild auswählen.');
                return;
              }
              base.info("Bild wird verarbeitet...<div class='loader'></div>", null, false);
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64String = reader.result.split(',')[1]; // Nur der Base64-Teil
                base.info("Hochladen...<div class='loader'></div>", null, false);
                const { data, error } = await client
                  .from('user_data')
                  .insert([
                    {
                      data: JSON.stringify({picture: base64String}),
                      user_id: user,
                      created_at: new Date().toISOString()
                    }
                  ]);

                if (error) {
                  console.error('Fehler beim Hochladen:', error);
                  base.error('Upload fehlgeschlagen.', () => document.getElementById('uploadForm').onsubmit(e));
                } else {
                  ladeBilder(); // Galerie aktualisieren
                  fileInput.value = ''; // Formular zurücksetzen
                  // 1. Neuesten Eintrag holen
                  const { data: lastEntry, error: selectError } = await client
                    .from('user_data')
                    .select('id')
                    .eq('user_id', user)
                    .order('created_at', { ascending: false })
                    .limit(1);

                  if (selectError) console.error(selectError);

                  // 2. Alle anderen löschen
                  if (lastEntry && lastEntry.length > 0) {
                    const { error: deleteError } = await client
                      .from('user_data')
                      .delete()
                      .eq('user_id', user)
                      .neq('id', lastEntry[0].id);

                    if (deleteError) console.error(deleteError);
                  }

                }
                base.info("Profilbild erfolgreich aktualisiert.");
                showUserIcon();
              };

              reader.readAsDataURL(file);

            }), new InfoBoxButton("×", hideInfoBox, {color: styles.danger})], [{type: "file", name: "profilePic", accept: "image/*"}], ["40vw", "30vh"]);
          }, {color: "#eb55ffff"}),
          new InfoBoxButton("Passwort ändern", async () => {
            showInfoBox(new DisplayIcon("emoji", ""), "Passwort ändern", [
              new InfoBoxButton("Ändern", async () => {
                const newPassword = base.currentInfoBox.inputs.querySelector('input[name="newPassword"]').value;
                const confirmPassword = base.currentInfoBox.inputs.querySelector('input[name="confirmPassword"]').value;
                if(newPassword !== confirmPassword)
                {
                  base.error("Die Passwörter stimmen nicht überein.", );
                  return;
                }
                else
                {
                  base.info("Passwort wird geändert...<div class='loader'></div>", null, false);
                  const { data, error } = await client.auth.updateUser({
                    password: newPassword
                  })
                  if(error)
                  {
                    base.error("Fehler beim Ändern des Passworts: " + error.message);
                  }
                  else
                  {
                    base.info("Passwort erfolgreich geändert.");
                  }
                }
              }), new InfoBoxButton("×", hideInfoBox, {color: styles.danger})], 
              [{type: "password", name: "newPassword", placeholder: "Neues Passwort"}, {type: "password", name: "confirmPassword", placeholder: "Passwort bestätigen"}], ["40vw", "20vh"]);
            
            }, {color: styles.buttonDefault}, true),
          new InfoBoxButton("Account löschen", async () => {
            const confirmed = await base.confirm("Möchten Sie Ihren Account wirklich löschen? Dies ist unwiderruflich.");
            if (!confirmed) return;
            base.info("Löschen der Benutzerdaten...<div class='loader'></div>", null, false);
            const { error: deleteError } = await client.rpc('delete_user_data');
            if (deleteError) {
              base.error('Fehler beim Löschen der Benutzerdaten.');
              return
            }
            base.info("Löschen des Accounts...<div class='loader'></div>", null, false);
            const { error } = await client.rpc('delete_user');
            if (error) {
              base.error('Fehler beim Löschen des Accounts.');
              console.error(error);
            } else {
              localStorage.removeItem("login")
              base.info('Ihr Account wurde erfolgreich gelöscht.', () => location.reload());
            }
          }, {color: "red"}),
          new InfoBoxButton("Benutzerdaten löschen", async () => {
            const confirmed = await base.confirm("Möchten Sie Ihre Benutzerdaten wirklich löschen? Dies ist unwiderruflich.");
            if (!confirmed) return;
            base.info("Löschen der Benutzerdaten...<div class='loader'></div>", null, false);
            const { error: deleteError } = await client.rpc('delete_user_data');
            if (deleteError) {
              base.error('Fehler beim Löschen der Benutzerdaten.');
              return
            }
            location.reload();
          }, {color: "red"}, true),
          new InfoBoxButton("Abmelden", () => base.confirm("Abmelden?").then(async function(b) {
            base.info("Abmelden...<div class='loader'></div>", null, false);
            await new Promise(r => setTimeout(r, Math.random() * 500 + 500)); // Simuliere Wartezeit
            if(b)
            {
              localStorage.removeItem("login")
              base.info("Sie wurden erfolgreich abgemeldet.", location.reload.bind(location))
            }
          }), {color: "#ffd900ff"}, true),
          new InfoBoxButton("×", hideInfoBox, {color: styles.danger}),

        ], [], ["75vw", "50vh"])
      }
  })
})

document.querySelector(".upload-icon").addEventListener("click", function(e){
  let uploadForm = document.getElementById("uploadForm");
  if(uploadForm.classList.contains("upload-form-show")) {
    uploadForm.classList.replace("upload-form-show", "upload-form-hide");
    e.target.classList.remove("upload-shown")
  } else {
    uploadForm.classList.replace("upload-form-hide", "upload-form-show");
    
    e.target.classList.add("upload-shown")

    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const latData = dezimalZuGradMinuten(lat, true);
        const lngData = dezimalZuGradMinuten(lng, false);

        let posElements = Array.from(document.querySelectorAll('.upload-form label[read="true"] input, .upload-form label[read="true"] select'));
        posElements.find(e => e.getAttribute("labelPart") == "deg").value = latData.grad;
        posElements.find(e => e.getAttribute("labelPart") == "min").value = latData.minuten;
        posElements.find(e => e.getAttribute("labelPart") == "dir").value = latData.richtung;

        posElements.filter(e => e.getAttribute("labelPart") == "deg")[1].value = lngData.grad;
        posElements.filter(e => e.getAttribute("labelPart") == "min")[1].value = lngData.minuten;
        posElements.filter(e => e.getAttribute("labelPart") == "dir")[1].value = lngData.richtung;
    });
  }
  
})
init();

class Convert {
  static positionToString(json) {
    if (!json || !json.Breitengrad || !json["Längengrad"]) 
    {
      return "Keine Positionsdaten verfügbar";
    }
    return `${json.Breitengrad.deg}° ${json.Breitengrad.min}' ${json.Breitengrad.dir}, ${json["Längengrad"].deg}° ${json["Längengrad"].min}' ${json["Längengrad"].dir}`;
  }
  static none(json, field) {
    return json[field] ?? "Nicht verfügbar";
  }

}
function resizeImage(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let width = img.width;
      let height = img.height;

      // Nur verkleinern, wenn nötig
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        // Blob zurückgeben
        callback(blob);
      }, file.type || 'image/jpeg', 0.9);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function showUserIcon()
{
  let email = JSON.parse(localStorage.getItem("login") ?? "{}")?.email
  const icon = document.querySelector(".login-button img");
 let userData = await client
  .from('user_data')
  .select('*')
  .eq('user_id', user)
  .order('created_at', { ascending: false })
  .limit(1)

  if(!userData.error)
  {
    userData = userData.data[0] ?? {data: "{}"}
    if(userData.data && JSON.parse(userData.data).picture)
    {
      icon.src = `data:image/png;base64,${JSON.parse(userData.data).picture}`;
    }
  }
  if(email)icon.title = "Eingeloggt als " + email;
  else icon.title = "Anmelden";

}
