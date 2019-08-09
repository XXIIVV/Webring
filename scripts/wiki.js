'use strict'

function Wiki (sites) {
  const feeds = {}
  this.sites = sites
  this._el = document.createElement('div')
  this._el.id = 'wiki'
  this._sidebar = document.createElement('div')
  this._sidebar.id = 'sidebar'
  this._categories = document.createElement('ul')
  this._categories.id = 'categories'
  this._entry = document.createElement('div')
  this._entry.id = 'entry'

  this._header = document.createElement('header')
  this._header.id = 'header'
  this._title = document.createElement('h1')

  this._footer = document.createElement('p')
  this._footer.id = 'footer'
  this._footer.innerHTML = `The <strong>Wiki</strong> is a decentralized encyclopedia, to join the conversation, add a <a href="https://github.com/XXIIVV/webring#joining-the-wiki">wiki:</a> field to your entry in the <a href="https://github.com/XXIIVV/Webring/">webring</a>.`

  this.loc = ''
  this.byName = {}
  this.byCat = {}
  this.byAuthor = {}

  this.install = (host) => {
    this._el.appendChild(this._header)
    this._header.appendChild(this._title)
    this._el.appendChild(this._entry)
    this._sidebar.appendChild(this._categories)
    this._el.appendChild(this._sidebar)
    this._el.appendChild(this._footer)
    host.appendChild(this._el)
    this.fetch()
  }

  this.start = () => {
    this._title.innerHTML = 'LOADING...'
    this._entry.innerHTML = ''
  }

  this.refresh = () => {
    // Main
    if (this.loc) {
      this._title.innerHTML = this.loc
      if (this.byCat[this.loc]) {
        const formatHtml = (entries, entry) => `${entries} ${this.templateTerm(entry.name, this.byName[entry.name])}<br />`
        const html = this.byCat[this.loc].reduce(formatHtml, '')
        this._entry.innerHTML = html
      } else if (this.byName[this.loc]) {
        const html = `${this.templateTerm(this.loc, this.byName[this.loc])}<br />${this.templateRelated(this.loc)}`
        this._entry.innerHTML = html
      } else {
        const html = `Unknown: ${this.loc}. Return <a href='#'>home</a>, or try a <a href='${this.random()}'>random page</a>.`
        this._entry.innerHTML = html
      }
    } else {
      this._title.innerHTML = 'WIKI'
      this._entry.innerHTML = `Click a /topic to get started, or try a <a href='#${this.random()}'>random page</a>.<br />The wiki contains ${Object.keys(this.byName).length} terms, in ${Object.keys(this.byCat).length} categories, by ${Object.keys(this.byAuthor).length} authors.`
    }
    // Sidebar
    this._categories.innerHTML = Object.keys(this.byCat).reduce((acc, id) =>
      { return this.byCat[id].length > 5
          ? `${acc}<li ${wiki.at(id) ? 'class="selected"' : ''}>
            <a href='#${id}' data-msgs='${this.byCat[id].length}'>${id}</a>
            </li>`
          : acc
      } , `<li ${wiki.at() ? 'class="selected"' : ''}>
           <a href='#' data-msgs='${Object.keys(this.byName).length}'>home</a>
           </li>`
    )
  }

  this.go = () => {
    this.loc = decodeURIComponent( window.location.hash.substr(1) ).toUpperCase()
    this.refresh()
  }

  this.at = (q = '') => {
    return this.loc.toUpperCase() === q.toUpperCase() || (this.cat(this.loc).toUpperCase() === q.toUpperCase() && q !== '')
  }

  this.random = () => {
    const keys = Object.keys(this.byCat)
    return keys[Math.floor(Math.random() * keys.length)]
  }

  this.related = (name) => {
    return this.byCat[this.cat(name)]
  }

  this.cat = (name) => {
    return this.byName[name] ? this.byName[name][0].cat : ''
  }

  this.templateRelated = (name) => {
    const relatedWords = this.related(name)
    const html = `<ul class='col3'>${relatedWords.reduce( (acc, item, id) =>
      { return `${acc}<li ${wiki.at(item.name) ? 'class="selected"' : ''}>
        <a href='#${item.name.toLowerCase()}'>${item.name.toLowerCase()}</a>
        </li>`
      }, '') }
      </ul>`
    return html
  }

  this.templateTerm = (name, entries) => {
    const formatEntry = (acc, entry) => {
      if (typeof entry.value === 'string') {
        return `${acc}<li>${entry.value}<a class='author' target='_blank' href='${entry.origin.url}'> — @${entry.origin.author}</a></li>`
      } else {
        const listItems = entry.value.reduce((items, item) => `${items}<li>${item}</li>`, '')
        return `${acc}<li><ul>${listItems}<a class='author' target='_blank' href='${entry.origin.url}'> — @${entry.origin.author}</a></ul></li>`
      }
    }

    const htmlEntries = entries.reduce(formatEntry, '')
    return `<ul class="term"><li class="name"><strong>${name.toLowerCase()}</strong></li>${htmlEntries}</ul>`
  }

  this.fetch = () => {
    console.log('Wiki', 'Fetching..')
    for (const site of sites) {
      if (!site.wiki || !site.author) { continue }
      fetch(site.wiki, { cache: 'no-store' }).then(x => x.text()).then((content) => {
        this.parse(site, content)
        this.refresh(feeds)
      }).catch((err) => {
        console.warn(`${site.wiki}`, err)
      })
    }
  }

  this.add = (name, value, cat, origin) => {
    this.byName[name] = this.byName[name] || []
    this.byName[name].push({ name, value, cat, origin })

    this.byCat[cat] = this.byCat[cat] || []
    this.byCat[cat].push({ name, value, cat, origin })

    this.byAuthor[origin.author] = this.byAuthor[origin.author] || []
    this.byAuthor[origin.author].push({ name, value, cat, origin })
  }

  this.parse = (site, content) => {
    console.log('Wiki', 'Parsing ' + site.wiki)
    const cats = indental(content)
    for (const cat in cats) {
      const terms = cats[cat]
      for (const name in terms) {
        this.add(name, terms[name], cat, site)
      }
    }
  }

  String.prototype.toUrl = function () { return this.toLowerCase().replace(/ /g, '+').replace(/[^0-9a-z+:\-./~]/gi, '').trim() }

  window.onload = this.go
  window.onhashchange = this.go
}

