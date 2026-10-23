import type { Operation } from './rules';

export class HintProgress {
  stage = 0;
  next() { this.stage = Math.min(3, this.stage + 1); return this.stage; }
  first() { this.stage = Math.max(1, this.stage); return this.stage; }
}

type HintQuestion = { dividend: number; divisor: number; operation?: Operation; places?: unknown; remainder?: number };
/** Only unsolved expressions are shown here; the existing worked solution is reserved for step 3. */
export function earlyCalculationHint(q: HintQuestion, stage: number) {
  const op = q.operation ?? 'division', a = q.dividend, b = q.divisor;
  if (stage === 1) {
    const text = q.places
      ? op === 'addition' || op === 'subtraction' ? '소수점끼리 맞추고 같은 자리끼리 계산해 보세요.' : op === 'multiplication' ? '자연수처럼 곱한 뒤 소수점 아래 자리 수를 살펴보세요.' : '소수 나눗셈은 나누는 수를 자연수로 만들 때 두 수에 같은 수를 곱해 보세요.'
      : op === 'addition' ? '더할 수를 자리별로 나누고, 받아올림이 있는지 살펴보세요.' : op === 'subtraction' ? '뺄 수를 자리별로 나누고, 받아내림이 필요한지 살펴보세요.' : op === 'multiplication' ? '같은 수가 몇 묶음인지 살펴보고, 큰 수는 자리별로 나누어 보세요.' : '같은 크기로 묶어 보세요. 묶음의 수와 남은 물건을 따로 살펴보세요.';
    return `<p>${text}</p>`;
  }
  if (q.places) return `<p>${op === 'addition' || op === 'subtraction' ? '세로로 적고 소수점 위치를 맞춰요. 한 자리씩 계산하고, 아직 계산하지 않은 자리는 빈칸으로 남겨 보세요.' : op === 'multiplication' ? '각 수의 소수점 아래 자리 수를 먼저 적어 보세요. 곱한 결과에서 그만큼 자리를 세어 소수점을 놓아요.' : '두 수의 소수점을 같은 칸 수만큼 옮겨 새 식을 적어 보세요. 몫을 구한 뒤 곱셈으로 확인해요.'}</p>`;
  if (op === 'addition' || op === 'subtraction') {
    const place = b >= 1000 ? 1000 : b >= 100 ? 100 : b >= 10 ? 10 : 1;
    const part = Math.floor(b / place) * place;
    return b > part ? `<p>${b}를 ${part}와 나머지로 나누어요.</p><p>${a} ${op === 'addition' ? '+' : '−'} ${part} ${op === 'addition' ? '+' : '−'} □</p><p>빈칸에 남은 수를 넣고 차례로 계산해 보세요.</p>` : `<p>${a}에서 ${b}만큼 ${op === 'addition' ? '더하는' : '빼는'} 과정을 적어 보세요. ${op === 'addition' ? '받아올린' : '받아내린'} 수를 표시하며 한 자리씩 계산해요.</p>`;
  }
  if (op === 'multiplication') return `<p>${a} × ${b}를 작은 곱셈으로 나누어 적어 보세요.</p><p>(${a} × □) + (${a} × □)</p><p>두 빈칸의 합이 ${b}가 되도록 나누고, 각각 곱한 뒤 합쳐요.</p>`;
  return `<p>${b} × □ ${q.remainder ? '+ □ ' : ''}= ${a}</p><p>${q.remainder ? '첫 빈칸에는 묶음 수, 둘째에는 남은 수를 적어요. 남은 수는 묶음 크기보다 작아야 해요.' : '빈칸에 들어갈 묶음 수를 곱셈으로 찾아보세요.'}</p>`;
}
