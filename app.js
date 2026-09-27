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

function checkTableauStatus(tab, extraVarsInfo, nOrig) {
  const eCol = findEntering(tab);
  const row0 = tab.rows[0];
  const nTotal = row0.length - 2;

  let artificialsPositiveInBasis = [];
  if (extraVarsInfo && nOrig !== undefined) {
    for (let i = 0; i < tab.basis.length; i++) {
      const bVarIdx = tab.basis[i];
      if (bVarIdx >= nOrig) {
        const extraIdx = bVarIdx - nOrig;
        if (extraVarsInfo[extraIdx] && extraVarsInfo[extraIdx].type === 'artificial') {
          const rkVal = tab.rows[i + 1][tab.rows[i + 1].length - 1];
          if (rkVal.isPos()) {
            artificialsPositiveInBasis.push({ varIdx: bVarIdx, row: i + 1, rk: rkVal });
          }
        }
      }
    }
  }

  const isInfeasible = artificialsPositiveInBasis.length > 0;

  if (eCol === -1) {
    if (isInfeasible) {
      return {
        status: 'INFEASIBLE',
        optimal: false,
        infeasible: true,
        unbounded: false,
        multipleOptimal: false,
        artificials: artificialsPositiveInBasis
      };
    }

    // Check multiple optimal solutions
    const basisSet = new Set(tab.basis);
    const altCols = [];
    for (let j = 1; j <= nTotal; j++) {
      const varIdx = j - 1;
      if (!basisSet.has(varIdx)) {
        if (row0[j].isZero()) {
          const canPivot = tab.rows.slice(1).some(r => r[j].isPos());
          if (canPivot) {
            altCols.push(j);
          }
        }
      }
    }

    if (altCols.length > 0) {
      return {
        status: 'MULTIPLE_OPTIMAL',
        optimal: true,
        infeasible: false,
        unbounded: false,
        multipleOptimal: true,
        altCols
      };
    }

    return {
      status: 'UNIQUE_OPTIMAL',
      optimal: true,
      infeasible: false,
      unbounded: false,
      multipleOptimal: false
    };
  }

  const lRow = findLeaving(tab, eCol);
  if (lRow === -1) {
    if (isInfeasible) {
      return {
        status: 'INFEASIBLE_UNBOUNDED',
        optimal: false,
        infeasible: true,
        unbounded: true,
        multipleOptimal: false,
        enterCol: eCol,
        artificials: artificialsPositiveInBasis
      };
    }
    return {
      status: 'UNBOUNDED',
      optimal: false,
      infeasible: false,
      unbounded: true,
      multipleOptimal: false,
      enterCol: eCol
    };
  }

  return {
    status: 'CONTINUE',
    optimal: false,
    infeasible: false,
    unbounded: false,
    multipleOptimal: false,
    enterCol: eCol,
    leaveRow: lRow
  };
}

