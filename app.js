// ===================== FRACTION CLASS =====================
class Frac {
  constructor(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    if (d === 0) throw new Error('Division by zero');
    const g = Frac.gcd(Math.abs(n), Math.abs(d));
    this.n = n / g;
    this.d = d / g;
  }
  static gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
  static from(v) {
    if (v instanceof Frac) return v;
    if (typeof v === 'number') return Number.isInteger(v) ? new Frac(v) : Frac.parse(String(v));
    return Frac.parse(v);
  }
  static parse(s) {
    if (s === null || s === undefined) return null;
    s = String(s).trim().replace(/\s/g, '');
    if (s === '' || s === '-') return null;
    if (s.includes('/')) {
      const [a, b] = s.split('/');
      const num = parseInt(a), den = parseInt(b);
      if (isNaN(num) || isNaN(den) || den === 0) return null;
      return new Frac(num, den);
    }
    const v = parseInt(s);
    return isNaN(v) ? null : new Frac(v);
  }
  add(o) { o = Frac.from(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.from(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.from(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.from(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  eq(o) { o = Frac.from(o); return this.n === o.n && this.d === o.d; }
  gt(o) { o = Frac.from(o); return this.n * o.d > o.n * this.d; }
  lt(o) { o = Frac.from(o); return this.n * o.d < o.n * this.d; }
  leq(o) { return !this.gt(o); }
  isPos() { return this.n > 0; }
  isZero() { return this.n === 0; }
  isNeg() { return this.n < 0; }
  toNum() { return this.n / this.d; }
  toString() {
    if (this.d === 1) return String(this.n);
    return `${this.n}/${this.d}`;
  }
  toLatex() {
    if (this.d === 1) return String(this.n);
    const sign = this.n < 0 ? '-' : '';
    return `${sign}\\frac{${Math.abs(this.n)}}{${this.d}}`;
  }
}

const ZERO = new Frac(0);
const ONE = new Frac(1);

// ===================== SYMBOLIC M FRACTION CLASS =====================
class FracM {
  constructor(a = ZERO, b = ZERO) {
    this.a = Frac.from(a);
    this.b = Frac.from(b);
  }

  static from(v) {
    if (v instanceof FracM) return v;
    if (v instanceof Frac) return new FracM(v, ZERO);
    if (typeof v === 'number') return new FracM(new Frac(v), ZERO);
    return parseFracWithM(v);
  }

  isZero() { return this.a.isZero() && this.b.isZero(); }
  isPos() { if (!this.b.isZero()) return this.b.isPos(); return this.a.isPos(); }
  isNeg() { if (!this.b.isZero()) return this.b.isNeg(); return this.a.isNeg(); }
  neg() { return new FracM(this.a.neg(), this.b.neg()); }
  abs() { return new FracM(new Frac(Math.abs(this.a.n), this.a.d), new Frac(Math.abs(this.b.n), this.b.d)); }

  eq(o) { o = FracM.from(o); return this.a.eq(o.a) && this.b.eq(o.b); }
  gt(o) { o = FracM.from(o); return this.sub(o).isPos(); }
  lt(o) { o = FracM.from(o); return this.sub(o).isNeg(); }

  add(o) { o = FracM.from(o); return new FracM(this.a.add(o.a), this.b.add(o.b)); }
  sub(o) { o = FracM.from(o); return new FracM(this.a.sub(o.a), this.b.sub(o.b)); }

  mul(o) {
    o = FracM.from(o);
    const newA = this.a.mul(o.a);
    const newB = this.a.mul(o.b).add(this.b.mul(o.a));
    return new FracM(newA, newB);
  }

  div(o) {
    o = FracM.from(o);
    if (!o.b.isZero()) throw new Error("Cannot divide by M term");
    return new FracM(this.a.div(o.a), this.b.div(o.a));
  }

  toString() {
    const aZero = this.a.isZero();
    const bZero = this.b.isZero();

    if (aZero && bZero) return '0';

    let bStr = '';
    if (!bZero) {
      if (this.b.eq(ONE)) bStr = 'M';
      else if (this.b.eq(ONE.neg())) bStr = '-M';
      else bStr = `${this.b.toString()}M`;
    }

    if (aZero) return bStr;
    if (bZero) return this.a.toString();

    if (this.b.isPos()) {
      return `${this.a.toString()} + ${bStr}`;
    } else {
      const bAbs = new Frac(Math.abs(this.b.n), this.b.d);
      const absBStr = bAbs.eq(ONE) ? 'M' : `${bAbs.toString()}M`;
      return `${this.a.toString()} - ${absBStr}`;
    }
  }

  toLatex() { return this.toString(); }
}

const ZEROM = new FracM(ZERO, ZERO);
const ONEM = new FracM(ONE, ZERO);

function parseFracWithM(s) {
  if (s === null || s === undefined) return null;
  if (s instanceof FracM) return s;
  if (s instanceof Frac) return new FracM(s, ZERO);
  if (typeof s === 'number') return new FracM(new Frac(s), ZERO);

  let str = String(s).trim().replace(/\s+/g, '');
  if (str === '' || str === '-') return null;

  if (str === 'M' || str === '+M') return new FracM(ZERO, ONE);
  if (str === '-M') return new FracM(ZERO, new Frac(-1));

  // Pure M: e.g. "3M", "-2M", "1/2M", "-3/4M"
  const pureM = str.match(/^([+-]?\d+(?:\/\d+)?)M$/i);
  if (pureM) {
    const b = Frac.parse(pureM[1]);
    if (!b) return null;
    return new FracM(ZERO, b);
  }

  // Combo: e.g. "6+2M", "6-4M", "-3+M", "1/2-3/4M"
  const combo = str.match(/^([+-]?\d+(?:\/\d+)?)([+-])(\d*(?:\/\d+)?)M$/i);
  if (combo) {
    const a = Frac.parse(combo[1]);
    let bCoeffStr = combo[3];
    if (bCoeffStr === '') bCoeffStr = '1';
    let b = Frac.parse(bCoeffStr);
    if (combo[2] === '-') b = b.neg();
    if (!a || !b) return null;
    return new FracM(a, b);
  }

  // Pure constant: e.g. "5", "-3/2", "0"
  const a = Frac.parse(str);
  if (a) return new FracM(a, ZERO);

  return null;
}

// ===================== SIMPLEX SOLVER =====================
function buildInitialTableau(obj, A, b, initialBasis) {
  const n = obj.length;
  const m = A.length;
  const row0 = [ONEM];
  for (let j = 0; j < n; j++) row0.push(FracM.from(obj[j]).neg());
  row0.push(ZEROM);

  const rows = [row0];
  for (let i = 0; i < m; i++) {
    const row = [ZEROM];
    for (let j = 0; j < n; j++) row.push(FracM.from(A[i][j]));
    row.push(FracM.from(b[i]));
    rows.push(row);
  }
  const basis = [...initialBasis];

  const tabRaw = {
    rows: rows.map(r => r.map(v => new FracM(v.a, v.b))),
    basis: [...basis]
  };

  // Row 0 elimination for basic variables with non-zero objective coefficients (Big-M)
  for (let i = 0; i < m; i++) {
    const basicCol = basis[i] + 1; // 1-indexed in row
    const coeffInRow0 = rows[0][basicCol];
    if (!coeffInRow0.isZero()) {
      const factor = coeffInRow0;
      for (let j = 0; j < rows[0].length; j++) {
        rows[0][j] = rows[0][j].sub(factor.mul(rows[i + 1][j]));
      }
    }
  }

  const tabEliminated = {
    rows: rows.map(r => r.map(v => new FracM(v.a, v.b))),
    basis: [...basis]
  };

  return { tabRaw, tabEliminated };
}

function findEntering(tab) {
  const row0 = tab.rows[0];
  const nVars = row0.length - 2;
  let best = ZEROM, col = -1;
  for (let j = 1; j <= nVars; j++) {
    if (row0[j].gt(best)) { best = row0[j]; col = j; }
  }
  return col;
}

function findLeaving(tab, enterCol) {
  let minRatio = null, row = -1;
  for (let i = 1; i < tab.rows.length; i++) {
    const yik = tab.rows[i][enterCol];
    const bi = tab.rows[i][tab.rows[i].length - 1];
    if (yik.isPos()) {
      const ratio = bi.div(yik);
      if (minRatio === null || ratio.lt(minRatio)) {
        minRatio = ratio;
        row = i;
      }
    }
  }
  return row;
}

function doPivot(tab, pRow, pCol) {
  const numCols = tab.rows[0].length;
  const pElem = tab.rows[pRow][pCol];
  const newRows = tab.rows.map(r => r.map(v => new FracM(v.a, v.b)));
  const newBasis = [...tab.basis];
  for (let j = 0; j < numCols; j++) newRows[pRow][j] = newRows[pRow][j].div(pElem);
  for (let i = 0; i < newRows.length; i++) {
    if (i === pRow) continue;
    const factor = tab.rows[i][pCol];
    for (let j = 0; j < numCols; j++) {
      newRows[i][j] = newRows[i][j].sub(factor.mul(newRows[pRow][j]));
    }
  }
  newBasis[pRow - 1] = pCol - 1;
  return { rows: newRows, basis: newBasis };
}

function solveAll(obj, A, b, initialBasis) {
  const iterations = [];
  const { tabRaw, tabEliminated } = buildInitialTableau(obj, A, b, initialBasis);
  let tab = tabEliminated;
  for (let iter = 0; iter < 20; iter++) {
    const eCol = findEntering(tab);
    if (eCol === -1) {
      iterations.push({ tab: deepCopyTab(tab), optimal: true });
      break;
    }
    const lRow = findLeaving(tab, eCol);
    if (lRow === -1) {
      iterations.push({ tab: deepCopyTab(tab), unbounded: true });
      break;
    }
    iterations.push({ tab: deepCopyTab(tab), optimal: false, enterCol: eCol, leaveRow: lRow });
    tab = doPivot(tab, lRow, eCol);
  }
  return { iterations, tabRaw, tabEliminated };
}

function deepCopyTab(tab) {
  return {
    rows: tab.rows.map(r => r.map(v => new FracM(v.a, v.b))),
    basis: [...tab.basis]
  };
}

// ===================== PROBLEM GENERATOR =====================
function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateProblem(nOrig, m, type, useBigM = false) {
  type = type || randChoice(['max', 'min']);
  const possibleB = [-15, -12, -10, -8, -6, -5, -4, 4, 5, 6, 8, 10, 12, 15, 18, 20];

  for (let attempt = 0; attempt < 500; attempt++) {
    const objOrig = [];
    for (let j = 0; j < nOrig; j++) objOrig.push(randInt(1, 8));

    const Aorig = [], borig = [], ops = [];
    const Anorm = [], bnorm = [], normOps = [];

    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < nOrig; j++) row.push(randInt(-3, 6));
      if (row.every(v => v <= 0)) row[randInt(0, nOrig - 1)] = randInt(1, 5);
      Aorig.push(row);

      const bVal = randChoice(possibleB);
      borig.push(bVal);

      let chosenOp;
      if (!useBigM) {
        chosenOp = bVal > 0 ? '<=' : '>=';
      } else {
        chosenOp = randChoice(['<=', '>=', '=']);
      }
      ops.push(chosenOp);

      if (bVal < 0) {
        Anorm.push(row.map(v => -v));
        bnorm.push(-bVal);
        let nOp = chosenOp;
        if (chosenOp === '<=') nOp = '>=';
        else if (chosenOp === '>=') nOp = '<=';
        normOps.push(nOp);
      } else {
        Anorm.push([...row]);
        bnorm.push(bVal);
        normOps.push(chosenOp);
      }
    }

    if (useBigM && !normOps.some(op => op === '>=' || op === '=')) {
      continue;
    }

    const extraVarsInfo = [];
    const initialBasis = [];
    let currentExtraCol = nOrig;

    for (let i = 0; i < m; i++) {
      if (normOps[i] === '<=') {
        extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: ZEROM, type: 'slack' });
        initialBasis.push(currentExtraCol);
        currentExtraCol += 1;
      } else if (normOps[i] === '>=') {
        extraVarsInfo.push({ row: i, coeff: new FracM(new Frac(-1), ZERO), objCoeff: ZEROM, type: 'surplus' });
        extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' });
        initialBasis.push(currentExtraCol + 1);
        currentExtraCol += 2;
      } else if (normOps[i] === '=') {
        extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' });
        initialBasis.push(currentExtraCol);
        currentExtraCol += 1;
      }
    }

    const nExtra = extraVarsInfo.length;
    const stdObj = [];
    if (type === 'max') {
      for (let j = 0; j < nOrig; j++) stdObj.push(new FracM(new Frac(-objOrig[j]), ZERO));
    } else {
      for (let j = 0; j < nOrig; j++) stdObj.push(new FracM(new Frac(objOrig[j]), ZERO));
    }
    for (let j = 0; j < nExtra; j++) {
      stdObj.push(extraVarsInfo[j].objCoeff);
    }

    const A = [];
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < nOrig; j++) row.push(new FracM(new Frac(Anorm[i][j]), ZERO));
      for (let k = 0; k < nExtra; k++) {
        row.push(extraVarsInfo[k].row === i ? extraVarsInfo[k].coeff : ZEROM);
      }
      A.push(row);
    }

