
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    {url: '', title: 'Home'},
    {url: 'projects/', title: 'Projects'},
    {url: 'https://drive.google.com/file/d/1o5WHDkuhn4AuDdIMqdwIeh0PG3It0WXD/view?usp=sharing', title: 'CV'},
    {url: 'contact/', title: 'Contact'},
    {url: 'https://github.com/rhekacitra', title: 'Github'}
]

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portofolio/";

for (let p of pages) {
    let url = p.url;
    if (!url.startsWith('http')) {
      url = BASE_PATH + url;
    }
  
    let a = document.createElement('a');
    a.href = url;
    a.textContent = p.title;
  
    a.classList.toggle(
      'current',
      a.host === location.host && a.pathname === location.pathname
    );
  
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

export async function fetchJSON(url) {
  try {
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
  containerElement.innerHTML = '';

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
        <a href="${project.link}">Click here to see the project!</a>
        <p><b>${project.year}</b></p>
      </div>
    `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username = 'rhekacitra') {
  return fetchJSON(`https://api.github.com/users/${username}`);


}

async function fetchGithubStats(username) {
  try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch GitHub data');

      const data = await response.json();

      document.getElementById('public-repos').textContent = data.public_repos;
      document.getElementById('public-gists').textContent = data.public_gists;
      document.getElementById('followers').textContent = data.followers;
      document.getElementById('following').textContent = data.following;

  } catch (error) {
      console.error('Error fetching GitHub stats:', error);
  }
}

// Call this function with your GitHub username
fetchGithubStats('rhekacitra');
