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
      tabRaw, tabEliminated, tabInitialEliminated: tabEliminated,
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
    tabRaw, tabEliminated, tabInitialEliminated: tabEliminated,
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
    tabRaw, tabEliminated, tabInitialEliminated: tabEliminated,
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
    title: "1. Simplex Aljabar • Ide Dasar & Formulasi Contoh",
    content: `
      <p style="margin-bottom:1rem; line-height:1.6; font-size:0.92rem;">
        <b>Ide Dasar:</b> Daerah feasibel program linear berbentuk poligon (atau polihedron). Solusi optimal selalu berada di salah satu <b>titik sudutnya</b>, dan setiap titik sudut bersesuaian dengan satu <b>BFS (Basic Feasible Solution)</b>.
      </p>

      <div style="background:rgba(124,58,237,0.06); padding:1rem 1.25rem; border-radius:var(--radius); border-left:4px solid var(--accent); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem;">Alur Kerja Metode Simplex:</h4>
        <p style="font-size:0.88rem; line-height:1.6; color:var(--text-primary);">
          Simplex tidak mencoba semua titik sudut. Ia mulai dari satu titik sudut asal, lalu berpindah ke titik sudut tetangga yang nilai $z$-nya lebih kecil (untuk minimasi), dan berhenti ketika tidak ada tetangga yang lebih baik. Satu perpindahan tersebut disebut <b>iterasi (pivot)</b>.
        </p>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Contoh Masalah yang Dipakai:</h4>
        <div style="background:var(--bg-primary); padding:0.85rem 1.1rem; border-radius:var(--radius); font-size:0.95rem; text-align:center;">
          $$\\min z = -3x_1 - 2x_2 \\quad \\text{dengan kendala} \\quad x_1 + x_2 \\le 4, \\quad 2x_1 + x_2 \\le 6, \\quad x_1, x_2 \\ge 0$$
        </div>
      </div>
    `
  },
  {
    title: "1. Simplex Aljabar • Ubah ke Bentuk Baku",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        <b>Bentuk Baku:</b> Ubah sistem pertidaksamaan ke bentuk baku $Ax = b$ dengan $x \\ge 0$. Untuk kendala "$\\le$", tambahkan variabel slack non-negatif ($x_3, x_4 \\ge 0$).
      </p>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Persamaan Baku & Konstruksi Matriks:</h4>
        <div style="background:var(--bg-primary); padding:0.85rem 1.1rem; border-radius:var(--radius); font-size:0.9rem; margin-bottom:0.85rem;">
          $$\\begin{aligned}
            x_1 + x_2 + x_3 &= 4 \\\\
            2x_1 + x_2 + x_4 &= 6
          \\end{aligned}$$
        </div>
        <div style="font-size:0.88rem; line-height:1.7;">
          Di sini terdapat $n = 4$ variabel dan $m = 2$ kendala:
          $$A = \\begin{pmatrix} 1 & 1 & 1 & 0 \\\\ 2 & 1 & 0 & 1 \\end{pmatrix} = [a_1, a_2, a_3, a_4], \\quad b = \\begin{pmatrix} 4 \\\\ 6 \\end{pmatrix}, \\quad c = (-3, -2, 0, 0)$$
        </div>
      </div>

      <div style="background:rgba(124,58,237,0.06); padding:0.85rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--accent); font-size:0.88rem; line-height:1.6;">
        <b>💡 Catatan Tanda:</b> Aturan ini untuk minimasi. Untuk masalah maksimasi, ubah fungsi tujuan menjadi $\\min(-z)$.
      </div>
    `
  },
  {
    badge: "Slide 3 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Pilih Basis Awal & Hitung BFS",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        <b>Solusi Basis Awal:</b> Pilih $m$ kolom dari $A$ yang membentuk matriks basis $B$ (tak-singular). Variabel yang kolomnya dipilih disebut <b>variabel basis ($x_B$)</b>, sedangkan sisanya adalah <b>variabel nonbasis ($x_N = 0$)</b>.
      </p>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Formula Solusi Basis Layak (BFS):</h4>
        <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.92rem; text-align:center; margin-bottom:0.85rem;">
          $$x_B = B^{-1}b = \\bar b, \\qquad x_N = 0, \\qquad z_0 = c_B^T x_B$$
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
          Basis awal paling mudah adalah menggunakan variabel slack karena $B = I \\implies B^{-1} = I$ (tanpa perlu hitung invers). Syaratnya semua $b \\ge 0$.
        </p>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Contoh (Iterasi 1 Awal):</h4>
        <ul style="margin-left:1.1rem; font-size:0.88rem; line-height:1.7;">
          <li><b>Basis:</b> $(x_3, x_4) \\implies B = [a_3, a_4] = I$</li>
          <li><b>Solusi Basis:</b> $x_B = (x_3, x_4) = B^{-1}b = (4, 6)$, dan $x_1 = x_2 = 0$</li>
          <li><b>Nilai Objektif:</b> $c_B = (0, 0) \\implies z_0 = c_B^T x_B = 0$ (Titik $(0,0)$ pada grafik)</li>
        </ul>
      </div>
    `
  },
  {
    badge: "Slide 4 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Uji Optimalitas (Pricing)",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        <b>Uji Optimalitas:</b> Uji apakah BFS saat ini sudah optimal. Untuk setiap variabel nonbasis $j$, hitung $y_j = B^{-1}a_j$, $z_j = c_B^T y_j$, lalu periksa nilai marginal $z_j - c_j$.
      </p>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Perhitungan Pricing ($z_j - c_j$):</h4>
        <div style="background:var(--bg-primary); padding:0.75rem; border-radius:var(--radius); font-size:0.9rem; text-align:center; margin-bottom:0.75rem;">
          $$y_j = B^{-1}a_j, \\qquad z_j = c_B^T y_j \\implies z_j - c_j = c_B^T y_j - c_j$$
        </div>
        <ul style="margin-left:1.1rem; font-size:0.85rem; line-height:1.6;">
          <li>Jika <b>semua $z_j - c_j \\le 0$</b> $\\implies$ BFS sudah <b>OPTIMAL</b>. Berhenti.</li>
          <li>Jika ada $z_j - c_j > 0$, pilih $x_k$ dengan $z_k - c_k$ <b>positif terbesar</b> sebagai <b>Entering Variable (masuk basis)</b>.</li>
        </ul>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Contoh (Iterasi 1):</h4>
        <div style="font-size:0.85rem; line-height:1.7;">
          • Nonbasis: $x_1$ dan $x_2$. Karena $B = I$, maka $y_1 = a_1 = (1, 2)^T$ dan $y_2 = a_2 = (1, 1)^T$.<br>
          • $c_B = (0, 0) \\implies z_1 = c_B^T y_1 = 0$, $z_2 = c_B^T y_2 = 0$.<br>
          • $z_1 - c_1 = 0 - (-3) = \\mathbf{3}$ &nbsp;|&nbsp; $z_2 - c_2 = 0 - (-2) = 2$.<br>
          • Nilai positif terbesar adalah $3 \\implies \\mathbf{x_1 \\text{ masuk basis}}$.
        </div>
      </div>
    `
  },
  {
    badge: "Slide 5 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Cek Ketakterbatasan & Rasio Minimum",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        <b>Cek Ketakterbatasan & Uji Rasio:</b> Periksa apakah solusi tak terbatas, lalu tentukan variabel mana yang <b>keluar dari basis (Leaving Variable)</b> melalui uji rasio minimum.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
        <div style="background:rgba(124,58,237,0.05); padding:1rem; border-radius:var(--radius); border-left:4px solid var(--accent);">
          <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.92rem;">Cek Ketakterbatasan</h4>
          <p style="font-size:0.83rem; line-height:1.6; color:var(--text-secondary);">
            Hitung $y_k = B^{-1}a_k$. Jika semua komponen $y_{ik} \\le 0$, variabel masuk $x_k$ dapat dinaikkan tanpa batas $\\implies$ <b>SOLUSI UNBOUNDED</b>. Berhenti.
          </p>
        </div>

        <div style="background:rgba(234,179,8,0.08); padding:1rem; border-radius:var(--radius); border-left:4px solid #eab308;">
          <h4 style="color:#b45309; margin-bottom:0.4rem; font-size:0.92rem;">Uji Rasio Minimum</h4>
          <p style="font-size:0.83rem; line-height:1.6; color:var(--text-primary);">
            Cari baris $r$ dengan rasio terkecil:
            $$\\frac{\\bar b_r}{y_{rk}} = \\min_i \\left\\{ \\frac{\\bar b_i}{y_{ik}} : y_{ik} > 0 \\right\\}$$
            Variabel basis ke-$r$ adalah <b>Leaving Variable</b>.
          </p>
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color);">
        <h4 style="color:var(--accent); margin-bottom:0.5rem; font-size:0.95rem;">Contoh (Iterasi 1):</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem;">
          Untuk $x_1$ masuk: $y_1 = (1, 2)^T > 0$ (Lanjut). Hitung rasio untuk $\\bar b = (4, 6)^T$:
        </p>
        <table class="tableau" style="width:100%; font-size:0.85rem; margin-bottom:0.5rem;">
          <thead><tr><th>Baris</th><th>Basis</th><th>$\\bar b_i$</th><th>$y_{i1}$</th><th>Rasio ($\\bar b_i / y_{i1}$)</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>$x_3$</td><td>4</td><td>1</td><td>$4/1 = 4$</td></tr>
            <tr style="background:rgba(234,179,8,0.15);"><td>2</td><td>$x_4$</td><td>6</td><td>2</td><td>$6/2 = 3$ <b style="color:#b45309;">(Minimum!)</b></td></tr>
          </tbody>
        </table>
        <div style="font-size:0.85rem; color:var(--text-primary);">
          Rasio minimum di baris 2 $\\implies \\mathbf{x_4 \\text{ keluar basis}}$, dan nilai $x_1 = 3$.
        </div>
      </div>
    `
  },
  {
    badge: "Slide 6 / 11 • Simplex Aljabar",
    title: "1. Simplex Aljabar • Perbarui Solusi & Iterasi Berikutnya",
    content: `
      <p style="margin-bottom:1rem; font-size:0.92rem; line-height:1.6;">
        <b>Perbarui Solusi:</b> Perbarui solusi basis $x_B$, nilai $z$, dan gantikan kolom $a_{B_r}$ dengan $a_k$ pada matriks $B$. Kemudian ulangi dari Uji Optimalitas (Pricing).
      </p>

      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.92rem;">Update Solusi Iterasi 1:</h4>
        <div style="font-size:0.85rem; line-height:1.6;">
          • $x_1 = 3, \\, x_3 = 4 - 1(3) = 1, \\, x_4 = 0, \\, x_2 = 0 \\implies z = 0 - 3(3) = -9$.<br>
          • Basis Baru: $(x_3, x_1)$, berpindah dari titik $(0,0)$ ke titik $(3,0)$.
        </div>
      </div>

      <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
        <h4 style="color:var(--accent); margin-bottom:0.4rem; font-size:0.92rem;">Iterasi 2 & Iterasi 3 (Ringkasan):</h4>
        <div style="font-size:0.85rem; line-height:1.6;">
          <b>Iterasi 2:</b> Basis $(x_3, x_1) \\implies B = \\begin{pmatrix}1&1\\\\0&2\\end{pmatrix}, B^{-1} = \\begin{pmatrix}1&-\\tfrac12\\\\0&\\tfrac12\\end{pmatrix}$.<br>
          • $y_2 = B^{-1}a_2 = (\\tfrac12, \\tfrac12)^T \\implies z_2 - c_2 = c_B^T y_2 - c_2 = \\mathbf{\\tfrac12 > 0} \\implies x_2$ masuk basis.<br>
          • Rasio min di baris 1 $\\implies x_3$ keluar basis ($x_2 = 2$). Basis baru: $(x_2, x_1)$ titik $(2,2)$, $z = -10$.<br><br>
          <b>Iterasi 3 (Optimal):</b> Basis $(x_2, x_1) \\implies B = \\begin{pmatrix}1&1\\\\1&2\\end{pmatrix}, B^{-1} = \\begin{pmatrix}2&-1\\\\-1&1\\end{pmatrix}$.<br>
          • Nonbasis $x_3, x_4$: $z_3 - c_3 = -1 \\le 0$ dan $z_4 - c_4 = -1 \\le 0$. Semua $\\le 0 \\implies$ <b>OPTIMAL!</b>
        </div>
      </div>

      <div style="background:var(--success-bg); color:var(--text-primary); padding:0.9rem 1.1rem; border-radius:var(--radius); border-left:4px solid var(--success);">
        <strong style="color:var(--success);">Solusi Optimal Akhir:</strong><br>
        $$\\boxed{x^* = (x_1, x_2) = (2, 2), \\qquad z_{\\min} = -10}$$
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
        title: '💡 Panduan Solusi Basis & Matriks Aljabar Awal',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Teori Solusi Basis Layak (BFS)</h4>
          <p style="margin-bottom:0.75rem;">
            Solusi basis diperoleh dengan memilih $m$ kolom dari matriks $A$ menjadi matriks basis $B$. Variabel non-basis diset bernilai $0$:
            $$x_B = B^{-1}b = \\bar b, \\qquad x_N = 0, \\qquad z_0 = c_B^T x_B$$
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Tahapan Pengerjaan</h4>
          <ol>
            <li><b>Variabel Basis & Non-Basis Awal:</b>
              <br>• <b>Basis Awal:</b> Variabel Slack ${isBigM ? 'atau Artifisial' : ''} yang membentuk matriks identitas $I$ ($B = I$).
              <br>• <b>Non-Basis Awal (= 0):</b> Variabel keputusan asal ($x_1, x_2, \\dots$).
            </li>
            <li><b>Sistem Persamaan Aljabar:</b>
              <br>Menyusun $z_0 = c_B^T x_B$ dan persamaan kendala $x_B = B^{-1}b - \\sum_{j \\in N} (B^{-1}a_j) x_j$.
            </li>
          </ol>
        `
      };
    }

    if (step === 4) {
      return {
        title: '💡 Panduan Uji Optimalitas (Pricing) & Rasio Simplex Aljabar',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Aturan Pricing ($z_j - c_j$) & Rasio</h4>
          <p style="margin-bottom:0.75rem;">
            Metode Aljabar menguji apakah nilai $z$ dapat diturunkan/dinaikkan melalui vektor $y_j = B^{-1}a_j$ dan $z_j = c_B^T y_j$.
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Tahapan Pengerjaan</h4>
          <ol>
            <li><b>Uji Pricing ($z_j - c_j = c_B^T y_j - c_j$):</b>
              <br>Hitung $y_j = B^{-1}a_j$ dan $z_j = c_B^T y_j$ untuk setiap variabel nonbasis $j$.
              <br>• Jika <b>semua $z_j - c_j \\le 0$</b> $\\implies$ Solusi sudah <b>OPTIMAL</b>.
              <br>• Jika ada $z_j - c_j > 0$, pilih $x_k$ dengan nilai $z_k - c_k$ <b>positif terbesar</b> sebagai <b>Entering Variable (masuk basis)</b>.
            </li>
            <li><b>Cek Ketakterbatasan & Rasio Minimum:</b>
              <br>• Jika $y_k = B^{-1}a_k \\le 0$ seluruhnya $\\implies$ <b>SOLUSI UNBOUNDED</b>.
              <br>• Hitung rasio $\\bar b_i / y_{ik}$ untuk $y_{ik} > 0$. Baris $r$ dengan rasio minimum menentukan <b>Leaving Variable (keluar basis)</b>.
            </li>
            <li><b>Update Basis & Matriks $B$:</b>
              <br>Tukarkan kolom $a_{B_r}$ dengan $a_k$ pada matriks $B$, perbarui $x_B$ dan $z$, lalu ulangi dari Uji Pricing.
            </li>
          </ol>
        `
      };
    }

    if (step === 5) {
      return {
        title: '💡 Panduan Solusi Optimal Simplex Aljabar',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 Hasil Optimal Akhir</h4>
          <p style="margin-bottom:0.75rem;">
            Setelah seluruh $z_j - c_j \\le 0$, solusi optimal akhir dibaca langsung dari vektor $x_B = B^{-1}b$ dan $z^* = c_B^T x_B$.
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">✍️ Pembacaan Solusi</h4>
          <ul>
            <li><b>Nilai Variabel Basis ($x_B$):</b> Nilai $= B^{-1}b$.</li>
            <li><b>Nilai Variabel Non-Basis ($x_N$):</b> Nilai $= 0$.</li>
            <li><b>Nilai Optimal ($z^*$):</b> Nilai $= c_B^T x_B$.</li>
          </ul>
        `
      };
    }
  }

  if (step === 3) {
    if (currentMethod === 'aljabar') {
      return {
        title: '💡 Panduan Solusi Basis Awal (Simplex Aljabar)',
        body: `
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 1. Pemilihan Variabel Basis Awal</h4>
          <p style="margin-bottom:0.75rem;">
            Bebas memilih $m$ variabel dari sistem untuk membentuk variabel basis $x_B$. Syaratnya, kolom-kolom matriks basis $B = [a_{B_1}, \\dots, a_{B_m}]$ yang dibentuk oleh variabel tersebut harus saling bebas linear / nonsingular ($\\\det(B) \\neq 0$).
          </p>
          <h4 style="color:var(--accent);margin-bottom:0.4rem;">📘 2. Perhitungan Matriks & Solusi Basis</h4>
          <ul style="margin-left:1.2rem; margin-bottom:0.75rem; line-height:1.6;">
            <li><b>Matriks Basis ($B$):</b> Matriks berukuran $m \\times m$ yang elemen kolomnya diambil dari kolom variabel basis pada matriks kendala $A$.</li>
            <li><b>Invers Matriks ($B^{-1}$):</b> Invers dari matriks $B$ sedemikian rupa sehingga $B \\cdot B^{-1} = I$.</li>
            <li><b>Solusi Basis ($x_B$):</b> Vektor nilai variabel basis yang dihitung dengan rumus $x_B = B^{-1}b$. Variabel nonbasis bernilai $x_N = 0$.</li>
            <li><b>Nilai Fungsi Tujuan ($z_0$):</b> Nilai fungsi tujuan awal yang dihitung dengan $z_0 = c_B^T x_B$.</li>
          </ul>
        `
      };
    }

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

function invertMatrixFracM(B) {
  const m = B.length;
  const aug = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      row.push(FracM.from(B[i][j]));
    }
    for (let j = 0; j < m; j++) {
      row.push(i === j ? ONEM : ZEROM);
    }
    aug.push(row);
  }

  for (let k = 0; k < m; k++) {
    let pivotRow = -1;
    for (let i = k; i < m; i++) {
      if (!aug[i][k].isZero()) {
        pivotRow = i;
        break;
      }
    }
    if (pivotRow === -1) return null;

    if (pivotRow !== k) {
      [aug[k], aug[pivotRow]] = [aug[pivotRow], aug[k]];
    }

    const pivotVal = aug[k][k];
    for (let j = 0; j < 2 * m; j++) {
      aug[k][j] = aug[k][j].div(pivotVal);
    }

    for (let i = 0; i < m; i++) {
      if (i !== k) {
        const factor = aug[i][k];
        if (!factor.isZero()) {
          for (let j = 0; j < 2 * m; j++) {
            aug[i][j] = aug[i][j].sub(factor.mul(aug[k][j]));
          }
        }
      }
    }
  }

  const BInv = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < m; j++) {
      row.push(aug[i][m + j]);
    }
    BInv.push(row);
  }
  return BInv;
}

