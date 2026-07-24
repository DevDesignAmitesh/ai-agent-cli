function findDuplicate(nums: number[]): number {
  const dup: Set<number> = new Set();

  for (let i = 0; i < nums.length; i++) {
    if (dup.has(nums[i]!)) {
        return nums[i]!
    } else {
        dup.add(nums[i]!)
    }
  } 
};