function solveAll(obj, A, b, initialBasis, extraVarsInfo, nOrig) {
  const iterations = [];
  const { tabRaw, tabEliminated } = buildInitialTableau(obj, A, b, initialBasis);
  let tab = tabEliminated;
  for (let iter = 0; iter < 20; iter++) {
    const statusInfo = checkTableauStatus(tab, extraVarsInfo, nOrig);
    iterations.push({ tab: deepCopyTab(tab), ...statusInfo });
    if (statusInfo.status !== 'CONTINUE') {
      break;
    }
    tab = doPivot(tab, statusInfo.leaveRow, statusInfo.enterCol);
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

    // When useBigM is true, constraints can optionally include >= or =, without forcing them


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
    const { iterations: iters, tabRaw, tabEliminated } = solveAll(stdObj, A, b, initialBasis, extraVarsInfo, nOrig);
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
  const { iterations: iters, tabRaw, tabEliminated } = solveAll(stdObj, A, b, initialBasis, extraVarsInfo, nOrig);

  return {
    type, nOrig, m, nExtra, extraVarsInfo,
    ops, objOrig, Aorig, borig,
    Anorm, bnorm, normOps,
    stdObj, A, b, initialBasis,
    tabRaw, tabEliminated,
    iterations: iters
  };
}

function createCustomProblem(type, nOrig, m, objOrig, Aorig, borig, ops) {
  const Anorm = [], bnorm = [], normOps = [];

  for (let i = 0; i < m; i++) {
    const bVal = borig[i];
    const row = Aorig[i];
    const op = ops[i];
    if (bVal < 0) {
      Anorm.push(row.map(v => -v));
      bnorm.push(-bVal);
      let nOp = op;
      if (op === '<=') nOp = '>=';
      else if (op === '>=') nOp = '<=';
      normOps.push(nOp);
    } else {
      Anorm.push([...row]);
      bnorm.push(bVal);
      normOps.push(op);
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
  const { iterations: iters, tabRaw, tabEliminated } = solveAll(stdObj, A, b, initialBasis, extraVarsInfo, nOrig);

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
let currentMethod = 'tableau'; // 'tableau' or 'aljabar'

function setMethodMode(method) {
  if (currentMethod === method) return;
  currentMethod = method;
  renderSetup();
}

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
  container.style.opacity = '0.6';
  container.style.pointerEvents = 'none';
  container.querySelectorAll('input, select').forEach(el => el.disabled = true);
  container.querySelectorAll('button').forEach(el => {
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
    el.disabled = true;
  });
  // Remove hover/selectable classes
  container.querySelectorAll('.selectable').forEach(el => {
    el.classList.remove('selectable');
    el.onclick = null;
  });
}

function renderMathIn(element) {
  if (!element) return;
  if (typeof renderMathInElement !== 'undefined') {
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
      return;
    } catch (e) {
      console.error(e);
    }
  }
  element.innerHTML = renderKatexInHTML(element.innerHTML);
}

let historyBlocks = [];

function appendBlock(html) {
  const div = document.createElement('div');
  div.innerHTML = renderKatexInHTML(html);
  main().appendChild(div);
  renderMathIn(div);

  historyBlocks.push({
    element: div,
    iterIdx: typeof currentIterIdx !== 'undefined' ? currentIterIdx : 0
  });

  updateUndoButtonState();

  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 50);
  return div.firstElementChild || div;
}

function updateUndoButtonState() {
  const isEnabled = historyBlocks.length > 1;
  document.querySelectorAll('.btn-undo-step, #btnTopUndo').forEach(btn => {
    btn.disabled = !isEnabled;
  });
}

function undoPreviousStep() {
  if (historyBlocks.length <= 1) return;

  const lastItem = historyBlocks.pop();
  if (lastItem && lastItem.element) {
    lastItem.element.remove();
  }

  const prevItem = historyBlocks[historyBlocks.length - 1];
  if (prevItem && prevItem.element) {
    const container = prevItem.element;
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
    container.querySelectorAll('input, select').forEach(el => el.disabled = false);
    container.querySelectorAll('button').forEach(el => {
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.disabled = false;
    });

    if (prevItem.iterIdx !== undefined) {
      currentIterIdx = prevItem.iterIdx;
    }

    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  updateUndoButtonState();
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  ensureThemeToggleHTML();
  updateThemeToggleBtn(savedTheme);
}

function ensureThemeToggleHTML() {
  if ($('themeToggleBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'themeToggleBtn';
  btn.className = 'theme-toggle-btn';
  btn.onclick = toggleTheme;
  document.body.appendChild(btn);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', current);
  localStorage.setItem('theme', current);
  updateThemeToggleBtn(current);
}

function updateThemeToggleBtn(theme) {
  const btn = $('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

function ensureProcedureDrawerHTML() {
  if ($('procedureDrawer')) return;
  const html = `
    <div id="procedureDrawer" class="help-drawer" style="width: min(560px, 94vw);">
      <div class="help-drawer-header">
        <div class="help-drawer-title">📘 Prosedur Lengkap Metode Simplex Tableau</div>
        <button id="procedureDrawerClose" class="help-drawer-close">✕</button>
      </div>
      <div id="procedureDrawerBody" class="help-drawer-body">
        <div style="background:rgba(124,58,237,0.08); padding:0.8rem; border-radius:var(--radius); margin-bottom:1rem; border-left:4px solid var(--accent);">
          <b>💡 Panduan Alur Pengerjaan Simplex Tableau</b><br>
          Metode Simplex mencari solusi optimal secara sekuensial melalui 5 tahapan aljabar berikut.
        </div>

        <h4 style="color:var(--accent); margin:1rem 0 0.4rem 0;">1️⃣ Tahap 1: Normalisasi Ruas Kanan ($b_i \\ge 0$)</h4>
        <p>Setiap kendala wajib memiliki nilai Ruas Kanan ($b_i$) non-negatif. Jika $b_i < 0$, kalikan seluruh baris kendala dengan $-1$ dan balikkan tanda pertidaksamaan ($\\le \\to \\ge$, $\\ge \\to \\le$).</p>
        <div style="background:#f8fafc; padding:0.6rem; border-radius:var(--radius); border:1px solid var(--border-color); font-size:0.85rem; margin:0.5rem 0; color:var(--text-primary);">
          <b>Contoh:</b> $-2x_1 + 3x_2 \\le -6 \\implies 2x_1 - 3x_2 \\ge 6$
        </div>

        <h4 style="color:var(--accent); margin:1rem 0 0.4rem 0;">2️⃣ Tahap 2: Konversi ke Bentuk Baku (Standard Form)</h4>
        <ul>
          <li><b>Fungsi Objektif:</b> Jika awal <b>Maksimum $z$</b>, ubah ke <b>Minimum $-z = -\\sum c_j x_j$</b>.</li>
          <li><b>Kendala $\\le$:</b> Tambahkan 1 <b>Slack ($+S_i$)</b>. Koefisien di objektif $= 0$.</li>
          <li><b>Kendala $\\ge$:</b> Tambahkan 1 <b>Surplus ($-S_i$)</b> & 1 <b>Artifisial ($+A_i$)</b>. Koefisien $A_i$ di objektif $= +M$.</li>
          <li><b>Kendala $=$:</b> Tambahkan 1 <b>Artifisial ($+A_i$)</b>. Koefisien $A_i$ di objektif $= +M$.</li>
        </ul>

        <h4 style="color:var(--accent); margin:1rem 0 0.4rem 0;">3️⃣ Tahap 3: Tabel Simplex Awal & Eliminasi Big-M</h4>
        <p>Variabel Slack atau Artifisial menjadi variabel basis awal ($I$).</p>
        <div style="background:#f8fafc; padding:0.6rem; border-radius:var(--radius); border:1px solid var(--border-color); font-size:0.85rem; margin:0.5rem 0; color:var(--text-primary);">
          <b>Penting (Eliminasi Big-M Baris 0):</b><br>
          Jika terdapat variabel basis Artifisial ($A_i$), nolkan koefisien $M$ di Baris 0:<br>
          $$\\text{Baris } 0_{\\text{baru}} = \\text{Baris } 0_{\\text{lama}} - \\sum \\left(M \\cdot \\text{Baris } A_i\\right)$$
        </div>

        <h4 style="color:var(--accent); margin:1rem 0 0.4rem 0;">4️⃣ Tahap 4: Iterasi Simplex Tableau</h4>
        <ol>
          <li><b>Uji Kriteria Optimalitas:</b> Jika semua elemen Baris 0 bernilai $z_j - c_j \\le 0$, maka tabel <b>Optimal</b>.</li>
          <li><b>Variabel Masuk (Entering Column):</b> Pilih kolom dengan nilai $z_j - c_j > 0$ <b>positif terbesar</b>.</li>
          <li><b>Uji Rasio & Variabel Keluar (Leaving Row):</b>
            <br>Rasio $R_i = \\frac{b_i}{a_{i, \\text{pivot}}}$ untuk $a_{i, \\text{pivot}} > 0$. Pilih baris/sel dengan rasio terkecil.
            <br><i>Note: Jika seluruh $a_{i, \\text{pivot}} \\le 0$, masalah bersifat <b>Solusi Unbounded</b>.</i>
          </li>
          <li><b>Operasi Baris Elementer (OBE):</b>
            <br>• Bagi baris pivot dengan elemen pivot agar bernilai $1$.
            <br>• Nolkan elemen kolom pivot di baris lainnya:
            $$\\text{Baris } k_{\\text{baru}} = \\text{Baris } k_{\\text{lama}} - (a_{k, \\text{pivot}}) \\times \\text{Baris Pivot Baru}$$
          </li>
        </ol>

        <h4 style="color:var(--accent); margin:1rem 0 0.4rem 0;">5️⃣ Tahap 5: Pembacaan Solusi Optimal</h4>
        <p>• Variabel Basis $= \\text{Ruas Kanan (RK)}$ baris tersebut.</p>
        <p>• Variabel Non-Basis $= 0$.</p>
        <p>• Nilai Maksimum Asli $z_{\\text{max}} = -(\\text{RK Baris 0})$.</p>
      </div>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  renderMathIn($('procedureDrawerBody'));

  $('procedureDrawerClose').onclick = closeProcedureDrawer;
}

function openProcedureDrawer() {
  ensureProcedureDrawerHTML();
  $('procedureDrawer').classList.add('active');
}

function closeProcedureDrawer() {
  if ($('procedureDrawer')) $('procedureDrawer').classList.remove('active');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

// ===================== MAIN TABS & PROCEDURE SLIDES DECK =====================
let currentSlideIdx = 0;

const slidesData = [
  // ===================== BAGIAN 1: SIMPLEX ALJABAR =====================
  {
    badge: "Slide 1 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Konsep Dasar & Variabel Basis",
    content: `
      <p style="margin-bottom:1rem; line-height:1.6; font-size:0.92rem;">
        <b>Metode Simplex Aljabar</b> menyelesaikan masalah Pemrograman Linear (LP) melalui manipulasi dan substitusi persamaan aljabar secara sistematis tanpa mengandalkan matriks tabel.
      </p>

      <div style="background:rgba(124,58,237,0.06); padding:1rem 1.25rem; border-radius:var(--radius); border-left:4px solid var(--accent); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem;">3 Komponen Utama Model LP:</h4>
        <ol style="margin-left:1.2rem; line-height:1.7; font-size:0.88rem;">
          <li><b>Variabel Keputusan ($x_1, x_2, \\dots, x_n$):</b> Jumlah produk atau alokasi sumber daya yang dicari ($x_j \\ge 0$).</li>
          <li><b>Fungsi Tujuan ($z$):</b> Persamaan linear yang dioptimalkan:
            $$\\text{Maksimum/Minimum } z = c_1 x_1 + c_2 x_2 + \\dots + c_n x_n$$
          </li>
          <li><b>Fungsi Kendala:</b> Batasan kapasitas sumber daya dalam pertidaksamaan:
            $$a_{i1} x_1 + a_{i2} x_2 + \\dots \\ (\\le, \\ge, =) \\ b_i \\quad (i = 1, 2, \\dots, m)$$
          </li>
        </ol>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1rem;">
        <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Variabel Basis vs Non-basis</h4>
          <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:0.6rem; line-height:1.5;">
            Dalam sistem persamaan dengan $n$ total variabel dan $m$ kendala ($n > m$):
          </p>
          <ul style="margin-left:1.1rem; font-size:0.88rem; line-height:1.7;">
            <li><b>Variabel Basis ($m$ buah):</b> Variabel aktif bernilai $\\ge 0$ yang berada di ruas kiri persamaan. Nilai aktualnya ditentukan oleh nilai di Ruas Kanan (RK).</li>
            <li><b>Variabel Non-basis ($n-m$ buah):</b> Variabel pasif di ruas kanan yang <b>diset bernilai $0$</b>.</li>
            <li><b>Solusi Basis Layak (BFS):</b> Pasangan nilai variabel basis & non-basis merepresentasikan satu <b>Titik Sudut Layak (Corner Point)</b> daerah solusi.</li>
          </ul>
        </div>

        <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Cara Kerja Simplex Aljabar</h4>
          <ol style="margin-left:1.1rem; font-size:0.88rem; line-height:1.7;">
            <li><b>Solusi Awal:</b> Asumsikan titik asal origin $(0,0)$ sebagai basis awal (variabel non-basis $= 0$).</li>
            <li><b>Variabel Masuk (Entering):</b> Pilih variabel non-basis dengan koefisien paling negatif pada fungsi minimasi $-z$.</li>
            <li><b>Variabel Keluar (Leaving):</b> Uji kendala terketat yang paling cepat mencapai $0$ (rasio terkecil).</li>
            <li><b>Substitusi Aljabar:</b> Isolasi variabel masuk, lalu substitusikan ke seluruh persamaan lain hingga optimal.</li>
          </ol>
        </div>
      </div>
    `
  },
  {
    badge: "Slide 2 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Persamaan Baris $z$ & Bentuk Baku",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        Prosedur standar Metode Simplex Aljabar dilakukan dengan menyusun pertidaksamaan ke <b>Bentuk Baku ($=$)</b> dan memindahkan variabel fungsi tujuan ke ruas kiri menjadi <b>Persamaan Baris $z$</b>.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:2px dashed var(--border-color);">
          <h4 style="color:var(--text-muted); margin-bottom:0.5rem; font-size:0.95rem;">Langkah 1: Soal Asli</h4>
          <p style="font-size:0.83rem; color:var(--text-secondary); margin-bottom:0.75rem;">Masalah maksimasi keuntungan:</p>
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.88rem;">
            $$\\begin{aligned}
              \\text{Maksimumkan } & z = 3x_1 + 2x_2 \\\\
              \\text{kendala: } & x_1 + x_2 \\le 6 \\\\
              & 2x_1 + x_2 \\le 8 \\\\
              & x_1, x_2 \\ge 0
            \\end{aligned}$$
          </div>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:2px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Langkah 2: Bentuk Standar & Persamaan Baris $z$</h4>
          <p style="font-size:0.83rem; color:var(--text-secondary); margin-bottom:0.75rem;">Tambahkan variabel slack $x_3, x_4 \\ge 0$ dan bentuk baris $z$:</p>
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.88rem;">
            $$\\begin{aligned}
              x_1 + x_2 + x_3 &= 6 \\quad (\\text{Pers. 1}) \\\\
              2x_1 + x_2 + x_4 &= 8 \\quad (\\text{Pers. 2}) \\\\
              \\mathbf{z - 3x_1 - 2x_2} &= \\mathbf{0} \\quad (\\mathbf{\\text{Pers. } z})
            \\end{aligned}$$
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.4rem;">
              Basis awal: $x_1=0, x_2=0, x_3=6, x_4=8, z=0$
            </div>
          </div>
        </div>
      </div>

      <div style="background:rgba(124,58,237,0.06); padding:0.85rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--accent); font-size:0.88rem; line-height:1.6;">
        <b>📌 Aturan Simplex Aljabar pada Baris $z$:</b><br>
        • <b>Variabel Masuk (Entering):</b> Variabel non-basis dengan koefisien <b>paling negatif</b> pada baris $z$ (akan meningkatkan nilai $z$ paling cepat).<br>
        • <b>Kriteria Stop (Optimal):</b> Berhenti jika semua koefisien variabel non-basis pada baris $z$ sudah <b>$\\ge 0$</b>.
      </div>
    `
  },
  {
    badge: "Slide 3 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Langkah 3: Iterasi 1 (Entering, Leaving & Eliminasi)",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        Pada Persamaan Baris $z$: $z - 3x_1 - 2x_2 = 0$, terdapat koefisien negatif ($-3$ dan $-2$). Solusi <b>belum optimal</b>.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
        <!-- ENTERING VARIABLE -->
        <div style="background:rgba(124,58,237,0.05); padding:1.1rem; border-radius:var(--radius); border-left:4px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">a) Entering Variable ($x_1$ Masuk Basis)</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin-bottom:0.6rem;">
            Koefisien negatif terbesar (paling negatif) pada baris $z$ adalah <b>$-3$ pada $x_1$</b> $\\implies x_1$ masuk basis.
          </p>
        </div>

        <!-- LEAVING VARIABLE -->
        <div style="background:rgba(234,179,8,0.08); padding:1.1rem; border-radius:var(--radius); border-left:4px solid #eab308;">
          <h4 style="color:#b45309; margin-bottom:0.5rem; font-size:0.95rem;">b) Uji Rasio & Leaving Variable ($x_4$ Keluar Basis)</h4>
          <ul style="margin-left:1.1rem; font-size:0.85rem; line-height:1.6; color:var(--text-primary);">
            <li>Pers. 1: Rasio $= 6 / 1 = 6$</li>
            <li>Pers. 2: Rasio $= 8 / 2 = 4$ <b style="color:#b45309;">(Minimum!)</b></li>
            <li><b>Pivot:</b> Pers. 2, elemen pivot $= 2 \implies x_4$ keluar basis.</li>
          </ul>
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.6rem; font-size:0.95rem;">c) Operasi Baris Substitusi & Eliminasi Aljabar:</h4>
        <div style="font-size:0.86rem; line-height:1.7;">
          1. <b>Normalisasi Pers. 2 (bagi 2):</b> $x_1 + 0.5x_2 + 0.5x_4 = 4 \quad (\text{Pers. 2 baru})$<br>
          2. <b>Eliminasi $x_1$ dari Pers. 1:</b> $\text{Pers. 1} - (\text{Pers. 2 baru}) \implies \mathbf{0.5x_2 + x_3 - 0.5x_4 = 2}$<br>
          3. <b>Eliminasi $x_1$ dari Pers. $z$:</b> $\text{Pers. } z + 3 \times (\text{Pers. 2 baru}) \implies \mathbf{z - 0.5x_2 + 1.5x_4 = 12}$
        </div>
      </div>

      <div style="background:var(--success-bg); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--success); font-size:0.88rem;">
        <strong style="color:var(--success);">Hasil Iterasi 1:</strong> Basis baru $x_1 = 4, \, x_3 = 2, \, z = 12$.
      </div>
    `
  },
  {
    badge: "Slide 4 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Iterasi 1: Isolasi & Substitusi Persamaan",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        Setelah menyetujui bahwa <b>$x_1$ masuk basis</b> dan <b>$x_4$ keluar basis</b>, kita harus menyusun ulang persamaan aljabar agar $x_1$ menjadi variabel basis di ruas kiri.
      </p>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Langkah 3: Isolasi Persamaan Substitusi untuk $x_1$</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem; line-height:1.6;">
          Ambil persamaan kendala milik variabel keluar $x_4$ dari Iterasi 0:
        </p>
        <div style="background:var(--bg-primary); padding:0.75rem 1rem; border-radius:var(--radius); font-size:0.95rem; text-align:center; margin-bottom:0.75rem;">
          $$x_4 = 8 - 2x_1 - x_2$$
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem; line-height:1.6;">
          Pindahkan $2x_1$ ke ruas kiri dan $x_4$ ke ruas kanan, lalu bagi kedua ruas dengan koefisien $2$:
        </p>
        <div style="background:rgba(124,58,237,0.08); padding:0.75rem 1rem; border-radius:var(--radius); font-size:1rem; text-align:center; border:1px solid var(--accent); color:var(--accent); font-weight:bold;">
          $$2x_1 = 8 - x_2 - x_4 \\implies \\mathbf{x_1 = 4 - 0.5x_2 - 0.5x_4}$$
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Langkah 4: Substitusikan Ekspresi $x_1$ ke Persamaan Lainnya</h4>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap:1rem; margin-top:0.75rem;">
          <div style="background:var(--bg-primary); padding:0.9rem; border-radius:var(--radius);">
            <strong style="color:var(--text-primary); font-size:0.88rem;">a. Ke Fungsi Tujuan ($\\text{Min } -z$):</strong>
            <div style="font-size:0.85rem; margin-top:0.4rem; line-height:1.6;">
              $$\\begin{aligned}
                \\text{Min } -z &= -3(4 - 0.5x_2 - 0.5x_4) - 2x_2 \\\\
                &= -12 + 1.5x_2 + 1.5x_4 - 2x_2 \\\\
                &= \\mathbf{-12 - 0.5x_2 + 1.5x_4}
              \\end{aligned}$$
            </div>
          </div>

          <div style="background:var(--bg-primary); padding:0.9rem; border-radius:var(--radius);">
            <strong style="color:var(--text-primary); font-size:0.88rem;">b. Ke Kendala Basis $x_3$:</strong>
            <div style="font-size:0.85rem; margin-top:0.4rem; line-height:1.6;">
              $$\\begin{aligned}
                x_3 &= 6 - (4 - 0.5x_2 - 0.5x_4) - x_2 \\\\
                &= 6 - 4 + 0.5x_2 + 0.5x_4 - x_2 \\\\
                &= \\mathbf{2 - 0.5x_2 + 0.5x_4}
              \\end{aligned}$$
            </div>
          </div>
        </div>
      </div>

      <!-- ITERASI 1 SUMMARY BOX -->
      <div style="background:var(--success-bg); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--success); font-size:0.88rem;">
        <strong style="color:var(--success);">Hasil Iterasi 1 (Titik Sudut $(4,0)$):</strong><br>
        • Variabel Basis: $x_1 = 4, \\, x_3 = 2$ &nbsp;|&nbsp; Variabel Non-basis ($=0$): $x_2 = 0, \\, x_4 = 0$<br>
        • Nilai $-z = -12 \\implies z = 12$ (Keuntungan naik dari 0 menjadi 12!).
      </div>
    `
  },
  {
    badge: "Slide 5 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Iterasi 2: Pertukaran Basis Kedua",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        Periksa fungsi tujuan Iterasi 1: $\\text{Min } -z = -12 - 0.5x_2 + 1.5x_4$. Karena masih terdapat koefisien negatif pada variabel non-basis ($-0.5$ pada $x_2$), solusi <b>belum optimal</b>. Iterasi 2 dijalankan!
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
        <div style="background:rgba(124,58,237,0.05); padding:1rem; border-radius:var(--radius); border-left:3px solid var(--accent);">
          <strong style="color:var(--accent); font-size:0.9rem;">a. Entering Variable Baru</strong>
          <p style="font-size:0.83rem; color:var(--text-secondary); margin-top:0.3rem; margin-bottom:0; line-height:1.5;">
            Pilih <b>$x_2$</b> karena koefisien $-0.5$ adalah satu-satunya nilai negatif pada fungsi tujuan $\\text{Min } -z = -12 - 0.5x_2 + 1.5x_4$.
          </p>
        </div>
        <div style="background:rgba(234,179,8,0.08); padding:1rem; border-radius:var(--radius); border-left:3px solid #eab308;">
          <strong style="color:#b45309; font-size:0.9rem;">b. Leaving Variable Baru (Uji Rasio)</strong>
          <p style="font-size:0.83rem; color:var(--text-secondary); margin-top:0.3rem; margin-bottom:0; line-height:1.5;">
            • Dari kendala $x_3 = 2 - 0.5x_2 \\ge 0 \\implies \\mathbf{x_2 \\le 4}$ <b style="color:#b45309;">(Batas terkecil! $x_3$ keluar)</b><br>
            • Dari kendala $x_1 = 4 - 0.5x_2 \\ge 0 \\implies x_2 \\le 8$
          </p>
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">c. Isolasi Persamaan Substitusi untuk $x_2$</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem; line-height:1.5;">
          Dari kendala $x_3 = 2 - 0.5x_2 + 0.5x_4$, isolasi $0.5x_2$ ke ruas kiri:
        </p>
        <div style="background:rgba(124,58,237,0.08); padding:0.6rem; border-radius:var(--radius); font-size:0.95rem; text-align:center; border:1px solid var(--accent); color:var(--accent); font-weight:bold;">
          $$0.5x_2 = 2 - x_3 + 0.5x_4 \\implies \\mathbf{x_2 = 4 - 2x_3 + x_4}$$
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">d. Substitusi Akhir ke $-z$ dan Persamaan Kendala $x_1$</h4>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:0.85rem; margin-top:0.6rem;">
          <div style="background:var(--bg-primary); padding:0.8rem; border-radius:var(--radius);">
            <span style="font-size:0.8rem; color:var(--text-muted);">Fungsi Tujuan Akhir ($-z$):</span>
            <div style="font-size:0.85rem; margin-top:0.3rem; line-height:1.5;">
              $$\\begin{aligned}
                \\text{Min } -z &= -12 - 0.5(4 - 2x_3 + x_4) + 1.5x_4 \\\\
                &= \\mathbf{-14 + x_3 + x_4}
              \\end{aligned}$$
            </div>
          </div>
          <div style="background:var(--bg-primary); padding:0.8rem; border-radius:var(--radius);">
            <span style="font-size:0.8rem; color:var(--text-muted);">Kendala Basis Akhir $x_1$:</span>
            <div style="font-size:0.85rem; margin-top:0.3rem; line-height:1.5;">
              $$\\begin{aligned}
                x_1 &= 4 - 0.5(4 - 2x_3 + x_4) - 0.5x_4 \\\\
                &= \\mathbf{2 + x_3 - x_4}
              \\end{aligned}$$
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    badge: "Slide 6 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Hasil Optimal & Perbandingan Iterasi",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        Periksa fungsi tujuan hasil Iterasi 2: $\\text{Min } -z = -14 + x_3 + x_4$.
      </p>

      <div style="background:var(--success-bg); color:var(--text-primary); padding:1rem 1.25rem; border-radius:var(--radius); border-left:4px solid var(--success); margin-bottom:1.25rem;">
        <h4 style="color:var(--success); margin-bottom:0.4rem; font-size:0.95rem;">🎉 Kriteria Optimalitas Aljabar Tercapai!</h4>
        <p style="font-size:0.88rem; line-height:1.6; margin-bottom:0.6rem;">
          Karena seluruh koefisien variabel non-basis ($x_3, x_4$) pada fungsi tujuan sudah <b>positif ($\\ge 0$)</b> yaitu $+1x_3$ dan $+1x_4$, menaikkan nilai $x_3$ atau $x_4$ hanya akan memperbesar nilai $-z$ (memperkecil nilai $z$). Maka iterasi <b>SELESAI</b>.
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:1rem; background:rgba(255,255,255,0.7); padding:0.75rem 1rem; border-radius:var(--radius); font-size:0.88rem;">
          <div>• <b>Variabel Keputusan:</b> $x_1 = 2, \\, x_2 = 4$</div>
          <div>• <b>Sisa Kapasitas (Slack):</b> $x_3 = 0, \\, x_4 = 0$</div>
          <div>• <b>Solusi Maksimum Asli ($z_{\\text{max}}$):</b> $z_{\\text{max}} = -(-14) = \\mathbf{14}$</div>
        </div>
      </div>

      <h4 style="color:var(--accent); margin-bottom:0.6rem;">Ringkasan Perjalanan Iterasi Simplex Aljabar:</h4>
      <div style="overflow-x:auto;">
        <table class="tableau" style="width:100%; font-size:0.85rem;">
          <thead>
            <tr>
              <th>Iterasi</th>
              <th>Titik Sudut $(x_1, x_2)$</th>
              <th>Variabel Basis</th>
              <th>Variabel Non-basis</th>
              <th>Nilai $-z$</th>
              <th>Nilai $z$</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Iterasi 0</b></td>
              <td>$(0, 0)$</td>
              <td>$x_3 = 6, \\, x_4 = 8$</td>
              <td>$x_1 = 0, \\, x_2 = 0$</td>
              <td>$0$</td>
              <td>$0$</td>
              <td>Layak, Belum Optimal</td>
            </tr>
            <tr>
              <td><b>Iterasi 1</b></td>
              <td>$(4, 0)$</td>
              <td>$x_1 = 4, \\, x_3 = 2$</td>
              <td>$x_2 = 0, \\, x_4 = 0$</td>
              <td>$-12$</td>
              <td>$12$</td>
              <td>Layak, Belum Optimal</td>
            </tr>
            <tr style="background:rgba(34,197,94,0.12);">
              <td><b>Iterasi 2</b></td>
              <td>$(2, 4)$</td>
              <td>$x_1 = 2, \\, x_2 = 4$</td>
              <td>$x_3 = 0, \\, x_4 = 0$</td>
              <td>$-14$</td>
              <td><b>$14$</b></td>
              <td><b style="color:var(--success);">OPTIMAL LAYAK</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  },

  // ===================== BAGIAN 2: SIMPLEX TABLEAU =====================
  {
    badge: "Slide 7 / 11 • Simplex Tableau",
    title: "2. Simplex Tableau • Matriks Tableau Simplex Awal",
    content: `
      <p style="margin-bottom:1rem;">
        <b>Metode Simplex Tableau</b> menyusun koefisien persamaan aljabar ke dalam matriks tabel yang sistematis untuk memudahkan eksekusi Operasi Baris Elementer (OBE).
      </p>

      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem;">Anatomi Matriks Tableau Simplex Awal:</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          Matriks disusun dari persamaan baku: $z - 3x_1 - 2x_2 = 0$, $x_1 + x_2 + x_3 = 6$, dan $2x_1 + x_2 + x_4 = 8$:
        </p>
        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th>$x_1$</th><th>$x_2$</th><th>$x_3$</th><th>$x_4$</th><th class="rk-col">RK</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td style="color:var(--accent); font-weight:bold;">$3$</td><td style="color:var(--accent); font-weight:bold;">$2$</td><td>$0$</td><td>$0$</td><td class="rk-col">$0$</td></tr>
              <tr><td>$x_3$</td><td>$0$</td><td>$1$</td><td>$1$</td><td>$1$</td><td>$0$</td><td class="rk-col">$6$</td></tr>
              <tr><td>$x_4$</td><td>$0$</td><td>$2$</td><td>$1$</td><td>$0$</td><td>$1$</td><td class="rk-col">$8$</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
        <div style="background:rgba(124,58,237,0.06); padding:0.9rem; border-radius:var(--radius); border-left:3px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.3rem; font-size:0.9rem;">Baris 0 (Objektif $z$)</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            Menyimpan koefisien fungsi tujuan Minimasi $-z$. Untuk Maksimum $z = c_j x_j$, koefisien dipindahkan ke sebelah kiri sehingga bernilai positif di $-z$.
          </p>
        </div>

        <div style="background:rgba(124,58,237,0.06); padding:0.9rem; border-radius:var(--radius); border-left:3px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.3rem; font-size:0.9rem;">Kolom Basis & Kolom RK</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            <b>Kolom Basis</b> mencatat variabel aktif saat ini. <b>Kolom RK (Ruas Kanan)</b> mencatat nilai numerik aktual dari variabel basis tersebut.
          </p>
        </div>
      </div>
    `
  },
  {
    badge: "Slide 8 / 11 • Simplex Tableau",
    title: "2. Simplex Tableau • Operasi Pivot & OBE",
    content: `
      <p style="margin-bottom:1rem;">
        Prosedur iterasi Tableau berpindah antar solusi melalui <b>Uji Rasio Minimum</b> dan <b>Operasi Baris Elementer (OBE)</b> pada elemen Pivot.
      </p>

      <!-- TABEL ITERASI 1 -->
      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">1. Tabel Iterasi 1 (Penentuan Pivot):</h4>
        <ul style="margin-left:1.1rem; font-size:0.85rem; margin-bottom:0.75rem; line-height:1.6;">
          <li><b>Kolom Pivot (Entering):</b> Kolom $x_1$ karena $3$ paling positif di Baris 0 (Kolom Biru).</li>
          <li><b>Uji Rasio ($R_i = \\text{RK} / a_{i, \\text{pivot}}$):</b>
            <br>• Baris $x_3$: $R_1 = 6 / 1 = 6$
            <br>• Baris $x_4$: $R_2 = 8 / 2 = 4$ <b>(Terkecil \\implies Baris $x_4$ Keluar / Leaving)</b>
          </li>
          <li><b>Elemen Pivot:</b> Angka <b>$2$</b> pada sel pertemuan $x_1$ & $x_4$ (Sel Hijau).</li>
        </ul>

        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th class="col-selected">$x_1$ (Enter)</th><th>$x_2$</th><th>$x_3$</th><th>$x_4$</th><th class="rk-col">RK</th><th>Rasio ($R_i$)</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td class="col-selected" style="font-weight:bold;">$3$</td><td>$2$</td><td>$0$</td><td>$0$</td><td class="rk-col">$0$</td><td>-</td></tr>
              <tr><td>$x_3$</td><td>$0$</td><td class="col-selected">$1$</td><td>$1$</td><td>$1$</td><td>$0$</td><td class="rk-col">$6$</td><td>$6/1 = 6$</td></tr>
              <tr style="background:rgba(234,179,8,0.15);"><td style="font-weight:bold; color:var(--accent);">$x_4$ (Leave)</td><td>$0$</td><td class="pivot-cell" style="font-size:1.1rem; font-weight:bold;">$2$</td><td>$1$</td><td>$0$</td><td>$1$</td><td class="rk-col" style="font-weight:bold;">$8$</td><td style="color:var(--success); font-weight:bold;">$8/2 = 4$ (Min)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL ITERASI 2 -->
      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">2. Tabel Iterasi 2 (Setelah OBE Pivot 1):</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          Variabel $x_1$ masuk basis menggantikan $x_4$. Sel pivot dijadikan $1$ (Bagi Baris 2 dengan 2), lalu dinolkan pada baris lainnya:
        </p>
        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th>$x_1$</th><th class="col-selected">$x_2$ (Enter)</th><th>$x_3$</th><th>$x_4$</th><th class="rk-col">RK</th><th>Rasio ($R_i$)</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td>$0$</td><td class="col-selected" style="font-weight:bold;">$1/2$</td><td>$0$</td><td>$-3/2$</td><td class="rk-col">$-12$</td><td>-</td></tr>
              <tr style="background:rgba(234,179,8,0.15);"><td style="font-weight:bold; color:var(--accent);">$x_3$ (Leave)</td><td>$0$</td><td>$0$</td><td class="pivot-cell" style="font-size:1.1rem; font-weight:bold;">$1/2$</td><td>$1$</td><td>$-1/2$</td><td class="rk-col">$2$</td><td style="color:var(--success); font-weight:bold;">$2 / (1/2) = 4$ (Min)</td></tr>
              <tr><td>$x_1$</td><td>$0$</td><td>$1$</td><td class="col-selected">$1/2$</td><td>$0$</td><td>$1/2$</td><td class="rk-col">$4$</td><td>$4 / (1/2) = 8$</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL FINAL OPTIMAL -->
      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1rem;">
        <h4 style="color:var(--success); margin-bottom:0.5rem; font-size:0.95rem;">3. Tabel Iterasi 3 (FINAL OPTIMAL):</h4>
        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th>$x_1$</th><th>$x_2$</th><th>$x_3$</th><th>$x_4$</th><th class="rk-col">RK</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td>$0$</td><td>$0$</td><td style="color:var(--success); font-weight:bold;">$-1$</td><td style="color:var(--success); font-weight:bold;">$-1$</td><td class="rk-col" style="color:var(--success); font-weight:bold;">$-14$</td></tr>
              <tr><td>$x_2$</td><td>$0$</td><td>$0$</td><td>$1$</td><td>$2$</td><td>$-1$</td><td class="rk-col" style="color:var(--accent); font-weight:bold;">4</td></tr>
              <tr><td>$x_1$</td><td>$0$</td><td>$1$</td><td>$0$</td><td>$-1$</td><td>$1$</td><td class="rk-col" style="color:var(--accent); font-weight:bold;">2</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="background:var(--success-bg); color:var(--text-primary); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--success);">
        <h4 style="color:var(--success); margin-bottom:0.3rem;">Pembacaan Solusi Optimal Akhir:</h4>
        <p style="font-size:0.88rem; line-height:1.6;">
          Karena seluruh elemen Baris 0 bernilai $\\le 0$ ($-1, -1 \\le 0$), maka tabel sudah <b>OPTIMAL</b>:
          <br>• <b>Variabel Basis:</b> $x_1 = 2, \\, x_2 = 4$
          <br>• <b>Variabel Non-basis:</b> $x_3 = 0, \\, x_4 = 0$
          <br>• <b>Solusi Maksimum Asli ($z_{\\text{max}}$):</b> $z_{\\text{max}} = -(\\text{RK Baris 0}) = -(-14) = \\mathbf{14}$
        </p>
      </div>
    `
  },

  // ===================== BAGIAN 3: METODE BIG-M =====================
  {
    badge: "Slide 9 / 11 • Metode Big-M",
    title: "3. Metode Big-M • Penanganan Kendala $\\le$ dan $\\ge$",
    content: `
      <p style="margin-bottom:1rem;">
        Untuk kendala berjenis $\\ge$ atau $=$, titik origin $(0,0)$ tidak memberikan solusi layak. <b>Metode Big-M</b> menambahkan <b>Variabel Artifisial ($+x_a$)</b> bernilai pinalti sangat besar $+M$.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.92rem;">Surplus ($-x_s$) vs Artifisial ($+x_a$)</h4>
          <ul style="margin-left:1.1rem; font-size:0.88rem; line-height:1.6;">
            <li><b>Variabel Surplus ($-x_s$):</b> Mengurangi kelebihan nilai ruas kiri pada kendala $\\ge$. Memiliki koefisien $0$ di objektif.</li>
            <li><b>Variabel Artifisial ($+x_a$):</b> Variabel tiruan agar matriks identitas basis awal terbentuk. Memiliki pinalti $+M$ di Min $-z$.</li>
          </ul>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          <h4 style="color:var(--error); margin-bottom:0.4rem; font-size:0.92rem;">Fungsi Pinalti Big-M ($+M$)</h4>
          <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.6;">
            Dengan memberikan pinalti $+M$ yang sangat besar pada Min $-z$, metode Simplex dipaksa untuk <b>menolong menyingkirkan variabel artifisial keluar dari basis ($x_a = 0$)</b> pada iterasi awal.
          </p>
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); border-left:4px solid var(--accent); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.92rem;">💡 Notasi Masalah $\\mathcal{P}$ vs $\\mathcal{P}(M)$:</h4>
        <ul style="margin-left:1.1rem; font-size:0.88rem; line-height:1.6;">
          <li><b>$\\mathcal{P}$ (Permasalahan Asli):</b> Model Pemrograman Linear awal yang ingin diselesaikan. Ketika ada kendala $\\ge$ atau $=$, titik origin $(0,0)$ tidak bisa menjadi basis layak awal.</li>
          <li><b>$\\mathcal{P}(M)$ (Permasalahan Big-M Modifikasi):</b> Model LP baru hasil modifikasi dengan penambahan variabel artifisial ($+x_a$) dan pinalti $+M$ pada fungsi tujuan agar memiliki matriks basis awal.</li>
        </ul>
      </div>

      <h4 style="color:var(--accent); margin-bottom:0.6rem;">Contoh Model LP dengan Kendala Campuran ($\\le$ dan $\\ge$):</h4>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap:1rem;">
        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:2px dashed var(--border-color);">
          <h4 style="color:var(--text-muted); margin-bottom:0.4rem; font-size:0.9rem;">1. Model Formulasi Asli</h4>
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.85rem;">
            $$\\begin{aligned}
              \\text{Maksimum } & z = 3x_1 + 2x_2 \\\\
              \\text{kendala: } & x_1 + x_2 \\le 6 \\\\
              & 2x_1 + x_2 \\ge 8 \\\\
              & x_1, x_2 \\ge 0
            \\end{aligned}$$
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.5rem; padding:0.4rem 0.6rem; background:rgba(0,0,0,0.03); border-radius:var(--radius); line-height:1.5;">
            • <b>Kendala 1 ($\\le$):</b> Tambah <b>Slack ($+x_3$)</b><br>
            • <b>Kendala 2 ($\\ge$):</b> Kurang <b>Surplus ($-x_4$)</b> & Tambah <b>Artifisial ($+x_5$)</b>
          </div>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:2px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.9rem;">2. Bentuk Baku Big-M</h4>
          <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.85rem; margin-bottom:0.5rem;">
            $$\\begin{aligned}
              \\text{Minimum } & -z = -3x_1 - 2x_2 + 0x_3 + 0x_4 + M x_5 \\\\
              \\text{kendala: } & x_1 + x_2 + x_3 = 6 \\\\
              & 2x_1 + x_2 - x_4 + x_5 = 8
            \\end{aligned}$$
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); padding:0.4rem 0.6rem; background:rgba(124,58,237,0.05); border-radius:var(--radius);">
            • <b>Basis Awal:</b> $x_3 = 6, x_5 = 8$
          </div>
        </div>
      </div>
    `
  },
  {
    badge: "Slide 10 / 11 • Metode Big-M",
    title: "3. Metode Big-M • Eliminasi Baris 0 & Solusi Akhir",
    content: `
      <p style="margin-bottom:1rem;">
        Langkah paling kritis pada Metode Big-M adalah <b>mengeliminasi koefisien $-M$ pada Baris 0</b> sebelum memulai iterasi pivot pertama.
      </p>

      <div style="background:var(--error-bg); color:var(--text-primary); padding:1rem; border-radius:var(--radius); border-left:4px solid var(--error); margin-bottom:1.25rem;">
        <h4 style="color:var(--error); margin-bottom:0.4rem;">Operasi Baris Eliminasi $M$ (Sebelum Iterasi 1):</h4>
        <p style="margin-bottom:0.5rem; font-size:0.88rem;">
          Variabel basis artifisial ($x_5$) <b>wajib bernilai $0$</b> di kolom basisnya pada Baris 0:
        </p>
        $$\\text{Baris } 0_{\\text{baru}} = \\text{Baris } 0_{\\text{lama}} + \\left(M \\times \\text{Baris Kendala Artifisial } x_5\\right)$$
      </div>

      <!-- TABEL SEBELUM ELIMINASI M -->
      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--text-primary); margin-bottom:0.5rem; font-size:0.95rem;">1. Tableau Awal (SEBELUM Eliminasi $M$):</h4>
        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th>$x_1$</th><th>$x_2$</th><th>$x_3$</th><th>$x_4$</th><th>$x_5$</th><th class="rk-col">RK</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td>$3$</td><td>$2$</td><td>$0$</td><td>$0$</td><td style="color:var(--error); font-weight:bold;">$-M$</td><td class="rk-col">$0$</td></tr>
              <tr><td>$x_3$</td><td>$0$</td><td>$1$</td><td>$1$</td><td>$1$</td><td>$0$</td><td>$0$</td><td class="rk-col">$6$</td></tr>
              <tr><td>$x_5$</td><td>$0$</td><td>$2$</td><td>$1$</td><td>$0$</td><td>$-1$</td><td>$1$</td><td class="rk-col">$8$</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL SETELAH ELIMINASI M -->
      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--success); margin-bottom:0.5rem; font-size:0.95rem;">2. Tableau Awal SIAP ITERASI (Setelah Eliminasi $M$):</h4>
        <div class="tableau-wrapper">
          <table class="tableau" style="width:100%;">
            <thead>
              <tr><th>Basis</th><th>$z$</th><th>$x_1$</th><th>$x_2$</th><th>$x_3$</th><th>$x_4$</th><th>$x_5$</th><th class="rk-col">RK</th></tr>
            </thead>
            <tbody>
              <tr class="row-0"><td class="row-label">$z$</td><td>$1$</td><td style="color:var(--accent); font-weight:bold;">$3+2M$</td><td style="color:var(--accent); font-weight:bold;">$2+M$</td><td>$0$</td><td style="color:var(--accent); font-weight:bold;">$-M$</td><td style="color:var(--success); font-weight:bold;">$0$</td><td class="rk-col" style="color:var(--accent); font-weight:bold;">$8M$</td></tr>
              <tr><td>$x_3$</td><td>$0$</td><td>$1$</td><td>$1$</td><td>$1$</td><td>$0$</td><td>$0$</td><td class="rk-col">$6$</td></tr>
              <tr><td>$x_5$</td><td>$0$</td><td>$2$</td><td>$1$</td><td>$0$</td><td>$-1$</td><td>$1$</td><td class="rk-col">$8$</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="background:var(--success-bg); color:var(--text-primary); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--success);">
        <h4 style="color:var(--success); margin-bottom:0.3rem;">Solusi Optimal Big-M:</h4>
        <p style="font-size:0.88rem; line-height:1.6;">
          Setelah dilakukan iterasi pivot OBE, variabel artifisial $x_5$ berhasil tersingkir keluar dari basis ($x_5=0$).
          Solusi optimal akhir yang diperoleh adalah <b>$x_1 = 2, \\, x_2 = 4, \\, z_{\\text{max}} = 14$</b>.
        </p>
      </div>
    `
  },
  {
    badge: "Slide 11 / 11 • Metode Big-M",
    title: "3. Metode Big-M • Ringkasan & Diagram Keputusan Solusi",
    content: `
      <p style="margin-bottom:1.25rem; font-size:0.92rem; color:var(--text-secondary); line-height:1.6;">
        Berikut adalah <b>diagram pohon keputusan (decision tree)</b> untuk menginterpretasikan hasil akhir algoritma Metode Big-M ($\\mathcal{P}(M)$) terhadap permasalahan pemrograman linear asli ($\\mathcal{P}$):
      </p>

      <!-- SVG DECISION TREE DIAGRAM -->
      <div style="background:var(--card-bg); padding:1.25rem 0.5rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem; text-align:center;">
        <h4 style="color:var(--accent); margin-bottom:1.25rem; font-size:1.05rem;">Ringkasan metode <i>Big-M</i></h4>
        
        <div style="overflow-x:auto; padding:0.5rem 0;">
          <svg viewBox="0 0 720 370" style="width:100%; max-width:700px; height:auto; font-family:inherit; min-width:540px;">
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--text-primary)" />
              </marker>
            </defs>

            <!-- CONNECTOR LINES -->
            <line x1="360" y1="65" x2="220" y2="108" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="360" y1="65" x2="500" y2="108" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />

            <line x1="220" y1="172" x2="135" y2="242" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="220" y1="172" x2="305" y2="242" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />

            <line x1="500" y1="172" x2="415" y2="242" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />
            <line x1="500" y1="172" x2="585" y2="242" stroke="var(--text-primary)" stroke-width="2" marker-end="url(#arrowhead)" />

            <!-- ROOT NODE P(M) -->
            <circle cx="360" cy="40" r="32" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="360" y="46" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--text-primary)"><tspan font-style="italic">P</tspan>(<tspan font-style="italic">M</tspan>)</text>

            <!-- BRANCH 1: Nilai optimal hingga -->
            <circle cx="220" cy="140" r="40" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="220" y="133" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)">Nilai</text>
            <text x="220" y="148" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)">optimal</text>
            <text x="220" y="163" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)">hingga</text>

            <!-- BRANCH 2: Nilai optimal tak terbatas -->
            <circle cx="500" cy="140" r="40" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="500" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-primary)">Nilai</text>
            <text x="500" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-primary)">optimal tak</text>
            <text x="500" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-primary)">terbatas</text>

            <!-- LEAF 1: xa = 0, Nilai optimal P ada -->
            <circle cx="135" cy="285" r="45" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="135" y="268" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)"><tspan font-style="italic">x</tspan><tspan dy="2" font-size="10" font-style="italic">a</tspan><tspan dy="-2" font-size="13"> = 0</tspan></text>
            <text x="135" y="286" text-anchor="middle" font-size="12" fill="var(--text-primary)">Nilai optimal</text>
            <text x="135" y="302" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--success)"><tspan font-style="italic">P</tspan> ada</text>

            <!-- LEAF 2: xa != 0, Solusi P tak feasibel -->
            <circle cx="305" cy="285" r="45" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="305" y="268" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--error)"><tspan font-style="italic">x</tspan><tspan dy="2" font-size="10" font-style="italic">a</tspan><tspan dy="-2" font-size="13"> ≠ 0</tspan></text>
            <text x="305" y="286" text-anchor="middle" font-size="12" fill="var(--text-primary)">Solusi <tspan font-style="italic">P</tspan></text>
            <text x="305" y="302" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--error)">tak feasibel</text>

            <!-- LEAF 3: xa = 0, Nilai optimal P tak terbatas -->
            <circle cx="415" cy="285" r="45" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="415" y="266" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)"><tspan font-style="italic">x</tspan><tspan dy="2" font-size="10" font-style="italic">a</tspan><tspan dy="-2" font-size="13"> = 0</tspan></text>
            <text x="415" y="283" text-anchor="middle" font-size="11" fill="var(--text-primary)">Nilai optimal <tspan font-style="italic">P</tspan></text>
            <text x="415" y="300" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">tak terbatas</text>

            <!-- LEAF 4: xa != 0, Solusi P tak feasibel -->
            <circle cx="585" cy="285" r="45" fill="var(--card-bg)" stroke="var(--text-primary)" stroke-width="2" />
            <text x="585" y="268" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--error)"><tspan font-style="italic">x</tspan><tspan dy="2" font-size="10" font-style="italic">a</tspan><tspan dy="-2" font-size="13"> ≠ 0</tspan></text>
            <text x="585" y="286" text-anchor="middle" font-size="12" fill="var(--text-primary)">Solusi <tspan font-style="italic">P</tspan></text>
            <text x="585" y="302" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--error)">tak feasibel</text>
          </svg>
        </div>
      </div>

      <!-- EXPLANATION CARDS -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); border-left:4px solid var(--success);">
          <h4 style="color:var(--success); margin-bottom:0.4rem; font-size:0.92rem;">1. Nilai Optimal Hingga & $x_a = 0$</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            Seluruh variabel artifisial bernilai 0 ($x_a = 0$) dan keluar dari basis. Maka solusi yang diperoleh dari tabel akhir adalah <b>Solusi Optimal Layak (Feasible & Optimal)</b> untuk masalah asli $\\mathcal{P}$.
          </p>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); border-left:4px solid var(--error);">
          <h4 style="color:var(--error); margin-bottom:0.4rem; font-size:0.92rem;">2. Nilai Optimal Hingga & $x_a \\neq 0$</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            Tabel Simplex telah mencapai kondisi optimal, namun setidaknya satu variabel artifisial bernilai positif di basis ($x_a > 0$). Artinya masalah asli $\\mathcal{P}$ <b>TIDAK MEMILIKI SOLUSI LAYAK (Infeasible)</b>.
          </p>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); border-left:4px solid #b45309;">
          <h4 style="color:#b45309; margin-bottom:0.4rem; font-size:0.92rem;">3. Nilai Optimal Tak Terbatas & $x_a = 0$</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            Variabel artifisial berhasil dihilangkan ($x_a = 0$), tetapi tidak ada baris yang membatasi rasio minimum (semua elemen pivot $\\le 0$). Solusi masalah asli $\\mathcal{P}$ adalah <b>TAK TERBATAS (Unbounded)</b>.
          </p>
        </div>

        <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); border-left:4px solid var(--error);">
          <h4 style="color:var(--error); margin-bottom:0.4rem; font-size:0.92rem;">4. Nilai Optimal Tak Terbatas & $x_a \\neq 0$</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
            Kombinasi tak terbatas dengan variabel artifisial tersisa ($x_a > 0$) mengindikasikan bahwa sistem kendala asli saling bertentangan sehingga masalah asli $\\mathcal{P}$ <b>TIDAK FEASIBEL</b>.
          </p>
        </div>
      </div>

      <div style="margin-top:1.5rem; text-align:center; font-size:0.8rem; color:var(--text-secondary); opacity:0.75; border-top:1px dashed var(--border-color); padding-top:0.75rem;">
        <i>Referensi Materi: Slide Kuliah MA3071 Pengantar Optimisasi — Dr. Agus Yodi Gunawan</i>
      </div>
    `
  }
];

function switchMainTab(tab) {
  const btnEx = $('btnTabExercise');
  const btnProc = $('btnTabProcedure');
  const secEx = $('secExercise');
  const secProc = $('secProcedure');

  if (tab === 'exercise') {
    btnEx.classList.add('active');
    btnProc.classList.remove('active');
    secEx.style.display = 'block';
    secProc.style.display = 'none';
  } else {
    btnEx.classList.remove('active');
    btnProc.classList.add('active');
    secEx.style.display = 'none';
    secProc.style.display = 'block';
    renderProcedureSlides();
  }
}

function renderProcedureSlides() {
  const cardContainer = $('slideCardContent');
  if (!cardContainer) return;

  let currentSectionIdx = 0;
  if (currentSlideIdx >= 8) currentSectionIdx = 2;
  else if (currentSlideIdx >= 6) currentSectionIdx = 1;

  const quickNavHtml = `
    <div class="procedure-module-nav">
      <button class="module-nav-btn ${currentSectionIdx === 0 ? 'active' : ''}" onclick="goToSlide(0)">
        1. Simplex Aljabar
      </button>
      <button class="module-nav-btn ${currentSectionIdx === 1 ? 'active' : ''}" onclick="goToSlide(6)">
        2. Simplex Tableau
      </button>
      <button class="module-nav-btn ${currentSectionIdx === 2 ? 'active' : ''}" onclick="goToSlide(8)">
        3. Metode Big-M
      </button>
    </div>
  `;

  // Render Active Slide Card
  const slide = slidesData[currentSlideIdx];
  const hasPrev = currentSlideIdx > 0;
  const isLast = currentSlideIdx === slidesData.length - 1;

  const nextBtnHtml = isLast
    ? `<button class="btn btn-primary" onclick="switchMainTab('exercise')">Ayo coba! →</button>`
    : `<button class="btn btn-primary" onclick="goToSlide(${currentSlideIdx + 1})">Slide Selanjutnya →</button>`;

  const cardHtml = `
    ${quickNavHtml}
    <div class="slide-card">
      <div class="slide-header">
        <div class="slide-title">${slide.title}</div>
        <div class="slide-badge">${slide.badge}</div>
      </div>
      <div class="slide-body" style="font-size:0.95rem; line-height:1.7;">
        ${slide.content}
      </div>
      <div class="slide-footer">
        <button class="btn btn-outline-secondary" onclick="goToSlide(${currentSlideIdx - 1})" ${!hasPrev ? 'disabled' : ''}>
          ← Slide Sebelumnya
        </button>
        <div style="font-size:0.88rem; color:var(--text-muted); align-self:center;">
          Slide ${currentSlideIdx + 1} dari ${slidesData.length}
        </div>
        ${nextBtnHtml}
      </div>
    </div>
  `;
  cardContainer.innerHTML = cardHtml;
  renderMathIn(cardContainer);
}

function goToSlide(idx) {
  if (idx < 0 || idx >= slidesData.length) return;
  currentSlideIdx = idx;
  renderProcedureSlides();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (currentMethod === 'aljabar') {
    if (step === 3) {
      return {
        title: '💡 Panduan Sistem Persamaan Aljabar (Baris z)',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Simplex Aljabar (Baris $z$)</h4>
          <p style="margin-bottom:0.75rem;">
            Pada Metode Aljabar, fungsi tujuan <b>Maksimasi $z$</b> ditulis dalam bentuk persamaan homogen baris $z$:
            $$\\mathbf{z - c_1 x_1 - c_2 x_2 - \\dots = 0}$$
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Tahapan Pengisian</h4>
          <ol>
            <li><b>Variabel Basis & Non-Basis Awal:</b>
              <br>• <b>Basis Awal:</b> Variabel Slack ${isBigM ? 'atau Artifisial' : ''} yang membentuk identitas positif ($+1$).
              <br>• <b>Non-Basis Awal (= 0):</b> Variabel keputusan asal ($x_1, x_2, \\dots$).
            </li>
            <li><b>Persamaan Fungsi Tujuan (Baris $z$):</b>
              <br>Isikan konstanta (bernilai <code>0</code> pada Iterasi 0) dan koefisien dari $x_1, x_2, \\dots$ pada persamaan $z$.
            </li>
            <li><b>Persamaan Kendala Basis ($x_{\\text{basis}} = \\text{konstanta} + a_1 x_{nb1} + \\dots$):</b>
              <br>Isolasikan variabel basis di ruas kiri sebagai fungsi dari variabel non-basis di ruas kanan.
            </li>
          </ol>
        `
      };
    }

    if (step === 4) {
      return {
        title: '💡 Panduan Iterasi & Substitusi Simplex Aljabar',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Aturan Iterasi Simplex Aljabar</h4>
          <p style="margin-bottom:0.75rem;">
            Iterasi Aljabar menukarkan variabel non-basis dan variabel basis secara berulang.
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Tahapan Pengerjaan</h4>
          <ol>
            <li><b>Entering Variable (Variabel Masuk):</b>
              <br>Pilih variabel non-basis yang memiliki <b>koefisien paling negatif ($< 0$)</b> pada baris $z$.
            </li>
            <li><b>Leaving Variable (Uji Rasio & Pemblok):</b>
              <br>Bagi Ruas Kanan (RHS) dengan koefisien positif variabel masuk di setiap kendala. Pilih baris dengan <b>rasio positif terkecil</b>.
            </li>
            <li><b>Operasi Baris Substitusi / OBE Aljabar:</b>
              <br>• Bagi baris pivot dengan elemen pivot.
              <br>• Eliminasi variabel masuk dari baris kendala lainnya dan baris $z$.
            </li>
            <li><b>Uji Optimalitas:</b>
              <br>Solusi mencapai <b>OPTIMAL</b> apabila seluruh koefisien variabel non-basis pada baris $z$ sudah <b>$\\ge 0$</b>.
            </li>
          </ol>
        `
      };
    }

    if (step === 5) {
      return {
        title: '💡 Panduan Hasil Akhir Simplex Aljabar',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Konversi Solusi Ke Masalah Asli</h4>
          <p style="margin-bottom:0.75rem;">
            Setelah seluruh koefisien di baris $z$ bernilai $\\ge 0$, solusi optimal dibaca dari konstanta numerik sistem.
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Pembacaan Solusi</h4>
          <ul>
            <li><b>Nilai Variabel Basis ($x_1, x_2, \\dots$):</b> Nilai $= \\text{konstanta persamaan kendala basis}$.</li>
            <li><b>Nilai Variabel Non-Basis:</b> Nilai $= 0$.</li>
            <li><b>Nilai Maksimum Asli $z_{\\text{max}}$:</b> Nilai $= \\text{konstanta pada baris } z$.</li>
          </ul>
        `
      };
    }
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
              <br>Masukkan koefisien $-c_j$ untuk variabel keputusan dan $0$ for variabel slack.
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
          <li><b>Uji Status Tabel:</b>
            <br>• <b>✅ Ya, Optimal:</b> Semua elemen Baris 0 bernilai &le; 0 (tidak ada $z_j - c_j > 0$).
            <br>• <b>🔄 Belum Optimal:</b> Masih ada elemen Baris 0 yang bernilai $> 0$ ($z_j - c_j > 0$), dan kolom pivot tersebut memiliki setidaknya satu elemen kendala bernilai positif ($> 0$).
            <br>• <b>🚫 Solusi Unbounded:</b> Ada elemen Baris 0 yang bernilai $> 0$, namun <b>seluruh elemen kendala pada kolom pivot bernilai &le; 0</b> (pembagian rasio tidak menghasilkan pembagi positif).
          </li>
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
    <!-- METHOD SELECTION TOGGLE -->
    <div class="method-toggle-container">
      <div class="method-toggle-label">
        <span>⚙️</span> Opsi Cara Pengerjaan:
      </div>
      <div class="method-toggle-buttons">
        <button class="method-toggle-btn ${currentMethod === 'tableau' ? 'active' : ''}" id="btnMethodTableau" onclick="setMethodMode('tableau')">
          <span>📊</span> Metode Simplex Tableau
        </button>
        <button class="method-toggle-btn ${currentMethod === 'aljabar' ? 'active' : ''}" id="btnMethodAljabar" onclick="setMethodMode('aljabar')">
          <span>🧮</span> Metode Simplex Aljabar
        </button>
      </div>
    </div>

    <div class="card" id="setupCard">
      <div class="card-title">
        <span>⚙️ Pengaturan Soal</span>
        <button class="btn-help" onclick="openHelpDrawer(0)">❓ Bagaimana caranya?</button>
      </div>

      <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; background:#f1f5f9; padding:0.35rem; border-radius:var(--radius);">
        <button class="btn" id="tabAutoMode" style="flex:1; border:none; padding:0.5rem; border-radius:var(--radius); font-weight:bold; cursor:pointer; background:#fff; color:var(--accent); box-shadow:0 2px 4px rgba(0,0,0,0.05);">
          🎲 Generate Acak (Otomatis)
        </button>
        <button class="btn" id="tabCustomMode" style="flex:1; border:none; padding:0.5rem; border-radius:var(--radius); font-weight:bold; cursor:pointer; background:transparent; color:var(--text-secondary);">
          ✍️ Input Soal Custom (Manual)
        </button>
      </div>

      <div id="secAutoMode">
        <div class="setup-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:1rem;">
          <div class="setup-option">
            <label style="display:block; margin-bottom:0.4rem; font-weight:bold;">n (Variabel Keputusan)</label>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="number" id="nMin" value="2" min="1" max="10" style="width:75px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
              <span style="color:var(--text-muted); font-weight:bold;">–</span>
              <input type="number" id="nMax" value="2" min="1" max="10" style="width:75px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
            </div>
          </div>
          <div class="setup-option">
            <label style="display:block; margin-bottom:0.4rem; font-weight:bold;">m (Jumlah Kendala)</label>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="number" id="mMin" value="2" min="1" max="10" style="width:75px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
              <span style="color:var(--text-muted); font-weight:bold;">–</span>
              <input type="number" id="mMax" value="2" min="1" max="10" style="width:75px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin:0.5rem 0 1rem 0;">
          <input type="checkbox" id="chkBigM" style="width:18px; height:18px; cursor:pointer;">
          <label for="chkBigM" style="cursor:pointer; font-size:0.95rem; user-select:none; color:var(--text-primary);">
            Sertakan kemungkinan soal Big-M (&le;, &ge;, =)
          </label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btnGenerate">Generate Soal →</button>
        </div>
      </div>

      <div id="secCustomMode" style="display:none;">
        <div class="setup-grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); margin-bottom:1rem;">
          <div class="setup-option">
            <label style="display:block; margin-bottom:0.4rem; font-weight:bold;">Tipe Optimisasi</label>
            <select id="customType">
              <option value="max" selected>Maksimum (Max)</option>
              <option value="min">Minimum (Min)</option>
            </select>
          </div>
          <div class="setup-option">
            <label style="display:block; margin-bottom:0.4rem; font-weight:bold;">n (Variabel Keputusan)</label>
            <input type="number" id="customN" value="2" min="1" max="10" style="width:85px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
          </div>
          <div class="setup-option">
            <label style="display:block; margin-bottom:0.4rem; font-weight:bold;">m (Jumlah Kendala)</label>
            <input type="number" id="customM" value="2" min="1" max="10" style="width:85px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
          </div>
        </div>

        <div style="background:#f8fafc; padding:1.2rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1rem;">
          <div style="font-weight:bold; margin-bottom:0.75rem; color:var(--accent);">🎯 Fungsi Objektif (z)</div>
          <div id="customObjRow" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.25rem;"></div>

          <div style="font-weight:bold; margin-bottom:0.75rem; color:var(--accent);">🚧 Fungsi Kendala</div>
          <div id="customConstraintsRows" style="display:flex; flex-direction:column; gap:0.75rem;"></div>
        </div>

        <div id="customFeedback" class="feedback"></div>

        <div class="btn-row">
          <button class="btn btn-primary" id="btnSubmitCustom">🔒 Gunakan Soal Custom →</button>
        </div>
      </div>
    </div>`;
  const container = appendBlock(html);
  
  // Tab Switcher logic
  $('tabAutoMode').onclick = () => {
    $('tabAutoMode').style.background = '#fff';
    $('tabAutoMode').style.color = 'var(--accent)';
    $('tabAutoMode').style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    $('tabCustomMode').style.background = 'transparent';
    $('tabCustomMode').style.color = 'var(--text-secondary)';
    $('tabCustomMode').style.boxShadow = 'none';
    $('secAutoMode').style.display = 'block';
    $('secCustomMode').style.display = 'none';
  };

  $('tabCustomMode').onclick = () => {
    $('tabCustomMode').style.background = '#fff';
    $('tabCustomMode').style.color = 'var(--accent)';
    $('tabCustomMode').style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    $('tabAutoMode').style.background = 'transparent';
    $('tabAutoMode').style.color = 'var(--text-secondary)';
    $('tabAutoMode').style.boxShadow = 'none';
    $('secAutoMode').style.display = 'none';
    $('secCustomMode').style.display = 'block';
    renderCustomFormFields();
  };

  function renderCustomFormFields() {
    const n = Math.max(1, parseInt($('customN').value) || 2);
    const m = Math.max(1, parseInt($('customM').value) || 2);

    // Render Obj Row
    let objHtml = `<span style="font-weight:bold; margin-right:0.25rem;">z =</span>`;
    for (let j = 0; j < n; j++) {
      const defVal = j === 0 ? 3 : (j === 1 ? 5 : 2);
      objHtml += `<input type="number" step="any" class="custom-input" id="cObj_${j}" value="${defVal}" style="width:65px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color);">`;
      objHtml += `<span style="margin-right:0.2rem;">${texInline(`x_{${j + 1}}`)}</span>`;
      if (j < n - 1) objHtml += `<span style="margin-right:0.25rem;">+</span>`;
    }
    $('customObjRow').innerHTML = objHtml;

    // Render Constraints Rows
    let consHtml = '';
    for (let i = 0; i < m; i++) {
      consHtml += `<div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; background:#fff; padding:0.6rem 0.8rem; border-radius:var(--radius); border:1px solid #e2e8f0;">`;
      consHtml += `<span style="font-weight:bold; min-width:80px; font-size:0.85rem; color:var(--text-secondary);">Kendala ${i + 1}:</span>`;
      for (let j = 0; j < n; j++) {
        const defCoeff = i === 0 ? (j === 0 ? 2 : 1) : (i === 1 ? (j === 0 ? 1 : 2) : (j === 0 ? 1 : 1));
        consHtml += `<input type="number" step="any" class="custom-input" id="cA_${i}_${j}" value="${defCoeff}" style="width:60px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color);">`;
        consHtml += `<span style="margin-right:0.2rem;">${texInline(`x_{${j + 1}}`)}</span>`;
        if (j < n - 1) consHtml += `<span style="margin-right:0.25rem;">+</span>`;
      }
      consHtml += `<select id="cOp_${i}" style="padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
        <option value="<=" selected>&le;</option>
        <option value=">=">&ge;</option>
        <option value="=">=</option>
      </select>`;
      const defB = i === 0 ? 8 : (i === 1 ? 10 : 12);
      consHtml += `<input type="number" step="any" class="custom-input" id="cB_${i}" value="${defB}" style="width:65px; text-align:center; padding:0.4rem; border-radius:var(--radius); border:1px solid var(--border-color);">`;
      consHtml += `</div>`;
    }
    $('customConstraintsRows').innerHTML = consHtml;
  }

  $('customN').oninput = renderCustomFormFields;
  $('customM').oninput = renderCustomFormFields;
  $('customN').onchange = renderCustomFormFields;
  $('customM').onchange = renderCustomFormFields;

  $('chkBigM').onchange = () => {
    const isBigM = $('chkBigM').checked;
    $('setupDesc').innerHTML = isBigM
      ? 'Soal akan di-generate secara acak dengan koefisien bilangan bulat kecil.<br>Kendala berpotensi memiliki pertidaksamaan ≤, ≥, maupun persamaan = (Metode Big-M).'
      : 'Soal akan di-generate secara acak dengan koefisien bilangan bulat kecil.<br>Semua kendala bertipe ≤ dengan ruas kanan positif (tanpa Big-M).';
  };

  $('btnGenerate').onclick = () => {
    let nMin = parseInt($('nMin').value) || 2;
    let nMax = parseInt($('nMax').value) || 2;
    let mMin = parseInt($('mMin').value) || 2;
    let mMax = parseInt($('mMax').value) || 2;

    if (nMin > nMax) [nMin, nMax] = [nMax, nMin];
    if (mMin > mMax) [mMin, mMax] = [mMax, mMin];

    nMin = Math.max(1, Math.min(10, nMin));
    nMax = Math.max(1, Math.min(10, nMax));
    mMin = Math.max(1, Math.min(10, mMin));
    mMax = Math.max(1, Math.min(10, mMax));

    const n = randInt(nMin, nMax);
    const m = randInt(mMin, mMax);
    const type = randChoice(['max', 'min']);
    const useBigM = $('chkBigM').checked;
    prob = generateProblem(n, m, type, useBigM);
    disableContainer(container);
    renderStep1();
  };

  $('btnSubmitCustom').onclick = () => {
    const fb = $('customFeedback');
    const type = $('customType').value;
    const n = parseInt($('customN').value);
    const m = parseInt($('customM').value);

    const objOrig = [];
    for (let j = 0; j < n; j++) {
      const val = parseFloat($(`cObj_${j}`).value);
      if (isNaN(val)) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Nilai koefisien c_${j+1} pada Fungsi Objektif tidak valid.`;
        return;
      }
      objOrig.push(val);
    }

    const Aorig = [], borig = [], ops = [];
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        const val = parseFloat($(`cA_${i}_${j}`).value);
        if (isNaN(val)) {
          fb.className = 'feedback show error';
          fb.textContent = `❌ Nilai koefisien a_{${i+1},${j+1}} pada Kendala ${i+1} tidak valid.`;
          return;
        }
        row.push(val);
      }
      if (row.every(v => v === 0)) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Kendala ${i+1} tidak boleh memiliki semua koefisien bernilai 0.`;
        return;
      }
      Aorig.push(row);

      const bVal = parseFloat($(`cB_${i}`).value);
      if (isNaN(bVal)) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Nilai Ruas Kanan (b) pada Kendala ${i+1} tidak valid.`;
        return;
      }
      borig.push(bVal);
      ops.push($(`cOp_${i}`).value);
    }

    prob = createCustomProblem(type, n, m, objOrig, Aorig, borig, ops);
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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip2">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(2)">❓ Bagaimana caranya?</button>
      </div>
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

  $(`btnSkip2`).onclick = () => {
    step2UserVars = [];
    for (let k = 0; k < p.nExtra; k++) {
      step2UserVars.push({ row: p.extraVarsInfo[k].row });
    }
    updateStep2DynamicUI(p);

    for (let j = 0; j < p.stdObj.length; j++) {
      const el = $(`objC${j}`);
      if (el) el.value = p.stdObj[j].toString();
    }

    for (let i = 0; i < p.m; i++) {
      for (let j = 0; j < p.stdObj.length; j++) {
        const el = $(`conA_${i}_${j}`);
        if (el) el.value = p.A[i][j].toString();
      }
      const elB = $(`conB_${i}`);
      if (elB) elB.value = p.b[i].toString();
    }

    $('btnCheck2').click();
  };

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

// ===================== SIMPLEX ALJABAR HELPERS & RENDERERS =====================
function formatAlgebraicEq(tab, rowIdx) {
  const numCols = tab.rows[rowIdx].length;
  const bVal = tab.rows[rowIdx][numCols - 1];
  const basisVarIdx = tab.basis[rowIdx - 1];
  const basisVarName = formatSubscriptVar(basisVarIdx);

  const basisSet = new Set(tab.basis);
  let terms = [bVal.toString()];

  for (let j = 1; j < numCols - 1; j++) {
    const varIdx = j - 1;
    if (!basisSet.has(varIdx)) {
      const coeff = tab.rows[rowIdx][j];
      if (!coeff.isZero()) {
        const negCoeff = coeff.neg();
        const varName = formatSubscriptVar(varIdx);
        let coeffStr = negCoeff.toString();
        if (coeffStr === '1') terms.push(`+ ${varName}`);
        else if (coeffStr === '-1') terms.push(`- ${varName}`);
        else if (negCoeff.isPos()) terms.push(`+ ${coeffStr}${varName}`);
        else terms.push(`${coeffStr}${varName}`);
      }
    }
  }

  let eqStr = terms.join(' ');
  eqStr = eqStr.replace(/\+\s\-/g, '- ');
  return `${basisVarName} = ${eqStr}`;
}

function formatAlgebraicObjective(tab) {
  const numCols = tab.rows[0].length;
  const rhsVal = tab.rows[0][numCols - 1];
  const basisSet = new Set(tab.basis);
  let terms = ['z'];

  for (let j = 1; j < numCols - 1; j++) {
    const varIdx = j - 1;
    if (!basisSet.has(varIdx)) {
      const coeff = tab.rows[0][j];
      if (!coeff.isZero()) {
        const varName = formatSubscriptVar(varIdx);
        let coeffStr = coeff.toString();
        if (coeffStr === '1') terms.push(`+ ${varName}`);
        else if (coeffStr === '-1') terms.push(`- ${varName}`);
        else if (coeff.isPos()) terms.push(`+ ${coeffStr}${varName}`);
        else terms.push(`${coeffStr}${varName}`);
      }
    }
  }

  let eqStr = terms.join(' ');
  eqStr = eqStr.replace(/\+\s\-/g, '- ');
  return `${eqStr} = ${rhsVal.toString()}`;
}

function renderAlgebraicSystemCard(tab, title = 'Sistem Persamaan Aljabar:') {
  const cleanTitle = title.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  const objEq = formatAlgebraicObjective(tab);
  const eqLines = [];
  for (let i = 1; i < tab.rows.length; i++) {
    eqLines.push(formatAlgebraicEq(tab, i));
  }

  return `
    <div style="margin-bottom:1.25rem;">
      ${cleanTitle ? `<div style="font-weight:bold; margin-bottom:0.6rem; font-size:1rem;">${cleanTitle}:</div>` : ''}
      <div style="font-size:1.05rem; margin-bottom:0.5rem; font-weight:bold;">
        ${texInline(objEq)}
      </div>
      <div style="margin:0.5rem 0 0.3rem 0; color:var(--text-secondary);">dengan kendala:</div>
      <div style="margin-bottom:0.5rem;">
        ${eqLines.map(eq => `<div style="font-size:1.05rem; margin-bottom:0.35rem;">${texInline(eq)}</div>`).join('')}
      </div>
    </div>
  `;
}

function renderStep3AljabarPart1() {
  setStep(3);
  const p = prob;
  const tab = p.tabEliminated;
  const numCols = tab.rows[0].length;
  const nTotal = numCols - 2;

  const basisSet = new Set(tab.basis);
  const targetBasis = [];
  const targetNonBasis = [];

  for (let j = 0; j < nTotal; j++) {
    if (basisSet.has(j)) targetBasis.push(j);
    else targetNonBasis.push(j);
  }

  let basisCheckboxes = '';
  let nonBasisCheckboxes = '';

  for (let j = 0; j < nTotal; j++) {
    const varName = formatSubscriptVar(j);
    basisCheckboxes += `
      <label style="display:inline-flex; align-items:center; gap:0.4rem; background:var(--card-bg); padding:0.4rem 0.8rem; border-radius:var(--radius); border:1px solid var(--border-color); cursor:pointer;">
        <input type="checkbox" class="chk-basis-var" value="${j}">
        <span>${texInline(varName)}</span>
      </label>
    `;
    nonBasisCheckboxes += `
      <label style="display:inline-flex; align-items:center; gap:0.4rem; background:var(--card-bg); padding:0.4rem 0.8rem; border-radius:var(--radius); border:1px solid var(--border-color); cursor:pointer;">
        <input type="checkbox" class="chk-nonbasis-var" value="${j}">
        <span>${texInline(varName)}</span>
      </label>
    `;
  }

  const html = `<div class="card" id="step3aAljabarCard">
    <div class="card-title">
      <span>📌 Tentukan Variabel Basis & Non-Basis Awal</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabar3a">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    <div style="margin-bottom:1rem; color:var(--text-secondary); font-size:0.88rem; line-height:1.6;">
      Pada sistem linear baku awal, pilih variabel mana yang bertindak sebagai <b>Variabel Basis</b> (memiliki kolom matriks identitas) dan <b>Variabel Non-Basis</b> (diset bernilai 0):
    </div>

    <div style="margin-bottom:1.25rem;">
      <div style="font-weight:bold; color:var(--text-primary); margin-bottom:0.5rem;">Pilih Variabel Basis Awal:</div>
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-bottom:1.25rem;">
        ${basisCheckboxes}
      </div>

      <div style="font-weight:bold; color:var(--text-primary); margin-bottom:0.5rem;">Pilih Variabel Non-Basis Awal (= 0):</div>
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
        ${nonBasisCheckboxes}
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheckAljabar3a">Periksa Variabel Basis & Non-Basis</button>
    </div>
    <div id="feedbackAljabar3a" class="feedback"></div>
  </div>`;

  const container = appendBlock(html);

  if ($('btnSkipAljabar3a')) {
    $('btnSkipAljabar3a').onclick = () => {
      container.querySelectorAll('.chk-basis-var').forEach(chk => {
        chk.checked = targetBasis.includes(parseInt(chk.value));
      });
      container.querySelectorAll('.chk-nonbasis-var').forEach(chk => {
        chk.checked = targetNonBasis.includes(parseInt(chk.value));
      });
      $('btnCheckAljabar3a').click();
    };
  }

  $('btnCheckAljabar3a').onclick = () => {
    const selectedBasis = Array.from(container.querySelectorAll('.chk-basis-var:checked')).map(el => parseInt(el.value));
    const selectedNonBasis = Array.from(container.querySelectorAll('.chk-nonbasis-var:checked')).map(el => parseInt(el.value));
    const fb = $('feedbackAljabar3a');

    const basisMatch = selectedBasis.length === targetBasis.length && selectedBasis.every(v => targetBasis.includes(v));
    const nonBasisMatch = selectedNonBasis.length === targetNonBasis.length && selectedNonBasis.every(v => targetNonBasis.includes(v));

    if (basisMatch && nonBasisMatch) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Variabel basis & non-basis awal sudah ditentukan dengan tepat. Lanjut susun persamaan aljabar.';
      disableContainer(container);
      setTimeout(renderStep3AljabarPart2, 600);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Pilihan variabel belum tepat. Pastikan variabel basis sesuai dengan slack/artifisial basis awal dan variabel non-basis adalah variabel keputusan asal.';
    }
  };
}

function renderStep3AljabarPart2() {
  const p = prob;
  const tab = p.tabEliminated;
  const numCols = tab.rows[0].length;
  const nTotal = numCols - 2;

  const basisSet = new Set(tab.basis);
  const nonBasisVars = [];
  for (let j = 0; j < nTotal; j++) {
    if (!basisSet.has(j)) nonBasisVars.push(j);
  }

  // Objective Function Input Line (Persamaan Baris z: z + c1 x1 + c2 x2 = RHS)
  let objInputHtml = `
    <div class="std-form-line" style="margin-bottom:0.8rem; font-size:1.05rem;">
      <span style="font-weight:bold; margin-right:0.15rem;">z</span>
  `;
  nonBasisVars.forEach(nbIdx => {
    const nbVarName = formatSubscriptVar(nbIdx);
    objInputHtml += `
      <span>+</span>
      <input type="text" id="aljObjCoeff_${nbIdx}" style="width:50px; text-align:center;">
      <span>${texInline(nbVarName)}</span>
    `;
  });
  objInputHtml += `
      <span>=</span>
      <input type="text" id="aljObjConst" style="width:50px; text-align:center;">
    </div>
  `;

  // Constraint Equations Input Lines
  let eqInputsHtml = '';
  for (let i = 1; i < tab.rows.length; i++) {
    const basisVarIdx = tab.basis[i - 1];
    const basisVarName = formatSubscriptVar(basisVarIdx);

    let rowInputs = `
      <div class="std-form-line" style="margin-bottom:0.6rem; font-size:1.05rem;">
        <span style="font-weight:bold; margin-right:0.15rem;">${texInline(basisVarName)} =</span>
        <input type="text" id="aljConst_${i}" style="width:50px; text-align:center;">
    `;

    nonBasisVars.forEach(nbIdx => {
      const nbVarName = formatSubscriptVar(nbIdx);
      rowInputs += `
        <span>+</span>
        <input type="text" id="aljCoeff_${i}_${nbIdx}" style="width:50px; text-align:center;">
        <span>${texInline(nbVarName)}</span>
      `;
    });

    rowInputs += `</div>`;
    eqInputsHtml += rowInputs;
  }

  const allVarNames = [];
  for (let j = 0; j < nTotal; j++) allVarNames.push(formatSubscriptVar(j));
  const nonNegTex = texInline(`${allVarNames.join(', ')} \\geq 0`);

  const html = `<div class="card" id="step3bAljabarCard">
    <div class="card-title">
      <span>✍️ Input Sistem Persamaan Kendala Aljabar</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabar3b">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="font-weight:bold; margin-bottom:0.75rem; font-size:1rem;">Bentuk Aljabar Persamaan Baris z & Kendala:</div>

    ${objInputHtml}

    <div style="margin:0.75rem 0 0.5rem 0; color:var(--text-secondary);">dengan kendala:</div>

    ${eqInputsHtml}

    <div class="btn-row" style="margin-top:1.5rem;">
      <button class="btn btn-primary" id="btnCheckAljabar3b">Periksa Persamaan Aljabar</button>
    </div>
    <div id="feedbackAljabar3b" class="feedback"></div>
  </div>`;

  const container = appendBlock(html);

  if ($('btnSkipAljabar3b')) {
    $('btnSkipAljabar3b').onclick = () => {
      // Auto-fill Objective inputs
      const expectedObjConst = tab.rows[0][numCols - 1];
      if ($('aljObjConst')) $('aljObjConst').value = expectedObjConst.isZero() ? '0' : expectedObjConst.toString();
      nonBasisVars.forEach(nbIdx => {
        const expectedCoeff = tab.rows[0][nbIdx + 1];
        if ($(`aljObjCoeff_${nbIdx}`)) $(`aljObjCoeff_${nbIdx}`).value = expectedCoeff.toString();
      });

      // Auto-fill Constraint inputs
      for (let i = 1; i < tab.rows.length; i++) {
        const bVal = tab.rows[i][numCols - 1];
        if ($(`aljConst_${i}`)) $(`aljConst_${i}`).value = bVal.toString();

        nonBasisVars.forEach(nbIdx => {
          const coeff = tab.rows[i][nbIdx + 1];
          const negCoeff = coeff.neg();
          if ($(`aljCoeff_${i}_${nbIdx}`)) $(`aljCoeff_${i}_${nbIdx}`).value = negCoeff.toString();
        });
      }
      $('btnCheckAljabar3b').click();
    };
  }

  $('btnCheckAljabar3b').onclick = () => {
    let allOk = true;
    const fb = $('feedbackAljabar3b');

    // 1. Check Objective inputs
    const objConstInp = $('aljObjConst');
    const expectedObjConst = tab.rows[0][numCols - 1];
    try {
      const userValStr = objConstInp.value.trim() === '' ? '0' : objConstInp.value.trim();
      const userObjConst = FracM.from(userValStr);
      if (!userObjConst.eq(expectedObjConst)) {
        allOk = false;
        objConstInp.classList.add('wrong');
      } else {
        objConstInp.classList.remove('wrong');
        objConstInp.classList.add('correct');
      }
    } catch (e) {
      allOk = false;
      objConstInp.classList.add('wrong');
    }

    nonBasisVars.forEach(nbIdx => {
      const objCoeffInp = $(`aljObjCoeff_${nbIdx}`);
      const expectedCoeff = tab.rows[0][nbIdx + 1];
      try {
        const userObjCoeff = FracM.from(objCoeffInp.value.trim());
        if (!userObjCoeff.eq(expectedCoeff)) {
          allOk = false;
          objCoeffInp.classList.add('wrong');
        } else {
          objCoeffInp.classList.remove('wrong');
          objCoeffInp.classList.add('correct');
        }
      } catch (e) {
        allOk = false;
        objCoeffInp.classList.add('wrong');
      }
    });

    // 2. Check Constraint inputs
    for (let i = 1; i < tab.rows.length; i++) {
      const constInp = $(`aljConst_${i}`);
      const expectedConst = tab.rows[i][numCols - 1];

      try {
        const userConst = FracM.from(constInp.value.trim());
        if (!userConst.eq(expectedConst)) {
          allOk = false;
          constInp.classList.add('wrong');
        } else {
          constInp.classList.remove('wrong');
          constInp.classList.add('correct');
        }
      } catch (e) {
        allOk = false;
        constInp.classList.add('wrong');
      }

      nonBasisVars.forEach(nbIdx => {
        const coeffInp = $(`aljCoeff_${i}_${nbIdx}`);
        const expectedCoeff = tab.rows[i][nbIdx + 1].neg();

        try {
          const userCoeff = FracM.from(coeffInp.value.trim());
          if (!userCoeff.eq(expectedCoeff)) {
            allOk = false;
            coeffInp.classList.add('wrong');
          } else {
            coeffInp.classList.remove('wrong');
            coeffInp.classList.add('correct');
          }
        } catch (e) {
          allOk = false;
          coeffInp.classList.add('wrong');
        }
      });
    }

    if (allOk) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Persamaan fungsi objektif dan kendala aljabar awal berhasil disusun dengan tepat.';
      disableContainer(container);
      currentIterIdx = 0;
      setTimeout(renderIterCheckOptimal, 600);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Masih ada isian koefisien/konstanta yang belum tepat. Periksa kembali koefisien fungsi objektif dan persamaan kendala aljabar.';
    }
  };
}

function renderStep3Aljabar() {
  renderStep3AljabarPart1();
}

function renderStep3() {
  if (currentMethod === 'aljabar') {
    renderStep3Aljabar();
    return;
  }
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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip3">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
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

  $(`btnSkip3`).onclick = () => {
    step3Rows = [];
    for (let i = 0; i < p.m; i++) {
      step3Rows.push({ basis: p.initialBasis[i] });
    }
    updateStep3TableUI(p);

    const numCols = p.nOrig + p.nExtra + 2;

    // Fill Row 0 inputs
    for (let j = 0; j < numCols; j++) {
      const inp = $(`t0_${j}`);
      if (inp) inp.value = p.tabRaw.rows[0][j].toString();
    }

    // Fill constraint rows & basis dropdowns
    for (let i = 1; i <= p.m; i++) {
      const sel = $(`step3Basis_${i - 1}`);
      if (sel) sel.value = p.initialBasis[i - 1];
      for (let j = 0; j < numCols; j++) {
        const inp = $(`t${i}_${j}`);
        if (inp) inp.value = p.tabRaw.rows[i][j].toString();
      }
    }

    $('btnCheck3').click();
  };

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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip3b">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    <div class="tableau-wrapper">${table}</div>
    <div id="feedback3b" class="feedback"></div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheck3b">Periksa Eliminasi Baris 0 ✓</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  $(`btnSkip3b`).onclick = () => {
    const expectedRow0 = p.tabEliminated.rows[0];
    for (let j = 0; j < numCols; j++) {
      const inp = $(`t3b0_${j}`);
      if (inp) inp.value = expectedRow0[j].toString();
    }
    $('btnCheck3b').click();
  };

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

function renderIterAljabarCheckOptimal() {
  setStep(4);
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;

  const html = `<div class="card">
    <div class="card-title">
      <span>Iterasi Aljabar ${currentIterIdx + 1}</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabar4a_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    ${renderAlgebraicSystemCard(tab, `Sistem Persamaan Iterasi ${currentIterIdx + 1}`)}
    <div style="margin-top:0.75rem; font-weight:bold;">Apa status sistem persamaan aljabar ini?</div>
    <div class="optimal-check">
      <button class="optimal-btn yes" id="btnOptYesAljabar_${currentIterIdx}">✅ Ya, Optimal Layak</button>
      <button class="optimal-btn no" id="btnOptNoAljabar_${currentIterIdx}">🔄 Belum Optimal</button>
      <button class="optimal-btn infeasible" id="btnOptInfeasibleAljabar_${currentIterIdx}">❌ Tidak Feasible</button>
      <button class="optimal-btn unbounded" id="btnOptUnboundedAljabar_${currentIterIdx}">🚫 Solusi Unbounded</button>
    </div>
    <div id="feedbackAljabar4a_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  $(`btnSkipAljabar4a_${currentIterIdx}`).onclick = () => {
    if (iter.infeasible) $(`btnOptInfeasibleAljabar_${currentIterIdx}`).click();
    else if (iter.optimal) $(`btnOptYesAljabar_${currentIterIdx}`).click();
    else if (iter.unbounded) $(`btnOptUnboundedAljabar_${currentIterIdx}`).click();
    else $(`btnOptNoAljabar_${currentIterIdx}`).click();
  };

  $(`btnOptYesAljabar_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedbackAljabar4a_${currentIterIdx}`);
    if (iter.optimal && !iter.infeasible) {
      fb.className = 'feedback show success';
      if (iter.multipleOptimal) {
        fb.innerHTML = renderKatexInHTML('✅ Benar! Seluruh variabel non-basis memiliki koefisien $\\le 0$ pada fungsi $z$ (terdapat koefisien $0$ $\\implies$ Ada Banyak Solusi Optimal).');
      } else {
        fb.innerHTML = renderKatexInHTML('✅ Benar! Sistem sudah optimal (semua variabel non-basis di fungsi $z$ memiliki koefisien $\\le 0$).');
      }
      disableContainer(container);
      setTimeout(renderStep5, 600);
    } else if (iter.infeasible) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Sistem ini tidak feasible! Walaupun fungsi $z$ tidak memiliki koefisien positif, variabel artifisial $x_a > 0$ masih tersisa di basis.');
    } else if (iter.unbounded) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masih ada variabel non-basis dengan koefisien $>0$ pada fungsi $z$, dan persamaan kendala tidak membatasi nilainya (Solusi Unbounded).');
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Belum optimal! Masih ada variabel non-basis dengan koefisien positif pada fungsi $z$.');
    }
  };

  $(`btnOptNoAljabar_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedbackAljabar4a_${currentIterIdx}`);
    if (!iter.optimal && !iter.unbounded && !iter.infeasible) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Masih ada variabel non-basis dengan koefisien $>0$ pada $z$. Lanjut memilih variabel masuk.');
      disableContainer(container);
      setTimeout(renderIterPickEnter, 600);
    } else if (iter.infeasible) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Kondisi penghentian tercapai namun variabel artifisial $x_a > 0$ tersisa di basis (Infeasible).');
    } else if (iter.optimal) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Sistem ini sebenarnya sudah optimal. Tidak ada variabel non-basis yang berkoefisien positif pada $z$!');
    } else if (iter.unbounded) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Seluruh persamaan kendala bernilai non-negatif tanpa membatasi variabel masuk (Solusi Unbounded).');
    }
  };

  $(`btnOptInfeasibleAljabar_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedbackAljabar4a_${currentIterIdx}`);
    if (iter.infeasible) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Variabel artifisial $x_a > 0$ masih tersisa di basis. Masalah asli $\\mathcal{P}$ bersifat Tidak Feasible.');
      disableContainer(container);
      setTimeout(renderInfeasibleConclusionCard, 800);
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Infeasible.');
    }
  };

  $(`btnOptUnboundedAljabar_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedbackAljabar4a_${currentIterIdx}`);
    if (iter.unbounded) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Masalah ini bersifat Tidak Terbatas (Unbounded).');
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    } else if (iter.optimal) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Unbounded. Sistem ini sudah optimal!');
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Unbounded. Persamaan kendala masih memberikan batasan rasio.');
    }
  };
}

