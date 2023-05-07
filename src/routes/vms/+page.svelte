<script>
  import { vms } from "$lib/problemTypes/virtualMemorySizes";
  import VirtualMemorySizes from "$lib/problemTypes/VirtualMemorySizes.svelte";

  let problem = vms.generate(vms.randomSeed());
  let showSolutions = false;

</script>

<VirtualMemorySizes {problem} showSolution={showSolutions} />
<button on:click={() => { showSolutions = !showSolutions; }}>toggle solutions</button>

<p>Refresh to get a different problem.</p>