
class Solution(object):
    def longestConsecutive(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        j = 0
        seen = {0:[]}
        num1 = sorted(list(set(nums)))
        for idx,num in enumerate(num1):
            if not seen[j]:
                seen[j].append(num)     
            
            if seen[j][len(seen[j])-1] - num == 1 or seen[j][len(seen[j])-1] - num == 0 :
                seen[j].append(num)
            else:
                j += 1
                seen[j] = [num] 

        return max(len(seen[i]) for i in seen)








if __name__ == "__main__":
    print(Solution().longestConsecutive([100,4,200,1,3,2]))
    print(Solution().longestConsecutive([0,3,7,2,5,8,4,6,0,1]))
    print(Solution().longestConsecutive([1,2,0,1]))
    print(Solution().longestConsecutive([]))
    #corner cases
    print(Solution().longestConsecutive([1,1,1,1,1]))
    print(Solution().longestConsecutive([1,2,3,4,5,6,7,8,9,10]))
    print(Solution().longestConsecutive([10,9,8,7,6,5,4,3,2,1]))
    print(Solution().longestConsecutive([1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8,-8,9,-9,10,-10]))
    #two or more sub sequences of diffrernt nums
    print(Solution().longestConsecutive([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10]))
    print(Solution().longestConsecutive([1,2,4,5,6,7]))