function renderIterCheckOptimal() {
  if (currentMethod === 'aljabar') {
    renderIterAljabarCheckOptimal();
    return;
  }
  setStep(4);
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;

  const html = `<div class="card">
    <div class="card-title">
      <span>📝 Iterasi ${currentIterIdx + 1}</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip4a_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    <div class="tableau-wrapper">${renderReadonlyTableau(tab)}</div>
    <div style="margin-top:1rem; font-weight:bold;">❓ Apa status tabel ini?</div>
    <div class="optimal-check">
      <button class="optimal-btn yes" id="btnOptYes_${currentIterIdx}">✅ Ya, Optimal Layak</button>
      <button class="optimal-btn no" id="btnOptNo_${currentIterIdx}">🔄 Belum Optimal</button>
      <button class="optimal-btn infeasible" id="btnOptInfeasible_${currentIterIdx}">❌ Tidak Feasible</button>
      <button class="optimal-btn unbounded" id="btnOptUnbounded_${currentIterIdx}">🚫 Solusi Unbounded</button>
    </div>
    <div id="feedback4a_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  $(`btnSkip4a_${currentIterIdx}`).onclick = () => {
    if (iter.infeasible) $(`btnOptInfeasible_${currentIterIdx}`).click();
    else if (iter.optimal) $(`btnOptYes_${currentIterIdx}`).click();
    else if (iter.unbounded) $(`btnOptUnbounded_${currentIterIdx}`).click();
    else $(`btnOptNo_${currentIterIdx}`).click();
  };

  $(`btnOptYes_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (iter.optimal && !iter.infeasible) {
      fb.className = 'feedback show success';
      if (iter.multipleOptimal) {
        fb.innerHTML = renderKatexInHTML('✅ Benar! Tabel sudah optimal dan layak (terdapat variabel non-basis dengan koefisien 0 di Baris 0 $\\implies$ Ada Banyak Solusi Optimal).');
      } else {
        fb.innerHTML = renderKatexInHTML('✅ Benar! Tabel sudah optimal (semua $z_k - c_k \\le 0$).');
      }
      disableContainer(container);
      setTimeout(renderStep5, 600);
    } else if (iter.infeasible) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Tabel ini tidak feasible! Walaupun Baris 0 tidak memiliki elemen $>0$, variabel artifisial $x_a > 0$ masih berada di basis.');
    } else if (iter.unbounded) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masih ada $z_k - c_k > 0$ pada Baris 0, dan kolom tersebut tidak memiliki elemen kendala positif (Solusi Unbounded).');
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Belum optimal! Masih ada elemen $z_k - c_k > 0$ di Baris 0.');
    }
  };

  $(`btnOptNo_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (!iter.optimal && !iter.unbounded && !iter.infeasible) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Masih ada $z_k - c_k > 0$ dan iterasi dapat dilanjutkan. Lanjut memilih kolom pivot.');
      disableContainer(container);
      setTimeout(renderIterPickEnter, 600);
    } else if (iter.infeasible) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Tabel ini telah mencapai kondisi akhir untuk Big-M, namun variabel artifisial $x_a > 0$ tersisa di basis. Masalah tidak memiliki solusi layak (Infeasible).');
    } else if (iter.optimal) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Tabel ini sebenarnya sudah optimal. Tidak ada $z_k - c_k > 0$ pada Baris 0!');
    } else if (iter.unbounded) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masih ada $z_k - c_k > 0$, namun seluruh elemen kendala pada kolom pivot bernilai $\\le 0$. Tabel ini bersifat Solusi Unbounded.');
    }
  };

  $(`btnOptInfeasible_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (iter.infeasible) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Tabel optimal Big-M tercapai tetapi variabel artifisial $x_a > 0$ masih tersisa di basis. Masalah asli $\\mathcal{P}$ bersifat Tidak Feasible.');
      disableContainer(container);
      setTimeout(renderInfeasibleConclusionCard, 800);
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Infeasible. Seluruh variabel artifisial bernilai 0 atau tidak ada di basis.');
    }
  };

  $(`btnOptUnbounded_${currentIterIdx}`).onclick = () => {
    const fb = $(`feedback4a_${currentIterIdx}`);
    if (iter.unbounded) {
      fb.className = 'feedback show success';
      fb.innerHTML = renderKatexInHTML('✅ Benar! Ada $z_k - c_k > 0$ pada Baris 0, namun seluruh elemen kendala pada kolom pivot bernilai $\\le 0$. Masalah ini bersifat Tidak Terbatas (Unbounded).');
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    } else if (iter.optimal) {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Unbounded. Tabel ini sudah optimal!');
    } else {
      fb.className = 'feedback show error';
      fb.innerHTML = renderKatexInHTML('❌ Masalah ini tidak Unbounded. Masih ada elemen kendala bernilai positif ($> 0$) pada kolom pivot sehingga iterasi dapat dilanjutkan.');
    }
  };
}