function computeBasisDetails(p, basisIndices) {
  const tab = p.tabInitialEliminated || p.tabEliminated;
  const numCols = tab.rows[0].length;
  const m = p.m;

  const B = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let k = 0; k < m; k++) {
      const colIdx = basisIndices[k] + 1;
      row.push(tab.rows[i + 1][colIdx]);
    }
    B.push(row);
  }

  const BInv = invertMatrixFracM(B);
  if (!BInv) return null;

  const bVec = [];
  for (let i = 0; i < m; i++) {
    bVec.push(tab.rows[i + 1][numCols - 1]);
  }

  const xB = [];
  for (let i = 0; i < m; i++) {
    let sum = ZEROM;
    for (let k = 0; k < m; k++) {
      sum = sum.add(BInv[i][k].mul(bVec[k]));
    }
    xB.push(sum);
  }

  const cB = [];
  for (let k = 0; k < m; k++) {
    const varIdx = basisIndices[k];
    const rawCoeff = p.tabRaw.rows[0][varIdx + 1];
    cB.push(rawCoeff.neg());
  }

  let z0 = ZEROM;
  for (let k = 0; k < m; k++) {
    z0 = z0.add(cB[k].mul(xB[k]));
  }

  return { B, BInv, xB, z0, cB };
}

function reconstructTableauForBasis(p, basisIndices, details) {
  const { BInv, xB, z0, cB } = details;
  const numCols = p.tabRaw.rows[0].length;
  const nTotal = numCols - 2;
  const m = p.m;

  const newRows = [];

  const row0 = [ONEM];
  for (let j = 0; j < nTotal; j++) {
    const c_j = p.tabRaw.rows[0][j + 1].neg();
    let cB_yj = ZEROM;
    for (let i = 0; i < m; i++) {
      let y_ij = ZEROM;
      for (let k = 0; k < m; k++) {
        const a_kj = p.tabRaw.rows[k + 1][j + 1];
        y_ij = y_ij.add(BInv[i][k].mul(a_kj));
      }
      cB_yj = cB_yj.add(cB[i].mul(y_ij));
    }
    const zj_minus_cj = cB_yj.sub(c_j);
    row0.push(zj_minus_cj);
  }
  row0.push(z0);
  newRows.push(row0);

  for (let i = 0; i < m; i++) {
    const row = [ZEROM];
    for (let j = 0; j < nTotal; j++) {
      let y_ij = ZEROM;
      for (let k = 0; k < m; k++) {
        const a_kj = p.tabRaw.rows[k + 1][j + 1];
        y_ij = y_ij.add(BInv[i][k].mul(a_kj));
      }
      row.push(y_ij);
    }
    row.push(xB[i]);
    newRows.push(row);
  }

  p.tabEliminated = {
    rows: newRows,
    basis: [...basisIndices]
  };
}

