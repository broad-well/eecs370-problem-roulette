export function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function randomSplit(sum: number, termCount: number, termMin = Math.floor(sum / termCount / 2), termMax = Math.ceil(sum / termCount * 1.5)): number[] {
    const terms: number[] = [];
    let remaining = sum;
    while (termCount > 1) {
        const nowMax = remaining - termMin * (termCount - 1) + 1
        const term = randomInt(termMin, Math.min(nowMax, termMax));
        terms.push(term);
        remaining -= term;
        --termCount;
    }
    terms.push(remaining);
    return terms;
}