    const b = bnorm.map(v => new FracM(new Frac(v), ZERO));
    const { iterations: iters, tabRaw, tabEliminated } = solveAll(stdObj, A, b, initialBasis);
    const last = iters[iters.length - 1];
    if (!last.optimal && !last.unbounded) continue;
    if (!last.unbounded) {
      const numPivots = iters.length - 1;
      if (numPivots < 1 || numPivots > 5) continue;
    }

    let artificialsNonZero = false;
    const finalTab = last.tab;
    for (let i = 0; i < m; i++) {
      const bVarIdx = finalTab.basis[i];
      if (bVarIdx >= nOrig) {
        const extraIdx = bVarIdx - nOrig;
        if (extraVarsInfo[extraIdx].type === 'artificial') {
          const val = finalTab.rows[i + 1][finalTab.rows[i + 1].length - 1];
          if (!val.isZero()) { artificialsNonZero = true; break; }
        }
      }
    }
    if (artificialsNonZero) continue;

    let degenerate = false;
    for (const it of iters) {
      for (let i = 1; i < it.tab.rows.length; i++) {
        if (it.tab.rows[i][it.tab.rows[i].length - 1].isZero()) { degenerate = true; break; }
      }
      if (degenerate) break;
    }
    if (degenerate) continue;

    let ugly = false;
    for (let i = 0; i < finalTab.rows.length; i++) {
      for (let j = 0; j < finalTab.rows[i].length; j++) {
        if (finalTab.rows[i][j].a.d > 20 || finalTab.rows[i][j].b.d > 20) { ugly = true; break; }
      }
      if (ugly) break;
    }
    if (ugly) continue;

    return {
      type, nOrig, m, nExtra, extraVarsInfo,
      ops, objOrig, Aorig, borig,
      Anorm, bnorm, normOps,
      stdObj, A, b, initialBasis,
      tabRaw, tabEliminated,
      iterations: iters
    };
  }
  return generateFallback(nOrig, m, type, useBigM);
}

function generateFallback(nOrig, m, type, useBigM = false) {
  let objOrig, Aorig, borig, ops, Anorm, bnorm, normOps;
  type = type || 'max';

  if (!useBigM) {
    if (nOrig === 2 && m === 2) {
      objOrig = [6, 8]; Aorig = [[3, 4], [-2, -1]]; borig = [12, -6]; ops = ['<=', '>='];
    } else if (nOrig === 3 && m === 2) {
      objOrig = [3, 1, 2]; Aorig = [[1, 1, 1], [-2, -1, 0]]; borig = [10, -12]; ops = ['<=', '>='];
    } else if (nOrig === 2 && m === 3) {
      objOrig = [5, 4]; Aorig = [[1, 2], [-2, -1], [1, 1]]; borig = [6, -8, 5]; ops = ['<=', '>=', '<='];
    } else {
      objOrig = [3, 1, 2]; Aorig = [[1, 1, 1], [-2, -1, 0], [0, 1, 2]]; borig = [10, -12, 8]; ops = ['<=', '>=', '<='];
    }
  } else {
    if (nOrig === 2 && m === 2) {
      objOrig = [6, 8]; Aorig = [[3, 4], [2, 1]]; borig = [12, 4]; ops = ['<=', '>='];
    } else if (nOrig === 3 && m === 2) {
      objOrig = [3, 1, 2]; Aorig = [[1, 1, 1], [2, 1, 0]]; borig = [10, 12]; ops = ['<=', '='];
    } else if (nOrig === 2 && m === 3) {
      objOrig = [5, 4]; Aorig = [[1, 2], [2, 1], [1, 1]]; borig = [6, 4, 5]; ops = ['<=', '>=', '='];
    } else {
      objOrig = [3, 1, 2]; Aorig = [[1, 1, 1], [2, 1, 0], [0, 1, 2]]; borig = [10, 6, 8]; ops = ['<=', '>=', '='];
    }
  }

  Anorm = []; bnorm = []; normOps = [];
  for (let i = 0; i < m; i++) {
    const bVal = borig[i];
    if (bVal < 0) {
      Anorm.push(Aorig[i].map(v => -v));
      bnorm.push(-bVal);
      let nOp = ops[i];
      if (ops[i] === '<=') nOp = '>=';
      else if (ops[i] === '>=') nOp = '<=';
      normOps.push(nOp);
    } else {
      Anorm.push([...Aorig[i]]);
      bnorm.push(bVal);
      normOps.push(ops[i]);
    }
  }

  const extraVarsInfo = [];
  const initialBasis = [];
  let currentExtraCol = nOrig;

  for (let i = 0; i < m; i++) {
    if (normOps[i] === '<=') {
      extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: ZEROM, type: 'slack' });
      initialBasis.push(currentExtraCol);
      currentExtraCol += 1;
    } else if (normOps[i] === '>=') {
      extraVarsInfo.push({ row: i, coeff: new FracM(new Frac(-1), ZERO), objCoeff: ZEROM, type: 'surplus' });
      extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' });
      initialBasis.push(currentExtraCol + 1);
      currentExtraCol += 2;
    } else if (normOps[i] === '=') {
      extraVarsInfo.push({ row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' });
      initialBasis.push(currentExtraCol);
      currentExtraCol += 1;
    }
  }

  const nExtra = extraVarsInfo.length;
  const stdObj = [];
  for (let j = 0; j < nOrig; j++) stdObj.push(new FracM(new Frac(type === 'max' ? -objOrig[j] : objOrig[j]), ZERO));
  for (let j = 0; j < nExtra; j++) stdObj.push(extraVarsInfo[j].objCoeff);

  const A = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < nOrig; j++) row.push(new FracM(new Frac(Anorm[i][j]), ZERO));
    for (let k = 0; k < nExtra; k++) {
      row.push(extraVarsInfo[k].row === i ? extraVarsInfo[k].coeff : ZEROM);
    }
    A.push(row);
  }
  const b = bnorm.map(v => new FracM(new Frac(v), ZERO));
  const { iterations: iters, tabRaw, tabEliminated } = solveAll(stdObj, A, b, initialBasis);

  return {
    type, nOrig, m, nExtra, extraVarsInfo,
    ops, objOrig, Aorig, borig,
    Anorm, bnorm, normOps,
    stdObj, A, b, initialBasis,
    tabRaw, tabEliminated,
    iterations: iters
  };
}