function renderBracketedMatrixInputs(rows, cols, idPrefix) {
  let gridHtml = `
    <div style="display:inline-flex; align-items:center; position:relative; padding:0.4rem 0.6rem; margin:0.25rem 0;">
      <div style="position:absolute; top:0; left:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-left:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:5px 0 0 5px;"></div>
      <table style="border-collapse:separate; border-spacing:0.35rem; text-align:center;">
  `;
  for (let i = 0; i < rows; i++) {
    gridHtml += '<tr>';
    for (let j = 0; j < cols; j++) {
      gridHtml += `<td><input type="text" id="${idPrefix}_${i}_${j}" style="width:55px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;"></td>`;
    }
    gridHtml += '</tr>';
  }
  gridHtml += `
      </table>
      <div style="position:absolute; top:0; right:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-right:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:0 5px 5px 0;"></div>
    </div>
  `;
  return gridHtml;
}

function renderBracketedVectorInputs(m, idPrefix) {
  let gridHtml = `
    <div style="display:inline-flex; align-items:center; position:relative; padding:0.4rem 0.6rem; margin:0.25rem 0;">
      <div style="position:absolute; top:0; left:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-left:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:5px 0 0 5px;"></div>
      <table style="border-collapse:separate; border-spacing:0.35rem; text-align:center;">
  `;
  for (let i = 0; i < m; i++) {
    gridHtml += `<tr>
      <td style="padding:0.15rem 0.25rem;"><input type="text" id="${idPrefix}_${i}" style="width:65px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;"></td>
    </tr>`;
  }
  gridHtml += `
      </table>
      <div style="position:absolute; top:0; right:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-right:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:0 5px 5px 0;"></div>
    </div>
  `;
  return gridHtml;
}

function renderBracketedVectorLabels(labels) {
  let gridHtml = `
    <div style="display:inline-flex; align-items:center; position:relative; padding:0.4rem 0.6rem; margin:0.25rem 0;">
      <div style="position:absolute; top:0; left:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-left:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:5px 0 0 5px;"></div>
      <table style="border-collapse:separate; border-spacing:0.35rem; text-align:center;">
  `;
  for (let i = 0; i < labels.length; i++) {
    gridHtml += `<tr>
      <td style="padding:0.25rem 0.4rem; font-weight:bold; font-size:1rem; color:var(--text-primary);">$${labels[i]}$</td>
    </tr>`;
  }
  gridHtml += `
      </table>
      <div style="position:absolute; top:0; right:0; bottom:0; width:7px; border-top:2px solid var(--text-primary); border-right:2px solid var(--text-primary); border-bottom:2px solid var(--text-primary); border-radius:0 5px 5px 0;"></div>
    </div>
  `;
  return gridHtml;
}

function getObjectiveFunctionTex(p) {
  let objStr = '\\text{Min } z = ';
  const varNames = Array.from({length: p.nOrig}, (_, j) => `x_{${j + 1}}`);
  for (let j = 0; j < p.nOrig; j++) {
    const rawC = p.objOrig[j];
    const c = p.type === 'max' ? -rawC : rawC;
    if (j === 0) {
      if (c === 1) objStr += `${varNames[j]}`;
      else if (c === -1) objStr += `-${varNames[j]}`;
      else objStr += `${c}${varNames[j]}`;
    } else {
      if (c === 0) continue;
      if (c === 1) objStr += ` + ${varNames[j]}`;
      else if (c === -1) objStr += ` - ${varNames[j]}`;
      else if (c > 0) objStr += ` + ${c}${varNames[j]}`;
      else objStr += ` - ${Math.abs(c)}${varNames[j]}`;
    }
  }
  return objStr;
}