function renderInfeasibleConclusionCard() {
  setStep(5);
  const p = prob;
  const lastIter = p.iterations[p.iterations.length - 1];
  const artificials = lastIter.artificials || [];

  let artInfoHtml = '';
  if (artificials.length > 0) {
    artInfoHtml = artificials.map(a => `• Variabel Artifisial <b>x_{${a.varIdx + 1}}</b> = <b>${a.rk.toString()}</b> (> 0)`).join('<br>');
  } else {
    artInfoHtml = '• Setidaknya satu variabel artifisial bernilai positif di basis.';
  }

  const html = `<div class="card" style="border-color:var(--error);">
    <div class="card-title">
      <span style="color:var(--error);">❌ Tidak Ada Solusi Layak (Infeasible Solution)</span>
      <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
    </div>
    <div style="margin-bottom:1rem;line-height:1.6;">
      <p style="margin-bottom:0.75rem;">
        Tabel Simplex telah memenuhi kriteria penghentian (seluruh koefisien di Baris 0 bernilai &le; 0), 
        <b>tetapi variabel artifisial ($x_a$) masih tersisa di basis dengan nilai positif ($RK > 0$)</b>:
      </p>
      <div style="background:var(--card-bg); padding:0.75rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); font-size:0.9rem; margin-bottom:1rem;">
        ${artInfoHtml}
      </div>
      <div style="background:var(--error-bg);color:var(--text-primary);padding:1rem;border-radius:var(--radius);margin-bottom:1rem;border-left:4px solid var(--error);">
        <b>📌 Kesimpulan Aljabar & Geometris:</b><br>
        Variabel artifisial adalah variabel tiruan yang ditambahkan agar basis awal terbentuk. Karena nilainya tidak berhasil dihilangkan ($x_a \\neq 0$), maka <b>daerah kelayakan (feasible region) dari masalah asli $\\mathcal{P}$ adalah KOSONG</b> (sistem kendala saling bertentangan).
      </div>
      <p style="font-weight:bold;color:var(--error);">
        ❌ Tidak ada titik $(x_1, x_2, \\dots)$ yang memenuhi seluruh kendala secara bersamaan.
      </p>
    </div>
    <div style="text-align:center; padding: 1rem 0 0 0;">
      <button class="btn btn-primary" style="font-size:1.1rem; padding:0.75rem 2rem;" onclick="renderSetup()">Soal Baru →</button>
    </div>
  </div>`;
  const el = appendBlock(html);
  renderMathIn(el);
}

