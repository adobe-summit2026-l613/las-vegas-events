const EVENTS_INDEX = '/events-index.json?limit=500';

function getCategoryParam() {
  return new URLSearchParams(window.location.search).get('category') || 'all';
}

function setCategoryParam(category) {
  const url = new URL(window.location.href);
  if (category === 'all') {
    url.searchParams.delete('category');
  } else {
    url.searchParams.set('category', category);
  }
  window.history.replaceState({}, '', url);
}

function getUniqueCategories(events) {
  return [...new Set(events.map((e) => e.category).filter(Boolean))].sort();
}

function renderGrid(grid, events, activeCategory) {
  const filtered = activeCategory === 'all'
    ? events
    : events.filter((e) => e.category === activeCategory);

  grid.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'events-list-empty';
    empty.textContent = 'No events found for this category.';
    grid.append(empty);
    return;
  }

  filtered.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'events-list-card';

    const priceHtml = event.price
      ? `<span class="events-list-card-price">${event.price} <span class="events-list-card-price-unit">/ person</span></span>`
      : '<span></span>';

    const imageHtml = event.image
      ? `<img src="${event.image}" alt="" loading="lazy">`
      : '';

    const categoryHtml = event.category
      ? `<span class="events-list-card-category">${event.category}</span>`
      : '';

    card.innerHTML = `
      <a class="events-list-card-link" href="${event.path}" aria-hidden="true" tabindex="-1"></a>
      <div class="events-list-card-image">
        ${imageHtml}
        ${categoryHtml}
      </div>
      <div class="events-list-card-body">
        <h3 class="events-list-card-title">
          <a href="${event.path}">${event.title}</a>
        </h3>
        <p class="events-list-card-description">${event.description}</p>
        <div class="events-list-card-footer">
          ${priceHtml}
          <a class="events-list-card-cta" href="${event.path}" tabindex="-1" aria-hidden="true">View →</a>
        </div>
      </div>
    `;

    grid.append(card);
  });
}

function renderFilters(filtersEl, events, categories, grid, activeCategory) {
  filtersEl.innerHTML = '';

  const label = document.createElement('span');
  label.className = 'events-list-filter-label';
  label.textContent = 'Category';
  filtersEl.append(label);

  const pills = document.createElement('div');
  pills.className = 'events-list-pills';

  let active = activeCategory;

  ['all', ...categories].forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'events-list-pill';
    btn.dataset.category = cat;
    btn.textContent = cat === 'all' ? 'All' : cat;
    if (cat === active) btn.classList.add('active');

    btn.addEventListener('click', () => {
      active = cat;
      setCategoryParam(cat);
      pills.querySelectorAll('.events-list-pill').forEach((p) => {
        p.classList.toggle('active', p.dataset.category === cat);
      });
      renderGrid(grid, events, cat);
    });

    pills.append(btn);
  });

  filtersEl.append(pills);
}

export default async function init(el) {
  const filtersEl = document.createElement('div');
  filtersEl.className = 'events-list-filters';

  const grid = document.createElement('div');
  grid.className = 'events-list-grid';

  el.replaceChildren(filtersEl, grid);

  let data;
  try {
    const resp = await fetch(EVENTS_INDEX);
    if (!resp.ok) throw new Error(resp.status);
    data = await resp.json();
  } catch {
    grid.textContent = 'Events could not be loaded.';
    return;
  }

  const events = data.data || [];
  const categories = getUniqueCategories(events);
  const param = getCategoryParam();
  const activeCategory = categories.includes(param) ? param : 'all';

  renderFilters(filtersEl, events, categories, grid, activeCategory);
  renderGrid(grid, events, activeCategory);
}