function renderStep3AljabarPart1() {
  setStep(3);
  const p = prob;
  const tab = p.tabEliminated;
  const numCols = tab.rows[0].length;
  const nTotal = numCols - 2;
  const m = p.m;

  const defaultBasisSet = new Set(p.initialBasis || tab.basis);

  const html = `<div class="card" id="step3aAljabarCard">
    <div class="card-title">
      <span>📌 Pemilihan Variabel Basis Awal</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabar3a">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
    </div>
    
    <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
      <div style="overflow-x:auto; margin-bottom:1rem;">
        <table id="tableBasisSelection" class="tableau" style="width:100%; border-collapse:collapse; font-size:0.92rem; text-align:center;">
          <thead>
            <tr>
              <th style="background:var(--bg-primary); width:90px;">Sistem</th>
              ${Array.from({length: nTotal}, (_, j) => `
                <th class="col-var-${j}" style="transition:background 0.2s;">
                  $${formatSubscriptVar(j)}$
                </th>
              `).join('')}
              <th style="border-left:2px solid var(--accent); background:var(--bg-primary); width:80px;">$b$</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({length: m}, (_, i) => `
              <tr>
                <td style="font-weight:bold; background:var(--bg-primary); font-size:0.85rem; color:var(--text-secondary);">Kendala ${i + 1}</td>
                ${Array.from({length: nTotal}, (_, j) => `
                  <td class="col-var-${j}" style="transition:background 0.2s;">
                    ${tab.rows[i + 1][j + 1].toString()}
                  </td>
                `).join('')}
                <td style="border-left:2px solid var(--accent); font-weight:bold; background:var(--bg-primary);">
                  ${tab.rows[i + 1][numCols - 1].toString()}
                </td>
              </tr>
            `).join('')}
            <tr style="background:rgba(124,58,237,0.04);">
              <td style="font-weight:bold; font-size:0.85rem; color:var(--accent);">Basis ($x_B$)</td>
              ${Array.from({length: nTotal}, (_, j) => `
                <td class="col-var-${j}" style="padding:0.55rem 0.25rem; transition:background 0.2s;">
                  <label style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; width:100%; user-select:none;">
                    <input type="checkbox" class="chk-basis-var" data-var="${j}" style="width:16px; height:16px; cursor:pointer;">
                  </label>
                </td>
              `).join('')}
              <td style="border-left:2px solid var(--accent); background:var(--bg-primary);"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="font-size:0.92rem; font-weight:bold; color:var(--accent); text-align:center; margin-top:0.75rem;">
        Fungsi Objektif: $${getObjectiveFunctionTex(p)}$
      </div>
    </div>

    <div id="feedbackAljabarBasis1" class="feedback"></div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheckAljabar3a">Verifikasi & Konfirmasi Basis →</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  const chks = container.querySelectorAll('.chk-basis-var');
  const cntText = $('cntBasisText');

  function updateColumnHighlights() {
    const selectedIndices = new Set();
    chks.forEach(chk => {
      const varIdx = parseInt(chk.dataset.var);
      const cells = container.querySelectorAll(`.col-var-${varIdx}`);
      if (chk.checked) {
        selectedIndices.add(varIdx);
        cells.forEach(cell => {
          cell.style.background = 'rgba(124,58,237,0.12)';
          cell.style.fontWeight = 'bold';
          cell.style.color = 'var(--accent)';
        });
      } else {
        cells.forEach(cell => {
          cell.style.background = 'transparent';
          cell.style.fontWeight = 'normal';
          cell.style.color = 'inherit';
        });
      }
    });
    if (cntText) cntText.textContent = selectedIndices.size;
  }

  chks.forEach(chk => {
    chk.onchange = updateColumnHighlights;
  });

  updateColumnHighlights();

  function processBasisSelection(selectedIndices) {
    const fb = $('feedbackAljabarBasis1');
    if (selectedIndices.length !== p.m) {
      if (fb) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Jumlah variabel basis harus tepat ${p.m} variabel. (Saat ini dipilih ${selectedIndices.length}).`;
      }
      return false;
    }

    const details = computeBasisDetails(p, selectedIndices);
    if (!details) {
      if (fb) {
        fb.className = 'feedback show error';
        fb.textContent = `❌ Variabel yang dipilih tidak membentuk basis (Matriks B singular / det(B) = 0). Pilih kombinasi kolom yang bebas linear!`;
      }
      return false;
    }

    reconstructTableauForBasis(p, selectedIndices, details);

    if (fb) {
      fb.className = 'feedback show success';
      fb.textContent = `✅ Basis valid! Melanjutkan ke input matriks B, B⁻¹, x_B, dan z_0...`;
    }
    disableContainer(container);
    setTimeout(() => renderStep3AljabarPart2(selectedIndices, details), 600);
    return true;
  }

  $('btnCheckAljabar3a').onclick = () => {
    const selected = Array.from(chks).filter(c => c.checked).map(c => parseInt(c.dataset.var));
    processBasisSelection(selected);
  };

  if ($('btnSkipAljabar3a')) {
    $('btnSkipAljabar3a').onclick = () => {
      const defaultBasis = Array.from(defaultBasisSet);
      chks.forEach(c => {
        c.checked = defaultBasisSet.has(parseInt(c.dataset.var));
      });
      updateColumnHighlights();
      processBasisSelection(defaultBasis);
    };
  }
}

