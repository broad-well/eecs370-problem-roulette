import type { ProblemType } from "../problem";
import { randomInt, randomSplit } from "../util";
import VirtualMemorySizes from "./VirtualMemorySizes.svelte";

// Physical memory size
// Virtual address length
// Number of PT levels
// Size of PTs at each level
// Length of VPNs at each level
// Page size (AU)
// Control bit length
// Page table size (AU/pages)
// PPN length

// The minimum set of parameters that completely defines a VM system
// (we store lengths when we can because they are smaller)
export interface VMSProblemSeed {
  // Byte-addressable: addressUnit = 1
  addressUnit: number;
  virtualAddressLength: number;
  physicalAddressLength: number;
  // pageOffsetLength < physicalAddressLength
  // pageOffsetLength < virtualAddressLength
  pageOffsetLength: number;
  levelOffsetLengths: number[];
  controlBitCount: number;
}

export type VMSAttribute = Exclude<keyof VMSProblem, "hiddenEntries">;

export interface VMSProblem extends VMSProblemSeed {
  numPageTableLevels: number;
  virtualSpaceBytes: number;
  physicalMemoryBytes: number;
  ppnLength: number;
  pageBytes: number;
  pageTableBytes: number[];
  pageTableEntryCounts: number[];
  pageTableEntryBytes: number;
  pageTablePages: number[];
  maxPageTableCount: number;
  maxPageTableBytes: number;
  minPageTableCount: number;
  minPageTableBytes: number;
  hiddenEntries: VMSAttribute[];
}

// Each entry: set of related attributes, max number of attributes to exclude without underdefining the system
const keyRelations: [VMSAttribute[], number][] = [
  [["virtualAddressLength", "virtualSpaceBytes"], 1],
  [["physicalAddressLength", "physicalMemoryBytes"], 1],
  // We cannot exclude addressUnit.
  [["pageOffsetLength", "ppnLength", "physicalAddressLength"], 1],
  [["pageOffsetLength", "pageBytes"], 1],
  [["levelOffsetLengths", "pageTableEntryCounts"], 1],
  [["pageTableEntryCounts", "pageTableEntryBytes", "pageTableBytes"], 1],
  [["pageTablePages"], 1], // Due to ceil(), we can't specify the byte size with page count
  [["maxPageTableCount", "maxPageTableBytes", "minPageTableCount", "minPageTableBytes"], 4],
  [["pageTableEntryBytes"], 1] // ceil(), can't go the other way
];

function generateHiddenEntries(): VMSAttribute[] {
  const mustShow = new Set<VMSAttribute>();
  const mustHide = new Set<VMSAttribute>();
  for (const [attrSet, maxHidden] of keyRelations) {
    // 80% chance of hiding something
    if (Math.random() < 0.8) {
      const toShow = [...attrSet];
      for (let i = 0; i < maxHidden; ++i) {
        if (toShow.every(attr => mustShow.has(attr))) {
          // Every attribute has to be shown to fully define the system.
          break;
        }
        const indexToHide = randomInt(0, toShow.length);
        mustHide.add(toShow[indexToHide]);
        toShow.splice(indexToHide, 1);
      }
      for (const rem of toShow) {
        mustShow.add(rem);
      }
    }
  }
  return Array.from(mustHide);
}

function findMaxPageTableCounts(pteCounts: number[]): number[] {
  let product = 1;
  const counts = [1];
  for (let i = 0; i < pteCounts.length - 1; ++i) {
    product *= pteCounts[i];
    counts.push(product);
  }
  return counts;
}

export const vms: ProblemType<VMSProblemSeed, VMSProblem> = {
  name: "Hierarchical VM sizes",
  randomSeed() {
    const addressUnits = [1, 1, 1, 1, 1, 2, 4];
    const addressUnit = addressUnits[randomInt(0, addressUnits.length)];
    const physAddrLen = randomInt(16, 33);
    // Physical memory size is known.
    const virtAddrLen = randomInt(physAddrLen - 2, physAddrLen * 2);
    const poLen = randomInt(2, Math.round(physAddrLen / 2));
    // Page size is determined now.
    const numLevels = randomInt(1, 5);
    const levelVpnLen = randomSplit(virtAddrLen - poLen, numLevels);
    // #PTEs are now known.
    const numControlBits = randomInt(3, 9);
    // Page table sizes are now known.
    return {
      addressUnit,
      virtualAddressLength: virtAddrLen,
      physicalAddressLength: physAddrLen,
      pageOffsetLength: poLen,
      levelOffsetLengths: levelVpnLen,
      controlBitCount: numControlBits,
    };
  },
  generate(seed: VMSProblemSeed) {
    const ppnLength = seed.physicalAddressLength - seed.pageOffsetLength;
    const pageTableEntryBytes = Math.ceil(
      (seed.controlBitCount + ppnLength) / 8
    );
    const pageBytes = Math.pow(2, seed.pageOffsetLength) * seed.addressUnit;
    const pageTableBytes = seed.levelOffsetLengths.map(
      (offsetLength) => Math.ceil(Math.pow(2, offsetLength) * pageTableEntryBytes / pageBytes) * pageBytes
    );
    const pageTablePages = pageTableBytes.map((sizeBytes) =>
      Math.ceil(sizeBytes / pageBytes)
    );
    const pageTableEntryCounts = seed.levelOffsetLengths.map(length => Math.pow(2, length));
    const maxPageTableCounts = findMaxPageTableCounts(pageTableEntryCounts);
    
    return {
      ...seed,
      numPageTableLevels: seed.levelOffsetLengths.length,
      ppnLength,
      virtualSpaceBytes: Math.pow(2, seed.virtualAddressLength) * seed.addressUnit,
      physicalMemoryBytes: Math.pow(2, seed.physicalAddressLength) * seed.addressUnit,
      pageBytes,
      pageTableEntryCounts,
      pageTableEntryBytes,
      pageTableBytes,
      pageTablePages,
      minPageTableCount: 1,
      minPageTableBytes: pageTableBytes[0],
      maxPageTableCount: maxPageTableCounts.reduce((a, b) => a + b, 0),
      maxPageTableBytes: maxPageTableCounts.map((count, i) => pageTablePages[i] * pageBytes * count).reduce((a, b) => a + b, 0),
      hiddenEntries: generateHiddenEntries(),
    };
  },
  render(target, problem, showSolution) {
    return new VirtualMemorySizes({ target, props: { problem, showSolution } });
  },
};