// ===================== KATEX HELPER =====================
function texInline(latex) {
  if (typeof katex !== 'undefined') {
    try {
      const span = document.createElement('span');
      katex.render(latex, span, { throwOnError: false, displayMode: false });
      return span.outerHTML;
    } catch (e) {
      return `<span>$${latex}$</span>`;
    }
  }
  return `<span>${latex}</span>`;
}

function texBlock(latex) {
  if (typeof katex !== 'undefined') {
    try {
      return katex.renderToString(latex, { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<div style="text-align:center;margin:1rem 0;">$$ ${latex} $$</div>`;
    }
  }
  return `<div style="text-align:center;margin:1rem 0;">$$ ${latex} $$</div>`;
}

// ===================== UI STATE =====================
let prob = null;
let currentIterIdx = 0;

const $ = id => document.getElementById(id);
const main = () => $('mainContent');

function setStep(s) {
  document.querySelectorAll('.step-dot').forEach(d => {
    const ds = parseInt(d.dataset.step);
    d.classList.toggle('active', ds === s);
    d.classList.toggle('done', ds < s);
  });
}

function disableContainer(container) {
  if (!container) return;
  container.querySelectorAll('input, select').forEach(el => el.disabled = true);
  container.querySelectorAll('button').forEach(el => {
    // Dim the button slightly to indicate it's done but keep it visible
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
  });
  // Remove hover/selectable classes
  container.querySelectorAll('.selectable').forEach(el => {
    el.classList.remove('selectable');
    el.onclick = null;
  });
}

function appendBlock(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  main().appendChild(div);
  // Optional small delay for rendering before scrolling
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 50);
  return div.firstElementChild || div;
}

// ===================== HELP DRAWER & POPUP SYSTEM =====================
function getHelpData(step) {
  const isBigM = prob ? (prob.normOps ? prob.normOps.some(op => op === '>=' || op === '=') : prob.ops.some(op => op === '>=' || op === '=')) : false;

  if (step === 0) {
    return {
      title: '💡 Panduan Pilih Dimensi Masalah',
      body: `
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Dasar</h4>
        <p style="margin-bottom:0.75rem;">
          Pemrograman Linear (LP) mencari nilai variabel keputusan untuk mengoptimalkan (memaksimalkan/meminimumkan) fungsi tujuan linier di bawah sekumpulan kendala pembatas linier.
        </p>
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">⚙️ Pengaturan Parameter</h4>
        <ul>
          <li><b>n (Variabel Keputusan):</b> Banyaknya variabel utama ($x_1, x_2, \\dots, x_n$) yang mewakili alokasi sumber daya.</li>
          <li><b>m (Jumlah Kendala):</b> Banyaknya persamaan/pertidaksamaan pembatas sumber daya.</li>
          <li><b>Kemungkinan Soal Big-M?:</b>
            <ul>
              <li><b>Tidak (Hanya &le;):</b> Titik asal $(0,0)$ adalah titik sudut layak (feasible). Hanya memerlukan <b>Variabel Slack ($+1$)</b>.</li>
              <li><b>Ya (&le;, &ge;, =):</b> Titik $(0,0)$ belum tentu layak. Membutuhkan <b>Surplus ($-1$)</b> dan <b>Variabel Artifisial ($+1$)</b> berpinalti $+M$.</li>
            </ul>
          </li>
        </ul>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-muted);">
          Tipe optimisasi (Maksimasi/Minimasi) di-generate secara acak.
        </p>
      `
    };
  }

  if (step === 2) {
    return {
      title: '💡 Panduan Konversi ke Bentuk Baku',
      body: `
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Bentuk Baku</h4>
        <p style="margin-bottom:0.75rem;">
          Metode Simplex mensyaratkan semua pertidaksamaan diubah menjadi <b>persamaan linier</b> ($=$) dan semua variabel bernilai non-negatif ($\\ge 0$). Fungsi tujuan diseragamkan ke <b>Minimasi</b> ($\\min -z$) agar syarat kriteria berhenti seragam.
        </p>
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Cara Pengerjaan</h4>
        <ol>
          <li><b>Fungsi Objektif:</b>
            <br>• Jika soal awal <b>Maksimum $z = c_1 x_1 + c_2 x_2$</b>, balik koefisiennya menjadi <b>Minimum $-z = -c_1 x_1 - c_2 x_2$</b>.
            <br>• Jika soal awal Minimum $z$, koefisien $c_j$ tetap.
          </li>
          <li><b>Penambahan Variabel Kendala:</b> Klik <code>+ Tambah Variabel</code> di kanan tiap baris kendala:
            <ul>
              ${isBigM ? `
                <li><b>Kendala &le;:</b> Tambah 1 <b>Slack ($+1$)</b>. Di objektif koefisiennya $0$.</li>
                <li><b>Kendala &ge;:</b> Tambah 1 <b>Surplus ($-1$)</b> dan 1 <b>Artifisial ($+1$)</b>. Di objektif, surplus koefisiennya $0$, artifisial koefisiennya $+M$.</li>
                <li><b>Kendala =:</b> Tambah 1 <b>Artifisial ($+1$)</b>. Di objektif koefisiennya $+M$.</li>
              ` : `
                <li><b>Semua kendala &le;:</b> Tambah 1 <b>Variabel Slack ($+1$)</b> per baris kendala. Di fungsi objektif koefisiennya $0$.</li>
              `}
            </ul>
          </li>
          <li><b>Pengisian Kolom Lain:</b> Setiap variabel baru berkoefisien <b>0</b> pada baris kendala lainnya.</li>
        </ol>
      `
    };
  }

  if (step === 3) {
    return {
      title: '💡 Panduan Tabel Simplex Awal',
      body: `
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Matriks Tableau</h4>
        <p style="margin-bottom:0.75rem;">
          Tabel Simplex merepresentasikan sistem persamaan linier $z - \\sum c_j x_j = 0$ dan $A x = b$. Setiap baris kendala diwakili oleh variabel basis yang membentuk matriks identitas $I$.
        </p>
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Cara Pengerjaan</h4>
        <ol>
          <li><b>Tambah Baris Kendala:</b> Klik tombol <code>＋ Tambah Baris Kendala</code> untuk menambahkan baris baru sebanyak jumlah kendala ($m$).</li>
          <li><b>Pilih Variabel Basis:</b> Pada setiap baris kendala, pilih variabel basis dari dropdown (diambil dari ${isBigM ? 'variabel Slack atau Artifisial' : 'variabel Slack'} yang membentuk vektor $+1$).</li>
          <li><b>Baris 0 (Fungsi Objektif):</b>
            <br>Menyusun persamaan $z - \\sum c_j x_j = 0$.
            ${isBigM ? `
              <br><span style="color:var(--error);"><b>Penting (Eliminasi Big-M):</b></span>
              Karena variabel artifisial basis ($A_i$) memiliki koefisien $+M$ di objektif, lakukan Operasi Baris Elementer:
              $$\\text{Baris } 0_{\\text{baru}} = \\text{Baris } 0_{\\text{lama}} - M \\times (\\text{Baris Kendala } A_i)$$
              Elemen kolom basis artifisial wajib bernilai $0$ pada Baris 0!
            ` : `
              <br>Masukkan koefisien $-c_j$ untuk variabel keputusan dan $0$ untuk variabel slack.
            `}
          </li>
          <li><b>Isi Nilai Kolom:</b> Masukkan koefisien variabel dari bentuk baku dan nilai <b>RK (Ruas Kanan)</b>.</li>
        </ol>
      `
    };
  }

  if (step === 4) {
    return {
      title: '💡 Panduan Iterasi & Pivot Simplex',
      body: `
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Operasi Pivot</h4>
        <p style="margin-bottom:0.75rem;">
          Pivot memindahkan solusi dari satu titik sudut (corner point) ke titik sudut tetangga yang meningkatkan nilai fungsi objektif.
        </p>
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Tahapan Pengerjaan</h4>
        <ol>
          <li><b>Uji Optimalitas:</b> Tabel sudah optimal pada fungsi minimasi jika <b>semua elemen Baris 0 bernilai &le; 0</b> (tidak ada elemen positif).</li>
          <li><b>Variabel Masuk / Entering (Kolom Pivot):</b>
            <br>Pilih kolom dengan nilai pada Baris 0 yang <b>positif terbesar</b> ($z_j - c_j > 0$).
          </li>
          <li><b>Variabel Keluar / Leaving (Baris Pivot):</b>
            <br>Hitung rasio minimum untuk tiap baris kendala:
            $$R_i = \\frac{\\text{Ruas Kanan } (b_i)}{\\text{Elemen Kolom Pivot } (a_{i, \\text{pivot}})} \\quad (\\text{hanya untuk } a_{i, \\text{pivot}} > 0)$$
            Pilih baris dengan rasio non-negatif **terkecil**.
          </li>
          <li><b>Operasi Baris Elementer (Isi Tabel Baru):</b>
            <br>• Bagi baris pivot dengan elemen pivot agar bernilai $1$.
            <br>• Nolkan elemen pada kolom pivot di baris-baris lainnya:
            $$\\text{Baris } k_{\\text{baru}} = \\text{Baris } k_{\\text{lama}} - (a_{k, \\text{pivot}}) \\times \\text{Baris Pivot Baru}$$
          </li>
        </ol>
      `
    };
  }

  if (step === 5) {
    return {
      title: '💡 Panduan Membaca Solusi Optimal',
      body: `
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Solusi Akhir</h4>
        <p style="margin-bottom:0.75rem;">
          Pada solusi optimal, variabel basis bernilai positif sebesar nilai Ruas Kanan (RK), sedangkan variabel non-basis bernilai $0$.
        </p>
        <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Cara Pengerjaan</h4>
        <ul>
          <li><b>Nilai Variabel Keputusan ($x_1, x_2, \\dots$):</b>
            <br>• Jika $x_j$ tercantum di label variabel basis, nilainya $= \\text{RK baris tersebut}$.
            <br>• Jika $x_j$ tidak tercantum di label variabel basis (non-basis), nilainya $= 0$.
          </li>
          <li><b>Nilai Objektif Optimal ($z$):</b>
            <br>• Jika masalah awal berupa <b>Minimasi</b>, nilai optimal $= \\text{RK Baris } 0$.
            <br>• Jika masalah awal berupa <b>Maksimasi</b>, karena bentuk baku berupa $\\min -z$, nilai maksimum asli $= -(\\text{RK Baris } 0)$.
          </li>
        </ul>
      `
    };
  }

  return { title: '💡 Panduan', body: '' };
}

function renderKatexInHTML(html) {
  if (typeof katex === 'undefined') return html;

  // 1. Render display/block math $$...$$
  let result = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return `$$${expr}$$`;
    }
  });

  // 2. Render inline math $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return `$${expr}$`;
    }
  });

  return result;
}

function ensureHelpDrawerHTML() {
  if ($('helpDrawer')) return;
  const html = `
    <div id="helpDrawer" class="help-drawer">
      <div class="help-drawer-header">
        <div id="helpDrawerTitle" class="help-drawer-title">💡 Panduan</div>
        <button id="helpDrawerClose" class="help-drawer-close">✕</button>
      </div>
      <div id="helpDrawerBody" class="help-drawer-body"></div>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);

  $('helpDrawerClose').onclick = closeHelpDrawer;
}

function openHelpDrawer(step) {
  ensureHelpDrawerHTML();
  const data = getHelpData(step);
  $('helpDrawerTitle').innerHTML = renderKatexInHTML(data.title);
  $('helpDrawerBody').innerHTML = renderKatexInHTML(data.body);
  $('helpDrawer').classList.add('active');
}

function closeHelpDrawer() {
  if ($('helpDrawer')) $('helpDrawer').classList.remove('active');
}

// ===================== STEP 0: SETUP =====================
function renderSetup() {
  setStep(0);
  main().innerHTML = '';
  const html = `
    <div class="card" id="setupCard">
      <div class="card-title">
        <span>⚙️ Pilih Dimensi Masalah</span>
        <button class="btn-help" onclick="openHelpDrawer(0)">❓ Bagaimana caranya?</button>
      </div>
      <div class="setup-grid">
        <div class="setup-option">
          <label>n (Variabel Keputusan)</label>
          <select id="selN"><option value="2" selected>2</option><option value="3">3</option></select>
        </div>
        <div class="setup-option">
          <label>m (Jumlah Kendala)</label>
          <select id="selM"><option value="2" selected>2</option><option value="3">3</option></select>
        </div>
        <div class="setup-option">
          <label>Kemungkinan Soal Big-M?</label>
          <select id="selBigM">
            <option value="false" selected>Tidak (Hanya ≤)</option>
            <option value="true">Ya (≤, ≥, =)</option>
          </select>
        </div>
      </div>
      <p id="setupDesc" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem">
        Soal akan di-generate secara acak dengan koefisien bilangan bulat kecil.<br>
        Semua kendala bertipe ≤ dengan ruas kanan positif (tanpa Big-M).
      </p>
      <div class="btn-row">
        <button class="btn btn-primary" id="btnGenerate">Generate Soal →</button>
      </div>
    </div>`;
  const container = appendBlock(html);
  
  $('selBigM').onchange = () => {
    const isBigM = $('selBigM').value === 'true';
    $('setupDesc').innerHTML = isBigM
      ? 'Soal akan di-generate secara acak dengan koefisien bilangan bulat kecil.<br>Kendala dapat memiliki pertidaksamaan ≤, ≥, maupun persamaan = (menggunakan Metode Big-M).'
      : 'Soal akan di-generate secara acak dengan koefisien bilangan bulat kecil.<br>Semua kendala bertipe ≤ dengan ruas kanan positif (tanpa Big-M).';
  };

  $('btnGenerate').onclick = () => {
    const n = parseInt($('selN').value);
    const m = parseInt($('selM').value);
    const type = randChoice(['max', 'min']);
    const useBigM = $('selBigM').value === 'true';
    prob = generateProblem(n, m, type, useBigM);
    disableContainer(container);
    renderStep1();
  };
}

// ===================== STEP 1: SHOW PROBLEM =====================
function renderStep1() {
  setStep(1);
  const p = prob;
  
  const varNames = [];
  for (let j = 0; j < p.nOrig; j++) varNames.push(`x_{${j + 1}}`);
  const typeLabel = p.type === 'max' ? '\\text{Maksimum}' : '\\text{Minimum}';
  let objLatex = `${typeLabel} \\; z = `;
  for (let j = 0; j < p.nOrig; j++) {
    const c = p.objOrig[j];
    if (j === 0) objLatex += `${c}${varNames[j]}`;
    else objLatex += c >= 0 ? ` + ${c}${varNames[j]}` : ` - ${Math.abs(c)}${varNames[j]}`;
  }
  let constLatex = '';
  for (let i = 0; i < p.m; i++) {
    let line = '';
    for (let j = 0; j < p.nOrig; j++) {
      const a = p.Aorig[i][j];
      if (j === 0) {
        if (a === 1) line += varNames[j];
        else if (a === -1) line += `-${varNames[j]}`;
        else line += `${a}${varNames[j]}`;
      } else {
        if (a === 0) continue;
        if (a === 1) line += ` + ${varNames[j]}`;
        else if (a === -1) line += ` - ${varNames[j]}`;
        else if (a > 0) line += ` + ${a}${varNames[j]}`;
        else line += ` - ${Math.abs(a)}${varNames[j]}`;
      }
    }
    const opTex = p.ops[i] === '<=' ? '\\leq' : (p.ops[i] === '>=' ? '\\geq' : '=');
    line += ` ${opTex} ${p.borig[i]}`;
    constLatex += line + ' \\\\ ';
  }
  let nonNeg = varNames.join(', ') + ' \\geq 0';
  p.fullLatex = `${objLatex} \\\\ \\text{dengan kendala:} \\\\ ${constLatex} ${nonNeg}`;

  // Automatically start Step 2
  renderStep2();
}

// ===================== STEP 2: STANDARD FORM =====================
let step2UserVars = [];

function updateStep2DynamicUI(p) {
  const savedObj = {};
  const savedCon = {};
  const savedB = {};
  
  const totalCols = p.nOrig + step2UserVars.length;

  for (let j = 0; j < totalCols; j++) {
    const o = $(`objC${j}`);
    if (o) savedObj[j] = o.value;
  }
  for (let i = 0; i < p.m; i++) {
    for (let j = 0; j < totalCols; j++) {
      const a = $(`conA_${i}_${j}`);
      if (a) savedCon[`${i}_${j}`] = a.value;
    }
    const b = $(`conB_${i}`);
    if (b) savedB[i] = b.value;
  }

  // Rebuild Objective
  let objHtml = '';
  for (let j = 0; j < totalCols; j++) {
    const isExtra = j >= p.nOrig;
    let defVal = '';
    if (isExtra && savedObj[j] === undefined) {
      // Default objective coefficient for any newly added extra variable is 0
      defVal = 'value="0"';
    }
    objHtml += `<span style="white-space:nowrap;"><input id="objC${j}" style="width:45px" ${defVal}> ${texInline(`x_{${j + 1}}`)} </span>`;
    if (j < totalCols - 1) objHtml += `+ `;
  }
  $('objArea').innerHTML = objHtml;

  // Rebuild Constraints
  for (let i = 0; i < p.m; i++) {
    let conHtml = '';
    for (let j = 0; j < totalCols; j++) {
      let defVal = '';
      if (j >= p.nOrig && savedCon[`${i}_${j}`] === undefined) {
        const userVar = step2UserVars[j - p.nOrig];
        if (userVar && userVar.row === i) {
          defVal = 'value="1"';
        } else {
          defVal = 'value="0"';
        }
      }
      conHtml += `<span style="white-space:nowrap;"><input id="conA_${i}_${j}" style="width:45px" ${defVal}> ${texInline(`x_{${j + 1}}`)} </span>`;
      if (j < totalCols - 1) conHtml += `+ `;
    }
    conHtml += `= <input id="conB_${i}" style="width:45px">`;
    conHtml += ` <button class="btn btn-sm btn-secondary btn-add-row-var" data-row="${i}" id="btnAddRowVar_${i}" style="margin-left:0.5rem;">+ Tambah Variabel</button>`;
    conHtml += ` <button class="btn btn-sm" id="btnRemRowVar_${i}" data-row="${i}" style="color:var(--error);background:none;border:1px solid var(--error);padding:0.2rem 0.5rem;cursor:pointer;margin-left:0.25rem;display:none;">✕</button>`;
    $(`conArea_${i}`).innerHTML = conHtml;
  }

  // Restore saved values
  for (let j = 0; j < totalCols; j++) {
    if (savedObj[j] !== undefined && $(`objC${j}`)) $(`objC${j}`).value = savedObj[j];
  }
  for (let i = 0; i < p.m; i++) {
    for (let j = 0; j < totalCols; j++) {
      if (savedCon[`${i}_${j}`] !== undefined && $(`conA_${i}_${j}`)) $(`conA_${i}_${j}`).value = savedCon[`${i}_${j}`];
    }
    if (savedB[i] !== undefined && $(`conB_${i}`)) $(`conB_${i}`).value = savedB[i];
  }

  // Non-negativity
  let varsIdx = [];
  for (let j = 1; j <= totalCols; j++) varsIdx.push(`x_{${j}}`);
  $('nonNegLabel').innerHTML = texInline(varsIdx.join(', ') + ' \\geq 0');

  // Setup per-row button handlers and visibility
  for (let i = 0; i < p.m; i++) {
    const hasAnyForI = step2UserVars.some(v => v.row === i);
    const addBtn = $(`btnAddRowVar_${i}`);
    const remBtn = $(`btnRemRowVar_${i}`);

    if (addBtn) {
      addBtn.style.display = 'inline-block';
      addBtn.onclick = () => {
        step2UserVars.push({ row: i });
        updateStep2DynamicUI(p);
      };
    }
    if (remBtn) {
      remBtn.style.display = hasAnyForI ? 'inline-block' : 'none';
      remBtn.onclick = () => {
        const lastIndex = step2UserVars.map((v, idx) => ({ v, idx }))
                                        .filter(item => item.v.row === i)
                                        .map(item => item.idx)
                                        .pop();
        if (lastIndex !== undefined) {
          step2UserVars.splice(lastIndex, 1);
          updateStep2DynamicUI(p);
        }
      };
    }
  }
}

function renderStep2() {
  setStep(2);
  const p = prob;
  const isMax = p.type === 'max';
  step2UserVars = [];
  
  let html = `<div class="card" id="step2Card">
    <div class="card-title">
      <span>🔄 Konversi ke Bentuk Baku Minimasi</span>
      <button class="btn-help" onclick="openHelpDrawer(2)">❓ Bagaimana caranya?</button>
    </div>
    <div class="split-layout">
      <div class="split-left">
        <strong>Soal Asli:</strong>
        <div class="math-block">${texBlock(p.fullLatex)}</div>
      </div>
      <div class="split-right">
        <div style="font-weight:bold;margin-bottom:1rem;">Bentuk Baku:</div>
        <div class="std-form-line" style="flex-wrap:wrap;">
          Minimum z = <span id="objArea"></span>
        </div>
        <div style="margin: 1rem 0 0.5rem 0;">dengan kendala:</div>`;

  for (let i = 0; i < p.m; i++) {
    html += `<div class="std-form-line" style="flex-wrap:wrap;" id="conArea_${i}"></div>`;
  }

  html += `
        <div style="margin-top: 1rem;" id="nonNegLabel"></div>
        <div id="feedback2" class="feedback"></div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btnCheck2">Periksa ✓</button>
        </div>
      </div>
    </div>
  </div>`;

  const container = appendBlock(html);

  updateStep2DynamicUI(p);

  $('btnCheck2').onclick = () => {
    let allOk = true;
    const totalCols = p.nOrig + step2UserVars.length;

    const mappedExtraInfo = [];
    let rowMismatch = false;

    for (let i = 0; i < p.m; i++) {
      const varsForI = step2UserVars.map((v, idx) => ({ ...v, k: idx })).filter(v => v.row === i);
      const reqCount = (p.normOps[i] === '>=') ? 2 : 1;

      if (varsForI.length !== reqCount) {
        rowMismatch = true;
        allOk = false;
      } else {
        if (reqCount === 1) {
          const k = varsForI[0].k;
          if (p.normOps[i] === '<=') {
            mappedExtraInfo[k] = { row: i, coeff: ONEM, objCoeff: ZEROM, type: 'slack' };
          } else {
            mappedExtraInfo[k] = { row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' };
          }
        } else {
          const k1 = varsForI[0].k;
          const k2 = varsForI[1].k;
          const globalCol1 = p.nOrig + k1;

          const objInp1 = $(`objC${globalCol1}`);
          const conInp1 = $(`conA_${i}_${globalCol1}`);

          const valObj1 = objInp1 ? parseFracWithM(objInp1.value) : null;
          const valCon1 = conInp1 ? parseFracWithM(conInp1.value) : null;

          const isArt1 = (valObj1 && valObj1.b.eq(ONE)) || (valCon1 && valCon1.a.eq(ONE));

          const surplusObj = { row: i, coeff: new FracM(new Frac(-1), ZERO), objCoeff: ZEROM, type: 'surplus' };
          const artificialObj = { row: i, coeff: ONEM, objCoeff: new FracM(ZERO, ONE), type: 'artificial' };

          if (isArt1) {
            mappedExtraInfo[k1] = artificialObj;
            mappedExtraInfo[k2] = surplusObj;
          } else {
            mappedExtraInfo[k1] = surplusObj;
            mappedExtraInfo[k2] = artificialObj;
          }
        }
      }
    }

    for (let j = 0; j < totalCols; j++) {
      const inp = $(`objC${j}`);
      let exp;
      if (j < p.nOrig) {
        exp = p.stdObj[j];
      } else {
        const extraInfo = mappedExtraInfo[j - p.nOrig];
        exp = extraInfo ? extraInfo.objCoeff : ZEROM;
      }

      if (inp) {
        const val = parseFracWithM(inp.value);
        if (!val || !val.eq(exp) || rowMismatch) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }

    for (let i = 0; i < p.m; i++) {
      for (let j = 0; j < totalCols; j++) {
        const inp = $(`conA_${i}_${j}`);
        let exp;
        if (j < p.nOrig) {
          exp = new FracM(new Frac(p.Anorm ? p.Anorm[i][j] : p.Aorig[i][j]), ZERO);
        } else {
          const extraInfo = mappedExtraInfo[j - p.nOrig];
          exp = (extraInfo && extraInfo.row === i) ? extraInfo.coeff : ZEROM;
        }

        if (inp) {
          const val = parseFracWithM(inp.value);
          if (!val || !val.eq(exp) || rowMismatch) {
            allOk = false;
            inp.classList.add('wrong');
            inp.classList.remove('correct');
          } else {
            inp.classList.add('correct');
            inp.classList.remove('wrong');
          }
        }
      }

      const bInp = $(`conB_${i}`);
      const bExp = p.b[i];
      if (bInp) {
        const bVal = parseFracWithM(bInp.value);
        if (!bVal || !bVal.eq(bExp)) {
          allOk = false;
          bInp.classList.add('wrong');
          bInp.classList.remove('correct');
        } else {
          bInp.classList.add('correct');
          bInp.classList.remove('wrong');
        }
      }
    }

    const fb = $('feedback2');
    if (allOk && step2UserVars.length === p.nExtra && !rowMismatch) {
      const orderedExtraVars = mappedExtraInfo;
      const newStdObj = [];
      for (let j = 0; j < p.nOrig; j++) newStdObj.push(p.stdObj[j]);
      for (let k = 0; k < p.nExtra; k++) newStdObj.push(orderedExtraVars[k].objCoeff);

      const newA = [];
      for (let i = 0; i < p.m; i++) {
        const row = [];
        for (let j = 0; j < p.nOrig; j++) row.push(new Frac(p.Anorm ? p.Anorm[i][j] : p.Aorig[i][j]));
        for (let k = 0; k < p.nExtra; k++) {
          row.push(orderedExtraVars[k].row === i ? orderedExtraVars[k].coeff : ZERO);
        }
        newA.push(row);
      }

      const newInitialBasis = [];
      for (let i = 0; i < p.m; i++) {
        let basicCol = -1;
        for (let k = 0; k < p.nExtra; k++) {
          if (orderedExtraVars[k].row === i && orderedExtraVars[k].type === 'artificial') {
            basicCol = p.nOrig + k;
            break;
          }
        }
        if (basicCol === -1) {
          for (let k = 0; k < p.nExtra; k++) {
            if (orderedExtraVars[k].row === i && orderedExtraVars[k].type === 'slack') {
              basicCol = p.nOrig + k;
              break;
            }
          }
        }
        newInitialBasis.push(basicCol);
      }

      const { iterations: iters, tabRaw, tabEliminated } = solveAll(newStdObj, newA, p.b, newInitialBasis);

      p.extraVarsInfo = orderedExtraVars;
      p.stdObj = newStdObj;
      p.A = newA;
      p.initialBasis = newInitialBasis;
      p.tabRaw = tabRaw;
      p.tabEliminated = tabEliminated;
      p.iterations = iters;

      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Lanjut ke pembuatan tabel awal.';
      disableContainer(container);
      setTimeout(renderStep3, 600);
    } else {
      fb.className = 'feedback show error';
      let hints = [];
      if (step2UserVars.length !== p.nExtra || rowMismatch) {
        hints.push(`Jumlah variabel tambahan per baris kendala belum sesuai.`);
      }
      if (isMax) hints.push('Jika soal awal Maksimum, pastikan Anda dinegasikan koefisien objektif (misal 6 → −6)');
      hints.push('Cek penyusunan koefisien slack (+1), surplus (-1), dan variabel artifisial (+1, koefisien M di fungsi objektif).');
      fb.innerHTML = '❌ Masih ada yang salah.<br>' + hints.map(h => '• ' + h).join('<br>');
    }
  };
}

// ===================== STEP 3: INITIAL TABLEAU =====================
let step3Rows = [];
const savedStep3Values = {};

function saveStep3Inputs() {
  const p = prob;
  if (!p) return;
  const nTotal = p.nOrig + p.nExtra;
  const numCols = nTotal + 2;

  // Save Baris 0 inputs
  for (let j = 0; j < numCols; j++) {
    const inp = $(`t0_${j}`);
    if (inp) savedStep3Values[`t0_${j}`] = inp.value;
  }

  // Save constraint row inputs and basis dropdowns
  step3Rows.forEach((row, idx) => {
    const sel = $(`step3Basis_${idx}`);
    if (sel) row.basis = sel.value;
    for (let j = 0; j < numCols; j++) {
      const inp = $(`t${idx + 1}_${j}`);
      if (inp) savedStep3Values[`t${idx + 1}_${j}`] = inp.value;
    }
  });
}

function formatSubscriptVar(j) {
  const subs = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  const digits = String(j + 1).split('').map(d => subs[parseInt(d)] || d).join('');
  return `x${digits}`;
}

function updateStep3TableUI(p, expected) {
  const nTotal = p.nOrig + p.nExtra;
  const numCols = nTotal + 2;

  const varLabels = [];
  for (let j = 0; j < nTotal; j++) varLabels.push(`x_{${j + 1}}`);

  let table = `<table class="tableau"><thead><tr>
    <th>Basis</th>
    <th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) table += `<th>${texInline(varLabels[j])}</th>`;
  table += `<th class="rk-col">RK</th>
  </tr></thead><tbody>`;

  // Row 0 (always present)
  table += `<tr class="row-0">
    <td class="row-label">${texInline('z')}</td>`;
  for (let j = 0; j < numCols; j++) {
    const cls = j === numCols - 1 ? 'rk-col' : '';
    const savedVal = savedStep3Values[`t0_${j}`] || '';
    table += `<td class="${cls}"><input id="t0_${j}" value="${savedVal}"></td>`;
  }
  table += `</tr>`;

  // Dynamic constraint rows
  step3Rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    table += `<tr>
      <td>
        <select id="step3Basis_${idx}">
          <option value="" ${row.basis === '' ? 'selected' : ''}>-- Basis --</option>`;
    for (let j = 0; j < nTotal; j++) {
      const isSel = (row.basis !== '' && parseInt(row.basis) === j) ? 'selected' : '';
      table += `<option value="${j}" ${isSel}>${formatSubscriptVar(j)}</option>`;
    }
    table += `</select>
      </td>`;

    for (let j = 0; j < numCols; j++) {
      const cls = j === numCols - 1 ? 'rk-col' : '';
      const savedVal = savedStep3Values[`t${rowNum}_${j}`] || '';
      table += `<td class="${cls}"><input id="t${rowNum}_${j}" value="${savedVal}"></td>`;
    }

    table += `</tr>`;
  });

  table += `</tbody></table>`;
  $('step3TableWrapper').innerHTML = table;
}

function removeStep3Row(idx) {
  saveStep3Inputs();
  if (idx !== undefined) {
    step3Rows.splice(idx, 1);
  } else if (step3Rows.length > 0) {
    step3Rows.pop();
  }
  const p = prob;
  if (p) {
    updateStep3TableUI(p);
  }
}

function validateStep3a(p, container) {
  const nTotal = p.nOrig + p.nExtra;
  const numCols = nTotal + 2;
  const fb = $('feedback3');

  let allOk = true;
  const expected = p.tabRaw;

  // Validate Row 0
  for (let j = 0; j < numCols; j++) {
    const inp = $(`t0_${j}`);
    if (inp) {
      const val = parseFracWithM(inp.value);
      const exp = expected.rows[0][j];
      if (!val || !val.eq(exp)) {
        allOk = false;
        inp.classList.add('wrong');
        inp.classList.remove('correct');
      } else {
        inp.classList.add('correct');
        inp.classList.remove('wrong');
      }
    }
  }

  // Check row count
  if (step3Rows.length !== p.m) {
    allOk = false;
  }

  // Validate constraint rows
  step3Rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const sel = $(`step3Basis_${idx}`);

    if (idx < p.m) {
      const expBasis = p.initialBasis[idx];
      const chosenBasis = sel && sel.value !== '' ? parseInt(sel.value) : -1;

      if (chosenBasis !== expBasis) {
        allOk = false;
        if (sel) {
          sel.classList.add('wrong');
          sel.classList.remove('correct');
        }
      } else {
        if (sel) {
          sel.classList.add('correct');
          sel.classList.remove('wrong');
        }
      }

      for (let j = 0; j < numCols; j++) {
        const inp = $(`t${rowNum}_${j}`);
        if (inp) {
          const val = parseFracWithM(inp.value);
          const exp = expected.rows[rowNum][j];
          if (!val || !val.eq(exp)) {
            allOk = false;
            inp.classList.add('wrong');
            inp.classList.remove('correct');
          } else {
            inp.classList.add('correct');
            inp.classList.remove('wrong');
          }
        }
      }
    } else {
      allOk = false;
      if (sel) sel.classList.add('wrong');
      for (let j = 0; j < numCols; j++) {
        const inp = $(`t${rowNum}_${j}`);
        if (inp) inp.classList.add('wrong');
      }
    }
  });

  const hasArtificial = p.extraVarsInfo.some(v => v.type === 'artificial');

  if (allOk && step3Rows.length === p.m) {
    fb.className = 'feedback show success';
    if (hasArtificial) {
      fb.textContent = '✅ Benar! Lanjut ke eliminasi Gauss pada Baris 0 untuk variabel artifisial.';
      disableContainer(container);
      setTimeout(renderStep3b, 600);
    } else {
      fb.textContent = '✅ Tabel awal benar! Lanjut ke proses iterasi.';
      disableContainer(container);
      currentIterIdx = 0;
      setTimeout(renderIterCheckOptimal, 600);
    }
  } else {
    fb.className = 'feedback show error';
    let hints = [];
    if (step3Rows.length !== p.m) {
      hints.push(`Jumlah baris kendala harus ${p.m} sesuai soal (saat ini ${step3Rows.length} baris).`);
    }
    hints.push('Pastikan variabel basis untuk setiap baris kendala dipilih dengan benar melalui dropdown.');
    if (hasArtificial) {
      hints.push('Pada baris 0 sebelum eliminasi, variabel artifisial memiliki nilai koefisien objektif -M.');
    }
    fb.innerHTML = '❌ Masih ada yang salah.<br>' + hints.map(h => '• ' + h).join('<br>');
  }
}

function renderStep3() {
  setStep(3);
  const p = prob;
  
  step3Rows = [];
  for (let key in savedStep3Values) delete savedStep3Values[key];

  const hasArtificial = p.extraVarsInfo.some(v => v.type === 'artificial');
  const titleText = hasArtificial ? '📊 Bangun Tabel Simplex Awal (Sebelum Eliminasi M)' : '📊 Bangun Tabel Simplex Awal';
  const descText = hasArtificial
    ? 'Isi tabel awal langsung dari bentuk baku. Pada tahap ini, variabel artifisial masih memiliki koefisien -M di Baris 0.'
    : 'Awalnya tabel hanya berisi Baris 0 (Objektif). Gunakan tombol di bawah tabel untuk menambah atau mengurangi baris kendala.';

  const html = `<div class="card" id="step3Card">
    <div class="card-title">
      <span>${titleText}</span>
      <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
    </div>
    <div style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.85rem;">
      ${descText}
    </div>
    <div class="tableau-wrapper" id="step3TableWrapper"></div>
    <div style="text-align:center;margin-top:1rem;display:flex;justify-content:center;gap:0.75rem;">
      <button class="btn btn-sm btn-outline-primary" id="btnAddStep3Row">＋ Tambah Baris</button>
      <button class="btn btn-sm btn-outline-danger" id="btnRemoveStep3Row">－ Hapus Baris</button>
    </div>
    <div id="feedback3" class="feedback"></div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheck3">Periksa ✓</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  updateStep3TableUI(p);

  $('btnAddStep3Row').onclick = () => {
    saveStep3Inputs();
    step3Rows.push({ basis: '' });
    updateStep3TableUI(p);
  };

  $('btnRemoveStep3Row').onclick = () => {
    saveStep3Inputs();
    if (step3Rows.length > 0) step3Rows.pop();
    updateStep3TableUI(p);
  };

  $('btnCheck3').onclick = () => {
    saveStep3Inputs();
    validateStep3a(p, container);
  };
}

function renderStep3b() {
  const p = prob;
  const nTotal = p.nOrig + p.nExtra;
  const numCols = nTotal + 2;

  const varLabels = [];
  for (let j = 0; j < nTotal; j++) varLabels.push(`x_{${j + 1}}`);

  let table = `<table class="tableau"><thead><tr>
    <th>Basis</th>
    <th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) table += `<th>${texInline(varLabels[j])}</th>`;
  table += `<th class="rk-col">RK</th>
  </tr></thead><tbody>`;

  // Row 0 (Editable inputs)
  table += `<tr class="row-0">
    <td class="row-label">${texInline('z')}</td>`;
  for (let j = 0; j < numCols; j++) {
    const cls = j === numCols - 1 ? 'rk-col' : '';
    table += `<td class="${cls}"><input id="t3b0_${j}"></td>`;
  }
  table += `</tr>`;

  // Constraint rows (Readonly values from tabRaw)
  for (let i = 1; i <= p.m; i++) {
    const label = `x_{${p.tabRaw.basis[i - 1] + 1}}`;
    table += `<tr><td class="row-label">${texInline(label)}</td>`;
    for (let j = 0; j < numCols; j++) {
      const cls = j === numCols - 1 ? 'rk-col' : '';
      table += `<td class="${cls}">${p.tabRaw.rows[i][j].toString()}</td>`;
    }
    table += `</tr>`;
  }

  table += `</tbody></table>`;

  const html = `<div class="card" id="step3bCard">
    <div class="card-title">
      <span>📐 Eliminasi Gauss-Jordan Variabel Artifisial ($M$) pada Baris 0</span>
      <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
    </div>
    <div style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.85rem;">
      Eliminasi variabel artifisial pada Baris 0 dengan operasi baris elemen:
      $$\\text{Baris } 0_{\\text{baru}} = \\text{Baris } 0_{\\text{lama}} - \\sum (M \\cdot \\text{Baris basis artifisial})$$
    </div>
    <div class="tableau-wrapper">${table}</div>
    <div id="feedback3b" class="feedback"></div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheck3b">Periksa Eliminasi Baris 0 ✓</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  $('btnCheck3b').onclick = () => {
    let allOk = true;
    const expectedRow0 = p.tabEliminated.rows[0];

    for (let j = 0; j < numCols; j++) {
      const inp = $(`t3b0_${j}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = expectedRow0[j];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }

    const fb = $('feedback3b');
    if (allOk) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Eliminasi Baris 0 benar! Lanjut ke proses iterasi Simplex.';
      disableContainer(container);
      currentIterIdx = 0;
      setTimeout(renderIterCheckOptimal, 600);
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = '❌ Hasil eliminasi Baris 0 masih salah.<br>• Pastikan Anda mengurangkan $(M \\cdot \\text{Baris basis artifisial})$ dari Baris 0.<br>• Pertahankan koefisien simbolis $M$ (contoh: 6 + 2M, -M, dll).';
    }
  };
}

// ===================== STEP 4: ITERATIONS =====================
function renderReadonlyTableau(tab, highlightEnter, highlightLeave) {
  const p = prob;
  const nTotal = p.nOrig + p.nExtra;
  let table = `<table class="tableau"><thead><tr><th></th><th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) {
    const sel = highlightEnter === j + 1 ? ' selected-enter' : '';
    table += `<th class="${sel}">${texInline(`x_{${j + 1}}`)}</th>`;
  }
  table += `<th class="rk-col">RK</th></tr></thead><tbody>`;

  for (let i = 0; i < tab.rows.length; i++) {
    const isRow0 = i === 0;
    const isLeave = highlightLeave === i;
    const label = isRow0 ? 'z' : `x_{${tab.basis[i - 1] + 1}}`;
    const leaveCls = isLeave ? ' selected-leave' : '';

    table += `<tr class="${isRow0 ? 'row-0' : ''}"><td class="row-label${leaveCls}">${texInline(label)}</td>`;
    for (let j = 0; j < tab.rows[i].length; j++) {
      let cls = '';
      if (j === tab.rows[i].length - 1) cls += ' rk-col';
      if (highlightEnter !== undefined && j === highlightEnter) cls += ' col-selected';
      if (isLeave && highlightEnter !== undefined && j === highlightEnter) cls += ' pivot-cell';
      table += `<td class="${cls}">${tab.rows[i][j].toString()}</td>`;
    }
    table += `</tr>`;
  }
  table += `</tbody></table>`;
  return table;
}

function renderIterCheckOptimal() {
  setStep(4);
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;

  const html = `<div class="card">
    <div class="card-title">
      <span>📝 Iterasi ${currentIterIdx + 1}</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div class="tableau-wrapper">${renderReadonlyTableau(tab)}</div>
    <div style="margin-top:1rem; font-weight:bold;">❓ Apakah tabel ini sudah optimal?</div>
    <div class="optimal-check">
      <button class="optimal-btn yes" id="btnOptYes_${currentIterIdx}">✅ Ya, Optimal</button>
      <button class="optimal-btn no" id="btnOptNo_${currentIterIdx}">❌ Belum</button>
    </div>
    <div id="feedback4a_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  $(`btnOptYes_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (iter.optimal) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Tabel sudah optimal.';
      disableContainer(container);
      setTimeout(renderStep5, 600);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Belum! Masih ada z_j − c_j > 0 di baris 0.';
    }
  };
  $(`btnOptNo_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (!iter.optimal) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Lanjut memilih kolom pivot.';
      disableContainer(container);
      setTimeout(renderIterPickEnter, 600);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Sebenarnya sudah optimal. Tidak ada z_j − c_j > 0 !';
    }
  };
}

function renderIterPickEnter() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nTotal = p.nOrig + p.nExtra;

  let table = `<table class="tableau"><thead><tr><th></th><th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) {
    table += `<th class="selectable" data-col="${j + 1}">${texInline(`x_{${j + 1}}`)}</th>`;
  }
  table += `<th class="rk-col">RK</th></tr></thead><tbody>`;
  
  for (let i = 0; i < tab.rows.length; i++) {
    const isRow0 = i === 0;
    const label = isRow0 ? 'z' : `x_{${tab.basis[i - 1] + 1}}`;
    table += `<tr class="${isRow0 ? 'row-0' : ''}"><td class="row-label">${texInline(label)}</td>`;
    for (let j = 0; j < tab.rows[i].length; j++) {
      table += `<td class="${j === tab.rows[i].length - 1 ? 'rk-col' : ''}">${tab.rows[i][j].toString()}</td>`;
    }
    table += `</tr>`;
  }
  table += `</tbody></table>`;

  const html = `<div class="card">
    <div class="card-title">
      <span>📥 Pilih Kolom Pivot (Entering)</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div class="tableau-wrapper">${table}</div>
    <div id="feedback4b_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  container.querySelectorAll('th.selectable').forEach(th => {
    th.onclick = () => {
      const col = parseInt(th.dataset.col);
      const fb = $(`feedback4b_${currentIterIdx}`);
      if (col === iter.enterCol) {
        th.classList.add('selected-enter');
        fb.className = 'feedback show success';
        fb.textContent = `✅ Benar! Lanjut pilih baris pivot.`;
        disableContainer(container);
        setTimeout(renderIterPickLeave, 600);
      } else {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Bukan kolom itu. Pilih kolom dengan z_k − c_k positif terbesar.`;
      }
    };
  });
}

