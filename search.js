((
  haystack = window, // $0 is the last inspected DOM element
  needle = 'value to search', // 'string' or /RegExp/
  target = 'kv', // kv = keys and values, k = keys only, v = values only
  caseSensitive = true, // for a plain string needle
  ownKeysOnly = !true, // only dig into own keys in objects
  maxResults = 5, // 0 = don't limit
  skipDOM = ['innerHTML', 'outerHTML', 'textContent', 'innerText', 'outerText'],
  skipValues = new Set([haystack, window, document.doctype]),
) => {
  let isRe, fnLow, fnIn, num = 0;
  const isSimpleId = /^[_$a-z][$\w]*$/iu;
  const path = [], pathKeys = [], inK = /k/i.test(target), inV = /v/i.test(target);
  if (!(isRe = needle instanceof RegExp)) {
    fnIn = dig.call.bind(''.includes);
    if (!caseSensitive) needle = (fnLow = dig.call.bind(''.toLowerCase))(needle);
  }
  dig(haystack);
  function check(v, name) {
    const t = typeof v;
    const n = typeof name === 'symbol' ? name.description : name;
    if (inK && (isRe ? needle.test(n) : fnIn(fnLow ? fnLow(n) : n, needle)) ||
        inV && (t === 'string' || t === 'number') &&
        (isRe ? needle.test(v) : fnIn(fnLow ? fnLow(v) : v, needle))) {
      let p = '';
      for (let k of pathKeys)
        p += !isSimpleId.test(k) ? `[${k}]` : p ? '.' + k : k;
      p = p.replace(/(^|[.\]])(children\[)(\d+)]((?:\.nextElementSibling)+)\b/g,
        (s, a, b, c, d) => a + b + (+c + d.split('.').length) + ']');
      console.log('#%s %s: %o in %o', ++num, name, v,
        {obj: path.at(-1), path: p, ancestry: path.slice(0)});
      if (!--maxResults) return 1;
    }
    if (v && t === 'object' && !skipValues.has(v)) {
      skipValues.add(v);
      pathKeys.push(name);
      return dig(v);
    }
  }
  function dig(o) {
    path.push(o);
    let res;
    if (Array.isArray(o)) {
      for (let len = o.length, i = 0; i < len; i++)
        if (check(o[i], i)) { res = 1; break; }
    } else if (o instanceof Map || o instanceof Set) {
      for (const e of o.entries())
        if (check(e[1], e[0])) { res = 1; break; }
    } else if (typeof o === 'object') {
      const isDom = skipDOM?.length && o instanceof Node;
      for (const k in o)
        if ((!ownKeysOnly || Object.hasOwn(o, k))
        && !(o === window && k.startsWith('webkit'))
        && !(isDom && skipDOM.includes(k)))
          try { if (check(o[k], k)) { res = 1; break; } } catch(e) {}
    }
    path.pop();
    pathKeys.pop();
    return res;
  }
})();
