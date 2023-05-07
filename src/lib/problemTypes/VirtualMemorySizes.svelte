<script lang="ts">
  import { onMount } from "svelte";
  import type { VMSAttribute, VMSProblem } from "./virtualMemorySizes";
  export let problem: VMSProblem;
  export let showSolution: boolean = false;
  let generated = false;

  $: problemKeys = Object.keys(problem).filter(it => it !== "hiddenEntries").sort((a, b) => {
    const aScore = problem.hiddenEntries.includes(a as VMSAttribute) ? 1 : 0;
    const bScore = problem.hiddenEntries.includes(b as VMSAttribute) ? 1 : 0;
    return aScore === bScore ? Math.random() - 0.5 : aScore - bScore;
  }) as VMSAttribute[];

  function format(thing: number|string|number[]) {
    if (thing instanceof Array) {
      return '[ ' + thing.join(', ') + ' ]';
    }
    return thing;
  }

  const keyDescriptions: {[str: string]: string} = {
    addressUnit: "Bytes per addressable unit (1 means byte-addressable)",
    levelOffsetLengths: "Bits allocated to each page table level's offset (array)",
    controlBitCount: "Number of control bits per page table entry",
    ppnLength: "Length of a Physical Page Number in bits",
    pageTableEntryCounts: "Number of entries in each page table for each level (array)",
    pageTableEntryBytes: "Size per page table entry in bytes",
    virtualSpaceBytes: "Number of bytes virtually addressable",
    pageBytes: "Size per page in bytes",
    pageTableBytes: "Size per page table for each level in bytes (array)",
    pageTablePages: "Pages per page table for each level (array)",
    minPageTableCount: "Minimum possible number of page tables allocated",
    maxPageTableCount: "Maximum possible number of page tables allocated across all levels",
    minPageTableBytes: "Minimum possible number of bytes allocated for all page tables across all levels",
    maxPageTableBytes: "Maximum possible number of bytes allocated for all page tables across all levels"
  };

  onMount(() => generated = true);
</script>

<ul>
  <li><i>"Length" refers to the number of bits.</i></li>
  <li><i>Each page table entry (regardless of level) occupies a whole number of bytes. Ex: if a page table entry needs 14 bits of space, it occupies 2 bytes of space (the remaining 2 bits are alignment padding).</i></li>
  <li><i>Each page table (regardless of level) occupies a whole number of pages. Ex: if a page table needs 1.1 pages for its entries, it occupies 2 pages of space (the remaining 0.9 pages are alignment padding).</i></li>
</ul>

{#if generated}
<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Solution</th>
    </tr>
  </thead>
  <tbody>
    {#each problemKeys as key}
      <tr>
        <td>{(key in keyDescriptions) ? keyDescriptions[key] : key}</td>
        <td>
          {#if problem.hiddenEntries.includes(key)}
            <input name={key} />
          {:else}
            <code>{format(problem[key])}</code>
          {/if}
        </td>
        {#if showSolution && problem.hiddenEntries.includes(key)}
          <td><code>{format(problem[key])}</code></td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>
{/if}