function renderIterAljabarUpdateBasis() {
  setStep(3);
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const numCols = tab.rows[0].length;
  const nTotal = numCols - 2;
  const m = p.m;

  const basisDetails = computeBasisDetails(p, tab.basis);
  if (!basisDetails) return;

  const newBasisSet = new Set(tab.basis);

  const bGridHtml = renderBracketedMatrixInputs(m, m, `inpB_${currentIterIdx}`);
  const bInvGridHtml = renderBracketedMatrixInputs(m, m, `inpBInv_${currentIterIdx}`);
  const xbVecHtml = renderBracketedVectorInputs(m, `inpXb_${currentIterIdx}`);

  // Non-basic variables list for objective function equation
  const nonBasisList = [];
  for (let j = 0; j < nTotal; j++) {
    if (!newBasisSet.has(j)) {
      nonBasisList.push({ idx: j, col: j + 1, name: formatSubscriptVar(j) });
    }
  }

  let nonBasisInputsHtml = '';
  nonBasisList.forEach((c, k) => {
    nonBasisInputsHtml += `
      <span style="margin:0 0.15rem;">−</span>
      <input type="text" id="inpNewCoeff_${currentIterIdx}_${k}" placeholder="${c.name}" style="width:75px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
      <span style="color:var(--text-primary);">$${c.name}$</span>
    `;
  });

  const cardTitle = currentIterIdx === 0 
    ? `📌 Input Matriks $B$, $B^{-1}$, Solusi $x_B$ & Nilai $z_0$`
    : `📌 Iterasi Aljabar ${currentIterIdx + 1} • Perbarui Matriks $B$, $B^{-1}$, Solusi $x_B$ & Persamaan Fungsi Objektif $z$`;

  const html = `<div class="card" id="basisUpdateCard_${currentIterIdx}">
    <div class="card-title">
      <span>${cardTitle}</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarBasis_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(3)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.25rem; margin-bottom:1.25rem;">
        <div style="background:var(--bg-primary); padding:0.85rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); text-align:center;">
          <div style="font-weight:bold; font-size:1.05rem; color:var(--text-primary); margin-bottom:0.5rem;">
            Matriks $B$
          </div>
          ${bGridHtml}
        </div>

        <div style="background:var(--bg-primary); padding:0.85rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); text-align:center;">
          <div style="font-weight:bold; font-size:1.05rem; color:var(--text-primary); margin-bottom:0.5rem;">
            Matriks $B^{-1}$
          </div>
          ${bInvGridHtml}
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.25rem; margin-bottom:1.25rem;">
        <div style="background:var(--bg-primary); padding:0.85rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); text-align:center;">
          <div style="font-weight:bold; font-size:1.05rem; color:var(--text-primary); margin-bottom:0.5rem;">
            Variabel Basis $x_B$
          </div>
          <div style="display:inline-flex; align-items:center; justify-content:center; gap:0.4rem;">
            <span style="font-weight:bold; font-size:0.95rem; color:var(--text-primary);">$x_B =$</span>
            ${xbVecHtml}
          </div>
        </div>

        <div style="background:var(--bg-primary); padding:0.85rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); text-align:center;">
          <div style="font-weight:bold; font-size:1.05rem; color:var(--text-primary); margin-bottom:0.5rem;">
            Nilai $z_0$
          </div>
          <div style="display:flex; align-items:center; justify-content:center; gap:0.4rem; margin-top:0.75rem;">
            <span style="font-weight:bold; font-size:0.95rem; color:var(--text-primary);">$z_0 =$</span>
            <input type="text" id="inpZ0_${currentIterIdx}" style="width:90px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
          </div>
        </div>
      </div>

      <div style="background:var(--bg-primary); padding:0.85rem 1rem; border-radius:var(--radius); border:1px solid var(--border-color); text-align:center;">
        <div style="font-weight:bold; font-size:1.05rem; color:var(--text-primary); margin-bottom:0.5rem;">
          Persamaan Fungsi Objektif Baru ($z$)
        </div>
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:0.4rem; font-size:1.05rem; font-weight:bold; padding:0.4rem 0.5rem;">
          <span style="color:var(--text-primary);">$z =$</span>
          <input type="text" id="inpNewZ0_${currentIterIdx}" placeholder="z₀" style="width:80px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
          ${nonBasisInputsHtml}
        </div>
      </div>
    </div>

    <div id="feedbackAljabarBasis_${currentIterIdx}" class="feedback"></div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnCheckAljabarBasis_${currentIterIdx}">Verifikasi & Lanjut ke Pricing →</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  function checkBasisUpdateInputs() {
    const fb = $(`feedbackAljabarBasis_${currentIterIdx}`);
    let allOk = true;

    // Validate Matrix B
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        const inp = $(`inpB_${currentIterIdx}_${i}_${j}`);
        if (inp) {
          const val = parseFracWithM(inp.value);
          const exp = basisDetails.B[i][j];
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
    }

    // Validate Matrix B^-1
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        const inp = $(`inpBInv_${currentIterIdx}_${i}_${j}`);
        if (inp) {
          const val = parseFracWithM(inp.value);
          const exp = basisDetails.BInv[i][j];
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
    }

    // Validate Vector x_B
    for (let i = 0; i < m; i++) {
      const inp = $(`inpXb_${currentIterIdx}_${i}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = tab.rows[i + 1][numCols - 1];
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

    // Validate z0 box
    const inpZ0Box = $(`inpZ0_${currentIterIdx}`);
    if (inpZ0Box) {
      const val = parseFracWithM(inpZ0Box.value);
      const exp = tab.rows[0][numCols - 1];
      if (!val || !val.eq(exp)) {
        allOk = false;
        inpZ0Box.classList.add('wrong');
        inpZ0Box.classList.remove('correct');
      } else {
        inpZ0Box.classList.add('correct');
        inpZ0Box.classList.remove('wrong');
      }
    }

    // Validate z0 in objective equation
    const inpZ0Eq = $(`inpNewZ0_${currentIterIdx}`);
    if (inpZ0Eq) {
      const val = parseFracWithM(inpZ0Eq.value);
      const exp = tab.rows[0][numCols - 1];
      if (!val || !val.eq(exp)) {
        allOk = false;
        inpZ0Eq.classList.add('wrong');
        inpZ0Eq.classList.remove('correct');
      } else {
        inpZ0Eq.classList.add('correct');
        inpZ0Eq.classList.remove('wrong');
      }
    }

    // Validate non-basic variable coefficients in objective equation
    nonBasisList.forEach((c, k) => {
      const inp = $(`inpNewCoeff_${currentIterIdx}_${k}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = tab.rows[0][c.col];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    });

    if (allOk) {
      if (fb) {
        fb.className = 'feedback show success';
        fb.textContent = '✅ Benar! Seluruh nilai matriks B, B⁻¹, x_B, z_0, dan persamaan fungsi objektif z terverifikasi.';
      }
      disableContainer(container);
      setTimeout(renderIterAljabarPickEnter, 600);
    } else {
      if (fb) {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Beberapa nilai masih belum tepat. Silakan periksa kolom/baris yang ditandai merah.';
      }
    }
  }

  $(`btnCheckAljabarBasis_${currentIterIdx}`).onclick = checkBasisUpdateInputs;

  if ($(`btnSkipAljabarBasis_${currentIterIdx}`)) {
    $(`btnSkipAljabarBasis_${currentIterIdx}`).onclick = () => {
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
          const inpB = $(`inpB_${currentIterIdx}_${i}_${j}`);
          if (inpB) inpB.value = basisDetails.B[i][j].toString();
          const inpBInv = $(`inpBInv_${currentIterIdx}_${i}_${j}`);
          if (inpBInv) inpBInv.value = basisDetails.BInv[i][j].toString();
        }
      }

      for (let i = 0; i < m; i++) {
        const inpXb = $(`inpXb_${currentIterIdx}_${i}`);
        if (inpXb) inpXb.value = tab.rows[i + 1][numCols - 1].toString();
      }

      const inpZ0Box = $(`inpZ0_${currentIterIdx}`);
      if (inpZ0Box) inpZ0Box.value = tab.rows[0][numCols - 1].toString();

      const inpZ0Eq = $(`inpNewZ0_${currentIterIdx}`);
      if (inpZ0Eq) inpZ0Eq.value = tab.rows[0][numCols - 1].toString();

      nonBasisList.forEach((c, k) => {
        const inp = $(`inpNewCoeff_${currentIterIdx}_${k}`);
        if (inp) inp.value = tab.rows[0][c.col].toString();
      });

      checkBasisUpdateInputs();
    };
  }
}

function renderStep3AljabarPart2() {
  renderIterAljabarUpdateBasis();
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

function renderIterAljabarCheckOptimal() {
  setStep(4);
  renderIterAljabarPickEnter();
}

function renderIterAljabarPickEnter() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const row0 = tab.rows[0];
  const numCols = row0.length;
  const basisSet = new Set(tab.basis);
  const nTotal = numCols - 2;
  const m = p.m;

  const nonBasisCandidates = [];
  let existsPositiveZjMinusCj = false;

  for (let j = 1; j <= nTotal; j++) {
    const varIdx = j - 1;
    if (!basisSet.has(varIdx)) {
      const col = j;
      const expY = [];
      for (let i = 0; i < m; i++) {
        expY.push(tab.rows[i + 1][col]);
      }

      const expZjMinusCj = tab.rows[0][col];
      if (expZjMinusCj.isPos()) {
        existsPositiveZjMinusCj = true;
      }

      const c_j = p.tabRaw.rows[0][col].neg();
      const expZ = expZjMinusCj.add(c_j);

      nonBasisCandidates.push({
        col: j,
        varIdx,
        name: formatSubscriptVar(varIdx),
        expY,
        expZ,
        expZjMinusCj
      });
    }
  }

  const targetEnterCol = iter.enterCol !== undefined ? iter.enterCol : findEntering(tab);
  const targetLeaveRow = targetEnterCol > 0 ? findLeaving(tab, targetEnterCol) : -1;

  let pricingTableHtml = `
    <table class="tableau" style="width:100%; margin-bottom:1rem; font-size:0.88rem; text-align:center;">
      <thead>
        <tr>
          <th style="width:70px;">$x_j$</th>
          <th>$y_j$</th>
          <th style="width:90px;">$z_j$</th>
          <th style="width:100px;">$z_j - c_j$</th>
        </tr>
      </thead>
      <tbody>
  `;

  nonBasisCandidates.forEach(c => {
    pricingTableHtml += `
      <tr class="pricing-row" data-col="${c.col}" style="transition:all 0.2s;">
        <td style="font-weight:bold; vertical-align:middle;">$${c.name}$</td>
        <td style="vertical-align:middle;">
          ${renderBracketedVectorInputs(m, `inpY_${currentIterIdx}_${c.col}`)}
        </td>
        <td style="vertical-align:middle;">
          <input type="text" id="inpZ_${currentIterIdx}_${c.col}" style="width:70px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
        </td>
        <td style="vertical-align:middle;">
          <input type="text" id="inpZjMinusCj_${currentIterIdx}_${c.col}" style="width:80px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
        </td>
      </tr>
    `;
  });
  pricingTableHtml += `</tbody></table>`;

  const html = `<div class="card" id="iterAljabarEnterCard_${currentIterIdx}">
    <div class="card-title">
      <span>📌 Iterasi Aljabar ${currentIterIdx + 1} • Penentuan $y_j, z_j, z_j - c_j$</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarEnter_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="font-weight:bold; margin-bottom:0.6rem; font-size:0.95rem; color:var(--accent);">
      Hitung $y_j, z_j, z_j - c_j$ untuk Variabel Nonbasis:
    </div>
    ${pricingTableHtml}
    
    <div style="margin-bottom:1rem;">
      <button class="btn btn-primary" id="btnCheckPricing_${currentIterIdx}">Verifikasi $y_j, z_j, z_j - c_j$ →</button>
    </div>

    <div id="feedbackAljabarEnter_${currentIterIdx}" class="feedback"></div>

    <div id="secOptCheck_${currentIterIdx}" style="display:none; margin-top:1.25rem; border-top:1px dashed var(--border-color); padding-top:1rem;">
      <div style="font-weight:bold; margin-bottom:0.75rem; font-size:0.95rem; color:var(--accent);">
        Berdasarkan tabel di atas, apakah sistem ini sudah optimal / terhenti?
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:0.6rem; margin-bottom:0.8rem;">
        <button class="btn btn-outline-success" id="btnOptYa_${currentIterIdx}">✅ Ya, Optimal ($z_j - c_j \\le 0$)</button>
        <button class="btn btn-outline-warning" id="btnOptBelum_${currentIterIdx}">🔄 Belum Optimal (Ada $z_j - c_j > 0$)</button>
        <button class="btn btn-outline-secondary" id="btnOptInfeasible_${currentIterIdx}">❌ Tidak Feasible</button>
        <button class="btn btn-outline-danger" id="btnOptUnbounded_${currentIterIdx}">🚫 Solusi Unbounded</button>
      </div>
      <div id="feedbackOptCheck_${currentIterIdx}" class="feedback"></div>
      <div id="optSolutionContainer_${currentIterIdx}" style="display:none; margin-top:1rem;"></div>
    </div>
  </div>`;

  const container = appendBlock(html);

  function checkPricingInputs() {
    const fb = $(`feedbackAljabarEnter_${currentIterIdx}`);
    let allOk = true;

    nonBasisCandidates.forEach(c => {
      for (let i = 0; i < m; i++) {
        const inp = $(`inpY_${currentIterIdx}_${c.col}_${i}`);
        if (inp) {
          const val = parseFracWithM(inp.value);
          const exp = c.expY[i];
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

      const inpZ = $(`inpZ_${currentIterIdx}_${c.col}`);
      if (inpZ) {
        const val = parseFracWithM(inpZ.value);
        const exp = c.expZ;
        if (!val || !val.eq(exp)) {
          allOk = false;
          inpZ.classList.add('wrong');
          inpZ.classList.remove('correct');
        } else {
          inpZ.classList.add('correct');
          inpZ.classList.remove('wrong');
        }
      }

      const inpZjMinusCj = $(`inpZjMinusCj_${currentIterIdx}_${c.col}`);
      if (inpZjMinusCj) {
        const val = parseFracWithM(inpZjMinusCj.value);
        const exp = c.expZjMinusCj;
        if (!val || !val.eq(exp)) {
          allOk = false;
          inpZjMinusCj.classList.add('wrong');
          inpZjMinusCj.classList.remove('correct');
        } else {
          inpZjMinusCj.classList.add('correct');
          inpZjMinusCj.classList.remove('wrong');
        }
      }
    });

    if (allOk) {
      if (fb) {
        fb.className = 'feedback show success';
        fb.textContent = '✅ Benar! Nilai y_j, z_j, dan z_j - c_j terverifikasi. Tentukan status optimalitas di bawah.';
      }

      container.querySelectorAll('input').forEach(inp => inp.disabled = true);
      $(`btnCheckPricing_${currentIterIdx}`).style.display = 'none';
      $(`secOptCheck_${currentIterIdx}`).style.display = 'block';

      return true;
    } else {
      if (fb) {
        fb.className = 'feedback show error';
        fb.textContent = '❌ Beberapa nilai y_j, z_j, atau z_j - c_j masih belum tepat. Periksa kolom yang ditandai merah.';
      }
      return false;
    }
  }

  $(`btnCheckPricing_${currentIterIdx}`).onclick = checkPricingInputs;

  const fbOpt = $(`feedbackOptCheck_${currentIterIdx}`);

  $(`btnOptYa_${currentIterIdx}`).onclick = () => {
    if (iter.optimal || !existsPositiveZjMinusCj) {
      fbOpt.className = 'feedback show success';
      fbOpt.textContent = '✅ Benar! Seluruh z_j - c_j <= 0. Solusi optimal telah ditemukan.';
      disableContainer(container);
      setTimeout(renderStep5, 600);
    } else {
      fbOpt.className = 'feedback show error';
      fbOpt.textContent = '❌ Masalah ini belum optimal karena masih ada variabel nonbasis dengan nilai z_j - c_j > 0.';
    }
  };

  $(`btnOptBelum_${currentIterIdx}`).onclick = () => {
    if (existsPositiveZjMinusCj) {
      fbOpt.className = 'feedback show success';
      fbOpt.textContent = '✅ Benar! Masih ada z_j - c_j > 0. Silakan klik baris variabel nonbasis yang akan menjadi variabel masuk (Entering Variable).';

      $(`btnOptYa_${currentIterIdx}`).disabled = true;
      $(`btnOptBelum_${currentIterIdx}`).disabled = true;
      $(`btnOptInfeasible_${currentIterIdx}`).disabled = true;
      $(`btnOptUnbounded_${currentIterIdx}`).disabled = true;

      container.querySelectorAll('.pricing-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.style.outline = '2px dashed var(--accent)';
        row.style.outlineOffset = '-2px';
        row.style.background = 'rgba(124,58,237,0.04)';

        row.onmouseenter = () => { row.style.background = 'rgba(124,58,237,0.12)'; };
        row.onmouseleave = () => { row.style.background = 'rgba(124,58,237,0.04)'; };

        row.onclick = () => {
          const col = parseInt(row.dataset.col);
          if (col === targetEnterCol) {
            iter.enterCol = col;
            fbOpt.className = 'feedback show success';
            fbOpt.textContent = `✅ Benar! Variabel $${formatSubscriptVar(col - 1)}$ dipilih sebagai Variabel Masuk.`;

            container.querySelectorAll('.pricing-row').forEach(r => {
              r.style.cursor = 'default';
              r.style.outline = 'none';
              r.onmouseenter = null;
              r.onmouseleave = null;
            });

            row.style.background = 'rgba(124,58,237,0.08)';
            row.style.outline = '2px solid var(--accent)';
            const firstTd = row.querySelector('td');
            if (firstTd) {
              firstTd.style.background = 'var(--accent)';
              firstTd.style.color = '#ffffff';
              firstTd.style.borderRadius = 'var(--radius) 0 0 var(--radius)';
            }

            disableContainer(container);
            setTimeout(renderIterAljabarPickLeave, 600);
          } else {
            fbOpt.className = 'feedback show error';
            fbOpt.textContent = '❌ Pilih variabel nonbasis dengan nilai $z_j - c_j > 0$ positif terbesar.';
          }
        };
      });
    } else {
      fbOpt.className = 'feedback show error';
      fbOpt.textContent = '❌ Seluruh z_j - c_j <= 0, sehingga sistem ini sudah optimal!';
    }
  };

  $(`btnOptInfeasible_${currentIterIdx}`).onclick = () => {
    if (iter.infeasible) {
      fbOpt.className = 'feedback show success';
      fbOpt.textContent = '✅ Benar! Masalah bersifat Tidak Feasible.';
      disableContainer(container);
      setTimeout(renderInfeasibleConclusionCard, 800);
    } else {
      fbOpt.className = 'feedback show error';
      fbOpt.textContent = '❌ Masalah ini tidak Infeasible.';
    }
  };

  $(`btnOptUnbounded_${currentIterIdx}`).onclick = () => {
    if (iter.unbounded) {
      fbOpt.className = 'feedback show success';
      fbOpt.textContent = '✅ Benar! Masalah bersifat Unbounded.';
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    } else {
      fbOpt.className = 'feedback show error';
      fbOpt.textContent = '❌ Masalah ini tidak Unbounded.';
    }
  };

  if ($(`btnSkipAljabarEnter_${currentIterIdx}`)) {
    $(`btnSkipAljabarEnter_${currentIterIdx}`).onclick = () => {
      nonBasisCandidates.forEach(c => {
        for (let i = 0; i < m; i++) {
          const inp = $(`inpY_${currentIterIdx}_${c.col}_${i}`);
          if (inp) inp.value = c.expY[i].toString();
        }
        const inpZ = $(`inpZ_${currentIterIdx}_${c.col}`);
        if (inpZ) inpZ.value = c.expZ.toString();
        const inpZjMinusCj = $(`inpZjMinusCj_${currentIterIdx}_${c.col}`);
        if (inpZjMinusCj) inpZjMinusCj.value = c.expZjMinusCj.toString();
      });

      checkPricingInputs();

      if (!existsPositiveZjMinusCj || iter.optimal) {
        $(`btnOptYa_${currentIterIdx}`).click();
      } else if (iter.unbounded) {
        $(`btnOptUnbounded_${currentIterIdx}`).click();
      } else {
        $(`btnOptBelum_${currentIterIdx}`).click();
        const targetRow = container.querySelector(`.pricing-row[data-col="${targetEnterCol}"]`);
        if (targetRow) targetRow.click();
      }
    };
  }
}

function renderIterAljabarPickLeave() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const row0 = tab.rows[0];
  const numCols = row0.length;
  const m = p.m;
  const targetEnterCol = iter.enterCol;
  const targetLeaveRow = targetEnterCol > 0 ? findLeaving(tab, targetEnterCol) : -1;
  const isUnbounded = iter.unbounded || (targetEnterCol > 0 && targetLeaveRow === -1);
  const enterVarName = formatSubscriptVar(targetEnterCol - 1);

  const basisVarNames = [];
  for (let i = 0; i < m; i++) {
    basisVarNames.push(formatSubscriptVar(tab.basis[i]));
  }

  let minRatio = null;
  if (targetLeaveRow > 0) {
    const bVal = tab.rows[targetLeaveRow][numCols - 1];
    const yVal = tab.rows[targetLeaveRow][targetEnterCol];
    if (yVal.isPos()) {
      minRatio = bVal.div(yVal);
    }
  }

  let leaveButtonsHtml = '';
  for (let i = 1; i <= m; i++) {
    const bName = basisVarNames[i - 1];
    leaveButtonsHtml += `
      <button class="btn btn-outline-secondary btn-algebra-leave" data-row="${i}" style="font-weight:bold; padding:0.5rem 1.25rem; font-size:1rem; border-radius:var(--radius); transition:all 0.2s;">
        $${bName}$
      </button>
    `;
  }

  let unboundedBtnHtml = '';
  if (isUnbounded) {
    unboundedBtnHtml = `
      <div style="margin-top:0.75rem;">
        <button class="btn btn-outline-danger" id="btnUnboundedAljabar_${currentIterIdx}" style="font-weight:bold; padding:0.5rem 1rem;">
          🚫 Solusi Unbounded (Semua $y_{ik} \\le 0$)
        </button>
      </div>`;
  }

  const lhsVectorHtml = renderBracketedVectorLabels(basisVarNames);
  const rhsVec1Html = renderBracketedVectorInputs(m, `inpBBar_${currentIterIdx}`);
  const rhsVec2Html = renderBracketedVectorInputs(m, `inpYLeave_${currentIterIdx}`);

  const html = `<div class="card" id="ratioAljabarCard_${currentIterIdx}">
    <div class="card-title">
      <span>📌 Iterasi Aljabar ${currentIterIdx + 1} • Leaving Variable & Nilai Variabel Masuk</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarLeave_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="background:var(--card-bg); padding:1.25rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
      <div style="display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0.6rem; font-size:1.1rem; font-weight:bold; margin-bottom:1.5rem; color:var(--text-primary);">
        ${lhsVectorHtml}
        <span>=</span>
        ${rhsVec1Html}
        <span>−</span>
        ${rhsVec2Html}
        <span style="font-size:1.15rem; color:var(--text-primary); margin-right:0.3rem;">$${enterVarName}$</span>
        <span style="margin:0 0.4rem; color:var(--text-muted); font-size:1.2rem;">,</span>
        <div style="display:inline-flex; align-items:center; gap:0.4rem; margin-left:0.2rem;">
          <span style="font-weight:bold; font-size:1.05rem; color:var(--text-primary);">$${enterVarName} =$</span>
          <input type="text" id="inpRatioVal_${currentIterIdx}" placeholder="Nilai" style="width:85px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.95rem;">
        </div>
      </div>

      <div style="text-align:center;">
        <div style="font-weight:bold; font-size:0.92rem; color:var(--text-secondary); margin-bottom:0.6rem;">
          Pilih Variabel Keluar:
        </div>
        <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:0.75rem;">
          ${leaveButtonsHtml}
        </div>
        ${unboundedBtnHtml}
      </div>
    </div>

    <div id="feedbackAljabarLeave_${currentIterIdx}" class="feedback"></div>

    <div class="btn-row" style="margin-top:1rem;">
      <button class="btn btn-primary" id="btnCheckAljabarLeave_${currentIterIdx}">Verifikasi & Lanjut →</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  let selectedLeaveRow = -1;

  container.querySelectorAll('.btn-algebra-leave').forEach(btn => {
    btn.onclick = () => {
      selectedLeaveRow = parseInt(btn.dataset.row);
      container.querySelectorAll('.btn-algebra-leave').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-secondary');
        b.style.background = 'transparent';
        b.style.color = 'inherit';
      });
      btn.classList.remove('btn-outline-secondary');
      btn.classList.add('btn-primary');
      btn.style.background = 'var(--accent)';
      btn.style.color = '#ffffff';
      btn.style.borderColor = 'var(--accent)';
    };
  });

  function checkCardLeaveInputs() {
    const fb = $(`feedbackAljabarLeave_${currentIterIdx}`);
    let allOk = true;
    let wrongFields = [];

    // 1. Verify vector b_bar
    for (let i = 0; i < m; i++) {
      const inp = $(`inpBBar_${currentIterIdx}_${i}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = tab.rows[i + 1][numCols - 1];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
          wrongFields.push('Vektor Ruas Kanan (b̄)');
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }

    // 2. Verify vector y_k
    for (let i = 0; i < m; i++) {
      const inp = $(`inpYLeave_${currentIterIdx}_${i}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = tab.rows[i + 1][targetEnterCol];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
          wrongFields.push(`Vektor y_${targetEnterCol}`);
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }

    // 3. Verify min ratio value x_k
    const inpRatioVal = $(`inpRatioVal_${currentIterIdx}`);
    if (inpRatioVal) {
      const val = parseFracWithM(inpRatioVal.value);
      if (!val || !minRatio || !val.eq(minRatio)) {
        allOk = false;
        inpRatioVal.classList.add('wrong');
        inpRatioVal.classList.remove('correct');
        wrongFields.push(`Nilai Rasio Minimum ${enterVarName}`);
      } else {
        inpRatioVal.classList.add('correct');
        inpRatioVal.classList.remove('wrong');
      }
    }

    // 4. Verify Leaving Variable selection
    if (isUnbounded) {
      allOk = false;
      wrongFields.push('Masalah bersifat Unbounded');
    } else if (selectedLeaveRow !== targetLeaveRow) {
      allOk = false;
      wrongFields.push('Pilihan Variabel Keluar Basis');
    }

    if (allOk) {
      iter.leaveRow = targetLeaveRow;
      fb.className = 'feedback show success';
      fb.textContent = `✅ Benar! Seluruh nilai vektor b̄, y_${targetEnterCol}, rasio minimum ${enterVarName}, dan variabel keluar (${basisVarNames[targetLeaveRow - 1]}) terverifikasi.`;

      disableContainer(container);
      currentIterIdx++;
      setTimeout(renderIterAljabarUpdateBasis, 600);
      return true;
    } else {
      fb.className = 'feedback show error';
      const uniqueWrong = Array.from(new Set(wrongFields)).join(', ');
      if (isUnbounded) {
        fb.textContent = '❌ Seluruh komponen y_k <= 0. Klik tombol "Solusi Unbounded".';
      } else if (selectedLeaveRow === -1) {
        fb.textContent = `❌ Silakan pilih Variabel Keluar Basis dan periksa bidang input yang salah (${uniqueWrong}).`;
      } else {
        fb.textContent = `❌ Ada nilai yang belum tepat pada: ${uniqueWrong}. Silakan periksa kembali!`;
      }
      return false;
    }
  }

  $(`btnCheckAljabarLeave_${currentIterIdx}`).onclick = checkCardLeaveInputs;

  if ($(`btnSkipAljabarLeave_${currentIterIdx}`)) {
    $(`btnSkipAljabarLeave_${currentIterIdx}`).onclick = () => {
      // Auto-fill b_bar vector
      for (let i = 0; i < m; i++) {
        const inp = $(`inpBBar_${currentIterIdx}_${i}`);
        if (inp) inp.value = tab.rows[i + 1][numCols - 1].toString();
      }

      // Auto-fill y_k vector
      for (let i = 0; i < m; i++) {
        const inp = $(`inpYLeave_${currentIterIdx}_${i}`);
        if (inp) inp.value = tab.rows[i + 1][targetEnterCol].toString();
      }

      // Auto-fill ratio value
      if (minRatio && $(`inpRatioVal_${currentIterIdx}`)) {
        $(`inpRatioVal_${currentIterIdx}`).value = minRatio.toString();
      }

      // Auto-select leave row
      if (targetLeaveRow > 0) {
        const btn = container.querySelector(`button[data-row="${targetLeaveRow}"]`);
        if (btn) btn.click();
      }

      checkCardLeaveInputs();
    };
  }

  if (isUnbounded && $(`btnUnboundedAljabar_${currentIterIdx}`)) {
    $(`btnUnboundedAljabar_${currentIterIdx}`).onclick = () => {
      const fb = $(`feedbackAljabarLeave_${currentIterIdx}`);
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Seluruh komponen y_k = B⁻¹a_k <= 0. Masalah bersifat Unbounded.';
      disableContainer(container);
      setTimeout(renderUnboundedConclusionCard, 800);
    };
  }
}

function renderIterAljabarSubstitution() {
  const p = prob;
  const iter = p.iterations[currentIterIdx];
  const tab = iter.tab;
  const nextTab = doPivot(tab, iter.leaveRow, iter.enterCol);
  const numCols = nextTab.rows[0].length;
  const nTotal = numCols - 2;
  const m = p.m;

  const enterVarName = formatSubscriptVar(iter.enterCol - 1);
  const leaveVarName = formatSubscriptVar(tab.basis[iter.leaveRow - 1]);

  const newBasisSet = new Set(nextTab.basis);
  const basisVarNames = nextTab.basis.map(bIdx => formatSubscriptVar(bIdx));
  const newBasisNamesStr = basisVarNames.join(', ');

  // Inputs for new basis solutions
  let newBasisInputsHtml = '';
  for (let i = 0; i < m; i++) {
    const bName = basisVarNames[i];
    newBasisInputsHtml += `
      <div style="display:inline-flex; align-items:center; gap:0.4rem;">
        <span style="font-weight:bold; font-size:0.95rem;">$${bName} =$</span>
        <input type="text" id="inpNewBasis_${currentIterIdx}_${i}" placeholder="Solusi" style="width:80px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
      </div>
    `;
  }

  // Non-basic variables list
  const nonBasisList = [];
  for (let j = 0; j < nTotal; j++) {
    if (!newBasisSet.has(j)) {
      nonBasisList.push({ idx: j, col: j + 1, name: formatSubscriptVar(j) });
    }
  }

  // Inputs for objective function z = z0 - (z1-c1)x_N1 - (z2-c2)x_N2 ...
  let nonBasisInputsHtml = '';
  nonBasisList.forEach((c, k) => {
    nonBasisInputsHtml += `
      <span style="margin:0 0.15rem;">−</span>
      <input type="text" id="inpNewCoeff_${currentIterIdx}_${k}" placeholder="${c.name}" style="width:75px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
      <span style="color:var(--text-primary);">$${c.name}$</span>
    `;
  });

  const html = `<div class="card" id="stepSubAljabarCard_${currentIterIdx}">
    <div class="card-title">
      <span>📌 Perbarui Solusi Basis & Persamaan Fungsi Objektif</span>
      <div class="card-title-actions">
        <button class="btn-skip" id="btnSkipAljabarSub_${currentIterIdx}">⚡ Skip (Kerjakan)</button>
        <button class="btn btn-sm btn-outline-secondary btn-undo-step" onclick="undoPreviousStep()">↩️ Undo</button>
        <button class="btn-help" onclick="openHelpDrawer(4)">❓ Bagaimana caranya?</button>
      </div>
    </div>

    <div style="background:var(--card-bg); padding:1.1rem; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:1.25rem;">
      <h4 style="color:var(--text-primary); margin-bottom:0.75rem; font-size:0.95rem;">1. Solusi Basis Baru ($x_B$):</h4>
      <div style="display:flex; flex-wrap:wrap; gap:1.25rem; align-items:center; margin-bottom:1.25rem;">
        ${newBasisInputsHtml}
      </div>

      <h4 style="color:var(--text-primary); margin-bottom:0.75rem; font-size:0.95rem;">2. Persamaan Fungsi Objektif Baru ($z$):</h4>
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:0.4rem; font-size:1.05rem; font-weight:bold; padding:0.85rem 1rem; background:var(--bg-primary); border-radius:var(--radius); border:1px solid var(--border-color);">
        <span style="color:var(--text-primary);">$z =$</span>
        <input type="text" id="inpNewZ0_${currentIterIdx}" placeholder="z₀" style="width:80px; text-align:center; padding:0.35rem; border-radius:var(--radius); border:1px solid var(--border-color); font-family:inherit; font-size:0.9rem;">
        ${nonBasisInputsHtml}
      </div>
    </div>

    <div id="feedbackAljabarSub_${currentIterIdx}" class="feedback"></div>

    <div class="btn-row" style="margin-top:1rem;">
      <button class="btn btn-primary" id="btnCheckAljabarSub_${currentIterIdx}">Verifikasi & Lanjut ke Iterasi Berikutnya →</button>
    </div>
  </div>`;

  const container = appendBlock(html);

  function checkCardSubInputs() {
    const fb = $(`feedbackAljabarSub_${currentIterIdx}`);
    let allOk = true;
    let wrongFields = [];

    // 1. Verify new basis solution inputs
    for (let i = 0; i < m; i++) {
      const inp = $(`inpNewBasis_${currentIterIdx}_${i}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = nextTab.rows[i + 1][numCols - 1];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
          wrongFields.push(`Solusi Basis ${basisVarNames[i]}`);
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    }

    // 2. Verify new z0 constant
    const inpZ0 = $(`inpNewZ0_${currentIterIdx}`);
    if (inpZ0) {
      const val = parseFracWithM(inpZ0.value);
      const exp = nextTab.rows[0][numCols - 1];
      if (!val || !val.eq(exp)) {
        allOk = false;
        inpZ0.classList.add('wrong');
        inpZ0.classList.remove('correct');
        wrongFields.push('Nilai Konstanta z₀');
      } else {
        inpZ0.classList.add('correct');
        inpZ0.classList.remove('wrong');
      }
    }

    // 3. Verify non-basic variable coefficients (z_j - c_j)
    nonBasisList.forEach((c, k) => {
      const inp = $(`inpNewCoeff_${currentIterIdx}_${k}`);
      if (inp) {
        const val = parseFracWithM(inp.value);
        const exp = nextTab.rows[0][c.col];
        if (!val || !val.eq(exp)) {
          allOk = false;
          inp.classList.add('wrong');
          inp.classList.remove('correct');
          wrongFields.push(`Koefisien ${c.name}`);
        } else {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
        }
      }
    });

    if (allOk) {
      fb.className = 'feedback show success';
      fb.textContent = '✅ Benar! Seluruh solusi basis baru dan fungsi objektif z terverifikasi.';
      disableContainer(container);
      currentIterIdx++;
      setTimeout(renderIterCheckOptimal, 600);
      return true;
    } else {
      fb.className = 'feedback show error';
      const uniqueWrong = Array.from(new Set(wrongFields)).join(', ');
      fb.textContent = `❌ Nilai belum tepat pada: ${uniqueWrong}. Silakan periksa kembali!`;
      return false;
    }
  }

  $(`btnCheckAljabarSub_${currentIterIdx}`).onclick = checkCardSubInputs;

  if ($(`btnSkipAljabarSub_${currentIterIdx}`)) {
    $(`btnSkipAljabarSub_${currentIterIdx}`).onclick = () => {
      // Auto-fill basis solutions
      for (let i = 0; i < m; i++) {
        const inp = $(`inpNewBasis_${currentIterIdx}_${i}`);
        if (inp) inp.value = nextTab.rows[i + 1][numCols - 1].toString();
      }

      // Auto-fill z0
      const inpZ0 = $(`inpNewZ0_${currentIterIdx}`);
      if (inpZ0) inpZ0.value = nextTab.rows[0][numCols - 1].toString();

      // Auto-fill non-basic coefficients
      nonBasisList.forEach((c, k) => {
        const inp = $(`inpNewCoeff_${currentIterIdx}_${k}`);
        if (inp) inp.value = nextTab.rows[0][c.col].toString();
      });

      checkCardSubInputs();
    };
  }
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
