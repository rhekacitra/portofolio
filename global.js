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
    {url: 'meta/', title: 'Meta'},
    {url: 'https://github.com/rhekacitra', title: 'Github'}
]

let nav = document.createElement('nav');
document.body.prepend(nav);

// Detect local vs GitHub Pages and adjust base path
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/" // local dev
  : "/portofolio/"; // your actual GitHub Pages repo

// Step 3.1 continued: Create links and add to nav
for (let p of pages) {
    let url = p.url;
    if (!url.startsWith('http')) {
      url = BASE_PATH + url;
    }
  
    let a = document.createElement('a');
    a.href = url;
    a.textContent = p.title;
  
    // Step 2.3: Highlight current page
    a.classList.toggle(
      'current',
      a.host === location.host && a.pathname === location.pathname
    );
  
    // Open external links in new tab
    if (a.host !== location.host) {
      a.target = '_blank';
    }
  
    nav.append(a);
  }

// for (let p of pages) {
//     let url = p.url;
//     let title = p.title;
//     // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

//     if (!url.startsWith('http')) {
//         url = BASE_PATH + url;
//     }

//     let a = document.createElement('a');
//     a.href = url;
//     a.textContent = title;

//     a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);

//     if (a.host !== location.host) {
//         a.target = '_blank';
//     }

//     nav.append(a);

// }

// for (let p of pages) {
//     let url = p.url;
//     if (!url.startsWith("http")) {
//       url = BASE_PATH + url;
//     }
  
//     let a = document.createElement("a");
//     a.href = url;
//     a.textContent = p.title;
  
//     // Highlight current page
//     a.classList.toggle(
//       "current",
//       a.host === location.host && a.pathname === location.pathname
//     );
  
//     // Open external links in new tab
//     if (a.host !== location.host) {
//       a.target = "_blank";
//     }
  
//     nav.append(a);
//   }
  
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

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response)

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = ''; // Clear any existing content

  if (!Array.isArray(projects)) {
    console.error('renderProjects: project data must be an array');
    return;
  }

  if (!(containerElement instanceof HTMLElement)) {
    console.error('renderProjects: invalid container element');
    return;
  }

  const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadingLevels.includes(headingLevel)) {
    console.warn(`renderProjects: invalid heading level "${headingLevel}", defaulting to "h2"`);
    headingLevel = 'h2';
  }


  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <h2>${project.title}</h2>
      <img src="${project.image}" alt="${project.title}">
      <div>
        <p>${project.description}</p>
        <p><b>${project.year}</b></p>
      </div>
    `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username = 'rhekacitra') {
  return fetchJSON(`https://api.github.com/users/${username}`);


}