function renderIterAljabarPickEnter() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const row0 = tab.rows[0];
  const numCols = row0.length;
  const basisSet = new Set(tab.basis);
  const nTotal = numCols - 2;

  const nonBasisCandidates = [];
  for (let j = 1; j <= nTotal; j++) {
    const varIdx = j - 1;
    if (!basisSet.has(varIdx)) {
      nonBasisCandidates.push({ col: j, varIdx, name: formatSubscriptVar(varIdx), coeff: row0[j] });
    }
  }

  const objEq = formatAlgebraicObjective(tab);

  let candidatesCardsHtml = nonBasisCandidates.map(c => `
    <button class="btn btn-outline-secondary btn-algebra-enter" data-col="${c.col}" style="font-weight:bold; padding:0.5rem 1rem; font-size:0.92rem;">
      ${texInline(c.name)} (Masuk)
    </button>
  `).join('');

  // Pre-calculate system equations for Section 2 (Leaving Variable)
  const targetEnterCol = iter.enterCol !== undefined ? iter.enterCol : findEntering(tab);
  const enterVarName = formatSubscriptVar(targetEnterCol - 1);
  const targetLeaveRow = findLeaving(tab, targetEnterCol);
  const isUnbounded = iter.unbounded || targetLeaveRow === -1;

  const eqLines = [];
  for (let i = 1; i < tab.rows.length; i++) {
    eqLines.push(formatAlgebraicEq(tab, i));
  }
  const systemEqLatex = `\\begin{aligned}\n${eqLines.join(' \\\\\n')}\n\\end{aligned}`;

  let leaveButtonsHtml = '';
  for (let i = 1; i < tab.rows.length; i++) {
    const basisVarName = formatSubscriptVar(tab.basis[i - 1]);
    leaveButtonsHtml += `
      <button class="btn btn-outline-secondary btn-algebra-leave" data-row="${i}" style="font-weight:bold; padding:0.5rem 1rem; font-size:0.92rem; opacity:0.6;" disabled>
        ${texInline(basisVarName)} (Keluar)
      </button>
    `;
  }

  if (isUnbounded) {
    leaveButtonsHtml += `
      <button class="btn btn-outline-danger" id="btnUnboundedAljabar_${currentIterIdx}" style="font-weight:bold; padding:0.5rem 1rem; opacity:0.6;" disabled>
        🚫 Tidak Ada Batasan Rasio (Solusi Tidak Terbatas / Unbounded)
      </button>`;
  }

  const html = `<div class="card" id="iterAljabarCard_${currentIterIdx}">
    <div class="card-title">
      <span>Iterasi Aljabar ${currentIterIdx + 1} • Pemilihan Variabel Masuk & Keluar</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarEnter_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; align-items:start;">
      <!-- LEFT COLUMN: ENTERING VARIABLE -->
      <div id="secAljabarEnter_${currentIterIdx}">
        <div style="font-weight:bold; margin-bottom:0.6rem; font-size:0.95rem;">
          1. Pilih Variabel Masuk (Entering Variable):
        </div>
        <div style="font-size:1.05rem; font-weight:bold; margin-bottom:1rem; background:var(--bg-primary); padding:0.65rem 0.85rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          ${texInline(objEq)}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
          ${candidatesCardsHtml}
        </div>
        <div id="feedbackAljabarEnter_${currentIterIdx}" class="feedback"></div>
      </div>

      <!-- RIGHT COLUMN: LEAVING VARIABLE -->
      <div id="secAljabarLeave_${currentIterIdx}">
        <div style="font-weight:bold; margin-bottom:0.6rem; font-size:0.95rem;">
          2. Uji Rasio & Pilih Variabel Keluar (Leaving Variable / Pemblok):
        </div>
        <div style="font-size:1.05rem; font-weight:bold; margin-bottom:1rem; background:var(--bg-primary); padding:0.65rem 0.85rem; border-radius:var(--radius); border:1px solid var(--border-color);">
          ${texInline(systemEqLatex)}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;" id="eqRatioContainer_${currentIterIdx}">
          ${leaveButtonsHtml}
        </div>
        <div id="feedbackAljabarLeave_${currentIterIdx}" class="feedback"></div>
      </div>
    </div>
  </div>`;

  const container = appendBlock(html);

  if ($(`btnSkipAljabarEnter_${currentIterIdx}`)) {
    $(`btnSkipAljabarEnter_${currentIterIdx}`).onclick = () => {
      const targetCol = iter.enterCol !== undefined ? iter.enterCol : targetEnterCol;
      const btn = container.querySelector(`button[data-col="${targetCol}"]`);
      if (btn) btn.click();
    };
  }

  container.querySelectorAll('.btn-algebra-enter').forEach(btn => {
    btn.onclick = () => {
      const col = parseInt(btn.dataset.col);
      const fb = $(`feedbackAljabarEnter_${currentIterIdx}`);
      const targetVal = iter.enterCol !== undefined ? tab.rows[0][iter.enterCol] : null;
      const clickedVal = tab.rows[0][col];

      const isCorrectCol = (col === iter.enterCol) || 
                           (targetVal && clickedVal && clickedVal.isPos() && clickedVal.eq(targetVal)) ||
                           (col === targetEnterCol);

      if (isCorrectCol) {
        iter.enterCol = col;
        fb.className = 'feedback show success';
        fb.textContent = '✅ Benar! Variabel ini memiliki koefisien positif terbesar di fungsi z.';
        
        // Disable Enter buttons visually with neutral highlight
        container.querySelectorAll('.btn-algebra-enter').forEach(b => {
          b.disabled = true;
          b.style.opacity = '0.6';
        });
        btn.style.opacity = '1';
        btn.style.background = 'var(--text-primary)';
        btn.style.color = 'var(--bg-primary)';
        btn.style.borderColor = 'var(--text-primary)';

        // Enable Leave buttons in Section 2
        container.querySelectorAll('.btn-algebra-leave').forEach(b => {
          b.disabled = false;
          b.style.opacity = '1';
        });
        if ($(`btnUnboundedAljabar_${currentIterIdx}`)) {
          $(`btnUnboundedAljabar_${currentIterIdx}`).disabled = false;
          $(`btnUnboundedAljabar_${currentIterIdx}`).style.opacity = '1';
        }
      } else {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Bukan variabel itu. Pilih variabel non-basis dengan koefisien positif terbesar pada fungsi z.';
      }
    };
  });

  if (isUnbounded && $(`btnUnboundedAljabar_${currentIterIdx}`)) {
    $(`btnUnboundedAljabar_${currentIterIdx}`).onclick = () => {
      const fb = $(`feedbackAljabarLeave_${currentIterIdx}`);
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Seluruh persamaan kendala tidak membatasi variabel masuk (rasio ≤ 0). Masalah ini bersifat Tidak Terbatas (Unbounded).';
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    };
  }

  container.querySelectorAll('.btn-algebra-leave').forEach(btn => {
    btn.onclick = () => {
      const row = parseInt(btn.dataset.row);
      const fb = $(`feedbackAljabarLeave_${currentIterIdx}`);
      const enterCol = iter.enterCol || targetEnterCol;
      const aCoeff = tab.rows[row][enterCol];
      const bVal = tab.rows[row][tab.rows[row].length - 1];
      const basisVarName = formatSubscriptVar(tab.basis[row - 1]);

      if (isUnbounded) {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Tidak ada persamaan kendala yang membatasi. Klik tombol "Tidak Ada Batasan Rasio".';
      } else if (row === targetLeaveRow) {
        iter.leaveRow = targetLeaveRow;
        fb.className = 'feedback show success';
        fb.textContent = '✅ Benar! Variabel basis ini bernilai 0 lebih dulu (blocking variable dengan rasio terketat/terkecil). Lanjut ke substitusi aljabar.';
        
        container.querySelectorAll('.btn-algebra-leave').forEach(b => {
          b.disabled = true;
          b.style.opacity = '0.6';
        });
        btn.style.opacity = '1';
        btn.style.background = 'var(--text-primary)';
        btn.style.color = 'var(--bg-primary)';
        btn.style.borderColor = 'var(--text-primary)';

        disableContainer(container);
        setTimeout(renderIterAljabarSubstitution, 600);
      } else if (!aCoeff.isPos()) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Salah! Variabel basis ${basisVarName} tidak membatasi ${enterVarName} karena koefisiennya ${aCoeff.toString()} (≤ 0).`;
      } else {
        const ratio = bVal.div(aCoeff);
        const targetACoeff = tab.rows[targetLeaveRow][enterCol];
        const targetBVal = tab.rows[targetLeaveRow][tab.rows[targetLeaveRow].length - 1];
        const minRatio = targetBVal.div(targetACoeff);
        fb.className = 'feedback show error';
        fb.textContent = `❌ Salah! Variabel basis ${basisVarName} belum bernilai 0 (rasionya = ${ratio.toString()}, lebih besar dari rasio minimum ${minRatio.toString()}).`;
      }
    };
  });
}

function revealAljabarLeaveSection(container) {
  // Already rendered in renderIterAljabarPickEnter from start
  const secLeave = container.querySelector(`#secAljabarLeave_${currentIterIdx}`);
  if (secLeave) {
    secLeave.style.display = 'block';
  }
}

function renderIterAljabarPickLeave() {
  // Merged into renderIterAljabarPickEnter + revealAljabarLeaveSection
  const container = document.getElementById(`iterAljabarCard_${currentIterIdx}`);
  if (container) {
    revealAljabarLeaveSection(container);
  } else {
    renderIterAljabarPickEnter();
  }
}

function renderIterAljabarSubstitution() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nextTab = doPivot(tab, iter.leaveRow, iter.enterCol);
  const numCols = nextTab.rows[0].length;
  const nTotal = numCols - 2;

  const enterVarName = formatSubscriptVar(iter.enterCol - 1);
  const leaveVarName = formatSubscriptVar(tab.basis[iter.leaveRow - 1]);

  const nextBasisSet = new Set(nextTab.basis);
  const nextNonBasisVars = [];
  for (let j = 0; j < nTotal; j++) {
    if (!nextBasisSet.has(j)) nextNonBasisVars.push(j);
  }

  // Step 1: Nyatakan variabel masuk dari persamaan variabel keluar
  let step1InputHtml = `
    <div class="std-form-line" style="margin:0.4rem 0 0.8rem 0; font-size:1.05rem;">
      <span style="font-weight:bold; margin-right:0.15rem;">${texInline(enterVarName)} =</span>
      <input type="text" id="aljSub1Const_${currentIterIdx}" style="width:50px; text-align:center;">
  `;
  nextNonBasisVars.forEach(nbIdx => {
    const nbVarName = formatSubscriptVar(nbIdx);
    step1InputHtml += `
      <span>+</span>
      <input type="text" id="aljSub1Coeff_${currentIterIdx}_${nbIdx}" style="width:50px; text-align:center;">
      <span>${texInline(nbVarName)}</span>
    `;
  });
  step1InputHtml += `</div>`;

  // Step 2: System of equations inputs (Baris z: z + c1 x1 + c2 x2 = RHS)
  let objInputHtml = `
    <div class="std-form-line" style="margin-bottom:0.8rem; font-size:1.05rem;">
      <span style="font-weight:bold; margin-right:0.15rem;">z</span>
  `;
  nextNonBasisVars.forEach(nbIdx => {
    const nbVarName = formatSubscriptVar(nbIdx);
    objInputHtml += `
      <span>+</span>
      <input type="text" id="aljSubObjCoeff_${currentIterIdx}_${nbIdx}" style="width:50px; text-align:center;">
      <span>${texInline(nbVarName)}</span>
    `;
  });
  objInputHtml += `
      <span>=</span>
      <input type="text" id="aljSubObjConst_${currentIterIdx}" style="width:50px; text-align:center;">
    </div>
  `;

  let eqInputsHtml = '';
  for (let i = 1; i < nextTab.rows.length; i++) {
    const basisVarIdx = nextTab.basis[i - 1];
    const basisVarName = formatSubscriptVar(basisVarIdx);

    let rowInputs = `
      <div class="std-form-line" style="margin-bottom:0.6rem; font-size:1.05rem;">
        <span style="font-weight:bold; margin-right:0.15rem;">${texInline(basisVarName)} =</span>
        <input type="text" id="aljSubConst_${currentIterIdx}_${i}" style="width:50px; text-align:center;">
    `;

    nextNonBasisVars.forEach(nbIdx => {
      const nbVarName = formatSubscriptVar(nbIdx);
      rowInputs += `
        <span>+</span>
        <input type="text" id="aljSubCoeff_${currentIterIdx}_${i}_${nbIdx}" style="width:50px; text-align:center;">
        <span>${texInline(nbVarName)}</span>
      `;
    });

    rowInputs += `</div>`;
    eqInputsHtml += rowInputs;
  }

  const allVarNames = [];
  for (let j = 0; j < nTotal; j++) allVarNames.push(formatSubscriptVar(j));
  const nonNegTex = texInline(`${allVarNames.join(', ')} \\geq 0`);

  const html = `<div class="card" id="stepSubAljabarCard_${currentIterIdx}">
    <div class="card-title">
      <span>Substitusi Persamaan Aljabar</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarSub_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    <div style="margin-bottom:1.25rem; font-size:0.95rem; line-height:1.6;">
      <div style="margin-bottom:0.4rem;">
        1. Nyatakan variabel masuk ${texInline(enterVarName)} dari persamaan ${texInline(leaveVarName)}:
      </div>
      ${step1InputHtml}
      <div style="margin-top:0.8rem; margin-bottom:0.4rem;">
        2. Substitusikan ${texInline(enterVarName)} ke seluruh persamaan kendala lainnya & baris $z$:
      </div>
    </div>

    <div style="font-weight:bold; margin-bottom:0.75rem; font-size:1rem;">Sistem Persamaan Aljabar Hasil Substitusi:</div>

    ${objInputHtml}

    <div style="margin:0.75rem 0 0.5rem 0; color:var(--text-secondary);">dengan kendala:</div>

    ${eqInputsHtml}

    <div class="btn-row" style="margin-top:1.5rem;">
      <button class="btn btn-primary" id="btnCheckAljabarSub_${currentIterIdx}">Periksa Persamaan Aljabar Hasil Substitusi</button>
    </div>
    <div id="feedbackAljabarSub_${currentIterIdx}" class="feedback"></div>
  </div>`;

  const container = appendBlock(html);

  // Sync inputs between Step 1 and the leaveRow equation in Step 2
  const inp1Const = $(`aljSub1Const_${currentIterIdx}`);
  const inp2LeaveConst = $(`aljSubConst_${currentIterIdx}_${iter.leaveRow}`);
  if (inp1Const && inp2LeaveConst) {
    inp1Const.addEventListener('input', () => { inp2LeaveConst.value = inp1Const.value; });
    inp2LeaveConst.addEventListener('input', () => { inp1Const.value = inp1Const.value; });
  }

  nextNonBasisVars.forEach(nbIdx => {
    const inp1Coeff = $(`aljSub1Coeff_${currentIterIdx}_${nbIdx}`);
    const inp2LeaveCoeff = $(`aljSubCoeff_${currentIterIdx}_${iter.leaveRow}_${nbIdx}`);
    if (inp1Coeff && inp2LeaveCoeff) {
      inp1Coeff.addEventListener('input', () => { inp2LeaveCoeff.value = inp1Coeff.value; });
      inp2LeaveCoeff.addEventListener('input', () => { inp1Coeff.value = inp2LeaveCoeff.value; });
    }
  });

  // Skip handler
  if ($(`btnSkipAljabarSub_${currentIterIdx}`)) {
    $(`btnSkipAljabarSub_${currentIterIdx}`).onclick = () => {
      // Step 1
      const expLeaveRowConst = nextTab.rows[iter.leaveRow][numCols - 1];
      if ($(`aljSub1Const_${currentIterIdx}`)) {
        $(`aljSub1Const_${currentIterIdx}`).value = expLeaveRowConst.isZero() ? '0' : expLeaveRowConst.toString();
      }
      nextNonBasisVars.forEach(nbIdx => {
        const expCoeff = nextTab.rows[iter.leaveRow][nbIdx + 1].neg();
        if ($(`aljSub1Coeff_${currentIterIdx}_${nbIdx}`)) {
          $(`aljSub1Coeff_${currentIterIdx}_${nbIdx}`).value = expCoeff.toString();
        }
      });

      // Objective (Baris z)
      const expectedObjConst = nextTab.rows[0][numCols - 1];
      if ($(`aljSubObjConst_${currentIterIdx}`)) {
        $(`aljSubObjConst_${currentIterIdx}`).value = expectedObjConst.isZero() ? '0' : expectedObjConst.toString();
      }
      nextNonBasisVars.forEach(nbIdx => {
        const expectedCoeff = nextTab.rows[0][nbIdx + 1];
        if ($(`aljSubObjCoeff_${currentIterIdx}_${nbIdx}`)) {
          $(`aljSubObjCoeff_${currentIterIdx}_${nbIdx}`).value = expectedCoeff.toString();
        }
      });

      // Constraints
      for (let i = 1; i < nextTab.rows.length; i++) {
        const expectedConst = nextTab.rows[i][numCols - 1];
        if ($(`aljSubConst_${currentIterIdx}_${i}`)) {
          $(`aljSubConst_${currentIterIdx}_${i}`).value = expectedConst.isZero() ? '0' : expectedConst.toString();
        }
        nextNonBasisVars.forEach(nbIdx => {
          const expectedCoeff = nextTab.rows[i][nbIdx + 1].neg();
          if ($(`aljSubCoeff_${currentIterIdx}_${i}_${nbIdx}`)) {
            $(`aljSubCoeff_${currentIterIdx}_${i}_${nbIdx}`).value = expectedCoeff.toString();
          }
        });
      }

      $(`btnCheckAljabarSub_${currentIterIdx}`).click();
    };
  }

  // Check / Validate handler
  $(`btnCheckAljabarSub_${currentIterIdx}`).onclick = () => {
    let allOk = true;

    // Validate Step 1
    const expLeaveRowConst = nextTab.rows[iter.leaveRow][numCols - 1];
    const inp1C = $(`aljSub1Const_${currentIterIdx}`);
    if (inp1C) {
      const val = parseFracWithM(inp1C.value);
      if (!val || !val.eq(expLeaveRowConst)) {
        allOk = false;
        inp1C.classList.add('wrong');
        inp1C.classList.remove('correct');
      } else {
        inp1C.classList.add('correct');
        inp1C.classList.remove('wrong');
      }
    }

    nextNonBasisVars.forEach(nbIdx => {
      const expCoeff = nextTab.rows[iter.leaveRow][nbIdx + 1].neg();
      const inp1Co = $(`aljSub1Coeff_${currentIterIdx}_${nbIdx}`);
      if (inp1Co) {
        const val = parseFracWithM(inp1Co.value);
        if (!val || !val.eq(expCoeff)) {
          allOk = false;
          inp1Co.classList.add('wrong');
          inp1Co.classList.remove('correct');
        } else {
          inp1Co.classList.add('correct');
          inp1Co.classList.remove('wrong');
        }
      }
    });

    // Validate Objective (Baris z)
    const expectedObjConst = nextTab.rows[0][numCols - 1];
    const objConstInp = $(`aljSubObjConst_${currentIterIdx}`);
    if (objConstInp) {
      const val = parseFracWithM(objConstInp.value);
      if (!val || !val.eq(expectedObjConst)) {
        allOk = false;
        objConstInp.classList.add('wrong');
        objConstInp.classList.remove('correct');
      } else {
        objConstInp.classList.add('correct');
        objConstInp.classList.remove('wrong');
      }
    }

    nextNonBasisVars.forEach(nbIdx => {
      const expectedCoeff = nextTab.rows[0][nbIdx + 1];
      const inp = $(`aljSubObjCoeff_${currentIterIdx}_${nbIdx}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        if (!val || !val.eq(expectedCoeff)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    });

    // Validate Constraints
    for (let i = 1; i < nextTab.rows.length; i++) {
      const expectedConst = nextTab.rows[i][numCols - 1];
      const constInp = $(`aljSubConst_${currentIterIdx}_${i}`);
      if (constInp) {
        const val = parseFracWithM(constInp.value);
        if (!val || !val.eq(expectedConst)) {
          allOk = false;
          constInp.classList.add('wrong');
          constInp.classList.remove('correct');
        } else {
          constInp.classList.add('correct');
          constInp.classList.remove('wrong');
        }
      }

      nextNonBasisVars.forEach(nbIdx => {
        const expectedCoeff = nextTab.rows[i][nbIdx + 1].neg();
        const coeffInp = $(`aljSubCoeff_${currentIterIdx}_${i}_${nbIdx}`);
        if (coeffInp) {
          const val = parseFracWithM(coeffInp.value);
          if (!val || !val.eq(expectedCoeff)) {
            allOk = false;
            coeffInp.classList.add('wrong');
            coeffInp.classList.remove('correct');
          } else {
            coeffInp.classList.add('correct');
            coeffInp.classList.remove('wrong');
          }
        }
      });
    }

    const fb = $(`feedbackAljabarSub_${currentIterIdx}`);
    if (allOk) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Seluruh persamaan aljabar hasil substitusi sudah tepat.';
      disableContainer(container);
      currentIterIdx++;
      setTimeout(renderIterCheckOptimal, 600);
    } else {
      fb.className = 'feedback show error';
      fb.textContent = '❌ Masih ada koefisien atau konstanta yang belum tepat. Periksa kembali hasil substitusi linier.';
    }
  };
}

function renderIterPickEnter() {
  if (currentMethod === 'aljabar') {
    renderIterAljabarPickEnter();
    return;
  }
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nTotal = p.nOrig + p.nExtra;

  let table = `<table class="tableau"><thead><tr><th></th><th>${texInline('z')}</th>`;
  for (let j = 0; j < nTotal; j++) {
    table += `<th class="selectable enter-header" data-col="${j + 1}">${texInline(`x_{${j + 1}}`)}</th>`;
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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip4b_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    <div class="tableau-wrapper">${table}</div>
    <div id="feedback4b_${currentIterIdx}" class="feedback"></div>
  </div>`;
  const container = appendBlock(html);

  if ($(`btnSkip4b_${currentIterIdx}`)) {
    $(`btnSkip4b_${currentIterIdx}`).onclick = () => {
      const fb = $(`feedback4b_${currentIterIdx}`);
      container.querySelectorAll('th.selectable').forEach(th => {
        if (parseInt(th.dataset.col) === iter.enterCol) {
          th.classList.add('selected-enter');
        }
      });
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Lanjut pilih baris pivot.';
      disableContainer(container);
      setTimeout(renderIterPickLeave, 600);
    };
  }

  container.querySelectorAll('th.selectable').forEach(th => {
    th.onclick = () => {
      const col = parseInt(th.dataset.col);
      const fb = $(`feedback4b_${currentIterIdx}`);
      const targetVal = iter.enterCol !== undefined ? tab.rows[0][iter.enterCol] : null;
      const clickedVal = tab.rows[0][col];

      const isCorrectCol = (col === iter.enterCol) || 
                           (targetVal && clickedVal && clickedVal.isPos() && clickedVal.eq(targetVal));

      if (isCorrectCol) {
        iter.enterCol = col;
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
  if (currentMethod === 'aljabar') {
    renderIterAljabarPickLeave();
    return;
  }
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
    table += `<tr class="${isRow0 ? 'row-0' : ''}">`;
    table += `<td class="row-label">${texInline(label)}</td>`;
    
    for (let j = 0; j < tab.rows[i].length; j++) {
      let cls = j === tab.rows[i].length - 1 ? 'rk-col' : '';
      const isPivotSelectable = !isRow0 && (j === iter.enterCol);
      if (j === iter.enterCol) cls += ' col-selected';
      if (isPivotSelectable) cls += ' selectable';
      
      table += `<td class="${cls}" ${isPivotSelectable ? `data-row="${i}"` : ''}>${tab.rows[i][j].toString()}</td>`;
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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip4c_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
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

  if ($(`btnSkip4c_${currentIterIdx}`)) {
    $(`btnSkip4c_${currentIterIdx}`).onclick = () => {
      const fb = $(`feedback4c_${currentIterIdx}`);
      const targetLeaveRow = findLeaving(tab, iter.enterCol);
      const isUnbounded = iter.unbounded || targetLeaveRow === -1;
      if (isUnbounded) {
        fb.className = 'feedback show success';
        fb.textContent = '✅ Benar! Seluruh elemen pada kolom pivot ≤ 0, sehingga tidak ada variabel keluar. Masalah ini bersifat Tidak Terbatas (Unbounded).';
        disableContainer(container);
        setTimeout(renderUnboundedConclusionCard, 800);
      } else {
        iter.leaveRow = targetLeaveRow;
        container.querySelectorAll('td.selectable').forEach(td => {
          if (parseInt(td.dataset.row) === iter.leaveRow) {
            td.classList.add('pivot-cell');
          }
        });
        fb.className = 'feedback show success';
        fb.textContent = `✅ Benar! Lanjut mengisi tabel iterasi baru.`;
        disableContainer(container);
        setTimeout(renderIterFillTableau, 600);
      }
    };
  }

  container.querySelectorAll('td.selectable').forEach(td => {
    td.onclick = () => {
      const row = parseInt(td.dataset.row);
      const fb = $(`feedback4c_${currentIterIdx}`);
      const targetLeaveRow = findLeaving(tab, iter.enterCol);
      const isUnbounded = iter.unbounded || targetLeaveRow === -1;
      if (isUnbounded) {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Tidak ada baris yang bisa dipilih. Pada kolom pivot ini, seluruh elemen kendala bernilai ≤ 0 (pembagian rasio tidak valid). Klik tombol "Tidak Ada Baris Pivot".';
      } else if (row === targetLeaveRow) {
        iter.leaveRow = targetLeaveRow;
        td.classList.add('pivot-cell');
        fb.className = 'feedback show success';
        fb.textContent = `✅ Benar! Baris ini memuat elemen pivot dengan rasio minimum terkecil. Lanjut mengisi tabel iterasi baru.`;
        disableContainer(container);
        setTimeout(renderIterFillTableau, 600);
      } else {
        const aCoeff = tab.rows[row][iter.enterCol];
        if (!aCoeff.isPos()) {
          fb.className = 'feedback show error';
          fb.textContent = `❌ Salah! Elemen kendala pada baris ini bernilai ${aCoeff.toString()} (≤ 0), sehingga tidak membatasi variabel masuk (pembagian rasio tidak valid).`;
        } else {
          const ratio = tab.rows[row][tab.rows[row].length - 1].div(aCoeff);
          const targetACoeff = tab.rows[targetLeaveRow][iter.enterCol];
          const targetBVal = tab.rows[targetLeaveRow][tab.rows[targetLeaveRow].length - 1];
          const minRatio = targetBVal.div(targetACoeff);
          fb.className = 'feedback show error';
          fb.textContent = `❌ Salah! Bukan baris pivot itu. Baris ini memiliki rasio = ${ratio.toString()}, lebih besar dari rasio minimum ${minRatio.toString()}. Baris pivot harus memiliki rasio terkecil!`;
        }
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
  const el = appendBlock(html);
  renderMathIn(el);
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
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip4d_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
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
    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheckFill_${currentIterIdx}">Periksa ✓</button>
    </div>
  </div>`;
  const container = appendBlock(html);

  $(`btnSkip4d_${currentIterIdx}`).onclick = () => {
    for (let i = 1; i <= p.m; i++) {
      const sel = $(`ntBasis_${currentIterIdx}_${i - 1}`);
      if (sel) sel.value = nextTab.basis[i - 1];
    }
    for (let i = 0; i < nextTab.rows.length; i++) {
      for (let j = 0; j < nextTab.rows[i].length; j++) {
        const inp = $(`nt_${currentIterIdx}_${i}_${j}`);
        if (inp) inp.value = nextTab.rows[i][j].toString();
      }
    }
    $(`btnCheckFill_${currentIterIdx}`).click();
  };

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

  let multiOptHtml = '';
  if (finalIter.multipleOptimal && finalIter.altCols && finalIter.altCols.length > 0) {
    const altVarsStr = finalIter.altCols.map(c => `x_{${c}}`).join(', ');
    multiOptHtml = `
      <div style="background:rgba(124,58,237,0.08); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--accent); margin-bottom:1rem;">
        <strong style="color:var(--accent); font-size:0.95rem;">✨ Ada Banyak Solusi Optimal (Multiple Optimal Solutions):</strong>
        <p style="font-size:0.86rem; color:var(--text-secondary); margin-top:0.35rem; margin-bottom:0; line-height:1.6;">
          Variabel non-basis <b>${altVarsStr}</b> memiliki koefisien <b>0</b> pada Baris 0.
          Melakukan pivot pada kolom tersebut akan menghasilkan kombinasi titik sudut optimal basis lainnya tanpa mengubah nilai $z_{max}$.
        </p>
      </div>
    `;
  }

  let html = `<div class="card" style="border-color:var(--success);">
    <div class="card-title">
      <span>🏆 Baca Solusi Optimal</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkip5">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(5)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    ${multiOptHtml}
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

  if ($('btnSkip5')) {
    $('btnSkip5').onclick = () => {
      for (let j = 0; j < p.nOrig; j++) {
        if ($(`sol${j}`)) $(`sol${j}`).value = solution[j].toString();
      }
      const expectedZ = p.type === 'max' ? zVal.neg() : zVal;
      if ($('solZ')) $('solZ').value = expectedZ.toString();
      $('btnCheckSol').click();
    };
  }

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

// ===================== THEME MANAGEMENT =====================
function initTheme() {
  const savedTheme = localStorage.getItem('simplex_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('simplex_theme', newTheme);
}

// ===================== INIT =====================
function init() {
  initTheme();
  renderSetup();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
