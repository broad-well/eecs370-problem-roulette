import type { SvelteComponent } from "svelte";

export interface ProblemType<PS, P> {
    name: string;
    randomSeed(): PS;
    generate(seed: PS): P;
    render(target: Element, problem: P, showSolution: boolean): SvelteComponent;
}