function renderIterPickLeave() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nTotal = p.nOrig + p.nExtra;
  const isUnbounded = iter.unbounded || findLeaving(tab, iter.enterCol) === -1;

  let table = `<table class="tableau"><thead><tr><th></th><th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) {
    const sel = j + 1 === iter.enterCol ? ' selected-enter' : '';
    table += `<th class="${sel}">${texInline(`x_{${j + 1}}`)}</th>`;
  }
  table += `<th class="rk-col">RK</th></tr></thead><tbody>`;

  for (let i = 0; i < tab.rows.length; i++) {
    const isRow0 = i === 0;
    const label = isRow0 ? 'z' : `x_{${tab.basis[i - 1] + 1}}`;
    const selCls = !isRow0 ? ' selectable' : '';
    table += `<tr class="${isRow0 ? 'row-0' : ''}">`;
    table += `<td class="row-label${selCls}" data-row="${i}">${texInline(label)}</td>`;
    
    for (let j = 0; j < tab.rows[i].length; j++) {
      let cls = j === tab.rows[i].length - 1 ? 'rk-col' : '';
      if (j === iter.enterCol) cls += ' col-selected';
      table += `<td class="${cls}">${tab.rows[i][j].toString()}</td>`;
    }
    table += `</tr>`;
  }
  table += `</tbody></table>`;

  let extraOptions = '';
  if (isUnbounded) {
    extraOptions = `
      <div style="margin-top:1.25rem;text-align:center;">
        <button class="btn btn-outline-danger" id="btnUnbounded_${currentIterIdx}" style="font-weight:bold;padding:0.6rem 1.2rem;">
          🚫 Tidak Ada Baris Pivot (Solusi Tidak Terbatas / Unbounded)
        </button>
      </div>`;
  }

  const html = `<div class="card">
    <div class="card-title">
      <span>📤 Pilih Baris Pivot (Leaving)</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div class="tableau-wrapper">${table}</div>
    ${extraOptions}
    <div id="feedback4c_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  if (isUnbounded && $(`btnUnbounded_${currentIterIdx}`)) {
    $(`btnUnbounded_${currentIterIdx}`).onclick = () => {
      const fb = $(`feedback4c_${currentIterIdx}`);
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Seluruh elemen pada kolom pivot ≤ 0, sehingga tidak ada variabel keluar. Masalah ini bersifat Tidak Terbatas (Unbounded).';
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    };
  }

  container.querySelectorAll('td.selectable').forEach(td => {
    td.onclick = () => {
      const row = parseInt(td.dataset.row);
      const fb = $(`feedback4c_${currentIterIdx}`);
      if (isUnbounded) {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Tidak ada baris yang bisa dipilih. Pada kolom pivot ini, seluruh elemen kendala bernilai ≤ 0 (pembagian rasio tidak valid). Klik tombol "Tidak Ada Baris Pivot".';
      } else if (row === iter.leaveRow) {
        td.classList.add('selected-leave');
        fb.className = 'feedback show success';
        fb.textContent = `✅ Benar! Lanjut mengisi tabel iterasi baru.`;
        disableContainer(container);
        setTimeout(renderIterFillTableau, 600);
      } else {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Bukan baris itu. Pilih baris dengan rasio minimum.`;
      }
    };
  });
}

function renderUnboundedConclusionCard() {
  setStep(5);
  const html = `<div class="card" style="border-color:var(--error);">
    <div class="card-title">
      <span style="color:var(--error);">🚫 Solusi Tidak Terbatas (Unbounded Solution)</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div style="margin-bottom:1rem;line-height:1.6;">
      <p style="margin-bottom:0.75rem;">
        Pada iterasi ini, kolom pivot memuat elemen-elemen kendala bernilai <b>&le; 0</b> (nol atau negatif).
        Akibatnya, <b>Uji Rasio Minimum tidak menghasilkan rasio positif yang valid</b> dan tidak ada variabel basis yang dapat keluar (<i>Leaving Variable</i>).
      </p>
      <div style="background:var(--error-bg);color:var(--text-primary);padding:1rem;border-radius:var(--radius);margin-bottom:1rem;border-left:4px solid var(--error);">
        <b>📌 Kesimpulan Aljabar & Geometris:</b><br>
        Variabel masuk dapat ditingkatkan nilainya hingga <b>$+\\infty$</b> tanpa melanggar batasan kendala manapun.<br>
        Nilai fungsi tujuan <b>$z$</b> dapat ditingkatkan/diturunkan tanpa batas (<b>$z \\to \\pm\\infty$</b>).
      </div>
      <p style="font-weight:bold;color:var(--error);">
        ❌ Tidak ada solusi optimal berhingga untuk masalah ini.
      </p>
    </div>
    <div style="text-align:center; padding: 1rem 0 0 0;">
      <button class="btn btn-primary" style="font-size:1.1rem; padding:0.75rem 2rem;" onclick="renderSetup()">Soal Baru →</button>
    </div>
  </div>`;
  appendBlock(html);
}

function renderIterFillTableau() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nTotal = p.nOrig + p.nExtra;
  const nextTab = doPivot(tab, iter.leaveRow, iter.enterCol);
  
  let html = `<div class="card">
    <div class="card-title">
      <span>✍️ Isi Tabel Iterasi Baru (Hasil Pivot)</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.85rem;">
      Pilih variabel basis baru pada dropdown dan isi seluruh nilai elemen tabel hasil pivot.
    </div>`;
  
  let table = `<table class="tableau"><thead><tr><th>Basis</th><th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) table += `<th>${texInline(`x_{${j + 1}}`)}</th>`;
  table += `<th class="rk-col">RK</th></tr></thead><tbody>`;

  for (let i = 0; i < nextTab.rows.length; i++) {
    const isRow0 = i === 0;
    if (isRow0) {
      table += `<tr class="row-0"><td class="row-label">${texInline('z')}</td>`;
    } else {
      table += `<tr><td>
        <select id="ntBasis_${currentIterIdx}_${i - 1}">
          <option value="">-- Basis --</option>`;
      for (let k = 0; k < nTotal; k++) {
        table += `<option value="${k}">${formatSubscriptVar(k)}</option>`;
      }
      table += `</select></td>`;
    }

    for (let j = 0; j < nextTab.rows[i].length; j++) {
      const cls = j === nextTab.rows[i].length - 1 ? 'rk-col' : '';
      table += `<td class="${cls}"><input id="nt_${currentIterIdx}_${i}_${j}"></td>`;
    }
    table += `</tr>`;
  }
  table += `</tbody></table>`;
  
  html += `<div class="tableau-wrapper">${table}</div>
    <div id="feedback4d_${currentIterIdx}" class="feedback"></div>
    <div class="btn-row"><button class="btn btn-primary" id="btnCheckFill_${currentIterIdx}">Periksa ✓</button></div>
  </div>`;
  const container = appendBlock(html);

  $(`btnCheckFill_${currentIterIdx}`).onclick = () => {
    let allOk = true;

    // Validate Basis dropdown selections for constraint rows
    for (let i = 1; i <= p.m; i++) {
      const sel = $(`ntBasis_${currentIterIdx}_${i - 1}`);
      const expBasis = nextTab.basis[i - 1];
      const chosenBasis = sel && sel.value !== '' ? parseInt(sel.value) : -1;
      if (chosenBasis !== expBasis) {
        allOk = false;
        if (sel) {
          sel.classList.add('wrong');
          sel.classList.remove('correct');
        }
      } else {
        if (sel) {
          sel.classList.add('correct');
          sel.classList.remove('wrong');
        }
      }
    }

    // Validate tableau values
    for (let i = 0; i < nextTab.rows.length; i++) {
      for (let j = 0; j < nextTab.rows[i].length; j++) {
        const inp = $(`nt_${currentIterIdx}_${i}_${j}`);
        const val = parseFracWithM(inp.value);
        const exp = nextTab.rows[i][j];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }
    const fb = $(`feedback4d_${currentIterIdx}`);
    if (allOk) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Tabel baru dan variabel basis benar!';
      disableContainer(container);
      currentIterIdx++;
      setTimeout(renderIterCheckOptimal, 600);
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = '❌ Ada yang salah.<br>• Pastikan Anda memperbarui variabel basis (variabel masuk menggantikan variabel keluar).<br>• Periksa kembali hasil perhitungan operasi baris elementer.';
    }
  };
}

// ===================== STEP 5: SOLUTION =====================
function renderStep5() {
  setStep(5);
  const p = prob;
  const finalIter = p.iterations[p.iterations.length - 1];
  const tab = finalIter.tab;
  const nTotal = p.nOrig + p.nExtra;

  const solution = {};
  for (let j = 0; j < nTotal; j++) solution[j] = ZERO;
  for (let i = 0; i < tab.basis.length; i++) {
    solution[tab.basis[i]] = tab.rows[i + 1][tab.rows[i + 1].length - 1];
  }
  const zVal = tab.rows[0][tab.rows[0].length - 1];

  let html = `<div class="card" style="border-color:var(--success);">
    <div class="card-title">
      <span>🏆 Baca Solusi Optimal</span>
      <button class="btn-help" onclick="openHelpDrawer(5)">❓ Bagaimana caranya?</button>
    </div>
    <p style="margin-bottom:1rem">Masukkan nilai variabel keputusan dan nilai optimal dari tabel.</p>`;

  for (let j = 0; j < p.nOrig; j++) {
    html += `<div class="std-form-line">
      ${texInline(`x_{${j + 1}} =`)}
      <input id="sol${j}">
    </div>`;
  }
  const optLabel = p.type === 'max' ? `\\text{Nilai Max} =` : `\\text{Nilai Min} =`;
  html += `<div class="std-form-line">
    ${texInline(optLabel)}
    <input id="solZ">
  </div>
  <div id="feedback5" class="feedback"></div>
  <div class="btn-row"><button class="btn btn-primary" id="btnCheckSol">Periksa ✓</button></div>
  </div>`;
  
  const container = appendBlock(html);

  $('btnCheckSol').onclick = () => {
    let allOk = true;
    for (let j = 0; j < p.nOrig; j++) {
      const inp = $(`sol${j}`);
      const val = parseFracWithM(inp.value);
      if (!val || !val.eq(solution[j])) { allOk = false; inp.classList.add('wrong'); }
      else { inp.classList.add('correct'); inp.classList.remove('wrong'); }
    }
    const zInput = parseFracWithM($('solZ').value);
    const expectedZ = p.type === 'max' ? zVal.neg() : zVal;
    if (!zInput || !zInput.eq(expectedZ)) {
      allOk = false;
      $('solZ').classList.add('wrong');
    } else {
      $('solZ').classList.add('correct');
      $('solZ').classList.remove('wrong');
    }

    const fb = $('feedback5');
    if (allOk) {
      fb.className = 'feedback show success';
      fb.innerHTML = '🎉 Sempurna! Anda berhasil menyelesaikan metode Simplex.';
      disableContainer(container);
      
      appendBlock(`
        <div style="text-align:center; padding: 2rem 0;">
          <button class="btn btn-primary" style="font-size:1.2rem; padding:1rem 2rem;" onclick="renderSetup()">Soal Baru →</button>
        </div>`);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Ada yang salah. (Untuk Maksimum, kalikan RK z dengan -1).';
    }
  };
}

// ===================== INIT =====================
function init() {
  renderSetup();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
