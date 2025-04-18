console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink.classList.add('current');

// currentLink?.classList.add('current');

let pages = [
    {url: '', title: 'Home'},
    {url: 'projects/', title: 'Projects'},
    {url: 'cv/', title: 'CV'},
    {url: 'contact/', title: 'Contact'},
    {url: 'https://github.com/rhekacitra', title: 'Github'}
]

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
? "/" // local server
: "/website/"; // Github Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);

    if (a.host !== location.host) {
        a.target = '_blank';
    }

    nav.append(a);

}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
`);

const select = document.querySelector('select');

if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);

    select.value = localStorage.colorScheme;
  }

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;

});

const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault(); 
  
    const data = new FormData(form); 
  
    let url = form.action + '?'; 
  
    for (let [name, value] of data) {
      url += `${name}=${encodeURIComponent(value)}&`;
      console.log(name, value);
    }
  
    url = url.slice(0, -1);
  
    console.log(url);
  
    location.href = url;
  });
