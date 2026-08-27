/* Regression tests for design D's search engine.
   Boots 04-spec-index.html's inline script against a stub DOM and drives it
   through the URL state, so parsing, filtering, faceting and sorting are all
   exercised without a browser.   Run: node test/search.test.js            */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '04-spec-index.html'), 'utf8');
const APP = html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
const DATAJS = fs.readFileSync(path.join(root, 'data/products.js'), 'utf8');

function makeEl(name){
  const t = { _n:name, style:{}, dataset:{}, value:'', innerHTML:'', textContent:'', className:'',
              hidden:false, disabled:false, classList:{ add(){}, remove(){}, toggle(){} }, firstChild:{ nodeValue:'' } };
  return new Proxy(t, {
    get(o,k){
      if (k in o) return o[k];
      if (k === 'querySelectorAll') return () => [makeEl('b'),makeEl('b'),makeEl('b'),makeEl('b')];
      if (k === 'querySelector') return () => makeEl('q');
      if (k === 'closest' || k === 'matches') return () => null;
      return () => undefined;
    },
    set(o,k,v){ o[k] = v; return true; }
  });
}

function run(hash){
  const els = new Map();
  const q = sel => { if (!els.has(sel)) els.set(sel, makeEl(sel)); return els.get(sel); };
  const document = { querySelector:q, querySelectorAll:() => [], addEventListener(){},
                     body:{ classList:{ add(){}, remove(){}, toggle(){} } } };
  const sandbox = {
    window:{}, document, console,
    location:{ hash: hash ? '#'+hash : '', pathname:'/04-spec-index.html' },
    history:{ replaceState(){} },
    localStorage:{ getItem:()=>null, setItem(){} },
    setTimeout: () => 0, clearTimeout(){},
    URLSearchParams, RegExp, Math, Date, Number, String, Object, Array, JSON, parseFloat, parseInt, isNaN
  };
  vm.createContext(sandbox);
  vm.runInContext(DATAJS, sandbox);
  vm.runInContext(APP, sandbox);
  const count = q('#count').innerHTML.replace(/<[^>]+>/g,'');
  const rows  = q('#rows').innerHTML;
  return {
    total: count.includes('NO MATCHES') ? '0' : (count.match(/OF ([\d,]+)/) || [,'0'])[1],
    shown: (rows.match(/<article/g) || []).length,
    first: (rows.match(/<b>£([\d,.]+)<\/b>/) || [,'—'])[1],
    names: [...rows.matchAll(/data-act="qv">([^<]+)</g)].map(m => m[1]),
    count, rows,
    facets: q('#facets').innerHTML, chips: q('#chips').innerHTML, tabs: q('#tabs').innerHTML
  };
}

const T = [];
const t = (label, hash, check) => { const r = run(hash); T.push([label, r, check(r)]); };
const n = v => Number(String(v).replace(/,/g,''));

t('no filters',            '',                                          r => r.total === '104');
t('socket:AM5',            'q=socket%3AAM5',                            r => n(r.total) === 8);
t('vram:>=16',             'q=vram%3A%3E%3D16',                         r => r.total === '6');
t('price:<200',            'q=price%3A%3C200',                          r => n(r.total) > 0);
t('price range 100-500',   'q=price%3A100-500',                         r => n(r.total) > 0);
t('brand token',           'q=brand%3ACorsair',                         r => n(r.total) > 0);
t('two tokens',            'q=brand%3ACorsair%20price%3A%3C100',        r => n(r.total) > 0);
t('free text "oled"',      'q=oled',                                    r => n(r.total) > 0);
t('mpn partial',           'q=mpn%3AAMD',                               r => n(r.total) > 0);
t('stock:in',              'q=stock%3Ain',                              r => n(r.total) === 77);
t('rating:>=4.8',          'q=rating%3A%3E%3D4.8',                      r => n(r.total) > 0);
t('refresh+panel',         'q=refresh%3A%3E%3D240%20panel%3AOLED',      r => n(r.total) >= 3);
t('gibberish → empty',     'q=zzzzqqq',                                 r => r.total === '0' && r.count.includes('NO MATCHES'));
t('category tab',          'cat=Peripherals',                           r => n(r.total) === 18);
t('facet brand',           'f_brand=Corsair',                           r => n(r.total) > 0);
t('facet attr socket',     'f_a%3Asocket=AM5',                          r => n(r.total) > 0);
t('facet + cat',           'cat=PC%20Components&f_a%3Amemtype=DDR5',    r => n(r.total) === 10);
t('price facet',           'min=100&max=300',                           r => n(r.total) > 0);
t('sort price-asc',        'sort=price-asc',                            r => r.first === '6.99');
t('sort price-desc',       'sort=price-desc',                           r => r.first === '4,899.00');
t('pagination caps at 12', '',                                          r => r.shown === 12);
t('grid view',             'view=grid',                                 r => r.shown === 12);
t('chips render',          'cat=Laptops&f_brand=Lenovo',                r => r.chips.includes('LENOVO') && r.chips.includes('LAPTOPS'));
t('facets built',          '',                                          r => r.facets.includes('Brand') && r.facets.includes('Category') && r.facets.includes('Price'));
t('tabs counts',           '',                                          r => r.tabs.includes('PC Components') && r.tabs.includes('>52<'));
t('product links resolve', '',                                          r => /04-product\.html\?id=\d+/.test(r.rows));

let pass = 0;
for (const [label, r, ok] of T) {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label.padEnd(24) +
              ' total=' + String(r.total).padStart(5) + '  shown=' + String(r.shown).padStart(3) + '  first=£' + r.first);
  if (ok) pass++;
}
console.log('\n' + pass + '/' + T.length + ' passed');
process.exit(pass === T.length ? 0 : 1);
