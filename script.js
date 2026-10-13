const themeButton = document.querySelector('#theme');
const savedTheme = localStorage.getItem('isaac-theme');
if (savedTheme === 'light') document.body.classList.add('light');
function updateThemeIcon() { themeButton.textContent = document.body.classList.contains('light') ? '☀' : '☾'; }
updateThemeIcon();
themeButton.addEventListener('click', () => { document.body.classList.toggle('light'); localStorage.setItem('isaac-theme', document.body.classList.contains('light') ? 'light' : 'dark'); updateThemeIcon(); });
document.querySelector('#year').textContent = new Date().getFullYear();
const dialog = document.querySelector('#terminal-dialog');
const input = document.querySelector('#terminal-input');
const output = document.querySelector('#terminal-output');
document.querySelector('#terminal-open').addEventListener('click', () => { dialog.showModal(); input.focus(); });
document.querySelector('#terminal-close').addEventListener('click', () => dialog.close());
const commands = {
  help: 'Commands: help, about, projects, research, github, contact, clear, exit',
  about: 'Isaac Yong (용이삭) — Physics researcher and scientific software developer at Sogang University.',
  projects: 'X-ray Toolkit · QoraPhase · QoraGeom · Transient X-ray Diffraction\nVisit #work for project links.',
  research: 'X-ray diffraction, coherent imaging, time-dependent dynamical diffraction.',
  github: 'https://github.com/SJB7777',
  contact: 'Find my public links in #contact.'
};
document.querySelector('#terminal-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const command = input.value.trim().toLowerCase();
  input.value = '';
  if (!command) return;
  if (command === 'clear') { output.replaceChildren(); return; }
  if (command === 'exit') { dialog.close(); return; }
  const prompt = document.createElement('p'); prompt.textContent = '❯ ' + command; output.append(prompt);
  const response = document.createElement('p'); response.textContent = commands[command] ?? `Unknown command: ${command}. Try 'help'.`; output.append(response);
  output.scrollTop = output.scrollHeight;
});
